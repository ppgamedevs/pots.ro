import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminAlerts, supportTickets, sellers, users } from "@/db/schema/core";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

type AlertAction = "resolve" | "acknowledge" | "assign" | "snooze" | "create_task";

interface ActionPayload {
  action: AlertAction;
  alertIds: string[];
  // For assign
  assignToUserId?: string;
  // For snooze
  snoozeUntil?: string; // ISO date string
  // For create_task
  taskTitle?: string;
  taskDescription?: string;
  taskPriority?: "low" | "normal" | "high" | "urgent";
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as ActionPayload;
    const { action, alertIds } = body;

    if (!action || !alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json({ error: "Missing action or alertIds" }, { status: 400 });
    }

    if (!["resolve", "acknowledge", "assign", "snooze", "create_task"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch alerts to validate they exist
    const alerts = await db
      .select()
      .from(adminAlerts)
      .where(inArray(adminAlerts.id, alertIds));

    if (alerts.length === 0) {
      return NextResponse.json({ error: "No alerts found" }, { status: 404 });
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    switch (action) {
      case "resolve": {
        await db
          .update(adminAlerts)
          .set({
            status: "resolved",
            resolvedAt: new Date(),
            resolvedByUserId: user.id,
            updatedAt: new Date(),
          })
          .where(inArray(adminAlerts.id, alertIds));

        for (const alert of alerts) {
          await writeAdminAudit({
            actorId: user.id,
            action: "alert_resolved",
            entityType: "admin_alert",
            entityId: alert.id,
            meta: { title: alert.title, source: alert.source },
          });
          results.push({ id: alert.id, success: true });
        }
        break;
      }

      case "acknowledge": {
        await db
          .update(adminAlerts)
          .set({
            status: "acknowledged",
            updatedAt: new Date(),
          })
          .where(
            and(
              inArray(adminAlerts.id, alertIds),
              eq(adminAlerts.status, "open")
            )
          );

        for (const alert of alerts) {
          if (alert.status === "open") {
            await writeAdminAudit({
              actorId: user.id,
              action: "alert_acknowledged",
              entityType: "admin_alert",
              entityId: alert.id,
              meta: { title: alert.title },
            });
            results.push({ id: alert.id, success: true });
          } else {
            results.push({ id: alert.id, success: false, error: "Alert not in open status" });
          }
        }
        break;
      }

      case "assign": {
        const { assignToUserId } = body;
        if (!assignToUserId) {
          return NextResponse.json({ error: "Missing assignToUserId" }, { status: 400 });
        }

        // Verify user exists and is admin/support
        const [assignee] = await db
          .select({ id: users.id, name: users.name, role: users.role })
          .from(users)
          .where(eq(users.id, assignToUserId));

        if (!assignee || (assignee.role !== "admin" && assignee.role !== "support")) {
          return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
        }

        await db
          .update(adminAlerts)
          .set({
            assignedToUserId: assignToUserId,
            updatedAt: new Date(),
          })
          .where(inArray(adminAlerts.id, alertIds));

        for (const alert of alerts) {
          await writeAdminAudit({
            actorId: user.id,
            action: "alert_assigned",
            entityType: "admin_alert",
            entityId: alert.id,
            meta: {
              title: alert.title,
              assignedToUserId: assignToUserId,
              assignedToName: assignee.name,
            },
          });
          results.push({ id: alert.id, success: true });
        }
        break;
      }

      case "snooze": {
        const { snoozeUntil } = body;
        if (!snoozeUntil) {
          return NextResponse.json({ error: "Missing snoozeUntil" }, { status: 400 });
        }

        const snoozeDate = new Date(snoozeUntil);
        if (Number.isNaN(snoozeDate.getTime()) || snoozeDate <= new Date()) {
          return NextResponse.json({ error: "Invalid snoozeUntil date (must be in future)" }, { status: 400 });
        }

        await db
          .update(adminAlerts)
          .set({
            status: "snoozed",
            snoozedUntil: snoozeDate,
            updatedAt: new Date(),
          })
          .where(inArray(adminAlerts.id, alertIds));

        for (const alert of alerts) {
          await writeAdminAudit({
            actorId: user.id,
            action: "alert_snoozed",
            entityType: "admin_alert",
            entityId: alert.id,
            meta: {
              title: alert.title,
              snoozedUntil: snoozeDate.toISOString(),
            },
          });
          results.push({ id: alert.id, success: true });
        }
        break;
      }

      case "create_task": {
        // Create support ticket linked to alert
        const { taskTitle, taskDescription, taskPriority = "normal" } = body;

        for (const alert of alerts) {
          try {
            // Find associated seller if entity is seller-related
            let sellerId: string | null = null;
            if (alert.entityType === "seller" && alert.entityId) {
              sellerId = alert.entityId;
            } else if (alert.entityType === "order" && alert.entityId) {
              // Get seller from order (simplified - would need join in real impl)
              // For now, skip seller association
            }

            // If no seller found, try to find platform seller
            if (!sellerId) {
              const [platformSeller] = await db
                .select({ id: sellers.id })
                .from(sellers)
                .where(eq(sellers.isPlatform, true))
                .limit(1);
              sellerId = platformSeller?.id ?? null;
            }

            if (!sellerId) {
              results.push({ id: alert.id, success: false, error: "No seller to associate task" });
              continue;
            }

            const title = taskTitle || `[Alert] ${alert.title}`;
            const description = taskDescription || 
              `Auto-created from alert.\n\nSource: ${alert.source}\nType: ${alert.type}\nEntity: ${alert.entityType}:${alert.entityId}\n\nDetails: ${JSON.stringify(alert.details, null, 2)}`;

            const [newTicket] = await db
              .insert(supportTickets)
              .values({
                sellerId,
                createdBy: user.id,
                assignedTo: alert.assignedToUserId ?? user.id,
                status: "open",
                priority: taskPriority,
                title,
                description,
              })
              .returning({ id: supportTickets.id });

            // Link ticket to alert
            await db
              .update(adminAlerts)
              .set({
                linkedTicketId: newTicket.id,
                updatedAt: new Date(),
              })
              .where(eq(adminAlerts.id, alert.id));

            await writeAdminAudit({
              actorId: user.id,
              action: "alert_task_created",
              entityType: "admin_alert",
              entityId: alert.id,
              meta: {
                alertTitle: alert.title,
                ticketId: newTicket.id,
                ticketTitle: title,
              },
            });

            results.push({ id: alert.id, success: true });
          } catch (err) {
            console.error(`Failed to create task for alert ${alert.id}:`, err);
            results.push({ id: alert.id, success: false, error: "Failed to create task" });
          }
        }
        break;
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      action,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    });
  } catch (error) {
    console.error("Error performing alert action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

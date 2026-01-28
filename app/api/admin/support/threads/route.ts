import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  supportThreads,
  supportThreadTags,
  users,
  sellers,
  orders,
} from "@/db/schema/core";
import {
  and,
  eq,
  gte,
  lte,
  desc,
  sql,
  inArray,
  or,
  isNull,
  ilike,
  asc,
} from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { writeAdminAudit } from "@/lib/admin/audit";
import { logThreadModeration } from "@/lib/support/moderation-history";

export const dynamic = "force-dynamic";

type ThreadStatus = "open" | "assigned" | "waiting" | "resolved" | "closed" | "active";
type ThreadSource = "buyer_seller" | "seller_support" | "chatbot" | "whatsapp";
type ThreadPriority = "low" | "normal" | "high" | "urgent";

interface ThreadFilters {
  status?: ThreadStatus[];
  source?: ThreadSource[];
  priority?: ThreadPriority[];
  closedResolvedByUserId?: string;
  assignedToUserId?: string;
  sellerId?: string;
  buyerId?: string;
  orderId?: string;
  tags?: string[];
  slaBreach?: boolean;
  search?: string;
  from?: Date;
  to?: Date;
}

function parseFilters(searchParams: URLSearchParams): ThreadFilters {
  const filters: ThreadFilters = {};

  const statusParam = searchParams.get("status");
  if (statusParam) {
    const statuses = statusParam.split(",").filter((s) =>
      ["open", "assigned", "waiting", "resolved", "closed", "active"].includes(s)
    ) as ThreadStatus[];
    if (statuses.length > 0) filters.status = statuses;
  }

  const sourceParam = searchParams.get("source");
  if (sourceParam) {
    const sources = sourceParam.split(",").filter((s) =>
      ["buyer_seller", "seller_support", "chatbot", "whatsapp"].includes(s)
    ) as ThreadSource[];
    if (sources.length > 0) filters.source = sources;
  }

  const priorityParam = searchParams.get("priority");
  if (priorityParam) {
    const priorities = priorityParam.split(",").filter((s) =>
      ["low", "normal", "high", "urgent"].includes(s)
    ) as ThreadPriority[];
    if (priorities.length > 0) filters.priority = priorities;
  }

  const assignedToUserId = searchParams.get("assignedToUserId");
  if (assignedToUserId?.trim()) filters.assignedToUserId = assignedToUserId.trim();

  const sellerId = searchParams.get("sellerId");
  if (sellerId?.trim()) filters.sellerId = sellerId.trim();

  const buyerId = searchParams.get("buyerId");
  if (buyerId?.trim()) filters.buyerId = buyerId.trim();

  const orderId = searchParams.get("orderId");
  if (orderId?.trim()) filters.orderId = orderId.trim();

  const tagsParam = searchParams.get("tags");
  if (tagsParam) {
    const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) filters.tags = tags;
  }

  const slaBreach = searchParams.get("slaBreach");
  if (slaBreach === "true") filters.slaBreach = true;
  if (slaBreach === "false") filters.slaBreach = false;

  const search = searchParams.get("search");
  if (search?.trim()) filters.search = search.trim();

  const closedResolvedByUserId = searchParams.get("closedResolvedByUserId");
  if (closedResolvedByUserId?.trim()) {
    filters.closedResolvedByUserId = closedResolvedByUserId.trim();
  }

  const from = searchParams.get("from");
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      filters.from = d;
    }
  }

  const to = searchParams.get("to");
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      filters.to = d;
    }
  }

  return filters;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = parseFilters(searchParams);

    if (searchParams.get("myQueue") === "true" || searchParams.get("assignedToUserId") === "me") {
      filters.assignedToUserId = user.id;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || "lastMessageAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const exportCsv = searchParams.get("export") === "csv";

    // Build conditions
    const conditions: any[] = [];

    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(supportThreads.status, filters.status));
    }
    // No status filter = "All" (frontend omits param when "All" is selected)

    if (filters.source && filters.source.length > 0) {
      conditions.push(inArray(supportThreads.source, filters.source));
    }

    if (filters.priority && filters.priority.length > 0) {
      conditions.push(inArray(supportThreads.priority, filters.priority));
    }

    if (filters.assignedToUserId) {
      if (filters.assignedToUserId === "unassigned") {
        conditions.push(isNull(supportThreads.assignedToUserId));
      } else {
        conditions.push(eq(supportThreads.assignedToUserId, filters.assignedToUserId));
      }
    }

    if (filters.sellerId) {
      conditions.push(eq(supportThreads.sellerId, filters.sellerId));
    }

    if (filters.buyerId) {
      conditions.push(eq(supportThreads.buyerId, filters.buyerId));
    }

    if (filters.orderId) {
      conditions.push(eq(supportThreads.orderId, filters.orderId));
    }

    if (filters.slaBreach !== undefined) {
      conditions.push(eq(supportThreads.slaBreach, filters.slaBreach));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(supportThreads.subject, `%${filters.search}%`),
          ilike(supportThreads.lastMessagePreview, `%${filters.search}%`)
        )
      );
    }

    if (filters.from) {
      conditions.push(gte(supportThreads.createdAt, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(supportThreads.createdAt, filters.to));
    }

    // Handle tags filter (threads that have any of the specified tags)
    if (filters.tags && filters.tags.length > 0) {
      const taggedThreads = await db
        .selectDistinct({ threadId: supportThreadTags.threadId })
        .from(supportThreadTags)
        .where(inArray(supportThreadTags.tag, filters.tags));
      const tagFilteredThreadIds = taggedThreads.map((t: { threadId: string }) => t.threadId);
      if (tagFilteredThreadIds.length === 0) {
        // No threads match tags
        return NextResponse.json({ data: [], total: 0, page, limit });
      }
      conditions.push(inArray(supportThreads.id, tagFilteredThreadIds));
    }

    if (filters.closedResolvedByUserId) {
      conditions.push(
        or(
          eq(supportThreads.closedByUserId, filters.closedResolvedByUserId),
          eq(supportThreads.resolvedByUserId, filters.closedResolvedByUserId)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportThreads)
      .where(whereClause);

    const total = countRow?.count ?? 0;

    // Build sort order
    const isOpenPlusWaiting =
      filters.status?.length === 2 &&
      filters.status.includes("open") &&
      filters.status.includes("waiting");

    const orderByClause = isOpenPlusWaiting
      ? sql`(CASE WHEN ${supportThreads.status} = 'waiting' THEN 0 ELSE 1 END) ASC, (CASE WHEN ${supportThreads.status} = 'waiting' THEN ${supportThreads.lastMessageAt} END) ASC NULLS LAST, (CASE WHEN ${supportThreads.status} = 'open' THEN ${supportThreads.lastMessageAt} END) DESC NULLS LAST`
      : (() => {
          const sortColumn =
            sortBy === "createdAt"
              ? supportThreads.createdAt
              : sortBy === "priority"
              ? supportThreads.priority
              : sortBy === "slaDeadline"
              ? supportThreads.slaDeadline
              : supportThreads.lastMessageAt;
          return sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);
        })();

    // Define thread select result type
    type ThreadRow = {
      id: string;
      source: string;
      sourceId: string;
      orderId: string | null;
      sellerId: string | null;
      buyerId: string | null;
      status: string;
      assignedToUserId: string | null;
      closedByUserId: string | null;
      resolvedByUserId: string | null;
      priority: string;
      subject: string | null;
      lastMessageAt: Date | null;
      lastMessagePreview: string | null;
      messageCount: number;
      slaDeadline: Date | null;
      slaBreach: boolean;
      createdAt: Date;
      updatedAt: Date;
      assignedToName: string | null;
      assignedToEmail: string | null;
    };

    // Get threads with related info
    const threads: ThreadRow[] = await db
      .select({
        id: supportThreads.id,
        source: supportThreads.source,
        sourceId: supportThreads.sourceId,
        orderId: supportThreads.orderId,
        sellerId: supportThreads.sellerId,
        buyerId: supportThreads.buyerId,
        status: supportThreads.status,
        assignedToUserId: supportThreads.assignedToUserId,
        closedByUserId: supportThreads.closedByUserId,
        resolvedByUserId: supportThreads.resolvedByUserId,
        priority: supportThreads.priority,
        subject: supportThreads.subject,
        lastMessageAt: supportThreads.lastMessageAt,
        lastMessagePreview: supportThreads.lastMessagePreview,
        messageCount: supportThreads.messageCount,
        slaDeadline: supportThreads.slaDeadline,
        slaBreach: supportThreads.slaBreach,
        createdAt: supportThreads.createdAt,
        updatedAt: supportThreads.updatedAt,
        // Joined data
        assignedToName: users.name,
        assignedToEmail: users.email,
      })
      .from(supportThreads)
      .leftJoin(users, eq(supportThreads.assignedToUserId, users.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(exportCsv ? 10000 : limit)
      .offset(exportCsv ? 0 : offset);

    // Get seller and buyer info separately for better performance
    const sellerIds = [...new Set(threads.map((t: ThreadRow) => t.sellerId).filter(Boolean))] as string[];
    const buyerIds = [...new Set(threads.map((t: ThreadRow) => t.buyerId).filter(Boolean))] as string[];
    const closedByUserIds = [...new Set(threads.map((t: ThreadRow) => t.closedByUserId).filter(Boolean))] as string[];
    const resolvedByUserIds = [...new Set(threads.map((t: ThreadRow) => t.resolvedByUserId).filter(Boolean))] as string[];

    const sellerMap = new Map<string, { brandName: string; slug: string }>();
    const buyerMap = new Map<string, { name: string | null; email: string; role: string }>();
    const closedByMap = new Map<string, { id: string; displayId: string | null; name: string | null; email: string; role: string | null }>();
    const resolvedByMap = new Map<string, { id: string; displayId: string | null; name: string | null; email: string; role: string | null }>();

    if (sellerIds.length > 0) {
      const sellerInfo = await db
        .select({ id: sellers.id, brandName: sellers.brandName, slug: sellers.slug })
        .from(sellers)
        .where(inArray(sellers.id, sellerIds));
      sellerInfo.forEach((s: { id: string; brandName: string; slug: string }) => sellerMap.set(s.id, { brandName: s.brandName, slug: s.slug }));
    }

    const roleLabels: Record<string, string> = {
      buyer: "Cumpărător",
      seller: "Vânzător",
      support: "Support",
      admin: "Admin",
    };
    if (buyerIds.length > 0) {
      const buyerInfo = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(inArray(users.id, buyerIds));
      buyerInfo.forEach((b: { id: string; name: string | null; email: string; role: string }) =>
        buyerMap.set(b.id, { name: b.name, email: b.email, role: b.role })
      );
    }

    if (closedByUserIds.length > 0) {
      const closedByInfo = await db
        .select({
          id: users.id,
          displayId: users.displayId,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(inArray(users.id, closedByUserIds));
      closedByInfo.forEach((u: { id: string; displayId: string | null; name: string | null; email: string; role: string | null }) =>
        closedByMap.set(u.id, {
          id: u.id,
          displayId: u.displayId ?? null,
          name: u.name ?? null,
          email: u.email,
          role: u.role,
        })
      );
    }

    if (resolvedByUserIds.length > 0) {
      const resolvedByInfo = await db
        .select({
          id: users.id,
          displayId: users.displayId,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(inArray(users.id, resolvedByUserIds));
      resolvedByInfo.forEach((u: { id: string; displayId: string | null; name: string | null; email: string; role: string | null }) =>
        resolvedByMap.set(u.id, {
          id: u.id,
          displayId: u.displayId ?? null,
          name: u.name ?? null,
          email: u.email,
          role: u.role,
        })
      );
    }

    // Get tags for all threads
    const threadIds = threads.map((t: ThreadRow) => t.id);
    const tagsMap = new Map<string, string[]>();

    if (threadIds.length > 0) {
      const threadTags = await db
        .select({ threadId: supportThreadTags.threadId, tag: supportThreadTags.tag })
        .from(supportThreadTags)
        .where(inArray(supportThreadTags.threadId, threadIds));
      threadTags.forEach((tt: { threadId: string; tag: string }) => {
        const existing = tagsMap.get(tt.threadId) || [];
        existing.push(tt.tag);
        tagsMap.set(tt.threadId, existing);
      });
    }

    // Enrich threads with additional info
    type EnrichedThread = ThreadRow & {
      seller: { brandName: string; slug: string } | null | undefined;
      buyer: { name: string | null; email: string; role?: string } | null | undefined;
      tags: string[];
      displaySubject?: string | null;
      closedBy?: { id: string; displayId: string | null; name: string | null; email: string; role: string | null } | null;
      resolvedBy?: { id: string; displayId: string | null; name: string | null; email: string; role: string | null } | null;
    };

    const data: EnrichedThread[] = threads.map((thread: ThreadRow) => {
      const buyer = thread.buyerId ? buyerMap.get(thread.buyerId) : null;
      let displaySubject: string | null = null;
      if (thread.source === "chatbot" || thread.source === "whatsapp") {
        if (thread.buyerId && buyer) {
          const label = buyer.role && roleLabels[buyer.role]
            ? roleLabels[buyer.role]
            : (buyer.email || buyer.name || "—");
          displaySubject = `Webchat: ${label}`;
        } else {
          displaySubject = thread.subject?.startsWith("Webchat:") ? thread.subject : "Webchat: Vizitator";
        }
      }
      return {
        ...thread,
        seller: thread.sellerId ? sellerMap.get(thread.sellerId) : null,
        buyer: thread.buyerId ? buyerMap.get(thread.buyerId) : null,
        tags: tagsMap.get(thread.id) || [],
        closedBy: thread.closedByUserId ? closedByMap.get(thread.closedByUserId) ?? null : null,
        resolvedBy: thread.resolvedByUserId ? resolvedByMap.get(thread.resolvedByUserId) ?? null : null,
        ...(displaySubject != null ? { displaySubject } : {}),
      };
    });

    // Export as CSV if requested (admin only)
    if (exportCsv) {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Export requires admin role" }, { status: 403 });
      }

      // Audit the export
      await writeAdminAudit({
        actorId: user.id,
        actorRole: user.role,
        action: "support.threads.export",
        entityType: "support_threads",
        entityId: "bulk",
        message: `Exported ${data.length} support threads`,
        meta: { filters, count: data.length },
      });

      const csvRows = [
        [
          "ID",
          "Source",
          "Status",
          "Priority",
          "Subject",
          "Seller",
          "Buyer",
          "Assigned To",
          "Message Count",
          "SLA Breach",
          "Last Message",
          "Created",
        ].join(","),
        ...data.map((t) =>
          [
            t.id,
            t.source,
            t.status,
            t.priority,
            `"${((t.displaySubject ?? t.subject) || "").replace(/"/g, '""')}"`,
            `"${(t.seller?.brandName || "").replace(/"/g, '""')}"`,
            `"${(t.buyer?.email || "").replace(/"/g, '""')}"`,
            `"${(t.assignedToEmail || "Unassigned").replace(/"/g, '""')}"`,
            t.messageCount,
            t.slaBreach ? "Yes" : "No",
            t.lastMessageAt?.toISOString() || "",
            t.createdAt?.toISOString() || "",
          ].join(",")
        ),
      ];

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="support-threads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("[support/threads] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Assign thread, change status, add tags
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!["admin", "support"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { threadId, action, ...params } = body;

    if (!threadId) {
      return NextResponse.json({ error: "threadId required" }, { status: 400 });
    }

    // Fetch thread to verify it exists
    const [thread] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, threadId))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    switch (action) {
      case "assign": {
        const { assignToUserId } = params;
        await db
          .update(supportThreads)
          .set({
            assignedToUserId: assignToUserId || null,
            updatedAt: new Date(),
          })
          .where(eq(supportThreads.id, threadId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.thread.assign",
          entityType: "support_thread",
          entityId: threadId,
          message: assignToUserId
            ? `Assigned thread to user ${assignToUserId}`
            : "Unassigned thread",
          meta: { assignToUserId },
        });

        await logThreadModeration({
          actorId: user.id,
          actorName: user.name || user.email,
          actorRole: user.role as "admin" | "support",
          actionType: assignToUserId ? "thread.assign" : "thread.unassign",
          threadId,
          reason: null,
          note: assignToUserId ? `Assigned to ${assignToUserId}` : "Unassigned",
          metadata: { prevAssigneeId: thread.assignedToUserId, newAssigneeId: assignToUserId },
        });

        return NextResponse.json({ success: true, message: "Thread assigned" });
      }

      case "status": {
        const { status } = params;
        if (!["open", "assigned", "waiting", "resolved", "closed", "active"].includes(status)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await db
          .update(supportThreads)
          .set({ status, updatedAt: new Date() })
          .where(eq(supportThreads.id, threadId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.thread.status",
          entityType: "support_thread",
          entityId: threadId,
          message: `Changed thread status to ${status}`,
          meta: { prevStatus: thread.status, newStatus: status },
        });

        return NextResponse.json({ success: true, message: "Status updated" });
      }

      case "priority": {
        const { priority } = params;
        if (!["low", "normal", "high", "urgent"].includes(priority)) {
          return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
        }

        await db
          .update(supportThreads)
          .set({ priority, updatedAt: new Date() })
          .where(eq(supportThreads.id, threadId));

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.thread.priority",
          entityType: "support_thread",
          entityId: threadId,
          message: `Changed thread priority to ${priority}`,
          meta: { prevPriority: thread.priority, newPriority: priority },
        });

        await logThreadModeration({
          actorId: user.id,
          actorName: user.name || user.email,
          actorRole: user.role as "admin" | "support",
          actionType: "thread.priorityChange",
          threadId,
          reason: null,
          note: `Priority changed from ${thread.priority} to ${priority}`,
          metadata: { prevPriority: thread.priority, newPriority: priority },
        });

        return NextResponse.json({ success: true, message: "Priority updated" });
      }

      case "addTag": {
        const { tag } = params;
        if (!tag?.trim()) {
          return NextResponse.json({ error: "Tag required" }, { status: 400 });
        }

        // Insert tag (ignore if exists due to unique constraint)
        try {
          await db.insert(supportThreadTags).values({
            threadId,
            tag: tag.trim().toLowerCase(),
          });
        } catch (err: any) {
          if (!err.message?.includes("duplicate")) throw err;
        }

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.thread.addTag",
          entityType: "support_thread",
          entityId: threadId,
          message: `Added tag "${tag.trim()}"`,
          meta: { tag: tag.trim() },
        });

        return NextResponse.json({ success: true, message: "Tag added" });
      }

      case "removeTag": {
        const { tag } = params;
        if (!tag?.trim()) {
          return NextResponse.json({ error: "Tag required" }, { status: 400 });
        }

        await db
          .delete(supportThreadTags)
          .where(
            and(
              eq(supportThreadTags.threadId, threadId),
              eq(supportThreadTags.tag, tag.trim().toLowerCase())
            )
          );

        await writeAdminAudit({
          actorId: user.id,
          actorRole: user.role,
          action: "support.thread.removeTag",
          entityType: "support_thread",
          entityId: threadId,
          message: `Removed tag "${tag.trim()}"`,
          meta: { tag: tag.trim() },
        });

        return NextResponse.json({ success: true, message: "Tag removed" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[support/threads] POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  supportThreads,
  supportThreadTags,
  users,
  sellers,
  orders,
} from "@/db/schema/core";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

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
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ error: "q (search query) required" }, { status: 400 });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;
    const pattern = `%${q}%`;

    const statusParam = searchParams.get("status");
    const allowedStatuses = ["open", "assigned", "waiting", "resolved", "closed", "active"] as const;
    const statuses = statusParam
      ? (statusParam.split(",").map((s) => s.trim()).filter((s) => allowedStatuses.includes(s as typeof allowedStatuses[number])) as typeof allowedStatuses[number][])
      : [];

    const countResult = await db.execute(sql`
      SELECT COUNT(DISTINCT t.id)::int AS count
      FROM support_threads t
      LEFT JOIN users u ON u.id = t.buyer_id
      LEFT JOIN sellers s ON s.id = t.seller_id
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE (
        u.email ILIKE ${pattern}
        OR s.slug ILIKE ${pattern}
        OR o.order_number ILIKE ${pattern}
        OR t.subject ILIKE ${pattern}
        OR t.last_message_preview ILIKE ${pattern}
      )
    `);
    let total = Number((countResult as { rows?: { count?: number }[] })?.rows?.[0]?.count ?? 0);

    const idResult = await db.execute(sql`
      SELECT DISTINCT t.id
      FROM support_threads t
      LEFT JOIN users u ON u.id = t.buyer_id
      LEFT JOIN sellers s ON s.id = t.seller_id
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE (
        u.email ILIKE ${pattern}
        OR s.slug ILIKE ${pattern}
        OR o.order_number ILIKE ${pattern}
        OR t.subject ILIKE ${pattern}
        OR t.last_message_preview ILIKE ${pattern}
      )
      ORDER BY t.last_message_at DESC NULLS LAST
    `);
    let rows = (idResult as { rows?: { id: string }[] })?.rows ?? [];
    let threadIds = rows.map((r) => r.id);

    const isOpenPlusWaiting =
      statuses.length === 2 && statuses.includes("open") && statuses.includes("waiting");

    if (statuses.length > 0 && threadIds.length > 0) {
      const filtered = await db
        .select({ id: supportThreads.id })
        .from(supportThreads)
        .where(and(inArray(supportThreads.id, threadIds), inArray(supportThreads.status, statuses)));
      const filteredIds = new Set(filtered.map((r: { id: string }) => r.id));
      const orderMap = new Map(threadIds.map((id, i) => [id, i]));
      threadIds = threadIds.filter((id) => filteredIds.has(id)).sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
      total = threadIds.length;
      if (!isOpenPlusWaiting) {
        threadIds = threadIds.slice(offset, offset + limit);
      }
    } else if (statuses.length > 0) {
      threadIds = [];
      total = 0;
    } else {
      total = threadIds.length;
      threadIds = threadIds.slice(offset, offset + limit);
    }

    if (threadIds.length === 0) {
      return NextResponse.json({ data: [], total, page, limit });
    }

    type ThreadRow = {
      id: string;
      source: string;
      sourceId: string;
      orderId: string | null;
      sellerId: string | null;
      buyerId: string | null;
      status: string;
      assignedToUserId: string | null;
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

    const allThreads: ThreadRow[] = await db
      .select({
        id: supportThreads.id,
        source: supportThreads.source,
        sourceId: supportThreads.sourceId,
        orderId: supportThreads.orderId,
        sellerId: supportThreads.sellerId,
        buyerId: supportThreads.buyerId,
        status: supportThreads.status,
        assignedToUserId: supportThreads.assignedToUserId,
        priority: supportThreads.priority,
        subject: supportThreads.subject,
        lastMessageAt: supportThreads.lastMessageAt,
        lastMessagePreview: supportThreads.lastMessagePreview,
        messageCount: supportThreads.messageCount,
        slaDeadline: supportThreads.slaDeadline,
        slaBreach: supportThreads.slaBreach,
        createdAt: supportThreads.createdAt,
        updatedAt: supportThreads.updatedAt,
        assignedToName: users.name,
        assignedToEmail: users.email,
      })
      .from(supportThreads)
      .leftJoin(users, eq(supportThreads.assignedToUserId, users.id))
      .where(inArray(supportThreads.id, threadIds));

    let threads: ThreadRow[];
    if (isOpenPlusWaiting && allThreads.length > 0) {
      const waiting = allThreads.filter((t) => t.status === "waiting").sort((a, b) => {
        const aT = a.lastMessageAt?.getTime() ?? 0;
        const bT = b.lastMessageAt?.getTime() ?? 0;
        return aT - bT;
      });
      const open = allThreads.filter((t) => t.status === "open").sort((a, b) => {
        const aT = a.lastMessageAt?.getTime() ?? 0;
        const bT = b.lastMessageAt?.getTime() ?? 0;
        return bT - aT;
      });
      const sorted = [...waiting, ...open];
      threads = sorted.slice(offset, offset + limit);
    } else {
      threads = allThreads.sort((a, b) => {
        const aT = a.lastMessageAt?.getTime() ?? 0;
        const bT = b.lastMessageAt?.getTime() ?? 0;
        return bT - aT;
      });
    }

    const sellerIds = [...new Set(threads.map((t) => t.sellerId).filter(Boolean))] as string[];
    const buyerIds = [...new Set(threads.map((t) => t.buyerId).filter(Boolean))] as string[];

    const sellerMap = new Map<string, { brandName: string; slug: string }>();
    const buyerMap = new Map<string, { name: string | null; email: string; role: string }>();
    const roleLabels: Record<string, string> = {
      buyer: "Cumpărător",
      seller: "Vânzător",
      support: "Support",
      admin: "Admin",
    };

    if (sellerIds.length > 0) {
      const sellerInfo = await db
        .select({ id: sellers.id, brandName: sellers.brandName, slug: sellers.slug })
        .from(sellers)
        .where(inArray(sellers.id, sellerIds));
      sellerInfo.forEach((s: { id: string; brandName: string; slug: string }) => sellerMap.set(s.id, { brandName: s.brandName, slug: s.slug }));
    }

    if (buyerIds.length > 0) {
      const buyerInfo = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(inArray(users.id, buyerIds));
      buyerInfo.forEach((b: { id: string; name: string | null; email: string; role: string }) =>
        buyerMap.set(b.id, { name: b.name, email: b.email, role: b.role })
      );
    }

    const threadTags = await db
      .select({ threadId: supportThreadTags.threadId, tag: supportThreadTags.tag })
      .from(supportThreadTags)
      .where(inArray(supportThreadTags.threadId, threads.map((t) => t.id)));

    const tagsMap = new Map<string, string[]>();
    threadTags.forEach((tt: { threadId: string; tag: string }) => {
      const existing = tagsMap.get(tt.threadId) ?? [];
      existing.push(tt.tag);
      tagsMap.set(tt.threadId, existing);
    });

    const data = threads.map((thread) => {
      const buyer = thread.buyerId ? buyerMap.get(thread.buyerId) ?? null : null;
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
        seller: thread.sellerId ? sellerMap.get(thread.sellerId) ?? null : null,
        buyer: thread.buyerId ? buyerMap.get(thread.buyerId) ?? null : null,
        tags: tagsMap.get(thread.id) ?? [],
        ...(displaySubject != null ? { displaySubject } : {}),
      };
    });

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("[support/threads/search] GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

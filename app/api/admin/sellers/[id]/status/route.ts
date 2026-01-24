import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerActions, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getUserId } from '@/lib/auth-helpers';
import { resolveSellerId } from '@/lib/server/resolve-seller-id';
import { emailService } from '@/lib/email';
import { SITE_URL } from '@/lib/env';
import { SellerStatusUpdateEmail, getSellerStatusUpdateSubject } from '@/lib/email/templates/SellerStatusUpdate';
import { createAlert } from '@/lib/admin/alerts';

export const dynamic = 'force-dynamic';

const schema = z.object({
  action: z.enum(['suspend', 'reactivate']),
  message: z.string().min(10, 'Mesajul trebuie să aibă minimum 10 caractere'),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sellerId = await resolveSellerId(params.id);
    if (!sellerId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const data = schema.parse(body);

    const nextStatus = data.action === 'suspend' ? 'suspended' : 'active';

    const [updated] = await db
      .update(sellers)
      .set({ status: nextStatus as any, updatedAt: new Date() })
      .where(eq(sellers.id, sellerId))
      .returning({ id: sellers.id, status: sellers.status, slug: sellers.slug, brandName: sellers.brandName, email: sellers.email, userId: sellers.userId });

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Write audit trail (best-effort)
    try {
      await db.insert(sellerActions).values({
        sellerId,
        action: data.action,
        message: data.message,
        meta: { from: data.action === 'suspend' ? 'active' : 'suspended', to: nextStatus },
        adminUserId: userId,
      });
    } catch (err) {
      console.error('Could not write seller action audit:', err);
    }

    // Notify seller by email (best-effort)
    try {
      const [sellerUser] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, updated.userId))
        .limit(1);

      const toEmail = updated.email || sellerUser?.email;
      if (toEmail) {
        await emailService.sendEmail({
          to: toEmail,
          subject: getSellerStatusUpdateSubject(nextStatus as any),
          template: SellerStatusUpdateEmail({
            contactName: sellerUser?.name,
            companyName: updated.brandName,
            status: nextStatus as any,
            adminMessage: data.message,
            helpUrl: `${SITE_URL}/ajutor`,
          }),
        });
      }
    } catch (err) {
      console.error('Could not send seller status email:', err);
    }

    // Create alert for seller suspension (for visibility)
    if (nextStatus === 'suspended') {
      try {
        await createAlert({
          source: 'seller_suspended',
          type: 'manual_suspension',
          severity: 'medium',
          dedupeKey: `seller:suspended:${sellerId}`,
          entityType: 'seller',
          entityId: sellerId,
          title: `Seller suspendat: ${updated.brandName}`,
          details: {
            sellerId,
            brandName: updated.brandName,
            slug: updated.slug,
            reason: data.message,
            suspendedBy: userId,
          },
        });
      } catch (err) {
        console.error('Could not create suspension alert:', err);
      }
    }

    return NextResponse.json({
      ok: true,
      seller: {
        id: updated.id,
        slug: updated.slug,
        status: updated.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }

    console.error('Error updating seller status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

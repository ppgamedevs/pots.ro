import { db } from '@/db';
import { sellerApplications, sellerApplicationStatusEvents, sellers, users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { generateUniqueDisplayId } from '@/lib/utils/displayId';
import { emailService } from '@/lib/email';
import { SITE_URL } from '@/lib/env';
import { SellerApprovedEmail, getSellerApprovedSubject } from '@/lib/email/templates/SellerApproved';
import { SellerApplicationStatusUpdateEmail, getSellerApplicationStatusUpdateSubject } from '@/lib/email/templates/SellerApplicationStatusUpdate';
import React from 'react';

export type SellerApplicationStatus = 'received' | 'in_review' | 'need_info' | 'approved' | 'rejected';

type SellerApplicationRow = typeof sellerApplications.$inferSelect;

export type SellerApplicationUpdateResult =
  | { ok: true; app?: SellerApplicationRow }
  | { ok: false; status: number; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export async function updateSellerApplicationStatus(opts: {
  applicationId: string;
  status: SellerApplicationStatus;
  notes?: string;
  internalNotes?: string;
  actorId?: string | null;
}): Promise<SellerApplicationUpdateResult> {
  const { applicationId, status, notes, internalNotes, actorId } = opts;

  try {
    const result = await db.transaction(async (tx: unknown) => {
      const txDb = tx as typeof db;
      const [app] = await txDb
        .select()
        .from(sellerApplications)
        .where(eq(sellerApplications.id, applicationId))
        .limit(1);

      if (!app) {
        return { ok: false as const, status: 404 as const, error: 'Aplicația nu a fost găsită.' };
      }

      const fromStatus = app.status;

      if (status !== 'approved') {
        await txDb
          .update(sellerApplications)
          .set({ status, notes: notes || null, internalNotes: internalNotes || null })
          .where(eq(sellerApplications.id, applicationId));

        await txDb.insert(sellerApplicationStatusEvents).values({
          applicationId,
          actorId: actorId || null,
          fromStatus,
          toStatus: status,
          publicMessage: notes || null,
          internalMessage: internalNotes || null,
        });

        return { ok: true as const, app };
      }

      const normalizedEmail = app.email.trim().toLowerCase();

      const [existingUser] = await txDb
        .select({ id: users.id, role: users.role, email: users.email })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      let user = existingUser;

      if (!user) {
        const displayId = await generateUniqueDisplayId(txDb, users, normalizedEmail);
        const [created] = await txDb
          .insert(users)
          .values({
            email: normalizedEmail,
            name: app.contactName || app.company || null,
            displayId,
            role: 'seller',
          })
          .returning({ id: users.id, role: users.role, email: users.email });

        user = created;
      } else if (user.role !== 'admin') {
        await txDb.update(users).set({ role: 'seller' }).where(eq(users.id, user.id));
      }

      const existingSeller = await txDb
        .select({ id: sellers.id })
        .from(sellers)
        .where(eq(sellers.userId, user.id))
        .limit(1);

      if (existingSeller.length > 0) {
        return {
          ok: false as const,
          status: 409 as const,
          error: 'Cont de vânzător deja există pentru acest email. Dacă ai nevoie de ajutor, contactează suportul.',
        };
      }

      const brandName = app.company;
      const baseSlug = slugify(brandName) || `seller-${user.id.slice(0, 8)}`;
      const slugPrimary = baseSlug;
      const slugFallback = `${baseSlug}-${user.id.slice(0, 6)}`;

      try {
        await txDb.insert(sellers).values({
          userId: user.id,
          slug: slugPrimary,
          brandName,
          cui: app.cui || null,
          iban: app.iban || null,
          email: normalizedEmail,
          phone: app.phone || null,
          status: 'onboarding',
        });
      } catch {
        await txDb.insert(sellers).values({
          userId: user.id,
          slug: slugFallback,
          brandName,
          cui: app.cui || null,
          iban: app.iban || null,
          email: normalizedEmail,
          phone: app.phone || null,
          status: 'onboarding',
        });
      }

      await txDb
        .update(sellerApplications)
        .set({ status, notes: notes || null, internalNotes: internalNotes || null })
        .where(eq(sellerApplications.id, applicationId));

      await txDb.insert(sellerApplicationStatusEvents).values({
        applicationId,
        actorId: actorId || null,
        fromStatus,
        toStatus: status,
        publicMessage: notes || null,
        internalMessage: internalNotes || null,
      });

      return { ok: true as const, app };
    });

    if (!result.ok) return result;

    // Email notifications for workflow statuses.
    // `received` is already handled at application submission.
    if (status !== 'received') {
      const app = result.app;

      if (status === 'approved') {
        const onboardingUrl = `${SITE_URL}/autentificare?next=${encodeURIComponent('/seller/onboarding')}`;
        const dashboardUrl = `${SITE_URL}/autentificare?next=${encodeURIComponent('/seller/orders')}`;

        await emailService.sendEmail({
          to: app.email,
          subject: getSellerApprovedSubject(),
          template: React.createElement(SellerApprovedEmail, {
            contactName: app.contactName,
            companyName: app.company,
            onboardingUrl,
            dashboardUrl,
            adminMessage: notes || null,
          }),
        });
      } else {
        await emailService.sendEmail({
          to: app.email,
          subject: getSellerApplicationStatusUpdateSubject(status),
          template: React.createElement(SellerApplicationStatusUpdateEmail, {
            contactName: app.contactName,
            companyName: app.company,
            status,
            adminMessage: notes || null,
            helpUrl: `${SITE_URL}/ajutor`,
          }),
        });
      }
    }

    return { ok: true };
  } catch (error) {
    console.error('updateSellerApplicationStatus error:', error);
    return { ok: false, status: 500, error: 'Eroare internă. Încearcă din nou.' };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from '@/db';
import { gdprDsrRequests } from '@/db/schema/core';
import { getClientIP, getUserAgent, normalizeEmail } from '@/lib/auth/crypto';
import { hashEmailSha256, getEmailDomain } from '@/lib/compliance/gdpr';
import { createDsarVerifyToken } from '@/lib/compliance/dsar';
import { maskEmail } from '@/lib/security/pii';
import { emailService } from '@/lib/email';
import React from 'react';
import { getIntSetting } from '@/lib/settings/store';

const deleteRequestSchema = z.object({
  email: z.string().email('Email invalid'),
  confirm: z.preprocess(
    (v) => (v === true ? true : v === 'true' || v === 'on' || v === '1'),
    z.literal(true)
  ),
});

async function parseBody(req: NextRequest): Promise<unknown> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) return req.json();
  const formData = await req.formData();
  return Object.fromEntries(formData.entries());
}

export async function POST(request: NextRequest) {
  try {
    const validatedData = deleteRequestSchema.parse(await parseBody(request));

    const email = normalizeEmail(validatedData.email);
    const emailHash = hashEmailSha256(email);
    const emailDomain = getEmailDomain(email);
    const now = new Date();

    const deadlineDays = await getIntSetting('gdpr.dsar_deadline_days', 30);
    const verifyTtlMinutes = await getIntSetting('gdpr.dsar_verify_ttl_minutes', 24 * 60);

    const dueAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
    const verifyExpiresAt = new Date(now.getTime() + verifyTtlMinutes * 60 * 1000);

    const [row] = await db
      .insert(gdprDsrRequests)
      .values({
        type: 'delete',
        status: 'pending_verification',
        email,
        emailHash,
        emailDomain: emailDomain || null,
        emailMasked: maskEmail(email),
        requestedIp: getClientIP(request.headers),
        requestedUserAgent: getUserAgent(request.headers),
        verifyExpiresAt,
        dueAt,
      })
      .returning({ id: gdprDsrRequests.id });

    const requestId = row?.id;
    if (!requestId) throw new Error('Failed to create DSAR request');

    const token = await createDsarVerifyToken({
      requestId,
      emailHash,
      ttlSeconds: verifyTtlMinutes * 60,
    });

    const baseUrl = (process.env.APP_BASE_URL || new URL(request.url).origin).replace(/\/$/, '');
    const verifyUrl = `${baseUrl}/gdpr/verify?token=${encodeURIComponent(token)}`;

    const mail = await emailService.sendEmail({
      to: email,
      subject: 'Confirmare cerere ștergere GDPR (FloristMarket.ro)',
      template: React.createElement('div', { style: { fontFamily: 'Arial, sans-serif', lineHeight: 1.5 } }, [
        React.createElement('h2', { key: 't' }, 'Confirmare cerere ștergere GDPR'),
        React.createElement(
          'p',
          { key: 'p1' },
          'Ai solicitat ștergerea datelor asociate contului tău. Pentru a confirma că această adresă îți aparține, apasă pe linkul de mai jos:'
        ),
        React.createElement(
          'p',
          { key: 'p2' },
          React.createElement('a', { href: verifyUrl }, 'Confirmă cererea')
        ),
        React.createElement(
          'p',
          { key: 'p3', style: { color: '#555' } },
          `Linkul expiră în aproximativ ${verifyTtlMinutes} minute.`
        ),
      ]),
    });

    return NextResponse.json({
      success: true,
      message: 'Cererea a fost înregistrată. Verifică emailul pentru confirmare.',
      emailSent: mail.success,
    });
    
  } catch (error) {
    console.error("GDPR request error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Date invalide", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Eroare internă" },
      { status: 500 }
    );
  }
}

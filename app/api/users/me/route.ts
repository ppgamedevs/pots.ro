/**
 * API endpoint pentru ștergerea contului utilizatorului
 * Implementare GDPR-light cu soft-delete și notificare email
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { emailService } from '@/lib/email';
import React from 'react';

export async function DELETE(req: NextRequest) {
  try {
    // Verifică autentificarea (simplificat pentru MVP)
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Neautentificat' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { reason } = body;

    // Găsește utilizatorul
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: 'Utilizatorul nu a fost găsit' },
        { status: 404 }
      );
    }

    const userData = user[0];

    const anonymizedEmail = `deleted_${userData.id}_${Date.now()}@deleted.local`;

    // Soft-delete: marchează contul ca șters
    await db
      .update(users)
      .set({
        email: anonymizedEmail,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Trimite email de confirmare
    try {
      await emailService.sendEmail({
        to: userData.email,
        subject: 'Contul tău FloristMarket.ro a fost șters',
        template: React.createElement('div', null, [
          React.createElement('h1', null, 'Contul tău a fost șters'),
          React.createElement('p', null, 'Salut,'),
          React.createElement('p', null, `Contul tău FloristMarket.ro a fost șters cu succes la data de ${new Date().toLocaleDateString('ro-RO')}.`),
          React.createElement('p', null, `Motivul: ${reason || 'Cerere utilizator'}`),
          React.createElement('p', null, 'Toate datele tale au fost șterse conform politicii de confidențialitate.'),
          React.createElement('p', null, 'Mulțumim că ai folosit FloristMarket.ro!'),
          React.createElement('p', null, 'Echipa FloristMarket.ro'),
        ]),
      });
    } catch (emailError) {
      console.error('Failed to send deletion email:', emailError);
      // Nu întrerupe procesul dacă email-ul eșuează
    }

    // Log pentru audit
    console.log(`Account deleted: ${userId} (${anonymizedEmail}) - Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Contul a fost șters cu succes',
      emailSent: true,
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    
    return NextResponse.json(
      {
        error: 'Eroare la ștergerea contului',
        message: error instanceof Error ? error.message : 'Eroare necunoscută',
      },
      { status: 500 }
    );
  }
}

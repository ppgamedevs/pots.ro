/**
 * Sistem anti-bypass pentru detectarea și mascarea contactelor în Pots.ro
 * Previne încercările de a ocoli sistemul de mesagerie pentru contact direct
 */

import { db } from '@/db';
import { conversationFlags, conversations } from '@/db/schema/core';
import { eq, and, gte } from 'drizzle-orm';
import { emailService } from '@/lib/email';
import React from 'react';

export interface ContactDetectionResult {
  maskedText: string;
  hit: boolean;
  detectedContacts: Array<{
    type: 'email' | 'phone';
    original: string;
    masked: string;
  }>;
}

// Regex patterns pentru detectarea contactelor
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(\+?\d[\s\-()]?){7,}/g;

// Rate limiting storage (în producție ar trebui să folosești Redis sau KV store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Detectează și maschează contactele din text
 */
export function maskContacts(text: string): ContactDetectionResult {
  const detectedContacts: ContactDetectionResult['detectedContacts'] = [];
  let maskedText = text;

  // Detectează email-uri
  const emailMatches = text.match(EMAIL_REGEX) || [];
  for (const email of emailMatches) {
    const masked = '[email redactat]';
    maskedText = maskedText.replace(email, masked);
    detectedContacts.push({
      type: 'email',
      original: email,
      masked: masked
    });
  }

  // Detectează numere de telefon
  const phoneMatches = text.match(PHONE_REGEX) || [];
  for (const phone of phoneMatches) {
    const masked = '[telefon redactat]';
    maskedText = maskedText.replace(phone, masked);
    detectedContacts.push({
      type: 'phone',
      original: phone,
      masked: masked
    });
  }

  return {
    maskedText,
    hit: detectedContacts.length > 0,
    detectedContacts
  };
}

/**
 * Verifică rate limiting pentru o conversație
 */
export function checkRateLimit(conversationId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `conversation:${conversationId}`;
  const limit = 5; // max 5 mesaje în 30s
  const windowMs = 30 * 1000; // 30 secunde

  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  
  return { allowed: true, remaining: limit - current.count };
}

/**
 * Procesează un mesaj și verifică încercările de bypass
 */
export async function processMessageForBypass(
  conversationId: string,
  messageText: string,
  senderId: string
): Promise<{
  allowed: boolean;
  maskedText?: string;
  reason?: string;
  bypassSuspected?: boolean;
}> {
  console.log(`🔍 Verific mesajul pentru bypass în conversația ${conversationId}`);

  // Verifică rate limiting
  const rateLimit = checkRateLimit(conversationId);
  if (!rateLimit.allowed) {
    console.log(`⏰ Rate limit depășit pentru conversația ${conversationId}`);
    return {
      allowed: false,
      reason: `Prea multe mesaje. Încearcă din nou în ${Math.ceil((rateLimitStore.get(`conversation:${conversationId}`)?.resetTime || 0 - Date.now()) / 1000)} secunde.`
    };
  }

  // Detectează contactele
  const detection = maskContacts(messageText);
  
  if (!detection.hit) {
    // Nu s-au detectat contacte, mesajul este permis
    return {
      allowed: true
    };
  }

  console.log(`🚨 Detectate contacte în mesajul din conversația ${conversationId}:`, detection.detectedContacts);

  // Actualizează flag-ul de conversație
  await updateConversationFlag(conversationId, true);

  // Verifică dacă conversația este deja suspectă
  const flag = await db.query.conversationFlags.findFirst({
    where: eq(conversationFlags.conversationId, conversationId)
  });

  if (flag && flag.bypassSuspected) {
    console.log(`🚨 Conversația ${conversationId} este deja marcată ca suspectă`);
    return {
      allowed: false,
      maskedText: detection.maskedText,
      reason: 'Conversația a fost marcată ca suspectă pentru încercări de bypass. Contactează suportul pentru asistență.',
      bypassSuspected: true
    };
  }

  // Returnează textul mascat
  return {
    allowed: true,
    maskedText: detection.maskedText,
    reason: 'Contactele au fost mascate pentru protecția datelor personale.'
  };
}

/**
 * Actualizează flag-ul de conversație
 */
async function updateConversationFlag(conversationId: string, incrementAttempts: boolean = false): Promise<void> {
  try {
    const existingFlag = await db.query.conversationFlags.findFirst({
      where: eq(conversationFlags.conversationId, conversationId)
    });

    if (existingFlag) {
      // Actualizează flag-ul existent
      const newAttempts = incrementAttempts ? existingFlag.attempts24h + 1 : existingFlag.attempts24h;
      const bypassSuspected = newAttempts >= 3 || existingFlag.bypassSuspected;

      await db.update(conversationFlags)
        .set({
          attempts24h: newAttempts,
          bypassSuspected: bypassSuspected,
          updatedAt: new Date()
        })
        .where(eq(conversationFlags.conversationId, conversationId));

      // Dacă este prima dată când devine suspectă, trimite alertă
      if (bypassSuspected && !existingFlag.bypassSuspected) {
        await sendBypassAlert(conversationId, newAttempts);
      }
    } else {
      // Creează flag nou
      await db.insert(conversationFlags).values({
        conversationId: conversationId,
        attempts24h: incrementAttempts ? 1 : 0,
        bypassSuspected: false
      });
    }
  } catch (error) {
    console.error('Eroare la actualizarea flag-ului de conversație:', error);
  }
}

/**
 * Trimite alertă către admin când se detectează bypass
 */
async function sendBypassAlert(conversationId: string, attempts: number): Promise<void> {
  try {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@floristmarket.ro'];
    
    for (const email of adminEmails) {
      await emailService.sendEmail({
        to: email.trim(),
        subject: `🚨 Detectat bypass în conversația ${conversationId}`,
        template: React.createElement('div', {
          style: { fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }
        }, [
          React.createElement('h2', { key: 'title', style: { color: '#d32f2f' } }, 'Detectat bypass în conversație'),
          React.createElement('p', { key: 'conversation-id' }, `Conversație ID: ${conversationId}`),
          React.createElement('p', { key: 'attempts' }, `Încercări în 24h: ${attempts}`),
          React.createElement('p', { key: 'date' }, `Data: ${new Date().toLocaleString('ro-RO')}`),
          React.createElement('p', { key: 'description' }, 'Conversația a fost marcată ca suspectă pentru încercări de bypass.'),
          React.createElement('p', { key: 'action' }, 'Te rugăm să investighezi și să iau măsuri dacă este necesar.')
        ])
      });
    }

    console.log(`📧 Trimis alertă bypass pentru conversația ${conversationId}`);
  } catch (error) {
    console.error('Eroare la trimiterea alertă bypass:', error);
  }
}

/**
 * Resetează flag-ul de conversație (pentru admin)
 */
export async function resetConversationFlag(conversationId: string): Promise<void> {
  try {
    await db.update(conversationFlags)
      .set({
        bypassSuspected: false,
        attempts24h: 0,
        updatedAt: new Date()
      })
      .where(eq(conversationFlags.conversationId, conversationId));

    console.log(`🔄 Resetat flag-ul pentru conversația ${conversationId}`);
  } catch (error) {
    console.error('Eroare la resetarea flag-ului de conversație:', error);
  }
}

/**
 * Obține statistici despre bypass-uri
 */
export async function getBypassStats(): Promise<{
  totalSuspected: number;
  totalAttempts: number;
  recentFlags: Array<{
    conversationId: string;
    attempts24h: number;
    bypassSuspected: boolean;
    updatedAt: Date;
  }>;
}> {
  try {
    const flags = await db.query.conversationFlags.findMany({
      orderBy: [conversationFlags.updatedAt]
    });

    const totalSuspected = flags.filter(f => f.bypassSuspected).length;
    const totalAttempts = flags.reduce((sum, f) => sum + f.attempts24h, 0);

    return {
      totalSuspected,
      totalAttempts,
      recentFlags: flags.map(f => ({
        conversationId: f.conversationId,
        attempts24h: f.attempts24h,
        bypassSuspected: f.bypassSuspected,
        updatedAt: f.updatedAt
      }))
    };
  } catch (error) {
    console.error('Eroare la obținerea statisticilor bypass:', error);
    return {
      totalSuspected: 0,
      totalAttempts: 0,
      recentFlags: []
    };
  }
}

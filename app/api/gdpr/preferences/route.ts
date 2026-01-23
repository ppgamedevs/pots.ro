import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gdprConsentEvents, gdprPreferences } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getClientIP, getUserAgent } from '@/lib/auth/crypto';
import { hashEmailSha256, getEmailDomain } from '@/lib/compliance/gdpr';
import { maskEmail } from '@/lib/security/pii';
import { getSettingTyped } from '@/lib/settings/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gdpr/preferences
 * Fetch GDPR preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { preference: null },
        { status: 200 }
      );
    }

    try {
      const [preference] = await db
        .select()
        .from(gdprPreferences)
        .where(eq(gdprPreferences.email, user.email))
        .limit(1);

      return NextResponse.json({ 
        preference: preference || null 
      });
    } catch (dbError: any) {
      // If table doesn't exist or has wrong schema, return null
      if (dbError instanceof Error && (
        dbError.message.includes('does not exist') ||
        dbError.message.includes('column') ||
        dbError.message.includes('relation')
      )) {
        console.warn('[gdpr/preferences] Table or column does not exist, returning null:', dbError.message);
        return NextResponse.json({ 
          preference: null 
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error fetching GDPR preferences:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch GDPR preferences" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gdpr/preferences
 * Save GDPR preferences for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consentType } = body;

    // Validation
    if (!consentType || (consentType !== "necessary" && consentType !== "all")) {
      return NextResponse.json(
        { error: "Invalid consent type. Must be 'necessary' or 'all'" },
        { status: 400 }
      );
    }

    // Check if preference already exists
    const [existing] = await db
      .select()
      .from(gdprPreferences)
      .where(eq(gdprPreferences.email, user.email))
      .limit(1);

    let preference;
    if (existing) {
      // Update existing preference
      [preference] = await db
        .update(gdprPreferences)
        .set({
          consentType,
          updatedAt: new Date(),
        })
        .where(eq(gdprPreferences.email, user.email))
        .returning();
    } else {
      // Insert new preference
      [preference] = await db
        .insert(gdprPreferences)
        .values({
          email: user.email,
          consentType,
        })
        .returning();
    }

    // Best-effort append-only consent proof event (do not block preference write)
    try {
      const policyVersion = await getSettingTyped<string>('gdpr.consent_policy_version', '');
      const legalBasis = consentType === 'all' ? 'consent' : 'legitimate_interest';

      await db.insert(gdprConsentEvents).values({
        emailHash: hashEmailSha256(user.email),
        emailDomain: getEmailDomain(user.email) || null,
        emailMasked: maskEmail(user.email),
        consentType,
        legalBasis,
        source: 'user',
        actorId: (user as any)?.id ?? null,
        ip: getClientIP(request.headers),
        userAgent: getUserAgent(request.headers),
        policyVersion: policyVersion || null,
      });
    } catch (eventErr) {
      console.warn('[gdpr/preferences] Failed to write consent proof event:', eventErr);
    }

    return NextResponse.json({ preference });
  } catch (error: any) {
    console.error('Error saving GDPR preferences:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "Failed to save GDPR preferences",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

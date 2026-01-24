/**
 * Cron job pentru redeschiderea alertelor snoozed expirate
 * Rulează la fiecare 5 minute pentru a reaprinde alertele snoozed
 */

import { NextRequest, NextResponse } from 'next/server';
import { reopenExpiredSnoozedAlerts } from '@/lib/admin/alerts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verifică dacă este un cron job valid
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reopenedCount = await reopenExpiredSnoozedAlerts();

    if (reopenedCount > 0) {
      console.log(`🔔 Reopened ${reopenedCount} snoozed alerts`);
    }

    return NextResponse.json({
      ok: true,
      reopenedCount,
    });
  } catch (error) {
    console.error('❌ Alert reopen cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

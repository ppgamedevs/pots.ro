import { NextRequest, NextResponse } from 'next/server';
import { runBatchPayouts } from '@/lib/payouts/run';
import { logWebhook } from '@/lib/webhook-logging';

/**
 * POST /api/payouts/run-batch?date=YYYY-MM-DD
 * Procesează toate payout-urile PENDING pentru o dată specifică (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Parametrul date este obligatoriu (format: YYYY-MM-DD)'
      }, { status: 400 });
    }

    // Validează formatul datei
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        success: false,
        error: 'Formatul datei trebuie să fie YYYY-MM-DD'
      }, { status: 400 });
    }

    // TODO: Verifică autentificarea admin
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    // }

    console.log(`🔄 Procesez payout-uri batch pentru data ${date}`);

    // Log webhook incoming
    await logWebhook({
      source: 'payouts',
      ref: 'batch',
      payload: { date, action: 'run-batch' },
      result: 'ok'
    });

    const result = await runBatchPayouts(date);

    // Log webhook outgoing
    await logWebhook({
      source: 'payouts',
      ref: 'batch',
      payload: result,
      result: 'ok'
    });

    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      results: result.results
    });
  } catch (error) {
    console.error('Eroare la procesarea batch payout:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

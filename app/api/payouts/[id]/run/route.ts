import { NextRequest, NextResponse } from 'next/server';
import { runPayout } from '@/lib/payouts/run';
import { logWebhook } from '@/lib/webhook-logging';

/**
 * POST /api/payouts/[id]/run
 * Procesează un payout individual (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: payoutId } = await params;
    
    // TODO: Verifică autentificarea admin
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    // }

    console.log(`🔄 Procesez payout ${payoutId}`);

    // Log webhook incoming
    await logWebhook({
      source: 'payouts',
      ref: payoutId,
      payload: { payoutId, action: 'run' },
      result: 'ok'
    });

    const result = await runPayout(payoutId);

    // Log webhook outgoing
    await logWebhook({
      source: 'payouts',
      ref: payoutId,
      payload: result,
      result: result.success ? 'ok' : 'error'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        payoutId: result.payoutId,
        status: result.status,
        providerRef: result.providerRef,
        paidAt: result.paidAt
      });
    } else {
      return NextResponse.json({
        success: false,
        payoutId: result.payoutId,
        status: result.status,
        failureReason: result.failureReason
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Eroare la procesarea payout:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

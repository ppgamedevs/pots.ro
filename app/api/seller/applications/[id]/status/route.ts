import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/authz';
import { updateSellerApplicationStatus, type SellerApplicationStatus } from '@/lib/seller/seller-application-status';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole(req, ['admin']);
    const id = params.id;
    const { status, notes, internalNotes } = await req.json();

    const allowed: SellerApplicationStatus[] = ['received', 'in_review', 'need_info', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Status invalid' }, { status: 400 });
    }

    const result = await updateSellerApplicationStatus({
      applicationId: id,
      status: status as SellerApplicationStatus,
      notes: typeof notes === 'string' ? notes : undefined,
      internalNotes: typeof internalNotes === 'string' ? internalNotes : undefined,
      actorId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Update application status error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}



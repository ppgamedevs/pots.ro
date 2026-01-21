'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { updateSellerApplicationStatus, SellerApplicationStatus } from '@/lib/seller/seller-application-status';

export type SellerApplicationActionState =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function updateSellerApplicationStatusAction(
  _prev: SellerApplicationActionState | null,
  formData: FormData
): Promise<SellerApplicationActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { ok: false, error: 'Acces restricționat.' };
  }

  const applicationId = String(formData.get('appId') || '');
  const nextStatus = String(formData.get('next') || '') as SellerApplicationStatus;
  const notes = String(formData.get('notes') || '');
  const internalNotes = String(formData.get('internalNotes') || '');

  if (!applicationId) {
    return { ok: false, error: 'ID aplicație lipsă.' };
  }

  const allowed: SellerApplicationStatus[] = ['received', 'in_review', 'need_info', 'approved', 'rejected'];
  if (!allowed.includes(nextStatus)) {
    return { ok: false, error: 'Status invalid.' };
  }

  const result = await updateSellerApplicationStatus({
    applicationId,
    status: nextStatus,
    notes: notes || undefined,
    internalNotes: internalNotes || undefined,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, message: 'Actualizat cu succes.' };
}

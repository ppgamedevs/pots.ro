'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateSellerApplicationStatusAction, type SellerApplicationActionState } from './actions';

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <button
        name="next"
        value="in_review"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        În review
      </button>
      <button
        name="next"
        value="need_info"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
      >
        Cere informații
      </button>
      <button
        name="next"
        value="approved"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
      >
        Aprobă
      </button>
      <button
        name="next"
        value="rejected"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-60"
      >
        Respinge
      </button>
      {pending ? (
        <span className="text-sm text-slate-500 dark:text-slate-400 self-center">Se salvează…</span>
      ) : null}
    </div>
  );
}

export function SellerApplicationActions({
  appId,
  role,
  initialNotes,
  initialInternalNotes,
}: {
  appId: string;
  role: 'admin' | 'support' | 'seller' | 'buyer';
  initialNotes?: string | null;
  initialInternalNotes?: string | null;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState<SellerApplicationActionState | null, FormData>(
    updateSellerApplicationStatusAction,
    null
  );

  React.useEffect(() => {
    if (state && state.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="appId" value={appId} />

      {state && !state.ok ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {state.error}
        </div>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Note pentru aplicant (trimise pe email)</label>
        <textarea
          name="notes"
          defaultValue={initialNotes || ''}
          placeholder="Adaugă note sau instrucțiuni pentru aplicant…"
          className="w-full border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm bg-white dark:bg-slate-800/50 focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none min-h-[120px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Note interne (doar admin/suport)</label>
        <textarea
          name="internalNotes"
          defaultValue={initialInternalNotes || ''}
          placeholder="Notițe interne pentru echipă (nu se trimit aplicantului)…"
          className="w-full border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm bg-white dark:bg-slate-800/50 focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none min-h-[120px]"
          readOnly={role !== 'admin'}
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Acest câmp este doar pentru uz intern și nu apare în emailurile către aplicant.</p>
      </div>

      {role === 'admin' ? <SubmitButtons /> : null}
    </form>
  );
}

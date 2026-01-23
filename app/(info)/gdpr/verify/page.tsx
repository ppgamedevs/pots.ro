"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GdprVerifyPage() {
  const search = useSearchParams();
  const token = search.get('token') || '';

  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setState('error');
        setMessage('Lipsește token-ul de verificare.');
        return;
      }

      try {
        const res = await fetch(`/api/gdpr/verify?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.ok && data?.ok) {
          setState('ok');
          setMessage('Cererea ta a fost confirmată. O vom procesa cât mai curând.');
          return;
        }

        setState('error');
        setMessage(data?.error || 'Nu am putut confirma cererea.');
      } catch {
        if (cancelled) return;
        setState('error');
        setMessage('Eroare de rețea. Încearcă din nou.');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink">Confirmare cerere GDPR</h1>
      <p className="text-subink mt-2">
        {state === 'loading' ? 'Se verifică linkul…' : message}
      </p>

      {state === 'ok' && (
        <div className="mt-6 rounded-xl border border-line bg-white p-4">
          <p className="text-sm text-ink">
            Dacă ai nevoie de ajutor, scrie-ne la{' '}
            <a className="text-primary hover:underline" href="mailto:privacy@floristmarket.ro">
              privacy@floristmarket.ro
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}

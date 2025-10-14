import { requireAuth } from '@/lib/auth/session';

export default async function AccountSettingsPage() {
  await requireAuth();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Setări cont</h1>
      <p className="text-slate-600 dark:text-slate-300">În curând vei putea edita nume, email și preferințe.</p>
    </div>
  );
}



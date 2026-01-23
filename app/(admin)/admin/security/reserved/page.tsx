import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ReservedNamesClient from './client';

export const dynamic = 'force-dynamic';

export default async function ReservedNamesPage() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reserved Names</h1>
        <p className="text-sm text-muted-foreground">
          Manage reserved usernames and display names to prevent impersonation.
        </p>
      </div>

      <ReservedNamesClient />
    </div>
  );
}

import Link from 'next/link';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function AdminCompliancePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper
        title="Compliance"
        description="GDPR tooling: consent registry, DSAR queue, and retention purge controls."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/compliance/consents" className="block">
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle>Consent Registry</CardTitle>
                <CardDescription>Search, update, and export consent proof events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Append-only proof events + current preference updates.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/compliance/dsar" className="block">
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle>DSAR Requests</CardTitle>
                <CardDescription>Export/delete requests with verification + deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Review queue and fulfill requests (minimal export/delete).
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/compliance/retention" className="block">
            <Card className="hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle>Retention</CardTitle>
                <CardDescription>Preview and run settings-driven data purges</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Uses the same purge helper as the daily cron.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </AdminPageWrapper>
    </main>
  );
}

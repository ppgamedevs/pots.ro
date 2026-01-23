import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function AdminCommunicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Communication</h1>
        <p className="text-sm text-muted-foreground">
          Admin-governed broadcasts (approval + scheduling), deliverability signals, and suppression list management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/communication/broadcasts" className="block">
          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle>Broadcasts</CardTitle>
              <CardDescription>Create, approve, schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">System/announcement/marketing messages to segments.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/communication/deliverability" className="block">
          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle>Deliverability</CardTitle>
              <CardDescription>Bounces, complaints, rates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Aggregates Resend webhook events.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/communication/suppressions" className="block">
          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle>Suppressions</CardTitle>
              <CardDescription>Block sending to risky emails</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manual and auto suppressions (bounce/complaint).</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

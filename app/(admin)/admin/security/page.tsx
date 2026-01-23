import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-sm text-muted-foreground">
          Audit, abuse/rate limiting, fraud signals, and controlled PII access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/security/audit" className="block">
          <Card className="hover:shadow-sm transition-shadow h-full">
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Who did what, when (export + search)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View and export admin audit logs.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/security/abuse" className="block">
          <Card className="hover:shadow-sm transition-shadow h-full">
            <CardHeader>
              <CardTitle>Abuse / Rate Limiting</CardTitle>
              <CardDescription>Top abusive IPs/emails/domains</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Aggregates auth rate-limit events.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/security/reserved" className="block">
          <Card className="hover:shadow-sm transition-shadow h-full">
            <CardHeader>
              <CardTitle>Reserved Names</CardTitle>
              <CardDescription>Blocked usernames and display names</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage reserved names to prevent impersonation.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

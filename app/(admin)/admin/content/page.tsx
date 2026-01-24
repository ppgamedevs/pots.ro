import Link from 'next/link';

import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function AdminContentHomePage() {
  return (
    <AdminPageWrapper title="Content">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/content/blog" className="block">
          <Card className="hover:shadow-sm transition-shadow h-full">
            <CardHeader>
              <CardTitle>Blog</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Posts management: drafts/publish/schedule + versions.</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="opacity-70">
          <CardHeader>
            <CardTitle>Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Static pages (Termeni, Confidentialitate, etc.) — coming next.</p>
          </CardContent>
        </Card>

        <Card className="opacity-70">
          <CardHeader>
            <CardTitle>Help Center</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Articles, categories, tags, search analytics — coming next.</p>
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}

import React from "react";
import { db } from "@/db";
import { sellerApplications } from "@/db/schema/core";
import { eq } from "drizzle-orm";

async function fetchApps(status?: string) {
  try {
    if (status) {
      const items = await db
        .select()
        .from(sellerApplications)
        .where(eq(sellerApplications.status, status as any));
      return { items };
    } else {
      const items = await db.select().from(sellerApplications);
      return { items };
    }
  } catch (error) {
    console.error('Error fetching seller applications:', error);
    return { items: [] };
  }
}

export default async function AdminSellerApplicationsPage({ searchParams }: { searchParams: { status?: string } }) {
  const data = await fetchApps(searchParams?.status);
  const items = data.items || [];
  const statuses = ['received','in_review','need_info','approved','rejected'];
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Aplicații vânzători</h1>
      <div className="flex gap-2 mb-4 text-sm">
        {statuses.map(s => (
          <a key={s} href={`/admin/seller-applications?status=${s}`} className={`chip ${searchParams?.status===s? 'bg-primary text-white' : ''}`}>{s}</a>
        ))}
        <a href={`/admin/seller-applications`} className={`chip ${!searchParams?.status? 'bg-primary text-white' : ''}`}>toate</a>
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-bgsoft text-ink/70">
            <tr>
              <th className="text-left p-3">Company</th>
              <th className="text-left p-3">CUI</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Creat</th>
              <th className="text-left p-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.company}</td>
                <td className="p-3">{a.cui || '-'}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3"><span className="chip">{a.status}</span></td>
                <td className="p-3">{a.createdAt ? new Date(a.createdAt).toLocaleString('ro-RO') : '-'}</td>
                <td className="p-3"><a className="text-primary" href={`/admin/seller-applications/${a.id}`}>View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}



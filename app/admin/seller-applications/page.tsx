import React from "react";
import { db } from "@/db";
import { sellerApplications } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";

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
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <AdminPageWrapper 
          title="Aplicații Vânzători"
          description="Gestionează cererile de înregistrare ale vânzătorilor"
        >
          <div className="space-y-6">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-3">
              {statuses.map(s => (
                <a 
                  key={s} 
                  href={`/admin/seller-applications?status=${s}`} 
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    searchParams?.status === s 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {s}
                </a>
              ))}
              <a 
                href={`/admin/seller-applications`} 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !searchParams?.status
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                Toate
              </a>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Company</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">CUI</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Creat</th>
                      <th className="text-left p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {items.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-sm text-slate-900 dark:text-slate-100">{a.company}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{a.cui || '-'}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{a.email}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            a.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            a.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            a.status === 'in_review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{a.createdAt ? new Date(a.createdAt).toLocaleString('ro-RO') : '-'}</td>
                        <td className="p-4">
                          <a 
                            className="text-primary hover:text-primary/80 font-medium text-sm transition-colors" 
                            href={`/admin/seller-applications/${a.id}`}
                          >
                            Vezi
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AdminPageWrapper>
      </main>
      <Footer />
    </>
  );
}



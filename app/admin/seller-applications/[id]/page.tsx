import React from "react";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { db } from "@/db";
import { sellerApplications } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { SellerApplicationActions } from "./SellerApplicationActions";

function carrierLabel(value: string | null | undefined): string {
  const v = (value || '').toLowerCase().trim();
  if (!v || v === '-') return 'Cargus';
  if (v === 'cargus') return 'Cargus';
  if (v === 'dpd') return 'DPD';
  if (v === 'fan' || v === 'fancourier' || v === 'fan courier') return 'FAN Courier';
  return value || 'Cargus';
}

async function getApp(id: string) {
  const [app] = await db
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.id, id))
    .limit(1);

  return app || null;
}

export default async function AdminSellerApplicationDetail({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'support')) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <AdminPageWrapper title="Acces restricționat">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-8">
            <p className="text-slate-700 dark:text-slate-300">Nu ai permisiuni pentru a accesa această pagină.</p>
          </div>
        </AdminPageWrapper>
      </main>
    );
  }

  const app = await getApp(params.id);
  if (!app) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <AdminPageWrapper title="Aplicație negăsită">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">Nu a fost găsită aplicația.</p>
          </div>
        </AdminPageWrapper>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminPageWrapper 
        title={app.company}
        customBreadcrumbLabel="Detalii Aplicație"
        backButtonHref="/admin/seller-applications"
      >
        <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Informații Company</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Email</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.email}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Telefon</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">CUI</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.cui || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">IBAN</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100 font-mono">{app.iban || '-'}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Website</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.website || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Curier</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{carrierLabel(app.carrier)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Status</div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      app.status === 'in_review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Acțiuni</h2>
              <SellerApplicationActions
                appId={app.id}
                role={currentUser.role}
                initialNotes={app.notes}
                initialInternalNotes={app.internalNotes}
              />
            </div>
        </div>
      </AdminPageWrapper>
    </main>
  );
}



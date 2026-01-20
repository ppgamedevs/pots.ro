import React from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";

async function getApp(id: string) {
  const res = await fetch(`/api/seller/applications?status=`, { cache: 'no-store' });
  const data = await res.json();
  return (data.items || []).find((x: any) => x.id === id) || null;
}

async function setStatus(id: string, status: string, notes?: string) {
  'use server';
  await fetch(`/api/seller/applications/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) });
}

export default async function AdminSellerApplicationDetail({ params }: { params: { id: string } }) {
  const app = await getApp(params.id);
  if (!app) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <AdminPageWrapper title="Aplicație negăsită">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">Nu a fost găsită aplicația.</p>
            </div>
          </AdminPageWrapper>
        </main>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Navbar />
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
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.carrier || '-'}</div>
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
              <form action={async (formData: FormData) => {
                const next = String(formData.get('next'));
                const notes = String(formData.get('notes') || '');
                await fetch(`/api/seller/applications/${app.id}/status`, { method: 'POST', body: JSON.stringify({ status: next, notes }) });
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Note pentru applicant
                  </label>
                  <textarea 
                    name="notes" 
                    placeholder="Adaugă note sau instrucțiuni pentru aplicant..." 
                    className="w-full border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm bg-white dark:bg-slate-800/50 focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none min-h-[120px]" 
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button name="next" value="in_review" className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    În review
                  </button>
                  <button name="next" value="need_info" className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Cere informații
                  </button>
                  <button name="next" value="approved" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                    Aprobă
                  </button>
                  <button name="next" value="rejected" className="px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                    Respinge
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminPageWrapper>
      </main>
      <Footer />
    </>
  );
}



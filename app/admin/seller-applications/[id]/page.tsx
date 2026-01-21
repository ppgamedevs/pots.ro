import React from "react";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { db } from "@/db";
import { sellerApplications, sellerApplicationStatusEvents, users } from "@/db/schema/core";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { SellerApplicationActions } from "./SellerApplicationActions";

type StatusEventRow = {
  id: string;
  fromStatus: string;
  toStatus: string;
  publicMessage: string | null;
  internalMessage: string | null;
  createdAt: Date | null;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: string | null;
};

function maskValue(value: string, opts: { keepStart: number; keepEnd: number }): string {
  const normalized = value.replace(/\s+/g, '');
  if (normalized.length <= opts.keepStart + opts.keepEnd) return '••••';
  return `${normalized.slice(0, opts.keepStart)}•••${normalized.slice(-opts.keepEnd)}`;
}

function maskCui(cui: string): string {
  const normalized = cui.trim();
  if (!normalized) return '-';

  const upper = normalized.toUpperCase();
  if (upper.startsWith('RO') && upper.length > 2) {
    return `RO${maskValue(upper.slice(2), { keepStart: 1, keepEnd: 2 })}`;
  }

  return maskValue(upper, { keepStart: 1, keepEnd: 2 });
}

function maskIban(iban: string): string {
  const normalized = iban.trim();
  if (!normalized) return '-';
  return maskValue(normalized.toUpperCase(), { keepStart: 4, keepEnd: 4 });
}

function carrierLabel(value: string | null | undefined): string {
  const v = (value || '').toLowerCase().trim();
  if (!v || v === '-') return 'Cargus';
  if (v === 'cargus') return 'Cargus';
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

async function getStatusEvents(applicationId: string): Promise<StatusEventRow[]> {
  return db
    .select({
      id: sellerApplicationStatusEvents.id,
      fromStatus: sellerApplicationStatusEvents.fromStatus,
      toStatus: sellerApplicationStatusEvents.toStatus,
      publicMessage: sellerApplicationStatusEvents.publicMessage,
      internalMessage: sellerApplicationStatusEvents.internalMessage,
      createdAt: sellerApplicationStatusEvents.createdAt,
      actorId: sellerApplicationStatusEvents.actorId,
      actorEmail: users.email,
      actorName: users.name,
      actorRole: users.role,
    })
    .from(sellerApplicationStatusEvents)
    .leftJoin(users, eq(sellerApplicationStatusEvents.actorId, users.id))
    .where(eq(sellerApplicationStatusEvents.applicationId, applicationId))
    .orderBy(desc(sellerApplicationStatusEvents.createdAt));
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

  const events: StatusEventRow[] = await getStatusEvents(app.id);

  const showFullPii = currentUser.role === 'admin';
  const displayCui = showFullPii ? (app.cui || '-') : (app.cui ? maskCui(app.cui) : '-');
  const displayIban = showFullPii ? (app.iban || '-') : (app.iban ? maskIban(app.iban) : '-');

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
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Persoană contact</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.contactName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Telefon</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">CUI</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{displayCui}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">IBAN</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100 font-mono">{displayIban}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Categorii</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      {Array.isArray(app.categories) && app.categories.length > 0 ? app.categories.join(', ') : '-'}
                    </div>
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
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Politica retur</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{app.returnPolicy || '-'}</div>
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
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Creat la</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{app.createdAt ? app.createdAt.toLocaleString('ro-RO') : '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Istoric status</h2>
              {events.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">Nu există evenimente înregistrate încă.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev: StatusEventRow) => (
                    <div key={ev.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          <span className="font-medium">{ev.fromStatus}</span>
                          <span className="text-slate-500 dark:text-slate-400"> → </span>
                          <span className="font-medium">{ev.toStatus}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {ev.createdAt ? ev.createdAt.toLocaleString('ro-RO') : '-'}
                          {ev.actorEmail ? ` • ${ev.actorEmail}` : ''}
                        </div>
                      </div>
                      {(ev.publicMessage || ev.internalMessage) && (
                        <div className="mt-3 space-y-2">
                          {ev.publicMessage && (
                            <div>
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Mesaj către seller</div>
                              <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{ev.publicMessage}</div>
                            </div>
                          )}
                          {ev.internalMessage && (
                            <div>
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Note interne</div>
                              <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{ev.internalMessage}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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



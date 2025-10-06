import React from "react";

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
  if (!app) return <main className="mx-auto max-w-3xl px-4 py-8">Nu a fost găsită aplicația.</main>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">{app.company}</h1>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div>Email: {app.email}</div>
          <div>Telefon: {app.phone || '-'}</div>
          <div>CUI: {app.cui || '-'}</div>
          <div>IBAN: {app.iban || '-'}</div>
        </div>
        <div>
          <div>Website: {app.website || '-'}</div>
          <div>Curier: {app.carrier || '-'}</div>
          <div>Status: <span className="chip">{app.status}</span></div>
        </div>
      </div>
      <form action={async (formData: FormData) => {
        const next = String(formData.get('next'));
        const notes = String(formData.get('notes') || '');
        await fetch(`/api/seller/applications/${app.id}/status`, { method: 'POST', body: JSON.stringify({ status: next, notes }) });
      }} className="space-y-3">
        <textarea name="notes" placeholder="Note pentru applicant" className="w-full border rounded p-2" />
        <div className="flex gap-2">
          <button name="next" value="in_review" className="btn">În review</button>
          <button name="next" value="need_info" className="btn">Cere informații</button>
          <button name="next" value="approved" className="btn-primary">Aprobă</button>
          <button name="next" value="rejected" className="btn">Respinge</button>
        </div>
      </form>
    </main>
  );
}



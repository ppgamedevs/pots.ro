"use client";

import React, { useEffect, useState } from "react";

export default function SellerOnboardingPage() {
  const [seller, setSeller] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/seller/me');
        if (res.ok) {
          const data = await res.json();
          setSeller(data.seller);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-10">Loading...</main>;
  if (!seller) return <main className="mx-auto max-w-3xl px-4 py-10">Nu există încă un seller. Te rugăm revino din emailul de aprobare.</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Onboarding vânzător</h1>
      <Progress step={step} />

      {step === 1 && <StepProfile seller={seller} onNext={() => setStep(2)} />}
      {step === 2 && <StepShipping seller={seller} onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <StepBilling seller={seller} onPrev={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <StepFinish seller={seller} onPrev={() => setStep(3)} />}
    </main>
  );
}

function Progress({ step }: { step: number }) {
  const pct = [0,25,50,75,100][step] || 0;
  return (
    <div className="w-full bg-bgsoft rounded h-2">
      <div className="h-2 bg-primary rounded" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StepProfile({ seller, onNext }: { seller: any; onNext: () => void }) {
  const [state, setState] = useState({ brand_name: seller.brandName || '', about: seller.about || '', logo_url: seller.logoUrl || '', banner_url: seller.bannerUrl || '' });
  async function save() {
    await fetch('/api/seller/update-profile', { method: 'POST', body: JSON.stringify({ seller_id: seller.id, ...state }) });
    onNext();
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">1) Profil</h2>
      <input className="input" placeholder="Brand" value={state.brand_name} onChange={e=>setState({...state, brand_name:e.target.value})} />
      <input className="input" placeholder="Logo URL" value={state.logo_url} onChange={e=>setState({...state, logo_url:e.target.value})} />
      <input className="input" placeholder="Banner URL" value={state.banner_url} onChange={e=>setState({...state, banner_url:e.target.value})} />
      <textarea className="input" placeholder="Despre brand" value={state.about} onChange={e=>setState({...state, about:e.target.value})} />
      <div className="flex gap-2"><button className="btn-primary" onClick={save}>Continuă</button></div>
    </section>
  );
}

function StepShipping({ seller, onPrev, onNext }: { seller: any; onPrev: () => void; onNext: () => void }) {
  const [state, setState] = useState<any>(seller.shippingPrefs || { carriers: [], avg_eta_days: 2, handling_days: 1 });
  async function save() {
    await fetch('/api/seller/update-shipping', { method: 'POST', body: JSON.stringify({ seller_id: seller.id, shipping_prefs: state }) });
    onNext();
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">2) Livrare</h2>
      <input className="input" placeholder="Carriers (virgule)" value={state.carriers?.join(',') || ''} onChange={e=>setState({...state, carriers:e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean)})} />
      <input className="input" placeholder="ETA mediu (zile)" type="number" value={state.avg_eta_days} onChange={e=>setState({...state, avg_eta_days:Number(e.target.value)})} />
      <input className="input" placeholder="Handling (zile)" type="number" value={state.handling_days} onChange={e=>setState({...state, handling_days:Number(e.target.value)})} />
      <div className="flex gap-2"><button className="btn" onClick={onPrev}>Înapoi</button><button className="btn-primary" onClick={save}>Continuă</button></div>
    </section>
  );
}

function StepBilling({ seller, onPrev, onNext }: { seller: any; onPrev: () => void; onNext: () => void }) {
  const [state, setState] = useState({ legal_name: seller.legalName || '', cui: seller.cui || '', iban: seller.iban || '', phone: seller.phone || '', email: seller.email || '', return_policy: seller.returnPolicy || '' });
  async function save() {
    await fetch('/api/seller/update-billing', { method: 'POST', body: JSON.stringify({ seller_id: seller.id, ...state }) });
    onNext();
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">3) Facturare & Politici</h2>
      <input className="input" placeholder="Denumire legală" value={state.legal_name} onChange={e=>setState({...state, legal_name:e.target.value})} />
      <input className="input" placeholder="CUI" value={state.cui} onChange={e=>setState({...state, cui:e.target.value})} />
      <input className="input" placeholder="IBAN" value={state.iban} onChange={e=>setState({...state, iban:e.target.value})} />
      <input className="input" placeholder="Telefon" value={state.phone} onChange={e=>setState({...state, phone:e.target.value})} />
      <input className="input" placeholder="Email" value={state.email} onChange={e=>setState({...state, email:e.target.value})} />
      <textarea className="input" placeholder="Politica de retur" value={state.return_policy} onChange={e=>setState({...state, return_policy:e.target.value})} />
      <div className="flex gap-2"><button className="btn" onClick={onPrev}>Înapoi</button><button className="btn-primary" onClick={save}>Continuă</button></div>
    </section>
  );
}

function StepFinish({ seller, onPrev }: { seller: any; onPrev: () => void }) {
  async function finish() {
    await fetch('/api/seller/finish-onboarding', { method: 'POST', body: JSON.stringify({ seller_id: seller.id }) });
    window.location.href = '/dashboard/seller';
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">4) Finalizare</h2>
      <ul className="list-disc ml-6 text-sm text-ink/80">
        <li>Brand + logo setate</li>
        <li>Livrare configurată</li>
        <li>Facturare & retur completate</li>
      </ul>
      <div className="flex gap-2"><button className="btn" onClick={onPrev}>Înapoi</button><button className="btn-primary" onClick={finish}>Finalizează onboarding</button></div>
    </section>
  );
}



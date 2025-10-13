import { SellerHero } from "@/components/seller/SellerHero";
import { Benefits } from "@/components/seller/Benefits";
import { HowItWorks } from "@/components/seller/HowItWorks";
import { Pricing } from "@/components/seller/Pricing";
import { SellerFAQ } from "@/components/seller/SellerFAQ";
import Link from "next/link";

async function getSeller() {
  try {
    const res = await fetch('/api/seller/me', { cache: 'no-store' });
    if (res.ok) return (await res.json()).seller;
  } catch {}
  return null;
}

export default async function SellerLandingPage() {
  const seller = await getSeller();
  const progress = seller && seller.status === 'onboarding' ? (
    [
      seller.brandName,
      seller.logoUrl,
      seller.shippingPrefs,
      seller.legalName,
      seller.iban,
      seller.returnPolicy,
    ].filter(Boolean).length / 6 * 100
  ) : 0;
  return (
    <div>
      <main>
        <SellerHero />
        <Benefits />
        <HowItWorks />
        <Pricing />
        {seller && seller.status === 'onboarding' && (
          <section className="mx-auto max-w-7xl px-4">
            <div className="mb-6 rounded-xl border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-medium">Onboarding în progres</div>
                  <div className="text-sm text-ink/70">{Math.round(progress)}% completat</div>
                </div>
                <a href="/seller/onboarding" className="btn-primary">Continuă</a>
              </div>
              <div className="mt-3 h-2 w-full bg-bgsoft rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${Math.round(progress)}%` }} />
              </div>
              <ul className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-ink/80">
                <li className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${seller.brandName && seller.logoUrl ? 'bg-primary' : 'bg-line'}`} /> Profil
                </li>
                <li className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${seller.shippingPrefs ? 'bg-primary' : 'bg-line'}`} /> Livrare
                </li>
                <li className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${(seller.legalName && seller.iban && seller.returnPolicy) ? 'bg-primary' : 'bg-line'}`} /> Facturare & Politici
                </li>
              </ul>
            </div>
          </section>
        )}
        
        <section className="mx-auto max-w-7xl px-4 py-10 text-center space-x-3">
          {!seller && (
            <Link 
              href="/seller/apply" 
              className="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro"
            >
              Începe aplicația
            </Link>
          )}
          {seller && seller.status === 'onboarding' && (
            <Link 
              href="/seller/onboarding" 
              className="inline-flex px-6 py-3 bg-ink text-white rounded-lg hover:bg-ink/90 transition-micro"
            >
              Continuă onboarding-ul
            </Link>
          )}
          {seller && seller.status === 'active' && (
            <Link 
              href="/seller" 
              className="inline-flex px-6 py-3 border border-line rounded-lg hover:bg-bg-soft transition-micro"
            >
              Intră în dashboard
            </Link>
          )}
        </section>
        
        <SellerFAQ />
      </main>
    </div>
  );
}

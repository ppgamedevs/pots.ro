import { SellerHero } from "@/components/seller/SellerHero";
import { Benefits } from "@/components/seller/Benefits";
import { HowItWorks } from "@/components/seller/HowItWorks";
import { Pricing } from "@/components/seller/Pricing";
import { SellerFAQ } from "@/components/seller/SellerFAQ";
import Link from "next/link";

export default function SellerLandingPage() {
  return (
    <div>
      <main>
        <SellerHero />
        <Benefits />
        <HowItWorks />
        <Pricing />
        
        <section className="mx-auto max-w-7xl px-4 py-10 text-center">
          <Link 
            href="/seller/apply" 
            className="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro"
          >
            Începe aplicația
          </Link>
        </section>
        
        <SellerFAQ />
      </main>
    </div>
  );
}

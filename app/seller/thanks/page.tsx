import Link from "next/link";
import { Check } from "lucide-react";

export default function SellerThanksPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-bg-soft flex items-center justify-center border border-line">
        <Check className="h-7 w-7 text-primary" />
      </div>
      
      <h1 className="text-2xl font-semibold mt-4 text-ink">
        Aplicație trimisă
      </h1>
      <p className="text-ink/70 mt-2">
        Îți mulțumim! Verificăm datele și te contactăm în 1-3 zile lucrătoare.
      </p>
      
      <div className="mt-8">
        <Link 
          href="/" 
          className="inline-flex px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro font-medium"
        >
          Înapoi la homepage
        </Link>
      </div>
    </main>
  );
}

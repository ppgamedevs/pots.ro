import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SellerRequirementsPage() {
  const requirements = [
    { 
      title: "Date firmă", 
      description: "Denumire legală, CUI/CIF, adresă, IBAN." 
    },
    { 
      title: "Contact", 
      description: "Persoană de contact, e-mail, telefon." 
    },
    { 
      title: "Politici", 
      description: "Politică retur (minim 14 zile), termene livrare." 
    },
    { 
      title: "Catalog", 
      description: "Imagini clare (min 1200px), descrieri oneste, stoc real." 
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-ink hover:underline mb-6 transition-micro"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la homepage
      </Link>
      
      <h1 className="text-2xl md:text-3xl font-semibold text-ink">
        Cerințe pentru vânzători
      </h1>
      <p className="text-ink/70 mt-2">
        Tot ce ai nevoie pentru a începe corect pe FloristMarket.
      </p>
      
      <div className="mt-8 grid gap-4">
        {requirements.map((req, index) => (
          <div key={index} className="rounded-xl border border-line p-5 bg-white hover:shadow-card transition-micro">
            <div className="font-medium text-ink">{req.title}</div>
            <div className="text-sm text-ink/70 mt-1">{req.description}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-ink">Comisioane & plăți</h2>
        <ul className="mt-3 list-disc list-inside text-ink/80 space-y-1">
          <li>Comision vânzare: 8% / comandă (fără transport).</li>
          <li>Comisioane procesare plăți conform Netopia.</li>
          <li>Payout după livrare confirmată, fără taxă suplimentară.</li>
        </ul>
      </div>
      
      <div className="mt-10">
        <Link 
          href="/seller/apply" 
          className="inline-flex px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro"
        >
          Aplică acum
        </Link>
      </div>
    </main>
  );
}

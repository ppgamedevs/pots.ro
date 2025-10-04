import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplyForm } from "@/components/seller/ApplyForm";

export default function SellerApplyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-ink hover:underline mb-6 transition-micro"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la homepage
      </Link>
      
      <h1 className="text-2xl font-semibold text-ink">
        Aplică pentru cont de vânzător
      </h1>
      <p className="text-ink/70 mt-2">
        Completează formularul. Îți răspundem în 1–2 zile lucrătoare.
      </p>
      
      <ApplyForm />
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-ink hover:text-primary transition-micro mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la homepage
      </Link>
      {children}
    </main>
  );
}

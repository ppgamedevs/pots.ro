import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackHomeProps {
  className?: string;
}

export default function BackHome({ className = "" }: BackHomeProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-ink hover:underline transition-micro"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la homepage
      </Link>
    </div>
  );
}

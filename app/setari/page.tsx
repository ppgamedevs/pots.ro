import { Metadata } from "next";
export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth/session';
import Link from "next/link";
import { Settings, ArrowLeft } from "lucide-react";
import { AccountSettings } from "@/components/settings/AccountSettings";

export const metadata: Metadata = {
  title: "Setări cont - FloristMarket.ro",
  description: "Gestionează numele, emailul și preferințele contului tău pe FloristMarket.ro",
};

export default async function AccountSettingsPage() {
  await requireAuth();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link 
            href="/account" 
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la contul meu
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-slate-700 dark:text-slate-200" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Setări cont
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Gestionează informațiile personale, parola și preferințele de notificare
          </p>
        </div>

        <AccountSettings />
      </div>
    </div>
  );
}



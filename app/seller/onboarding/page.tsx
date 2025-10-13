import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Onboarding Vânzător - Pots.ro",
  description: "Completează procesul de înregistrare ca vânzător pe Pots.ro",
};

export default function SellerOnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/seller" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                <ArrowLeft className="h-4 w-4" />
                Înapoi
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Pots.ro
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Onboarding Vânzător
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Completează procesul de înregistrare pentru a deveni vânzător pe Pots.ro
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Informații de bază
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Documente
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Verificare
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
          </div>

          {/* Onboarding Content */}
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Informațiile de bază au fost completate
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Ai completat cu succes primul pas din procesul de onboarding.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Următorii pași
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Încarcă documentele necesare
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Certificat de înregistrare, CUI, și alte documente de identificare
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Verificare și aprobare
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Echipa noastră va verifica documentele și va aproba contul tău
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Procesul de verificare poate dura până la 2-3 zile lucrătoare.
              </p>
              <Link
                href="/seller"
                className="inline-flex px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
              >
                Continuă mai târziu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

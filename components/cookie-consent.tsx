"use client";

import { useState, useEffect } from "react";
import { X, Cookie, Settings } from "lucide-react";
import Link from "next/link";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    setShowBanner(false);
    // Here you would initialize analytics and marketing scripts
    initializeScripts(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem("cookie-consent", JSON.stringify(necessaryOnly));
    setShowBanner(false);
    initializeScripts(necessaryOnly);
  };

  const savePreferences = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
    initializeScripts(preferences);
  };

  const initializeScripts = (prefs: CookiePreferences) => {
    // Initialize Google Analytics if analytics is accepted
    if (prefs.analytics) {
      // Initialize analytics scripts here
      console.log("Analytics cookies accepted");
    }
    
    // Initialize marketing scripts if marketing is accepted
    if (prefs.marketing) {
      // Initialize marketing scripts here
      console.log("Marketing cookies accepted");
    }
    
    // Initialize functional scripts if functional is accepted
    if (prefs.functional) {
      // Initialize functional scripts here
      console.log("Functional cookies accepted");
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-brand mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Folosim cookie-uri
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Folosim cookie-uri pentru a îmbunătăți experiența ta pe site, pentru analiză 
                  și personalizare. Poți gestiona preferințele în{" "}
                  <Link href="/cookies" className="text-brand hover:underline">
                    Politica de Cookie-uri
                  </Link>
                  .
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowSettings(true)}
                className="btn btn-ghost text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferințe
              </button>
              <button
                onClick={acceptNecessary}
                className="btn btn-ghost text-sm"
              >
                Doar necesare
              </button>
              <button
                onClick={acceptAll}
                className="btn btn-primary text-sm"
              >
                Accept toate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Preferințe Cookie-uri
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Cookie-uri necesare
                    </h3>
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-sm">
                      Întotdeauna active
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Aceste cookie-uri sunt esențiale pentru funcționarea site-ului și nu pot fi dezactivate.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Cookie-uri de analiză
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 dark:peer-focus:ring-brand/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Ne ajută să înțelegem cum interacționezi cu site-ul pentru a-l îmbunătăți.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Cookie-uri de marketing
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 dark:peer-focus:ring-brand/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Folosite pentru a personaliza reclamele și a măsura eficiența campaniilor.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Cookie-uri funcționale
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences(prev => ({ ...prev, functional: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/20 dark:peer-focus:ring-brand/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand"></div>
                    </label>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Permit funcționalități avansate și personalizare, cum ar fi preferințele de limbă.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-ghost flex-1"
                >
                  Anulează
                </button>
                <button
                  onClick={savePreferences}
                  className="btn btn-primary flex-1"
                >
                  Salvează preferințele
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

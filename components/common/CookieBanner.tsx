"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const checkPreferences = async () => {
      setLoading(true);
      
      try {
        if (user) {
          // User is logged in - check database
          const response = await fetch("/api/gdpr/preferences", {
            credentials: 'include',
            cache: 'no-store',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.preference) {
              // User has a preference in DB - hide banner
              setOpen(false);
              // Also sync to localStorage for consistency
              localStorage.setItem("fm_cookie_choice", data.preference.consentType);
            } else {
              // No preference in DB - check localStorage for migration
              const localChoice = localStorage.getItem("fm_cookie_choice");
              if (localChoice && (localChoice === "necessary" || localChoice === "all")) {
                // Migrate localStorage to DB (save based on user email)
                try {
                  const syncResponse = await fetch("/api/gdpr/preferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ consentType: localChoice }),
                  });
                  
                  if (syncResponse.ok) {
                    // Hide banner after successful sync
                    setOpen(false);
                  } else {
                    // If sync fails, still hide banner (preference exists in localStorage)
                    setOpen(false);
                  }
                } catch (syncError) {
                  console.error("Error syncing GDPR preferences:", syncError);
                  // If sync fails, still hide banner (preference exists in localStorage)
                  setOpen(false);
                }
              } else {
                // No preference anywhere - show banner
                setOpen(true);
              }
            }
          } else {
            // API error - fallback to localStorage
            const localChoice = localStorage.getItem("fm_cookie_choice");
            setOpen(!localChoice);
          }
        } else {
          // User not logged in - check localStorage only
          const localChoice = localStorage.getItem("fm_cookie_choice");
          setOpen(!localChoice);
        }
      } catch (error) {
        console.error("Error checking GDPR preferences:", error);
        // Fallback to localStorage check
        const localChoice = localStorage.getItem("fm_cookie_choice");
        setOpen(!localChoice);
      } finally {
        setLoading(false);
      }
    };

    checkPreferences();
  }, [user]);

  // Hide banner while loading
  if (loading || !open) return null;

  const handleAcceptNecessary = async () => {
    const consentType = "necessary";
    
    if (user) {
      // Save to database for logged-in users
      try {
        await fetch("/api/gdpr/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ consentType }),
        });
      } catch (error) {
        console.error("Error saving GDPR preference:", error);
      }
    }
    
    // Also save to localStorage for consistency and guest users
    localStorage.setItem("fm_cookie_choice", consentType);
    setOpen(false);
  };

  const handleAcceptAll = async () => {
    const consentType = "all";
    
    if (user) {
      // Save to database for logged-in users
      try {
        await fetch("/api/gdpr/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ consentType }),
        });
      } catch (error) {
        console.error("Error saving GDPR preference:", error);
      }
    }
    
    // Also save to localStorage for consistency and guest users
    localStorage.setItem("fm_cookie_choice", consentType);
    setOpen(false);
  };

  return (
    <div 
      role="dialog" 
      aria-label="Setări cookie" 
      className="fixed inset-x-3 bottom-3 z-50"
    >
      <div className="mx-auto max-w-5xl rounded-2xl border border-line bg-white shadow-elev p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-ink mb-2">Cookie-uri și confidențialitate</h3>
            <p className="text-sm text-ink/80 leading-relaxed">
              Folosim cookie-uri funcționale pentru o experiență mai bună. 
              Poți gestiona preferințele în{" "}
              <Link 
                href="/privacy" 
                className="text-primary hover:underline transition-micro"
              >
                Politica de confidențialitate
              </Link>
              .
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleAcceptNecessary}
              className="btn-outline flex-1 md:flex-none"
            >
              Doar necesare
            </button>
            <button 
              onClick={handleAcceptAll}
              className="btn-primary flex-1 md:flex-none"
            >
              Accept toate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

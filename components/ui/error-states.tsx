import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Ceva nu a mers bine",
  description = "A apărut o eroare neașteptată. Te rugăm să încerci din nou.",
  action,
  showRetry = true,
  showHome = true,
  showBack = false,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-6">
        <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto" />
      </div>
      
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-md">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        )}
        
        {showRetry && (
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Încearcă din nou
          </Button>
        )}
        
        {showHome && (
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Acasă
            </Button>
          </Link>
        )}
        
        {showBack && (
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Button>
        )}
      </div>
    </div>
  );
}

// Specific error states for different pages
export function CategoryErrorState({ slug }: { slug: string }) {
  return (
    <ErrorState
      title="Categoria nu a fost găsită"
      description={`Categoria "${slug}" nu există sau a fost mutată.`}
      showRetry={false}
      showBack={true}
    />
  );
}

export function ProductErrorState({ id }: { id: string }) {
  return (
    <ErrorState
      title="Produsul nu a fost găsit"
      description={`Produsul cu ID-ul "${id}" nu există sau a fost eliminat.`}
      showRetry={false}
      showBack={true}
    />
  );
}

export function SellerErrorState({ slug }: { slug: string }) {
  return (
    <ErrorState
      title="Vânzătorul nu a fost găsit"
      description={`Vânzătorul "${slug}" nu există sau a fost eliminat.`}
      showRetry={false}
      showBack={true}
    />
  );
}

export function CartErrorState() {
  return (
    <ErrorState
      title="Eroare la încărcarea coșului"
      description="Nu am putut încărca produsele din coș. Te rugăm să încerci din nou."
      showRetry={true}
      showHome={true}
    />
  );
}

export function CheckoutErrorState() {
  return (
    <ErrorState
      title="Eroare la finalizarea comenzii"
      description="A apărut o eroare la procesarea comenzii. Te rugăm să încerci din nou."
      showRetry={true}
      showBack={true}
    />
  );
}

// Network error state
export function NetworkErrorState() {
  return (
    <ErrorState
      title="Probleme de conectivitate"
      description="Nu am putut conecta la server. Verifică conexiunea la internet și încearcă din nou."
      showRetry={true}
      showHome={true}
    />
  );
}

// API error state
export function APIErrorState({ endpoint }: { endpoint?: string }) {
  return (
    <ErrorState
      title="Eroare de server"
      description={`Serverul nu a putut procesa cererea${endpoint ? ` pentru ${endpoint}` : ""}. Te rugăm să încerci din nou.`}
      showRetry={true}
      showHome={true}
    />
  );
}

// Form validation error state
export function FormErrorState({ errors }: { errors: string[] }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Eroare de validare</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

// Search error state
export function SearchErrorState() {
  return (
    <ErrorState
      title="Eroare la căutare"
      description="Nu am putut efectua căutarea. Te rugăm să încerci din nou."
      showRetry={true}
      showHome={false}
    />
  );
}

"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Contul meu</h1>
          <p className="text-subink">
            Introdu email-ul pentru a primi codul de autentificare. Dacă nu ai cont, îl vom crea automat.
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}

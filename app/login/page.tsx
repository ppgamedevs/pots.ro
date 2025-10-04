import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">Autentificare</h1>
          <p className="text-subink">
            Introdu email-ul pentru a primi codul de autentificare
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}

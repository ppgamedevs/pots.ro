"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Parolele nu se potrivesc");
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError("Trebuie să accepți termenii și condițiile");
      setLoading(false);
      return;
    }

    try {
      // For now, redirect to login with a message
      // In a real implementation, you'd call the signup API
      router.push("/autentificare?message=Contul a fost creat cu succes! Te poți conecta acum.");
    } catch (err) {
      setError("A apărut o eroare. Te rugăm să încerci din nou.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-ink">
            Creează cont nou
          </CardTitle>
          <p className="text-muted">
            Alătură-te comunității FloristMarket
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">
                  Prenume
                </label>
                <Input
                  type="text"
                  placeholder="Prenumele tău"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">
                  Nume
                </label>
                <Input
                  type="text"
                  placeholder="Numele tău"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  type="email"
                  placeholder="email@exemplu.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">
                Parolă
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Parola ta"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-ink mb-1 block">
                Confirmă parola
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmă parola"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted">
                Accept{" "}
                <Link href="/termeni" className="text-primary hover:underline">
                  termenii și condițiile
                </Link>{" "}
                și{" "}
                <Link href="/confidentialitate" className="text-primary hover:underline">
                  politica de confidențialitate
                </Link>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Se creează contul..." : "Creează cont"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Ai deja cont?{" "}
              <Link href="/autentificare" className="text-primary hover:underline font-medium">
                Conectează-te aici
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

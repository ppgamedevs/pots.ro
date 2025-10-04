"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, User, Mail } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.user);
        } else {
          setError('Eroare la încărcarea profilului');
        }
      } catch (error) {
        setError('Eroare de conexiune');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        const data = await response.json();
        setError(data.error || 'Eroare la logout');
      }
    } catch (error) {
      setError('Eroare de conexiune');
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-ink">
              Nu ești autentificat
            </CardTitle>
            <CardDescription className="text-muted">
              Te rugăm să te autentifici pentru a accesa această pagină.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Autentificare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profilul meu
            </CardTitle>
            <CardDescription>
              Gestionează informațiile contului tău
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-bg-soft rounded-lg">
                <Mail className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">Email</p>
                  <p className="text-sm text-muted">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-bg-soft rounded-lg">
                <User className="h-5 w-5 text-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">Rol</p>
                  <p className="text-sm text-muted capitalize">{user.role}</p>
                </div>
              </div>

              {user.name && (
                <div className="flex items-center gap-3 p-4 bg-bg-soft rounded-lg">
                  <User className="h-5 w-5 text-muted" />
                  <div>
                    <p className="text-sm font-medium text-ink">Nume</p>
                    <p className="text-sm text-muted">{user.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-line">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full"
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se deconectează...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Deconectare
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

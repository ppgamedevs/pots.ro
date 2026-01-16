"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, User, Mail, Edit3, Save, X } from "lucide-react";

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Use ref to prevent duplicate fetches on re-renders caused by browser extensions
  const hasFetchedRef = useRef(false);

  // Fetch current user
  useEffect(() => {
    // Guard: Only fetch once per mount
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (!isMounted) return;
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.user) {
            setUser(data.user);
            setNameValue(data.user.name || '');
          } else {
            // User not authenticated even though response is ok
            setUser(null);
            setError('');
          }
        } else {
          setError(data.error || 'Eroare la încărcarea profilului');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        if (isMounted) {
          setError('Eroare de conexiune');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []); // Empty deps: only fetch on mount

  // Handle name update
  const handleNameUpdate = async () => {
    setNameLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nameValue.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(prev => prev ? { ...prev, name: nameValue.trim() } : null);
        setIsEditingName(false);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: { name: nameValue.trim() } 
        }));
      } else {
        setError(data.error || 'Eroare la actualizarea numelui');
      }
    } catch (error) {
      setError('Eroare de conexiune');
    } finally {
      setNameLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to homepage - use replace to avoid history entry
        window.location.replace('/');
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
              onClick={() => window.location.href = '/autentificare'}
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

              <div className="flex items-center gap-3 p-4 bg-bg-soft rounded-lg">
                <User className="h-5 w-5 text-muted" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Nume</p>
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        placeholder="Introdu numele tău"
                        className="text-sm"
                        disabled={nameLoading}
                      />
                      <Button
                        size="sm"
                        onClick={handleNameUpdate}
                        disabled={nameLoading}
                      >
                        {nameLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingName(false);
                          setNameValue(user?.name || '');
                        }}
                        disabled={nameLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted">
                        {user.name || 'Nu ai setat un nume'}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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

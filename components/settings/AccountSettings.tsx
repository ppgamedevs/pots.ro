"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Save, 
  Loader2, 
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

interface NotificationPreferences {
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  // Fetch user data and notification preferences
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();
        
        if (userResponse.ok) {
          setUser(userData.user);
          setName(userData.user.name || '');
          setEmail(userData.user.email);
        } else {
          setError('Eroare la încărcarea profilului');
        }

        // Fetch notification preferences
        const notificationsResponse = await fetch('/api/users/notifications');
        const notificationsData = await notificationsResponse.json();
        
        if (notificationsResponse.ok) {
          setNotifications(notificationsData.preferences);
        }
      } catch (error) {
        setError('Eroare de conexiune');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle name update
  const handleNameUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(prev => prev ? { ...prev, name: name.trim() } : null);
        setSuccess('Numele a fost actualizat cu succes!');
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: { name: name.trim() } 
        }));
      } else {
        setError(data.error || 'Eroare la actualizarea numelui');
      }
    } catch (error) {
      setError('Eroare de conexiune');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Parolele nu se potrivesc');
      return;
    }

    if (newPassword.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Parola a fost schimbată cu succes!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Eroare la schimbarea parolei');
      }
    } catch (error) {
      setError('Eroare de conexiune');
    } finally {
      setSaving(false);
    }
  };

  // Handle notification preferences update
  const handleNotificationUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Preferințele de notificare au fost actualizate!');
      } else {
        setError(data.error || 'Eroare la actualizarea preferințelor');
      }
    } catch (error) {
      setError('Eroare de conexiune');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Nu s-a putut încărca profilul utilizatorului.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informații personale
          </CardTitle>
          <CardDescription>
            Gestionează numele și informațiile de bază ale contului tău
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nume complet</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Introdu numele tău complet"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-slate-50"
            />
            <p className="text-sm text-slate-500">
              Emailul nu poate fi modificat. Contactează-ne pentru a schimba emailul.
            </p>
          </div>

          <Button 
            onClick={handleNameUpdate}
            disabled={saving || !name.trim()}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvează modificările
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Schimbă parola
          </CardTitle>
          <CardDescription>
            Pentru securitate, introdu parola actuală pentru a o schimba
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Parola actuală</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Introdu parola actuală"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Parola nouă</Label>
            <Input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Introdu parola nouă"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmă parola nouă</Label>
            <Input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmă parola nouă"
            />
          </div>

          <Button 
            onClick={handlePasswordChange}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se schimbă...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Schimbă parola
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferințe notificări
          </CardTitle>
          <CardDescription>
            Alege ce tipuri de notificări vrei să primești
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificări email</Label>
              <p className="text-sm text-slate-500">
                Primește notificări importante pe email
              </p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Actualizări comenzi</Label>
              <p className="text-sm text-slate-500">
                Notificări despre statusul comenzilor tale
              </p>
            </div>
            <Switch
              checked={notifications.orderUpdates}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, orderUpdates: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Promoții și oferte</Label>
              <p className="text-sm text-slate-500">
                Oferte speciale și reduceri pentru produse
              </p>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, promotions: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Newsletter</Label>
              <p className="text-sm text-slate-500">
                Noutăți despre produse și trenduri în floristică
              </p>
            </div>
            <Switch
              checked={notifications.newsletter}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, newsletter: checked }))
              }
            />
          </div>

          <Button 
            onClick={handleNotificationUpdate}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvează preferințele
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

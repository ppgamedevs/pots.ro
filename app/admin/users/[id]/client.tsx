"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, RefreshCw, Ban, CheckCircle } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin" | "support";
  created_at: string;
  updated_at: string;
};

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    buyer: "Cumpărător",
    seller: "Vânzător",
    admin: "Admin",
    support: "Support",
  };
  return labels[role] || role;
}

function getRoleVariant(role: string): "success" | "warning" | "danger" | "neutral" | "brand" {
  if (role === "admin") return "danger";
  if (role === "support") return "brand";
  if (role === "seller") return "warning";
  return "neutral";
}

interface AdminUserDetailClientProps {
  user: User;
}

export default function AdminUserDetailClient({ user: initialUser }: AdminUserDetailClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<UserAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    fetchActions();
  }, [user.id]);

  const fetchActions = async () => {
    try {
      setActionsLoading(true);
      const res = await fetch(`/api/admin/users/${user.id}/actions`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch actions");
      }

      const data = await res.json();
      const fetchedActions = data.actions || [];
      setActions(fetchedActions);
      
      // Determine if user is suspended based on last action
      if (fetchedActions.length > 0) {
        const lastAction = fetchedActions[0]; // Actions are ordered by createdAt desc
        setIsSuspended(lastAction.action === "suspend");
      } else {
        setIsSuspended(false);
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setActionsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          role: role,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user");
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      toast.success("Utilizator actualizat cu succes");
      router.refresh();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la actualizare");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendReactivate = async () => {
    if (actionMessage.length < 10) {
      toast.error("Mesajul trebuie să aibă minimum 10 caractere");
      return;
    }

    try {
      setSuspendLoading(true);
      const action = isSuspended ? "reactivate" : "suspend";
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          message: actionMessage,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user status");
      }

      toast.success(
        action === "suspend"
          ? "Utilizator suspendat cu succes"
          : "Utilizator reactivat cu succes"
      );
      setActionMessage("");
      fetchActions();
      router.refresh();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la actualizarea statusului");
    } finally {
      setSuspendLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informații Utilizator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <Input value={user.email} disabled className="bg-slate-50 dark:bg-slate-800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nume
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nume utilizator"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rol
              </label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Cumpărător</SelectItem>
                  <SelectItem value="seller">Vânzător</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvare...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvează modificările
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">ID:</span>
              <span className="font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Creat:</span>
              <span>{new Date(user.created_at).toLocaleString('ro-RO')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Actualizat:</span>
              <span>{new Date(user.updated_at).toLocaleString('ro-RO')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rol Curent
                </label>
                <Badge variant={getRoleVariant(user.role)} className="text-sm">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suspend/Reactivate Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acțiuni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Acțiune
              </label>
              <Select
                value={isSuspended ? "reactivate" : "suspend"}
                disabled
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {!isSuspended && <SelectItem value="suspend">Suspendă</SelectItem>}
                  {isSuspended && <SelectItem value="reactivate">Reactivează</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mesaj <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Mesaj pentru acțiune (minimum 10 caractere)..."
                rows={3}
                className={actionMessage.length > 0 && actionMessage.length < 10 ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {actionMessage.length > 0 && actionMessage.length < 10 && (
                <p className="mt-1 text-sm text-red-500">
                  Mesajul trebuie să aibă minimum 10 caractere
                </p>
              )}
            </div>
            <Button
              onClick={handleSuspendReactivate}
              disabled={suspendLoading || actionMessage.length < 10}
              className={`w-full ${
                !isSuspended
                  ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400 disabled:cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400 disabled:cursor-not-allowed"
              }`}
            >
              {suspendLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesare...
                </>
              ) : !isSuspended ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspendă
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reactivează
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions History Table */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Istoric Acțiuni</CardTitle>
          </CardHeader>
          <CardContent>
            {actionsLoading ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Se încarcă...
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Nu există acțiuni înregistrate
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Suspend/Reactivate
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Mesaj
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Data
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Admin User
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((action) => (
                      <tr
                        key={action.id}
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      >
                        <td className="py-3 px-4">
                          <Badge
                            variant={action.action === "suspend" ? "danger" : "success"}
                            className="text-xs"
                          >
                            {action.action === "suspend" ? "Suspendat" : "Reactivat"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {action.message || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(action.createdAt).toLocaleString("ro-RO")}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {action.adminUser.name || action.adminUser.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

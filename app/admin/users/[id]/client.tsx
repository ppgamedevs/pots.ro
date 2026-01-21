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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type SellerInfo = {
  brandName: string | null;
  legalName: string | null;
  cui: string | null;
  phone: string | null;
  email: string | null;
  iban: string | null;
  about: string | null;
  website: string | null;
};

type User = {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin" | "support";
  created_at: string;
  updated_at: string;
  last_login: string | null;
  sellerInfo: SellerInfo | null;
};

type UserAction = {
  id: string;
  action: "suspend" | "reactivate" | "role_change";
  message: string;
  oldRole?: string | null;
  newRole?: string | null;
  createdAt: string;
  adminUser: {
    id: string;
    email: string;
    name: string;
  };
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
  const [newRole, setNewRole] = useState<"buyer" | "seller" | "admin" | "support" | null>(null);
  const [roleChangeMessage, setRoleChangeMessage] = useState("");
  const [showRoleConfirmDialog, setShowRoleConfirmDialog] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  useEffect(() => {
    fetchActions();
  }, [user.id]);

  const fetchActions = async () => {
    try {
      setActionsLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/users/${user.id}/actions?t=${timestamp}`, {
        credentials: "include",
        cache: "no-store",
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

  const handleRoleChangeSubmit = () => {
    if (!newRole) {
      toast.error("Selectează un rol");
      return;
    }
    
    if (newRole === user.role) {
      toast.error("Selectează un rol diferit de cel curent");
      return;
    }
    
    if (roleChangeMessage.length < 10) {
      toast.error("Mesajul trebuie să aibă minimum 10 caractere");
      return;
    }

    setShowRoleConfirmDialog(true);
  };

  const handleRoleChangeConfirm = async () => {
    if (!newRole) return;

    try {
      setRoleChangeLoading(true);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          roleChangeMessage: roleChangeMessage,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update role");
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setRole(newRole);
      setNewRole(null);
      setRoleChangeMessage("");
      setShowRoleConfirmDialog(false);
      toast.success("Rol actualizat cu succes");
      // Refresh actions list to show new role change entry
      await fetchActions();
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la actualizarea rolului");
    } finally {
      setRoleChangeLoading(false);
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
      // Small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
      // Refresh actions list to show new entry
      await fetchActions();
      router.refresh();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la actualizarea statusului");
    } finally {
      setSuspendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Informații Utilizator, Status, Acțiuni */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                Status
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isSuspended ? 'Dezactivat' : 'Activ'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Last Login:</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {user.last_login ? new Date(user.last_login).toLocaleString('ro-RO') : '-'}
                  </span>
                </div>
              </div>
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

        {/* Status Card */}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Schimbă Rol
                </label>
                <Select 
                  value={newRole || ""} 
                  onValueChange={(value: "buyer" | "seller" | "admin" | "support") => setNewRole(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selectează rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {user.role !== "buyer" && <SelectItem value="buyer">Cumpărător</SelectItem>}
                    {user.role !== "seller" && <SelectItem value="seller">Vânzător</SelectItem>}
                    {user.role !== "support" && <SelectItem value="support">Support</SelectItem>}
                    {user.role !== "admin" && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mesaj <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={roleChangeMessage}
                  onChange={(e) => setRoleChangeMessage(e.target.value)}
                  placeholder="Introdu motivul schimbării rolului (minimum 10 caractere)"
                  rows={3}
                  className="resize-none"
                />
                {roleChangeMessage.length > 0 && roleChangeMessage.length < 10 && (
                  <p className="mt-1 text-xs text-red-500">
                    Mesajul trebuie să aibă minimum 10 caractere ({roleChangeMessage.length}/10)
                  </p>
                )}
              </div>
              <Button
                onClick={handleRoleChangeSubmit}
                disabled={!newRole || newRole === user.role || roleChangeMessage.length < 10 || roleChangeLoading}
                className="w-full"
                variant="primary"
              >
                {roleChangeLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Actualizare...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Confirmă schimbarea rolului
                  </>
                )}
              </Button>
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

      {/* Metadata - Only for sellers */}
      {user.role === 'seller' && user.sellerInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Informații Vânzător</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.sellerInfo.brandName && (
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Denumire Firmă
                </div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {user.sellerInfo.brandName}
                </div>
              </div>
            )}
            {user.sellerInfo.cui && (
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  CUI / CIF
                </div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  {user.sellerInfo.cui}
                </div>
              </div>
            )}
            {user.name && (
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Persoană de Contact
                </div>
                <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {user.name}
                </div>
              </div>
            )}
            {user.sellerInfo.phone && (
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Telefon
                </div>
                <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {user.sellerInfo.phone}
                </div>
              </div>
            )}
            {user.sellerInfo.email && (
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Email
                </div>
                <div className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {user.sellerInfo.email}
                </div>
              </div>
            )}
            {user.sellerInfo.iban && (
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  IBAN
                </div>
                <div className="text-base font-medium text-slate-700 dark:text-slate-300 font-mono tracking-wider">
                  {user.sellerInfo.iban}
                </div>
              </div>
            )}
            {user.sellerInfo.website && (
              <div className="pb-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Website
                </div>
                <a 
                  href={user.sellerInfo.website.startsWith('http') ? user.sellerInfo.website : `https://${user.sellerInfo.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  {user.sellerInfo.website}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions History Table */}
      <div>
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
                        Acțiune
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Update
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
                          {action.action === "role_change" ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="warning" className="text-xs w-fit">
                                Schimbare Rol
                              </Badge>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {action.oldRole && action.newRole && (
                                  <span>
                                    {getRoleLabel(action.oldRole)} → {getRoleLabel(action.newRole)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Badge
                              variant={action.action === "suspend" ? "danger" : "success"}
                              className="text-xs"
                            >
                              {action.action === "suspend" ? "Suspendat" : "Reactivat"}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {action.action === "role_change" ? "Rol Update" : "Account Update"}
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

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        open={showRoleConfirmDialog}
        onOpenChange={setShowRoleConfirmDialog}
        title="Confirmă schimbarea rolului"
        description={
          <div className="space-y-2">
            <p>
              Ești sigur că vrei să schimbi rolul utilizatorului de la{" "}
              <strong>{getRoleLabel(user.role)}</strong> la{" "}
              <strong>{newRole ? getRoleLabel(newRole) : ""}</strong>?
            </p>
            {roleChangeMessage && (
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mesaj:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded border">
                  {roleChangeMessage}
                </p>
              </div>
            )}
          </div>
        }
        confirmText="Confirmă"
        cancelText="Anulează"
        variant="danger"
        onConfirm={handleRoleChangeConfirm}
        loading={roleChangeLoading}
      />
    </div>
  );
}

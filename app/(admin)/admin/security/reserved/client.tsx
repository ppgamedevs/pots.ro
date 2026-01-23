"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, Search } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ReservedName = {
  name: string;
  reason: string | null;
  createdAt: string;
};

export default function ReservedNamesClient() {
  const [names, setNames] = useState<ReservedName[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Add form
  const [newName, setNewName] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);
  
  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNames = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/security/reserved", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setNames(data.items || []);
    } catch (error) {
      console.error("Error fetching reserved names:", error);
      toast.error("Eroare la încărcarea numelor rezervate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNames();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      toast.error("Numele este obligatoriu");
      return;
    }
    
    try {
      setAdding(true);
      const res = await fetch("/api/admin/security/reserved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.toLowerCase().trim(),
          reason: newReason.trim() || null,
        }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add");
      }
      
      toast.success(`"${newName}" adăugat în lista rezervată`);
      setNewName("");
      setNewReason("");
      fetchNames();
    } catch (error) {
      console.error("Error adding reserved name:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la adăugare");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/security/reserved?name=${encodeURIComponent(deleteTarget)}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }
      
      toast.success(`"${deleteTarget}" șters din lista rezervată`);
      setDeleteTarget(null);
      fetchNames();
    } catch (error) {
      console.error("Error deleting reserved name:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la ștergere");
    } finally {
      setDeleting(false);
    }
  };

  const filteredNames = names.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    (n.reason && n.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adaugă Nume Rezervat</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Nume (ex: admin, support)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Motiv (opțional)"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {adding ? "Se adaugă..." : "Adaugă"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Nume Rezervate ({filteredNames.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchNames} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "Niciun rezultat găsit" : "Nu există nume rezervate"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNames.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {item.name}
                    </Badge>
                    {item.reason && (
                      <span className="text-sm text-muted-foreground">
                        {item.reason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("ro-RO")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(item.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Șterge Nume Rezervat"
        description={`Sigur vrei să ștergi "${deleteTarget}" din lista numelor rezervate? Utilizatorii vor putea folosi acest nume.`}
        confirmText="Șterge"
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}

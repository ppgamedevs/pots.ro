"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  ArrowLeft,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  expiresAt: string | null;
  createdBy: string;
  creatorEmail: string | null;
  createdAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [availableScopes, setAvailableScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createScopes, setCreateScopes] = useState<string[]>([]);
  const [createExpiry, setCreateExpiry] = useState("");
  const [creating, setCreating] = useState(false);

  // New key reveal state
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Action states
  const [revoking, setRevoking] = useState<string | null>(null);
  const [rotating, setRotating] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/developer/api-keys?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
        setAvailableScopes(data.availableScopes || []);
      }
    } catch (e) {
      console.error("Failed to fetch keys:", e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/developer/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          scopes: createScopes,
          expiresAt: createExpiry || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeySecret(data.secretKey);
        setShowCreateModal(false);
        setCreateName("");
        setCreateScopes([]);
        setCreateExpiry("");
        fetchKeys();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create key");
      }
    } catch (e) {
      console.error("Create error:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/admin/developer/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", reason: "Manual revocation" }),
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (e) {
      console.error("Revoke error:", e);
    } finally {
      setRevoking(null);
    }
  };

  const handleRotate = async (id: string, name: string) => {
    if (!confirm(`Rotate API key "${name}"? The old key will immediately stop working.`)) return;
    setRotating(id);
    try {
      const res = await fetch(`/api/admin/developer/api-keys/${id}/rotate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeySecret(data.secretKey);
        fetchKeys();
      }
    } catch (e) {
      console.error("Rotate error:", e);
    } finally {
      setRotating(null);
    }
  };

  const copyToClipboard = async () => {
    if (!newKeySecret) return;
    await navigator.clipboard.writeText(newKeySecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("ro-RO") : "—";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/developer"
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 text-sm">
            Manage API keys for programmatic access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {/* New key reveal modal */}
      {newKeySecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">API Key Created</h2>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Save this key now
              </div>
              <p className="text-sm text-amber-700">
                This is the only time you will see this key. Copy it and store
                it securely.
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              <span className="flex-1">{newKeySecret}</span>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-200 rounded"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
            <button
              onClick={() => setNewKeySecret(null)}
              className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              I&apos;ve saved my key
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="My Integration"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scopes
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availableScopes.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={createScopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateScopes([...createScopes, scope]);
                          } else {
                            setCreateScopes(createScopes.filter((s) => s !== scope));
                          }
                        }}
                      />
                      {scope}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration (optional)
                </label>
                <input
                  type="datetime-local"
                  value={createExpiry}
                  onChange={(e) => setCreateExpiry(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createName.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {["active", "revoked", "expired", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === s
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No API keys found
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className="p-4 bg-white border rounded-lg flex items-center gap-4"
            >
              <div
                className={`p-2 rounded-lg ${
                  k.status === "active"
                    ? "bg-green-100"
                    : k.status === "revoked"
                    ? "bg-red-100"
                    : "bg-gray-100"
                }`}
              >
                <Key
                  className={`h-5 w-5 ${
                    k.status === "active"
                      ? "text-green-600"
                      : k.status === "revoked"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{k.name}</span>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {k.prefix}...
                  </code>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      k.status === "active"
                        ? "bg-green-100 text-green-700"
                        : k.status === "revoked"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {k.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {k.scopes.length} scope{k.scopes.length !== 1 ? "s" : ""}
                  </span>
                  {k.lastUsedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used {formatDate(k.lastUsedAt)}
                    </span>
                  )}
                  {k.expiresAt && (
                    <span className="flex items-center gap-1">
                      Expires {formatDate(k.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
              {k.status === "active" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRotate(k.id, k.name)}
                    disabled={rotating === k.id}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Rotate key"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRevoke(k.id, k.name)}
                    disabled={revoking === k.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Revoke key"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

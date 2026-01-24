"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Webhook,
  Plus,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  Pause,
  Play,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  description: string | null;
  status: "active" | "paused" | "disabled";
  secretPrefix: string;
  secretCreatedAt: string;
  events: string[];
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
  consecutiveFailures: number;
  disabledReason: string | null;
  createdBy: string;
  creatorEmail: string | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createEvents, setCreateEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // New secret reveal state
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/developer/webhooks?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data.endpoints);
        setAvailableEvents(data.availableEvents || []);
      }
    } catch (e) {
      console.error("Failed to fetch endpoints:", e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleCreate = async () => {
    if (!createName.trim() || !createUrl.trim() || createEvents.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          url: createUrl,
          description: createDescription || undefined,
          events: createEvents,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewSecret(data.signingSecret);
        setShowCreateModal(false);
        setCreateName("");
        setCreateUrl("");
        setCreateDescription("");
        setCreateEvents([]);
        fetchEndpoints();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create endpoint");
      }
    } catch (e) {
      console.error("Create error:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/developer/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchEndpoints();
      }
    } catch (e) {
      console.error("Action error:", e);
    }
  };

  const handleRotateSecret = async (id: string, name: string) => {
    if (!confirm(`Rotate signing secret for "${name}"? The old secret will immediately stop working.`)) return;
    try {
      const res = await fetch(`/api/admin/developer/webhooks/${id}/rotate-secret`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setNewSecret(data.signingSecret);
        fetchEndpoints();
      }
    } catch (e) {
      console.error("Rotate error:", e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete webhook endpoint "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/developer/webhooks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchEndpoints();
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const copyToClipboard = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("ro-RO") : "—";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "paused":
        return "bg-yellow-100 text-yellow-700";
      case "disabled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Outbound Webhooks</h1>
          <p className="text-gray-600 text-sm">
            Configure endpoints to receive event notifications
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Endpoint
        </button>
      </div>

      {/* Secret reveal modal */}
      {newSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Webhook className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Signing Secret</h2>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Save this secret now
              </div>
              <p className="text-sm text-amber-700">
                This is the only time you will see this signing secret. Use it to verify
                webhook signatures in your application.
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
              <span className="flex-1">{newSecret}</span>
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
              onClick={() => setNewSecret(null)}
              className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              I&apos;ve saved my secret
            </button>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Webhook Endpoint</h2>
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
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={createUrl}
                  onChange={(e) => setCreateUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="What is this webhook for?"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Events to receive
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={createEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateEvents([...createEvents, event]);
                          } else {
                            setCreateEvents(createEvents.filter((s) => s !== event));
                          }
                        }}
                      />
                      {event}
                    </label>
                  ))}
                </div>
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
                disabled={creating || !createName.trim() || !createUrl.trim() || createEvents.length === 0}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Endpoint"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {["all", "active", "paused", "disabled"].map((s) => (
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

      {/* Endpoints list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : endpoints.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No webhook endpoints found
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((e) => (
            <div
              key={e.id}
              className="p-4 bg-white border rounded-lg"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    e.status === "active"
                      ? "bg-green-100"
                      : e.status === "paused"
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  <Webhook
                    className={`h-5 w-5 ${
                      e.status === "active"
                        ? "text-green-600"
                        : e.status === "paused"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/developer/webhooks/${e.id}`}
                      className="font-medium text-gray-900 hover:text-purple-600"
                    >
                      {e.name}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(e.status)}`}>
                      {e.status}
                    </span>
                    {e.consecutiveFailures > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                        {e.consecutiveFailures} failures
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{e.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {e.events.slice(0, 3).map((ev) => (
                      <span key={ev} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {ev}
                      </span>
                    ))}
                    {e.events.length > 3 && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        +{e.events.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex gap-4">
                    <span>Secret: {e.secretPrefix}...</span>
                    {e.lastDeliveryAt && (
                      <span className="flex items-center gap-1">
                        {e.lastDeliveryStatus === "success" ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        Last delivery {formatDate(e.lastDeliveryAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {e.status === "active" && (
                    <button
                      onClick={() => handleAction(e.id, "pause")}
                      className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                      title="Pause"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  {e.status === "paused" && (
                    <button
                      onClick={() => handleAction(e.id, "resume")}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                      title="Resume"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  {e.status !== "disabled" && (
                    <button
                      onClick={() => handleRotateSecret(e.id, e.name)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Rotate secret"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(e.id, e.name)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

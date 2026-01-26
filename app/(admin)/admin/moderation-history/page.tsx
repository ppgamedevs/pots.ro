"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, Download, ChevronLeft, ChevronRight } from "lucide-react";

type ModerationEntry = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  actionType: string;
  entityType: string;
  entityId: string;
  threadId: string | null;
  reason: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "message.hide", label: "Hide message" },
  { value: "message.delete", label: "Delete message" },
  { value: "message.redact", label: "Redact message" },
  { value: "message.redactPII", label: "Redact PII" },
  { value: "message.restore", label: "Restore message" },
  { value: "message.addNote", label: "Add note" },
  { value: "thread.statusChange", label: "Status change" },
  { value: "thread.priorityChange", label: "Priority change" },
  { value: "thread.assign", label: "Assign" },
  { value: "thread.unassign", label: "Unassign" },
  { value: "thread.escalate", label: "Escalate" },
  { value: "thread.deescalate", label: "De-escalate" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "message", label: "Message" },
  { value: "thread", label: "Thread" },
  { value: "user", label: "User" },
  { value: "conversation", label: "Conversation" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return "—";
  }
}

export default function AdminModerationHistoryPage() {
  const [data, setData] = useState<ModerationEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: "",
    entityType: "",
    actorId: "",
    threadId: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (filters.actionType) params.set("actionType", filters.actionType);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.actorId.trim()) params.set("actorId", filters.actorId.trim());
      if (filters.threadId.trim()) params.set("threadId", filters.threadId.trim());
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/admin/support/moderation-history?${params}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setData(Array.isArray(json.data) ? json.data : []);
      setTotal(Number(json.total) || 0);
      setTotalPages(Math.ceil((Number(json.total) || 0) / limit) || 1);
    } catch (e) {
      console.error(e);
      toast.error("Eroare la încărcarea moderation history");
      setData([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters.actionType, filters.entityType, filters.actorId, filters.threadId, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (filters.actionType) params.set("actionType", filters.actionType);
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.actorId.trim()) params.set("actorId", filters.actorId.trim());
    if (filters.threadId.trim()) params.set("threadId", filters.threadId.trim());
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/api/admin/support/moderation-history/export?${params}`;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      actionType: "",
      entityType: "",
      actorId: "",
      threadId: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  return (
    <AdminPageWrapper
      title="Moderation History"
      description="Istoric acțiuni moderare support (Who / When / Why). Filtre și export pentru audit."
      showBackButton
      backButtonHref="/admin"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" asChild>
              <a href={exportUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filtrează după tip acțiune, entitate, agent, thread sau perioadă.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Action type</Label>
                <Select
                  value={filters.actionType}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, actionType: v }));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value || "all"} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Entity type</Label>
                <Select
                  value={filters.entityType}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, entityType: v }));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value || "all"} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Actor ID</Label>
                <Input
                  placeholder="UUID"
                  value={filters.actorId}
                  onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value }))}
                  className="w-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Thread ID</Label>
                <Input
                  placeholder="UUID"
                  value={filters.threadId}
                  onChange={(e) => setFilters((f) => ({ ...f, threadId: e.target.value }))}
                  className="w-[200px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Start date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, startDate: e.target.value }));
                    setPage(1);
                  }}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, endDate: e.target.value }));
                    setPage(1);
                  }}
                  className="w-[160px]"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation history</CardTitle>
            <CardDescription>
              {total} înregistrări {totalPages > 1 ? `· pagina ${page} / ${totalPages}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8">Loading...</p>
            ) : data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No moderation history.</p>
            ) : (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">When</TableHead>
                        <TableHead className="text-left">Who</TableHead>
                        <TableHead className="text-left">Action</TableHead>
                        <TableHead className="text-left">Entity</TableHead>
                        <TableHead className="text-left">Reason</TableHead>
                        <TableHead className="text-left">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {entry.actorName || entry.actorId || "System"}
                              </div>
                              {entry.actorRole && (
                                <div className="text-muted-foreground text-xs">{entry.actorRole}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {entry.actionType.replace(/\./g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{entry.entityType}</div>
                              <div className="text-muted-foreground text-xs truncate max-w-[120px]">
                                {entry.entityId.length > 12 ? `${entry.entityId.slice(0, 8)}…` : entry.entityId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {entry.reason || "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {entry.note || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages} · {total} total
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}

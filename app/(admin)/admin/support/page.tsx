"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  AlertTriangle,
  Bot,
  MessageCircle,
  Search,
  Filter,
  Download,
  RefreshCcw,
  Clock,
  User,
  Tag,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  Flag,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

// Types
interface SupportThread {
  id: string;
  source: "buyer_seller" | "seller_support" | "chatbot" | "whatsapp";
  sourceId: string;
  orderId: string | null;
  sellerId: string | null;
  buyerId: string | null;
  status: "open" | "assigned" | "waiting" | "resolved" | "closed";
  assignedToUserId: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  subject: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  slaDeadline: string | null;
  slaBreach: boolean;
  createdAt: string;
  updatedAt: string;
  seller: { brandName: string; slug: string } | null;
  buyer: { name: string | null; email: string } | null;
  tags: string[];
}

interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  senderName: string | null;
  senderEmail: string;
  displayBody: string;
  moderation: {
    status: string;
    redactedBody: string | null;
    reason: string | null;
    moderatedAt: string | null;
    isInternalNote: boolean;
    internalNoteBody: string | null;
  } | null;
}

interface ChatbotQueueItem {
  id: string;
  threadId: string | null;
  userId: string | null;
  status: "pending" | "processing" | "handed_off" | "resolved" | "rejected";
  intent: string | null;
  confidence: string | null;
  lastBotResponse: string | null;
  userQuery: string | null;
  handoffReason: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  promptInjectionSuspected: boolean;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

// Helpers
const sourceLabels: Record<string, string> = {
  buyer_seller: "Buyer ↔ Seller",
  seller_support: "Seller Support",
  chatbot: "Chatbot",
  whatsapp: "WhatsApp",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-blue-100", text: "text-blue-800" },
  assigned: { bg: "bg-yellow-100", text: "text-yellow-800" },
  waiting: { bg: "bg-orange-100", text: "text-orange-800" },
  resolved: { bg: "bg-green-100", text: "text-green-800" },
  closed: { bg: "bg-gray-100", text: "text-gray-800" },
  pending: { bg: "bg-blue-100", text: "text-blue-800" },
  processing: { bg: "bg-yellow-100", text: "text-yellow-800" },
  handed_off: { bg: "bg-purple-100", text: "text-purple-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-gray-100", text: "text-gray-700" },
  normal: { bg: "bg-blue-100", text: "text-blue-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  urgent: { bg: "bg-red-100", text: "text-red-700" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<string>("inbox");

  return (
    <AdminPageWrapper
      title="Support Console"
      description="Unified support inbox, moderation, and chatbot queue management"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Flags</span>
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Chatbot</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <InboxTab />
        </TabsContent>

        <TabsContent value="flags">
          <FlagsTab />
        </TabsContent>

        <TabsContent value="chatbot">
          <ChatbotQueueTab />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppTab />
        </TabsContent>
      </Tabs>
    </AdminPageWrapper>
  );
}

// ============================================================================
// INBOX TAB
// ============================================================================
function InboxTab() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("open,assigned,waiting");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Thread detail
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/support/threads?${params}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setThreads(json.data || []);
      setTotal(json.total || 0);
    } catch (e: any) {
      toast.error(e?.message || "Error loading threads");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sourceFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const loadThreadMessages = async (thread: SupportThread) => {
    setSelectedThread(thread);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/support/threads/${thread.id}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load messages");
      setThreadMessages(json.messages || []);
      setReplyBody("");
    } catch (e: any) {
      toast.error(e?.message || "Error loading messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendThreadReply = async () => {
    if (!selectedThread) return;
    if (!replyBody.trim()) return;

    if (!(selectedThread.source === "chatbot" || selectedThread.source === "whatsapp")) {
      toast.error("Reply is only enabled for Chatbot/WhatsApp threads right now.");
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/support/threads/${selectedThread.id}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to send reply");
      toast.success("Reply sent");
      setReplyBody("");
      await loadThreadMessages(selectedThread);
    } catch (e: any) {
      toast.error(e?.message || "Error sending reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.set("export", "csv");
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      window.open(`/api/admin/support/threads?${params}`, "_blank");
    } catch (e: any) {
      toast.error("Export failed");
    }
  };

  const handleThreadAction = async (threadId: string, action: string, params: any = {}) => {
    try {
      const res = await fetch("/api/admin/support/threads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, action, ...params }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Action failed");
      toast.success(json.message || "Success");
      loadThreads();
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Thread List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Support Threads</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadThreads}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open,assigned,waiting">Active</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="">All</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sources</SelectItem>
                  <SelectItem value="buyer_seller">Buyer-Seller</SelectItem>
                  <SelectItem value="seller_support">Seller Support</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No threads found
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedThread?.id === thread.id ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => loadThreadMessages(thread)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {sourceLabels[thread.source] || thread.source}
                          </Badge>
                          <Badge
                            className={`text-xs ${statusColors[thread.status]?.bg} ${statusColors[thread.status]?.text}`}
                          >
                            {thread.status}
                          </Badge>
                          <Badge
                            className={`text-xs ${priorityColors[thread.priority]?.bg} ${priorityColors[thread.priority]?.text}`}
                          >
                            {thread.priority}
                          </Badge>
                          {thread.slaBreach && (
                            <Badge variant="destructive" className="text-xs">
                              SLA Breach
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">
                          {thread.subject || "No subject"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {thread.lastMessagePreview || "No messages"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {thread.buyer && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {thread.buyer.email}
                            </span>
                          )}
                          {thread.seller && (
                            <span>→ {thread.seller.brandName}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {thread.messageCount}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{timeAgo(thread.lastMessageAt)}</div>
                        {thread.assignedToEmail && (
                          <div className="mt-1 text-primary">
                            → {thread.assignedToEmail.split("@")[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    {thread.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {thread.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Showing {threads.length} of {total} threads
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={threads.length < 25}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Thread Detail Panel */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Thread Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedThread ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a thread to view details
              </div>
            ) : loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Thread Actions */}
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={selectedThread.status}
                    onValueChange={(status) =>
                      handleThreadAction(selectedThread.id, "status", { status })
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedThread.priority}
                    onValueChange={(priority) =>
                      handleThreadAction(selectedThread.id, "priority", { priority })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Messages */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {threadMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages</p>
                  ) : (
                    threadMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg text-sm ${
                          msg.moderation?.status === "hidden" ||
                          msg.moderation?.status === "deleted"
                            ? "bg-red-50 border border-red-200"
                            : msg.moderation?.status === "redacted"
                            ? "bg-yellow-50 border border-yellow-200"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs">
                            {msg.senderName || msg.senderEmail?.split("@")[0] || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.displayBody}</p>
                        {msg.moderation?.isInternalNote && msg.moderation.internalNoteBody && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                            <strong>Internal Note:</strong> {msg.moderation.internalNoteBody}
                          </div>
                        )}
                        {/* Moderation actions */}
                        {selectedThread.source === "buyer_seller" && (
                          <MessageModerationActions messageId={msg.id} currentModeration={msg.moderation} />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {(selectedThread.source === "chatbot" || selectedThread.source === "whatsapp") && (
                  <div className="space-y-2">
                    <Label>Reply to customer</Label>
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write a reply as Support…"
                      rows={3}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => loadThreadMessages(selectedThread)}
                        disabled={loadingMessages || sendingReply}
                      >
                        Refresh
                      </Button>
                      <Button
                        onClick={sendThreadReply}
                        disabled={sendingReply || !replyBody.trim()}
                      >
                        {sendingReply ? "Sending…" : "Send"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGE MODERATION ACTIONS
// ============================================================================
function MessageModerationActions({
  messageId,
  currentModeration,
}: {
  messageId: string;
  currentModeration: ThreadMessage["moderation"];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleModerate = async () => {
    if (!action) return;
    setLoading(true);
    try {
      const body: any = { action, reason };
      if (action === "addNote") {
        body.internalNote = note;
      }
      if (action === "redact") {
        body.autoRedact = true;
      }

      const res = await fetch(`/api/admin/support/messages/${messageId}/moderate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Action failed");
      toast.success(json.message || "Moderation applied");
      setIsOpen(false);
      // Reload would be handled by parent
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs">
          <MoreHorizontal className="h-3 w-3 mr-1" />
          Moderate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Moderate Message</DialogTitle>
          <DialogDescription>
            Choose a moderation action for this message
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hide">Hide from public</SelectItem>
                <SelectItem value="delete">Soft Delete (Admin only)</SelectItem>
                <SelectItem value="redact">Auto-redact PII (Admin only)</SelectItem>
                <SelectItem value="restore">Restore visibility (Admin only)</SelectItem>
                <SelectItem value="addNote">Add internal note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "addNote" ? (
            <div className="space-y-2">
              <Label>Internal Note</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an internal note..."
                rows={3}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for moderation..."
                rows={2}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleModerate} disabled={!action || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// FLAGS TAB
// ============================================================================
function FlagsTab() {
  const [filter, setFilter] = useState<string>("all");
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("filter", filter);
      const res = await fetch(`/api/admin/support/flags?${params}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setFlags(json.data || []);
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Conversation Flags</CardTitle>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flags</SelectItem>
                <SelectItem value="bypass">Bypass Suspected</SelectItem>
                <SelectItem value="fraud">Fraud Suspected</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadFlags}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          View and manage flagged conversations requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : flags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No flagged conversations
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conversation ID</TableHead>
                <TableHead>Flag Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag: any) => (
                <TableRow key={flag.id || flag.conversationId}>
                  <TableCell className="font-mono text-xs">
                    {(flag.conversationId || "").slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {flag.fraudSuspected && (
                      <Badge variant="destructive">Fraud</Badge>
                    )}
                    {flag.bypassSuspected && (
                      <Badge variant="outline" className="border-orange-500 text-orange-700">
                        Bypass
                      </Badge>
                    )}
                    {flag.escalatedToUserId && (
                      <Badge variant="secondary">Escalated</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {flag.fraudReason || flag.escalationReason || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(flag.fraudDetectedAt || flag.escalatedAt || flag.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CHATBOT QUEUE TAB
// ============================================================================
function ChatbotQueueTab() {
  const [items, setItems] = useState<ChatbotQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/support/chatbot-queue?${params}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setItems(json.data || []);
      setStats(json.stats || {});
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleQueueAction = async (queueId: string, action: string, params: any = {}) => {
    try {
      const res = await fetch("/api/admin/support/chatbot-queue", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, action, ...params }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Action failed");
      toast.success(json.message || "Success");
      loadQueue();
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{stats.processing || 0}</p>
              </div>
              <Loader2 className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Injection Suspected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.promptInjectionSuspected || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chatbot Queue</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="handed_off">Handed Off</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadQueue}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items in queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm">
                        {item.user?.email || "Anonymous"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.intent || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm">{item.userQuery || "-"}</p>
                    </TableCell>
                    <TableCell>
                      {item.confidence ? (
                        <span
                          className={`text-sm ${
                            parseFloat(item.confidence) < 0.5
                              ? "text-red-600"
                              : parseFloat(item.confidence) < 0.8
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {(parseFloat(item.confidence) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusColors[item.status]?.bg} ${statusColors[item.status]?.text}`}
                      >
                        {item.status}
                      </Badge>
                      {item.promptInjectionSuspected && (
                        <Badge variant="destructive" className="ml-1">
                          ⚠️
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{timeAgo(item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQueueAction(item.id, "handoff")}
                              title="Hand off to support"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQueueAction(item.id, "resolve")}
                              title="Mark resolved"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQueueAction(item.id, "reject")}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(item.status === "resolved" || item.status === "rejected") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQueueAction(item.id, "requeue")}
                            title="Requeue"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// WHATSAPP TAB
// ============================================================================
function WhatsAppTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Monitor</CardTitle>
        <CardDescription>
          Monitor WhatsApp webhook events, delivery status, and template usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>WhatsApp integration coming soon</p>
          <p className="text-sm mt-2">
            This section will show delivery tracking, template monitoring, and webhook events
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { useSupportThreadChat, isIncomingMessage } from "@/lib/support-thread-chat-context";
import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Users,
  UserCog,
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
  Package,
  ShoppingBag,
  CreditCard,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  playNewMessageAlert,
  prepareSupportSound,
} from "@/lib/support-notification-sound";

// Types
interface SupportThread {
  id: string;
  source: "buyer_seller" | "seller_support" | "chatbot" | "whatsapp";
  sourceId: string;
  orderId: string | null;
  sellerId: string | null;
  buyerId: string | null;
  status: "open" | "assigned" | "waiting" | "resolved" | "closed" | "active";
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
  displaySubject?: string | null;
  order?: { orderNumber: string; status: string } | null;
}

interface ThreadNote {
  id: string;
  body: string;
  authorId: string | null;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  senderName: string | null;
  senderEmail: string;
  authorDisplayLabel?: string;
  displayBody: string;
  moderation: {
    status: string;
    redactedBody: string | null;
    reason: string | null;
    moderatedAt: string | null;
    isInternalNote: boolean;
    internalNoteBody: string | null;
    moderator?: { id: string; name: string | null; email: string } | null;
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
  active: { bg: "bg-teal-100", text: "text-teal-800" },
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

const statusDisplayLabels: Record<SupportThread["status"], string> = {
  open: "Open",
  assigned: "Assigned",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
  active: "Active",
};

const priorityDisplayLabels: Record<SupportThread["priority"], string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
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

const supportMenuItems = [
  {
    id: "inbox",
    title: "Inbox",
    description: "Toate firele de suport, moderare mesaje, redactare PII, istoric moderare",
    icon: MessageSquare,
    color: "bg-cyan-600",
  },
  {
    id: "flags",
    title: "Flags",
    description: "Conversații flagate: bypass, fraudă, escaladate",
    icon: Flag,
    color: "bg-amber-600",
  },
  {
    id: "chatbot",
    title: "Chatbot",
    description: "Coada de handoff și conversații preluate de bot",
    icon: Bot,
    color: "bg-violet-600",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Conversații și gestionare WhatsApp",
    icon: MessageCircle,
    color: "bg-green-600",
  },
];

const adminPageLinks = [
  { title: "Selleri", description: "Informații, produse și suport pentru vânzători", href: "/admin/sellers", icon: Users, color: "bg-teal-500" },
  { title: "Aplicații vânzători", description: "Cereri de înregistrare vânzători", href: "/admin/seller-applications", icon: Users, color: "bg-blue-500" },
  { title: "Produse", description: "Vizualizare produse platformă", href: "/admin/products", icon: Package, color: "bg-green-500" },
  { title: "Comenzi", description: "Monitorizare comenzi", href: "/admin/orders", icon: ShoppingBag, color: "bg-purple-500" },
  { title: "Payments", description: "Plăți Netopia", href: "/admin/payments", icon: CreditCard, color: "bg-emerald-600" },
  { title: "Utilizatori", description: "Utilizatori și roluri", href: "/admin/users", icon: UserCog, color: "bg-red-500" },
];

export default function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<string>("inbox");

  return (
    <AdminPageWrapper
      title="Support Console"
      description="Unified support inbox, moderation, and chatbot queue management"
      backButtonHref="/"
    >
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Acces funcționalități
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Selectează o funcționalitate pentru a o deschide.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`block w-full text-left p-5 rounded-xl border transition-all ${
                  isActive
                    ? "border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 shadow-md"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${item.color} p-2.5 rounded-lg text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Acces pagini Admin (view)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Link-uri către paginile de administrare (vizualizare).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {adminPageLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block w-full text-left p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`${item.color} p-2.5 rounded-lg text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
  const { user } = useUser();
  const { setSupportThreadChat } = useSupportThreadChat();
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [sourceFilter, setSourceFilter] = useState<string>("all_sources");
  const [priorityFilter, setPriorityFilter] = useState<string>("all_priority");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [myQueueFilter, setMyQueueFilter] = useState<boolean>(false);

  // Thread detail
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [detailThread, setDetailThread] = useState<SupportThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [threadNotes, setThreadNotes] = useState<ThreadNote[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [unreadMessageIds, setUnreadMessageIds] = useState<string[]>([]);
  const [lastInteractionAt, setLastInteractionAt] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const priorityOptimisticUntilRef = useRef<{ threadId: string; priority: SupportThread["priority"]; until: number } | null>(null);
  const assigneeOptimisticUntilRef = useRef<{ threadId: string; assignedToUserId: string | null; assignedToEmail: string | null; until: number } | null>(null);
  const statusOptimisticUntilRef = useRef<{ threadId: string; status: SupportThread["status"]; until: number } | null>(null);
  const selectedThreadRef = useRef<SupportThread | null>(null);
  const pendingRefreshRef = useRef<{ list: boolean; thread: boolean }>({ list: false, thread: false });
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadMessagesRef = useRef<ThreadMessage[]>([]);
  const soundRepeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevThreadsSnapshotRef = useRef<{ id: string; status: string }[] | null>(null);
  const lastPlayedForThreadRef = useRef<{ id: string; at: number } | null>(null);
  const FM_SUPPORT_SOUND_KEY = "fm_support_sound_enabled";

  const markInteraction = useCallback(() => {
    setLastInteractionAt(Date.now());
    setUnreadMessageIds([]);
    if (soundRepeatTimerRef.current) {
      clearInterval(soundRepeatTimerRef.current);
      soundRepeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  useEffect(() => {
    if (!setSupportThreadChat) return;
    setSupportThreadChat({
      threadMessages,
      selectedThread: selectedThread ? { id: selectedThread.id, source: selectedThread.source } : null,
      loadingMessages,
      unreadMessageIds,
      lastInteractionAt,
      markInteraction,
    });
  }, [threadMessages, selectedThread, loadingMessages, unreadMessageIds, lastInteractionAt, markInteraction, setSupportThreadChat]);

  useEffect(() => {
    return () => {
      setSupportThreadChat?.({
        threadMessages: [],
        selectedThread: null,
        loadingMessages: false,
        unreadMessageIds: [],
        lastInteractionAt: null,
      });
    };
  }, [setSupportThreadChat]);

  useEffect(() => {
    threadMessagesRef.current = threadMessages;
  }, [threadMessages]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FM_SUPPORT_SOUND_KEY);
      if (stored !== null) setSoundEnabled(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    prepareSupportSound();
  }, []);

  const threadMatchesFilters = useCallback(
    (t: SupportThread) => {
      if (statusFilter && statusFilter !== "all") {
        const allowed =
          statusFilter === "open"
            ? (["open", "waiting"] as const)
            : statusFilter.split(",").map((s) => s.trim()).filter(Boolean);
        if (allowed.length > 0 && !(allowed as readonly string[]).includes(t.status)) return false;
      }
      if (sourceFilter && sourceFilter !== "all_sources") {
        if (t.source !== sourceFilter) return false;
      }
      if (priorityFilter && priorityFilter !== "all_priority") {
        if (t.priority !== priorityFilter) return false;
      }
      if (myQueueFilter && user?.id) {
        if (t.assignedToUserId !== user.id) return false;
      }
      return true;
    },
    [statusFilter, sourceFilter, priorityFilter, myQueueFilter, user?.id]
  );

  const clearSelection = useCallback(() => {
    setSelectedThread(null);
    setDetailThread(null);
    setThreadMessages([]);
    setThreadNotes([]);
  }, []);

  const loadThreads = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");
      if (myQueueFilter) params.set("myQueue", "true");
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter === "open" ? "open,waiting" : statusFilter);
      if (sourceFilter && sourceFilter !== "all_sources") params.set("source", sourceFilter);
      if (priorityFilter && priorityFilter !== "all_priority") params.set("priority", priorityFilter);

      let url: string;
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
        url = `/api/admin/support/threads/search?${params}`;
      } else {
        url = `/api/admin/support/threads?${params}`;
      }

      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      let updatedThreads = json.data || [];
      const optPriority = priorityOptimisticUntilRef.current;
      if (optPriority && Date.now() < optPriority.until) {
        updatedThreads = updatedThreads.map((t: SupportThread) => {
          if (t.id === optPriority.threadId) {
            return { ...t, priority: optPriority.priority };
          }
          return t;
        });
      }
      const optAssignee = assigneeOptimisticUntilRef.current;
      if (optAssignee && Date.now() < optAssignee.until) {
        updatedThreads = updatedThreads.map((t: SupportThread) => {
          if (t.id === optAssignee.threadId) {
            return {
              ...t,
              assignedToUserId: optAssignee.assignedToUserId,
              assignedToEmail: optAssignee.assignedToEmail,
              assignedToName: null,
            };
          }
          return t;
        });
      }
      const optStatus = statusOptimisticUntilRef.current;
      if (optStatus && Date.now() < optStatus.until) {
        updatedThreads = updatedThreads.map((t: SupportThread) => {
          if (t.id === optStatus.threadId) {
            return { ...t, status: optStatus.status };
          }
          return t;
        });
      }
      updatedThreads = updatedThreads.filter((t: SupportThread) => threadMatchesFilters(t));

      const prev = prevThreadsSnapshotRef.current;
      if (prev !== null && soundEnabled) {
        const prevMap = new Map(prev.map((p) => [p.id, p.status]));
        const newWaiting = updatedThreads.filter(
          (t: SupportThread) =>
            t.status === "waiting" &&
            (!prevMap.has(t.id) || prevMap.get(t.id) !== "waiting")
        );
        const recentlyPlayed = lastPlayedForThreadRef.current;
        const skip = recentlyPlayed && Date.now() - recentlyPlayed.at < 30_000 &&
          newWaiting.some((t: SupportThread) => t.id === recentlyPlayed.id);
        if (newWaiting.length > 0 && !skip) {
          prepareSupportSound();
          playNewMessageAlert();
        }
      }
      prevThreadsSnapshotRef.current = updatedThreads.map((t: SupportThread) => ({
        id: t.id,
        status: t.status,
      }));

      setThreads(updatedThreads);
      setTotal(json.total || 0);
    } catch (e: any) {
      if (!opts?.silent) toast.error(e?.message || "Error loading threads");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [page, statusFilter, sourceFilter, priorityFilter, searchQuery, myQueueFilter, threadMatchesFilters, soundEnabled]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    setSelectedThread(null);
    setDetailThread(null);
    setThreadMessages([]);
    setThreadNotes([]);
    prevThreadsSnapshotRef.current = null;
    if (soundRepeatTimerRef.current) {
      clearInterval(soundRepeatTimerRef.current);
      soundRepeatTimerRef.current = null;
    }
  }, [page, statusFilter, sourceFilter, priorityFilter, searchQuery, myQueueFilter]);

  const refreshThreadMessagesSilent = useCallback(async () => {
    const current = selectedThreadRef.current;
    if (!current) return;
    const threadId = current.id;
    const prev = threadMessagesRef.current;
    const prevIds = new Set(prev.map((m) => m.id));
    try {
      const [detailRes, notesRes] = await Promise.all([
        fetch(`/api/admin/support/threads/${threadId}`, { credentials: "include" }),
        fetch(`/api/admin/support/threads/${threadId}/notes`, { credentials: "include" }),
      ]);
      const detailJson = await detailRes.json();
      const notesJson = await notesRes.json();
      if (!detailRes.ok) return;
      if (selectedThreadRef.current?.id !== threadId) return;
      const sel = selectedThreadRef.current;
      const nextMessages: ThreadMessage[] = detailJson.messages || [];
      const newIncoming = nextMessages.filter(
        (m) => !prevIds.has(m.id) && isIncomingMessage(m)
      );
      const newIncomingIds = newIncoming.map((m) => m.id);
      const isInitialLoad = prev.length === 0;
      if (!isInitialLoad && newIncomingIds.length > 0) {
        if (soundEnabled) {
          prepareSupportSound();
          playNewMessageAlert();
          lastPlayedForThreadRef.current = { id: threadId, at: Date.now() };
        }
        setUnreadMessageIds((u) => [...new Set([...u, ...newIncomingIds])]);
      }
      setThreadMessages(nextMessages);
      let nextDetail: SupportThread = detailJson.thread
        ? { ...sel, ...detailJson.thread }
        : sel;
      const optPriority = priorityOptimisticUntilRef.current;
      if (
        optPriority?.threadId === sel.id &&
        Date.now() < optPriority.until &&
        nextDetail
      ) {
        nextDetail = { ...nextDetail, priority: optPriority.priority };
      }
      const optAssignee = assigneeOptimisticUntilRef.current;
      if (
        optAssignee?.threadId === sel.id &&
        Date.now() < optAssignee.until &&
        nextDetail
      ) {
        nextDetail = {
          ...nextDetail,
          assignedToUserId: optAssignee.assignedToUserId,
          assignedToEmail: optAssignee.assignedToEmail,
          assignedToName: null,
        };
      }
      const optStatus = statusOptimisticUntilRef.current;
      if (
        optStatus?.threadId === sel.id &&
        Date.now() < optStatus.until &&
        nextDetail
      ) {
        nextDetail = { ...nextDetail, status: optStatus.status };
        if (detailJson.thread?.status === optStatus.status) {
          statusOptimisticUntilRef.current = null;
        }
      }
      setDetailThread(nextDetail);
      if (notesRes.ok) setThreadNotes(notesJson.notes || []);
    } catch {
      /* ignore */
    }
  }, [soundEnabled]);

  const runRefreshJob = useCallback(() => {
    const pending = pendingRefreshRef.current;
    pendingRefreshRef.current = { list: false, thread: false };
    refreshTimeoutRef.current = null;
    if (pending.list) loadThreads({ silent: true });
    if (pending.thread && selectedThreadRef.current) refreshThreadMessagesSilent();
  }, [loadThreads, refreshThreadMessagesSilent]);

  const scheduleRefresh = useCallback((opts: { list?: boolean; thread?: boolean }) => {
    if (opts.list) pendingRefreshRef.current = { ...pendingRefreshRef.current, list: true };
    if (opts.thread) pendingRefreshRef.current = { ...pendingRefreshRef.current, thread: true };
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(runRefreshJob, 280);
  }, [runRefreshJob]);

  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        scheduleRefresh({ list: true, thread: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [scheduleRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (soundRepeatTimerRef.current) {
        clearInterval(soundRepeatTimerRef.current);
        soundRepeatTimerRef.current = null;
      }
    };
  }, []);

  const pollIntervalMs = 18_000;
  useEffect(() => {
    if (!selectedThread) return;
    const t = setInterval(refreshThreadMessagesSilent, pollIntervalMs);
    return () => clearInterval(t);
  }, [selectedThread?.id, refreshThreadMessagesSilent]);

  const loadThreadMessages = async (thread: SupportThread) => {
    prepareSupportSound();
    setSelectedThread(thread);
    setDetailThread(null);
    setThreadNotes([]);
    setThreadMessages([]);
    setLoadingMessages(true);
    try {
      if (thread.status === "waiting") {
        const patchRes = await fetch(`/api/admin/support/threads/${thread.id}/status`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "open" }),
        });
        if (patchRes.ok) {
          setThreads((prev) =>
            prev.map((t) => (t.id === thread.id ? { ...t, status: "open" as const } : t))
          );
        }
      }
      const [detailRes, notesRes] = await Promise.all([
        fetch(`/api/admin/support/threads/${thread.id}`, { credentials: "include" }),
        fetch(`/api/admin/support/threads/${thread.id}/notes`, { credentials: "include" }),
      ]);
      const detailJson = await detailRes.json();
      const notesJson = await notesRes.json();
      if (!detailRes.ok) throw new Error(detailJson?.error || "Failed to load messages");
      if (selectedThreadRef.current?.id !== thread.id) return;
      setThreadMessages(detailJson.messages || []);
      let nextDetail: SupportThread = detailJson.thread ? { ...thread, ...detailJson.thread } : thread;
      const optPriority = priorityOptimisticUntilRef.current;
      if (optPriority?.threadId === thread.id && Date.now() < optPriority.until) {
        nextDetail = { ...nextDetail, priority: optPriority.priority };
      }
      const optAssignee = assigneeOptimisticUntilRef.current;
      if (optAssignee?.threadId === thread.id && Date.now() < optAssignee.until) {
        nextDetail = {
          ...nextDetail,
          assignedToUserId: optAssignee.assignedToUserId,
          assignedToEmail: optAssignee.assignedToEmail,
          assignedToName: null,
        };
      }
      const optStatus = statusOptimisticUntilRef.current;
      if (optStatus?.threadId === thread.id && Date.now() < optStatus.until) {
        nextDetail = { ...nextDetail, status: optStatus.status };
      }
      setDetailThread(nextDetail);
      setThreadNotes(notesRes.ok ? notesJson.notes || [] : []);
      setNoteBody("");
      setLoadingMessages(false);
      markInteraction();
    } catch (e: any) {
      toast.error(e?.message || "Error loading messages");
      setLoadingMessages(false);
    }
  };

  const fetchNotes = async () => {
    if (!selectedThread) return;
    try {
      const res = await fetch(`/api/admin/support/threads/${selectedThread.id}/notes`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok) setThreadNotes(json.notes || []);
    } catch {
      /* ignore */
    }
  };


  const handlePatchStatus = async (threadId: string, status: string) => {
    const prev = threads.find((t) => t.id === threadId)?.status;
    const s = status as SupportThread["status"];
    const thread = threads.find((t) => t.id === threadId);
    const updatedThread = thread ? { ...thread, status: s } : null;
    const stillMatches = updatedThread ? threadMatchesFilters(updatedThread) : false;
    const wasSelected = selectedThread?.id === threadId;

    statusOptimisticUntilRef.current = { threadId, status: s, until: Date.now() + 4000 };
    setThreads((prevList) => {
      const updated = prevList.map((t) => (t.id === threadId ? { ...t, status: s } : t));
      return updated.filter((t) => threadMatchesFilters(t));
    });
    if (stillMatches && wasSelected) {
      setSelectedThread((t) => (t ? { ...t, status: s } : null));
      setDetailThread((t) => (t ? { ...t, status: s } : null));
    } else if (!stillMatches && wasSelected) {
      clearSelection();
    }
    try {
      const res = await fetch(`/api/admin/support/threads/${threadId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        statusOptimisticUntilRef.current = null;
        throw new Error(json?.error || "Failed");
      }
      statusOptimisticUntilRef.current = null;
      toast.success("Status updated");
      markInteraction();
      scheduleRefresh({ list: true, thread: true });
    } catch (e: any) {
      statusOptimisticUntilRef.current = null;
      if (typeof prev !== "undefined" && thread) {
        const reverted = { ...thread, status: prev };
        setThreads((prevList) => {
          const filtered = prevList.filter((t) => t.id !== threadId);
          if (threadMatchesFilters(reverted)) {
            return [...filtered, reverted].sort(
              (a, b) =>
                new Date(b.lastMessageAt ?? 0).getTime() -
                new Date(a.lastMessageAt ?? 0).getTime()
            );
          }
          return filtered;
        });
        if (wasSelected) void loadThreadMessages(reverted);
      }
      toast.error(e?.message || "Error");
    }
  };

  const handlePatchAssignee = async (threadId: string, assigneeId: string | null) => {
    const prevThread = threads.find((t) => t.id === threadId);
    const isUnassign = !assigneeId || assigneeId === null;
    const resolvedAssigneeId = assigneeId === "me" && user ? user.id : assigneeId;
    const resolvedAssigneeEmail = assigneeId === "me" && user ? user.email : null;
    const updatedThread = prevThread
      ? {
          ...prevThread,
          assignedToUserId: isUnassign ? null : resolvedAssigneeId,
          assignedToName: null,
          assignedToEmail: isUnassign ? null : resolvedAssigneeEmail,
        }
      : null;
    const stillMatches = updatedThread ? threadMatchesFilters(updatedThread) : false;
    const wasSelected = selectedThread?.id === threadId;

    assigneeOptimisticUntilRef.current = {
      threadId,
      assignedToUserId: isUnassign ? null : resolvedAssigneeId,
      assignedToEmail: isUnassign ? null : resolvedAssigneeEmail,
      until: Date.now() + 4000,
    };
    setThreads((prev) => {
      const updated = prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              assignedToUserId: isUnassign ? null : resolvedAssigneeId,
              assignedToName: null,
              assignedToEmail: isUnassign ? null : resolvedAssigneeEmail,
            }
          : t
      );
      return updated.filter((t) => threadMatchesFilters(t));
    });
    if (stillMatches && wasSelected) {
      setSelectedThread((t) =>
        t ? { ...t, assignedToUserId: isUnassign ? null : resolvedAssigneeId, assignedToName: null, assignedToEmail: isUnassign ? null : resolvedAssigneeEmail } : null
      );
      setDetailThread((t) =>
        t ? { ...t, assignedToUserId: isUnassign ? null : resolvedAssigneeId, assignedToName: null, assignedToEmail: isUnassign ? null : resolvedAssigneeEmail } : null
      );
    } else if (!stillMatches && wasSelected) {
      clearSelection();
    }
    try {
      const res = await fetch(`/api/admin/support/threads/${threadId}/assignee`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      const json = await res.json();
      if (!res.ok) {
        assigneeOptimisticUntilRef.current = null;
        throw new Error(json?.error || "Failed");
      }
      toast.success(assigneeId ? "Assigned" : "Unassigned");
      markInteraction();
      scheduleRefresh({ list: true, thread: true });
    } catch (e: any) {
      assigneeOptimisticUntilRef.current = null;
      if (prevThread) {
        setThreads((prev) => {
          const filtered = prev.filter((t) => t.id !== threadId);
          if (threadMatchesFilters(prevThread)) {
            return [...filtered, prevThread].sort(
              (a, b) =>
                new Date(b.lastMessageAt ?? 0).getTime() -
                new Date(a.lastMessageAt ?? 0).getTime()
            );
          }
          return filtered;
        });
        if (wasSelected) void loadThreadMessages(prevThread);
      }
      toast.error(e?.message || "Error");
    }
  };

  const handleAddNote = async () => {
    if (!selectedThread || !noteBody.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/support/threads/${selectedThread.id}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      toast.success("Note added");
      setNoteBody("");
      await fetchNotes();
      markInteraction();
      scheduleRefresh({ thread: true });
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setAddingNote(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.set("export", "csv");
      if (myQueueFilter) params.set("myQueue", "true");
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter === "open" ? "open,waiting" : statusFilter);
      if (sourceFilter && sourceFilter !== "all_sources") params.set("source", sourceFilter);
      window.open(`/api/admin/support/threads?${params}`, "_blank");
    } catch (e: any) {
      toast.error("Export failed");
    }
  };

  const handleThreadAction = async (threadId: string, action: string, params: any = {}) => {
    if (action === "priority" && typeof params.priority === "string") {
      const p = params.priority as SupportThread["priority"];
      const thread = threads.find((t) => t.id === threadId);
      const prev = thread?.priority;
      const updatedThread = thread ? { ...thread, priority: p } : null;
      const stillMatches = updatedThread ? threadMatchesFilters(updatedThread) : false;
      const wasSelected = selectedThread?.id === threadId;

      priorityOptimisticUntilRef.current = { threadId, priority: p, until: Date.now() + 4000 };
      setThreads((ps) => {
        const updated = ps.map((t) => (t.id === threadId ? { ...t, priority: p } : t));
        return updated.filter((t) => threadMatchesFilters(t));
      });
      if (stillMatches && wasSelected) {
        setSelectedThread((t) => (t ? { ...t, priority: p } : null));
        setDetailThread((t) => (t ? { ...t, priority: p } : null));
      } else if (!stillMatches && wasSelected) {
        clearSelection();
      }
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
        markInteraction();
        scheduleRefresh({ list: true, thread: true });
      } catch (e: any) {
        priorityOptimisticUntilRef.current = null;
        if (typeof prev !== "undefined" && thread) {
          const reverted = { ...thread, priority: prev };
          setThreads((ps) => {
            const filtered = ps.filter((t) => t.id !== threadId);
            if (threadMatchesFilters(reverted)) {
              return [...filtered, reverted].sort(
                (a, b) =>
                  new Date(b.lastMessageAt ?? 0).getTime() -
                  new Date(a.lastMessageAt ?? 0).getTime()
              );
            }
            return filtered;
          });
          if (wasSelected) void loadThreadMessages(reverted);
        }
        toast.error(e?.message || "Error");
      }
      return;
    }
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
      markInteraction();
      scheduleRefresh({ list: true, thread: true });
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  };

  const runRefreshNow = useCallback(() => {
    loadThreads();
    if (selectedThreadRef.current) refreshThreadMessagesSilent();
  }, [loadThreads, refreshThreadMessagesSilent]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Inbox • incl. Moderation & Audit
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)]">
        {/* Thread List */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Support Threads</CardTitle>
              <div className="flex items-center gap-2">
                {(user?.role === "support" || user?.role === "admin") && (
                  <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" aria-hidden />
                    ) : (
                      <VolumeX className="h-4 w-4" aria-hidden />
                    )}
                    <Switch
                      checked={soundEnabled}
                      onCheckedChange={(v) => {
                        setSoundEnabled(v);
                        try {
                          localStorage.setItem(FM_SUPPORT_SOUND_KEY, String(v));
                        } catch {
                          /* ignore */
                        }
                        if (v) {
                          prepareSupportSound();
                          playNewMessageAlert();
                        }
                      }}
                      aria-label="Alert sound for new messages"
                    />
                  </label>
                )}
                <Button variant="outline" size="sm" onClick={runRefreshNow}>
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sourceFilter}
                onValueChange={(v) => {
                  setSourceFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_sources">All Sources</SelectItem>
                  <SelectItem value="buyer_seller">Buyer-Seller</SelectItem>
                  <SelectItem value="seller_support">Seller Support</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(v) => {
                  setPriorityFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_priority">All</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <Checkbox
                  checked={myQueueFilter}
                  onCheckedChange={(v) => {
                    setMyQueueFilter(!!v);
                    setPage(1);
                  }}
                />
                My queue
              </label>
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
                    className={`p-3 rounded-lg border cursor-pointer transition-all border-slate-200 dark:border-white/10 ${
                      thread.status === "waiting"
                        ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 bg-amber-50 dark:bg-amber-950/40 border-amber-400 animate-attention-flash hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        : selectedThread?.id === thread.id
                        ? unreadMessageIds.length > 0
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 bg-blue-50 dark:bg-blue-950/40 border-blue-400 animate-unread-pulse hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          : "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900 bg-primary/10 dark:bg-primary/20 border-primary hover:bg-primary/15 dark:hover:bg-primary/25"
                        : "hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                    onClick={() => loadThreadMessages(thread)}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        className={`text-xs ${statusColors[thread.status]?.bg} ${statusColors[thread.status]?.text}`}
                      >
                        {statusDisplayLabels[thread.status] ?? thread.status}
                      </Badge>
                      <Badge
                        className={`text-xs ${priorityColors[thread.priority]?.bg} ${priorityColors[thread.priority]?.text}`}
                      >
                        {priorityDisplayLabels[thread.priority] ?? thread.priority}
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          thread.assignedToUserId || thread.assignedToEmail
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {thread.assignedToUserId || thread.assignedToEmail
                          ? thread.assignedToEmail
                            ? `Assigned to ${thread.assignedToEmail.split("@")[0]}`
                            : "Assigned"
                          : "Unassigned"}
                      </Badge>
                    </div>
                    {thread.slaBreach && (
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="destructive" className="text-xs">
                          SLA Breach
                        </Badge>
                      </div>
                    )}
                    <p className="font-medium text-sm truncate">
                      {thread.displaySubject ?? thread.subject ?? "No subject"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {thread.lastMessagePreview || "No messages"}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3 min-w-0">
                        {thread.buyer && (
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 shrink-0" />
                            {thread.buyer.email}
                          </span>
                        )}
                        {thread.seller && (
                          <span className="shrink-0">→ {thread.seller.brandName}</span>
                        )}
                        <span className="flex items-center gap-1 shrink-0">
                          <MessageSquare className="h-3 w-3" />
                          {thread.messageCount}
                        </span>
                      </div>
                      <span className="shrink-0">{timeAgo(thread.lastMessageAt)}</span>
                    </div>
                    {thread.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
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

      {/* Conversație */}
      <Card className="flex flex-col min-h-[400px] max-h-[60vh] lg:max-h-[calc(100vh-12rem)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Conversație</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          {!selectedThread ? (
            <div className="flex-1 min-h-[200px]" aria-hidden="true" />
          ) : loadingMessages ? (
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {(() => {
                const t = detailThread ?? selectedThread;
                return t ? (
                  <>
                    <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2 border-b border-slate-200 dark:border-white/10 shrink-0">
                      <Select
                        value={t.status}
                        onValueChange={(status) => handlePatchStatus(t.id, status)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            ["open", "resolved", "closed"] as const
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusDisplayLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={t.priority}
                        onValueChange={(priority) =>
                          handleThreadAction(t.id, "priority", { priority })
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["low", "normal", "high", "urgent"] as const).map((p) => (
                            <SelectItem key={p} value={p}>
                              {priorityDisplayLabels[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePatchAssignee(t.id, t.assignedToUserId ? null : "me")}
                      >
                        {t.assignedToUserId ? "Unassign" : "Assign to me"}
                      </Button>
                    </div>
                    <div className="space-y-2 px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
                      <Label className="text-xs font-medium text-muted-foreground">Internal notes</Label>
                      {threadNotes.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {threadNotes.map((n) => (
                            <div
                              key={n.id}
                              className="rounded-lg border border-slate-200 dark:border-white/10 p-2 text-sm bg-slate-50 dark:bg-slate-900/40"
                            >
                              <p className="whitespace-pre-wrap">{n.body}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {n.authorName || n.authorEmail || "—"} · {formatDate(n.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add internal note…"
                          value={noteBody}
                          onChange={(e) => setNoteBody(e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddNote}
                          disabled={addingNote || !noteBody.trim()}
                        >
                          {addingNote ? "…" : "Add"}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null;
              })()}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900/30 min-h-[200px]"
                onClick={markInteraction}
              >
                {threadMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages</p>
                ) : (
                threadMessages.map((msg) => {
                  const unread = isIncomingMessage(msg) && unreadMessageIds.includes(msg.id);
                  return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.moderation?.status === "hidden" ||
                      msg.moderation?.status === "deleted"
                        ? "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
                        : msg.moderation?.status === "redacted"
                        ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900/50"
                        : unread
                        ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-primary animate-unread-pulse"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs">
                        {msg.authorDisplayLabel ?? msg.senderName ?? msg.senderEmail?.split("@")[0] ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.displayBody}</p>
                    {msg.moderation?.status && msg.moderation.status !== "visible" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {msg.moderation.status === "hidden" && "Hidden"}
                        {msg.moderation.status === "deleted" && "Deleted"}
                        {msg.moderation.status === "redacted" && "Redacted"}
                        {" by "}
                        {msg.moderation.moderator?.name || msg.moderation.moderator?.email || "—"}
                        {msg.moderation.moderatedAt && ` on ${formatDate(msg.moderation.moderatedAt)}`}
                      </p>
                    )}
                    {msg.moderation?.isInternalNote && msg.moderation.internalNoteBody && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-800 dark:text-blue-200">
                        <strong>Internal Note:</strong> {msg.moderation.internalNoteBody}
                      </div>
                    )}
                    {selectedThread.source === "buyer_seller" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {!["hidden", "deleted", "redacted"].includes(msg.moderation?.status ?? "") && (
                          <PIIQuickActions
                            messageId={msg.id}
                            onSuccess={() => {
                              markInteraction();
                              scheduleRefresh({ thread: true });
                            }}
                          />
                        )}
                        <MessageModerationActions
                          messageId={msg.id}
                          currentModeration={msg.moderation}
                          onModerationSuccess={() => {
                            markInteraction();
                            scheduleRefresh({ thread: true });
                          }}
                        />
                      </div>
                    )}
                  </div>
                  );
                })
              )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

// ============================================================================
// PII QUICK ACTIONS
// ============================================================================
function PIIQuickActions({
  messageId,
  onSuccess,
}: {
  messageId: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRedact = async (pattern: "email" | "phone" | "iban" | "cnp" | "all") => {
    setLoading(pattern);
    try {
      const res = await fetch(`/api/admin/support/messages/${messageId}/redact`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Redact failed");
      toast.success("PII redacted");
      onSuccess?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  };

  const patterns: { pattern: "email" | "phone" | "iban" | "cnp" | "all"; label: string }[] = [
    { pattern: "email", label: "Redact email" },
    { pattern: "phone", label: "Redact phone" },
    { pattern: "all", label: "Redact all PII" },
  ];

  return (
    <span className="flex flex-wrap gap-1">
      {patterns.map(({ pattern, label }) => (
        <Button
          key={pattern}
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          onClick={() => handleRedact(pattern)}
          disabled={!!loading}
        >
          {loading === pattern ? "…" : label}
        </Button>
      ))}
    </span>
  );
}

// ============================================================================
// MESSAGE MODERATION ACTIONS
// ============================================================================
function MessageModerationActions({
  messageId,
  currentModeration,
  onModerationSuccess,
}: {
  messageId: string;
  currentModeration: ThreadMessage["moderation"];
  onModerationSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const needsReason = ["hide", "delete", "redact"].includes(action);
  const canApply =
    !!action &&
    (action === "addNote" ? !!note.trim() : needsReason ? !!reason.trim() : true);

  const handleModerate = async () => {
    if (!canApply) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = { action, reason: reason.trim() || undefined };
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
      onModerationSuccess?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
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
              <Label>Reason {needsReason ? "(required)" : "(optional)"}</Label>
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
          <Button onClick={handleModerate} disabled={!canApply || loading}>
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

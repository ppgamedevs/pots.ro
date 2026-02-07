"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/lib/hooks/useUser";
import { captureException } from "@/lib/sentry";
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
import { useChatRealtime, type ChatEvent } from '@/lib/hooks/useChatRealtime';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

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
  closedBy?: { id: string; displayId: string | null; name: string | null; email: string; role: string | null } | null;
  resolvedBy?: { id: string; displayId: string | null; name: string | null; email: string; role: string | null } | null;
}

function getUserDisplayLabel(u?: { displayId: string | null; name: string | null; email: string }): string {
  if (!u) return "";
  if (u.displayId && u.displayId.trim().length > 0) return u.displayId;
  if (u.name && u.name.trim().length > 0) return u.name;
  if (u.email && u.email.trim().length > 0) return u.email;
  return "";
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
  threadStatus?: SupportThread["status"] | null;
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
  { title: "Onboarding Selleri", description: "Caută selleri blocați în onboarding", href: "/admin/sellers?status=onboarding", icon: Clock, color: "bg-amber-500" },
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [closedResolvedByFilter, setClosedResolvedByFilter] = useState<string>("all_closed_resolved_by");

  // Thread detail
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [threadNotes, setThreadNotes] = useState<ThreadNote[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [unreadMessageIds, setUnreadMessageIds] = useState<string[]>([]);
  const [lastInteractionAt, setLastInteractionAt] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName?: string }>>([]);
  const priorityOptimisticUntilRef = useRef<{ threadId: string; priority: SupportThread["priority"]; until: number } | null>(null);
  const assigneeOptimisticUntilRef = useRef<{ threadId: string; assignedToUserId: string | null; assignedToEmail: string | null; until: number } | null>(null);
  const statusOptimisticUntilRef = useRef<{ threadId: string; status: SupportThread["status"]; until: number } | null>(null);
  const selectedThreadRef = useRef<SupportThread | null>(null);
  const pendingRefreshRef = useRef<{ list: boolean; thread: boolean }>({ list: false, thread: false });
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReopeningRef = useRef<boolean>(false);
  const threadMessagesRef = useRef<ThreadMessage[]>([]);
  const soundRepeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevThreadsSnapshotRef = useRef<{ id: string; status: string }[] | null>(null);
  const lastPlayedForThreadRef = useRef<{ id: string; at: number } | null>(null);
  const threadDetailRequestIdRef = useRef(0);
  const reopenRedirectThreadIdRef = useRef<string | null>(null);
  const FM_SUPPORT_SOUND_KEY = "fm_support_sound_enabled";
  const lastSSEEventTimeRef = useRef<number | null>(null);
  const fallbackPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadingThreadsRef = useRef<boolean>(false);
  const newMessagePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckedWaitingCountRef = useRef<number>(0);
  const isUpdatingStatusRef = useRef<boolean>(false);

  const closedResolvedUsers = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const t of threads) {
      if (t.status === "closed" && t.closedBy?.id) {
        const label = getUserDisplayLabel(t.closedBy);
        if (label) {
          map.set(t.closedBy.id, { id: t.closedBy.id, label });
        }
      }
      if (t.status === "resolved" && t.resolvedBy?.id) {
        const label = getUserDisplayLabel(t.resolvedBy);
        if (label) {
          map.set(t.resolvedBy.id, { id: t.resolvedBy.id, label });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [threads]);

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
      if (closedResolvedByFilter && closedResolvedByFilter !== "all_closed_resolved_by") {
        const selectedId = closedResolvedByFilter;
        const closedId = t.closedBy?.id ?? null;
        const resolvedId = t.resolvedBy?.id ?? null;
        if (closedId !== selectedId && resolvedId !== selectedId) return false;
      }
      return true;
    },
    [statusFilter, sourceFilter, closedResolvedByFilter, user?.id]
  );

  const clearSelection = useCallback(() => {
    setSelectedThread(null);
    setThreadMessages([]);
    setThreadNotes([]);
    // Synchronously update ref to prevent race conditions
    selectedThreadRef.current = null;
  }, []);

  const loadThreads = useCallback(async (opts?: { silent?: boolean; overrideStatusFilter?: string; overridePage?: number }) => {
    // Prevent concurrent calls - if already loading, skip this call
    if (isLoadingThreadsRef.current) {
      console.log('[loadThreads] Skipping - already loading');
      return;
    }
    
    // Skip if page is not visible (user switched tabs/window)
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      console.log('[loadThreads] Skipping - page not visible');
      return;
    }
    
    isLoadingThreadsRef.current = true;
    try {
      if (!opts?.silent) setLoading(true);
      const params = new URLSearchParams();
      // Use override values if provided, otherwise use state values
      const effectivePage = opts?.overridePage !== undefined ? opts.overridePage : page;
      const effectiveStatusFilter = opts?.overrideStatusFilter !== undefined ? opts.overrideStatusFilter : statusFilter;
      params.set("page", String(effectivePage));
      params.set("limit", "25");
      if (effectiveStatusFilter && effectiveStatusFilter !== "all") params.set("status", effectiveStatusFilter === "open" ? "open,waiting" : effectiveStatusFilter);
      if (sourceFilter && sourceFilter !== "all_sources") params.set("source", sourceFilter);
      if (closedResolvedByFilter && closedResolvedByFilter !== "all_closed_resolved_by") {
        params.set("closedResolvedByUserId", closedResolvedByFilter);
      }

      let url: string;
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
        url = `/api/admin/support/threads/search?${params}`;
      } else {
        url = `/api/admin/support/threads?${params}`;
      }

      const fetchStartTime = Date.now();
      console.log('[loadThreads] Fetching threads:', { url, silent: opts?.silent, timestamp: fetchStartTime });
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      const fetchEndTime = Date.now();
      console.log('[loadThreads] Fetch completed:', { 
        url, 
        status: res.status, 
        duration: fetchEndTime - fetchStartTime,
        timestamp: fetchEndTime
      });
      const json = await res.json();
      const parseEndTime = Date.now();
      console.log('[loadThreads] Response parsed:', {
        threadCount: json.data?.length || 0,
        total: json.total,
        waitingCount: json.data?.filter((t: SupportThread) => t.status === 'waiting').length || 0,
        parseDuration: parseEndTime - fetchEndTime,
        timestamp: parseEndTime
      });
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
      const reopenId = reopenRedirectThreadIdRef.current;
      if (reopenId != null && selectedThreadRef.current?.id === reopenId) {
        const reopened = selectedThreadRef.current;
        const exists = updatedThreads.some((t: SupportThread) => t.id === reopenId);
        if (!exists && reopened) {
          const withOpen = { ...reopened, status: "open" as const, closedBy: null, resolvedBy: null };
          updatedThreads = [withOpen, ...updatedThreads];
        }
        reopenRedirectThreadIdRef.current = null;
      }
      // Use effective filter values (override if provided, otherwise state) for filtering
      // This ensures that when override values are provided, we filter using those instead of current state
      const effectiveStatusFilterForFiltering = opts?.overrideStatusFilter !== undefined ? opts.overrideStatusFilter : statusFilter;
      const filterFunction = (t: SupportThread) => {
        if (effectiveStatusFilterForFiltering && effectiveStatusFilterForFiltering !== "all") {
          const allowed =
            effectiveStatusFilterForFiltering === "open"
              ? (["open", "waiting"] as const)
              : effectiveStatusFilterForFiltering.split(",").map((s) => s.trim()).filter(Boolean);
          if (allowed.length > 0 && !(allowed as readonly string[]).includes(t.status)) return false;
        }
        if (sourceFilter && sourceFilter !== "all_sources") {
          if (t.source !== sourceFilter) return false;
        }
        if (closedResolvedByFilter && closedResolvedByFilter !== "all_closed_resolved_by") {
          const selectedId = closedResolvedByFilter;
          const closedId = t.closedBy?.id ?? null;
          const resolvedId = t.resolvedBy?.id ?? null;
          if (closedId !== selectedId && resolvedId !== selectedId) return false;
        }
        return true;
      };
      updatedThreads = updatedThreads.filter(filterFunction);

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

      // Keep the currently selected thread's status stable across list refreshes
      // only for the Open filter (open+waiting) to avoid flickering.
      // For other filters (e.g. Closed/Resolved), we trust the backend and do not
      // overwrite statuses, so explicit changes like Open -> Closed/Resolved stick.
      const selected = selectedThreadRef.current;
      // Use effectiveStatusFilter (already defined above) for the check
      if (
        selected &&
        effectiveStatusFilter === "open" &&
        (selected.status === "open" || selected.status === "waiting")
      ) {
        // Only overwrite if the thread actually exists in the fetched results
        // This prevents overwriting threads that were changed to closed/resolved
        const threadExistsInResults = updatedThreads.some((t: SupportThread) => t.id === selected.id);
        if (threadExistsInResults) {
          // Check if there's an optimistic status update that should take precedence
          const optStatus = statusOptimisticUntilRef.current;
          const hasRecentStatusChange = optStatus && 
            optStatus.threadId === selected.id && 
            Date.now() < optStatus.until &&
            (optStatus.status === "closed" || optStatus.status === "resolved");
          
          // Don't overwrite if there's a recent status change to closed/resolved
          if (!hasRecentStatusChange) {
            updatedThreads = updatedThreads.map((t: SupportThread) =>
              t.id === selected.id ? { ...t, status: selected.status } : t
            );
          }
        }
      }

      setThreads(updatedThreads);
      setTotal(json.total || 0);
      
      // Initialize waiting message count for polling detection
      // This helps detect new messages when user is on resolved/closed status
      if (effectiveStatusFilter === "open" || effectiveStatusFilter === "all") {
        // Count waiting threads in the current results
        const waitingCount = updatedThreads.filter((t: SupportThread) => t.status === "waiting").length;
        // If we're on page 1 and have results, use the total from API for accuracy
        if (effectivePage === 1 && json.total !== undefined) {
          // For open filter, we need to count waiting threads separately
          // Since open filter shows both open and waiting, we need to check the total waiting count
          // We'll use a separate API call or estimate based on current results
          // For now, use the count from current page results as baseline
          lastCheckedWaitingCountRef.current = waitingCount;
        } else {
          // For subsequent pages, accumulate or use current count
          lastCheckedWaitingCountRef.current = Math.max(lastCheckedWaitingCountRef.current, waitingCount);
        }
      }
    } catch (e: any) {
      if (!opts?.silent) toast.error(e?.message || "Error loading threads");
    } finally {
      if (!opts?.silent) setLoading(false);
      isLoadingThreadsRef.current = false;
    }
  }, [page, statusFilter, sourceFilter, closedResolvedByFilter, searchQuery, threadMatchesFilters, soundEnabled]);

  useEffect(() => {
    // Skip automatic loadThreads if we're in the middle of a reopen operation
    // (to avoid duplicate API calls - reopen already calls loadThreads explicitly)
    if (isReopeningRef.current) {
      // Don't reset flag here - it will be reset after state updates are processed
      // in handlePatchStatus after setStatusFilter/setPage are called
      return;
    }
    // Skip if we're updating a status (to prevent reverting optimistic updates)
    if (isUpdatingStatusRef.current) {
      return;
    }
    // Skip if page is not visible
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    // Debounce rapid callback changes to prevent multiple simultaneous calls
    // Note: We allow loads for all statuses including resolved/closed when user explicitly changes filter
    const timeoutId = setTimeout(() => {
      loadThreads();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [loadThreads]);

  useEffect(() => {
    const reopening = reopenRedirectThreadIdRef.current != null;
    if (!reopening) {
      setSelectedThread(null);
      setThreadMessages([]);
      setThreadNotes([]);
    }
    prevThreadsSnapshotRef.current = null;
    if (soundRepeatTimerRef.current) {
      clearInterval(soundRepeatTimerRef.current);
      soundRepeatTimerRef.current = null;
    }
  }, [page, statusFilter, sourceFilter, closedResolvedByFilter, searchQuery]);

  const refreshThreadMessagesSilent = useCallback(async () => {
    const current = selectedThreadRef.current;
    if (!current) return;
    const threadId = current.id;
    const requestId = ++threadDetailRequestIdRef.current;
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
      if (threadDetailRequestIdRef.current !== requestId) return;
      if (selectedThreadRef.current?.id !== threadId) return;
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
        // Trigger thread list refresh when incoming messages detected
        // Skip if viewing resolved/closed status (new messages don't affect these views)
        if (statusFilter !== "resolved" && statusFilter !== "closed") {
          loadThreads({ silent: true });
        }
      }
      setThreadMessages(nextMessages);
      if (notesRes.ok) setThreadNotes(notesJson.notes || []);
    } catch {
      /* ignore */
    }
  }, [soundEnabled, loadThreads]);

  const runRefreshJob = useCallback(() => {
    const pending = pendingRefreshRef.current;
    pendingRefreshRef.current = { list: false, thread: false };
    refreshTimeoutRef.current = null;
    // Skip list refresh if viewing resolved/closed status (new messages don't affect these views)
    if (pending.list && statusFilter !== "resolved" && statusFilter !== "closed") {
      loadThreads({ silent: true });
    }
    if (pending.thread && selectedThreadRef.current) refreshThreadMessagesSilent();
  }, [loadThreads, refreshThreadMessagesSilent, statusFilter]);

  const scheduleRefresh = useCallback((opts: { list?: boolean; thread?: boolean }) => {
    // Skip scheduling refresh if we're in the middle of a reopen operation
    // (reopen has its own 1-second delayed refresh)
    if (isReopeningRef.current) {
      return;
    }
    // Skip scheduling refresh if we're updating a status (to prevent reverting optimistic updates)
    if (isUpdatingStatusRef.current && opts.list) {
      // Only skip list refresh, allow thread refresh
      if (opts.thread) {
        pendingRefreshRef.current = { ...pendingRefreshRef.current, thread: true };
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
          refreshTimeoutRef.current = null;
          if (pendingRefreshRef.current.thread && selectedThreadRef.current) {
            refreshThreadMessagesSilent();
          }
          pendingRefreshRef.current = { list: false, thread: false };
        }, 280);
      }
      return;
    }
    if (opts.list) pendingRefreshRef.current = { ...pendingRefreshRef.current, list: true };
    if (opts.thread) pendingRefreshRef.current = { ...pendingRefreshRef.current, thread: true };
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(runRefreshJob, 280);
  }, [runRefreshJob, refreshThreadMessagesSilent]);

  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        // Skip refresh if viewing resolved/closed status (new messages don't affect these views)
        if (statusFilter !== "resolved" && statusFilter !== "closed") {
          scheduleRefresh({ list: true, thread: true });
        } else {
          // Only refresh thread messages, not the list
          scheduleRefresh({ list: false, thread: true });
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [scheduleRefresh, statusFilter]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (soundRepeatTimerRef.current) {
        clearInterval(soundRepeatTimerRef.current);
        soundRepeatTimerRef.current = null;
      }
    };
  }, []);

  // Subscribe to Server-Sent Events for real-time thread list updates
  useEffect(() => {
    // Only attempt SSE connection if user is authenticated and has proper role
    if (!user || !['admin', 'support'].includes(user.role)) {
      console.warn('[SSE Frontend] Skipping SSE connection - user not authenticated or insufficient role:', {
        hasUser: !!user,
        userRole: user?.role,
        timestamp: Date.now()
      });
      return;
    }

    console.log('[SSE Frontend] useEffect triggered - setting up SSE connection', {
      userId: user.id,
      userRole: user.role,
      timestamp: Date.now()
    });
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 1000; // Start with 1 second

    const connectSSE = () => {
      try {
        console.log('[SSE Frontend] Attempting to connect...', { 
          attempt: reconnectAttempts + 1,
          maxAttempts: maxReconnectAttempts,
          userId: user.id,
          userRole: user.role,
          timestamp: Date.now()
        });
        
        // EventSource automatically includes credentials (cookies) for same-origin requests
        eventSource = new EventSource('/api/admin/support/threads/events');
        
        console.log('[SSE Frontend] EventSource created:', {
          url: '/api/admin/support/threads/events',
          readyState: eventSource.readyState,
          timestamp: Date.now()
        });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
              const eventReceivedAt = Date.now();
              const delayFromEvent = eventReceivedAt - data.timestamp;
              console.log('[SSE Frontend] Received new_message event:', { 
                threadId: data.threadId, 
                status: data.status, 
                timestamp: data.timestamp,
                eventReceivedAt,
                delayFromEvent,
                totalDelayFromWebhook: delayFromEvent
              });
              // Update last SSE event time for fallback polling detection
              lastSSEEventTimeRef.current = eventReceivedAt;
              // Reset reconnect attempts on successful message
              reconnectAttempts = 0;
              // Play sound for ALL new messages, regardless of filter or page
              if (soundEnabled) {
                prepareSupportSound();
                playNewMessageAlert();
              }
              
              // Skip refresh if we're in the middle of a reopen operation
              // (reopen has its own half-second delayed refresh)
              if (isReopeningRef.current) {
                console.log('[SSE Frontend] Skipping loadThreads - reopen in progress');
                return;
              }
              
              // If viewing resolved or closed status, don't refresh list
              // New messages change thread status to waiting/open, which don't match these filters
              // User can manually switch to "open" status to see new messages
              if (statusFilter === "resolved" || statusFilter === "closed") {
                console.log('[SSE Frontend] New message detected while on resolved/closed - sound played, skipping list refresh');
                return;
              }
              // Clear any pending refresh to prevent duplicate calls
              if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
              }
              pendingRefreshRef.current = { list: false, thread: false };
              // Trigger thread list refresh immediately for webhook-triggered events
              // This ensures all online support users see new messages as quickly as possible
              const refreshStartTime = Date.now();
              console.log('[SSE Frontend] Calling loadThreads immediately:', {
                threadId: data.threadId,
                delayFromEvent,
                totalDelayFromWebhook: refreshStartTime - data.timestamp
              });
              loadThreads({ silent: true }).then(() => {
                const refreshCompleteTime = Date.now();
                console.log('[SSE Frontend] loadThreads completed:', {
                  threadId: data.threadId,
                  refreshDuration: refreshCompleteTime - refreshStartTime,
                  totalDelayFromWebhook: refreshCompleteTime - data.timestamp
                });
              }).catch((error) => {
                console.error('[SSE Frontend] loadThreads failed:', {
                  threadId: data.threadId,
                  error: error instanceof Error ? error.message : String(error),
                  totalDelayFromWebhook: Date.now() - data.timestamp
                });
              });
            } else if (data.type === 'connected') {
              console.log('[SSE] Connection confirmed:', { timestamp: data.timestamp });
              // Connection confirmed, reset reconnect attempts
              reconnectAttempts = 0;
              // Mark SSE as active by updating last event time
              lastSSEEventTimeRef.current = Date.now();
            }
          } catch (error) {
            console.error('[SSE] Error parsing event data:', error, { eventData: event.data });
          }
        };

        eventSource.onerror = (error) => {
          const readyState = eventSource?.readyState;
          // EventSource readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
          console.error('[SSE Frontend] Connection error:', { 
            readyState,
            readyStateText: readyState === 0 ? 'CONNECTING' : readyState === 1 ? 'OPEN' : 'CLOSED',
            attempt: reconnectAttempts + 1,
            maxAttempts: maxReconnectAttempts,
            error,
            timestamp: Date.now()
          });
          
          // If connection was closed (readyState === 2), it might be an auth error
          if (readyState === 2) {
            console.error('[SSE Frontend] Connection closed - possible authentication/authorization error. Check server logs.');
          }
          
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          // Exponential backoff for reconnection
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
            reconnectAttempts++;
            console.log('[SSE Frontend] Scheduling reconnection:', { delay, attempt: reconnectAttempts });
            reconnectTimeout = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            console.error('[SSE Frontend] Max reconnection attempts reached. SSE connection disabled. Will retry on page refresh.', {
              totalAttempts: reconnectAttempts,
              lastReadyState: readyState
            });
            // Reset attempts after a longer delay to allow retry
            setTimeout(() => {
              reconnectAttempts = 0;
            }, 60_000); // Reset after 1 minute
          }
        };

        eventSource.onopen = () => {
          const openTime = Date.now();
          console.log('[SSE Frontend] Connection opened successfully:', {
            readyState: eventSource?.readyState,
            timestamp: openTime
          });
          // Connection opened successfully, reset reconnect attempts
          reconnectAttempts = 0;
          // Mark SSE as active by updating last event time
          lastSSEEventTimeRef.current = openTime;
        };
      } catch (error) {
        console.error('[SSE Frontend] Error creating EventSource:', error, {
          errorMessage: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        });
      }
    };

    // Start SSE connection
    console.log('[SSE Frontend] Initializing SSE connection...');
    connectSSE();

    // Fallback polling mechanism: if SSE events haven't been received for 10 seconds,
    // start polling every 5 seconds as a fallback
    const startFallbackPolling = () => {
      // Clear any existing fallback polling
      if (fallbackPollIntervalRef.current) {
        clearInterval(fallbackPollIntervalRef.current);
        fallbackPollIntervalRef.current = null;
      }

      const checkSSEHealth = () => {
        const now = Date.now();
        const lastEventTime = lastSSEEventTimeRef.current;
        const timeSinceLastEvent = lastEventTime ? now - lastEventTime : Infinity;

        // If SSE hasn't received events for more than 10 seconds, start polling
        if (timeSinceLastEvent > 10_000) {
          console.warn('[SSE Frontend] SSE events not received for', timeSinceLastEvent, 'ms. Starting fallback polling.');
          // Poll every 5 seconds - run continuously regardless of statusFilter
          fallbackPollIntervalRef.current = setInterval(() => {
            if (!isReopeningRef.current) {
              // If on resolved/closed, check for new messages but don't refresh list
              if (statusFilter === "resolved" || statusFilter === "closed") {
                // Check for new waiting messages silently
                fetch('/api/admin/support/threads?status=waiting&limit=1', { 
                  credentials: "include", 
                  cache: "no-store" 
                })
                  .then(res => res.json())
                  .then(data => {
                    const currentWaitingCount = data.total || 0;
                    if (lastCheckedWaitingCountRef.current === 0 && currentWaitingCount > 0) {
                      lastCheckedWaitingCountRef.current = currentWaitingCount;
                      return;
                    }
                    // Play sound for new waiting messages regardless of filter
                    if (currentWaitingCount > lastCheckedWaitingCountRef.current && soundEnabled) {
                      prepareSupportSound();
                      playNewMessageAlert();
                    }
                    lastCheckedWaitingCountRef.current = currentWaitingCount;
                  })
                  .catch(() => {
                    // Ignore errors
                  });
              } else {
                // On open status, refresh threads list normally
                console.log('[SSE Frontend] Fallback polling: refreshing threads list');
                loadThreads({ silent: true });
              }
            }
          }, 5_000);
        } else if (fallbackPollIntervalRef.current) {
          // SSE is healthy, stop fallback polling
          console.log('[SSE Frontend] SSE events received, stopping fallback polling');
          clearInterval(fallbackPollIntervalRef.current);
          fallbackPollIntervalRef.current = null;
        }
      };

      // Check SSE health every 5 seconds
      const healthCheckInterval = setInterval(checkSSEHealth, 5_000);
      
      return () => {
        clearInterval(healthCheckInterval);
        if (fallbackPollIntervalRef.current) {
          clearInterval(fallbackPollIntervalRef.current);
          fallbackPollIntervalRef.current = null;
        }
      };
    };

    const cleanupFallback = startFallbackPolling();

    // Continuous polling for new waiting messages - runs independently every 5 seconds
    // This ensures we detect new messages even when SSE is working, especially when user is on resolved/closed
    const startNewMessagePolling = () => {
      // Clear any existing polling
      if (newMessagePollIntervalRef.current) {
        clearInterval(newMessagePollIntervalRef.current);
        newMessagePollIntervalRef.current = null;
      }

      // Poll every 5 seconds for new waiting messages
      newMessagePollIntervalRef.current = setInterval(async () => {
        // Skip if reopening or page not visible
        if (isReopeningRef.current || (typeof document !== "undefined" && document.visibilityState !== "visible")) {
          return;
        }

        try {
          // Check for new waiting messages
          const res = await fetch('/api/admin/support/threads?status=waiting&limit=1', {
            credentials: "include",
            cache: "no-store"
          });
          
          if (!res.ok) return;
          
          const data = await res.json();
          const currentWaitingCount = data.total || 0;
          
          // Initialize count on first check if not set
          if (lastCheckedWaitingCountRef.current === 0 && currentWaitingCount > 0) {
            lastCheckedWaitingCountRef.current = currentWaitingCount;
            return;
          }
          
          // If we have more waiting messages than before, play sound
          // Play sound for ALL new messages regardless of filter
          if (currentWaitingCount > lastCheckedWaitingCountRef.current && soundEnabled) {
            prepareSupportSound();
            playNewMessageAlert();
          }
          
          // Update count even if we didn't play sound (to track baseline)
          lastCheckedWaitingCountRef.current = currentWaitingCount;
        } catch (error) {
          // Ignore errors - polling will retry next interval
          console.error('[New Message Poll] Error checking for new messages:', error);
        }
      }, 5_000);

      return () => {
        if (newMessagePollIntervalRef.current) {
          clearInterval(newMessagePollIntervalRef.current);
          newMessagePollIntervalRef.current = null;
        }
      };
    };

    const cleanupNewMessagePolling = startNewMessagePolling();

    // Cleanup on unmount
    return () => {
      console.log('[SSE Frontend] Cleaning up SSE connection on unmount');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (eventSource) {
        console.log('[SSE Frontend] Closing EventSource');
        eventSource.close();
        eventSource = null;
      }
      cleanupFallback();
      cleanupNewMessagePolling();
    };
  }, [loadThreads, user, statusFilter, soundEnabled]);

  const pollIntervalMs = 5_000;
  useEffect(() => {
    if (!selectedThread) return;
    const t = setInterval(refreshThreadMessagesSilent, pollIntervalMs);
    return () => clearInterval(t);
  }, [selectedThread?.id, refreshThreadMessagesSilent]);


  const loadThreadMessages = useCallback(async (thread: SupportThread) => {
    prepareSupportSound();
    setThreadNotes([]);
    setThreadMessages([]);
    setLoadingMessages(true);
    setTypingUsers([]); // Clear typing indicators when switching threads
    const requestId = ++threadDetailRequestIdRef.current;
    let workingThread: SupportThread = thread;
    try {
      // On first open of a waiting thread, move to open
      if (workingThread.status === "waiting") {
        const statusRes = await fetch(`/api/admin/support/threads/${workingThread.id}/status`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "open" }),
        });
        if (statusRes.ok) {
          workingThread = { ...workingThread, status: "open" };
          setThreads((prev) =>
            prev.map((t) => (t.id === workingThread.id ? { ...t, status: "open" as const } : t))
          );
        }
      }

      // Auto-assign to current user if thread is open and unassigned
      // This handles both waiting->open transitions and direct clicks on open threads
      if (workingThread.status === "open" && !workingThread.assignedToUserId && user?.id) {
        const assigneeRes = await fetch(`/api/admin/support/threads/${workingThread.id}/assignee`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeId: "me" }),
        });
        if (assigneeRes.ok) {
          workingThread = {
            ...workingThread,
            assignedToUserId: user.id,
            assignedToEmail: user.email,
          };
          setThreads((prev) =>
            prev.map((t) =>
              t.id === workingThread.id
                ? {
                    ...t,
                    assignedToUserId: user.id,
                    assignedToEmail: user.email,
                  }
                : t
            )
          );
        }
      }

      // Reflect latest optimistic state in selectedThread
      setSelectedThread(workingThread);
      const [detailRes, notesRes] = await Promise.all([
        fetch(`/api/admin/support/threads/${workingThread.id}`, { credentials: "include" }),
        fetch(`/api/admin/support/threads/${workingThread.id}/notes`, { credentials: "include" }),
      ]);
      const detailJson = await detailRes.json();
      const notesJson = await notesRes.json();
      if (!detailRes.ok) throw new Error(detailJson?.error || "Failed to load messages");
      if (threadDetailRequestIdRef.current !== requestId) return;
      if (selectedThreadRef.current?.id !== workingThread.id) return;
      setThreadMessages(detailJson.messages || []);
      setThreadNotes(notesRes.ok ? notesJson.notes || [] : []);
      setNoteBody("");
      setLoadingMessages(false);
      markInteraction();
    } catch (e: any) {
      toast.error(e?.message || "Error loading messages");
      setLoadingMessages(false);
    }
  }, [user?.id]);

  // Real-time chat events for selected thread
  useChatRealtime({
    threadId: selectedThread?.id,
    enabled: !!selectedThread,
    onEvent: useCallback((event: ChatEvent) => {
      if (!selectedThread) return;
      
      if (event.type === 'new_message' && event.threadId === selectedThread.id) {
        // Reload messages when new message arrives
        loadThreadMessages(selectedThread);
      } else if (event.type === 'typing_start' && event.userId && event.userId !== user?.id) {
        // Someone is typing
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === event.userId);
          if (existing) return prev;
          return [...prev, { userId: event.userId!, userName: event.userName }];
        });
      } else if (event.type === 'typing_stop' && event.userId) {
        // Stop typing
        setTypingUsers((prev) => prev.filter((u) => u.userId !== event.userId));
      }
    }, [selectedThread, user?.id, loadThreadMessages]),
  });

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
    // Set flag to prevent automatic refresh from reverting optimistic update
    isUpdatingStatusRef.current = true;
    
    const prev = threads.find((t) => t.id === threadId)?.status;
    const s = status as SupportThread["status"];
    const thread = threads.find((t) => t.id === threadId);
    const updatedThread = thread ? { ...thread, status: s } : null;
    const stillMatches = updatedThread ? threadMatchesFilters(updatedThread) : false;
    const wasSelected = selectedThread?.id === threadId;

    // Detect if this is a reopen operation (closed/resolved → open)
    const isReopenFromClosedOrResolved = s === "open" && (prev === "closed" || prev === "resolved");

    statusOptimisticUntilRef.current = { threadId, status: s, until: Date.now() + 4000 };
    setThreads((prevList) => {
      const updated = prevList.map((t) =>
        t.id === threadId
          ? s === "open" && (prev === "closed" || prev === "resolved")
            ? { 
                ...t, 
                status: s, 
                closedBy: null, 
                resolvedBy: null,
                assignedToUserId: user?.id || t.assignedToUserId,
                assignedToEmail: user?.email || t.assignedToEmail
              }
            : s === "open"
            ? { ...t, status: s, closedBy: null, resolvedBy: null }
            : { ...t, status: s }
          : t
      );
      return updated.filter((t) => threadMatchesFilters(t));
    });
    if (stillMatches && wasSelected) {
      const updatedSelected = selectedThread 
        ? (s === "open" && (prev === "closed" || prev === "resolved")
          ? { 
              ...selectedThread, 
              status: s, 
              closedBy: null, 
              resolvedBy: null,
              assignedToUserId: user?.id || selectedThread.assignedToUserId,
              assignedToEmail: user?.email || selectedThread.assignedToEmail
            }
          : s === "open"
          ? { ...selectedThread, status: s, closedBy: null, resolvedBy: null }
          : { ...selectedThread, status: s })
        : null;
      setSelectedThread(updatedSelected);
      // Synchronously update ref to prevent race conditions
      selectedThreadRef.current = updatedSelected;
    }
    let didReopenRedirect = false;
    if (!stillMatches && wasSelected) {
      if (isReopenFromClosedOrResolved) {
        didReopenRedirect = true;
        const reopenedSelected = selectedThread && selectedThread.id === threadId ? { ...selectedThread, status: "open" as const, closedBy: null, resolvedBy: null } : selectedThread;
        setSelectedThread(reopenedSelected);
        // Synchronously update ref to prevent race conditions
        selectedThreadRef.current = reopenedSelected;
        reopenRedirectThreadIdRef.current = threadId;
        // Set flag BEFORE any state changes to prevent useEffect from triggering duplicate loadThreads call
        isReopeningRef.current = true;
        // Don't update state filters yet - we'll do that after loadThreads completes
        // This prevents loadThreads from using old filter values and avoids triggering useEffect
      } else {
        clearSelection();
      }
    }
    try {
      const res = await fetch(`/api/admin/support/threads/${threadId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      let json: { error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      if (!res.ok) {
        statusOptimisticUntilRef.current = null;
        isReopeningRef.current = false; // Reset flag on error
        isUpdatingStatusRef.current = false; // Reset flag on error
        const err = new Error(json?.error || "Failed");
        (err as Error & { status?: number; body?: unknown }).status = res.status;
        (err as Error & { status?: number; body?: unknown }).body = json;
        console.error("[support] Status PATCH failed", {
          threadId,
          status: res.status,
          body: json,
          attemptedStatus: status,
        });
        captureException(err, {
          threadId,
          status: res.status,
          body: json,
          attemptedStatus: status,
        });
        throw err;
      }
      statusOptimisticUntilRef.current = null;
      toast.success("Status updated");

      markInteraction();

      // Update selectedThreadRef synchronously if thread is still selected
      // This ensures the ref reflects the latest status change
      // Only update if the thread still matches filters (wasn't cleared)
      const currentSelected = selectedThreadRef.current;
      if (currentSelected && currentSelected.id === threadId && stillMatches) {
        selectedThreadRef.current = { ...currentSelected, status: s };
      }

      // Reset flag after successful update - allow refresh now
      isUpdatingStatusRef.current = false;

      // If reopening from closed/resolved to open, refresh the thread list and clear selection
      if (isReopenFromClosedOrResolved) {
        // Clear any pending refreshes to prevent duplicate calls
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        pendingRefreshRef.current = { list: false, thread: false };
        
        // Update state filters immediately
        setStatusFilter("open");
        setPage(1);
        setClosedResolvedByFilter("all_closed_resolved_by");
        clearSelection(); // Clear thread selection
        
        // Set flag to prevent useEffect and scheduleRefresh from triggering duplicate calls
        isReopeningRef.current = true;
        
        // Schedule loadThreads to run after half a second
        refreshTimeoutRef.current = setTimeout(() => {
          refreshTimeoutRef.current = null;
          loadThreads({ 
            silent: false, 
            overrideStatusFilter: "open", 
            overridePage: 1 
          });
          // Keep the flag true for an additional 500ms after loadThreads completes
          // to prevent other triggers (useEffect, SSE) from firing immediately
          setTimeout(() => {
            isReopeningRef.current = false;
          }, 500);
        }, 500);
        
        // When reopening from closed/resolved to open, the API automatically assigns to current user
        // The optimistic update above already reflects this, so no need for separate assignee call
      } else {
        // Detect if we're closing/resolving a thread while on "open" status filter
        // In this case, don't refresh the list because the thread no longer matches filters
        // and has already been removed from the list by the filter operation above
        const isClosingOrResolving = (s === "closed" || s === "resolved") && 
                                     (prev === "open" || prev === "waiting") &&
                                     statusFilter === "open";
        
        if (isClosingOrResolving) {
          // Thread was removed from list by filter, no need to refresh list
          // Only refresh thread messages if it was selected
          if (wasSelected) {
            scheduleRefresh({ list: false, thread: true });
          }
          // Don't refresh list - thread already removed by filter
        } else {
          // Normal status change - refresh both list and thread
          // But delay slightly to ensure server has processed the update
          setTimeout(() => {
            scheduleRefresh({ list: !didReopenRedirect, thread: true });
          }, 100);
        }
      }
    } catch (e: unknown) {
      const err = e as Error & { status?: number; body?: unknown };
      statusOptimisticUntilRef.current = null;
      isUpdatingStatusRef.current = false; // Reset flag on error
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
      if (err?.status == null) {
        console.error("[support] Status PATCH error (network or parse)", {
          threadId,
          message: err?.message,
          attemptedStatus: status,
        });
        captureException(
          err instanceof Error ? err : new Error(String(err)),
          { threadId, attemptedStatus: status }
        );
      }
      toast.error("Could not update status. Please try again.", {
        action: {
          label: "Retry",
          onClick: () => handlePatchStatus(threadId, status),
        },
      });
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
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter === "open" ? "open,waiting" : statusFilter);
      if (sourceFilter && sourceFilter !== "all_sources") params.set("source", sourceFilter);
      if (closedResolvedByFilter && closedResolvedByFilter !== "all_closed_resolved_by") {
        params.set("closedResolvedByUserId", closedResolvedByFilter);
      }
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
    // Skip if viewing resolved/closed status (new messages don't affect these views)
    if (statusFilter !== "resolved" && statusFilter !== "closed") {
      loadThreads();
    }
    if (selectedThreadRef.current) refreshThreadMessagesSilent();
  }, [loadThreads, refreshThreadMessagesSilent, statusFilter]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Inbox • incl. Moderation & Audit
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
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
              <div className="relative w-[260px] min-w-[220px]">
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
                <SelectTrigger className="w-[132px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={closedResolvedByFilter}
                onValueChange={(v) => {
                  setClosedResolvedByFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[172px]">
                  <SelectValue placeholder="Closed/Resolved by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_closed_resolved_by">All users</SelectItem>
                  {closedResolvedUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sourceFilter}
                onValueChange={(v) => {
                  setSourceFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[132px]">
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
                      {thread.status === "closed" && thread.closedBy && (
                        <Badge variant="outline" className="text-xs">
                          Closed by {getUserDisplayLabel(thread.closedBy)}
                        </Badge>
                      )}
                      {thread.status === "resolved" && thread.resolvedBy && (
                        <Badge variant="outline" className="text-xs">
                          Resolved by {getUserDisplayLabel(thread.resolvedBy)}
                        </Badge>
                      )}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversație</CardTitle>
            {(() => {
              const card = threads.find((t) => t.id === selectedThread?.id) ?? selectedThread;
              const t = card;
              if (!t || !t.assignedToUserId || !t.assignedToEmail) return null;
              return (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Assigned to{" "}
                  {t.assignedToEmail.split("@")[0]}
                </span>
              );
            })()}
          </div>
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
                const card = threads.find((t) => t.id === selectedThread?.id) ?? selectedThread;
                const t = card;
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
                      {/* Assigned info moved to top-right header; removed inline assign/unassign button */}
                      {(t.status === "closed" || t.status === "resolved") &&
                        t.assignedToUserId &&
                        t.assignedToEmail && (
                          <Badge variant="outline" className="text-xs">
                            Assigned to {t.assignedToEmail.split("@")[0]}
                          </Badge>
                        )}
                      {t.status === "closed" && t.closedBy && (
                        <Badge variant="outline" className="text-xs">
                          Closed by {getUserDisplayLabel(t.closedBy)}
                        </Badge>
                      )}
                      {t.status === "resolved" && t.resolvedBy && (
                        <Badge variant="outline" className="text-xs">
                          Resolved by {getUserDisplayLabel(t.resolvedBy)}
                        </Badge>
                      )}
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
                  <>
                    {threadMessages.map((msg) => {
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
                    })}
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="p-3 rounded-lg text-sm bg-muted">
                        <TypingIndicator userName={typingUsers[0]?.userName} />
                      </div>
                    )}
                  </>
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
                    <TableCell className="text-sm whitespace-nowrap text-right">
                      {item.confidence ? (
                        <span
                          className={`${
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
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {(() => {
                          const threadStatus = item.threadStatus as SupportThread["status"] | null | undefined;
                          const key = (threadStatus ?? item.status) as string;
                          const label = threadStatus ? (statusDisplayLabels[threadStatus] ?? threadStatus) : key;
                          return (
                            <Badge
                              className={`${statusColors[key]?.bg} ${statusColors[key]?.text}`}
                            >
                              {label}
                            </Badge>
                          );
                        })()}
                        {item.promptInjectionSuspected && (
                          <Badge variant="destructive">
                            ⚠️
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {timeAgo(item.createdAt)}
                    </TableCell>
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

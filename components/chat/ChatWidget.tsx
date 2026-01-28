"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Clock, Loader2 } from 'lucide-react';
import { useSupportThreadChat } from '@/lib/support-thread-chat-context';
import { isIncomingMessage } from '@/lib/support-message-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SUPPORT_AGENT_NAME = 'Elena S.';
const SUPPORT_AGENT_INITIALS = 'ES';
const SUPPORT_HOURS_LABEL = '09:00–18:00';
const SUPPORT_TIMEZONE = 'Europe/Bucharest';
const SUPPORT_START_HOUR = 9;
const SUPPORT_END_HOUR = 18;

function isWithinSupportHoursRo(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SUPPORT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const afterStart = h > SUPPORT_START_HOUR || (h === SUPPORT_START_HOUR && m >= 0);
  // End-exclusive: 18:00 is considered outside hours.
  const beforeEnd = h < SUPPORT_END_HOUR;
  return afterStart && beforeEnd;
}

function formatTimeRo(d: Date): string {
  try {
    return new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

function formatThreadDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  order_id?: string;
}

interface ChatWidgetProps {
  className?: string;
}

function newUuid(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).crypto?.randomUUID?.() ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  } catch {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FM_CHAT_SESSION_KEY = 'fm_chat_session_id';

function createSessionUuid(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (globalThis as any).crypto?.randomUUID?.();
    if (u && UUID_RE.test(u)) return u;
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return createSessionUuid();
  try {
    const stored = localStorage.getItem(FM_CHAT_SESSION_KEY);
    if (stored && UUID_RE.test(stored)) return stored;
    const id = createSessionUuid();
    localStorage.setItem(FM_CHAT_SESSION_KEY, id);
    return id;
  } catch {
    return createSessionUuid();
  }
}

// Global function to open chat
declare global {
  interface Window {
    openChat: () => void;
  }
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const pathname = usePathname();
  const { snapshot } = useSupportThreadChat();
  const supportMode = typeof pathname === 'string' && pathname.startsWith('/support') && snapshot.selectedThread != null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [noticeShown, setNoticeShown] = useState(false);
  const [humanAckShown, setHumanAckShown] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user when chat opens (for Vizitator vs role display in support)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => (cancelled ? null : r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.user?.id) return;
        setUserId(data.user.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Expose openChat function globally
  useEffect(() => {
    (window as any).openChat = () => setIsOpen(true);
    return () => {
      delete (window as any).openChat;
    };
  }, []);

  // Update local time while open (for Online/Offline badge)
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, [isOpen]);

  // Load chat history on open (and on refresh: same sessionId from localStorage => same thread)
  useEffect(() => {
    if (isOpen) loadChatHistory();
  }, [isOpen]);

  // Poll for new messages while chat is open (agent replies)
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/chat/session?session_id=${sessionId}`, { credentials: 'include', cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        const serverNotice = typeof data?.notice === 'string' ? data.notice : null;
        if (serverNotice && !noticeShown) {
          setMessages((prev) => {
            if (prev.some((m) => m.text === serverNotice)) return prev;
            return [...prev, { id: newUuid(), text: serverNotice, sender: 'bot', timestamp: new Date() }];
          });
          setNoticeShown(true);
        }

        const incoming = Array.isArray(data?.messages) ? data.messages : [];
        if (incoming.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const appended = (incoming as Array<{ id: string; text: string; sender: 'user' | 'bot'; timestamp: string | Date; order_id?: string }>).filter(
              (m) => !existingIds.has(m.id)
            );
            if (appended.length === 0) return prev;
            const merged = [
              ...prev,
              ...appended.map((m) => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
              })),
            ];
            merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            return merged;
          });
        }
      } catch {
        // ignore polling errors
      }
    };

    // quick first poll, then interval
    void poll();
    const t = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [isOpen, sessionId]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/session?session_id=${sessionId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const serverNotice = typeof data?.notice === 'string' ? data.notice : null;
        const incoming = Array.isArray(data?.messages) ? data.messages : [];

        if (incoming.length > 0) {
          setMessages(
            (incoming as Array<{ id: string; text: string; sender: 'user' | 'bot'; timestamp: string | Date; order_id?: string }>).map(
              (m) => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
              })
            )
          );
        } else {
          // If outside hours, show the required notice once.
          if (serverNotice && !noticeShown) {
            addMessage(serverNotice, 'bot');
            setNoticeShown(true);
          }

          addMessage(
            `Salut! Sunt ${SUPPORT_AGENT_NAME} din echipa de suport FloristMarket. Spune-mi cu ce te pot ajuta (comenzi, livrare, retur, factură).`,
            'bot'
          );
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      addMessage(`Salut! Sunt ${SUPPORT_AGENT_NAME} din echipa de suport FloristMarket. Cu ce te pot ajuta?`, 'bot');
    }
  };

  const addMessage = (text: string, sender: 'user' | 'bot', orderId?: string) => {
    const newMessage: ChatMessage = {
      id: newUuid(),
      text,
      sender,
      timestamp: new Date(),
      order_id: orderId
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const clientMessageId = newUuid();

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      { id: clientMessageId, text: userMessage, sender: 'user', timestamp: new Date() },
    ]);

    try {
      const response = await fetch('/api/chat/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          conversation_id: sessionId,
          client_message_id: clientMessageId,
          ...(userId ? { user_id: userId } : {}),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        const serverNotice = typeof data?.notice === 'string' ? data.notice : null;
        if (serverNotice && !noticeShown) {
          addMessage(serverNotice, 'bot');
          setNoticeShown(true);
        }

        const newConvId = typeof data?.conversation_id === 'string' ? data.conversation_id : null;
        if (newConvId && newConvId !== sessionId && UUID_RE.test(newConvId)) {
          try {
            localStorage.setItem(FM_CHAT_SESSION_KEY, newConvId);
          } catch {}
          setSessionId(newConvId);
        }

        if (!humanAckShown) {
          const onlineNow = isWithinSupportHoursRo(new Date());
          addMessage(
            onlineNow
              ? `Mulțumim! Mesajul tău a fost trimis către suport (${SUPPORT_AGENT_NAME}). Îți răspundem cât mai curând.`
              : `Mulțumim! Mesajul tău a fost înregistrat. Suntem offline acum, dar îl vedem și îți răspundem cât mai curând posibil.`,
            'bot'
          );
          setHumanAckShown(true);
        }
      } else {
        addMessage('Ne pare rău, a apărut o problemă. Te rugăm să încerci din nou.', 'bot');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Ne pare rău, a apărut o problemă. Te rugăm să încerci din nou.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const supportOnline = isWithinSupportHoursRo(now);
  const headerName = SUPPORT_AGENT_NAME;
  const headerInitials = SUPPORT_AGENT_INITIALS;
  const headerRoleLabel = 'Suport';
  const quickReplies = [
    'Unde este comanda mea?',
    'Vreau să fac un retur',
    'Am nevoie de factură',
    'Probleme la plată / checkout',
  ];

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-emerald-700 hover:from-primary/95 hover:to-emerald-700/95 shadow-elev ring-1 ring-black/5"
          aria-label="Deschide chat suport"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <Card className="w-[360px] max-w-[calc(100vw-2rem)] h-[520px] shadow-elev border border-line bg-white overflow-hidden rounded-3xl">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary via-primary to-emerald-700 text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center text-sm font-semibold tracking-tight">
                  {headerInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-semibold leading-none">{headerName}</span>
                    <span className="text-xs text-white/80">{headerRoleLabel}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-white/85">
                    <span className="inline-flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", supportOnline ? "bg-emerald-300" : "bg-white/40")} />
                      {supportOnline ? 'Online acum' : 'Offline acum'}
                    </span>
                    <span className="text-white/45">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {SUPPORT_HOURS_LABEL}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 p-0 text-white hover:bg-white/15 min-w-0 flex-shrink-0 flex items-center justify-center rounded-xl transition-colors"
                aria-label="Închide chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-50 to-white"
              onClick={() => snapshot.markInteraction?.()}
            >
              {supportMode ? (
                <>
                  {snapshot.loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : snapshot.threadMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages</p>
                  ) : (
                    snapshot.threadMessages.map((msg) => {
                      const unread = isIncomingMessage(msg) && (snapshot.unreadMessageIds ?? []).includes(msg.id);
                      return (
                      <div
                        key={msg.id}
                        className={cn(
                          'p-3 rounded-lg text-sm',
                          msg.moderation?.status === 'hidden' || msg.moderation?.status === 'deleted'
                            ? 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
                            : msg.moderation?.status === 'redacted'
                            ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900/50'
                            : unread
                            ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-primary animate-unread-pulse'
                            : 'bg-muted'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs">
                            {msg.authorDisplayLabel ?? msg.senderName ?? msg.senderEmail?.split('@')[0] ?? '—'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatThreadDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.displayBody}</p>
                        {msg.moderation?.status && msg.moderation.status !== 'visible' && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {msg.moderation.status === 'hidden' && 'Hidden'}
                            {msg.moderation.status === 'deleted' && 'Deleted'}
                            {msg.moderation.status === 'redacted' && 'Redacted'}
                            {' by '}
                            {msg.moderation.moderator?.name || msg.moderation.moderator?.email || '—'}
                            {msg.moderation.moderatedAt && ` on ${formatThreadDate(msg.moderation.moderatedAt)}`}
                          </p>
                        )}
                        {msg.moderation?.isInternalNote && msg.moderation.internalNoteBody && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-800 dark:text-blue-200">
                            <strong>Internal Note:</strong> {msg.moderation.internalNoteBody}
                          </div>
                        )}
                      </div>
                      );
                    })
                  )}
                </>
              ) : (
                <>
                  {messages.length === 0 && !isLoading && (
                    <div className="rounded-2xl border border-line bg-white/90 shadow-sm p-4">
                      <div className="text-sm font-semibold text-ink">Bun venit 👋</div>
                      <div className="mt-1 text-sm text-subink">
                        Spune-mi pe scurt ce ai nevoie (comenzi, livrare, retur, factură). În programul {SUPPORT_HOURS_LABEL} răspundem rapid.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quickReplies.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setInputValue(t);
                              inputRef.current?.focus();
                            }}
                            className="text-xs px-3 py-1.5 rounded-full border border-line bg-bg-soft hover:bg-white transition-micro"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.sender === 'bot' && (
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white ring-1 ring-black/5 shadow-sm flex items-center justify-center text-[11px] font-semibold text-primary">
                          {SUPPORT_AGENT_INITIALS}
                        </div>
                      )}
                      
                      <div className={cn("max-w-[82%]", message.sender === 'user' ? 'items-end' : 'items-start')}>
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ring-1",
                            message.sender === 'user'
                              ? "bg-primary text-white ring-black/5"
                              : "bg-white text-ink ring-black/5"
                          )}
                        >
                          {message.text}
                        </div>
                        <div className={cn(
                          "mt-1 text-[11px] text-subink",
                          message.sender === 'user' ? 'text-right' : 'text-left'
                        )}>
                          {formatTimeRo(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white ring-1 ring-black/5 shadow-sm flex items-center justify-center text-[11px] font-semibold text-primary">
                        {SUPPORT_AGENT_INITIALS}
                      </div>
                      <div className="bg-white rounded-2xl px-3 py-2 text-sm shadow-sm ring-1 ring-black/5">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input + Send – always visible */}
            <div className="p-3 border-t border-line bg-white/90 backdrop-blur">
              <div className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrie mesajul tău…"
                  disabled={isLoading}
                  className="flex-1 h-11 rounded-full bg-white border-line focus-visible:ring-primary/30"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 shadow-sm"
                  aria-label="Trimite mesaj"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

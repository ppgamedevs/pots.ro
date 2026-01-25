"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SUPPORT_AGENT_NAME = 'Elena S.';
const SUPPORT_AGENT_INITIALS = 'ES';
const SUPPORT_HOURS_LABEL = '09:00–18:00';
const SUPPORT_START_HOUR = 9;
const SUPPORT_END_HOUR = 18;

function isWithinSupportHours(now: Date): boolean {
  const h = now.getHours();
  const m = now.getMinutes();
  const afterStart = h > SUPPORT_START_HOUR || (h === SUPPORT_START_HOUR && m >= 0);
  const beforeEnd = h < SUPPORT_END_HOUR || (h === SUPPORT_END_HOUR && m === 0);
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

// Global function to open chat
declare global {
  interface Window {
    openChat: () => void;
  }
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => new Date());

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

  // Load chat history on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/session?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(
            (data.messages as Array<{ id: string; text: string; sender: 'user' | 'bot'; timestamp: string | Date; order_id?: string }>).map(
              (m) => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
              })
            )
          );
        } else {
          // Add welcome message
          addMessage(
            `Salut! Sunt ${SUPPORT_AGENT_NAME} din echipa de suport FloristMarket.\n\nProgram: ${SUPPORT_HOURS_LABEL}. Spune-mi cu ce te pot ajuta (comenzi, livrare, retur, factură).`,
            'bot'
          );
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      addMessage(
        `Salut! Sunt ${SUPPORT_AGENT_NAME} din echipa de suport FloristMarket.\n\nProgram: ${SUPPORT_HOURS_LABEL}. Spune-mi cu ce te pot ajuta (comenzi, livrare, retur, factură).`,
        'bot'
      );
    }
  };

  const addMessage = (text: string, sender: 'user' | 'bot', orderId?: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Add user message immediately
    addMessage(userMessage, 'user');

    try {
      const response = await fetch('/api/chat/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        addMessage(data.response, 'bot', data.order_id);
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

  const supportOnline = isWithinSupportHours(now);
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
                  {SUPPORT_AGENT_INITIALS}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-semibold leading-none">{SUPPORT_AGENT_NAME}</span>
                    <span className="text-xs text-white/80">Suport</span>
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-50 to-white">
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
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
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

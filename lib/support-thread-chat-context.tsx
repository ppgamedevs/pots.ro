"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface SupportThreadMessage {
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

export interface SupportThreadChatSnapshot {
  threadMessages: SupportThreadMessage[];
  selectedThread: { id: string; source: string } | null;
  loadingMessages: boolean;
}

const defaultValue: SupportThreadChatSnapshot = {
  threadMessages: [],
  selectedThread: null,
  loadingMessages: false,
};

type Setter = (snapshot: SupportThreadChatSnapshot) => void;

const SupportThreadChatContext = createContext<{
  snapshot: SupportThreadChatSnapshot;
  setSupportThreadChat: Setter | null;
}>({
  snapshot: defaultValue,
  setSupportThreadChat: null,
});

export function SupportThreadChatProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SupportThreadChatSnapshot>(defaultValue);
  const setSupportThreadChat = useCallback((next: SupportThreadChatSnapshot) => {
    setSnapshot(next);
  }, []);

  return (
    <SupportThreadChatContext.Provider
      value={{ snapshot, setSupportThreadChat }}
    >
      {children}
    </SupportThreadChatContext.Provider>
  );
}

export function useSupportThreadChat() {
  return useContext(SupportThreadChatContext);
}

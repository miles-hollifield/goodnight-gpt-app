"use client";

import { useState, useCallback } from "react";
import { Conversation } from "@/types";
import { LS_KEY } from "@/utils/constants";
import { createBlankConversation } from "@/utils/conversation";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [createBlankConversation()];
  });

  const [currentId, setCurrentId] = useState<string>(() => conversations[0].id);
  
  const currentConversation = conversations.find((c) => c.id === currentId)!;

  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const updateConversation = useCallback(
    (convId: string, updater: (c: Conversation) => Conversation) => {
      persist(conversations.map((c) => (c.id === convId ? updater({ ...c }) : c)));
    },
    [conversations, persist]
  );

  const createNewChat = useCallback(() => {
    const fresh = createBlankConversation();
    persist([fresh, ...conversations]);
    setCurrentId(fresh.id);
  }, [conversations, persist]);

  const deleteConversation = useCallback(
    (convId: string) => {
      const filtered = conversations.filter((c) => c.id !== convId);
      if (filtered.length === 0) {
        const fresh = createBlankConversation();
        persist([fresh]);
        setCurrentId(fresh.id);
      } else {
        persist(filtered);
        if (convId === currentId) setCurrentId(filtered[0].id);
      }
    },
    [conversations, currentId, persist]
  );

  return {
    conversations,
    currentConversation,
    currentId,
    setCurrentId,
    updateConversation,
    createNewChat,
    deleteConversation,
  };
}

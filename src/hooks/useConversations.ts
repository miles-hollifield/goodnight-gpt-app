"use client";

import { useState, useCallback, useEffect } from "react";
import { Conversation } from "@/types";
import { createBlankConversation } from "@/utils/conversation";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with a fresh conversation on every page load
  useEffect(() => {
    const freshConversation = createBlankConversation();
    setConversations([freshConversation]);
    setCurrentId(freshConversation.id);
    setIsInitialized(true);
  }, []);

  const [currentId, setCurrentId] = useState<string>("");
  
  const currentConversation = conversations.find((c) => c.id === currentId);

  // No persistence - just update state
  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
  }, []);

  const updateConversation = useCallback(
    (convId: string, updater: (c: Conversation) => Conversation) => {
      setConversations(currentConversations => 
        currentConversations.map((c) => (c.id === convId ? updater({ ...c }) : c))
      );
    },
    []
  );

  const createNewChat = useCallback(() => {
    const fresh = createBlankConversation();
    persist([fresh]); // Replace current conversation instead of adding to list
    setCurrentId(fresh.id);
  }, [persist]);

  const deleteConversation = useCallback(
    () => {
      // Since we only have one conversation, just create a new one
      const fresh = createBlankConversation();
      persist([fresh]);
      setCurrentId(fresh.id);
    },
    [persist]
  );

  // Don't render anything until initialized
  if (!isInitialized || !currentConversation) {
    return {
      conversations: [],
      currentConversation: null,
      currentId: "",
      createNewChat: () => {},
      updateConversation: () => {},
      deleteConversation: () => {},
    };
  }

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

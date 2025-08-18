import { Conversation } from "@/types";
import { INITIAL_GREETING } from "./constants";

let messageIdCounter = 1;

export function createBlankConversation(): Conversation {
  // Use a client-side timestamp to avoid hydration mismatches
  const now = typeof window !== 'undefined' ? Date.now() : 0;
  return {
    id: typeof window !== 'undefined' ? crypto.randomUUID() : `temp-${messageIdCounter}`,
    title: "New Chat",
    messages: [{ id: messageIdCounter++, sender: "ai", text: INITIAL_GREETING }],
    createdAt: now,
    updatedAt: now,
  };
}

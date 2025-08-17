import { Conversation } from "@/types";
import { INITIAL_GREETING } from "./constants";

export function createBlankConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [{ id: Date.now(), sender: "ai", text: INITIAL_GREETING }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

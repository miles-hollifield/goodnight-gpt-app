export interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  context?: RetrievedContext[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface RetrievedContext {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

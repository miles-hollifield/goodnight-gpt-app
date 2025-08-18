import { API_BASE } from "@/utils/constants";
import { Message } from "@/types";

let messageIdCounter = 1000; // Start higher to avoid conflicts

export async function sendMessage(message: string): Promise<Message> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  
  const data = await res.json();
  
  return {
    id: messageIdCounter++,
    sender: "ai",
    text: data.response ?? "(no response)",
    context: data.context,
  };
}

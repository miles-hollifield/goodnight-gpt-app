import { API_BASE } from "@/utils/constants";
import { Message } from "@/types";

export async function sendMessage(message: string): Promise<Message> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  
  const data = await res.json();
  
  return {
    id: Date.now() + 1,
    sender: "ai",
    text: data.response ?? "(no response)",
    context: data.context,
  };
}

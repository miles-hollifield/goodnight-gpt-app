"use client";

import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex gap-4 p-4 ${isUser ? "bg-[var(--message-user-bg)]" : "bg-[var(--message-ai-bg)]"}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
        style={{ backgroundColor: isUser ? "#10a37f" : "#8e8ea0" }}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        {!isUser && message.context && message.context.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Sources:</p>
            <div className="space-y-1">
              {message.context.slice(0, 3).map((ctx) => (
                <div
                  key={ctx.id}
                  className="text-xs p-2 rounded bg-[var(--hover-bg)] text-[var(--text-secondary)] truncate"
                  title={`Score: ${ctx.score.toFixed(3)}\n${ctx.text}`}
                >
                  {ctx.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { ChatMessage } from "./ChatMessage";

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  title: string;
}

export function ChatArea({ messages, loading, title }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="flex-1 flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--background)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {title === "New Chat" ? "GoodnightGPT" : title}
        </h1>
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-32">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M8 9H16M8 13H14M12 3C7.02944 3 3 7.02944 3 12C3 13.8179 3.48847 15.5238 4.33474 16.9872C4.48792 17.2567 4.56337 17.5645 4.52066 17.8653L3.98211 21.0177C3.93313 21.3576 4.21189 21.6426 4.55325 21.5955L7.68639 21.117C7.99213 21.0726 8.30404 21.1477 8.57721 21.3016C10.0437 22.1566 11.7554 22.6536 13.58 22.6957C18.3723 22.3161 22 18.2616 22 13.3333C22 7.81281 17.9706 3.33333 13 3.33333C12.6615 3.33333 12.3281 3.35435 12 3.39473"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                How can I help you today?
              </h2>
              <p className="text-[var(--text-secondary)]">
                Ask me anything about scholarships, and I&apos;ll provide helpful information based on our knowledge base.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex gap-4 p-4 bg-[var(--message-ai-bg)]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-[#8e8ea0]">
                  AI
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </main>
  );
}

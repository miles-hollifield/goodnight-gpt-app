"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    // Auto-focus the input when not disabled
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} 
        className="max-w-3xl mx-auto"
      >
        <div className="relative flex items-end gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] shadow-lg">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message GoodnightGPT..."
            className="flex-1 min-h-[24px] max-h-[200px] p-0 bg-transparent resize-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] leading-6"
            rows={1}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={`p-2 rounded-lg transition-all duration-200 ${
              !input.trim() || disabled
                ? "text-[var(--text-secondary)] cursor-not-allowed opacity-50"
                : "text-white bg-[var(--accent)] hover:bg-[var(--accent)]/80 shadow-sm"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 11L12 6L17 11M12 18V7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {!disabled && (
          <p className="text-xs text-[var(--text-secondary)] text-center mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        )}
      </form>
    </div>
  );
}

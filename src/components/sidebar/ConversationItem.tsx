"use client";

import { useState } from "react";
import { Conversation } from "@/types";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  showDelete: boolean;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  showDelete,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-3 text-sm rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-[var(--sidebar-hover)] text-[var(--text-primary)]"
          : "hover:bg-[var(--sidebar-hover)] text-[var(--text-secondary)]"
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M8 9H16M8 13H14M12 3C7.02944 3 3 7.02944 3 12C3 13.8179 3.48847 15.5238 4.33474 16.9872C4.48792 17.2567 4.56337 17.5645 4.52066 17.8653L3.98211 21.0177C3.93313 21.3576 4.21189 21.6426 4.55325 21.5955L7.68639 21.117C7.99213 21.0726 8.30404 21.1477 8.57721 21.3016C10.0437 22.1566 11.7554 22.6536 13.58 22.6957C18.3723 22.3161 22 18.2616 22 13.3333C22 7.81281 17.9706 3.33333 13 3.33333C12.6615 3.33333 12.3281 3.35435 12 3.39473"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="flex-1 truncate pr-8">
        {conversation.title || "Untitled"}
      </span>
      {showDelete && (isHovered || isActive) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-3 p-1 rounded hover:bg-[var(--background)] transition-colors"
          aria-label="Delete conversation"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

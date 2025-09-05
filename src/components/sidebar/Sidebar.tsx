"use client";

import { useState } from "react";
import { Conversation } from "@/types";
import { NewChatButton } from "./NewChatButton";
import { ConversationItem } from "./ConversationItem";
import { DocumentUpload } from "../DocumentUpload";
import { UploadResponse } from "@/services/api";

interface SidebarProps {
  conversations: Conversation[];
  currentId: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onUploadSuccess?: (response: UploadResponse) => void;
}

export function Sidebar({
  conversations,
  currentId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onUploadSuccess,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleUploadSuccess = (response: UploadResponse) => {
    onUploadSuccess?.(response);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    // You could add a toast notification here
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-64'} overflow-hidden transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col`}
    >
      {/* Toggle button for mobile/desktop */}
      <div className="p-2 border-b border-[var(--border-color)]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-[var(--sidebar-hover)] rounded-lg transition-colors w-full flex items-center justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Keep content mounted so width/text can animate smoothly */}
      <div className="flex-1 flex flex-col">
        <div className="p-2">
          <NewChatButton onClick={onNewChat} collapsed={isCollapsed} />
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentId}
              onClick={() => onSelectConversation(conversation.id)}
              onDelete={() => onDeleteConversation(conversation.id)}
              showDelete={true}
              collapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Document Upload Section */}
        <div
          className={`p-2 border-t border-[var(--border-color)] transition-all duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
          }`}
        >
          <DocumentUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            className="mb-2"
          />
        </div>

        <div
          className={`p-4 border-t border-[var(--border-color)] transition-opacity duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
          }`}
        >
          <p className="text-xs text-[var(--text-secondary)]">GoodnightGPT • Beta</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Ctrl+Shift+O for new chat</p>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { sendMessage } from "@/services/api";
import { Message } from "@/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatInput } from "@/components/chat/ChatInput";

export default function ChatContainer() {
  const {
    conversations,
    currentConversation,
    currentId,
    setCurrentId,
    updateConversation,
    createNewChat,
    deleteConversation,
  } = useConversations();
  
  const [loading, setLoading] = useState(false);

  useKeyboardShortcuts({ onNewChat: createNewChat });

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: text.trim(),
    };

    setLoading(true);

    // Add user message immediately
    updateConversation(currentId, (conv) => {
      const updatedConv = { ...conv };
      updatedConv.messages = [...updatedConv.messages, userMessage];
      
      // Update title if it's a new chat
      if (updatedConv.title === "New Chat") {
        const firstLine = text.split("\n")[0].slice(0, 40) || "New Chat";
        updatedConv.title = firstLine;
      }
      
      updatedConv.updatedAt = Date.now();
      return updatedConv;
    });

    try {
      const aiMessage = await sendMessage(text);
      
      updateConversation(currentId, (conv) => {
        const updatedConv = { ...conv };
        updatedConv.messages = [...updatedConv.messages, aiMessage];
        updatedConv.updatedAt = Date.now();
        return updatedConv;
      });
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      
      updateConversation(currentId, (conv) => {
        const updatedConv = { ...conv };
        updatedConv.messages = [...updatedConv.messages, errorMessage];
        updatedConv.updatedAt = Date.now();
        return updatedConv;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onNewChat={createNewChat}
        onSelectConversation={setCurrentId}
        onDeleteConversation={deleteConversation}
      />
      <div className="flex-1 flex flex-col relative">
        <ChatArea
          messages={currentConversation.messages}
          loading={loading}
          title={currentConversation.title}
        />
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </MainLayout>
  );
}

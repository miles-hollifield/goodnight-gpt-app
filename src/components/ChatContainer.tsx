"use client";

import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { sendMessage } from "@/services/api";
import { Message } from "@/types";
import { 
  Box, 
  Container, 
  Typography, 
  AppBar, 
  Toolbar, 
  Paper,
  CircularProgress,
  IconButton,
  Tooltip
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatInput } from "@/components/chat/ChatInput";

let userMessageIdCounter = 2000; // Start higher to avoid conflicts

export default function ChatContainer() {
  const {
    currentConversation,
    currentId,
    updateConversation,
    createNewChat,
  } = useConversations();
  
  const [loading, setLoading] = useState(false);

  useKeyboardShortcuts({ onNewChat: createNewChat });

  // Show loading state while initializing
  if (!currentConversation) {
    return (
      <Box 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: userMessageIdCounter++,
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
      console.log('Added user message, total messages:', updatedConv.messages.length);
      console.log('Messages:', updatedConv.messages.map(m => ({ sender: m.sender, text: m.text.slice(0, 50) })));
      return updatedConv;
    });

    try {
      const aiMessage = await sendMessage(text);
      
      // Add AI message while preserving the user message
      updateConversation(currentId, (conv) => {
        const updatedConv = { ...conv };
        // Make sure we don't lose the user message
        updatedConv.messages = [...updatedConv.messages, aiMessage];
        updatedConv.updatedAt = Date.now();
        console.log('Added AI message, total messages:', updatedConv.messages.length);
        console.log('Messages:', updatedConv.messages.map(m => ({ sender: m.sender, text: m.text.slice(0, 50) })));
        return updatedConv;
      });
    } catch (error) {
      const errorMessage: Message = {
        id: userMessageIdCounter++,
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold">
              GoodnightGPT
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask me anything about scholarships and I&apos;ll help you find the answers.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            )}
            <Tooltip title="Start New Chat">
              <IconButton 
                onClick={createNewChat}
                color="primary"
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Chat Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Chat Messages Container */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <Container maxWidth="md" sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            py: 2
          }}>
            <ChatArea
              messages={currentConversation.messages}
              loading={loading}
            />
          </Container>
        </Box>

        {/* Input Area */}
        <Paper elevation={3} sx={{ 
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Container maxWidth="md" sx={{ py: 2 }}>
            <ChatInput onSend={handleSendMessage} disabled={loading} />
          </Container>
        </Paper>
      </Box>
    </Box>
  );
}

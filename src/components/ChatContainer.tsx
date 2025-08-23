"use client";

import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { sendMessage } from "@/services/api";
import { Message, ChatError } from "@/types";
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
import { ErrorNotification } from "@/components/ErrorNotification";
import { ConnectionStatus } from "@/components/ConnectionStatus";

let userMessageIdCounter = 2000; // Start higher to avoid conflicts

export default function ChatContainer() {
  const {
    currentConversation,
    currentId,
    updateConversation,
    createNewChat,
  } = useConversations();
  
  const [loading, setLoading] = useState(false);
  const [currentError, setCurrentError] = useState<ChatError | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

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
    setCurrentError(null); // Clear any previous errors

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
      
      // Clear any stored failed message on success
      setLastFailedMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Store the failed message for retry
      setLastFailedMessage(text.trim());
      
      if (error instanceof ChatError) {
        setCurrentError(error);
        
        // Don't add error message to chat for retryable errors
        if (!error.retryable) {
          const errorMessage: Message = {
            id: userMessageIdCounter++,
            sender: "ai",
            text: error.userMessage,
          };
          
          updateConversation(currentId, (conv) => {
            const updatedConv = { ...conv };
            updatedConv.messages = [...updatedConv.messages, errorMessage];
            updatedConv.updatedAt = Date.now();
            return updatedConv;
          });
        }
      } else {
        // Fallback for non-ChatError instances
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
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLastMessage = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleDismissError = () => {
    setCurrentError(null);
    setLastFailedMessage(null);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Error Notification */}
      <ErrorNotification
        error={currentError}
        onRetry={handleRetryLastMessage}
        onDismiss={handleDismissError}
      />
      
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" component="h1" fontWeight="bold" sx={{ color: 'white' }}>
              GoodnightGPT
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Ask me anything about scholarships and I&apos;ll help you find the answers.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ConnectionStatus onStatusChange={setIsBackendOnline} />
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Thinking...
                </Typography>
              </Box>
            )}
            <Tooltip title="Start New Chat">
              <IconButton 
                onClick={createNewChat}
                sx={{ color: 'white' }}
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
          borderColor: 'divider',
          opacity: isBackendOnline ? 1 : 0.6
        }}>
          <Container maxWidth="md" sx={{ py: 2 }}>
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={loading || !isBackendOnline}
              placeholder={
                !isBackendOnline 
                  ? "Service is offline. Please check your connection." 
                  : undefined
              }
            />
          </Container>
        </Paper>
      </Box>
    </Box>
  );
}

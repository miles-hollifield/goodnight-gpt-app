"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, IconButton, InputBase, CircularProgress, Avatar, Stack, Tooltip, List, ListItemButton, ListItemText, Divider, Button, Fade } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { DocumentUpload } from "@/components/DocumentUpload";
import { UploadResponse } from "@/services/api";

interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  context?: RetrievedContext[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface RetrievedContext {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

const LS_KEY = "gn_conversations_v1";

const initialGreeting = "Hello! How can I help you with your scholarship questions today?";

let chatUIMessageIdCounter = 3000; // Start higher to avoid conflicts

function createBlankConversation(): Conversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [ { id: chatUIMessageIdCounter++, sender: "ai", text: initialGreeting } ],
    createdAt: now,
    updatedAt: now
  };
}

export default function ChatUI() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [createBlankConversation()];
  });
  const [currentId, setCurrentId] = useState<string>(() => conversations[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === currentId)!;
  const messages = currentConversation.messages;

  const persist = useCallback((next: Conversation[]) => {
    setConversations(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateConversation = (convId: string, updater: (c: Conversation) => Conversation) => {
    persist(conversations.map(c => c.id === convId ? updater({ ...c }) : c));
  };

  const createNewChat = () => {
    const fresh = createBlankConversation();
    persist([fresh, ...conversations]);
    setCurrentId(fresh.id);
    setInput("");
  };

  const deleteConversation = (convId: string) => {
    const filtered = conversations.filter(c => c.id !== convId);
    if (filtered.length === 0) {
      const fresh = createBlankConversation();
      persist([fresh]);
      setCurrentId(fresh.id);
    } else {
      persist(filtered);
      if (convId === currentId) setCurrentId(filtered[0].id);
    }
  };

  const handleUploadSuccess = (response: UploadResponse) => {
    // Create a system message to inform the user about the successful upload
    const systemMessage: Message = {
      id: chatUIMessageIdCounter++,
      sender: "ai",
      text: `✅ Document uploaded successfully!\n\n**${response.message}**\n\nProcessed ${response.chunks_indexed} chunks. Your document is now searchable in the knowledge base. You can ask questions about it!`
    };
    
    updateConversation(currentId, conv => ({
      ...conv,
      messages: [...conv.messages, systemMessage],
      updatedAt: Date.now()
    }));
  };

  const handleUploadError = (error: Error) => {
    // Create an error message to inform the user
    const errorMessage: Message = {
      id: chatUIMessageIdCounter++,
      sender: "ai", 
      text: `❌ Upload failed: ${error.message}\n\nPlease try again or contact support if the issue persists.`
    };
    
    updateConversation(currentId, conv => ({
      ...conv,
      messages: [...conv.messages, errorMessage],
      updatedAt: Date.now()
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: chatUIMessageIdCounter++, sender: "user", text: input };
    setInput("");
    setLoading(true);
    // Add user message immediately
    updateConversation(currentId, c => {
      c.messages = [...c.messages, userMsg];
      if (c.title === "New Chat") {
        const firstContentLine = userMsg.text.split(/\n/)[0].slice(0, 40) || "New Chat";
        c.title = firstContentLine;
      }
      c.updatedAt = Date.now();
      return c;
    });
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text })
      });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      const data = await res.json();
      const aiMsg: Message = {
        id: chatUIMessageIdCounter++,
        sender: "ai",
        text: data.response ?? "(no response)",
        context: data.context
      };
      updateConversation(currentId, c => {
        c.messages = [...c.messages, aiMsg];
        c.updatedAt = Date.now();
        return c;
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const errMsg: Message = { id: chatUIMessageIdCounter++, sender: "ai", text: `Error: ${message}` };
      updateConversation(currentId, c => { c.messages = [...c.messages, errMsg]; c.updatedAt = Date.now(); return c; });
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Sidebar */}
  <Box component="aside" sx={{ width: 260, bgcolor: 'grey.900', color: 'grey.100', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'grey.800' }}>
        <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
          <Button onClick={createNewChat} startIcon={<AddIcon />} fullWidth size="small" variant="outlined" sx={{ color: 'grey.100', borderColor: 'grey.700', textTransform: 'none', '&:hover': { borderColor: 'grey.500' } }}>New Chat</Button>
        </Box>
        <Divider sx={{ borderColor: 'grey.800' }} />
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List dense disablePadding aria-label="Conversation list">
            {conversations.map(conv => (
              <ListItemButton key={conv.id} selected={conv.id === currentId} onClick={() => setCurrentId(conv.id)} sx={{ alignItems: 'flex-start', py: 1, gap: 1, '&.Mui-selected': { bgcolor: 'grey.800' }, '&:focus-visible': { outline: '2px solid #90caf9', outlineOffset: 2 } }}>
                <ChatBubbleOutlineIcon fontSize="small" sx={{ mt: '2px', color: conv.id === currentId ? 'primary.light' : 'grey.300' }} />
                <ListItemText primaryTypographyProps={{ noWrap: true, fontSize: 13, color: 'grey.100' }} primary={conv.title || 'Untitled'} secondaryTypographyProps={{ fontSize: 10, color: 'grey.400' }} secondary={new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                {conversations.length > 1 && (
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} sx={{ ml: 1, color: 'grey.400', '&:hover': { color: 'error.light' }, '&:focus-visible': { outline: '2px solid #f44336', outlineOffset: 2 } }} aria-label="Delete chat">
                    <DeleteOutlineIcon fontSize="inherit" />
                  </IconButton>
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Divider sx={{ borderColor: 'grey.800' }} />
        
        {/* Document Upload Section */}
        <Box sx={{ p: 1.5 }}>
          <DocumentUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Box>
        
        <Divider sx={{ borderColor: 'grey.800' }} />
        <Box sx={{ p: 1.5 }}>
          <Typography variant="caption" color="grey.400">GoodnightGPT • Beta</Typography>
        </Box>
      </Box>
      {/* Main Chat Area */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>{currentConversation.title === 'New Chat' ? 'GoodnightGPT' : currentConversation.title}</Typography>
          {loading && <CircularProgress size={18} />}
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 3 }}>
          <Stack spacing={3} maxWidth={860} mx="auto">
            {messages.map((msg) => (
              <Fade in key={msg.id} timeout={200}>
                <Box display="flex" gap={2} alignItems="flex-start" flexDirection={msg.sender === 'user' ? 'row-reverse' : 'row'} role="group" aria-label={msg.sender === 'user' ? 'User message' : 'AI message'}>
                  <Avatar sx={{ bgcolor: msg.sender === 'user' ? 'primary.main' : 'grey.700', width: 40, height: 40, fontSize: 16 }} aria-hidden>{msg.sender === 'user' ? 'You' : 'AI'}</Avatar>
                  <Paper variant="outlined" sx={{ p: 2, flexShrink: 1, maxWidth: '100%', bgcolor: msg.sender === 'user' ? 'primary.light' : 'background.paper', borderColor: 'divider' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: msg.sender === 'user' ? 'grey.900' : 'text.primary' }}>{msg.text}</Typography>
                    {msg.sender === 'ai' && msg.context && msg.context.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary">Sources:</Typography>
                        <Stack spacing={0.5} mt={0.5}>
                          {msg.context.slice(0,3).map((c) => (
                            <Tooltip key={c.id} title={`Score: ${c.score.toFixed(3)}\n${c.text}`} placement="right" arrow>
                              <Paper variant="outlined" sx={{ p: 0.5, bgcolor: 'grey.50', borderColor: 'grey.200' }}>
                                <Typography variant="caption" noWrap color="grey.800">{c.text}</Typography>
                              </Paper>
                            </Tooltip>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Fade>
            ))}
            {loading && (
              <Box display="flex" gap={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'grey.700', width: 40, height: 40, fontSize: 16 }} aria-hidden>AI</Avatar>
                <CircularProgress size={22} />
              </Box>
            )}
            <div ref={chatEndRef} />
          </Stack>
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          <Paper component="form" onSubmit={e => { e.preventDefault(); handleSend(); }} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 1.5, maxWidth: 860, mx: 'auto' }}>
            <InputBase
              sx={{ flex: 1, maxHeight: 200, overflow: 'auto' }}
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              multiline
              autoFocus
              inputProps={{ 'aria-label': 'Type your message' }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading} aria-label="send message" sx={{ alignSelf: 'flex-end' }}>
              <SendIcon />
            </IconButton>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

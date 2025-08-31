"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Box, Paper, Typography, IconButton, InputBase, CircularProgress, Avatar, Stack, Tooltip, List, ListItemButton, Button, Fade } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PersonIcon from "@mui/icons-material/Person";
import FolderIcon from "@mui/icons-material/Folder";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { SourcesTab } from "@/components/SourcesTab";
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

const initialGreeting = "Hello! How can I help you with the Goodnight program today?";

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

function generateChatTitle(userMessage: string): string {
  // Remove common question words and clean up the message
  const cleaned = userMessage
    .replace(/^(what|how|when|where|why|who|can|could|would|should|do|does|did|is|are|was|were|tell me|explain|help me)\s+/i, '')
    .trim();
  
  // Take the first sentence or meaningful phrase
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  
  // If it's too long, truncate intelligently
  let title;
  if (firstSentence.length > 50) {
    const words = firstSentence.split(' ');
    let truncated = '';
    for (const word of words) {
      if ((truncated + word).length > 47) break;
      truncated += (truncated ? ' ' : '') + word;
    }
    title = truncated + '...';
  } else {
    title = firstSentence || "New Chat";
  }
  
  // Capitalize the first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export default function ChatUI() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Update the global counter to be higher than any existing message ID
          const allMessageIds = parsed.flatMap(conv => conv.messages.map(msg => msg.id));
          const maxId = Math.max(...allMessageIds, chatUIMessageIdCounter);
          chatUIMessageIdCounter = maxId + 1;
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return [];
  });
  const [currentId, setCurrentId] = useState<string>(() => conversations.length > 0 ? conversations[0].id : "");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'sources'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === currentId);
  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation?.messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateConversation = useCallback((convId: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prevConversations => {
      const updated = prevConversations.map(c => c.id === convId ? updater({ ...c }) : c);
      try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const createNewChat = () => {
    const fresh = createBlankConversation();
    setConversations(prev => {
      const updated = [fresh, ...prev];
      try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
    setCurrentId(fresh.id);
    setActiveView('chat');
    setInput("");
  };

  const deleteConversation = (convId: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== convId);
      if (filtered.length === 0) {
        // If no conversations left, clear currentId and return empty array
        setCurrentId("");
        try { localStorage.setItem(LS_KEY, JSON.stringify([])); } catch { /* ignore */ }
        return [];
      } else {
        // If there are conversations left, update currentId if needed
        if (convId === currentId) setCurrentId(filtered[0].id);
        try { localStorage.setItem(LS_KEY, JSON.stringify(filtered)); } catch { /* ignore */ }
        return filtered;
      }
    });
  };

  const handleUploadSuccess = (response: UploadResponse) => {
    // Create a new conversation if none exists
    let targetConversationId = currentId;
    if (conversations.length === 0) {
      const fresh = createBlankConversation();
      setConversations([fresh]);
      setCurrentId(fresh.id);
      targetConversationId = fresh.id;
    }
    
    // Create a system message to inform the user about the successful upload
    const systemMessage: Message = {
      id: chatUIMessageIdCounter++,
      sender: "ai",
      text: `✅ Document uploaded successfully!\n\n**${response.message}**\n\nProcessed ${response.chunks_indexed} chunks. Your document is now searchable in the knowledge base. You can ask questions about it!`
    };
    
    updateConversation(targetConversationId, conv => ({
      ...conv,
      messages: [...conv.messages, systemMessage],
      updatedAt: Date.now()
    }));
  };

  const handleUploadError = (error: Error) => {
    // Create a new conversation if none exists
    let targetConversationId = currentId;
    if (conversations.length === 0) {
      const fresh = createBlankConversation();
      setConversations([fresh]);
      setCurrentId(fresh.id);
      targetConversationId = fresh.id;
    }
    
    // Create an error message to inform the user
    const errorMessage: Message = {
      id: chatUIMessageIdCounter++,
      sender: "ai", 
      text: `❌ Upload failed: ${error.message}\n\nPlease try again or contact support if the issue persists.`
    };
    
    updateConversation(targetConversationId, conv => ({
      ...conv,
      messages: [...conv.messages, errorMessage],
      updatedAt: Date.now()
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    let targetConversationId = currentId;
    
    // If no conversations exist, create a new one
    if (conversations.length === 0) {
      const fresh = createBlankConversation();
      setConversations([fresh]);
      setCurrentId(fresh.id);
      targetConversationId = fresh.id;
    }
    
    const userMsg: Message = { id: chatUIMessageIdCounter++, sender: "user", text: input };
    console.log("Sending user message:", userMsg);
    setInput("");
    setLoading(true);
    // Add user message immediately
    updateConversation(targetConversationId, c => {
      // Generate a more meaningful title from the user's message
      let newTitle = c.title;
      if (c.title === "New Chat") {
        newTitle = generateChatTitle(userMsg.text);
      }
      
      const updated = {
        ...c,
        messages: [...c.messages, userMsg],
        title: newTitle,
        updatedAt: Date.now()
      };
      console.log("Updated conversation with user message:", updated);
      return updated;
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
      console.log("Adding AI message:", aiMsg);
      updateConversation(targetConversationId, c => {
        const updated = {
          ...c,
          messages: [...c.messages, aiMsg],
          updatedAt: Date.now()
        };
        console.log("Updated conversation with AI message:", updated);
        return updated;
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const errMsg: Message = { id: chatUIMessageIdCounter++, sender: "ai", text: `Error: ${message}` };
      updateConversation(targetConversationId, c => ({
        ...c,
        messages: [...c.messages, errMsg],
        updatedAt: Date.now()
      }));
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
    <Box sx={{ display: 'flex', height: '100vh', width: '100%', bgcolor: '#ffffff', overflow: 'hidden' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Box component="aside" sx={{ 
          width: 260, 
          bgcolor: '#f7f7f8', 
          color: '#374151', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          {/* Sidebar Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            height: 56,
            // borderBottom: '1px solid #e5e7eb'
          }}>
            {/* Logo/Icon Area */}
            <Box 
              component="button"
              onClick={() => window.location.href = '/'}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
              aria-label="Go to main page"
            >
              <Typography sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
                GN
              </Typography>
            </Box>
            
            {/* Collapse Button */}
            <IconButton 
              onClick={() => setSidebarOpen(false)}
              size="small"
              sx={{ 
                color: '#6b7280',
                '&:hover': { 
                  color: '#374151',
                  bgcolor: '#f3f4f6'
                }
              }}
            >
              <KeyboardDoubleArrowLeftIcon fontSize="small" />
            </IconButton>
          </Box>
        {/* New Chat Button */}
        <Box sx={{ p: 2 }}>
          <Button 
            onClick={createNewChat} 
            startIcon={<AddIcon />} 
            fullWidth 
            variant="outlined" 
            sx={{ 
              color: '#374151',
              borderColor: '#d1d5db',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5,
              borderRadius: 2,
              '&:hover': { 
                borderColor: '#9ca3af',
                bgcolor: '#f9fafb'
              }
            }}
          >
            New Chat
          </Button>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={() => setActiveView('sources')}
            startIcon={<FolderIcon />}
            fullWidth
            sx={{
              color: activeView === 'sources' ? '#374151' : '#6b7280',
              bgcolor: activeView === 'sources' ? '#e5e7eb' : 'transparent',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5,
              px: 2,
              borderRadius: 2,
              justifyContent: 'flex-start',
              '&:hover': { 
                bgcolor: '#f3f4f6',
                color: '#374151'
              }
            }}
          >
            Library
          </Button>
        </Box>

        {/* Chat History */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '12px', px: 1, mb: 1, display: 'block' }}>
            Recent
          </Typography>
          <List dense disablePadding>
            {conversations.length === 0 ? (
              <Box sx={{ 
                p: 3, 
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <Typography variant="body2" sx={{ fontSize: '13px' }}>
                  No conversations yet.
                  <br />
                  Start by asking a question below!
                </Typography>
              </Box>
            ) : (
              conversations.map(conv => (
              <ListItemButton 
                key={conv.id} 
                selected={conv.id === currentId} 
                onClick={() => {setCurrentId(conv.id); setActiveView('chat');}} 
                sx={{ 
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': { 
                    bgcolor: '#e5e7eb',
                    '&:hover': {
                      bgcolor: '#d1d5db'
                    }
                  },
                  '&:hover': {
                    bgcolor: '#f3f4f6'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5 }}>
                  <ChatBubbleOutlineIcon 
                    fontSize="small" 
                    sx={{ 
                      color: conv.id === currentId ? '#374151' : '#6b7280',
                      flexShrink: 0
                    }} 
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#374151',
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {conv.title || 'New Chat'}
                    </Typography>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deleteConversation(conv.id); 
                    }} 
                    sx={{ 
                      color: '#9ca3af',
                      p: 0.5,
                      opacity: 0,
                      '.MuiListItemButton-root:hover &': {
                        opacity: 1
                      },
                      '&:hover': { 
                        color: '#ef4444',
                        bgcolor: '#fef2f2'
                      }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItemButton>
            ))
            )}
          </List>
        </Box>

        {/* User Profile Section */}
        <Box sx={{ 
          p: 2.8, 
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'default',
          '&:hover': {
            bgcolor: '#f9fafb'
          }
        }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PersonIcon sx={{ color: '#ffffff', fontSize: 18 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>
              Miles Hollifield
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '12px' }}>
              mfhollif@ncsu.edu
            </Typography>
          </Box>
        </Box>
      </Box>
      )}

      {/* Main Content Area */}
      <Box component="main" sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: '#ffffff'
      }}>
        {activeView === 'chat' ? (
          <>
            {/* Header */}
            <Box sx={{ 
              px: 2,
              py: 1, 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: '#ffffff',
              height: 56
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                {!sidebarOpen && (
                  <Box sx={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => setSidebarOpen(true)}
                      sx={{ 
                        color: '#6b7280',
                        '&:hover': { 
                          color: '#374151',
                          bgcolor: '#f3f4f6'
                        }
                      }}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Box>
                )}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: '18px'
                  }}
                >
                  GoodnightGPT
                </Typography>
              </Box>
              {loading && <CircularProgress size={20} sx={{ color: '#6b7280' }} />}
            </Box>

            {/* Messages Area */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              px: 4, 
              py: 4,
              bgcolor: '#ffffff'
            }}>
              <Stack spacing={4} maxWidth={768} mx="auto">
                {conversations.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    textAlign: 'center',
                    py: 8
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#111827',
                        mb: 2
                      }}
                    >
                      Welcome to GoodnightGPT
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#6b7280',
                        mb: 4,
                        maxWidth: 400
                      }}
                    >
                      Ask me anything about the Goodnight program, or upload documents to add them to the knowledge base.
                    </Typography>
                  </Box>
                ) : (
                  messages.map((msg, msgIndex) => (
                  <Fade in key={`${currentId}-${msg.id}-${msgIndex}`} timeout={300}>
                    <Box 
                      display="flex" 
                      gap={3} 
                      alignItems="flex-start" 
                      flexDirection={msg.sender === 'user' ? 'row-reverse' : 'row'}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: msg.sender === 'user' ? '#1d4ed8' : '#f3f4f6',
                          color: msg.sender === 'user' ? '#ffffff' : '#374151',
                          width: 36, 
                          height: 36, 
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        {msg.sender === 'user' ? 'You' : 'AI'}
                      </Avatar>
                      <Box sx={{ 
                        flexShrink: 1, 
                        maxWidth: '100%',
                        minWidth: 0
                      }}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            bgcolor: msg.sender === 'user' ? '#2563eb' : '#ffffff',
                            border: msg.sender === 'user' ? '1px solid #2563eb' : '1px solid #e5e7eb',
                            borderRadius: 2,
                            boxShadow: 'none'
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              whiteSpace: 'pre-line',
                              color: msg.sender === 'user' ? '#ffffff' : '#374151',
                              fontSize: '15px',
                              lineHeight: 1.6
                            }}
                          >
                            {msg.text}
                          </Typography>
                          {msg.sender === 'ai' && msg.context && msg.context.length > 0 && (
                            <Box mt={2}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#6b7280',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  mb: 1,
                                  display: 'block'
                                }}
                              >
                                Sources:
                              </Typography>
                              <Stack spacing={1}>
                                {msg.context.slice(0,3).map((c, contextIndex) => (
                                  <Tooltip 
                                    key={`${currentId}-${msg.id}-context-${contextIndex}-${c.id}`} 
                                    title={`Score: ${c.score.toFixed(3)}\n${c.text}`} 
                                    placement="top" 
                                    arrow
                                  >
                                    <Paper 
                                      variant="outlined" 
                                      sx={{ 
                                        p: 1.5, 
                                        bgcolor: '#f9fafb',
                                        borderColor: '#e5e7eb',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          bgcolor: '#f3f4f6'
                                        }
                                      }}
                                    >
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: '#6b7280',
                                          fontSize: '12px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          display: 'block'
                                        }}
                                      >
                                        {c.text}
                                      </Typography>
                                    </Paper>
                                  </Tooltip>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    </Box>
                  </Fade>
                ))
                )}
                {loading && (
                  <Box display="flex" gap={3} alignItems="center">
                    <Avatar 
                      sx={{ 
                        bgcolor: '#f3f4f6',
                        color: '#374151',
                        width: 36, 
                        height: 36, 
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      AI
                    </Avatar>
                    <CircularProgress size={24} sx={{ color: '#6b7280' }} />
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Stack>
            </Box>

            {/* Input Area */}
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid #e5e7eb',
              bgcolor: '#ffffff'
            }}>
              <Box maxWidth={768} mx="auto">
                <Paper 
                  component="form" 
                  onSubmit={e => { e.preventDefault(); handleSend(); }} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: 2, 
                    p: 1.5,
                    border: '1px solid #d1d5db',
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    boxShadow: 'none',
                    '&:focus-within': {
                      borderColor: '#6b7280'
                    }
                  }}
                >
                  <InputBase
                    sx={{ 
                      flex: 1, 
                      fontSize: '15px',
                      color: '#374151',
                      '& input::placeholder': {
                        color: '#9ca3af'
                      }
                    }}
                    placeholder="Type your message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    multiline
                    maxRows={4}
                  />
                  <IconButton 
                    onClick={handleSend} 
                    disabled={!input.trim() || loading}
                    sx={{ 
                      bgcolor: input.trim() ? '#000000' : '#e5e7eb',
                      color: input.trim() ? '#ffffff' : '#9ca3af',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: input.trim() ? '#374151' : '#d1d5db'
                      },
                      '&:disabled': {
                        bgcolor: '#e5e7eb',
                        color: '#9ca3af'
                      }
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Box>
            </Box>
          </>
        ) : (
          <>
            {/* Sources Header */}
            <Box sx={{ 
              px: 2,
              py: 1, 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: '#ffffff',
              height: 56
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                {!sidebarOpen && (
                  <Box sx={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => setSidebarOpen(true)}
                      sx={{ 
                        color: '#6b7280',
                        '&:hover': { 
                          color: '#374151',
                          bgcolor: '#f3f4f6'
                        }
                      }}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Box>
                )}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: '18px'
                  }}
                >
                  Library
                </Typography>
              </Box>
            </Box>
            
            {/* Sources Content */}
            <Box sx={{ 
              flex: 1, 
              p: 4,
              bgcolor: '#ffffff',
              overflowY: 'auto'
            }}>
              <Box maxWidth={768} mx="auto">
                <SourcesTab
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

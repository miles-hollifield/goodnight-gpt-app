"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Box, Paper, Typography, IconButton, InputBase, CircularProgress, Avatar, Stack, Tooltip, List, ListItemButton, Button, Fade, Collapse } from "@mui/material";
import { alpha } from "@mui/material/styles";
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

// Create a short title from the first user + ai exchange
function summarizeInitialConversation(messages: Message[]): string {
  // Expect messages to include initial greeting (ai), then user, then ai
  const firstUser = messages.find(m => m.sender === 'user');
  const firstAiAfterUserIndex = firstUser
    ? messages.findIndex((m, idx) => idx > messages.indexOf(firstUser) && m.sender === 'ai')
    : -1;
  const firstAiAfterUser = firstAiAfterUserIndex >= 0 ? messages[firstAiAfterUserIndex] : null;

  // Helper config
  const STOPWORDS = new Set([
    'the','a','an','and','or','but','if','then','than','that','this','those','these','to','of','in','on','for','with','about','as','at','by','from','into','over','after','before','under','above','between','how','what','why','where','when','who','whom','which','can','could','would','should','do','does','did','is','are','was','were','be','being','been','have','has','had','i','you','we','they','it','my','your','our','their','me','us','them','please','help','kind','like','just','really','actually','basically','kinda','sorta'
  ]);
  const ACRONYM_MAP: Record<string, string> = {
    'api':'API','ui':'UI','ux':'UX','ai':'AI','ml':'ML','nlp':'NLP','sql':'SQL','csv':'CSV','pdf':'PDF','http':'HTTP','css':'CSS','html':'HTML','gpt':'GPT','gpa':'GPA','ira':'IRA','sat':'SAT','act':'ACT','c++':'C++','c#':'C#',
    'react':'React','next.js':'Next.js','nextjs':'Next.js','node.js':'Node.js','nodejs':'Node.js','typescript':'TypeScript','javascript':'JavaScript'
  };
  const normalizeToken = (w: string) => w
    .toLowerCase()
    .replace(/^can\s+you\s+|^could\s+you\s+|^would\s+you\s+|^can\s+u\s+|^could\s+u\s+|^pls\s+|^please\s+|^i\s+need\s+|^i\s+want\s+|^i\s*'m\s+trying\s+to\s+|^how\s+do\s+i\s+|^how\s+to\s+|^what\s+is\s+|^what\s+are\s+|^why\s+is\s+/i, '')
    .replace(/^[^a-z0-9]+|[^a-z0-9)(+.#-]+$/gi, ''); // keep (), +, ., #, - in tokens
  const tokenize = (text: string) => text
    .replace(/[!?]+/g, ' ')
    .split(/\s+/)
    .map(t => normalizeToken(t))
    .filter(Boolean);
  const isAcronymLike = (t: string) => /\d|\([a-z0-9]+\)/i.test(t) || Object.prototype.hasOwnProperty.call(ACRONYM_MAP, t);
  const titleCaseWord = (t: string) => {
    const lower = t.toLowerCase();
    if (ACRONYM_MAP[lower]) return ACRONYM_MAP[lower];
    // Handle hyphenated tokens like server-side
    return lower.split('-').map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : part).join('-');
  };
  // Verb normalization to canonical verb
  const VERB_CANON: Record<string, string> = {
    'debug':'debug','troubleshoot':'debug','diagnose':'debug',
    'plan':'plan','planning':'plan','schedule':'plan',
    'design':'design','build':'build','create':'create','make':'create','implement':'implement','write':'write','code':'write',
    'fix':'fix','repair':'fix','resolve':'fix',
    'deploy':'deploy','ship':'deploy','release':'deploy',
    'optimize':'optimize','improve':'improve','tune':'optimize',
    'explain':'explain','teach':'explain','tell':'explain','clarify':'explain',
    'compare':'compare','contrast':'compare','summarize':'summarize','overview':'summarize',
    'setup':'setup','set-up':'setup','set':'setup','configure':'configure','install':'install','update':'update','upgrade':'upgrade','migrate':'migrate',
    'save':'save','invest':'invest','budget':'budget','plan-budget':'budget'
  };
  // Map canonical verbs to noun forms suitable for titles
  const VERB_TO_NOUN: Record<string, string> = {
    'debug':'Debugging',
    'plan':'Planning',
    'design':'Design',
    'build':'Build',
    'create':'Creation',
    'implement':'Implementation',
    'write':'Writing',
    'fix':'Fixing',
    'deploy':'Deployment',
    'optimize':'Optimization',
    'improve':'Improvement',
    'compare':'Comparison',
    'summarize':'Summary',
    'setup':'Setup',
    'configure':'Configuration',
    'install':'Installation',
    'update':'Update',
    'upgrade':'Upgrade',
    'migrate':'Migration',
    'invest':'Investment',
    'budget':'Budgeting'
  };
  const NON_SUBSTANTIVE_VERBS = new Set(['explain']); // usually omit tail like "Explanation"

  const extractTokensWithVerbs = (text: string) => {
    const raw = tokenize(text);
    const tokens: string[] = [];
    const verbs: string[] = [];
    // detect "set up" phrase
    const joined = ` ${text.toLowerCase()} `;
    if (/(^|\W)set\s+up(\W|$)/.test(joined) && !raw.includes('setup')) raw.push('setup');
    for (const tok of raw) {
      const base = tok.toLowerCase();
      if (!base) continue;
      if (STOPWORDS.has(base)) continue;
      if (!isAcronymLike(base) && /^\d+$/.test(base)) continue; // drop bare numbers
      const canonVerb = VERB_CANON[base];
      if (canonVerb) {
        if (!verbs.includes(canonVerb)) verbs.push(canonVerb);
        // Some verbs also imply a subject token (e.g., save -> savings)
        if (canonVerb === 'save' && !tokens.includes('savings')) tokens.push('savings');
        continue; // don't add verb token to subjects
      }
      if (!tokens.includes(base)) tokens.push(base);
    }
    return { tokens, verbs };
  };

  const MAX_WORDS = 6;
  const MAX_CHARS = 60;

  const buildTitle = (primary: string, secondary?: string) => {
    const primaryInfo = extractTokensWithVerbs(primary);
  const subjects = [...primaryInfo.tokens];
  const verbs = [...primaryInfo.verbs];
    // Enrich from secondary if needed
    if (secondary && subjects.length < 3) {
      const secondaryInfo = extractTokensWithVerbs(secondary);
      for (const t of secondaryInfo.tokens) if (!subjects.includes(t)) subjects.push(t);
      for (const v of secondaryInfo.verbs) if (!verbs.includes(v)) verbs.push(v);
    }
    if (subjects.length === 0 && verbs.length === 0) return '';

    // Choose an action tail noun if helpful
    let tail: string | null = null;
    for (const v of verbs) {
      if (NON_SUBSTANTIVE_VERBS.has(v)) continue; // skip explanation-like tails
      // Special case: save -> append "Strategy" in addition to "Savings" subject
      if (v === 'save') {
        tail = 'Strategy';
        break;
      }
      const noun = VERB_TO_NOUN[v];
      if (noun) { tail = noun; break; }
    }

    // Build title from subjects + optional tail
    const words: string[] = [];
    for (const s of subjects) {
      if (words.length >= (tail ? MAX_WORDS - 1 : MAX_WORDS)) break;
      words.push(s);
    }
    if (tail) words.push(...tail.split(' '));
    const limited = words.slice(0, MAX_WORDS);
    let title = limited.map(titleCaseWord).join(' ');
    if (title.length > MAX_CHARS) title = title.slice(0, MAX_CHARS).replace(/[\s,.;:]+$/g, '').trim();
    if (!title || title.toLowerCase() === 'new chat') return '';
    return title;
  };

  if (firstUser && firstAiAfterUser) {
    const t = buildTitle(firstUser.text, firstAiAfterUser.text) || generateChatTitle(firstUser.text);
    if (t && t !== 'New Chat') return t;
  }

  // If only user exists, try cleaned question
  if (firstUser && firstUser.text.trim()) {
    const candidate = buildTitle(firstUser.text) || generateChatTitle(firstUser.text);
    if (candidate && candidate !== 'New Chat' && candidate.length >= 3) return candidate;
  }

  // If only AI exists, try first sentence
  if (firstAiAfterUser && firstAiAfterUser.text.trim()) {
    const cleaned = firstAiAfterUser.text
      .replace(/^sure[:,]?\s*/i, '')
      .replace(/^here(?:'s| is)\s*(?:an?|the)\s*/i, '')
      .trim();
    const firstSentence = cleaned.split(/[.!?]/)[0].trim();
    const title = firstSentence.length > 50 ? firstSentence.slice(0, 47).trim() + '...' : (firstSentence || 'New Chat');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  return 'New Chat';
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

  // Helper: collapse raw retrieved contexts into unique document sources
  const toDocumentSources = useCallback((ctx: RetrievedContext[] | undefined) => {
    if (!ctx || ctx.length === 0) return [] as Array<{ docId: string; source: string; type: string; score: number; text?: string }>;
    const byDoc: Record<string, { docId: string; source: string; type: string; score: number; text?: string }> = {};
    for (const c of ctx) {
      const id = String(c.id || "");
      const docId = id.includes("-") ? id.slice(0, id.lastIndexOf("-")) : id;
      const meta = (c.metadata || {}) as Record<string, unknown>;
      const source = String(meta["source"] ?? docId ?? "Unknown");
      const type = String(meta["type"] ?? "unknown").toLowerCase();
      const score = typeof c.score === 'number' ? c.score : 0;
      // Keep the best (highest score) entry per doc
      const existing = byDoc[docId];
      if (!existing || score > existing.score) {
        byDoc[docId] = { docId, source, type, score, text: typeof c.text === 'string' ? c.text : undefined };
      }
    }
    return Object.values(byDoc).sort((a, b) => b.score - a.score);
  }, []);

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
    // Add user message immediately (do not set title yet)
    updateConversation(targetConversationId, c => {
      const updated = {
        ...c,
        messages: [...c.messages, userMsg],
        updatedAt: Date.now()
      };
      console.log("Updated conversation with user message:", updated);
      return updated;
    });
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      // Build minimal history to carry context (user/assistant roles only)
      const history = currentConversation?.messages.map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      })) ?? [];
      const res = await fetch(`${base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, history })
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
        const updatedMessages = [...c.messages, aiMsg];
        const newTitle = c.title === 'New Chat' ? summarizeInitialConversation(updatedMessages) : c.title;
        const updated = {
          ...c,
          messages: updatedMessages,
          title: newTitle,
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
  <Box sx={{ display: 'flex', height: '100vh', width: '100%', bgcolor: 'background.default', overflow: 'hidden', alignItems: 'stretch' }}>
      {/* Sidebar (animated) */}
      <Collapse in={sidebarOpen} orientation="horizontal" collapsedSize={0} timeout={300} sx={{ height: '100%', display: 'flex' }}>
        <Box component="aside" sx={{ 
          width: 260, 
          bgcolor: 'background.paper', 
          color: 'text.primary', 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: 1,
          borderColor: 'divider',
          position: 'relative',
          height: '100%',
          transition: 'width 0.3s ease'
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
                bgcolor: 'var(--brand-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'var(--brand-red)',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
              aria-label="Go to main page"
            >
              <Typography sx={{ color: 'var(--brand-white)', fontWeight: 'bold', fontSize: '16px' }}>
                GN
              </Typography>
            </Box>
            
            {/* Collapse Button */}
            <IconButton 
              onClick={() => setSidebarOpen(false)}
              size="small"
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'grey.100' } }}
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
            sx={{ color: 'text.primary', borderColor: 'divider', textTransform: 'none', fontWeight: 500, py: 1.5, borderRadius: 2, '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' } }}
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
        color: activeView === 'sources' ? 'text.primary' : 'text.secondary',
        bgcolor: activeView === 'sources' ? 'grey.200' : 'transparent',
              textTransform: 'none',
              fontWeight: 500,
              py: 1.5,
              px: 2,
              borderRadius: 2,
              justifyContent: 'flex-start',
        '&:hover': { bgcolor: 'grey.100', color: 'text.primary' }
            }}
          >
            Library
          </Button>
        </Box>

        {/* Chat History */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '12px', px: 1, mb: 1, display: 'block' }}>
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
                    bgcolor: 'grey.200',
                    '&:hover': {
                      bgcolor: 'grey.300'
                    }
                  },
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1.5 }}>
                  <ChatBubbleOutlineIcon 
                    fontSize="small" 
                    sx={{ 
                      color: conv.id === currentId ? 'text.primary' : 'text.secondary',
                      flexShrink: 0
                    }} 
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: 'text.primary',
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
                    sx={(theme) => ({ 
                      color: theme.palette.grey[400],
                      p: 0.5,
                      opacity: 0,
                      '.MuiListItemButton-root:hover &': { opacity: 1 },
                      '&:hover': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.08) }
                    })}
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
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'default',
          '&:hover': {
            bgcolor: 'grey.50'
          }
        }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'var(--brand-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PersonIcon sx={{ color: 'var(--brand-white)', fontSize: 18 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '14px', fontWeight: 500 }}>
              Miles Hollifield
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.400', fontSize: '12px' }}>
              mfhollif@ncsu.edu
            </Typography>
          </Box>
        </Box>
        </Box>
      </Collapse>

      {/* Main Content Area */}
      <Box component="main" sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: 'background.default'
      }}>
        {activeView === 'chat' ? (
          <>
            {/* Header */}
            <Box sx={{ 
              px: 2,
              py: 1, 
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: 'var(--brand-red)',
              height: 56
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                {!sidebarOpen && (
                  <Box sx={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => setSidebarOpen(true)}
                      sx={{ color: 'var(--brand-white)', '&:hover': { color: 'var(--brand-white)' } }}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Box>
                )}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'var(--brand-white)',
                    fontSize: '18px'
                  }}
                >
                  GoodnightGPT
                </Typography>
              </Box>
              {loading && <CircularProgress size={20} sx={{ color: 'text.secondary' }} />}
            </Box>

            {/* Messages Area */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              px: 4, 
              py: 4,
              bgcolor: 'background.default'
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
            color: 'text.primary',
                        mb: 2
                      }}
                    >
                      Welcome to GoodnightGPT
                    </Typography>
          <Typography 
                      variant="body1" 
                      sx={{ 
            color: 'text.secondary',
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
              bgcolor: 'grey.100',
              color: 'text.primary',
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
                            bgcolor: 'background.default',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            boxShadow: 'none'
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              whiteSpace: 'pre-line',
                              color: 'text.primary',
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
                                  color: 'text.secondary',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  mb: 1,
                                  display: 'block'
                                }}
                              >
                                Source:
                              </Typography>
                              <Stack spacing={1}>
                                {toDocumentSources(msg.context).slice(0,1).map((s, i) => (
                                  <Tooltip 
                                    key={`${currentId}-${msg.id}-source-${i}-${s.docId}`} 
                                    title={`Score: ${s.score.toFixed(3)}${s.text ? `\n${s.text}` : ''}`} 
                                    placement="top" 
                                    arrow
                                  >
                                    <Paper 
                                      variant="outlined" 
                                      sx={{ 
                                        p: 1.5, 
                                        bgcolor: 'grey.50',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        cursor: 'default',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        '&:hover': { bgcolor: 'grey.100' }
                                      }}
                                    >
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: 'text.primary',
                                          fontSize: '12px',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          flex: 1
                                        }}
                                      >
                                        {s.source}
                                      </Typography>
                                      <Box sx={{ px: 0.75, py: 0.25, bgcolor: 'grey.200', borderRadius: 1 }}>
                                        <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                                          {(s.type || 'unknown').toUpperCase()}
                                        </Typography>
                                      </Box>
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
            bgcolor: 'grey.100',
            color: 'text.primary',
                        width: 36, 
                        height: 36, 
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      AI
                    </Avatar>
          <CircularProgress size={24} sx={{ color: 'text.secondary' }} />
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Stack>
            </Box>

            {/* Input Area */}
            <Box sx={{ 
              p: 2, 
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.default'
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
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    boxShadow: 'none',
                    '&:focus-within': {
                      borderColor: 'text.secondary'
                    }
                  }}
                >
                  <InputBase
                    sx={{ 
                      flex: 1, 
                      fontSize: '15px',
                      color: 'text.primary',
                      '& input::placeholder': {
                        color: 'grey.400'
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
                      bgcolor: input.trim() ? 'common.black' : 'grey.200',
                      color: input.trim() ? 'common.white' : 'grey.400',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: input.trim() ? 'grey.700' : 'grey.300'
                      },
                      '&:disabled': {
                        bgcolor: 'grey.200',
                        color: 'grey.400'
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
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              bgcolor: 'var(--brand-red)',
              height: 56
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                {!sidebarOpen && (
                  <Box sx={{ width: 40, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton 
                      size="small"
                      onClick={() => setSidebarOpen(true)}
                      sx={{ color: 'var(--brand-white)', '&:hover': { color: 'var(--brand-white)' } }}
                    >
                      <MenuIcon />
                    </IconButton>
                  </Box>
                )}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'var(--brand-white)',
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
              bgcolor: 'background.default',
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

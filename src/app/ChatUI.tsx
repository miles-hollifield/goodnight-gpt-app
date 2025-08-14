"use client";
import React, { useRef, useState, useEffect } from "react";
import { Box, Paper, Typography, IconButton, InputBase, CircularProgress, Avatar, Stack } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "ai", text: "Hello! How can I help you with your scholarship questions today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: "user" as const, text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    // Simulate AI response (replace with backend call)
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { id: Date.now() + 1, sender: "ai", text: "(AI response placeholder)" },
      ]);
      setLoading(false);
    }, 1200);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 520, minHeight: 600, display: "flex", flexDirection: "column", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", p: 2 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center">GoodnightGPT</Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "background.paper" }}>
          <Stack spacing={2}>
            {messages.map((msg) => (
              <Box key={msg.id} display="flex" flexDirection={msg.sender === "user" ? "row-reverse" : "row"} alignItems="flex-end">
                <Avatar sx={{ bgcolor: msg.sender === "user" ? "primary.main" : "grey.400", width: 32, height: 32, fontSize: 18 }}>
                  {msg.sender === "user" ? "U" : "AI"}
                </Avatar>
                <Paper sx={{ p: 1.5, mx: 1, maxWidth: 340, bgcolor: msg.sender === "user" ? "primary.light" : "grey.100" }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {loading && (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: "grey.400", width: 32, height: 32, fontSize: 18 }}>AI</Avatar>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={chatEndRef} />
          </Stack>
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "background.default" }}>
          <Paper component="form" sx={{ display: "flex", alignItems: "center", p: 1 }} onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              multiline
              maxRows={4}
              inputProps={{ "aria-label": "Type your message" }}
              autoFocus
            />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading} aria-label="send">
              <SendIcon />
            </IconButton>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
}

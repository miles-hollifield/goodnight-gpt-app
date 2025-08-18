"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Avatar,
  CircularProgress 
} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
}

export function ChatArea({ messages, loading }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  console.log('ChatArea rendering with messages:', messages.length);
  console.log('Messages:', messages.map(m => ({ sender: m.sender, text: m.text.slice(0, 50) })));

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        pb: 2
      }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            minHeight: '400px'
          }}>
            <Box sx={{ textAlign: 'center', maxWidth: 600, px: 3 }}>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 3,
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <ChatIcon sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                Welcome to GoodnightGPT!
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                I&apos;m here to help you find scholarship opportunities and answer your questions. 
                Each session is fresh and private - your conversation starts new every time.
                Just ask me anything about scholarships, eligibility requirements, application tips, or funding options.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ textAlign: 'left' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LightbulbIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Try asking:
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        &quot;What scholarships are available for computer science students?&quot;
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ textAlign: 'left' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GpsFixedIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          Or inquire:
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        &quot;How do I apply for need-based financial aid?&quot;
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        ) : (
          <Box>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <Box sx={{ 
                py: 3,
                bgcolor: 'grey.50',
                borderRadius: 1,
                mb: 2
              }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'grey.500', width: 40, height: 40 }}>
                    AI
                  </Avatar>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

"use client";

import { Message } from "@/types";
import { 
  Box, 
  Avatar, 
  Typography
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <Box sx={{ 
      py: 2,
      mb: 2,
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start'
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        maxWidth: '80%',
        flexDirection: isUser ? 'row-reverse' : 'row',
        bgcolor: isUser ? 'primary.main' : 'grey.50',
        borderRadius: 2,
        p: 2
      }}>
        <Avatar sx={{ 
          bgcolor: isUser ? 'primary.dark' : 'grey.500',
          width: 40,
          height: 40
        }}>
          {isUser ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-words',
              lineHeight: 1.6,
              color: isUser ? 'primary.contrastText' : 'text.primary'
            }}
          >
            {message.text}
          </Typography>
          
          {/* Sources/context section removed for now */}
        </Box>
      </Box>
    </Box>
  );
}

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
      py: 3,
      mb: 1,
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      px: 2
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2.5,
        maxWidth: '85%',
        flexDirection: isUser ? 'row-reverse' : 'row',
        bgcolor: isUser ? '#2563eb' : 'transparent',
        borderRadius: isUser ? 3 : 0,
        p: isUser ? 2.5 : 0,
        border: isUser ? 'none' : '1px solid #f3f4f6',
        borderLeft: isUser ? 'none' : '4px solid #e5e7eb'
      }}>
        <Avatar sx={{ 
          bgcolor: isUser ? '#1d4ed8' : '#6b7280',
          width: 36,
          height: 36,
          fontSize: '1rem'
        }}>
          {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden', pt: isUser ? 0 : 0.5 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-words',
              lineHeight: 1.7,
              fontSize: '15px',
              color: isUser ? '#ffffff' : '#111827',
              fontWeight: isUser ? 400 : 400
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

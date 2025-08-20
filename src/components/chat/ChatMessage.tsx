"use client";

import { Message } from "@/types";
import { 
  Box, 
  Avatar, 
  Typography, 
  Paper, 
  Chip,
  Stack 
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
              mb: message.context && message.context.length > 0 ? 2 : 0,
              color: isUser ? 'primary.contrastText' : 'text.primary'
            }}
          >
            {message.text}
          </Typography>
          
          {!isUser && message.context && message.context.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium', mb: 1, display: 'block' }}>
                Sources:
              </Typography>
              <Stack spacing={1}>
                {message.context.slice(0, 3).map((ctx) => (
                  <Paper 
                    key={ctx.id}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      cursor: 'help',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    title={`Score: ${ctx.score.toFixed(3)}\n${ctx.text}`}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={`Score: ${ctx.score.toFixed(2)}`} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {ctx.text}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

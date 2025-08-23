"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography,
  InputAdornment
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input when not disabled
    if (!disabled && textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box 
        component="form" 
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        sx={{ width: '100%' }}
      >
        <TextField
          inputRef={textFieldRef}
          multiline
          maxRows={6}
          fullWidth
          variant="outlined"
          placeholder={placeholder || "Message GoodnightGPT..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  disabled={!input.trim() || disabled}
                  color="primary"
                  sx={{
                    bgcolor: !input.trim() || disabled ? 'transparent' : 'primary.main',
                    color: !input.trim() || disabled ? 'text.disabled' : 'white',
                    '&:hover': {
                      bgcolor: !input.trim() || disabled ? 'transparent' : 'primary.dark'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2
              }
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              pr: 1
            }
          }}
        />
        {!disabled && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            Press Enter to send, Shift + Enter for new line
          </Typography>
        )}
      </Box>
    </Box>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  AlertTitle,
  Snackbar,
  Button,
  Box,
  IconButton,
  Collapse,
  Typography
} from "@mui/material";
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Wifi as NetworkIcon,
  Refresh as RetryIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import { ErrorType, ChatError } from "@/types/errors";

interface ErrorNotificationProps {
  error: ChatError | null;
  onRetry?: () => void;
  onDismiss: () => void;
  autoHideDuration?: number;
}

export function ErrorNotification({
  error,
  onRetry,
  onDismiss,
  autoHideDuration = 6000
}: ErrorNotificationProps) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setOpen(!!error);
    setShowDetails(false);
  }, [error]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onDismiss, 300); // Wait for animation
  };

  const handleRetry = () => {
    handleClose();
    onRetry?.();
  };

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return <NetworkIcon />;
      case ErrorType.RATE_LIMIT:
        return <WarningIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getSeverity = () => {
    switch (error.type) {
      case ErrorType.RATE_LIMIT:
        return "warning" as const;
      case ErrorType.BAD_REQUEST:
        return "info" as const;
      default:
        return "error" as const;
    }
  };

  const getAutoHide = () => {
    // Don't auto-hide severe errors
    if (error.type === ErrorType.SERVER_ERROR || error.type === ErrorType.NETWORK_ERROR) {
      return null;
    }
    return autoHideDuration;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={getAutoHide()}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') {
          handleClose();
        }
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 2 }}
    >
      <Alert
        severity={getSeverity()}
        icon={getErrorIcon()}
        sx={{ 
          minWidth: '320px',
          maxWidth: '600px',
          '& .MuiAlert-message': { width: '100%' }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {error.retryable && onRetry && (
              <Button
                size="small"
                onClick={handleRetry}
                startIcon={<RetryIcon />}
                sx={{ color: 'inherit' }}
              >
                Retry
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              sx={{ color: 'inherit' }}
            >
              {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle>
          {getErrorTitle(error.type)}
        </AlertTitle>
        {error.userMessage}
        
        <Collapse in={showDetails}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>Error Type:</strong> {error.type}
            </Typography>
            {error.statusCode && (
              <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                <strong>Status Code:</strong> {error.statusCode}
              </Typography>
            )}
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>Time:</strong> {new Date(error.timestamp).toLocaleTimeString()}
            </Typography>
            <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
              <strong>Details:</strong> {error.message}
            </Typography>
          </Box>
        </Collapse>
      </Alert>
    </Snackbar>
  );
}

function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK_ERROR:
      return "Connection Problem";
    case ErrorType.SERVER_ERROR:
      return "Server Error";
    case ErrorType.RATE_LIMIT:
      return "Rate Limit Exceeded";
    case ErrorType.UNAUTHORIZED:
      return "Authentication Error";
    case ErrorType.BAD_REQUEST:
      return "Invalid Request";
    case ErrorType.TIMEOUT:
      return "Request Timeout";
    default:
      return "Unexpected Error";
  }
}

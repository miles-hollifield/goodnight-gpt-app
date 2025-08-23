"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle
} from "@mui/material";
import { 
  Refresh as RefreshIcon, 
  BugReport as BugIcon 
} from "@mui/icons-material";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.handleReset} />;
      }

      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'background.default'
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>Something went wrong</AlertTitle>
                The application encountered an unexpected error. Please try refreshing the page.
              </Alert>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BugIcon />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Error Details
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Component Stack:</strong>
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxHeight: 200,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

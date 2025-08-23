"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  IconButton,
  Collapse
} from "@mui/material";
import {
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { API_BASE } from "@/utils/constants";

interface ConnectionStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

type ConnectionStatus = 'online' | 'offline' | 'checking' | 'degraded';

export function ConnectionStatus({ onStatusChange }: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkConnection = useCallback(async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE}/`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      
      setResponseTime(responseTimeMs);
      setLastCheck(new Date());
      
      if (response.ok) {
        return responseTimeMs > 3000 ? 'degraded' : 'online';
      } else {
        return 'offline';
      }
    } catch {
      setLastCheck(new Date());
      setResponseTime(null);
      return 'offline';
    }
  }, []);

  const updateStatus = useCallback(async () => {
    setStatus('checking');
    const newStatus = await checkConnection();
    setStatus(newStatus);
    onStatusChange?.(newStatus === 'online' || newStatus === 'degraded');
  }, [checkConnection, onStatusChange]);

  useEffect(() => {
    // Initial check
    updateStatus();
    
    // Set up periodic checks
    const interval = setInterval(updateStatus, 30000); // Check every 30 seconds
    
    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => {
      setStatus('offline');
      setLastCheck(new Date());
      onStatusChange?.(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateStatus, onStatusChange]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'success' as const,
          icon: <OnlineIcon />,
          label: 'Connected',
          description: 'Service is running normally'
        };
      case 'degraded':
        return {
          color: 'warning' as const,
          icon: <WarningIcon />,
          label: 'Slow',
          description: 'Service is responding slowly'
        };
      case 'offline':
        return {
          color: 'error' as const,
          icon: <OfflineIcon />,
          label: 'Offline',
          description: 'Unable to connect to service'
        };
      case 'checking':
        return {
          color: 'default' as const,
          icon: <OnlineIcon />,
          label: 'Checking...',
          description: 'Checking connection status'
        };
    }
  };

  const config = getStatusConfig();

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus();
  };

  return (
    <Box>
      <Tooltip title={config.description}>
        <Chip
          size="small"
          icon={config.icon}
          label={config.label}
          color={config.color}
          variant="outlined"
          onClick={() => setShowDetails(!showDetails)}
          onDelete={status === 'offline' ? handleRefresh : undefined}
          deleteIcon={<RefreshIcon />}
          sx={{ 
            cursor: 'pointer',
            '& .MuiChip-deleteIcon': {
              fontSize: '16px'
            }
          }}
        />
      </Tooltip>
      
      <Collapse in={showDetails}>
        <Box sx={{ 
          mt: 1, 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          minWidth: 200
        }}>
          <Typography variant="caption" component="div" sx={{ mb: 1 }}>
            <strong>Status:</strong> {config.label}
          </Typography>
          
          {responseTime && (
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>Response Time:</strong> {responseTime}ms
            </Typography>
          )}
          
          {lastCheck && (
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>Last Check:</strong> {lastCheck.toLocaleTimeString()}
            </Typography>
          )}
          
          <Typography variant="caption" component="div" sx={{ mb: 2 }}>
            <strong>Endpoint:</strong> {API_BASE}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Auto-refresh: 30s
            </Typography>
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

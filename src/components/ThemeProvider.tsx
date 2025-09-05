"use client";

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ReactNode } from 'react';
import { BRAND, NEUTRAL } from '@/theme/colors';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: BRAND.red,
      light: '#FF3333',
      dark: '#990000',
      contrastText: BRAND.white,
    },
    secondary: {
      main: NEUTRAL[700],
      light: NEUTRAL[500],
      dark: NEUTRAL[900],
      contrastText: BRAND.white,
    },
    background: {
      default: BRAND.white,
      paper: NEUTRAL[50],
    },
    text: {
      primary: BRAND.black,
      secondary: NEUTRAL[500],
    },
    grey: {
      50: NEUTRAL[50],
      100: '#f0f0f0',
      200: NEUTRAL[200],
      500: NEUTRAL[500],
    },
    divider: NEUTRAL[200],
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    subtitle2: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        outlined: {
          borderColor: NEUTRAL[300],
          '&:hover': { borderColor: NEUTRAL[400], backgroundColor: NEUTRAL[50] },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND.red,
          color: BRAND.white,
          boxShadow: `0 1px 0 0 ${NEUTRAL[200]}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: BRAND.red,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: BRAND.red,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: NEUTRAL[500],
          '&:hover': { backgroundColor: NEUTRAL[100] },
        },
      },
    },
  },
});

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

'use client';
import { createTheme, alpha } from '@mui/material/styles';
import { Inter } from 'next/font/google';

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Primary Colors - Corporate Blue but Modernized
const PRIMARY_MAIN = '#0F62FE'; // IPM Blue-ish / Modern SaaS Blue
const PRIMARY_LIGHT = '#4589ff';
const PRIMARY_DARK = '#0043ce';

// Secondary Colors - Accent
const SECONDARY_MAIN = '#6F42C1'; // Purple
const SECONDARY_LIGHT = '#8A63D2';
const SECONDARY_DARK = '#4A2C81';

// Status Colors
const SUCCESS = '#24A148';
const WARNING = '#F1C21B';
const ERROR = '#DA1E28';
const INFO = '#0043CE';

// Backgrounds
const BACKGROUND_DEFAULT = '#F4F7FE'; // Very light blue-grey
const BACKGROUND_PAPER = '#FFFFFF';

const theme = createTheme({
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY_MAIN,
      light: PRIMARY_LIGHT,
      dark: PRIMARY_DARK,
      contrastText: '#ffffff',
    },
    secondary: {
      main: SECONDARY_MAIN,
      light: SECONDARY_LIGHT,
      dark: SECONDARY_DARK,
      contrastText: '#ffffff',
    },
    background: {
      default: BACKGROUND_DEFAULT,
      paper: BACKGROUND_PAPER,
    },
    success: { main: SUCCESS },
    warning: { main: WARNING },
    error: { main: ERROR },
    info: { main: INFO },
    text: {
      primary: '#161616',
      secondary: '#525252',
    },
    divider: '#E0E0E0',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#transparent",
            width: '8px',
            height: '8px',
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#c1c1c1",
            minHeight: 24,
            border: "2px solid #transparent",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#a8a8a8",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#a8a8a8",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#a8a8a8",
          },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#2b2b2b",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(45deg, ${PRIMARY_MAIN} 30%, ${PRIMARY_LIGHT} 90%)`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '4px 0px 20px rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.03)',
          background: `rgba(255, 255, 255, 0.8)`,
          backdropFilter: 'blur(8px)',
          color: '#161616',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha(PRIMARY_MAIN, 0.1),
            color: PRIMARY_MAIN,
            '&:hover': {
              backgroundColor: alpha(PRIMARY_MAIN, 0.15),
            },
            '& .MuiListItemIcon-root': {
              color: PRIMARY_MAIN,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e0e0e0',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
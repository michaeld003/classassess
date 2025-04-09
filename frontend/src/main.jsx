import './global-fix.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import { createContext, useMemo, useState, useEffect } from 'react';

export const ColorModeContext = createContext({
    toggleColorMode: () => {},
    mode: 'light'
});

export function ToggleColorMode() {
    // Initialise from localStorage or default to 'light'
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === 'light' ? 'dark' : 'light';
                    localStorage.setItem('theme', newMode);
                    return newMode;
                });
            },
            mode
        }),
        [mode],
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === 'light'
                        ? {
                            // Light mode
                            primary: {
                                main: '#1976d2',
                            },
                            background: {
                                default: '#f5f5f5',
                                paper: '#ffffff',
                            },
                        }
                        : {
                            // Dark mode
                            primary: {
                                main: '#90caf9',
                            },
                            background: {
                                default: '#121212',
                                paper: '#1e1e1e',
                            },
                        }),
                },
            }),
        [mode],
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <App />
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ToggleColorMode />
    </StrictMode>,
);

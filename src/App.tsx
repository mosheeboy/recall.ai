import React, { useMemo, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, IconButton } from '@mui/material';
import LandingPage from './pages/LandingPage';
import LearningSession from './pages/LearningSession';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
      },
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#95d5b2' : '#b7e4c7', // soft green accent for both
            contrastText: mode === 'light' ? '#1B1B1B' : '#fff',
          },
          secondary: {
            main: mode === 'light' ? '#b7e4c7' : '#b7e4c7', // soft green accent for both
            contrastText: mode === 'light' ? '#1B1B1B' : '#fff',
          },
          background: {
            default: mode === 'light' ? '#F6F8F4' : '#212529', // main background
            paper: mode === 'light' ? '#FFFFFF' : '#343a40', // main content area not white
          },
          text: {
            primary: mode === 'light' ? '#1B1B1B' : '#f5f5f5',
            secondary: mode === 'light' ? '#555' : '#bdbdbd',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/learn" element={<LearningSessionWithToggle />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// HOC to inject the dark mode toggle into the navbar of LearningSession
function LearningSessionWithToggle() {
  const colorMode = useContext(ColorModeContext);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  return <LearningSession colorMode={colorMode} />;
}

export { ColorModeContext };
export default App;

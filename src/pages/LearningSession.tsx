import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send, ArrowBack, Quiz } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLearningSession } from '../hooks/useLearningSession';
import ChatMessage from '../components/ChatMessage';
import QuizComponent from '../components/Quiz';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

interface LearningSessionProps {
  colorMode?: { toggleColorMode: () => void };
}

const POMODORO_START = 25 * 60; // 25 minutes in seconds

const LearningSession: React.FC<LearningSessionProps> = ({ colorMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [pomodoro, setPomodoro] = useState(POMODORO_START);
  const [isPomodoroActive, setIsPomodoroActive] = useState(true);
  const pomodoroInterval = useRef<NodeJS.Timeout | null>(null);

  const { topic, apiKey } = location.state || {};
  const { session, isLoading, sendMessage, generateQuiz, generateCustomQuiz } = useLearningSession(topic, apiKey);

  // All hooks must be called before any early return
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  // Pomodoro timer effect
  useEffect(() => {
    if (isPomodoroActive && pomodoro > 0) {
      pomodoroInterval.current = setInterval(() => {
        setPomodoro((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isPomodoroActive && pomodoroInterval.current) {
      clearInterval(pomodoroInterval.current);
    }
    return () => {
      if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    };
  }, [isPomodoroActive, pomodoro]);

  // Only return after all hooks
  if (!topic || !apiKey) {
    navigate('/');
    return null;
  }

  // Format timer as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;
    
    await sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuizComplete = (score: number, total: number) => {
    setQuizScore({ score, total });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Learning: {topic}
          </Typography>
          {/* Pomodoro Timer */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsPomodoroActive((prev) => !prev)}>
            <Typography variant="h6" sx={{ mr: 1 }}>
              {formatTime(pomodoro)}
            </Typography>
            {isPomodoroActive ? <PauseIcon /> : <PlayArrowIcon />}
          </Box>
          {/* Dark mode toggle */}
          {colorMode && (
            <IconButton sx={{ ml: 2 }} onClick={colorMode.toggleColorMode} color="inherit">
              <Brightness4Icon />
            </IconButton>
          )}
          {session.quiz && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Quiz />
              <Typography variant="body2">
                Quiz Available
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {/* Blur overlay when Pomodoro is paused */}
      {!isPomodoroActive && (
        <Box
          onClick={() => setIsPomodoroActive(true)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(246, 248, 244, 0.7)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <PlayArrowIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">Pomodoro Paused</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>Click anywhere to resume your session</Typography>
          </Box>
        </Box>
      )}
      {/* Main content, blurred if Pomodoro is paused */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', filter: !isPomodoroActive ? 'blur(6px)' : 'none', pointerEvents: !isPomodoroActive ? 'none' : 'auto' }}>
        {/* Chat Column */}
        <Box
          sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            filter: session.isQuizActive ? 'blur(6px)' : 'none', // increased blur for clarity
            transition: 'filter 0.3s ease',
            pointerEvents: session.isQuizActive ? 'none' : 'auto',
            borderRight: 1,
            borderColor: 'divider',
            minWidth: 0,
            bgcolor: 'background.paper',
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              pb: 10, // padding bottom for input
            }}
          >
            {session.messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Start your learning journey!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ask me anything about {topic}. I'll help you learn and test your knowledge.
                </Typography>
              </Box>
            ) : (
              session.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area - fixed at bottom */}
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              p: 2,
              m: 0,
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              borderRadius: 0,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {isLoading ? <CircularProgress size={20} /> : <Send />}
            </Button>
          </Paper>
        </Box>
        {/* Quiz Column (always visible) */}
        <Box
          sx={{
            flex: 1,
            minWidth: 350,
            maxWidth: 420,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
              Knowledge Check
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test your understanding of what you've learned
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              disabled={isLoading}
              onClick={() => generateCustomQuiz(3)}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              Generate 3-Question Quiz
            </Button>
          </Box>
          {session.quiz ? (
            <>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <QuizComponent
                  quiz={session.quiz}
                  onComplete={handleQuizComplete}
                />
              </Box>
              {quizScore && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      Quiz completed! Score: {quizScore.score}/{quizScore.total}
                    </Typography>
                  </Alert>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Quiz Area
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                After 5 minutes of learning, a quiz will appear here to test your knowledge!
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Quiz Overlay */}
      {session.isQuizActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'calc(100% - 420px)', // match left column width (flex:2 vs flex:1, max quiz width 420px)
            height: '100%',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            background: 'transparent',
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 3,
              borderRadius: 2,
              boxShadow: 3,
              textAlign: 'center',
              minWidth: 320,
              maxWidth: 480,
              width: '100%',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quiz Time!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The conversation is now blurred. Complete the quiz on the right to continue learning.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LearningSession; 
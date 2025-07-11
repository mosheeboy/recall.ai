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
import { Send, ArrowBack, Quiz, KeyboardArrowDown } from '@mui/icons-material';
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
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [pomodoro, setPomodoro] = useState(POMODORO_START);
  const [isPomodoroActive, setIsPomodoroActive] = useState(true);
  const pomodoroInterval = useRef<NodeJS.Timeout | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [delayedShowArrow, setDelayedShowArrow] = useState(false);

  const { topic, apiKey } = location.state || {};
  const { session, isLoading, sendMessage, generateQuiz, generateCustomQuiz } = useLearningSession(topic, apiKey);

  // All hooks must be called before any early return
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll handler for chat area
  const handleChatScroll = () => {
    if (!chatBoxRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
    // Show button if not at the bottom (allow 10px leeway)
    setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 10);
  };
  // Show arrow with delay
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showScrollToBottom) {
      timeout = setTimeout(() => setDelayedShowArrow(true), 1000);
    } else {
      setDelayedShowArrow(false);
    }
    return () => clearTimeout(timeout);
  }, [showScrollToBottom]);

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
            filter: session.isQuizActive ? 'blur(6px)' : 'none',
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
            ref={chatBoxRef}
            onScroll={handleChatScroll}
            sx={{
              flex: 1,
              overflow: 'auto',
              px: 5,
              py: 2,
              position: 'relative',
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
          {/* Scroll to bottom button (outside scroll area, above input) */}
          {(
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 70, // half overlaps the input bubble
                display: 'flex',
                justifyContent: 'center',
                zIndex: 1200,
                pointerEvents: delayedShowArrow ? 'auto' : 'none',
                opacity: delayedShowArrow ? 1 : 0,
                transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <IconButton
                color="primary"
                size="small"
                onClick={scrollToBottom}
                sx={{
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'primary.main', color: 'white' },
                  pointerEvents: 'auto',
                }}
              >
                <KeyboardArrowDown fontSize="medium" />
              </IconButton>
            </Box>
          )}
          {/* Input Area - at the bottom, not absolute */}
          <Box
            sx={{
              pt: 0.25,
              pb: 1.5,
              px: 2,
              m: 0,
              bgcolor: 'transparent',
              display: 'flex',
              alignItems: 'flex-end',
              borderRadius: 0,
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              minRows={2}
              placeholder="Ask anything"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    sx={{
                      bgcolor: 'background.paper',
                      color: 'primary.contrastText',
                      borderRadius: '50%',
                      ml: 1,
                      '&:hover': { bgcolor: 'primary.main' },
                      width: 40,
                      height: 40,
                    }}
                  >
                    {isLoading ? <CircularProgress size={20} /> : <Send />}
                  </IconButton>
                ),
                sx: {
                  bgcolor: 'background.default',
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  border: 'none',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  border: 'none',
                },
                '& fieldset': {
                  border: 'none',
                },
              }}
            />
          </Box>
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
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 4, pt: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Quiz Area
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                After 5 minutes of learning, a quiz will appear here to test your knowledge!
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                disabled={isLoading}
                onClick={() => generateCustomQuiz(3)}
                sx={{
                  borderRadius: 3,
                  px: 2.5,
                  py: 1,
                  transition: 'background 0.35s cubic-bezier(0.4,0,0.2,1), border-color 0.35s cubic-bezier(0.4,0,0.2,1), color 0.35s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    borderColor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                Generate Quiz
              </Button>
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
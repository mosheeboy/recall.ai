import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
} from '@mui/material';
import { School, Key } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStartLearning = () => {
    if (!topic.trim()) {
      setError('Please enter what you want to learn');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    // Navigate to learning session with topic and API key
    navigate('/learn', { state: { topic: topic.trim(), apiKey: apiKey.trim() } });
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            width: '100%',
            maxWidth: 600,
            textAlign: 'center',
          }}
        >
          <School sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h3" component="h1" gutterBottom>
            AI Learning Platform
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Learn anything with an AI tutor and test your knowledge
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="What do you want to learn?"
              placeholder="e.g., React hooks, Python data structures, Machine learning basics..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="OpenAI API Key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: <Key sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleStartLearning}
              sx={{ py: 1.5, fontSize: '1.1rem' }}
            >
              Start Learning
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            Your API key is stored locally and never sent to our servers
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LandingPage; 
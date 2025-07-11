const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// In-memory storage for sessions (replace with database in production)
const sessions = new Map();

// Helper function to create session ID
const createSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Routes
app.post('/api/sessions', (req, res) => {
  const { topic, apiKey } = req.body;
  
  if (!topic || !apiKey) {
    return res.status(400).json({ error: 'Topic and API key are required' });
  }
  
  const sessionId = createSessionId();
  sessions.set(sessionId, {
    topic,
    apiKey,
    messages: [],
    createdAt: new Date(),
  });
  
  res.json({ sessionId, topic });
});

app.post('/api/chat/send', (req, res) => {
  const { sessionId, content } = req.body;
  
  if (!sessionId || !content) {
    return res.status(400).json({ error: 'Session ID and content are required' });
  }
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Add user message to session
  const userMessage = {
    id: Date.now().toString(),
    content,
    role: 'user',
    timestamp: new Date(),
  };
  
  session.messages.push(userMessage);
  
  // Prepare messages for OpenAI
  const messages = [
    {
      role: 'system',
      content: `You are a helpful tutor teaching about ${session.topic}. Be engaging, clear, and supportive. Use markdown for formatting (bold, italics, underline, bullet points, etc.). For math, use $...$ for inline LaTeX and $$...$$ for block LaTeX.`,
    },
    ...session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];
  
  // Call OpenAI API
  openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 500,
  })
  .then(response => {
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      content: response.choices[0].message.content,
      role: 'assistant',
      timestamp: new Date(),
    };
    
    session.messages.push(assistantMessage);
    
    res.json({
      message: assistantMessage,
      sessionId,
    });
  })
  .catch(error => {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  });
});

app.post('/api/quiz/generate', (req, res) => {
  const { sessionId, numQuestions = 5 } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Prepare messages for quiz generation
  const messages = [
    {
      role: 'system',
      content: `Generate a quiz about ${session.topic} based on the conversation. Return a JSON object with this structure: {
        "title": "Quiz Title",
        "questions": [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Explanation for the correct answer"
          }
        ]
      } and make sure there are exactly ${numQuestions} questions in the quiz.`,
    },
    ...session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];
  
  // Call OpenAI API for quiz generation
  openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 1000,
  })
  .then(response => {
    try {
      const quizData = JSON.parse(response.choices[0].message.content);
      const quiz = {
        id: Date.now().toString(),
        title: quizData.title,
        questions: quizData.questions.map((q, index) => ({
          ...q,
          id: index.toString(),
        })),
        createdAt: new Date(),
      };
      
      res.json({ quiz, sessionId });
    } catch (parseError) {
      console.error('Quiz parsing error:', parseError);
      res.status(500).json({ error: 'Failed to parse quiz data' });
    }
  })
  .catch(error => {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId,
    topic: session.topic,
    messages: session.messages,
    createdAt: session.createdAt,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 
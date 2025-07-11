import { useState, useEffect, useCallback } from 'react';
import { Message, Quiz, LearningSession } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

export const useLearningSession = (topic: string, apiKey: string) => {
  const [session, setSession] = useState<LearningSession>({
    topic,
    apiKey,
    messages: [],
    isQuizActive: false,
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizTimer, setQuizTimer] = useState<NodeJS.Timeout | null>(null);

  // Initialize session with backend
  useEffect(() => {
    const initializeSession = async () => {
      if (!topic || !apiKey) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic, apiKey }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
        } else {
          console.error('Failed to initialize session');
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
  }, [topic, apiKey]);

  // Send message to backend API
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, content }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message.content,
          role: 'assistant',
          timestamp: new Date(data.message.timestamp),
        };

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Generate quiz using backend API
  const generateQuiz = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, numQuestions: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        const quiz: Quiz = {
          id: data.quiz.id,
          title: data.quiz.title,
          questions: data.quiz.questions,
          createdAt: new Date(data.quiz.createdAt),
        };

        setSession(prev => ({
          ...prev,
          quiz,
          quizStartTime: new Date(),
          isQuizActive: true,
        }));
      } else {
        console.error('Failed to generate quiz');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Generate a custom quiz with specified number of questions
  const generateCustomQuiz = useCallback(async (numQuestions: number) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, numQuestions }),
      });

      if (response.ok) {
        const data = await response.json();
        const quiz: Quiz = {
          id: data.quiz.id,
          title: data.quiz.title,
          questions: data.quiz.questions,
          createdAt: new Date(data.quiz.createdAt),
        };

        setSession(prev => ({
          ...prev,
          quiz,
          quizStartTime: new Date(),
          isQuizActive: true,
        }));
      } else {
        console.error('Failed to generate custom quiz');
      }
    } catch (error) {
      console.error('Error generating custom quiz:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Start quiz timer
  useEffect(() => {
    if (session.messages.length > 0 && !session.isQuizActive && !quizTimer) {
      const timer = setTimeout(() => {
        generateQuiz();
      }, 5 * 60 * 1000); // 5 minutes

      setQuizTimer(timer);
    }

    return () => {
      if (quizTimer) {
        clearTimeout(quizTimer);
      }
    };
  }, [session.messages.length, session.isQuizActive, quizTimer, generateQuiz]);

  return {
    session,
    isLoading,
    sendMessage,
    generateQuiz,
    generateCustomQuiz,
  };
}; 
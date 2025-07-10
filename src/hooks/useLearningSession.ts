import { useState, useEffect, useCallback } from 'react';
import { Message, Quiz, LearningSession } from '../types';

export const useLearningSession = (topic: string, apiKey: string) => {
  const [session, setSession] = useState<LearningSession>({
    topic,
    apiKey,
    messages: [],
    isQuizActive: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [quizTimer, setQuizTimer] = useState<NodeJS.Timeout | null>(null);

  // Send message to OpenAI
  const sendMessage = useCallback(async (content: string) => {
    if (!apiKey) return;

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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful tutor teaching about ${topic}. Be engaging, clear, and supportive. Use markdown for formatting (bold, italics, underline, bullet points, etc.). For math, use $...$ for inline LaTeX and $$...$$ for block LaTeX. After 5 minutes of conversation, you will generate a quiz to test the student's understanding.`,
            },
            ...session.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content,
            },
          ],
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.choices[0].message.content,
          role: 'assistant',
          timestamp: new Date(),
        };

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, topic, session.messages]);

  // Generate quiz after 5 minutes
  const generateQuiz = useCallback(async () => {
    if (!apiKey) return;

    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Generate a quiz about ${topic} based on the conversation. Use markdown for formatting (bold, italics, underline, bullet points, etc.). For math, use $...$ for inline LaTeX and $$...$$ for block LaTeX. Return a JSON object with this structure: {\n  "title": "Quiz Title",\n  "questions": [\n    {\n      "question": "Question text",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": 0,\n      "explanation": "Explanation for the correct answer"\n    }\n  ]\n}`,
            },
            ...session.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        try {
          const quizData = JSON.parse(data.choices[0].message.content);
          const quiz: Quiz = {
            id: Date.now().toString(),
            title: quizData.title,
            questions: quizData.questions.map((q: any, index: number) => ({
              ...q,
              id: index.toString(),
            })),
            createdAt: new Date(),
          };

          setSession(prev => ({
            ...prev,
            quiz,
            quizStartTime: new Date(),
            isQuizActive: true,
          }));
        } catch (parseError) {
          console.error('Error parsing quiz data:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, topic, session.messages]);

  // Generate a custom quiz with a specified number of questions
  const generateCustomQuiz = useCallback(async (numQuestions: number) => {
    if (!apiKey) return;
    setIsLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Generate a quiz about ${topic} based on the conversation. Use markdown for formatting (bold, italics, underline, bullet points, etc.). For math, use $...$ for inline LaTeX and $$...$$ for block LaTeX. Return a JSON object with this structure: {\n  "title": "Quiz Title",\n  "questions": [\n    {\n      "question": "Question text",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": 0,\n      "explanation": "Explanation for the correct answer"\n    }\n  ]\n} and make sure there are exactly ${numQuestions} questions in the quiz.`,
            },
            ...session.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          max_tokens: 1000,
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        try {
          const quizData = JSON.parse(data.choices[0].message.content);
          const quiz: Quiz = {
            id: Date.now().toString(),
            title: quizData.title,
            questions: quizData.questions.map((q: any, index: number) => ({
              ...q,
              id: index.toString(),
            })),
            createdAt: new Date(),
          };
          setSession(prev => ({
            ...prev,
            quiz,
            quizStartTime: new Date(),
            isQuizActive: true,
          }));
        } catch (parseError) {
          console.error('Error parsing quiz data:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating custom quiz:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, topic, session.messages]);

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
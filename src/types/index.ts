export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: Date;
}

export interface LearningSession {
  topic: string;
  apiKey: string;
  messages: Message[];
  quiz?: Quiz;
  quizStartTime?: Date;
  isQuizActive: boolean;
} 
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Quiz as QuizType, QuizQuestion } from '../types';

interface QuizProps {
  quiz: QuizType;
  onComplete: (score: number, total: number) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate results
      const results = quiz.questions.map((question, index) => 
        selectedAnswers[index] === question.correctAnswer
      );
      setCorrectAnswers(results);
      setShowResults(true);
      
      const score = results.filter(Boolean).length;
      onComplete(score, quiz.questions.length);
    }
  };

  const handleFinish = () => {
    const results = quiz.questions.map((question, index) => 
      selectedAnswers[index] === question.correctAnswer
    );
    setCorrectAnswers(results);
    setShowResults(true);
    
    const score = results.filter(Boolean).length;
    onComplete(score, quiz.questions.length);
  };

  if (showResults) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Typography variant="h5" gutterBottom>
          Quiz Results
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary">
            Score: {correctAnswers.filter(Boolean).length} / {quiz.questions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round((correctAnswers.filter(Boolean).length / quiz.questions.length) * 100)}%
          </Typography>
        </Box>

        {quiz.questions.map((question, index) => (
          <Box key={question.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Question {index + 1}: {question.question}
            </Typography>
            
            {question.options.map((option, optionIndex) => (
              <FormControlLabel
                key={optionIndex}
                control={<Radio checked={selectedAnswers[index] === optionIndex} />}
                label={option}
                sx={{
                  color: correctAnswers[index] 
                    ? (optionIndex === question.correctAnswer ? 'success.main' : 'text.secondary')
                    : (optionIndex === selectedAnswers[index] && optionIndex !== question.correctAnswer ? 'error.main' : 'text.secondary'),
                }}
              />
            ))}
            
            {correctAnswers[index] === false && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Correct answer:</strong> {question.options[question.correctAnswer]}
                </Typography>
                {question.explanation && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Explanation:</strong> {question.explanation}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        ))}
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {quiz.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" sx={{ mb: 3 }}>
          {currentQuestion.question}
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <RadioGroup
            value={selectedAnswers[currentQuestionIndex] ?? ''}
            onChange={(e) => handleAnswerSelect(Number(e.target.value))}
          >
            {currentQuestion.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index}
                control={<Radio />}
                label={option}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
        >
          Previous
        </Button>
        
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button
            variant="contained"
            disabled={selectedAnswers[currentQuestionIndex] === undefined}
            onClick={handleNext}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={selectedAnswers[currentQuestionIndex] === undefined}
            onClick={handleFinish}
          >
            Finish Quiz
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default QuizComponent; 
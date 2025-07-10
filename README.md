# AI Learning Platform

A React TypeScript application that provides an interactive learning experience with an AI tutor and knowledge assessment quizzes.

## Features

- **Interactive AI Tutor**: Chat with an AI tutor about any topic you want to learn
- **Automatic Quiz Generation**: After 5 minutes of conversation, the AI generates a quiz based on your learning session
- **Blur Effect**: When the quiz starts, the conversation area is blurred to encourage independent thinking
- **Material Design**: Beautiful, modern UI using Google Material Design principles
- **Real-time Chat**: Smooth, responsive chat interface with message history
- **Quiz Results**: Detailed feedback with explanations for incorrect answers

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- OpenAI API key

## Getting Started

1. **Clone and Install Dependencies**
   ```bash
   cd learning-platform
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

3. **Open Your Browser**
   Navigate to `http://localhost:3000`

## How to Use

1. **Landing Page**
   - Enter what you want to learn (e.g., "React hooks", "Python data structures")
   - Provide your OpenAI API key
   - Click "Start Learning"

2. **Learning Session**
   - Chat with the AI tutor about your chosen topic
   - Ask questions, request explanations, or explore concepts
   - After 5 minutes, a quiz will automatically appear in the sidebar

3. **Quiz Experience**
   - When the quiz starts, the conversation area becomes blurred
   - Complete the quiz questions in the sidebar
   - Review your results and explanations for incorrect answers
   - The conversation area becomes available again after completing the quiz

## API Key Setup

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Enter it on the landing page
3. Your API key is stored locally and never sent to our servers

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **Styling**: Emotion (CSS-in-JS)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatMessage.tsx  # Individual chat message display
│   └── Quiz.tsx         # Quiz component with questions and results
├── pages/               # Main application pages
│   ├── LandingPage.tsx  # Entry point with topic and API key input
│   └── LearningSession.tsx # Main learning interface
├── hooks/               # Custom React hooks
│   └── useLearningSession.ts # Learning session management
├── types/               # TypeScript type definitions
│   └── index.ts         # Application interfaces and types
└── utils/               # Utility functions
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Customization

### Changing the Quiz Timer
To modify when the quiz appears, edit the timer in `src/hooks/useLearningSession.ts`:
```typescript
setTimeout(() => {
  generateQuiz();
}, 5 * 60 * 1000); // Change 5 to desired minutes
```

### Styling
The app uses Material-UI theming. Customize colors and styles in `src/App.tsx`:
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change primary color
    },
    // ... other theme options
  },
});
```

## Security Notes

- API keys are stored in browser memory only
- No data is persisted to external servers
- All communication with OpenAI is direct from the browser

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your OpenAI API key is valid and has sufficient credits
2. **Quiz Not Appearing**: Wait for the full 5 minutes of conversation
3. **Blur Effect Not Working**: Check browser compatibility for CSS filters

### Development Issues

- Clear browser cache if experiencing stale data
- Restart the development server if changes aren't reflecting
- Check browser console for any error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

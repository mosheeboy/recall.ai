# AI Learning Platform

A React TypeScript application with Node.js backend that provides an interactive learning experience with an AI tutor and knowledge assessment quizzes.

## Features

- **Interactive AI Tutor**: Chat with an AI tutor about any topic you want to learn
- **Automatic Quiz Generation**: After 5 minutes of conversation, the AI generates a quiz based on your learning session
- **Blur Effect**: When the quiz starts, the conversation area is blurred to encourage independent thinking
- **Material Design**: Beautiful, modern UI using Google Material Design principles
- **Real-time Chat**: Smooth, responsive chat interface with message history
- **Quiz Results**: Detailed feedback with explanations for incorrect answers
- **Backend API**: Secure server-side API handling with session management

## Architecture

```
Frontend (React) ←→ Backend (Node.js/Express) ←→ OpenAI API
```

- **Frontend**: React 19 with TypeScript, Material-UI
- **Backend**: Node.js with Express, session management
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **Data Storage**: In-memory sessions (easily upgradable to database)

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- OpenAI API key

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd learning-platform
npm run install:all
```

### 2. Environment Setup

Create a `.env` file in the `backend` directory:

```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
```

### 3. Start the Application

**Option A: Run both frontend and backend together**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

### 4. Open Your Browser

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

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

## API Endpoints

### Sessions
- `POST /api/sessions` - Create a new learning session
- `GET /api/sessions/:sessionId` - Get session details

### Chat
- `POST /api/chat/send` - Send a message and get AI response

### Quiz
- `POST /api/quiz/generate` - Generate a quiz based on conversation

### Health
- `GET /api/health` - Server health check

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Styling**: Emotion (CSS-in-JS)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Integration**: OpenAI API
- **CORS**: Cross-origin resource sharing enabled

## Project Structure

```
learning-platform/
├── frontend/               # Frontend React application
│   ├── src/                # React source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── backend/                # Backend Node.js application
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── package.json            # Root workspace configuration
└── README.md               # This file
```

## Available Scripts

### Root Level (Monorepo)
- `npm run dev` - Runs both frontend and backend concurrently
- `npm run server` - Runs backend in development mode
- `npm run client` - Runs frontend in development mode
- `npm run install:all` - Installs dependencies for all packages
- `npm run build:all` - Builds frontend for production
- `npm run clean:install` - Clean install for troubleshooting

### Frontend
- `cd frontend && npm start` - Runs the frontend in development mode
- `cd frontend && npm build` - Builds the frontend for production
- `cd frontend && npm test` - Launches the test runner

### Backend
- `cd backend && npm run dev` - Runs the backend server with nodemon
- `cd backend && npm start` - Runs the backend in production mode

## Development

### Adding New Features

1. **Backend API**: Add new routes in `backend/server.js`
2. **Frontend Integration**: Update `frontend/src/hooks/useLearningSession.ts`
3. **UI Components**: Create new components in `frontend/src/components/`

### Environment Variables

- `REACT_APP_API_URL` - Backend API URL (defaults to `http://localhost:5000/api`)
- `OPENAI_API_KEY` - Your OpenAI API key
- `PORT` - Backend server port (defaults to 5000)

## Security Notes

- API keys are stored server-side only
- Sessions are managed securely on the backend
- CORS is configured for development
- No sensitive data is exposed to the client

## Troubleshooting

### Common Issues

1. **Backend Connection Error**: Ensure the backend is running on port 5000
2. **API Key Error**: Check your OpenAI API key in `backend/.env`
3. **CORS Error**: Verify the backend CORS configuration
4. **Session Not Found**: Sessions are in-memory and reset on server restart

### Development Issues

- Clear browser cache if experiencing stale data
- Restart both frontend and backend if changes aren't reflecting
- Check browser console and server logs for error messages

## Next Steps

### Potential Enhancements

1. **Database Integration**: Replace in-memory storage with PostgreSQL/MongoDB
2. **User Authentication**: Add user accounts and session persistence
3. **Analytics**: Track learning progress and quiz performance
4. **Content Moderation**: Add safety filters for AI responses
5. **Real-time Features**: WebSocket integration for live collaboration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (frontend and backend)
5. Submit a pull request

## License

This project is open source and available under the MIT License.

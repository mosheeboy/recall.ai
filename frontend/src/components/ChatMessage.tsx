import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '70%' }}>
        {isUser ? (
          <Paper
            elevation={1}
            sx={{
              bgcolor: (theme) => {
                if (theme.palette.mode === 'dark') {
                  return '#40916c';
                }
                return '#95D5B2';
              },
              color: (theme) => theme.palette.mode === 'dark' ? '#e6f4ea' : '#000',
              borderRadius: '12px',
              p: '10px 18px',
              wordBreak: 'break-word',
              ml: 'auto',
              mr: 0,
              textAlign: 'right',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ node, ...props }) => (
                  <Typography variant="body1" sx={{ mb: 1 }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginLeft: 16 }}>
                    <Typography variant="body1" component="span" {...props} />
                  </li>
                ),
                code({node, inline, className, children, ...props}: any) {
                  if (inline) {
                    return (
                      <Typography
                        component="code"
                        sx={{
                          bgcolor: 'rgba(27,31,35,0.05)',
                          borderRadius: 1,
                          px: 0.5,
                          fontFamily: 'monospace',
                          fontSize: '0.95em',
                          display: 'inline',
                        }}
                        {...props}
                      >
                        {children}
                      </Typography>
                    );
                  }
                  return (
                    <Paper
                      elevation={2}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#252525' : '#edede9',
                        color: 'inherit',
                        p: 2,
                        my: 2,
                        borderRadius: 2,
                        overflowX: 'auto',
                      }}
                    >
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          fontFamily: 'monospace',
                          fontSize: '1em',
                          whiteSpace: 'pre',
                          overflowX: 'auto',
                        }}
                      >
                        <code {...props}>{children}</code>
                      </Box>
                    </Paper>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {/* Only show timestamp for LLM */}
            {/* User bubble, so no timestamp */}
          </Paper>
        ) : (
          <Box
            sx={{
              wordBreak: 'break-word',
              ml: 0,
              mr: 'auto',
              textAlign: 'left',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ node, ...props }) => (
                  <Typography variant="body1" sx={{ mb: 1 }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginLeft: 16 }}>
                    <Typography variant="body1" component="span" {...props} />
                  </li>
                ),
                code({node, inline, className, children, ...props}: any) {
                  if (inline) {
                    return (
                      <Typography
                        component="code"
                        sx={{
                          bgcolor: 'rgba(27,31,35,0.05)',
                          borderRadius: 1,
                          px: 0.5,
                          fontFamily: 'monospace',
                          fontSize: '0.95em',
                          display: 'inline',
                        }}
                        {...props}
                      >
                        {children}
                      </Typography>
                    );
                  }
                  return (
                    <Paper
                      elevation={2}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#252525' : '#edede9',
                        color: 'inherit',
                        p: 2,
                        my: 2,
                        borderRadius: 2,
                        overflowX: 'auto',
                      }}
                    >
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          fontFamily: 'monospace',
                          fontSize: '1em',
                          whiteSpace: 'pre',
                          overflowX: 'auto',
                        }}
                      >
                        <code {...props}>{children}</code>
                      </Box>
                    </Paper>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {/* Only show timestamp for LLM */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                opacity: 0.7,
                textAlign: 'left',
              }}
            >
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatMessage; 
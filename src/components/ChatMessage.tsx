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
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SmartToy />
          </Avatar>
        )}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : 'grey.50',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            wordBreak: 'break-word',
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
                      bgcolor: '#edede9',
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
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </Paper>
        {isUser && (
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
            <Person />
          </Avatar>
        )}
      </Box>
    </Box>
  );
};

export default ChatMessage; 
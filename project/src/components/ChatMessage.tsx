import React from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  onCopy: (text: string, messageId: string) => void;
  isCopied: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCopy, isCopied }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex items-start space-x-3 ${
        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        message.role === 'user'
          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
          : 'bg-gradient-to-r from-purple-500 to-purple-600'
      }`}>
        {message.role === 'user' ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className={`flex-1 max-w-3xl ${
        message.role === 'user' ? 'flex flex-col items-end' : ''
      }`}>
        <div className={`relative group ${
          message.role === 'user'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3'
            : 'bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100'
        }`}>
          {message.role === 'assistant' ? (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
          
          <button
            onClick={() => onCopy(message.content, message.id)}
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
              message.role === 'user'
                ? 'hover:bg-blue-400 text-blue-100'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            {isCopied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
        
        <div className={`mt-1 text-xs text-gray-500 ${
          message.role === 'user' ? 'text-right' : ''
        }`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageCircle, Trash2, Copy, Check, Settings, FileText, Brain, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiService } from '../services/aiService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface PDFData {
  file: File;
  text: string;
  name: string;
}

interface AIAssistantProps {
  pdfData: PDFData;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ pdfData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('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');
  const [showSettings, setShowSettings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'groq' | 'huggingface' | 'cohere'>('groq');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with PDF analysis
    if (pdfData && messages.length === 0) {
      initializePDFAnalysis();
    }
  }, [pdfData]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const initializePDFAnalysis = async () => {
    setIsAnalyzing(true);
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `📄 **PDF Loaded: ${pdfData.name}**\n\n🚀 **Groq AI Connected!** I'm analyzing your PDF document using Groq's powerful Llama 3 model... Please wait while I process the content.`,
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);

    try {
      aiService.setApiKey(apiKey);
      
      const analysisPrompt = `I have uploaded a PDF document titled "${pdfData.name}". Please analyze the following text content and provide:

1. **📋 Document Summary**: A comprehensive overview of the main topics and themes
2. **🔑 Key Points**: The most important information, findings, or arguments
3. **📊 Document Structure**: How the content is organized
4. **❓ Potential Questions**: Suggest 4-5 interesting questions I could ask about this document

Here is the extracted text from the PDF:

---
${pdfData.text.slice(0, 12000)}${pdfData.text.length > 12000 ? '\n\n[Content truncated for analysis...]' : ''}
---

Please provide a detailed analysis in a well-formatted response using markdown. Be thorough and insightful.`;

      const analysisResponse = await aiService.getResponse(analysisPrompt);
      
      const analysisMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: analysisResponse,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev.slice(0, -1), analysisMessage]);
      
    } catch (error) {
      console.error('PDF Analysis Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "❌ I encountered an error while analyzing your PDF. The Groq API might be temporarily unavailable. Please try asking me a question about the document, or check your API key in settings.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      aiService.setApiKey(apiKey);
      
      const contextualPrompt = `Based on the PDF document "${pdfData.name}" that I uploaded, please answer the following question. Use the document content as your primary source of information.

PDF Content Context:
${pdfData.text.slice(0, 8000)}${pdfData.text.length > 8000 ? '\n[Content continues...]' : ''}

User Question: ${userMessage.content}

Please provide a detailed, accurate answer based on the PDF content. If the question cannot be answered from the document, please let me know and offer to help with related topics that are covered in the document. Format your response using markdown for better readability.`;

      const aiResponse = await aiService.getResponse(contextualPrompt);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "❌ I apologize, but I encountered an error while processing your question. Please check your Groq API key and try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    initializePDFAnalysis();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "What are the main conclusions of this document?",
    "Can you summarize the key findings in bullet points?",
    "What are the most important points I should know?",
    "Are there any recommendations or action items mentioned?",
    "What is the overall purpose of this document?"
  ];

  const apiProviders = [
    {
      id: 'groq',
      name: 'Groq',
      description: 'Free & Fast Llama models',
      keyFormat: 'gsk_...',
      url: 'https://console.groq.com',
      recommended: true,
      status: 'Connected ✅'
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'Free inference API',
      keyFormat: 'hf_...',
      url: 'https://huggingface.co/settings/tokens',
      recommended: false,
      status: 'Available'
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Free trial credits',
      keyFormat: 'co-...',
      url: 'https://dashboard.cohere.ai',
      recommended: false,
      status: 'Available'
    }
  ];

  return (
    <div className="flex flex-col h-[800px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Zap className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                🚀 Groq AI Assistant
              </h1>
              <p className="text-sm text-gray-500 flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>Analyzing: {pdfData.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Groq Connected</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={clearConversation}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <h3 className="font-medium text-gray-800">Free API Configuration</h3>
            </div>
            
            {/* API Provider Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {apiProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProvider(provider.id as any)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 flex items-center space-x-1">
                        <span>{provider.name}</span>
                        {provider.recommended && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600">{provider.description}</p>
                      <p className="text-xs text-gray-500">Format: {provider.keyFormat}</p>
                      <p className="text-xs font-medium text-green-600">{provider.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <input
              type="password"
              placeholder={`Enter your ${apiProviders.find(p => p.id === selectedProvider)?.name} API key (${apiProviders.find(p => p.id === selectedProvider)?.keyFormat})`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            
            <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">
              <p className="font-medium mb-1 text-green-600">✅ Groq API Key Configured!</p>
              <p className="text-xs text-gray-600">
                Your Groq API key is ready to use. Groq provides free access to powerful Llama 3 models with fast response times.
              </p>
              <div className="mt-2 text-xs">
                <p className="font-medium">🚀 Benefits of Groq:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Completely free with generous limits</li>
                  <li>Very fast response times (faster than GPT-4)</li>
                  <li>High-quality Llama 3 70B model</li>
                  <li>No credit card required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 max-w-4xl ${
              message.role === 'user' ? 'flex flex-col items-end' : ''
            }`}>
              <div className={`relative group ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3'
                  : 'bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 border border-gray-100'
              }`}>
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-800 prose-code:text-green-600 prose-code:bg-green-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                    message.role === 'user'
                      ? 'hover:bg-blue-400 text-blue-100'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  {copiedMessageId === message.id ? (
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
        ))}
        
        {(isLoading || isAnalyzing) && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 border border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {isAnalyzing ? 'Groq AI analyzing PDF...' : 'Groq AI thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length > 0 && !isLoading && !isAnalyzing && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">💡 Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your PDF using Groq AI..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-gray-50"
              rows={1}
              disabled={isLoading || isAnalyzing}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400">
              {inputValue.length}/2000
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isAnalyzing}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line • Powered by Groq AI (Free & Fast)
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
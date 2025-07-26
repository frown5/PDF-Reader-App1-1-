interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Groq API (Free tier with Llama models) - PRIMARY FREE OPTION
  async callGroqAPI(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192', // Free model with large context
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI assistant specialized in analyzing and discussing PDF documents. Provide detailed, accurate, and helpful responses based on the document content. Format your responses using markdown for better readability. Focus on being thorough and insightful in your analysis.'
            },
            ...messages
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  // Hugging Face Inference API (Free tier)
  async callHuggingFaceAPI(messages: ChatMessage[]): Promise<string> {
    try {
      // Combine messages into a single prompt for Hugging Face
      const prompt = messages.map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return `Human: ${msg.content}`;
        return `Assistant: ${msg.content}`;
      }).join('\n\n') + '\n\nAssistant:';

      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 1000,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Hugging Face API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return result[0]?.generated_text?.split('Assistant:').pop()?.trim() || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      throw error;
    }
  }

  // Cohere API (Free tier)
  async callCohereAPI(messages: ChatMessage[]): Promise<string> {
    try {
      const lastMessage = messages[messages.length - 1];
      const chatHistory = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: msg.content
      }));

      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-light', // Free tier model
          message: lastMessage.content,
          chat_history: chatHistory,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cohere API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.text || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Cohere API Error:', error);
      throw error;
    }
  }

  // Together AI (Free tier)
  async callTogetherAPI(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-2-7b-chat-hf', // Free model
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI assistant specialized in analyzing and discussing PDF documents. Provide detailed, accurate, and helpful responses based on the document content.'
            },
            ...messages
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Together AI Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Together AI Error:', error);
      throw error;
    }
  }

  // Main method to get AI response using free APIs
  async getResponse(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    if (!this.apiKey) {
      return this.getDemoResponse(userMessage);
    }

    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      // Try different free APIs based on key format or as fallbacks
      if (this.apiKey.startsWith('gsk_')) {
        // Groq API (Primary free option)
        return await this.callGroqAPI(messages);
      } else if (this.apiKey.startsWith('hf_')) {
        // Hugging Face API
        return await this.callHuggingFaceAPI(messages);
      } else if (this.apiKey.startsWith('co-')) {
        // Cohere API
        return await this.callCohereAPI(messages);
      } else {
        // Default to Groq for unknown formats (most reliable free option)
        return await this.callGroqAPI(messages);
      }
    } catch (error) {
      console.error('Primary API failed, trying fallback...', error);
      
      // Fallback strategy: try other free APIs
      try {
  if (!this.apiKey.startsWith('gsk_')) {
    return await this.callGroqAPI(messages);
  } else {
    // Just in case Groq already failed, return a fallback message.
    return "I'm having trouble connecting to the AI service. Please check your API key and try again.";
  }
} catch (fallbackError) {
  console.error('All APIs failed:', fallbackError);
  return "I'm having trouble connecting to the AI service. Please check your API key and try again.";
}

    }
  }

  // Demo responses for when no API key is provided
  private getDemoResponse(userMessage: string): string {
    return `**🆓 Free AI Assistant - PDF Analysis**

I can see you're asking: "${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''}"

To get real AI analysis of your PDF using **FREE APIs**, please get an API key from one of these providers:

## 🚀 **Recommended Free Options:**

### **1. Groq (BEST FREE OPTION)**
- ✅ **Completely FREE** with generous limits
- ✅ **Very fast responses** (faster than GPT-4)
- ✅ **High-quality Llama models**
- 🔗 Get your free key: [console.groq.com](https://console.groq.com)
- 🔑 Key format: \`gsk_...\`

### **2. Hugging Face**
- ✅ **Free tier available**
- ✅ **Multiple model options**
- 🔗 Get your free key: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- 🔑 Key format: \`hf_...\`

### **3. Cohere**
- ✅ **Free trial credits**
- ✅ **Good for text analysis**
- 🔗 Get your free key: [dashboard.cohere.ai](https://dashboard.cohere.ai)
- 🔑 Key format: \`co-...\`

## 🎯 **How to Use:**
1. **Click the settings icon** ⚙️ above
2. **Enter your free API key**
3. **Ask your question again** to get detailed AI analysis

## 💡 **What I can do with your PDF:**
- 📊 **Comprehensive document analysis**
- 📝 **Detailed summaries and key points**
- ❓ **Answer specific questions about content**
- 🔍 **Find and explain complex topics**
- 💡 **Provide insights and recommendations**
- 📋 **Extract action items and conclusions**

**Your PDF is ready** - just add a free API key to start the intelligent conversation! 🚀

*Tip: Groq is recommended as it's completely free with no credit limits and very fast!*`;
  }
}

export const aiService = new AIService();
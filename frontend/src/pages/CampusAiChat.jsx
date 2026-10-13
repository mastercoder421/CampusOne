import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Bot,
  User,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'What is the minimum attendance criteria?',
  'How do I file a mess or hostel grievance?',
  'What events and hackathons are scheduled?',
  'How do I reserve Seminar Hall A?',
];

const CampusAiChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 Welcome to **CampusBot**! I am your 24/7 official AI campus assistant for **CampusOne**.\n\nYou can ask me about:\n- Academic attendance policies (75% minimum criteria)\n- Assignment deadlines & submission procedures\n- Club hackathons & cultural fests\n- Hostel, mess, and maintenance grievance procedures\n- Facility and laboratory bookings\n\nHow can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send both message and history
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axiosClient.post('/ai/assistant/chat', {
        message: textToSend,
        history: historyPayload,
      });

      const replyContent = res.data.reply || 'I am ready to assist you.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: replyContent },
      ]);
    } catch (error) {
      console.error('Error querying CampusBot:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ CampusBot is momentarily experiencing high network load. As a reminder, **75% attendance** is strictly required for exam eligibility. You can also file grievances in the Grievance Board tab.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Chat session refreshed. How can CampusBot help you with CampusOne today?',
      },
    ]);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              CampusBot AI Assistant
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                24/7 Smart Bot
              </span>
            </h2>
            <p className="text-sm text-slate-500">
              Powered by Google Gemini • Smart Campus Operating System
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {SUGGESTIONS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-xs px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3 h-3 text-purple-500" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto glass-card p-4 sm:p-6 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-campus-600 text-white shadow-sm'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-campus-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/90 text-slate-800 shadow-sm rounded-tl-none prose prose-sm prose-slate max-w-none'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs text-slate-500 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>CampusBot is preparing your response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about attendance, grievances, events, assignments..."
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm font-medium outline-none transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default CampusAiChat;

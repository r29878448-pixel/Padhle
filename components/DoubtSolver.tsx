
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { solveDoubt } from '../services/geminiService';
import { ChatMessage } from '../types';

interface DoubtSolverProps {
  currentContext: string;
}

const DoubtSolver: React.FC<DoubtSolverProps> = ({ currentContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await solveDoubt(input, currentContext);
    setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center gap-3">
        <Sparkles size={20} />
        <h3 className="font-black tracking-tight">AI Doubt Assistant</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="bg-blue-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
              <Bot size={40} />
            </div>
            <h4 className="font-black text-slate-800 text-lg">Instant Doubt Resolution</h4>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Ask any academic question related to this lecture. I'm powered by Gemini 3 Pro.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed max-w-[85%] ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="bg-slate-50 p-4 rounded-[1.5rem] rounded-tl-none flex gap-1.5 items-center border border-slate-100">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 border-t bg-slate-50/50 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your academic doubt..."
          className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 font-semibold text-sm shadow-sm"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-90"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default DoubtSolver;

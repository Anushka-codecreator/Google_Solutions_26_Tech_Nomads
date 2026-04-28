import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage, Need } from '../types';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface AIAssistantProps {
  needs: Need[];
}

export function AIAssistant({ needs }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am Sahyog, your AI Community Assistant. I can help you find critical needs, analyze hotspots, or assign nearby tasks. How can I help you today?', timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const prompt = `Context: You are "Sahyog", a humanitarian AI assistant. Current community needs data: ${JSON.stringify(needs.slice(0, 5))}. 
      User Query: "${input}"
      Answer concisely. If asked to "assign tasks", suggest the highest priority items. If asked "where is help needed most", point to the category with highest priority scores. Use community-focused language.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: response.text || "I'm processing that. Let me look at the field reports.", 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered a connection issue syncing with the field data.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border shadow-xl overflow-hidden">
      <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold tracking-tight">Conversational Intelligence</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Powered by Gemma / Gemini</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-900' : 'bg-blue-600'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-slate-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <div className="flex justify-start">
             <div className="flex gap-3 items-center">
               <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                 <Bot className="h-4 w-4 text-white" />
               </div>
               <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
             </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Sahyog: 'Where is help needed most?'"
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
          {["Where is help needed most?", "Assign me nearby tasks", "Show medical alerts"].map((hint) => (
            <button
              key={hint}
              onClick={() => setInput(hint)}
              className="px-3 py-1 bg-slate-50 border rounded-full text-[10px] font-bold text-slate-500 whitespace-nowrap hover:bg-slate-100 transition-all"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowRightLeft, Send } from 'lucide-react';
import { AppHeader } from './AppHeader';

interface ChatScreenProps {
  onBack: () => void;
}

const MOCK_MESSAGES = [
    { id: 1, sender: 'me', text: 'hi', time: '08:27' },
    { id: 2, sender: 'other', text: 'Big man', time: '08:27' },
    { id: 3, sender: 'me', text: 'sure', time: '08:27' },
    { id: 4, sender: 'other', text: 'Ready to trade ?', time: '08:28' },
];

export const ChatScreen: React.FC<ChatScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;

      const newMessage = {
          id: messages.length + 1,
          sender: 'me',
          text: inputText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([...messages, newMessage]);
      setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        onBack={onBack}
        className="shadow-sm"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100 mr-2">
            <img src="https://i.pravatar.cc/150?img=11" alt="Ebuka" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Ebuka</h1>
        </div>
      </AppHeader>

      {/* Trade Match Context Card */}
      <div className="bg-gray-50 p-4 shrink-0 border-b border-gray-100">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-brand relative overflow-hidden">
               <div className="flex items-center text-brand font-bold text-xs uppercase tracking-wider mb-3">
                   <ArrowRightLeft size={14} className="mr-1.5" />
                   Trade Match
               </div>

               <div className="flex items-center justify-between relative z-10">
                   {/* Your Item */}
                   <div className="flex-1 min-w-0">
                       <p className="text-xs text-gray-500 mb-0.5">Your item:</p>
                       <h3 className="font-bold text-gray-900 text-sm truncate">AirPod Pro</h3>
                       <p className="text-[10px] text-gray-400">30/11/2025</p>
                   </div>

                   {/* Direction Arrow */}
                   <div className="px-2 text-gray-300">
                       <ArrowRight size={20} />
                   </div>

                   {/* Their Item */}
                   <div className="flex-1 min-w-0 text-right">
                       <p className="text-xs text-gray-500 mb-0.5">Their item:</p>
                       <h3 className="font-bold text-gray-900 text-sm truncate">Phone holder</h3>
                       {/* Optional image placeholder if needed for context */}
                   </div>
               </div>
          </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wide">Today</span>
          </div>

          {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm relative group ${
                        msg.sender === 'me' 
                        ? 'bg-brand text-white rounded-br-none' 
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                    }`}
                  >
                      <p>{msg.text}</p>
                      <span className={`text-[10px] mt-1 block text-right font-medium opacity-70 ${msg.sender === 'me' ? 'text-white/80' : 'text-gray-400'}`}>
                          {msg.time}
                      </span>
                  </div>
              </div>
          ))}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex items-center space-x-2 bg-gray-100 rounded-full px-2 py-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm text-gray-800 placeholder-gray-500"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
              >
                  <Send size={18} className="ml-0.5" />
              </button>
          </form>
      </div>

    </div>
  );
};
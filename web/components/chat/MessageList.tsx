import React, { useRef, useEffect } from 'react';

interface Message {
  id: number;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
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
  );
};





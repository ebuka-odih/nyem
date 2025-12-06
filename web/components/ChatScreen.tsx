import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { TradeMatchCard } from './chat/TradeMatchCard';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';

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

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;

      const newMessage = {
          id: messages.length + 1,
          sender: 'me' as const,
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
      <TradeMatchCard 
        yourItem="AirPod Pro"
        theirItem="Phone holder"
      />

      {/* Chat Messages */}
      <MessageList messages={messages} />

      {/* Input Area */}
      <MessageInput 
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSend}
      />
    </div>
  );
};
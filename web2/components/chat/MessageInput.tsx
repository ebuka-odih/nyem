import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  value, 
  onChange, 
  onSubmit 
}) => {
  return (
    <div className="p-3 bg-white border-t border-gray-100">
      <form onSubmit={onSubmit} className="flex items-center space-x-2 bg-gray-100 rounded-full px-2 py-2">
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm text-gray-800 placeholder-gray-500"
        />
        <button 
          type="submit"
          disabled={!value.trim()}
          className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
};


















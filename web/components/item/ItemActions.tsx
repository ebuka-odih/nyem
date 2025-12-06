import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ItemActionsProps {
  onViewProfile?: () => void;
  onChat?: () => void;
}

export const ItemActions: React.FC<ItemActionsProps> = ({ 
  onViewProfile, 
  onChat 
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-8">
      <div className="flex space-x-3">
        <button 
          onClick={onViewProfile}
          className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          View Profile
        </button>
        <button 
          onClick={onChat}
          className="flex-[2] bg-brand text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-transform flex items-center justify-center"
        >
          <MessageCircle size={18} className="mr-2" />
          Chat Now
        </button>
      </div>
    </div>
  );
};


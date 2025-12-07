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
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2.5 max-w-md mx-auto">
          <button 
            onClick={onViewProfile}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200"
          >
            View Profile
          </button>
          <button 
            onClick={onChat}
            className="flex-[1.4] bg-brand text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
          >
            <MessageCircle size={16} className="mr-1.5" strokeWidth={2} />
            Chat Now
          </button>
        </div>
      </div>
    </div>
  );
};




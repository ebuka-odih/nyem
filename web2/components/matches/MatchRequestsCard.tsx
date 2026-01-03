import React from 'react';
import { Bell, ChevronRight } from 'lucide-react';

interface MatchRequestsCardProps {
  pendingCount: number;
  onClick: () => void;
}

export const MatchRequestsCard: React.FC<MatchRequestsCardProps> = ({ 
  pendingCount, 
  onClick 
}) => {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
          <Bell size={20} fill="currentColor" />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-900">Match Requests</h3>
          <p className="text-xs text-gray-500">Check pending likes</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {/* Badge */}
        {pendingCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
            {pendingCount}
          </span>
        )}
        <ChevronRight size={18} className="text-gray-300" />
      </div>
    </button>
  );
};


















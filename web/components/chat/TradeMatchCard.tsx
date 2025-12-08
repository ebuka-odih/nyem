import React from 'react';
import { ArrowRightLeft, ArrowRight } from 'lucide-react';

interface TradeMatchCardProps {
  yourItem: string;
  theirItem: string;
  date?: string;
}

export const TradeMatchCard: React.FC<TradeMatchCardProps> = ({ 
  yourItem, 
  theirItem, 
  date = '30/11/2025' 
}) => {
  return (
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
            <h3 className="font-bold text-gray-900 text-sm truncate">{yourItem}</h3>
            <p className="text-[10px] text-gray-400">{date}</p>
          </div>

          {/* Direction Arrow */}
          <div className="px-2 text-gray-300">
            <ArrowRight size={20} />
          </div>

          {/* Their Item */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-gray-500 mb-0.5">Their item:</p>
            <h3 className="font-bold text-gray-900 text-sm truncate">{theirItem}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};





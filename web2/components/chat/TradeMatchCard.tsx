import React from 'react';
import { ArrowRightLeft, ArrowRight } from 'lucide-react';

interface TradeMatchCardProps {
  yourItem: string;
  theirItem: string;
  date?: string;
  yourItemImage?: string;
  theirItemImage?: string;
}

export const TradeMatchCard: React.FC<TradeMatchCardProps> = ({ 
  yourItem, 
  theirItem, 
  date,
  yourItemImage,
  theirItemImage,
}) => {
  // Generate placeholder images if not provided
  const yourImage = yourItemImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(yourItem)}&background=880e4f&color=fff&size=128`;
  const theirImage = theirItemImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(theirItem)}&background=880e4f&color=fff&size=128`;

  return (
    <div className="bg-gray-50 p-4 shrink-0 border-b border-gray-100">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-brand relative overflow-hidden">
        <div className="flex items-center text-brand font-bold text-xs uppercase tracking-wider mb-3">
          <ArrowRightLeft size={14} className="mr-1.5" />
          Trade Match
        </div>

        <div className="flex items-center justify-between relative z-10 gap-3">
          {/* Your Item */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {yourItemImage && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                <img 
                  src={yourImage} 
                  alt={yourItem}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(yourItem)}&background=880e4f&color=fff&size=128`;
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Your item:</p>
              <h3 className="font-bold text-gray-900 text-sm truncate">{yourItem}</h3>
              {date && <p className="text-[10px] text-gray-400">{date}</p>}
            </div>
          </div>

          {/* Direction Arrow */}
          <div className="px-2 text-gray-300 shrink-0">
            <ArrowRight size={20} />
          </div>

          {/* Their Item */}
          <div className="flex-1 min-w-0 flex items-center gap-2 justify-end">
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs text-gray-500 mb-0.5">Their item:</p>
              <h3 className="font-bold text-gray-900 text-sm truncate">{theirItem}</h3>
            </div>
            {theirItemImage && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                <img 
                  src={theirImage} 
                  alt={theirItem}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(theirItem)}&background=880e4f&color=fff&size=128`;
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};






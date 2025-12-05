import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { AppHeader } from './AppHeader';

interface MatchRequestsScreenProps {
  onBack: () => void;
}

export const MatchRequestsScreen: React.FC<MatchRequestsScreenProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        title="Match Requests"
        onBack={onBack}
      />

      {/* Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
         <div className="mb-6 animate-pulse">
             <Heart size={64} className="text-gray-400" strokeWidth={1.5} />
         </div>
         
         <h2 className="text-2xl font-extrabold text-gray-900 mb-3">No match requests</h2>
         <p className="text-gray-500 max-w-[240px] leading-relaxed">
             When someone swipes right on your items, you'll see them here! 🎉
         </p>
      </div>
    </div>
  );
};
import React from 'react';
import { Bell, ChevronRight, Search } from 'lucide-react';

interface MatchesScreenProps {
  onNavigateToRequests: () => void;
  onNavigateToChat: () => void;
}

const MOCK_MATCHES = [
  {
    id: 1,
    name: "Ebuka",
    message: "Ready to trade ?",
    avatar: "https://i.pravatar.cc/150?img=11",
    time: "08:28",
    unread: true
  },
  {
    id: 2,
    name: "Sarah",
    message: "Is the camera still available?",
    avatar: "https://i.pravatar.cc/150?img=5",
    time: "Yesterday",
    unread: false
  },
  {
    id: 3,
    name: "David",
    message: "I have a mechanical keyboard",
    avatar: "https://i.pravatar.cc/150?img=3",
    time: "Mon",
    unread: false
  }
];

export const MatchesScreen: React.FC<MatchesScreenProps> = ({ onNavigateToRequests, onNavigateToChat }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-gray-900">Matches</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Search Bar (Optional visual enhancement) */}
        <div className="relative">
            <input 
                type="text" 
                placeholder="Search matches" 
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>

        {/* Match Requests Card */}
        <button 
            onClick={onNavigateToRequests}
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
                 <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">2</span>
                 <ChevronRight size={18} className="text-gray-300" />
            </div>
        </button>

        {/* Matches List */}
        <div className="space-y-3">
             {MOCK_MATCHES.map((match) => (
                 <button 
                    key={match.id}
                    onClick={onNavigateToChat}
                    className="w-full bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                 >
                    <div className="relative mr-4 shrink-0">
                        <img src={match.avatar} alt={match.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                        {match.unread && <div className="absolute top-0 right-0 w-3 h-3 bg-brand border-2 border-white rounded-full"></div>}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-gray-900 truncate">{match.name}</h3>
                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">{match.time}</span>
                        </div>
                        <p className={`text-sm truncate ${match.unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                            {match.message}
                        </p>
                    </div>
                    
                    <ChevronRight size={18} className="text-gray-300 ml-2" />
                 </button>
             ))}
        </div>
      </div>
    </div>
  );
};
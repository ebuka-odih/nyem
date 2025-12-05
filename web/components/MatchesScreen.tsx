import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface MatchesScreenProps {
  onNavigateToRequests: () => void;
  onNavigateToChat: () => void;
}

interface Match {
  id: number;
  name: string;
  message: string;
  avatar: string;
  time: string;
  unread: boolean;
}

export const MatchesScreen: React.FC<MatchesScreenProps> = ({ onNavigateToRequests, onNavigateToChat }) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch matches
        const matchesRes = await apiFetch(ENDPOINTS.matches.list, { token });
        const matchesData = matchesRes.data || matchesRes.matches || [];

        // Transform API matches to Match format
        const transformedMatches: Match[] = matchesData.map((match: any) => {
          const otherUser = match.user1 || match.user2 || match.other_user || {};
          const lastMessage = match.last_message || {};
          
          return {
            id: match.id,
            name: otherUser.username || 'Unknown',
            message: lastMessage.content || 'Start a conversation',
            avatar: otherUser.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.username || 'User')}`,
            time: match.updated_at ? formatTime(match.updated_at) : 'Just now',
            unread: match.unread_count > 0,
          };
        });

        setMatches(transformedMatches);

        // Fetch pending requests count
        try {
          const pendingRes = await apiFetch(ENDPOINTS.swipes.pendingRequests, { token });
          const pendingData = pendingRes.data || pendingRes.requests || [];
          setPendingCount(pendingData.length);
        } catch (error) {
          console.error('Failed to fetch pending requests:', error);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [token]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
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
                 {pendingCount > 0 && (
                     <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                         {pendingCount}
                     </span>
                 )}
                 <ChevronRight size={18} className="text-gray-300" />
            </div>
        </button>

        {/* Matches List */}
        <div className="space-y-3">
             {loading ? (
                 <div className="text-center py-8 text-gray-500">Loading matches...</div>
             ) : matches.length > 0 ? (
                 matches.map((match) => (
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
                 ))
             ) : (
                 <div className="text-center py-8 text-gray-500">No matches yet</div>
             )}
        </div>
      </div>
    </div>
  );
};
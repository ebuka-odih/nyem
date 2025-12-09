import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';
import { LoginPrompt } from './common/LoginPrompt';
import { SearchBar } from './matches/SearchBar';
import { MatchRequestsCard } from './matches/MatchRequestsCard';
import { MatchList } from './matches/MatchList';

interface MatchesScreenProps {
  onNavigateToRequests: () => void;
  onNavigateToChat: () => void;
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
}

interface Match {
  id: number;
  name: string;
  message: string;
  avatar: string;
  time: string;
  unread: boolean;
}

export const MatchesScreen: React.FC<MatchesScreenProps> = ({ onNavigateToRequests, onNavigateToChat, onLoginRequest, onSignUpRequest }) => {
  const { token, isAuthenticated } = useAuth();
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
  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader 
          title="Matches" 
          className="sticky top-0"
        />
        <LoginPrompt 
          title="Sign In Required"
          message="Please sign in to view your matches and connect with other users."
          onLoginRequest={onLoginRequest}
          onSignUpRequest={onSignUpRequest}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <AppHeader 
        title="Matches" 
        className="sticky top-0"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Bar */}
        <SearchBar />

        {/* Match Requests Card */}
        <MatchRequestsCard 
          pendingCount={pendingCount}
          onClick={onNavigateToRequests}
        />

        {/* Matches List */}
        <MatchList 
          matches={matches}
          loading={loading}
          onMatchClick={() => onNavigateToChat()}
        />
      </div>
    </div>
  );
};
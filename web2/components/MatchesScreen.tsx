import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';
import { LoginPrompt } from './common/LoginPrompt';
import { SearchBar } from './matches/SearchBar';
import { MatchRequestsCard } from './matches/MatchRequestsCard';
import { MatchList } from './matches/MatchList';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../constants/placeholders';

interface MatchesScreenProps {
  onNavigateToRequests: () => void;
  onNavigateToChat: (conversation: any) => void;
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
    const fetchConversations = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch conversations (chat threads) instead of matches
        const conversationsRes = await apiFetch(ENDPOINTS.conversations.list, { token });
        const conversationsData = conversationsRes.data || conversationsRes.conversations || [];

        // Transform API conversations to Match format for display
        // Store full conversation data for navigation
        const transformedMatches: (Match & { conversationData?: any })[] = conversationsData.map((conversation: any) => {
          const otherUser = conversation.other_user || {};
          const lastMessage = conversation.last_message || {};
          
          return {
            id: conversation.id || conversation.conversation_id,
            name: otherUser.username || 'Unknown',
            message: lastMessage.message_text || lastMessage.content || 'Start a conversation',
            avatar: (() => {
              const profilePhoto = otherUser.profile_photo;
              const userName = otherUser.username || 'Unknown';
              if (!profilePhoto || profilePhoto.trim() === '') {
                return generateInitialsAvatar(userName);
              }
              // Filter out generated avatars
              const generatedAvatarPatterns = [
                'ui-avatars.com',
                'pravatar.cc',
                'i.pravatar.cc',
                'robohash.org',
                'dicebear.com',
                'avatar.vercel.sh',
              ];
              const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
                profilePhoto.toLowerCase().includes(pattern.toLowerCase())
              );
              return isGeneratedAvatar ? generateInitialsAvatar(userName) : profilePhoto;
            })(),
            time: conversation.updated_at ? formatTime(conversation.updated_at) : 'Just now',
            unread: conversation.unread_count > 0,
            conversationData: conversation, // Store full conversation data
          };
        });

        setMatches(transformedMatches);

        // Fetch pending requests count
        try {
          const pendingRes = await apiFetch(ENDPOINTS.tradeOffers.pending, { token });
          // Backend returns { offers: [...] }
          const pendingData = pendingRes.offers || [];
          setPendingCount(pendingData.length);
        } catch (error) {
          console.error('Failed to fetch pending requests:', error);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
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
          onMatchClick={(match) => {
            const conversation = (match as any).conversationData;
            if (conversation) {
              onNavigateToChat(conversation);
            }
          }}
        />
      </div>
    </div>
  );
};
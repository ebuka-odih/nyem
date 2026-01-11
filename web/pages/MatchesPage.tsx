import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { ChatView } from '../components/ChatView';
import { ChatsList } from '../components/ChatsList';
import { RequestsList } from '../components/RequestsList';
import { NotificationPermissionModal } from '../components/NotificationPermissionModal';
import { Bell } from 'lucide-react';
import { useConversations, useMessageRequests, useTradeOffers } from '../hooks/api/useMatches';
import { useProfile } from '../hooks/api/useProfile';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

interface MatchRequest {
  id: string;
  from_user: {
    id: string;
    username: string;
    name?: string;
    photo?: string;
    city?: string;
  };
  listing: {
    id: string;
    title: string;
    photo?: string;
    price?: number;
  };
  item?: { // Backward compatibility
    id: string;
    title: string;
    photo?: string;
  };
  message_text?: string;
  status: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  other_user: {
    id: string;
    username: string;
    name?: string;
    profile_photo?: string;
    city?: string;
  };
  last_message?: {
    id: string;
    message_text: string;
    sender_id: string;
    created_at: string;
  };
  updated_at: string;
}

interface MatchesPageProps {
  onChatToggle?: (isOpen: boolean) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onChatToggle }) => {
  const { id: chatId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'chats'>('chats');
  // React Query hooks
  const {
    data: chats = [],
    isLoading: loadingChats,
    refetch: fetchConversations
  } = useConversations();

  const {
    data: requests = [],
    isLoading: loadingRequests,
    refetch: fetchMessageRequests
  } = useMessageRequests();

  const {
    data: tradeOffers = [],
    isLoading: loadingTrades,
    refetch: fetchTradeOffers
  } = useTradeOffers();

  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const currentUserId = useRef<string | null>(null);

  const { data: userData } = useProfile();

  useEffect(() => {
    if (userData?.id) {
      currentUserId.current = userData.id;
    }
  }, [userData]);

  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();

  // Listen for new messages globally to refresh conversation list
  useEffect(() => {
    if (!userData?.id) return;

    const unsubscribe = subscribe(`user.${userData.id}`, (event: any) => {
      console.log('[MatchesPage] WebSocket event received:', event);
      // Refresh the conversations list to show new message snippets/badges
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => unsubscribe();
  }, [userData?.id, subscribe, queryClient]);

  // Handle initial chat open if id is in URL
  useEffect(() => {
    if (chatId && chats.length > 0 && !selectedChat) {
      const chat = chats.find(c => c.conversation_id === chatId || c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        onChatToggle?.(true);
      }
    }
  }, [chatId, chats, selectedChat, onChatToggle]);

  const loading = loadingChats || loadingRequests;

  const handleRequestAccepted = async () => {
    // Refresh both lists after accepting a request
    await fetchConversations();
    await fetchMessageRequests();
    await fetchTradeOffers();
    setActiveTab('chats');
  };

  const handleRequestDeclined = (requestId: string) => {
    // Optionally refresh to ensure consistency
    fetchMessageRequests();
  };

  const handleChatClick = (chat: ChatMessage) => {
    setSelectedChat(chat);
    onChatToggle?.(true);
  };

  const handleChatClose = () => {
    setSelectedChat(null);
    onChatToggle?.(false);
    // If we were on /chat/:id, go back to /matches
    if (chatId) {
      navigate('/matches');
    }
    // Refresh conversations when closing chat to get updated last message
    fetchConversations();
  };

  const handleChatOpen = (conversationId: string) => {
    // Find the chat by conversation_id and open it
    const chat = chats.find(c => c.conversation_id === conversationId || c.id === conversationId);
    if (chat) {
      handleChatClick(chat);
    } else {
      // If chat not found, refresh and try again
      fetchConversations().then(() => {
        const updatedChat = chats.find(c => c.conversation_id === conversationId || c.id === conversationId);
        if (updatedChat) {
          handleChatClick(updatedChat);
        }
      });
    }
  };

  const handleNotificationRegistered = async (playerId: string) => {
    // Refresh to ensure we have the latest
    fetchConversations();
  };

  // Show chat view if a chat is selected
  if (selectedChat) {
    return (
      <ChatView
        chat={selectedChat}
        currentUserId={currentUserId.current}
        onClose={handleChatClose}
        onChatToggle={onChatToggle}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={subtleTransition}
      className="w-full max-w-2xl mx-auto flex flex-col pb-40"
    >
      {/* Tabs */}
      <div className="flex px-4 gap-4 mb-6 mt-2">
        <button
          onClick={() => setActiveTab('chats')}
          className={`relative px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chats' ? 'bg-[#830e4c] text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-100'}`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`relative px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-[#830e4c] text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-100'}`}
        >
          Requests
          {(requests.length + tradeOffers.length) > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#830e4c] text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">
              {requests.length + tradeOffers.length}
            </span>
          )}
        </button>
      </div>


      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSuccess={handleNotificationRegistered}
      />

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 border-4 border-[#830e4c] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'chats' ? (
              <ChatsList
                key="chats-list"
                chats={chats}
                currentUserId={currentUserId.current}
                onChatClick={handleChatClick}
              />
            ) : (
              <RequestsList
                key="requests-list"
                requests={requests}
                tradeOffers={tradeOffers}
                onRequestAccepted={handleRequestAccepted}
                onRequestDeclined={handleRequestDeclined}
                onChatOpen={handleChatOpen}
              />
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

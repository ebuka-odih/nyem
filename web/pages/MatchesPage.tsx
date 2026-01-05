import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { ChatView } from '../components/ChatView';
import { ChatsList } from '../components/ChatsList';
import { RequestsList } from '../components/RequestsList';
import { Bell } from 'lucide-react';

// OneSignal TypeScript declarations
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignalReady?: Promise<any>;
  }
}

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
  const [activeTab, setActiveTab] = useState<'requests' | 'chats'>('chats');
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  
  const currentUserId = useRef<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const response = await apiFetch<any>(ENDPOINTS.profile.me, { token });
        if (response && response.user && response.user.id) {
          currentUserId.current = response.user.id;
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  // Fetch conversations and message requests
  useEffect(() => {
    fetchConversations();
    fetchMessageRequests();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      if (!token) return;

      const response = await apiFetch<{ conversations: ChatMessage[] }>(ENDPOINTS.conversations.list, { token });
      if (response.conversations) {
        setChats(response.conversations);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageRequests = async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      const response = await apiFetch<{ requests: MatchRequest[] }>(ENDPOINTS.messageRequests.pending, { token });
      if (response.requests) {
        setRequests(response.requests);
      }
    } catch (err) {
      console.error('Failed to fetch message requests:', err);
    }
  };

  const handleRequestAccepted = async () => {
    // Refresh both lists after accepting a request
      await fetchConversations();
    await fetchMessageRequests();
      setActiveTab('chats');
  };

  const handleRequestDeclined = (requestId: string) => {
    // Remove from local state immediately for better UX
    setRequests(prev => prev.filter(r => r.id !== requestId));
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

  const handleTestNotification = async () => {
    try {
      setIsSendingTestNotification(true);
      const token = getStoredToken();
      if (!token) {
        alert('Please log in to test notifications');
        return;
      }

      // Step 1: Get OneSignal instance and ensure user is subscribed
      let OneSignal: any = null;
      
      if (window.OneSignalReady) {
        OneSignal = await window.OneSignalReady;
      } else if (window.OneSignal) {
        OneSignal = window.OneSignal;
      } else if (window.OneSignalDeferred) {
        OneSignal = await new Promise<any>((resolve) => {
          window.OneSignalDeferred!.push((instance: any) => {
            resolve(instance);
          });
        });
      }

      if (!OneSignal) {
        alert('OneSignal is not loaded. Please refresh the page and try again.');
        return;
      }

      // Step 2: Check if user is subscribed, if not, prompt them
      let isOptedIn = false;
      let playerId: string | null = null;

      if (OneSignal.User?.PushSubscription) {
        isOptedIn = OneSignal.User.PushSubscription.optedIn ?? false;
        playerId = OneSignal.User.PushSubscription.id ?? null;
      } else if (typeof OneSignal.isPushNotificationsEnabled === 'function') {
        isOptedIn = await OneSignal.isPushNotificationsEnabled();
        if (typeof OneSignal.getUserId === 'function') {
          playerId = await OneSignal.getUserId();
        }
      }

      // Step 3: If not subscribed, prompt for subscription
      if (!isOptedIn || !playerId) {
        const shouldSubscribe = confirm(
          'You need to subscribe to push notifications first. Click OK to subscribe, or Cancel to skip.'
        );
        
        if (!shouldSubscribe) {
          return;
        }

        // Prompt for subscription
        try {
          if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === 'function') {
            await OneSignal.Slidedown.promptPush();
          } else if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
            const permission = await OneSignal.Notifications.requestPermission();
            if (permission === 'granted' && OneSignal.User?.PushSubscription?.optIn) {
              await OneSignal.User.PushSubscription.optIn();
            }
          } else if (typeof OneSignal.registerForPushNotifications === 'function') {
            await OneSignal.registerForPushNotifications();
          }

          // Wait a moment for subscription to complete
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Get player ID after subscription
          if (OneSignal.User?.PushSubscription) {
            isOptedIn = OneSignal.User.PushSubscription.optedIn ?? false;
            playerId = OneSignal.User.PushSubscription.id ?? null;
          } else if (typeof OneSignal.getUserId === 'function') {
            playerId = await OneSignal.getUserId();
          }

          if (!isOptedIn || !playerId) {
            alert('Failed to subscribe to notifications. Please try again.');
            return;
          }
        } catch (err: any) {
          console.error('Failed to subscribe:', err);
          alert('Failed to subscribe to notifications: ' + (err?.message || 'Unknown error'));
          return;
        }
      }

      // Step 4: Register player ID with backend if we have it
      if (playerId) {
        try {
          await apiFetch(ENDPOINTS.profile.updateOneSignalPlayerId, {
            method: 'POST',
            token,
            body: {
              onesignal_player_id: playerId,
            },
          });
          console.log('OneSignal player ID registered:', playerId);
        } catch (err) {
          console.warn('Failed to register player ID (may already be registered):', err);
          // Continue anyway - player ID might already be registered
        }
      }

      // Step 5: Send test notification
      const response = await apiFetch(ENDPOINTS.notifications.testMe, {
        method: 'POST',
        token,
        body: {
          title: 'Test Notification',
          message: 'This is a test notification from Nyem! 🎉',
        },
      });

      if (response.success) {
        alert('✅ Test notification sent successfully! Check your device.');
      } else {
        alert(`❌ Failed to send notification: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      
      // Handle specific error messages
      if (error.message?.includes('OneSignal player ID')) {
        alert('❌ ' + error.message + '\n\nPlease make sure you have subscribed to push notifications.');
      } else {
        alert(`❌ Error: ${error.message || 'Failed to send test notification'}`);
      }
    } finally {
      setIsSendingTestNotification(false);
    }
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
          {requests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#830e4c] text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Test OneSignal Notification Button */}
      <div className="px-4 mb-4">
        <button
          onClick={handleTestNotification}
          disabled={isSendingTestNotification}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isSendingTestNotification
              ? 'bg-neutral-300 text-neutral-500 cursor-wait'
              : 'bg-[#830e4c] text-white shadow-lg active:scale-95 hover:bg-[#931e5c]'
          }`}
        >
          <Bell size={18} strokeWidth={2.5} />
          {isSendingTestNotification ? 'Sending...' : 'Test Push Notification'}
        </button>
      </div>

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


import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Zap, ChevronRight, Search, MoreHorizontal, CheckCheck, X, Check, Star, Send, ArrowLeft, MoreVertical, Phone, Video, Paperclip, Smile, ShieldCheck, Lock, CreditCard, ShoppingBag, ShieldAlert, Bell } from 'lucide-react';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

// OneSignal TypeScript declarations
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignalReady?: Promise<any>;
    PushAlert?: any;
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

interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    profile_photo?: string;
  };
  receiver?: {
    id: string;
    username: string;
    profile_photo?: string;
  };
}

interface MatchesPageProps {
  onChatToggle?: (isOpen: boolean) => void;
}

/**
 * Format timestamp to relative time (e.g., "2m ago", "1h ago", "Just now")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // For older dates, return formatted date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

/**
 * Format timestamp to time string (e.g., "10:30 AM")
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onChatToggle }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'chats'>('chats');
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isEscrowActive, setIsEscrowActive] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isPushAlertSubscribed, setIsPushAlertSubscribed] = useState(false);
  const [isPushAlertSubscribing, setIsPushAlertSubscribing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUserId = useRef<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const response = await apiFetch<{ user: { id: string } }>(ENDPOINTS.profile.me, { token });
        if (response.user?.id) {
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
    checkOneSignalSubscription();
  }, []);

  // Check OneSignal subscription status
  const checkOneSignalSubscription = async () => {
    try {
      // Wait for OneSignal to be ready using the promise from initialization
      let OneSignal: any = null;
      
      if (window.OneSignalReady) {
        // Use the initialization promise
        OneSignal = await window.OneSignalReady;
      } else if (window.OneSignal) {
        // Already loaded
        OneSignal = window.OneSignal;
      } else if (window.OneSignalDeferred) {
        // Wait for deferred initialization
        OneSignal = await new Promise<any>((resolve) => {
          window.OneSignalDeferred!.push((instance: any) => {
            resolve(instance);
          });
        });
      } else {
        // OneSignal not loaded yet, return silently
        return;
      }

      if (!OneSignal) {
        return; // OneSignal not available
      }
      
      // Check subscription status using multiple possible API structures
      let isOptedIn = false;
      
      if (OneSignal.User?.PushSubscription?.optedIn !== undefined) {
        isOptedIn = OneSignal.User.PushSubscription.optedIn;
      } else if (typeof OneSignal.isPushNotificationsEnabled === 'function') {
        try {
          isOptedIn = await OneSignal.isPushNotificationsEnabled();
        } catch (err) {
          console.warn('isPushNotificationsEnabled failed:', err);
        }
      } else if (OneSignal.getNotificationPermission) {
        const permission = OneSignal.getNotificationPermission();
        isOptedIn = permission === 'granted';
      } else if ('Notification' in window) {
        // Fallback to browser API
        isOptedIn = Notification.permission === 'granted';
      }

      setIsSubscribed(isOptedIn);
    } catch (err) {
      console.error('Failed to check OneSignal subscription:', err);
      // Don't set error state, just log it
    }
  };

  // Handle OneSignal subscription
  const handleSubscribeToNotifications = async () => {
    try {
      setIsSubscribing(true);
      
      // Wait for OneSignal to be ready using the promise from initialization
      let OneSignal: any = null;
      
      if (window.OneSignalReady) {
        // Use the initialization promise
        OneSignal = await window.OneSignalReady;
      } else if (window.OneSignal) {
        // Already loaded
        OneSignal = window.OneSignal;
      } else if (window.OneSignalDeferred) {
        // Wait for deferred initialization
        OneSignal = await new Promise<any>((resolve) => {
          window.OneSignalDeferred!.push((instance: any) => {
            resolve(instance);
          });
        });
      } else {
        // Poll for OneSignal to load (fallback)
        OneSignal = await new Promise<any>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (window.OneSignal) {
              clearInterval(checkInterval);
              resolve(window.OneSignal);
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('OneSignal failed to load'));
          }, 10000);
        });
      }

      if (!OneSignal) {
        console.error('OneSignal is not available');
        alert('OneSignal is not loaded. Please refresh the page and try again.');
        setIsSubscribing(false);
        return;
      }

      console.log('OneSignal instance:', OneSignal);

      try {
        // Try using Slidedown first (recommended for v16)
        if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === 'function') {
          console.log('Using Slidedown.promptPush');
          await OneSignal.Slidedown.promptPush();
        } else if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
          // Fallback: Request permission directly
          console.log('Using Notifications.requestPermission');
          const permission = await OneSignal.Notifications.requestPermission();
          if (permission === 'granted') {
            if (OneSignal.User?.PushSubscription?.optIn) {
              await OneSignal.User.PushSubscription.optIn();
            }
          }
        } else if (typeof OneSignal.registerForPushNotifications === 'function') {
          // Try legacy API method
          console.log('Using registerForPushNotifications');
          await OneSignal.registerForPushNotifications();
        } else if (typeof OneSignal.showSlidedownPrompt === 'function') {
          // Another fallback
          console.log('Using showSlidedownPrompt');
          await OneSignal.showSlidedownPrompt();
        } else {
          console.error('OneSignal API methods:', Object.keys(OneSignal));
          throw new Error('OneSignal subscription methods not available. Available methods: ' + Object.keys(OneSignal).join(', '));
        }

        // Wait a moment for subscription to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Wait a moment for subscription to complete
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check subscription status using multiple possible API structures
        let isOptedIn = false;
        let playerId: string | null = null;

        if (OneSignal.User?.PushSubscription) {
          isOptedIn = OneSignal.User.PushSubscription.optedIn ?? false;
          playerId = OneSignal.User.PushSubscription.id ?? null;
          console.log('Using User.PushSubscription - optedIn:', isOptedIn, 'id:', playerId);
        } else if (typeof OneSignal.isPushNotificationsEnabled === 'function') {
          try {
            isOptedIn = await OneSignal.isPushNotificationsEnabled();
            console.log('Using isPushNotificationsEnabled - optedIn:', isOptedIn);
            if (typeof OneSignal.getUserId === 'function') {
              playerId = await OneSignal.getUserId();
              console.log('Using getUserId - id:', playerId);
            }
          } catch (err) {
            console.warn('isPushNotificationsEnabled failed:', err);
          }
        } else if (OneSignal.getNotificationPermission) {
          const permission = OneSignal.getNotificationPermission();
          isOptedIn = permission === 'granted';
          console.log('Using getNotificationPermission - permission:', permission);
        } else {
          // Check browser permission directly
          if ('Notification' in window) {
            const permission = Notification.permission;
            isOptedIn = permission === 'granted';
            console.log('Using browser Notification.permission - permission:', permission);
          }
        }

        setIsSubscribed(isOptedIn);
        
        if (isOptedIn) {
          console.log('Successfully subscribed to OneSignal notifications');
          
          // Get the player ID and send it to the backend
          if (playerId) {
            try {
              const token = getStoredToken();
              if (token) {
                await apiFetch(ENDPOINTS.profile.updateOneSignalPlayerId, {
                  method: 'POST',
                  token,
                  body: {
                    onesignal_player_id: playerId,
                  },
                });
                console.log('OneSignal player ID saved to backend:', playerId);
              }
            } catch (err) {
              console.error('Failed to save OneSignal player ID:', err);
              // Don't fail the subscription if saving player ID fails
            }
          } else {
            console.warn('OneSignal player ID not available yet - will retry on next check');
            // Retry getting player ID after a delay
            setTimeout(async () => {
              try {
                const OneSignal = window.OneSignal as any;
                const retryPlayerId = OneSignal?.User?.PushSubscription?.id || 
                                    (typeof OneSignal.getUserId === 'function' ? await OneSignal.getUserId() : null);
                if (retryPlayerId) {
                  const token = getStoredToken();
                  if (token) {
                    await apiFetch(ENDPOINTS.profile.updateOneSignalPlayerId, {
                      method: 'POST',
                      token,
                      body: { onesignal_player_id: retryPlayerId },
                    });
                  }
                }
              } catch (err) {
                console.error('Retry failed to save player ID:', err);
              }
            }, 3000);
          }
        } else {
          console.log('User declined OneSignal notifications');
        }
      } catch (err: any) {
        // Handle IndexedDB errors gracefully
        if (err?.name === 'UnknownError' || err?.message?.includes('indexedDB') || err?.message?.includes('backing store')) {
          console.error('IndexedDB error (browser storage issue):', err);
          alert('Unable to enable notifications due to browser storage restrictions. Please:\n1. Clear your browser cache\n2. Check browser settings allow storage\n3. Try a different browser or incognito mode');
        } else {
          console.error('Failed to subscribe to notifications:', err);
          alert('Failed to enable notifications: ' + (err?.message || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error('Failed to subscribe to notifications:', err);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle PushAlert subscription
  const handlePushAlertSubscribe = async () => {
    try {
      setIsPushAlertSubscribing(true);
      
      // Wait for PushAlert to load
      let pushAlertReady = false;
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (!pushAlertReady && attempts < maxAttempts) {
        if (window.PushAlert) {
          pushAlertReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.PushAlert) {
        console.error('PushAlert is not available');
        alert('PushAlert is not loaded. Please refresh the page and try again.');
        setIsPushAlertSubscribing(false);
        return;
      }

      const PushAlert = window.PushAlert as any;
      console.log('PushAlert instance:', PushAlert);

      try {
        // Check if PushAlert has subscription methods
        if (typeof PushAlert.subscribe === 'function') {
          // Use the subscribe method
          await PushAlert.subscribe();
          setIsPushAlertSubscribed(true);
          console.log('Successfully subscribed to PushAlert notifications');
        } else if (typeof PushAlert.requestPermission === 'function') {
          // Request permission directly
          const permission = await PushAlert.requestPermission();
          if (permission === 'granted' || permission === true) {
            setIsPushAlertSubscribed(true);
            console.log('Successfully subscribed to PushAlert notifications');
          } else {
            console.log('User declined PushAlert notifications');
          }
        } else if (typeof PushAlert.prompt === 'function') {
          // Use prompt method
          PushAlert.prompt();
          // Check subscription status after a delay
          setTimeout(() => {
            if (PushAlert.isSubscribed && PushAlert.isSubscribed()) {
              setIsPushAlertSubscribed(true);
            }
          }, 2000);
        } else {
          // Try to trigger subscription via custom event or direct API
          console.log('PushAlert methods available:', Object.keys(PushAlert));
          
          // Try browser Notification API as fallback
          if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              setIsPushAlertSubscribed(true);
              console.log('Browser notification permission granted');
            }
          } else if (Notification.permission === 'granted') {
            setIsPushAlertSubscribed(true);
            console.log('Already have browser notification permission');
          } else {
            throw new Error('PushAlert subscription methods not available');
          }
        }
      } catch (err: any) {
        console.error('Failed to subscribe to PushAlert:', err);
        alert('Failed to enable PushAlert notifications: ' + (err?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to subscribe to PushAlert notifications:', err);
      alert('Failed to enable PushAlert notifications. Please try again.');
    } finally {
      setIsPushAlertSubscribing(false);
    }
  };

  // Check PushAlert subscription status on mount
  useEffect(() => {
    const checkPushAlertSubscription = () => {
      if (window.PushAlert) {
        const PushAlert = window.PushAlert as any;
        if (typeof PushAlert.isSubscribed === 'function') {
          const isSubscribed = PushAlert.isSubscribed();
          setIsPushAlertSubscribed(isSubscribed);
        } else if (Notification.permission === 'granted') {
          // Fallback: check browser permission
          setIsPushAlertSubscribed(true);
        }
      }
    };

    // Check immediately
    checkPushAlertSubscription();

    // Also check after a delay in case PushAlert loads later
    const timeout = setTimeout(checkPushAlertSubscription, 2000);
    return () => clearTimeout(timeout);
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

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const token = getStoredToken();
      if (!token) return;

      const response = await apiFetch<{ messages: Message[] }>(ENDPOINTS.conversations.messages(conversationId), { token });
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (selectedChat) {
        onChatToggle?.(false);
        setIsEscrowActive(false);
        setShowActionMenu(false);
      }
    };
  }, [selectedChat, onChatToggle]);

  const handleDecline = async (id: string) => {
    try {
      const token = getStoredToken();
      if (!token) return;

      await apiFetch(ENDPOINTS.messageRequests.respond(id), {
        method: 'POST',
        token,
        body: { decision: 'decline' },
      });

      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to decline request:', err);
      alert('Failed to decline request. Please try again.');
    }
  };

  const handleAccept = (request: MatchRequest) => {
    setAcceptingRequestId(request.id);
  };

  const confirmAccept = async (request: MatchRequest) => {
    try {
      const token = getStoredToken();
      if (!token) return;

      const response = await apiFetch<{ data: { conversation?: { id: string } } }>(ENDPOINTS.messageRequests.respond(request.id), {
        method: 'POST',
        token,
        body: { decision: 'accept' },
      });

      // Refresh conversations to show the new one
      await fetchConversations();

      // Remove from requests
      setRequests(prev => prev.filter(r => r.id !== request.id));
      setAcceptingRequestId(null);
      setReplyMessage("");
      setActiveTab('chats');

      // If a conversation was created, open it
      if (response.data?.conversation?.id) {
        const newChat = chats.find(c => c.id === response.data.conversation?.id) || chats[0];
        if (newChat) {
          openChat(newChat);
        }
      }
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert('Failed to accept request. Please try again.');
      setAcceptingRequestId(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      const token = getStoredToken();
      if (!token) return;

      const response = await apiFetch<{ message: Message }>(ENDPOINTS.messages.create, {
        method: 'POST',
        token,
        body: {
          conversation_id: selectedChat.conversation_id,
          message_text: newMessage.trim(),
        },
      });

      if (response.message) {
        // Add new message to local state
        setMessages(prev => [...prev, response.message!]);
        setNewMessage("");

        // Update chat's last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? {
                ...chat,
                last_message: {
                  id: response.message!.id,
                  message_text: response.message!.message_text,
                  sender_id: response.message!.sender_id,
                  created_at: response.message!.created_at,
                },
                updated_at: response.message!.created_at,
              }
            : chat
        ));
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const openChat = async (chat: ChatMessage) => {
    setSelectedChat(chat);
    onChatToggle?.(true);
    await fetchMessages(chat.conversation_id);
  };

  const closeChat = () => {
    setSelectedChat(null);
    onChatToggle?.(false);
    setIsEscrowActive(false);
    setShowActionMenu(false);
    setIsCheckingOut(false);
    setMessages([]);
  };

  // Get listing info for the selected chat (from matches endpoint)
  const [chatListingInfo, setChatListingInfo] = useState<{ title: string; image?: string; price?: string } | null>(null);

  useEffect(() => {
    if (selectedChat) {
      // Fetch matches for this conversation to get listing info
      const fetchMatches = async () => {
        try {
          const token = getStoredToken();
          if (!token) return;

          const response = await apiFetch<{ matches: any[] }>(ENDPOINTS.conversations.matches(selectedChat.conversation_id), { token });
          if (response.matches && response.matches.length > 0) {
            const match = response.matches[0];
            const listing = match.my_listing || match.my_item || match.listing1;
            if (listing) {
              setChatListingInfo({
                title: listing.title || 'Unknown Listing',
                image: listing.photos?.[0] || listing.photo || null,
                price: listing.price ? `₦${Number(listing.price).toLocaleString()}` : undefined,
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch matches:', err);
        }
      };
      fetchMatches();
    }
  }, [selectedChat]);

  if (selectedChat) {
    const isMe = (senderId: string) => senderId === currentUserId.current;
    const otherUser = selectedChat.other_user;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={subtleTransition}
        className="fixed inset-0 bg-white z-[300] flex flex-col"
      >
        {/* Chat Header */}
        <header className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-neutral-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={closeChat}
              className="p-2 -ml-1 text-[#830e4c] active:scale-95 transition-all"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={otherUser.profile_photo || `https://i.pravatar.cc/150?u=${otherUser.id}`} 
                  className="w-10 h-10 rounded-full object-cover border border-neutral-100"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://i.pravatar.cc/150?u=${otherUser.id}`;
                  }}
                />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-neutral-900 tracking-tight leading-none">
                  {otherUser.name || otherUser.username}
                </h3>
                <span className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">
                  Active recently
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 relative" ref={menuRef}>
            <button className="p-2 text-neutral-400 hover:text-[#830e4c] transition-colors active:scale-90">
              <Phone size={20} />
            </button>
            <button 
              onClick={() => setShowActionMenu(!showActionMenu)}
              className={`p-2 transition-all active:scale-90 ${showActionMenu ? 'text-[#830e4c]' : 'text-neutral-400 hover:text-[#830e4c]'}`}
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {showActionMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-white border border-neutral-100 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                >
                  <button 
                    onClick={() => {
                      setIsEscrowActive(!isEscrowActive);
                      setShowActionMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${isEscrowActive ? 'bg-[#830e4c] border-[#830e4c] text-white shadow-lg' : 'bg-white border-neutral-50 hover:border-[#830e4c33] text-neutral-700 active:scale-95'}`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${isEscrowActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                      <ShieldCheck size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className={`text-[11px] font-black uppercase tracking-widest leading-none ${isEscrowActive ? 'text-white' : 'text-neutral-900'}`}>
                        {isEscrowActive ? 'Escrow Enabled' : 'Use Escrow'}
                      </span>
                      <span className={`text-[8px] font-bold mt-1 uppercase tracking-wider ${isEscrowActive ? 'text-white/40' : 'text-neutral-400'}`}>Secure Protection</span>
                    </div>
                    {isEscrowActive ? (
                      <Check size={14} className="ml-auto text-white" strokeWidth={4} />
                    ) : (
                      <ChevronRight size={14} className="ml-auto text-neutral-200" />
                    )}
                  </button>
                  <div className="h-px bg-neutral-50 my-1 mx-2" />
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-rose-500 transition-all active:scale-95">
                    <div className="p-1.5 rounded-lg bg-rose-100/50 text-rose-500">
                      <ShieldAlert size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Report Deal</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Item Context Banner */}
        {chatListingInfo && (
          <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-b border-neutral-100">
            <div className="flex items-center gap-3">
              {chatListingInfo.image && (
                <img 
                  src={chatListingInfo.image} 
                  className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Regarding Item</span>
                <span className="text-xs font-bold text-[#830e4c] truncate max-w-[150px]">{chatListingInfo.title}</span>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-white border border-[#830e4c]/20 rounded-full text-[9px] font-black uppercase tracking-widest text-[#830e4c] shadow-sm active:scale-95 transition-all">
              View Post
            </button>
          </div>
        )}

        {/* Escrow Protected Banner */}
        <AnimatePresence>
          {isEscrowActive && chatListingInfo?.price && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border-b border-[#830e4c33]"
            >
              <div className="p-4">
                <div 
                  onClick={() => setIsCheckingOut(true)}
                  className="bg-[#830e4c] rounded-[1.5rem] p-4 flex items-center justify-between shadow-lg shadow-[#830e4c1a] cursor-pointer active:scale-[0.98] transition-all hover:bg-[#931e5c]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Lock size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Complete Secure Purchase</h4>
                      <p className="text-[9px] font-bold text-white/50 mt-1.5 uppercase tracking-wider">Tap to checkout using Escrow</p>
                    </div>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl text-white">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-5 bg-white no-scrollbar"
        >
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-[#830e4c] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <span className="px-4 py-1.5 bg-[#830e4c1a] rounded-full text-[9px] font-black text-[#830e4c] uppercase tracking-[0.2em]">
                  Deal Conversation
                </span>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const senderIsMe = isMe(msg.sender_id);
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={subtleTransition}
                      className={`flex ${senderIsMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col max-w-[82%] gap-1">
                        <div className={`px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm border ${
                          senderIsMe 
                            ? 'bg-[#830e4c] text-white border-[#830e4c] rounded-br-none' 
                            : 'bg-neutral-50 text-neutral-900 border-neutral-100 rounded-bl-none'
                        }`}>
                          {msg.message_text}
                        </div>
                        <div className={`flex items-center gap-1.5 px-1 ${senderIsMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">
                            {formatTime(msg.created_at)}
                          </span>
                          {senderIsMe && (
                            <CheckCheck size={10} className="text-[#830e4c]" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {messages.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <p className="text-sm font-medium text-neutral-400">No messages yet. Start the conversation!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Checkout Modal / Overlay */}
        <AnimatePresence>
          {isCheckingOut && chatListingInfo?.price && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCheckingOut(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[400]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[410] p-6 pb-12 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-8" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#830e4c1a] flex items-center justify-center text-[#830e4c]">
                    <ShoppingBag size={32} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900 tracking-tighter uppercase leading-none">Checkout Securely</h3>
                    <p className="text-xs font-bold text-[#830e4c] mt-2 uppercase tracking-widest">Protected by Nyem Escrow</p>
                  </div>
                </div>

                <div className="space-y-4 bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100 mb-8">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                    <span className="text-sm font-black text-neutral-400 uppercase tracking-widest">Item Price</span>
                    <span className="text-base font-black text-neutral-900">{chatListingInfo.price}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                    <span className="text-sm font-black text-neutral-400 uppercase tracking-widest">Escrow Fee</span>
                    <span className="text-base font-black text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-black text-neutral-900 uppercase tracking-widest">Total Payable</span>
                    <span className="text-2xl font-black text-[#830e4c]">{chatListingInfo.price}</span>
                  </div>
                </div>

                <button className="w-full bg-[#830e4c] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Lock size={16} strokeWidth={2.5} />
                  Confirm & Pay Securely
                </button>
                <button 
                  onClick={() => setIsCheckingOut(false)}
                  className="w-full py-4 text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mt-2"
                >
                  Go Back to Chat
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="shrink-0 p-4 pb-10 bg-white border-t border-neutral-50">
          <div className="flex items-center gap-2 bg-neutral-50 p-1.5 rounded-[2rem] border border-neutral-100 focus-within:border-[#830e4c]/30 focus-within:bg-white transition-all">
            <button className="p-2.5 text-neutral-400 hover:text-[#830e4c] active:scale-95 transition-all">
              <Paperclip size={18} />
            </button>
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Message..."
              disabled={sendingMessage}
              className="flex-1 bg-transparent border-none py-2 text-sm font-medium text-neutral-900 focus:ring-0 focus:outline-none placeholder:text-neutral-300 disabled:opacity-50"
            />
            <button className="p-2.5 text-neutral-400 hover:text-[#830e4c] active:scale-95 transition-all">
              <Smile size={18} />
            </button>
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className={`p-2.5 rounded-full transition-all active:scale-95 ${
                newMessage.trim() && !sendingMessage
                  ? 'bg-[#830e4c] text-white shadow-lg' 
                  : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
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

      {/* OneSignal Subscribe Button */}
      <div className="px-4 mb-3">
        <button
          onClick={handleSubscribeToNotifications}
          disabled={isSubscribing || isSubscribed}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isSubscribed
              ? 'bg-emerald-500 text-white shadow-lg cursor-not-allowed'
              : isSubscribing
              ? 'bg-neutral-300 text-neutral-500 cursor-wait'
              : 'bg-[#830e4c] text-white shadow-lg active:scale-95 hover:bg-[#931e5c]'
          }`}
        >
          <Bell size={18} strokeWidth={2.5} />
          {isSubscribed ? 'Subscribed (OneSignal)' : isSubscribing ? 'Subscribing...' : 'Subscribe (OneSignal)'}
          {isSubscribed && <Check size={16} strokeWidth={3} />}
        </button>
      </div>

      {/* PushAlert Subscribe Button */}
      <div className="px-4 mb-4">
        <button
          onClick={handlePushAlertSubscribe}
          disabled={isPushAlertSubscribing || isPushAlertSubscribed}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isPushAlertSubscribed
              ? 'bg-blue-500 text-white shadow-lg cursor-not-allowed'
              : isPushAlertSubscribing
              ? 'bg-neutral-300 text-neutral-500 cursor-wait'
              : 'bg-blue-600 text-white shadow-lg active:scale-95 hover:bg-blue-700'
          }`}
        >
          <Bell size={18} strokeWidth={2.5} />
          {isPushAlertSubscribed ? 'Subscribed (PushAlert)' : isPushAlertSubscribing ? 'Subscribing...' : 'Subscribe (PushAlert)'}
          {isPushAlertSubscribed && <Check size={16} strokeWidth={3} />}
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
              <motion.div 
                key="chats-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={subtleTransition}
                className="space-y-1"
              >
                {chats.map((chat) => {
                  const otherUser = chat.other_user;
                  const lastMessageIsFromMe = chat.last_message && chat.last_message.sender_id === currentUserId.current;
                  const unreadCount = 0; // TODO: Calculate unread count from messages

                  return (
                    <motion.div 
                      layout
                      key={chat.id} 
                  onClick={() => openChat(chat)}
                  className="flex items-center gap-4 p-4 hover:bg-[#830e4c1a]/20 rounded-[2rem] transition-colors cursor-pointer group"
                    >
                      <div className="relative flex-shrink-0">
                        <img 
                          src={otherUser.profile_photo || `https://i.pravatar.cc/150?u=${otherUser.id}`} 
                          className="w-16 h-16 rounded-[1.5rem] object-cover border border-neutral-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://i.pravatar.cc/150?u=${otherUser.id}`;
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-base font-black text-neutral-900 truncate tracking-tight">
                            {otherUser.name || otherUser.username}
                          </h4>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${unreadCount > 0 ? 'text-[#830e4c]' : 'text-neutral-300'}`}>
                            {chat.updated_at ? formatRelativeTime(chat.updated_at) : 'Recently'}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className={`text-sm line-clamp-1 pr-4 ${unreadCount > 0 ? 'text-neutral-900 font-bold' : 'text-neutral-400 font-medium'}`}>
                            {chat.last_message?.message_text || 'No messages yet'}
                          </p>
                          {unreadCount > 0 ? (
                            <span className="bg-[#830e4c] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 border-2 border-white shadow-sm">
                              {unreadCount}
                            </span>
                          ) : (
                            <CheckCheck size={14} className="text-neutral-200 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {chats.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare size={24} className="text-neutral-200" />
                    </div>
                    <h4 className="text-sm font-black text-neutral-900 uppercase">No active chats</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Accept requests to start a deal</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="requests-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={subtleTransition}
                className="space-y-4"
              >
                {requests.map((request) => {
                  const listing = request.listing || request.item;
                  const fromUser = request.from_user;

                  return (
                    <motion.div 
                      layout
                      key={request.id} 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={subtleTransition}
                      className={`bg-white border rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm transition-all ${acceptingRequestId === request.id ? 'border-[#830e4c] ring-4 ring-[#830e4c1a]' : 'border-neutral-100'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={fromUser.photo || `https://i.pravatar.cc/150?u=${fromUser.id}`} 
                            className="w-14 h-14 rounded-2xl object-cover border border-neutral-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://i.pravatar.cc/150?u=${fromUser.id}`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-neutral-900 truncate tracking-tight">
                              {fromUser.name || fromUser.username}
                            </h4>
                            <span className="text-[10px] font-bold text-neutral-300 tracking-widest uppercase">
                              {formatRelativeTime(request.created_at)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-neutral-400 truncate">
                            Wants your <span className="font-bold text-neutral-800">{listing?.title || 'Listing'}</span>
                          </p>
                        </div>
                        {listing?.photo && (
                          <img 
                            src={listing.photo} 
                            className="w-14 h-14 rounded-2xl object-cover border border-neutral-50 grayscale-[0.3]"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {request.message_text && (
                        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 italic text-xs text-neutral-600 font-medium leading-relaxed">
                          "{request.message_text}"
                        </div>
                      )}

                      <AnimatePresence>
                        {acceptingRequestId === request.id ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={subtleTransition}
                            className="space-y-3 pt-1"
                          >
                            <div className="relative">
                              <textarea 
                                autoFocus
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Add a friendly reply..."
                                className="w-full bg-white border border-neutral-200 rounded-2xl px-4 py-4 text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all resize-none min-h-[110px] placeholder:text-neutral-300"
                              />
                              <button 
                                onClick={() => confirmAccept(request)}
                                className="absolute bottom-3 right-3 p-3 bg-[#830e4c] text-white rounded-xl shadow-lg active:scale-95 transition-all"
                              >
                                <Send size={18} />
                              </button>
                            </div>
                            <button 
                              onClick={() => setAcceptingRequestId(null)}
                              className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-[#830e4c] transition-colors"
                            >
                              Cancel
                            </button>
                          </motion.div>
                        ) : (
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleDecline(request.id)}
                              className="flex-1 bg-white hover:bg-rose-50 hover:text-rose-500 text-neutral-400 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-neutral-100 hover:border-rose-100"
                            >
                              <X size={16} strokeWidth={3} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Decline</span>
                            </button>
                            <button 
                              onClick={() => handleAccept(request)}
                              className="flex-[2] bg-[#830e4c] text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border border-[#830e4c]"
                            >
                              <Check size={16} strokeWidth={3} className="text-white/60" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Accept Request</span>
                            </button>
                          </div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {requests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                      <Heart size={24} className="text-neutral-200" />
                    </div>
                    <h4 className="text-sm font-black text-neutral-900 uppercase">Inbox Clean</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">No new interest at the moment</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

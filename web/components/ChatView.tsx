import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MoreVertical, Lock, ChevronRight, Check, ShieldCheck, ShieldAlert, Paperclip, Smile, Send, CheckCheck, ShoppingBag } from 'lucide-react';
import { apiFetch, getStoredToken } from '../utils/api';
import { useMessages, useSendMessage } from '../hooks/api/useMatches';
import { useConversationListing } from '../hooks/api/useConversationListing';
import { useCreateEscrow } from '../hooks/api/useEscrow';
import { ENDPOINTS } from '../constants/endpoints';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

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
  listing_context?: {
    id: string;
    title: string;
    photo?: string;
    price?: number;
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

interface ChatViewProps {
  chat: ChatMessage;
  currentUserId: string | null;
  onClose: () => void;
  onChatToggle?: (isOpen: boolean) => void;
}

/**
 * Format timestamp to time string (e.g., "10:30 AM")
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  currentUserId,
  onClose,
  onChatToggle
}) => {
  // React Query hooks for messages
  const {
    data: messages = [],
    isLoading: loadingMessages,
    refetch: refetchMessages
  } = useMessages(chat.conversation_id);

  const sendMessageMutation = useSendMessage();
  const createEscrowMutation = useCreateEscrow();

  const [newMessage, setNewMessage] = useState("");
  const [isEscrowActive, setIsEscrowActive] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [escrowCreating, setEscrowCreating] = useState(false);
  const [chatListingInfo, setChatListingInfo] = useState<{ title: string; image?: string; price?: string; priceValue?: number; sellerId?: string | number } | null>(null);

  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useWebSocket();
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  }, []);

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!chat.conversation_id) return;

    console.log('[ChatView] Subscribing to conversation:', chat.conversation_id);

    const unsubscribe = subscribe(`conversation.${chat.conversation_id}`, (newMessage: any) => {
      console.log(`[ChatView] WebSocket Callback Triggered for: conversation.${chat.conversation_id}`);
      console.log('[ChatView] Message:', newMessage);

      // Update React Query cache
      queryClient.setQueryData(['messages', chat.conversation_id], (oldData: any[] | undefined) => {
        const messages = Array.isArray(oldData) ? oldData : [];

        // Use message_id or id for duplicate check
        const isDuplicate = messages.some((m: any) =>
          (m.id && m.id === newMessage.id) ||
          (m.message_id && m.message_id === newMessage.id)
        );

        if (isDuplicate) {
          console.log('[ChatView] Duplicate message ignored');
          return messages;
        }

        console.log('[ChatView] Adding new message to state');
        return [...messages, newMessage];
      });

      // Play sound if message is from the other user
      if (String(newMessage.sender_id) !== String(currentUserId)) {
        notificationSound.current?.play().catch(e => console.warn('Sound play failed:', e));
      }
    });

    return () => {
      console.log('[ChatView] Unsubscribing from conversation:', chat.conversation_id);
      unsubscribe();
    };
  }, [chat.conversation_id, subscribe, queryClient, currentUserId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMe = (senderId: string) => senderId === currentUserId;
  const otherUser = chat.other_user;

  // Determine if current user is buyer or seller
  // Buyer: current user is NOT the listing owner
  // Seller: current user IS the listing owner
  const isSeller = chatListingInfo?.sellerId && String(currentUserId) === String(chatListingInfo.sellerId);
  const isBuyer = chatListingInfo?.sellerId && String(currentUserId) !== String(chatListingInfo.sellerId);


  useEffect(() => {
    refetchMessages();
  }, [chat.conversation_id]);

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

  // Fetch listing context for this conversation
  const { data: conversationListing } = useConversationListing(chat.conversation_id);

  // Set listing info from conversation data or fetched listing
  useEffect(() => {
    console.log('=== ChatView Listing Debug ===');
    console.log('chat.listing_context:', chat.listing_context);
    console.log('conversationListing:', conversationListing);
    console.log('Current chatListingInfo:', chatListingInfo);

    const listingData = chat.listing_context || conversationListing;

    if (listingData) {
      const newInfo = {
        title: listingData.title || 'Unknown Listing',
        image: listingData.photo || null,
        price: listingData.price ? `₦${Number(listingData.price).toLocaleString()}` : undefined,
        priceValue: listingData.price ? Number(listingData.price) : undefined,
        sellerId: listingData.user?.id || listingData.user_id || otherUser.id,
      };
      console.log('Setting new listing info:', newInfo);
      setChatListingInfo(newInfo);
    } else {
      console.log('No listing data available');
    }
    console.log('=== End Debug ===');
  }, [chat.listing_context, conversationListing]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: chat.conversation_id,
        message_text: newMessage.trim(),
        receiver_id: otherUser.id
      });
      setNewMessage("");
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Failed to send message. Please try again.');
    }
  };

  const sendingMessage = sendMessageMutation.isPending;

  const handleClose = () => {
    setIsEscrowActive(false);
    setShowActionMenu(false);
    setIsCheckingOut(false);
    onClose();
  };

  const handleEscrowCheckout = async () => {
    if (!chatListingInfo?.priceValue) {
      alert('Price information not available');
      return;
    }

    setEscrowCreating(true);
    try {
      // Create escrow transaction
      const escrowData = await createEscrowMutation.mutateAsync({
        seller_id: chatListingInfo.sellerId || otherUser.id,
        amount: chatListingInfo.priceValue,
        description: `Purchase of ${chatListingInfo.title}`,
      });

      console.log('Escrow created:', escrowData);

      // Get user email from stored user data
      const storedUser = localStorage.getItem('auth_user');
      const userEmail = storedUser ? JSON.parse(storedUser).email : 'buyer@nyem.com';

      // Initialize Paystack payment
      const paymentData = {
        email: userEmail,
        amount: chatListingInfo.priceValue * 100, // Paystack expects amount in kobo (smallest currency unit)
        currency: 'NGN',
        reference: escrowData.id || `escrow_${Date.now()}`,
        metadata: {
          escrow_id: escrowData.id,
          seller_id: chatListingInfo.sellerId || otherUser.id,
          listing_title: chatListingInfo.title,
        },
      };

      // Get Paystack public key from environment
      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

      // Open Paystack payment in new tab
      const paystackUrl = `https://checkout.paystack.com/pay?` + new URLSearchParams({
        email: paymentData.email,
        amount: paymentData.amount.toString(),
        currency: paymentData.currency,
        reference: paymentData.reference,
        publicKey: paystackPublicKey,
      }).toString();

      // Open in new tab
      const paymentWindow = window.open(paystackUrl, '_blank');

      if (paymentWindow) {
        // Show success message
        alert(`Escrow created! Complete payment in the new tab to secure your purchase.`);
      } else {
        // Popup blocked
        alert(`Escrow created! Please allow popups to complete payment. Reference: ${paymentData.reference}`);
      }

      setIsCheckingOut(false);
    } catch (err: any) {
      console.error('Failed to create escrow:', err);
      alert(err.message || 'Failed to initiate secure checkout. Please try again.');
    } finally {
      setEscrowCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={subtleTransition}
      className="fixed inset-0 bg-white z-[300] flex flex-col"
    >
      {/* Chat Header */}
      <header className="shrink-0 bg-white border-b border-neutral-100 px-4 flex items-center justify-between" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: '16px' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
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
                {/* Only show escrow toggle for sellers */}
                {isSeller && (
                  <>
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
                  </>
                )}
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
        <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-neutral-50 shadow-[0_4px_12px_rgba(0,0,0,0,02)] z-[5]">
          <div className="flex items-center gap-4">
            {chatListingInfo.image && (
              <img
                src={chatListingInfo.image}
                className="w-12 h-12 rounded-[14px] object-cover border border-neutral-100 shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.1em]">Regarding Item</span>
              <span className="text-[14px] font-black text-[#830e4c] truncate max-w-[180px] tracking-tight leading-tight">{chatListingInfo.title}</span>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-white border border-neutral-100 rounded-full text-[10px] font-black uppercase tracking-widest text-[#830e4c] shadow-sm active:scale-95 transition-all">
            View Post
          </button>
        </div>
      )}

      {/* Escrow Protected Banner - Only show for buyers when seller has enabled escrow */}
      <AnimatePresence>
        {isEscrowActive && isBuyer && chatListingInfo?.price && (
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
            <div className="flex justify-center mb-8 mt-4">
              <span className="px-8 py-2.5 bg-[#830e4c0d] rounded-full text-[10px] font-black text-[#830e4c] uppercase tracking-[0.15em] shadow-sm border border-[#830e4c10]">
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
                      <div className={`px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm border ${senderIsMe
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

              <button
                onClick={handleEscrowCheckout}
                disabled={escrowCreating}
                className="w-full bg-[#830e4c] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {escrowCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Escrow...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} strokeWidth={2.5} />
                    Confirm & Pay Securely
                  </>
                )}
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
            className={`p-2.5 rounded-full transition-all active:scale-95 ${newMessage.trim() && !sendingMessage
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
};


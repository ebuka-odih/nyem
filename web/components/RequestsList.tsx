import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Check, Send } from 'lucide-react';
import { useRespondToRequest, useRespondToTrade } from '../hooks/api/useMatches';
import { ArrowLeftRight, MessageSquare } from 'lucide-react';

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

interface TradeOffer {
  id: string;
  from_user: {
    id: string;
    username: string;
    name?: string;
    photo?: string;
    city?: string;
  };
  target_item: {
    id: string;
    title: string;
    photo?: string;
  };
  offered_item: {
    id: string;
    title: string;
    photo?: string;
  };
  status: string;
  created_at: string;
}

interface RequestsListProps {
  requests: any[];
  tradeOffers: TradeOffer[];
  onRequestAccepted: () => void;
  onRequestDeclined?: (requestId: string) => void;
  onChatOpen?: (chatId: string) => void;
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

export const RequestsList: React.FC<RequestsListProps> = ({
  requests,
  tradeOffers,
  onRequestAccepted,
  onRequestDeclined,
  onChatOpen
}) => {
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const respondRequestMutation = useRespondToRequest();
  const respondTradeMutation = useRespondToTrade();

  const handleDecline = async (id: string, type: 'request' | 'trade') => {
    try {
      if (type === 'request') {
        await respondRequestMutation.mutateAsync({ id, decision: 'decline' });
      } else {
        await respondTradeMutation.mutateAsync({ id, decision: 'decline' });
      }
      // Notify parent to remove from state immediately
      onRequestDeclined?.(id);
    } catch (err) {
      console.error('Failed to decline:', err);
      alert('Failed to decline. Please try again.');
    }
  };

  const confirmAccept = async (id: string, type: 'request' | 'trade') => {
    try {
      const response: any = type === 'request'
        ? await respondRequestMutation.mutateAsync({ id, decision: 'accept' })
        : await respondTradeMutation.mutateAsync({ id, decision: 'accept' });

      setAcceptingRequestId(null);
      setReplyMessage("");

      // If a conversation was created, open it
      if (response?.data?.conversation?.id || response?.conversation?.id) {
        const conversationId = response?.data?.conversation?.id || response?.conversation?.id;
        onChatOpen?.(conversationId);
      }

      // Notify parent to refresh
      onRequestAccepted();
    } catch (err) {
      console.error('Failed to accept:', err);
      alert('Failed to accept. Please try again.');
      setAcceptingRequestId(null);
    }
  };

  // Combine and sort by date
  const allRequests = [
    ...requests.map(r => ({ ...r, type: 'request' as const })),
    ...tradeOffers.map(t => ({ ...t, type: 'trade' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={subtleTransition}
      className="space-y-4"
    >
      {allRequests.map((item) => {
        const isTrade = item.type === 'trade';
        const fromUser = item.from_user;
        const targetListing = isTrade ? item.target_item : (item.listing || item.item);
        const offeredItem = isTrade ? item.offered_item : null;

        return (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={subtleTransition}
            className={`bg-white border rounded-[2rem] p-5 flex flex-col gap-4 shadow-sm transition-all ${acceptingRequestId === item.id ? 'border-[#830e4c] ring-4 ring-[#830e4c1a]' : 'border-neutral-100'}`}
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
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white ${isTrade ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                  {isTrade ? <ArrowLeftRight size={10} strokeWidth={3} /> : <MessageSquare size={10} strokeWidth={3} />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-neutral-900 truncate tracking-tight">
                    {fromUser.name || fromUser.username}
                  </h4>
                  <span className="text-[10px] font-bold text-neutral-300 tracking-widest uppercase">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
                <p className="text-xs font-medium text-neutral-400 truncate">
                  {isTrade ? 'Proposed a trade for your ' : 'Interested in your '}
                  <span className="font-bold text-neutral-800">{targetListing?.title || 'Listing'}</span>
                </p>
              </div>
              {targetListing?.photo && (
                <img
                  src={targetListing.photo}
                  className="w-14 h-14 rounded-2xl object-cover border border-neutral-50 grayscale-[0.3]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>

            {isTrade && offeredItem && (
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
                <img
                  src={offeredItem.photo}
                  className="w-12 h-12 rounded-xl object-cover border border-amber-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Offered Item</p>
                  <p className="text-sm font-bold text-neutral-900">{offeredItem.title}</p>
                </div>
              </div>
            )}

            {item.message_text && (
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 italic text-xs text-neutral-600 font-medium leading-relaxed">
                "{item.message_text}"
              </div>
            )}

            <AnimatePresence>
              {acceptingRequestId === item.id ? (
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
                      placeholder={isTrade ? "Accept this trade..." : "Add a friendly reply..."}
                      className="w-full bg-white border border-neutral-200 rounded-2xl px-4 py-4 text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all resize-none min-h-[110px] placeholder:text-neutral-300"
                    />
                    <button
                      onClick={() => confirmAccept(item.id, item.type)}
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
                    onClick={() => handleDecline(item.id, item.type)}
                    className="flex-1 bg-white hover:bg-rose-50 hover:text-rose-500 text-neutral-400 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-neutral-100 hover:border-rose-100"
                  >
                    <X size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Decline</span>
                  </button>
                  <button
                    onClick={() => setAcceptingRequestId(item.id)}
                    className={`flex-[2] text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border ${isTrade ? 'bg-amber-600 border-amber-600' : 'bg-[#830e4c] border-[#830e4c]'}`}
                  >
                    <Check size={16} strokeWidth={3} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isTrade ? 'Accept Trade' : 'Accept Request'}</span>
                  </button>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {allRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
            <Heart size={24} className="text-neutral-200" />
          </div>
          <h4 className="text-sm font-black text-neutral-900 uppercase">Inbox Clean</h4>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">No new requests or trade offers</p>
        </div>
      )}
    </motion.div>
  );
};


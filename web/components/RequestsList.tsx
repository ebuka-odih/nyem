import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Check, Send } from 'lucide-react';
import { useRespondToRequest } from '../hooks/api/useMatches';

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

interface RequestsListProps {
  requests: MatchRequest[];
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
  onRequestAccepted,
  onRequestDeclined,
  onChatOpen
}) => {
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const respondMutation = useRespondToRequest();

  const handleDecline = async (id: string) => {
    try {
      await respondMutation.mutateAsync({ id, decision: 'decline' });
      // Notify parent to remove from state immediately
      onRequestDeclined?.(id);
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
      const response: any = await respondMutation.mutateAsync({
        id: request.id,
        decision: 'accept'
      });

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
      console.error('Failed to accept request:', err);
      alert('Failed to accept request. Please try again.');
      setAcceptingRequestId(null);
    }
  };

  return (
    <motion.div
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
  );
};


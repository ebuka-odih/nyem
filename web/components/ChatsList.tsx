import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCheck } from 'lucide-react';

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
  updated_at: string;
}

interface ChatsListProps {
  chats: ChatMessage[];
  currentUserId: string | null;
  onChatClick: (chat: ChatMessage) => void;
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

export const ChatsList: React.FC<ChatsListProps> = ({ chats, currentUserId, onChatClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={subtleTransition}
      className="space-y-1"
    >
      {chats.map((chat) => {
        const otherUser = chat.other_user;
        const lastMessageIsFromMe = chat.last_message && chat.last_message.sender_id === currentUserId;
        const unreadCount = 0; // TODO: Calculate unread count from messages

        return (
          <motion.div 
            layout
            key={chat.id} 
            onClick={() => onChatClick(chat)}
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
  );
};


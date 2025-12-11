import React, { useRef, useEffect, useMemo } from 'react';

interface Message {
  id: number | string;
  sender: 'me' | 'other';
  text: string;
  time: string;
  date?: string; // ISO date string for grouping
}

interface MessageListProps {
  messages: Message[];
}

// Format date for display
const formatDateLabel = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }
};

// Group messages by date
const groupMessagesByDate = (messages: Message[]): Array<{ date: string; label: string; messages: Message[] }> => {
  const groups: Map<string, Message[]> = new Map();
  
  messages.forEach((msg) => {
    // Use the date from message or parse from time
    let dateKey: string;
    if (msg.date) {
      const d = new Date(msg.date);
      dateKey = d.toDateString();
    } else {
      // Try to parse from time if it's a full datetime
      const d = new Date(msg.time);
      if (!isNaN(d.getTime())) {
        dateKey = d.toDateString();
      } else {
        // Fallback to today if we can't parse
        dateKey = new Date().toDateString();
      }
    }
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  });
  
  // Convert to array and sort by date (oldest first)
  return Array.from(groups.entries())
    .map(([dateKey, msgs]) => ({
      date: dateKey,
      label: formatDateLabel(new Date(dateKey)),
      messages: msgs,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const lastMessageCount = useRef(0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    // On initial load, scroll to bottom immediately
    if (isInitialLoad.current && messages.length > 0) {
      isInitialLoad.current = false;
      lastMessageCount.current = messages.length;
      // Use auto scroll for initial load (faster)
      setTimeout(() => {
        scrollToBottom(false);
      }, 50);
      return;
    }

    // If new messages were added (count increased), scroll to bottom
    // This allows users to scroll up to read older messages without interruption
    if (messages.length > lastMessageCount.current) {
      lastMessageCount.current = messages.length;
      // Check if user is near bottom before auto-scrolling
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
        
        if (isNearBottom) {
          setTimeout(() => {
            scrollToBottom(true);
          }, 100);
        }
      }
    }
  }, [messages.length]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  // Show empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
      {groupedMessages.map((group) => (
        <React.Fragment key={group.date}>
          <div className="text-center">
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wide">
              {group.label}
            </span>
          </div>

          {group.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm text-sm relative group ${
                  msg.sender === 'me' 
                  ? 'bg-brand text-white rounded-br-none' 
                  : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                }`}
              >
                <p>{msg.text}</p>
                <span className={`text-[10px] mt-1 block text-right font-medium opacity-70 ${msg.sender === 'me' ? 'text-white/80' : 'text-gray-400'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};






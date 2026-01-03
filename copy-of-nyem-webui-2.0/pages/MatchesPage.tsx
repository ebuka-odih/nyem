import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Zap, ChevronRight, Search, MoreHorizontal, CheckCheck, X, Check, Star, Send, ArrowLeft, MoreVertical, Phone, Video, Paperclip, Smile, ShieldCheck, Lock, CreditCard, ShoppingBag, ShieldAlert } from 'lucide-react';

interface MatchRequest {
  id: string;
  userName: string;
  userAvatar: string;
  itemName: string;
  itemImage: string;
  time: string;
  isSuper: boolean;
  message?: string;
}

interface ChatMessage {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  itemImage: string;
  itemName: string;
  itemPrice: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

const MOCK_REQUESTS: MatchRequest[] = [
  {
    id: 'r1',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://i.pravatar.cc/150?u=sarah',
    itemName: 'Aura Minimalist Watch',
    itemImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200',
    time: '2m ago',
    isSuper: true,
    message: "Hey! I've been looking for this watch everywhere. Is it still available?"
  },
  {
    id: 'r2',
    userName: 'David Okoro',
    userAvatar: 'https://i.pravatar.cc/150?u=david',
    itemName: 'Sonic Pro Headphones',
    itemImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200',
    time: '1h ago',
    isSuper: false
  }
];

const MOCK_CHATS: ChatMessage[] = [
  {
    id: 'c1',
    userName: 'Tunde Afolayan',
    userAvatar: 'https://i.pravatar.cc/150?u=tunde',
    lastMessage: 'Is the price negotiable? I am very interested.',
    time: 'Just now',
    unreadCount: 2,
    isOnline: true,
    itemName: 'Kinesis Mech Keyboard',
    itemImage: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=200',
    itemPrice: '₦195,000'
  }
];

const MOCK_CONVERSATION: Message[] = [
  { id: '1', text: "Hi! I saw your post about the keyboard.", sender: 'them', time: '10:30 AM' },
  { id: '2', text: "Is it still available for sale?", sender: 'them', time: '10:30 AM' },
  { id: '3', text: "Hey Tunde! Yes it is. It's in perfect condition.", sender: 'me', time: '10:32 AM', status: 'read' },
  { id: '4', text: "Great! I'm really looking for those mechanical switches. Is the price negotiable?", sender: 'them', time: '10:35 AM' },
];

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

interface MatchesPageProps {
  onChatToggle?: (isOpen: boolean) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({ onChatToggle }) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'chats'>('chats');
  const [requests, setRequests] = useState<MatchRequest[]>(MOCK_REQUESTS);
  const [chats, setChats] = useState<ChatMessage[]>(MOCK_CHATS);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatMessage | null>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION);
  const [newMessage, setNewMessage] = useState("");
  const [isEscrowActive, setIsEscrowActive] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChat, isEscrowActive]);

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

  const handleDecline = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleAccept = (request: MatchRequest) => {
    setAcceptingRequestId(request.id);
  };

  const sendNativeNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon });
    }
  };

  const confirmAccept = (request: MatchRequest) => {
    const newChat: ChatMessage = {
      id: `c-${request.id}`,
      userName: request.userName,
      userAvatar: request.userAvatar,
      lastMessage: replyMessage || "Request accepted!",
      time: "Just now",
      unreadCount: 0,
      isOnline: true,
      itemName: request.itemName,
      itemImage: request.itemImage,
      itemPrice: '₦0.00' 
    };
    
    // Notify the simulated buyer that their request was approved
    sendNativeNotification(
      "Drop Accepted! ✅",
      `${request.userName} accepted your interest in "${request.itemName}". Go to inbox to chat!`,
      request.itemImage
    );

    setChats([newChat, ...chats]);
    setRequests(prev => prev.filter(r => r.id !== request.id));
    setAcceptingRequestId(null);
    setReplyMessage("");
    setActiveTab('chats');
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const openChat = (chat: ChatMessage) => {
    setSelectedChat(chat);
    onChatToggle?.(true);
  };

  const closeChat = () => {
    setSelectedChat(null);
    onChatToggle?.(false);
    setIsEscrowActive(false);
    setShowActionMenu(false);
    setIsCheckingOut(false);
  };

  if (selectedChat) {
    return (
      <MotionDiv 
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
                <img src={selectedChat.userAvatar} className="w-10 h-10 rounded-full object-cover border border-neutral-100" />
                {selectedChat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-neutral-900 tracking-tight leading-none">{selectedChat.userName}</h3>
                <span className="text-[10px] font-bold text-[#830e4c] mt-1 uppercase tracking-widest">
                  {selectedChat.isOnline ? 'Online now' : 'Active recently'}
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
                <MotionDiv 
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
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Item Context Banner */}
        <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <img src={selectedChat.itemImage} className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Regarding Item</span>
              <span className="text-xs font-bold text-[#830e4c] truncate max-w-[150px]">{selectedChat.itemName}</span>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-white border border-[#830e4c]/20 rounded-full text-[9px] font-black uppercase tracking-widest text-[#830e4c] shadow-sm active:scale-95 transition-all">
            View Post
          </button>
        </div>

        {/* Escrow Protected Banner */}
        <AnimatePresence>
          {isEscrowActive && (
            <MotionDiv 
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
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-5 bg-white no-scrollbar"
        >
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-[#830e4c1a] rounded-full text-[9px] font-black text-[#830e4c] uppercase tracking-[0.2em]">
              Deal Conversation
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MotionDiv 
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={subtleTransition}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[82%] gap-1">
                  <div className={`px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm border ${
                    msg.sender === 'me' 
                      ? 'bg-[#830e4c] text-white border-[#830e4c] rounded-br-none' 
                      : 'bg-neutral-50 text-neutral-900 border-neutral-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <div className={`flex items-center gap-1.5 px-1 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{msg.time}</span>
                    {msg.sender === 'me' && (
                      <CheckCheck size={10} className={msg.status === 'read' ? 'text-[#830e4c]' : 'text-neutral-200'} />
                    )}
                  </div>
                </div>
              </MotionDiv>
            ))}
          </AnimatePresence>
        </div>

        {/* Checkout Modal / Overlay */}
        <AnimatePresence>
          {isCheckingOut && (
            <>
              <MotionDiv 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCheckingOut(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[400]"
              />
              <MotionDiv 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                    <span className="text-base font-black text-neutral-900">{selectedChat.itemPrice}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                    <span className="text-sm font-black text-neutral-400 uppercase tracking-widest">Escrow Fee</span>
                    <span className="text-base font-black text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-black text-neutral-900 uppercase tracking-widest">Total Payable</span>
                    <span className="text-2xl font-black text-[#830e4c]">{selectedChat.itemPrice}</span>
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
              </MotionDiv>
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
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none py-2 text-sm font-medium text-neutral-900 focus:ring-0 focus:outline-none placeholder:text-neutral-300"
            />
            <button className="p-2.5 text-neutral-400 hover:text-[#830e4c] active:scale-95 transition-all">
              <Smile size={18} />
            </button>
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`p-2.5 rounded-full transition-all active:scale-95 ${
                newMessage.trim() 
                  ? 'bg-[#830e4c] text-white shadow-lg' 
                  : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv 
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

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'chats' ? (
            <MotionDiv 
              key="chats-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={subtleTransition}
              className="space-y-1"
            >
              {chats.map((chat) => (
                <MotionDiv 
                  layout
                  key={chat.id} 
                  onClick={() => openChat(chat)}
                  className="flex items-center gap-4 p-4 hover:bg-[#830e4c1a]/20 rounded-[2rem] transition-colors cursor-pointer group"
                >
                  <div className="relative flex-shrink-0">
                    <img src={chat.userAvatar} className="w-16 h-16 rounded-[1.5rem] object-cover border border-neutral-100" />
                    {chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-base font-black text-neutral-900 truncate tracking-tight">{chat.userName}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${chat.unreadCount > 0 ? 'text-[#830e4c]' : 'text-neutral-300'}`}>{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className={`text-sm line-clamp-1 pr-4 ${chat.unreadCount > 0 ? 'text-[#830e4c] font-black' : 'text-neutral-400 font-medium'}`}>
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 ? (
                        <span className="bg-[#830e4c] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 border-2 border-white shadow-sm">
                          {chat.unreadCount}
                        </span>
                      ) : (
                        <CheckCheck size={14} className="text-neutral-200 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <img src={chat.itemImage} className="w-9 h-9 rounded-lg object-cover grayscale opacity-30" />
                  </div>
                </MotionDiv>
              ))}

              {chats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={24} className="text-neutral-200" />
                  </div>
                  <h4 className="text-sm font-black text-neutral-900 uppercase">No active chats</h4>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Accept requests to start a deal</p>
                </div>
              )}
            </MotionDiv>
          ) : (
            <MotionDiv 
              key="requests-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={subtleTransition}
              className="space-y-4"
            >
              {requests.map((request) => (
                <MotionDiv 
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
                      <img src={request.userAvatar} className="w-14 h-14 rounded-2xl object-cover border border-neutral-100" />
                      {request.isSuper && (
                        <div className="absolute -top-1 -right-1 bg-[#830e4c] text-white p-1 rounded-lg shadow-md border-2 border-white">
                          <Star size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-neutral-900 truncate tracking-tight">{request.userName}</h4>
                        <span className="text-[10px] font-bold text-neutral-300 tracking-widest uppercase">{request.time}</span>
                      </div>
                      <p className="text-xs font-medium text-neutral-400 truncate">Wants your <span className="font-bold text-[#830e4c]">{request.itemName}</span></p>
                    </div>
                    <img src={request.itemImage} className="w-14 h-14 rounded-2xl object-cover border border-neutral-50 grayscale-[0.3]" />
                  </div>

                  {request.message && (
                    <div className="bg-[#830e4c1a] p-4 rounded-2xl border border-[#830e4c33] italic text-xs text-[#830e4c] font-medium leading-relaxed">
                      "{request.message}"
                    </div>
                  )}

                  <AnimatePresence>
                    {acceptingRequestId === request.id ? (
                      <MotionDiv 
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
                            className="w-full bg-white border border-[#830e4c]/20 rounded-2xl px-4 py-4 text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all resize-none min-h-[110px] placeholder:text-neutral-300"
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
                      </MotionDiv>
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
                </MotionDiv>
              ))}

              {requests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                    <Heart size={24} className="text-neutral-200" />
                  </div>
                  <h4 className="text-sm font-black text-neutral-900 uppercase">Inbox Clean</h4>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">No new interest at the moment</p>
                </div>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionDiv>
  );
};
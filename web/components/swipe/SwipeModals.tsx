import React, { useState, useMemo } from 'react';
import { X, Check, MessageCircle, Send, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button';
import { SwipeItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils/api';
import { ENDPOINTS } from '../../constants/endpoints';

interface SwipeModalsProps {
  showOfferModal: boolean;
  showMarketplaceModal: boolean;
  currentItem: SwipeItem | null;
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  onCloseOffer: () => void;
  onCloseMarketplace: () => void;
  onComplete: () => void;
  onChatStarted?: (conversationId: string) => void;
}

const MOCK_USER_ITEMS = [
  { id: 101, title: "AirPod Pro", subtitle: "Used • Electronics", image: "https://images.unsplash.com/photo-1603351154351-5cf233081e35?auto=format&fit=crop&w=300&q=80" },
  { id: 102, title: "Camera", subtitle: "Used • Electronics", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80" },
  { id: 103, title: "Shoes", subtitle: "Used • Fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" },
];

export const SwipeModals: React.FC<SwipeModalsProps> = ({
  showOfferModal,
  showMarketplaceModal,
  currentItem,
  activeTab,
  onCloseOffer,
  onCloseMarketplace,
  onComplete,
  onChatStarted,
}) => {
  const { token } = useAuth();
  const [customMessage, setCustomMessage] = useState('');
  const [selectedQuickMessage, setSelectedQuickMessage] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate contextual quick messages based on the item
  const quickMessages = useMemo(() => {
    if (!currentItem) return [];
    
    const itemTitle = currentItem.title;
    const isMarketplace = currentItem.type === 'marketplace';
    const isService = currentItem.type === 'services';
    const price = isMarketplace && 'price' in currentItem ? currentItem.price : null;
    
    if (isService) {
      const serviceName = currentItem.category || itemTitle;
      return [
        `Hi! I'm interested in your ${serviceName} services. Are you available?`,
        `Hello! I'd like to discuss a project. When are you free?`,
        `Hi! Can you tell me more about your ${serviceName} services?`,
      ];
    } else if (isMarketplace) {
      return [
        `Hi! I'm interested in your ${itemTitle}. Is it still available?`,
        `Hello! I'd love to buy the ${itemTitle}. Can we arrange a meetup?`,
        price ? `Hi! Would you consider ${price} for the ${itemTitle}?` : `Hi! Is the price negotiable for the ${itemTitle}?`,
      ];
    } else {
      return [
        `Hi! I'm interested in swapping for your ${itemTitle}. What are you looking for?`,
        `Hello! I have some items that might interest you for the ${itemTitle}.`,
        `Hi! Is the ${itemTitle} still available for trade?`,
      ];
    }
  }, [currentItem]);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!showMarketplaceModal) {
      // Reset state when modal closes
      setCustomMessage('');
      setSelectedQuickMessage(null);
      setIsSending(false);
      setError(null);
    }
  }, [showMarketplaceModal]);

  // Handle sending message to seller
  const handleSendMessage = async () => {
    if (!currentItem || !token) {
      setError('Please sign in to message sellers');
      return;
    }

    const sellerId = currentItem.owner?.id;
    if (!sellerId) {
      setError('Unable to find seller information');
      return;
    }

    // Get the message to send (custom or quick message)
    const messageText = customMessage.trim() || 
      (selectedQuickMessage !== null ? quickMessages[selectedQuickMessage] : null);

    if (!messageText) {
      setError('Please write a message or select a quick message');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await apiFetch(ENDPOINTS.conversations.start, {
        method: 'POST',
        token,
        body: {
          recipient_id: sellerId,
          message_text: messageText,
          item_id: currentItem.id,
        },
      });

      // Notify parent about the chat
      if (onChatStarted && response.data?.conversation?.id) {
        onChatStarted(response.data.conversation.id);
      }

      // Close modal first, then show native alert
      onComplete();
      
      // Show native browser alert
      setTimeout(() => {
        alert(`Message sent to ${currentItem.owner.name}! You can continue the conversation in your matches.`);
      }, 100);

    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle quick message selection
  const handleQuickMessageSelect = (index: number) => {
    if (selectedQuickMessage === index) {
      setSelectedQuickMessage(null);
    } else {
      setSelectedQuickMessage(index);
      setCustomMessage(''); // Clear custom message when selecting quick message
    }
  };

  // Handle custom message input
  const handleCustomMessageChange = (value: string) => {
    setCustomMessage(value);
    setSelectedQuickMessage(null); // Clear quick message selection when typing
  };

  return (
    <AnimatePresence>
      {/* Barter Offer Modal - Centered Compact Modal */}
      {showOfferModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCloseOffer}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }} 
            className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="relative p-4 pb-3 border-b border-gray-100">
              {/* Close Button */}
              <button 
                onClick={onCloseOffer} 
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X size={18} />
              </button>

              <h3 className="font-bold text-base text-gray-900 pr-8">Make an Offer</h3>
              <p className="text-xs text-gray-500">Select an item to exchange</p>

              {/* Target Item - Compact */}
            {currentItem && (
                <div className="mt-3 flex items-center gap-2 bg-brand/5 rounded-xl p-2 border border-brand/20">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                    <img src={currentItem.image} alt={currentItem.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{currentItem.title}</h4>
                    <p className="text-xs text-gray-500 truncate">by {currentItem.owner.name}</p>
                  </div>
                </div>
              )}
              </div>

            {/* Items List - Compact */}
            <div className="p-3 max-h-[50vh] overflow-y-auto space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1">Your Items</p>
              {MOCK_USER_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={onComplete} 
                  className="w-full flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:border-brand hover:bg-brand/5 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm group-hover:text-brand transition-colors truncate">{item.title}</h4>
                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-brand group-hover:border-brand group-hover:text-white transition-all shrink-0">
                    <Check size={14} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Marketplace Contact Seller Modal - Centered Compact Modal */}
      {showMarketplaceModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isSending && onCloseMarketplace()}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
                <div className="relative p-4 pb-3 border-b border-gray-100">
                  {/* Close Button */}
                  <button 
                    onClick={onCloseMarketplace}
                    disabled={isSending}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>

                  {/* Title Row */}
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle size={20} className="text-brand" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {currentItem?.type === 'services' ? 'Contact Provider' : 'Message Seller'}
                      </h2>
                      <p className="text-xs text-gray-500">Start a conversation</p>
                    </div>
                  </div>

                  {/* Item Preview - Compact */}
                  {currentItem && (
                    <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                        <img 
                          src={currentItem.image} 
                          alt={currentItem.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{currentItem.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{currentItem.owner.name}</p>
                      </div>
                      {currentItem.type === 'marketplace' && 'price' in currentItem && (
                        <div className="text-brand font-bold text-sm shrink-0">
                          {currentItem.price}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Options - Compact */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                  {/* Error Message */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Quick Messages - Compact */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Messages</span>
                    </div>
                    <div className="space-y-1.5">
                      {quickMessages.map((msg, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickMessageSelect(index)}
                          disabled={isSending}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-xs leading-relaxed disabled:opacity-50 ${
                            selectedQuickMessage === index
                              ? 'border-brand bg-brand/5 text-gray-900'
                              : 'border-gray-100 hover:border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              selectedQuickMessage === index
                                ? 'border-brand bg-brand'
                                : 'border-gray-300'
                            }`}>
                              {selectedQuickMessage === index && (
                                <Check size={10} className="text-white" strokeWidth={3} />
                              )}
                            </div>
                            <span>{msg}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Message Input - Compact */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Or write your own
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => handleCustomMessageChange(e.target.value)}
                      disabled={isSending}
                      placeholder="Type your message..."
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all disabled:opacity-50 disabled:bg-gray-50"
                      rows={2}
                    />
                  </div>
            </div>

                {/* Action Buttons - Compact */}
                <div className="p-4 pt-0 space-y-2">
                  <Button 
                    fullWidth 
                    onClick={handleSendMessage}
                    disabled={isSending || (!customMessage.trim() && selectedQuickMessage === null)}
                    className="gap-2 !py-3"
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </Button>
              <button 
                onClick={onComplete} 
                    disabled={isSending}
                    className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                    Skip & Keep Swiping
                    <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

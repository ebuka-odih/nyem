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
  const [messageSent, setMessageSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate contextual quick messages based on the item
  const quickMessages = useMemo(() => {
    if (!currentItem) return [];
    
    const itemTitle = currentItem.title;
    const isMarketplace = currentItem.type === 'marketplace';
    const price = isMarketplace && 'price' in currentItem ? currentItem.price : null;
    
    if (isMarketplace) {
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
      setMessageSent(false);
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

      setMessageSent(true);
      
      // Notify parent about the chat
      if (onChatStarted && response.data?.conversation?.id) {
        onChatStarted(response.data.conversation.id);
      }

      // Auto-close after success animation
      setTimeout(() => {
        onComplete();
      }, 1500);

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
      {/* Barter Offer Modal */}
      {showOfferModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        >
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }} 
            className="bg-white w-full rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Make an Offer</h3>
                <p className="text-sm text-gray-500">Select an item to exchange</p>
              </div>
              <button 
                onClick={onCloseOffer} 
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Target Item Context */}
            {currentItem && (
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  You Want to Exchange For:
                </div>
                <div className="flex items-center bg-brand/5 p-3 rounded-xl border-2 border-brand shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                    <img src={currentItem.image} alt={currentItem.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{currentItem.title}</h4>
                    <p className="text-xs text-gray-500 truncate">Owned by {currentItem.owner.name}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-y-auto p-4 space-y-3 pb-8">
              {MOCK_USER_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={onComplete} 
                  className="w-full flex items-center p-3 rounded-2xl border border-gray-100 hover:border-brand hover:bg-brand/5 transition-all group text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-brand transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-brand group-hover:border-brand group-hover:text-white transition-all">
                    <Check size={16} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Marketplace Contact Seller Modal */}
      {showMarketplaceModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => !isSending && onCloseMarketplace()}
        >
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success State */}
            {messageSent ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-8 pt-12 text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check size={40} className="text-green-600" strokeWidth={3} />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-500">
                  Your message has been sent to <strong>{currentItem?.owner.name}</strong>
                </p>
              </motion.div>
            ) : (
              <>
                {/* Header with Item Preview */}
                <div className="relative bg-gradient-to-b from-brand/5 to-white pt-6 px-5 pb-4">
                  {/* Close Button - positioned with safe area spacing from notch */}
                  <button 
                    onClick={onCloseMarketplace}
                    disabled={isSending}
                    className="absolute top-5 right-4 w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-colors text-gray-500 shadow-sm disabled:opacity-50 z-10"
                  >
                    <X size={20} />
                  </button>

                  {/* Icon - with top margin to clear the close button */}
                  <div className="flex justify-center mb-4 mt-4">
                    <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center">
                      <MessageCircle size={28} className="text-brand" />
                    </div>
            </div>

                  {/* Title */}
                  <h2 className="text-xl font-extrabold text-gray-900 text-center mb-1">
                    Message Seller
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    Send a message to start the conversation
                  </p>

                  {/* Item Preview Card */}
                  {currentItem && (
                    <div className="mt-4 flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        <img 
                          src={currentItem.image} 
                          alt={currentItem.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{currentItem.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                            <img 
                              src={currentItem.owner.image} 
                              alt={currentItem.owner.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs text-gray-500 truncate">{currentItem.owner.name}</span>
                        </div>
                      </div>
                      {currentItem.type === 'marketplace' && 'price' in currentItem && (
                        <div className="text-brand font-bold text-sm shrink-0">
                          {currentItem.price}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Options */}
                <div className="p-5 pt-3 flex-1 overflow-y-auto">
                  {/* Error Message */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Quick Messages Section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Messages</span>
                    </div>
                    <div className="space-y-2">
                      {quickMessages.map((msg, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickMessageSelect(index)}
                          disabled={isSending}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm leading-relaxed disabled:opacity-50 ${
                            selectedQuickMessage === index
                              ? 'border-brand bg-brand/5 text-gray-900'
                              : 'border-gray-100 hover:border-gray-200 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              selectedQuickMessage === index
                                ? 'border-brand bg-brand'
                                : 'border-gray-300'
                            }`}>
                              {selectedQuickMessage === index && (
                                <Check size={12} className="text-white" strokeWidth={3} />
                              )}
                            </div>
                            <span>{msg}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Message Input */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Or write your own
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => handleCustomMessageChange(e.target.value)}
                      disabled={isSending}
                      placeholder="Type your message here..."
                      className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm resize-none focus:outline-none focus:border-brand transition-colors disabled:opacity-50 disabled:bg-gray-50"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-5 pt-3 border-t border-gray-100 space-y-3">
                  <Button 
                    fullWidth 
                    onClick={handleSendMessage}
                    disabled={isSending || (!customMessage.trim() && selectedQuickMessage === null)}
                    className="gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </Button>
              <button 
                onClick={onComplete} 
                    disabled={isSending}
                    className="w-full py-3 rounded-full font-semibold text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                    Skip & Keep Swiping
                    <ArrowRight size={16} />
              </button>
            </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

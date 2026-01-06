import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RefreshCw, Flame, Loader2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { SwipeItem } from '../../types';
import { SwipeCard } from './SwipeCard';
import { WelcomeCard } from './WelcomeCard';
import { PromoCard } from './PromoCard';
import { AdSwipeCard } from './AdSwipeCard';
import { WelcomeAdCard } from './WelcomeAdCard';
import { apiFetch } from '../../utils/api';
import { ENDPOINTS } from '../../constants/endpoints';

interface SwipeCardStackProps {
  items: SwipeItem[];
  currentIndex: number;
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  loading?: boolean;
  likedItems?: Set<number>;
  showWelcomeCard?: boolean;
  showPromoCard?: boolean;
  showAdCard?: boolean;
  showSignupWelcomeCard?: boolean;
  currentUserId?: string | number; // Current user's ID to check if item belongs to them
  onLike?: (itemId: number, isCurrentlyLiked: boolean) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onDirectBuyRequest?: () => void; // Handler for direct buy request (no modal)
  isSendingBuyRequest?: boolean; // Loading state for buy request
  onItemClick: (item: SwipeItem) => void;
  onReset: () => void | Promise<void>;
  onWelcomeCardDismiss?: () => void;
  onPromoCardDismiss?: () => void;
  onAdCardDismiss?: () => void;
  onAdCardAction?: () => void; // Handler for ad card action button
  onSignupWelcomeCardDismiss?: () => void;
  onViewCountUpdate?: (itemId: number | string, viewCount: number) => void; // Callback to update view count
}

export const SwipeCardStack: React.FC<SwipeCardStackProps> = ({
  items,
  currentIndex,
  activeTab,
  loading = false,
  likedItems = new Set(),
  showWelcomeCard = false,
  showPromoCard = false,
  showAdCard = false,
  showSignupWelcomeCard = false,
  currentUserId,
  onLike,
  onSwipeLeft,
  onSwipeRight,
  onDirectBuyRequest,
  isSendingBuyRequest = false,
  onItemClick,
  onReset,
  onWelcomeCardDismiss,
  onPromoCardDismiss,
  onAdCardDismiss,
  onAdCardAction,
  onSignupWelcomeCardDismiss,
  onViewCountUpdate,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  const controls = useAnimation();
  const viewedItemsRef = useRef<Set<string | number>>(new Set()); // Track which items have been viewed
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    controls.set({ scale: 0.9, y: 20, opacity: 0 });
    controls.start({ scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } });
  }, [currentIndex, activeTab, controls]);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track scroll position for floating buttons on desktop (for visual feedback)
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) { // Only on desktop (md breakpoint)
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        setIsScrolled(scrollY > 20); // Track scroll for visual feedback
      } else {
        setIsScrolled(false); // Always false on mobile
      }
    };

    // Also check scroll on the container if it's scrollable
    const handleContainerScroll = () => {
      if (containerRef.current && window.innerWidth >= 768) {
        const scrollTop = containerRef.current.scrollTop;
        setIsScrolled(scrollTop > 20);
      }
    };

    // Check if we're on desktop and set initial state
    if (window.innerWidth >= 768) {
      setIsScrolled(true); // Always show buttons on desktop by default
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleContainerScroll, { passive: true });
    }
    handleScroll(); // Check initial scroll position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleContainerScroll);
      }
    };
  }, []);

  // Only get currentItem if we're not showing special cards (which don't have items)
  const currentItem = (!showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard) 
    ? items[currentIndex] 
    : undefined;
  const nextItem = items[currentIndex + 1];
  
  // Check if current item belongs to the current user (only if currentItem exists)
  const isOwnItem = currentItem && currentUserId && currentItem.owner?.id 
    ? String(currentItem.owner.id) === String(currentUserId)
    : false;

  // Track view when item becomes visible in the feed
  useEffect(() => {
    if (!currentItem || !currentItem.id) return;
    
    // Don't track views for own items (users can see their own items)
    if (isOwnItem) return;

    // Don't track if we've already viewed this item in this session
    if (viewedItemsRef.current.has(currentItem.id)) return;

    // Mark as viewed to prevent duplicate tracking
    viewedItemsRef.current.add(currentItem.id);

    // Track view asynchronously (don't block UI)
    const trackView = async () => {
      try {
        const response = await apiFetch(ENDPOINTS.items.trackView(currentItem.id), {
          method: 'POST',
        });
        
        // Update view count if response includes it
        if (response?.view_count !== undefined && onViewCountUpdate) {
          onViewCountUpdate(currentItem.id, response.view_count);
        }
      } catch (error) {
        // Silently fail - view tracking is not critical for UX
        console.debug('Failed to track item view:', error);
        // Remove from set so we can retry later if needed
        viewedItemsRef.current.delete(currentItem.id);
      }
    };

    // Small delay to ensure item is actually visible
    const timeoutId = setTimeout(trackView, 500);
    
    return () => clearTimeout(timeoutId);
  }, [currentItem?.id, isOwnItem]);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    // Don't handle drag if we're showing a special card (welcome, promo, ad)
    // These cards have their own swipe handlers
    if (showWelcomeCard || showSignupWelcomeCard || showPromoCard || showAdCard) {
      controls.start({ x: 0, rotate: 0 });
      return;
    }
    
    // Don't handle drag if there's no current item
    if (!currentItem) {
      controls.start({ x: 0, rotate: 0 });
      return;
    }
    
    if (info.offset.x > 100) {
      // Only allow swipe right if it's not the user's own item
      if (!isOwnItem) {
        onSwipeRight();
      } else {
        // Reset position if trying to swipe right on own item
        controls.start({ x: 0, rotate: 0 });
      }
    } else if (info.offset.x < -100) {
      await swipe('left');
    } else {
      controls.start({ x: 0, rotate: 0 });
    }
  };

  const swipe = async (direction: 'left' | 'right') => {
    await controls.start({ 
      x: direction === 'left' ? -500 : 500, 
      opacity: 0,
      transition: { duration: 0.15, ease: 'easeOut' }
    });
    if (direction === 'left') {
      onSwipeLeft();
    }
    x.set(0);
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center px-4 pb-2 w-full min-h-0">
      {/* Card Container - Maximize card height, minimal button space */}
      <div className="relative w-full h-[calc(100%-60px)] min-h-[440px]">
        {/* Services Tab - Always show Coming Soon */}
        {activeTab === 'Services' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0 bg-white rounded-[24px] border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Flame size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Coming Soon</h3>
            <p className="text-gray-500 text-sm">Services feature is under development.</p>
          </div>
        ) : (
          <>
            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Loader2 size={32} className="text-brand animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Loading items...</h3>
                <p className="text-gray-500 text-sm">Please wait while we fetch the latest listings.</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !currentItem && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Flame size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">You're all caught up!</h3>
                <p className="text-gray-500 text-sm mb-4">Check back later for more items.</p>
                <button
                  onClick={async () => {
                    if (onReset) {
                      await onReset();
                    }
                  }}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-brand text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={16} />
                  <span>Start Over</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Next Card (Background) - Show current item if special card is displayed */}
        {activeTab !== 'Services' && !loading && (showWelcomeCard || showPromoCard || showAdCard) && currentItem && (
          <div className="absolute inset-0 w-full h-full scale-[0.96] translate-y-2 opacity-50 z-0 pointer-events-none">
            <SwipeCard item={currentItem} />
          </div>
        )}
        
        {/* Next Card (Background) - Normal flow when no special card */}
        {activeTab !== 'Services' && !loading && !showWelcomeCard && !showPromoCard && !showAdCard && !showSignupWelcomeCard && nextItem && (
          <div className="absolute inset-0 w-full h-full scale-[0.96] translate-y-2 opacity-50 z-0 pointer-events-none">
            <SwipeCard item={nextItem} />
          </div>
        )}

        {/* Signup Welcome Card - Shown after user signs up (takes priority over regular welcome card) */}
        {activeTab !== 'Services' && !loading && !showWelcomeCard && showSignupWelcomeCard && (
          <motion.div
            key="signup-welcome-card"
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity, willChange: 'transform' }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={async (event: any, info: PanInfo) => {
              if (Math.abs(info.offset.x) > 100) {
                // Swipe in either direction dismisses the signup welcome card
                await controls.start({ x: info.offset.x > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                x.set(0);
                onSignupWelcomeCardDismiss?.();
              } else {
                controls.start({ x: 0, rotate: 0 });
              }
            }}
            whileTap={{ scale: 1.005 }}
          >
            <WelcomeAdCard />
          </motion.div>
        )}

        {/* Welcome Card - Shown as first card when enabled (only if signup welcome card is not showing) */}
        {activeTab !== 'Services' && !loading && !showSignupWelcomeCard && showWelcomeCard && (
          <motion.div
            key="welcome-card"
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity, willChange: 'transform' }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={async (event: any, info: PanInfo) => {
              if (Math.abs(info.offset.x) > 100) {
                // Swipe in either direction dismisses the welcome card
                await controls.start({ x: info.offset.x > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                x.set(0);
                onWelcomeCardDismiss?.();
              } else {
                controls.start({ x: 0, rotate: 0 });
              }
            }}
            whileTap={{ scale: 1.005 }}
          >
            <WelcomeCard />
          </motion.div>
        )}

        {/* Promo Card - Shown every N swipes on Marketplace tab */}
        {activeTab !== 'Services' && !loading && !showWelcomeCard && !showSignupWelcomeCard && !showAdCard && showPromoCard && (
          <motion.div
            key="promo-card"
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity, willChange: 'transform' }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={async (event: any, info: PanInfo) => {
              if (Math.abs(info.offset.x) > 100) {
                // Swipe in either direction dismisses the promo card
                await controls.start({ x: info.offset.x > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                x.set(0);
                onPromoCardDismiss?.();
              } else {
                controls.start({ x: 0, rotate: 0 });
              }
            }}
            whileTap={{ scale: 1.005 }}
          >
            <PromoCard />
          </motion.div>
        )}

        {/* Ad Card - Shown every 3 swipes */}
        {activeTab !== 'Services' && !loading && !showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && showAdCard && (
          <motion.div
            key="ad-card"
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity, willChange: 'transform' }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={async (event: any, info: PanInfo) => {
              if (Math.abs(info.offset.x) > 100) {
                // Swipe in either direction dismisses the ad card
                await controls.start({ x: info.offset.x > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                x.set(0);
                onAdCardDismiss?.();
              } else {
                controls.start({ x: 0, rotate: 0 });
              }
            }}
            whileTap={{ scale: 1.005 }}
          >
            <AdSwipeCard onAction={onAdCardAction} />
          </motion.div>
        )}

        {/* Current Card - Only show when no special cards are displayed */}
        {activeTab !== 'Services' && !loading && !showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard && currentItem && (
          <motion.div
            key={currentItem.id}
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity, willChange: 'transform' }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: -200, right: isOwnItem ? 0 : 200 }} // Prevent right drag on own items
            dragElastic={isOwnItem ? { left: 0.7, right: 0 } : 0.7} // Disable right drag elastic on own items
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 1.005 }}
          >
            <SwipeCard
              item={currentItem}
              isLiked={likedItems.has(currentItem.id)}
              onLike={onLike ? () => onLike(currentItem.id, likedItems.has(currentItem.id)) : undefined}
              onInfoClick={() => onItemClick(currentItem)}
              onBuyClick={isOwnItem ? undefined : onSwipeRight} // Disable buy button on own items
              onDirectBuyRequest={isOwnItem ? undefined : onDirectBuyRequest} // Direct buy request handler (no modal)
              isSendingBuyRequest={isSendingBuyRequest} // Loading state for buy request
              isOwnItem={isOwnItem} // Pass ownership status to show stats
            />
          </motion.div>
        )}
      </div>

      {/* Swipe Buttons - Floating on desktop when scrolling, normal on mobile */}
      {activeTab !== 'Services' && !loading && (
        <>
          {/* Mobile/Default Position */}
          <div className="flex justify-center items-center space-x-8 mt-2 py-1 shrink-0 relative z-20 md:hidden">
            <button
              onClick={async () => {
                if (showWelcomeCard) {
                  await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onWelcomeCardDismiss?.();
                } else if (showSignupWelcomeCard) {
                  await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onSignupWelcomeCardDismiss?.();
                } else if (showPromoCard) {
                  await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onPromoCardDismiss?.();
                } else if (showAdCard) {
                  await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onAdCardDismiss?.();
                } else if (currentItem) {
                  await swipe('left');
                }
              }}
              disabled={!currentItem && !showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard}
              className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.15)] flex items-center justify-center text-red-500 active:scale-90 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
            >
              <X size={32} strokeWidth={2.5} />
            </button>
            <button
              onClick={async () => {
                if (showWelcomeCard) {
                  await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onWelcomeCardDismiss?.();
                } else if (showPromoCard) {
                  await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onPromoCardDismiss?.();
                } else if (showAdCard) {
                  await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                  x.set(0);
                  onAdCardDismiss?.();
                } else if (currentItem && !isOwnItem) {
                  onSwipeRight();
                }
              }}
              disabled={(!currentItem && !showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard) || (!showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard && isOwnItem)}
              className="w-16 h-16 rounded-full bg-white border border-green-100 shadow-[0_4px_20px_rgba(34,197,94,0.15)] flex items-center justify-center text-green-500 active:scale-90 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
              title={(!showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard && isOwnItem) ? "You can't like your own item" : "Swipe right"}
            >
              <Check size={32} strokeWidth={3} />
            </button>
          </div>

          {/* Desktop Floating Position - Always visible on desktop, rendered via portal */}
          {mounted && typeof document !== 'undefined' && createPortal(
            <div className="hidden md:flex fixed bottom-8 left-1/2 transform -translate-x-1/2 justify-center items-center space-x-6 z-[9999] transition-all duration-300 opacity-100 pointer-events-auto">
              <button
                onClick={async () => {
                  if (showWelcomeCard) {
                    await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onWelcomeCardDismiss?.();
                  } else if (showSignupWelcomeCard) {
                    await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onSignupWelcomeCardDismiss?.();
                  } else if (showPromoCard) {
                    await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onPromoCardDismiss?.();
                  } else if (showAdCard) {
                    await controls.start({ x: -500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onAdCardDismiss?.();
                  } else if (currentItem) {
                    await swipe('left');
                  }
                }}
                disabled={!currentItem && !showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard}
                className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-[0_8px_30px_rgba(239,68,68,0.3)] flex items-center justify-center text-red-500 active:scale-90 transition-all hover:shadow-2xl hover:scale-110 disabled:opacity-40 disabled:scale-100 disabled:shadow-none backdrop-blur-sm"
              >
                <X size={32} strokeWidth={2.5} />
              </button>
              <button
                onClick={async () => {
                  if (showWelcomeCard) {
                    await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onWelcomeCardDismiss?.();
                  } else if (showSignupWelcomeCard) {
                    await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onSignupWelcomeCardDismiss?.();
                  } else if (showPromoCard) {
                    await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onPromoCardDismiss?.();
                  } else if (showAdCard) {
                    await controls.start({ x: 500, opacity: 0, transition: { duration: 0.15, ease: 'easeOut' } });
                    x.set(0);
                    onAdCardDismiss?.();
                  } else if (currentItem && !isOwnItem) {
                    onSwipeRight();
                  }
                }}
                disabled={(!currentItem && !showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard) || (!showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard && isOwnItem)}
                className="w-16 h-16 rounded-full bg-white border border-green-100 shadow-[0_8px_30px_rgba(34,197,94,0.3)] flex items-center justify-center text-green-500 active:scale-90 transition-all hover:shadow-2xl hover:scale-110 disabled:opacity-40 disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed backdrop-blur-sm"
                title={(!showWelcomeCard && !showSignupWelcomeCard && !showPromoCard && !showAdCard && isOwnItem) ? "You can't like your own item" : "Swipe right"}
              >
                <Check size={32} strokeWidth={3} />
              </button>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};

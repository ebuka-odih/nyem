import React from 'react';
import { X, Check, RefreshCw, Flame, Loader2 } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { SwipeItem } from '../../types';
import { SwipeCard } from './SwipeCard';
import { WelcomeCard } from './WelcomeCard';
import { PromoCard } from './PromoCard';

interface SwipeCardStackProps {
  items: SwipeItem[];
  currentIndex: number;
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  loading?: boolean;
  likedItems?: Set<number>;
  showWelcomeCard?: boolean;
  showPromoCard?: boolean;
  onLike?: (itemId: number, isCurrentlyLiked: boolean) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onItemClick: (item: SwipeItem) => void;
  onReset: () => void;
  onWelcomeCardDismiss?: () => void;
  onPromoCardDismiss?: () => void;
}

export const SwipeCardStack: React.FC<SwipeCardStackProps> = ({
  items,
  currentIndex,
  activeTab,
  loading = false,
  likedItems = new Set(),
  showWelcomeCard = false,
  showPromoCard = false,
  onLike,
  onSwipeLeft,
  onSwipeRight,
  onItemClick,
  onReset,
  onWelcomeCardDismiss,
  onPromoCardDismiss,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  const controls = useAnimation();

  React.useEffect(() => {
    controls.set({ scale: 0.9, y: 20, opacity: 0 });
    controls.start({ scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } });
  }, [currentIndex, activeTab, controls]);

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipeRight();
    } else if (info.offset.x < -100) {
      await swipe('left');
    } else {
      controls.start({ x: 0, rotate: 0 });
    }
  };

  const swipe = async (direction: 'left' | 'right') => {
    await controls.start({ x: direction === 'left' ? -500 : 500, opacity: 0 });
    if (direction === 'left') {
      onSwipeLeft();
    }
    x.set(0);
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 pb-2 w-full min-h-0">
      {/* Card Container - Maximize card height, minimal button space */}
      <div className="relative w-full h-[calc(100%-60px)] min-h-[440px]">
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0 bg-white rounded-[24px] border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-[#990033] animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Loading items...</h3>
            <p className="text-gray-500 text-sm">Please wait while we fetch the latest listings.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !currentItem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0 bg-white rounded-[24px] border border-gray-100 shadow-sm">
            {activeTab === 'Services' ? (
              <>
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Flame size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Coming Soon</h3>
                <p className="text-gray-500 text-sm">Services feature is under development.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Flame size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">You're all caught up!</h3>
                <p className="text-gray-500 text-sm mb-4">Check back later for more items.</p>
                <button
                  onClick={onReset}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-brand text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform"
                >
                  <RefreshCw size={16} />
                  <span>Start Over</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Next Card (Background) - Show current item if special card is displayed */}
        {!loading && (showWelcomeCard || showPromoCard) && currentItem && (
          <div className="absolute inset-0 w-full h-full scale-[0.96] translate-y-2 opacity-50 z-0 pointer-events-none">
            <SwipeCard item={currentItem} />
          </div>
        )}
        
        {/* Next Card (Background) - Normal flow when no special card */}
        {!loading && !showWelcomeCard && !showPromoCard && nextItem && (
          <div className="absolute inset-0 w-full h-full scale-[0.96] translate-y-2 opacity-50 z-0 pointer-events-none">
            <SwipeCard item={nextItem} />
          </div>
        )}

        {/* Welcome Card - Shown as first card when enabled */}
        {!loading && showWelcomeCard && (
          <motion.div
            key="welcome-card"
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={async (event: any, info: PanInfo) => {
              if (Math.abs(info.offset.x) > 100) {
                // Swipe in either direction dismisses the welcome card
                await controls.start({ x: info.offset.x > 0 ? 500 : -500, opacity: 0 });
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
        {!loading && !showWelcomeCard && showPromoCard && (
          <motion.div
            key="promo-card"
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={async (event: any, info: PanInfo) => {
              if (Math.abs(info.offset.x) > 100) {
                // Swipe in either direction dismisses the promo card
                await controls.start({ x: info.offset.x > 0 ? 500 : -500, opacity: 0 });
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

        {/* Current Card - Only show when no special cards are displayed */}
        {!loading && !showWelcomeCard && !showPromoCard && currentItem && (
          <motion.div
            key={currentItem.id}
            className="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing origin-bottom"
            style={{ x, rotate, opacity }}
            animate={controls}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 1.005 }}
          >
            <SwipeCard
              item={currentItem}
              isLiked={likedItems.has(currentItem.id)}
              onLike={onLike ? () => onLike(currentItem.id, likedItems.has(currentItem.id)) : undefined}
              onInfoClick={() => onItemClick(currentItem)}
              onBuyClick={onSwipeRight}
            />
          </motion.div>
        )}
      </div>

      {/* Swipe Buttons - Larger for better tap targets */}
      {!loading && (
        <div className="flex justify-center items-center space-x-8 mt-2 py-1 shrink-0 relative z-20">
          <button
            onClick={async () => {
              if (showWelcomeCard) {
                await controls.start({ x: -500, opacity: 0 });
                x.set(0);
                onWelcomeCardDismiss?.();
              } else if (showPromoCard) {
                await controls.start({ x: -500, opacity: 0 });
                x.set(0);
                onPromoCardDismiss?.();
              } else if (currentItem) {
                await swipe('left');
              }
            }}
            disabled={!currentItem && !showWelcomeCard && !showPromoCard}
            className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.15)] flex items-center justify-center text-red-500 active:scale-90 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
          >
            <X size={32} strokeWidth={2.5} />
          </button>
          <button
            onClick={async () => {
              if (showWelcomeCard) {
                await controls.start({ x: 500, opacity: 0 });
                x.set(0);
                onWelcomeCardDismiss?.();
              } else if (showPromoCard) {
                await controls.start({ x: 500, opacity: 0 });
                x.set(0);
                onPromoCardDismiss?.();
              } else if (currentItem) {
                onSwipeRight();
              }
            }}
            disabled={!currentItem && !showWelcomeCard && !showPromoCard}
            className="w-16 h-16 rounded-full bg-white border border-green-100 shadow-[0_4px_20px_rgba(34,197,94,0.15)] flex items-center justify-center text-green-500 active:scale-90 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
          >
            <Check size={32} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
};

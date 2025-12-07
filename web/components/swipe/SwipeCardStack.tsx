import React, { useState } from 'react';
import { X, Check, RefreshCw, Flame, Eye } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { SwipeItem } from '../../types';
import { SwipeCard } from './SwipeCard';
import { MarketplaceCard } from '../marketplace/MarketplaceCard';

interface SwipeCardStackProps {
  items: SwipeItem[];
  currentIndex: number;
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onItemClick: (item: SwipeItem) => void;
  onReset: () => void;
}


export const SwipeCardStack: React.FC<SwipeCardStackProps> = ({
  items,
  currentIndex,
  activeTab,
  onSwipeLeft,
  onSwipeRight,
  onItemClick,
  onReset,
}) => {
  const [showDesignPreview, setShowDesignPreview] = useState(false);
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
    <div className="flex-1 flex flex-col items-center px-4 pb-3 w-full min-h-0">
      {/* Card Container - Uses calc to fill available space minus header and buttons */}
      <div className="relative w-full h-[calc(100%-80px)] min-h-[400px]">
        {/* Empty State */}
        {!currentItem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
            {activeTab === 'Services' ? (
              <div className="text-center p-8 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Flame size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Coming Soon</h3>
                <p className="text-gray-500 text-sm">Services feature is under development.</p>
              </div>
            ) : showDesignPreview ? (
              /* Design Preview Mode - Show MarketplaceCard sample */
              <div className="w-full h-full flex flex-col items-center overflow-y-auto py-4">
                <div className="mb-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#990033] to-[#cc0044] text-white text-xs font-bold rounded-full">
                    <Eye size={12} />
                    Design Preview
                  </span>
                </div>
                <MarketplaceCard
                  variant="full"
                  onBuyClick={() => alert('Buy button clicked - Design sample mode')}
                />
                <button
                  onClick={() => setShowDesignPreview(false)}
                  className="mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                >
                  Hide Preview
                </button>
              </div>
            ) : (
              /* Default Empty State */
              <div className="text-center p-8 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Flame size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No items yet</h3>
                <p className="text-gray-500 text-sm mb-4">Check back later for new items to browse.</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onReset}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform"
                  >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                  </button>
                  {activeTab === 'Marketplace' && (
                    <button
                      onClick={() => setShowDesignPreview(true)}
                      className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#990033] to-[#cc0044] text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform hover:shadow-xl"
                    >
                      <Eye size={16} />
                      <span>View Card Design</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Card (Background) */}
        {nextItem && (
          <div className="absolute inset-0 w-full h-full scale-[0.96] translate-y-2 opacity-50 z-0 pointer-events-none">
            <SwipeCard item={nextItem} />
          </div>
        )}

        {/* Current Card */}
        {currentItem && (
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
              onInfoClick={() => onItemClick(currentItem)}
            />
          </motion.div>
        )}
      </div>

      {/* Swipe Buttons - Below card with proper spacing */}
      <div className="flex justify-center items-center space-x-8 mt-3 py-2 shrink-0 relative z-20">
        <button
          onClick={async () => {
            if (currentItem) {
              await swipe('left');
            }
          }}
          disabled={!currentItem}
          className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.15)] flex items-center justify-center text-red-500 active:scale-90 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
        >
          <X size={32} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => currentItem && onSwipeRight()}
          disabled={!currentItem}
          className="w-16 h-16 rounded-full bg-white border border-green-100 shadow-[0_4px_20px_rgba(34,197,94,0.15)] flex items-center justify-center text-green-500 active:scale-90 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
        >
          <Check size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

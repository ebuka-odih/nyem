import React from 'react';
import { X, Check, RefreshCw, Flame } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { SwipeItem } from '../../types';
import { SwipeCard } from './SwipeCard';

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
    <div className="flex-1 relative flex flex-col items-center pt-1 px-4 overflow-hidden w-full">
      <div className="relative w-full h-[65vh] md:h-[68vh]">
        {/* Empty State */}
        {!currentItem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
            {activeTab === 'Services' ? (
              <>
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Flame size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Coming Soon</h3>
                <p className="text-gray-500 mb-6">Services feature is under development. Check back soon!</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Flame size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">You're all caught up!</h3>
                <p className="text-gray-500 mb-6">Check back later for more items.</p>
                <button 
                  onClick={onReset} 
                  className="flex items-center space-x-2 px-6 py-3 bg-brand text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                  <RefreshCw size={20} />
                  <span>Start Over</span>
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Next Card (Background) */}
        {nextItem && (
          <div className="absolute inset-0 w-full h-full bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden flex flex-col scale-[0.96] translate-y-3 opacity-60 z-0 pointer-events-none">
            <SwipeCard item={nextItem} />
          </div>
        )}
        
        {/* Current Card */}
        {currentItem && (
          <motion.div 
            key={currentItem.id} 
            className="absolute inset-0 w-full h-full bg-white rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-10 overflow-hidden border border-gray-100 flex flex-col cursor-grab active:cursor-grabbing origin-bottom" 
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
      
      {/* Swipe Buttons - Positioned in white space below card */}
      <div className="flex justify-center space-x-8 mt-6 mb-4 w-full pointer-events-none">
        <button 
          onClick={async () => {
            if (currentItem) {
              await swipe('left');
            }
          }} 
          disabled={!currentItem} 
          className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-red-100 shadow-[0_8px_20px_rgba(239,68,68,0.15)] flex items-center justify-center text-red-500 active:scale-95 transition-transform hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          <X size={28} strokeWidth={2.5} />
        </button>
        <button 
          onClick={() => currentItem && onSwipeRight()} 
          disabled={!currentItem} 
          className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-green-100 shadow-[0_8px_20px_rgba(34,197,94,0.15)] flex items-center justify-center text-green-500 active:scale-95 transition-transform hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100"
        >
          <Check size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};


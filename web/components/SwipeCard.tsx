import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { MapPin, Star, ShieldCheck, Zap, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface SwipeCardProps {
  product: Product;
  onSwipe: (dir: 'left' | 'right' | 'up') => void;
  isTop: boolean;
  index: number;
  triggerDirection: 'left' | 'right' | 'up' | null;
  onShowDetail: (product: Product) => void;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const SwipeCard: React.FC<SwipeCardProps> = ({ 
  product, 
  onSwipe, 
  isTop,
  index,
  triggerDirection,
  onShowDetail
}) => {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  
  const [currentImg, setCurrentImg] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalDragRef = useRef(false);

  React.useEffect(() => {
    if (isTop) {
      if (triggerDirection) {
        if (triggerDirection === 'right') controls.start({ x: 800, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('right'));
        else if (triggerDirection === 'left') controls.start({ x: -800, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('left'));
        else if (triggerDirection === 'up') controls.start({ y: -1000, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('up'));
      } else {
        controls.start({ scale: 1, x: 0, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } });
      }
    } else {
      const stackOffset = Math.min(index * 8, 16);
      const stackScale = 1 - Math.min(index * 0.04, 0.08);
      controls.start({ 
        scale: stackScale, 
        y: stackOffset, 
        x: 0, 
        opacity: index > 2 ? 0 : 1 - (index * 0.15),
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      });
    }
  }, [isTop, index, triggerDirection, controls, onSwipe]);

  // Fix: info is typed as any because PanInfo is not exported in this environment
  const handleDragStart = (_: any, info: any) => {
    if (!isTop) return;
    dragStartPointRef.current = { x: info.point.x, y: info.point.y };
    isHorizontalDragRef.current = false;
  };

  const handleDrag = (_: any, info: any) => {
    if (!isTop || !dragStartPointRef.current) return;
    
    const deltaX = Math.abs(info.point.x - dragStartPointRef.current.x);
    const deltaY = Math.abs(info.point.y - dragStartPointRef.current.y);
    
    // Only consider it a horizontal drag if horizontal movement is significantly more than vertical
    // This allows vertical scrolling to work naturally
    if (deltaX > 10 && deltaX > deltaY * 1.3) {
      if (!isHorizontalDragRef.current) {
        isHorizontalDragRef.current = true;
        // Disable scrolling only when horizontal drag is detected
        if (scrollContainerRef.current) {
          scrollContainerRef.current.style.overflowY = 'hidden';
        }
      }
      x.set(info.offset.x);
    }
    // If vertical movement is dominant, allow scrolling (don't interfere)
    else if (deltaY > deltaX) {
      // Don't interfere with scrolling - let it happen naturally
      return;
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (!isTop) return;
    
    // Always re-enable scrolling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.overflowY = 'auto';
      scrollContainerRef.current.style.touchAction = '';
    }

    // Only trigger swipe if it was a horizontal drag
    if (!isHorizontalDragRef.current) {
      dragStartPointRef.current = null;
      isHorizontalDragRef.current = false;
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
      return;
    }

    const absX = Math.abs(info.offset.x);
    const velocityX = Math.abs(info.velocity.x);

    // Check for right swipe
    if ((absX > 100 && info.offset.x > 0) || (velocityX > 500 && info.offset.x > 0)) {
      controls.start({ x: 800, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        x.set(0);
        y.set(0);
        onSwipe('right');
      });
    }
    // Check for left swipe
    else if ((absX > 100 && info.offset.x < 0) || (velocityX > 500 && info.offset.x < 0)) {
      controls.start({ x: -800, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        x.set(0);
        y.set(0);
        onSwipe('left');
      });
    }
    // Snap back if not enough movement
    else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }
    
    dragStartPointRef.current = null;
    isHorizontalDragRef.current = false;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <MotionDiv
      animate={controls}
      style={{ 
        x, 
        y,
        rotate, 
        opacity: isTop ? opacity : undefined,
        zIndex: isTop ? 50 : 50 - index, 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        willChange: 'transform'
      }}
      drag={isTop ? "x" : false}
      dragElastic={0.2}
      dragConstraints={{ left: -300, right: 300 }}
      dragPropagation={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={`${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
    >
      <div className="relative w-full h-full bg-white rounded-[2.2rem] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col border border-neutral-100/50">
        
        {/* Scrollable Content Container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar pb-40"
        >
          {/* Main Image Section */}
          <div className="relative w-full aspect-[4/5] bg-neutral-100 group overflow-hidden">
            <img 
              src={product.images[currentImg]} 
              className="w-full h-full object-cover pointer-events-none" 
              key={currentImg}
            />

            {/* Restored Gallery Progress Indicators */}
            <div className="absolute top-2 left-4 right-4 flex gap-1 z-20">
          {product.images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === currentImg ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]' : 'bg-white/30'}`} 
                />
          ))}
        </div>

            {/* Tap Areas for Gallery Cycling */}
            <div className="absolute inset-0 flex z-10">
              <div className="w-1/2 h-full cursor-pointer" onClick={prevImage} />
              <div className="w-1/2 h-full cursor-pointer" onClick={nextImage} />
        </div>

            {/* Bottom Gradient for Text Legibility */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            
            {/* Top Bar: Verified Badge only */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-20">
              <div className="flex items-center gap-2">
              {product.vendor.verified && (
                  <div className="bg-[#29B3F0] p-1 rounded-full text-white shadow-lg border border-white/20">
                    <ShieldCheck size={14} fill="currentColor" />
                </div>
              )}
              </div>
              <button className="text-white opacity-80 active:scale-90 transition-transform pointer-events-auto">
                <MoreHorizontal size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Bottom Overlay: Product Name & Badge */}
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none z-20 space-y-3">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                {product.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xl flex items-center gap-2">
                  <Zap size={14} className="text-[#830e4c]" fill="currentColor" />
                  <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest italic">Best Seller</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-8">
            <div className="bg-neutral-50 rounded-3xl p-5 border border-neutral-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#830e4c1a] flex items-center justify-center text-[#830e4c]">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Price Inquiry</h4>
               </div>
               <span className="text-xl font-black text-[#830e4c] tracking-tighter">{product.price}</span>
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">The Story</h5>
              <p className="text-lg font-black text-neutral-900 leading-tight">
                {product.description}
              </p>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Item Gallery</h5>
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{product.images.length} Photos</span>
               </div>
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {product.images.map((img, i) => (
                    <button 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); setCurrentImg(i); }}
                      className={`relative w-28 h-36 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${i === currentImg ? 'border-[#830e4c] scale-105 shadow-md' : 'border-transparent opacity-60'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               <h5 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Category & Style</h5>
               <div className="flex flex-wrap gap-2">
                  <div className="bg-rose-50 px-4 py-2.5 rounded-full flex items-center gap-2 border border-rose-100">
                    <Star size={12} className="text-[#830e4c]" fill="currentColor" />
                    <span className="text-[11px] font-black text-[#830e4c] uppercase tracking-widest">{product.category}</span>
                  </div>
                  <div className="bg-indigo-50 px-4 py-2.5 rounded-full flex items-center gap-2 border border-indigo-100">
                    <ShieldCheck size={12} className="text-indigo-500" />
                    <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Inspected</span>
                  </div>
               </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Current location</h5>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#830e4c]" />
                <p className="text-lg font-black text-neutral-900 tracking-tight">
                  {product.distance !== 'Unknown' && product.distance !== 'UNKNOWN' ? `${product.distance} ` : ''}
                  {product.vendor.location}
                </p>
              </div>
            </div>

            {/* Seller Quick View */}
            <div className="pt-4">
              <button 
                onClick={(e) => { e.stopPropagation(); onShowDetail(product); }}
                className="w-full bg-neutral-50 rounded-[4rem] p-4 flex items-center gap-5 border border-neutral-100 shadow-sm transition-all active:scale-[0.98]"
              >
                 <div className="shrink-0 relative">
                   <img src={product.vendor.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover shadow-md border-2 border-white" />
                   <div className="absolute -bottom-1 -right-1 bg-[#29B3F0] p-1 rounded-full text-white shadow-lg border border-white">
                      <ShieldCheck size={10} fill="currentColor" />
                   </div>
                 </div>
                 <div className="flex-1 text-left flex flex-col gap-1">
                   <h4 className="text-base font-black text-neutral-900 uppercase tracking-tight">{product.vendor.name}</h4>
                   <div className="flex items-center gap-2">
                     <Star size={14} fill="#FFD700" className="text-[#FFD700]" />
                     <span className="text-xs font-black text-neutral-900">{product.vendor.rating.toFixed(1)}</span>
                     <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">{product.vendor.reviewCount} REVIEWS</span>
                   </div>
                 </div>
                 <ChevronRight size={20} className="text-neutral-300 mr-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Swipe Indicators */}
        <MotionDiv 
          style={{ opacity: useTransform(x, [-100, -50], [1, 0]) }}
          className="absolute top-24 right-10 border-4 border-rose-500 text-rose-500 font-black text-4xl px-4 py-2 rounded-xl rotate-12 pointer-events-none z-[110]"
        >
          PASS
        </MotionDiv>
        <MotionDiv 
          style={{ opacity: useTransform(x, [50, 100], [0, 1]) }}
          className="absolute top-24 left-10 border-4 border-emerald-500 text-emerald-500 font-black text-4xl px-4 py-2 rounded-xl -rotate-12 pointer-events-none z-[110]"
        >
          LIKE
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

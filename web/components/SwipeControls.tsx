import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X, Star, Heart, Share2 } from 'lucide-react';

interface SwipeControlsProps {
  onUndo: () => void;
  onNope: () => void;
  onStar: () => void;
  onLike: () => void;
  onShare: () => void;
  canUndo: boolean;
  disableStar?: boolean;
  disableLike?: boolean;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionButton = motion.button as any;

export const SwipeControls: React.FC<SwipeControlsProps> = ({
  onUndo, onNope, onStar, onLike, onShare, canUndo, disableStar = false, disableLike = false,
}) => {
  return (
    <div className="flex justify-center w-full pointer-events-none pb-1">
      <div className="flex items-center justify-center gap-3 pointer-events-auto px-6 py-4 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
        
        {/* Undo */}
        <MotionButton 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onUndo(); }} 
          disabled={!canUndo}
          className={`w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[#EFC47D] shadow-xl border border-white transition-opacity ${!canUndo ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}
        >
          <RotateCcw size={18} strokeWidth={3} />
        </MotionButton>

        {/* Nope */}
        <MotionButton 
          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNope(); }} 
          className="w-16 h-16 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[#F5497B] shadow-2xl border border-white"
        >
          <X size={32} strokeWidth={4} />
        </MotionButton>

        {/* Super / Send Interest */}
        <MotionButton 
          whileHover={disableStar ? {} : { scale: 1.1 }} 
          whileTap={disableStar ? {} : { scale: 0.95 }}
          onClick={(e: React.MouseEvent) => { 
            e.stopPropagation(); 
            if (!disableStar) onStar(); 
          }} 
          disabled={disableStar}
          className={`w-14 h-14 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[#830e4c] shadow-xl border border-white relative overflow-hidden transition-opacity ${disableStar ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' : 'opacity-100'}`}
        >
          <Star size={24} strokeWidth={0} fill="currentColor" />
          <div className="absolute inset-0 bg-[#830e4c] blur-xl opacity-10 rounded-full" />
        </MotionButton>

        {/* Like */}
        <MotionButton 
          whileHover={disableLike ? {} : { scale: 1.15 }} 
          whileTap={disableLike ? {} : { scale: 0.85 }}
          onClick={(e: React.MouseEvent) => { 
            e.stopPropagation(); 
            if (!disableLike) onLike(); 
          }} 
          disabled={disableLike}
          className={`w-16 h-16 flex items-center justify-center rounded-full bg-[#830e4c]/90 backdrop-blur-sm text-white shadow-[0_12px_40px_rgba(131,14,76,0.4)] border border-white/20 transition-opacity ${disableLike ? 'opacity-40 grayscale cursor-not-allowed pointer-events-none' : 'opacity-100'}`}
        >
          <Heart size={32} strokeWidth={0} fill="currentColor" />
        </MotionButton>

        {/* Share */}
        <MotionButton 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onShare(); }} 
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-neutral-900 shadow-xl border border-white"
        >
          <Share2 size={18} strokeWidth={3} />
        </MotionButton>
      </div>
    </div>
  );
};

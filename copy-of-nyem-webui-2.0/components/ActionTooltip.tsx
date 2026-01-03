
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionTooltipProps {
  label: string;
  isVisible: boolean;
  offset?: number;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const ActionTooltip: React.FC<ActionTooltipProps> = ({ label, isVisible, offset = -50 }) => (
  <AnimatePresence>
    {isVisible && (
      <MotionDiv
        initial={{ opacity: 0, y: -10, scale: 0.8 }}
        animate={{ opacity: 1, y: offset, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.8 }}
        className="absolute left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap z-50 pointer-events-none border border-white/10"
      >
        {label}
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45 border-b border-r border-white/10" />
      </MotionDiv>
    )}
  </AnimatePresence>
);

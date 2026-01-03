
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; 
  showBack?: boolean;
  onBack?: () => void;
  fullHeight?: boolean;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, showBack, onBack, fullHeight }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <MotionDiv 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          onClick={onClose}
        />
        <MotionDiv 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[210] p-6 pb-12 shadow-2xl ${fullHeight ? 'h-[92vh]' : 'max-h-[85vh]'} overflow-y-auto no-scrollbar`}
        >
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-6" />
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-3">
              {showBack && (
                <button onClick={onBack} className="p-2.5 bg-neutral-100 rounded-full text-neutral-900 active:scale-90 transition-all shadow-sm">
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
              )}
              <h3 className="text-xl font-black text-neutral-900 tracking-tighter uppercase leading-none">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2.5 bg-neutral-100 rounded-full text-neutral-400 active:scale-90 transition-all shadow-sm">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="px-1 no-scrollbar">{children}</div>
        </MotionDiv>
      </>
    )}
  </AnimatePresence>
);

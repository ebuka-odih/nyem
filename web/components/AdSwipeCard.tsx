import React from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ShoppingBag, TrendingUp, Zap, ArrowRight, Store, Sparkles } from 'lucide-react';

interface AdSwipeCardProps {
    onSwipe: (dir: 'left' | 'right' | 'up') => void;
    isTop: boolean;
    index: number;
    onAction?: () => void;
    triggerDirection: 'left' | 'right' | 'up' | null;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const AdSwipeCard: React.FC<AdSwipeCardProps> = ({
    onSwipe,
    isTop,
    index,
    onAction,
    triggerDirection
}) => {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);
    const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

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

    const handleDragEnd = (_: any, info: any) => {
        if (!isTop) return;

        const absX = Math.abs(info.offset.x);
        const absY = Math.abs(info.offset.y);
        const velocityX = Math.abs(info.velocity.x);
        const velocityY = Math.abs(info.velocity.y);

        if (absX > 100 || velocityX > 500) {
            const dir = info.offset.x > 0 ? 'right' : 'left';
            controls.start({ x: info.offset.x > 0 ? 800 : -800, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe(dir));
        } else if (info.offset.y < -150 || velocityY > 500) {
            controls.start({ y: -1000, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('up'));
        } else {
            controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
        }
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
            onDragEnd={handleDragEnd}
            className={`touch-pan-y ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        >
            <div className="relative w-full h-full bg-[#830e4c] rounded-[2.2rem] shadow-[0_20px_50px_rgba(131,14,76,0.3)] overflow-hidden flex flex-col border border-white/10">

                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-black/20 rounded-full blur-3xl" />

                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                    {/* Animated Icon Container */}
                    <div className="relative mb-8">
                        <MotionDiv
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", repeat: Infinity, repeatType: "reverse", duration: 2 }}
                            className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-[#830e4c]/20"
                        >
                            <Store size={48} className="text-[#830e4c]" strokeWidth={1.5} />
                        </MotionDiv>
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-2 rounded-xl shadow-lg z-20">
                            <TrendingUp size={16} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="space-y-6 max-w-[300px]">
                        <h2 className="text-[2.8rem] font-black text-white uppercase italic tracking-tighter leading-[0.85]">
                            Own a <br /> BUSINESS?
                        </h2>

                        <p className="text-[12px] font-black text-white uppercase tracking-[0.15em] leading-relaxed max-w-[240px] mx-auto">
                            REACH THOUSANDS OF LOCAL BUYERS <br /> IN YOUR COMMUNITY INSTANTLY.
                        </p>
                    </div>

                    <div className="mt-14 w-full px-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAction?.(); }}
                            className="w-full bg-white text-[#830e4c] py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            START DROPPING
                            <Zap size={16} fill="currentColor" />
                        </button>

                        <div className="flex items-center justify-center gap-8 mt-6">
                            <div className="flex items-center gap-2 opacity-80">
                                <Sparkles size={14} className="text-white" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">FREE LISTING</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-80">
                                <ShoppingBag size={14} className="text-white" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">VERIFIED TAGS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="bg-black/10 backdrop-blur-sm py-4 px-8 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                            <Zap size={12} className="text-white" fill="currentColor" />
                        </div>
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Nyem For Business</span>
                    </div>
                    <ArrowRight size={16} className="text-white/20" />
                </div>
            </div>
        </MotionDiv>
    );
};

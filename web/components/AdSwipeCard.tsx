import React from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ShoppingBag, Star, Zap, ChevronRight, Share2, Heart } from 'lucide-react';

interface AdSwipeCardProps {
    onSwipe: (dir: 'left' | 'right' | 'up') => void;
    isTop: boolean;
    index: number;
    triggerDirection?: 'left' | 'right' | 'up' | null;
}

const MotionDiv = motion.div as any;

export const AdSwipeCard: React.FC<AdSwipeCardProps> = ({
    onSwipe,
    isTop,
    index,
    triggerDirection
}) => {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);

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
                opacity: index > 2 ? 0 : 1 - (index * 0.15),
                transition: { type: 'spring', stiffness: 300, damping: 30 }
            });
        }
    }, [isTop, index, triggerDirection, controls, onSwipe]);

    const handleDragEnd = (_: any, info: any) => {
        if (!isTop) return;

        const absX = Math.abs(info.offset.x);
        if (absX > 100 || Math.abs(info.velocity.x) > 500) {
            const dir = info.offset.x > 0 ? 'right' : 'left';
            controls.start({ x: info.offset.x > 0 ? 800 : -800, opacity: 0, transition: { duration: 0.3 } })
                .then(() => onSwipe(dir));
        } else {
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
        }
    };

    return (
        <MotionDiv
            animate={controls}
            style={{
                x,
                rotate,
                opacity: isTop ? opacity : undefined,
                zIndex: isTop ? 50 : 50 - index,
                position: 'absolute',
                width: '100%',
                height: '100%',
                willChange: 'transform'
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: -300, right: 300 }}
            onDragEnd={handleDragEnd}
            className={`${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        >
            <div className="relative w-full h-full bg-[#830e4c] rounded-[2.2rem] shadow-[0_20px_40px_rgba(131,14,76,0.25)] overflow-hidden flex flex-col border border-white/10">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            opacity: [0.3, 0.2, 0.3]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            rotate: [0, -90, 0],
                            opacity: [0.2, 0.1, 0.2]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-[#ff1a8c]/30 to-transparent rounded-full blur-3xl"
                    />
                </div>

                <div className="relative z-10 flex-1 flex flex-col p-8 items-center justify-center text-center space-y-8">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                        <ShoppingBag size={48} className="text-[#830e4c]" />
                    </div>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                            <Star size={12} className="text-yellow-400" fill="currentColor" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Partner Spotlight</span>
                        </div>

                        <h2 className="text-4xl font-black text-white uppercase leading-[0.9] tracking-tighter italic">
                            Empower <br /> Small <br /> Businesses
                        </h2>
                    </div>

                    <p className="text-white/80 text-sm font-bold leading-relaxed max-w-[240px]">
                        Did you know? Every swap on Nyem supports local artisans and micro-businesses. Grow together, swap better.
                    </p>

                    <div className="pt-4 grid grid-cols-2 gap-4 w-full">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <Zap size={20} className="text-yellow-400 mb-2" fill="currentColor" />
                            <div className="text-[10px] font-black text-white uppercase tracking-tighter">Fast Growth</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <Heart size={20} className="text-rose-400 mb-2" fill="currentColor" />
                            <div className="text-[10px] font-black text-white uppercase tracking-tighter">Community</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 p-6 bg-black/20 backdrop-blur-xl border-t border-white/10">
                    <button className="w-full bg-white text-[#830e4c] rounded-2xl py-4 flex items-center justify-center gap-3 font-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all">
                        Start Supporting Now
                        <ChevronRight size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </MotionDiv>
    );
};

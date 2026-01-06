import React from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ArrowLeftRight, ChevronRight, Zap } from 'lucide-react';

interface WelcomeCardProps {
    onSwipe: (dir: 'left' | 'right' | 'up') => void;
    isTop: boolean;
    index: number;
    triggerDirection: 'left' | 'right' | 'up' | null;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const WelcomeCard: React.FC<WelcomeCardProps> = ({
    onSwipe,
    isTop,
    index,
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
            <div className="w-full h-full flex flex-col rounded-[2.2rem] overflow-hidden bg-[#830e4c] shadow-2xl shadow-[#830e4c]/20 border border-white/10 relative">

                {/* Decorative background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
                </div>

                {/* Main Content */}
                <div className="relative flex-1 flex flex-col justify-center px-8 py-10">

                    {/* Branding */}
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#830e4c] shadow-lg">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase italic text-white leading-none">
                            Nyem <span className="text-white/70 ml-1">Marketplace</span>
                        </span>
                    </div>

                    {/* Headline */}
                    <div className="mb-8 text-center">
                        <h1 className="text-[32px] font-black text-white leading-[1.1] tracking-tighter uppercase italic mb-4">
                            Swipe right <br /> on things you like
                        </h1>
                        <p className="text-white/70 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                            See something you want? Swipe right to show interest. The seller gets notified instantly.
                        </p>
                    </div>

                    {/* Visual hint */}
                    <div className="flex items-center justify-center gap-6 mb-8">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                                <span className="text-3xl">👈</span>
                            </div>
                            <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">Pass</span>
                        </div>

                        <ArrowLeftRight size={24} className="text-white/20" />

                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-2">
                                <span className="text-3xl">👉</span>
                            </div>
                            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Interested</span>
                        </div>
                    </div>

                    {/* Simple instruction */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <p className="text-white text-xs font-black uppercase tracking-widest leading-relaxed text-center">
                            Browse items from people nearby. Swipe up to show high interest!
                        </p>
                    </div>
                </div>

                {/* Bottom CTA hint */}
                <div className="relative px-8 pb-8">
                    <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                        <span>Swipe to continue</span>
                        <ChevronRight size={14} className="animate-pulse" />
                    </div>
                </div>
            </div>
        </MotionDiv>
    );
};

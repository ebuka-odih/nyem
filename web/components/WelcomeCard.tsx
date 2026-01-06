import React from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Zap, Heart, X, Star, ChevronRight, Sparkles, Navigation, MapPin } from 'lucide-react';

interface WelcomeCardProps {
    onSwipe: (dir: 'left' | 'right' | 'up') => void;
    isTop: boolean;
    index: number;
    triggerDirection: 'left' | 'right' | 'up' | null;
}

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
        if (info.offset.x > 100) controls.start({ x: 800, opacity: 0 }).then(() => onSwipe('right'));
        else if (info.offset.x < -100) controls.start({ x: -800, opacity: 0 }).then(() => onSwipe('left'));
        else if (info.offset.y < -150) controls.start({ y: -1000, opacity: 0 }).then(() => onSwipe('up'));
        else controls.start({ x: 0, y: 0, rotate: 0 });
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
            drag={isTop ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            className={`touch-pan-y ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        >
            <div className="relative w-full h-full bg-white rounded-[2.8rem] shadow-[0_30px_70px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col border border-neutral-100/50">

                {/* Animated Background Gradients */}
                <div className="absolute top-[-20%] left-[-20%] w-full h-full bg-[#830e4c]/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-full h-full bg-indigo-500/5 rounded-full blur-[100px]" />

                <div className="flex-1 flex flex-col p-7 sm:p-9 relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-8">
                        <div className="w-11 h-11 bg-[#830e4c] rounded-xl flex items-center justify-center text-white shadow-xl shadow-[#830e4c]/20">
                            <Zap size={22} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase italic leading-none">Welcome</h2>
                            <p className="text-[10px] font-black text-[#830e4c] uppercase tracking-[0.2em] mt-1.5 opacity-80">To Nyem Marketplace</p>
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        <h1 className="text-[38px] font-black text-neutral-900 tracking-tighter uppercase italic leading-[0.85]">
                            Let's get you <br /> <span className="text-[#830e4c]">Started.</span>
                        </h1>

                        <div className="space-y-5">
                            {/* Tutorial Items */}
                            <div className="flex items-center gap-7">
                                <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 shadow-sm">
                                    <X size={22} strokeWidth={3} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[13px] font-black text-neutral-900 uppercase tracking-tight">Swipe Left</h4>
                                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.1em] mt-0.5">To pass on items you don't like</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-7">
                                <div className="w-11 h-11 rounded-full bg-[#830e4c]/5 flex items-center justify-center text-[#830e4c] shrink-0 border border-[#830e4c]/10 shadow-sm">
                                    <Heart size={20} fill="currentColor" strokeWidth={0} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[13px] font-black text-neutral-900 uppercase tracking-tight">Swipe Right</h4>
                                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.1em] mt-0.5">LIKE AND SAVE ITEM TO WISHLIST</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-7">
                                <div className="w-11 h-11 rounded-full bg-[#830e4c]/5 flex items-center justify-center text-[#830e4c] shrink-0 border border-[#830e4c]/10 shadow-sm">
                                    <Star size={20} fill="currentColor" strokeWidth={0} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[13px] font-black text-neutral-900 uppercase tracking-tight">Swipe Up</h4>
                                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.1em] mt-0.5">To notify seller immediately</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1" />

                    {/* Footer group pushed up */}
                    <div className="mt-auto space-y-6 pb-12">
                        {/* Prompt to begin */}
                        <div className="bg-neutral-50/80 backdrop-blur-sm rounded-3xl p-5 flex items-center justify-between border border-neutral-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#830e4c] shadow-md animate-bounce">
                                    <Navigation size={20} fill="currentColor" className="rotate-[25deg]" />
                                </div>
                                <span className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">Try it now</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#830e4c]">
                                <ChevronRight size={20} strokeWidth={4} />
                                <ChevronRight size={20} strokeWidth={4} className="opacity-40" />
                                <ChevronRight size={20} strokeWidth={4} className="opacity-10" />
                            </div>
                        </div>

                        {/* Integrated Footer info */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <Sparkles size={13} className="text-[#830e4c]" />
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic opacity-80">Happy Discovering</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </MotionDiv>
    );
};


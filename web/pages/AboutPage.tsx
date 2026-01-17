import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    ShieldCheck,
    Building2,
    Globe,
    Info,
    ChevronLeft,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 25 }
    }
};

export const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col no-scrollbar overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-4 flex items-center justify-between border-b border-neutral-100">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-neutral-100 rounded-2xl text-neutral-900 active:scale-90 transition-all shrink-0"
                >
                    <ChevronLeft size={20} strokeWidth={3} />
                </button>
                <span className="text-sm font-black text-neutral-900 uppercase tracking-[0.2em]">About Us</span>
                <div className="w-12 h-12" /> {/* Spacer */}
            </header>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="flex flex-col items-center px-8 pt-[calc(env(safe-area-inset-top,0px)+100px)] pb-12 overflow-y-auto no-scrollbar"
            >
                {/* Branding Section */}
                <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-12 w-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-16 h-16 bg-[#830e4c] rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-[#830e4c33]">
                            <Zap size={32} fill="currentColor" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-neutral-900 tracking-tighter uppercase italic leading-[0.85] mb-4">
                        What is <br /> Nyem?
                    </h1>

                    <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[280px] leading-relaxed">
                        Revolutionizing how communities connect, trade, and grow together.
                    </p>
                </motion.div>

                {/* Content Section */}
                <div className="w-full max-w-sm space-y-8">
                    <motion.section variants={itemVariants} className="space-y-4">
                        <h3 className="text-xs font-black text-[#830e4c] uppercase tracking-[0.3em] flex items-center gap-2">
                            <Info size={14} strokeWidth={3} /> Our Mission
                        </h3>
                        <p className="text-sm font-medium text-neutral-600 leading-relaxed">
                            Nyem is a dynamic hyper-local marketplace designed to empower individuals and small businesses within communities. We provide a seamless platform for buying, selling, hiring services, and swapping items—eliminating barriers to local commerce.
                        </p>
                    </motion.section>

                    <motion.section variants={itemVariants} className="space-y-4 pt-4 border-t border-neutral-50">
                        <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Building2 size={14} strokeWidth={3} /> Legal & Identity
                        </h3>
                        <div className="bg-neutral-50 rounded-[2.5rem] p-6 space-y-6 border border-neutral-100 shadow-sm">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Parent Company</p>
                                <h4 className="text-base font-black text-neutral-900 uppercase tracking-tight">E.E COLLECTIVES LTD</h4>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Registration Number</p>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base font-black text-neutral-900 tracking-[0.1em]">8989078</h4>
                                    <ShieldCheck size={18} className="text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Official Website</p>
                                <div className="flex items-center gap-2 text-[#830e4c]">
                                    <Globe size={14} />
                                    <a href="https://www.nyem.online" target="_blank" rel="noopener noreferrer" className="text-sm font-black uppercase tracking-tight">www.nyem.online</a>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                            Nyem operates as a flagship digital product under E.E COLLECTIVES LTD, a registered entity dedicated to innovative community solutions.
                        </p>
                    </motion.section>

                    <motion.section variants={itemVariants} className="space-y-6 pt-6">
                        <div className="bg-[#830e4c] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#830e4c33]">
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-4">
                                Join the <br /> Ecosystem
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-relaxed mb-8">
                                Whether you're a seller, a service provider, or looking for a great deal, Nyem is your home.
                            </p>
                            <button
                                onClick={() => navigate('/discover')}
                                className="w-full bg-white text-[#830e4c] py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                Go to Discover
                                <ArrowRight size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.section>
                </div>

                {/* Bottom Footer */}
                <motion.div variants={itemVariants} className="mt-16 text-center space-y-4">
                    <p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.3em]">
                        &copy; {new Date().getFullYear()} E.E COLLECTIVES LTD. <br /> All Rights Reserved.
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, Zap, X, ChevronRight, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstructionsModal: React.FC<{ onClose: () => void; platform: 'ios' | 'android' }> = ({ onClose, platform }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-sm bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl p-8 pt-10 overflow-hidden"
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-neutral-100 rounded-full sm:hidden" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-neutral-50 rounded-xl text-neutral-400 active:scale-90 transition-all"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-[#830e4c1a] rounded-[2rem] flex items-center justify-center text-[#830e4c] relative">
                        <Zap size={32} fill="currentColor" />
                        <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border border-neutral-100">
                            <PlusSquare size={16} className="text-[#830e4c]" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-neutral-900 uppercase italic tracking-tight">Install Nyem</h3>
                        <p className="text-xs font-medium text-neutral-500 max-w-[240px] leading-relaxed mx-auto">
                            Add Nyem to your home screen for a fast, native app experience.
                        </p>
                    </div>

                    <div className="w-full space-y-3 mt-4">
                        {platform === 'ios' ? (
                            <>
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#830e4c] flex-shrink-0">
                                        <Share size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-neutral-900 uppercase tracking-wider">Step 1</span>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Tap the 'Share' button in Safari</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#830e4c] flex-shrink-0">
                                        <PlusSquare size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-neutral-900 uppercase tracking-wider">Step 2</span>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Select 'Add to Home Screen'</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#830e4c] flex-shrink-0">
                                    <Download size={16} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-neutral-900 uppercase tracking-wider">Instructions</span>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Click the 'Install' button or use the browser menu (three dots) to select 'Install App'.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-[#830e4c] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#830e4c4d] active:scale-95 transition-all mt-4"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export const PWAInstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // 1. Check if already installed
        const standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone;
        setIsStandalone(!!standalone);

        if (standalone) return;

        // 2. Check if user dismissed it this session
        const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
        if (isDismissed) return;

        // 3. Detect Platform
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isIOS) {
            setPlatform('ios');
            setShowBanner(true);
        } else if (isMobile) {
            setPlatform('android');
            setShowBanner(true);

            const handleBeforeInstallPrompt = (e: any) => {
                e.preventDefault();
                setDeferredPrompt(e);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
    }, []);

    const handleBannerClick = () => {
        if (platform === 'ios') {
            setShowInstructions(true);
        } else if (platform === 'android' && deferredPrompt) {
            handleInstallClick();
        } else {
            setShowInstructions(true);
        }
    };

    const handleInstallClick = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        } else {
            setShowInstructions(true);
        }
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowBanner(false);
        sessionStorage.setItem('pwa_banner_dismissed', 'true');
    };

    // Brand fallback for desktop or already installed
    if (isStandalone || !showBanner) {
        return (
            <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 sm:w-9 h-9 bg-[#830e4c] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#830e4c1a]">
                    <Zap size={16} className="sm:size-[18px]" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-black tracking-tight uppercase italic text-[#830e4c] leading-none">
                        Nyem <span className="text-[#830e4c]/70 ml-1">Marketplace</span>
                    </span>
                </div>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onClick={handleBannerClick}
                        className="flex-1 bg-gradient-to-r from-[#830e4c] to-[#a0125d] rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-lg shadow-[#830e4c2a] min-w-0 border border-white/10 relative overflow-hidden cursor-pointer"
                    >
                        {/* Background Sparkle Effect */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />

                        <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0 backdrop-blur-md">
                                {platform === 'ios' ? <Apple size={16} strokeWidth={3} className="sm:size-[18px]" /> : <Download size={16} strokeWidth={3} className="sm:size-[18px]" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider leading-none mb-1 shadow-sm">Install Nyem App</span>
                                <p className="text-[8px] sm:text-[9px] font-bold text-white/80 truncate uppercase tracking-widest leading-none">
                                    {platform === 'ios' ? 'Instructions for iOS Safari' : 'Tap to unlock full experience'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 relative z-10">
                            <div className="flex items-center gap-1.5 text-white bg-white/10 px-2.5 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none mr-1">Setup</span>
                                <ChevronRight size={14} strokeWidth={3} className="opacity-60" />
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="p-1.5 text-white/40 hover:text-white transition-colors active:scale-90"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showInstructions && (
                    <PWAInstructionsModal
                        platform={platform === 'ios' ? 'ios' : 'android'}
                        onClose={() => setShowInstructions(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

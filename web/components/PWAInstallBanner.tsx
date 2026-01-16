import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

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
            // On Android, we show it even if beforeinstallprompt hasn't fired yet
            // but we use the event if it arrives.
            setShowBanner(true);

            const handleBeforeInstallPrompt = (e: any) => {
                e.preventDefault();
                setDeferredPrompt(e);
                console.log('[PWA] Native install prompt captured');
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        } else {
            // Generic instructions if native prompt isn't ready
            alert("To install: Tap your browser settings (three dots) and select 'Install' or 'Add to Home Screen'.");
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 bg-gradient-to-r from-[#830e4c] to-[#a0125d] rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-lg shadow-[#830e4c2a] min-w-0 border border-white/10 relative overflow-hidden"
            >
                {/* Background Sparkle Effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />

                <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0 backdrop-blur-md">
                        <Download size={16} strokeWidth={3} className="sm:size-[18px]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider leading-none mb-1 shadow-sm">Save to Home Screen</span>
                        <p className="text-[8px] sm:text-[9px] font-bold text-white/80 truncate uppercase tracking-widest leading-none">
                            {platform === 'ios' ? 'Tap Share > Add to Home' : 'Unlock full app experience'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 relative z-10">
                    {platform === 'ios' ? (
                        <div className="flex items-center gap-1.5 text-white bg-white/10 px-2 py-1.5 rounded-xl backdrop-blur-sm border border-white/5">
                            <Share size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black opacity-60">+</span>
                            <PlusSquare size={12} strokeWidth={3} />
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="bg-white text-[#830e4c] px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex-shrink-0 active:scale-95 transition-all shadow-md"
                        >
                            {deferredPrompt ? 'Install' : 'Add'}
                        </button>
                    )}

                    <button
                        onClick={handleDismiss}
                        className="p-1.5 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

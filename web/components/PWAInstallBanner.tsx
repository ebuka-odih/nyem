import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

    useEffect(() => {
        // Detect if already installed/standalone
        const standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone;
        setIsStandalone(!!standalone);

        // Detect platform
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        if (isIOS) {
            setPlatform('ios');
            if (!standalone) setShowBanner(true);
        } else {
            setPlatform('android');

            const handleBeforeInstallPrompt = (e: any) => {
                e.preventDefault();
                setDeferredPrompt(e);
                if (!standalone) setShowBanner(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    // If already installed, show the normal brand but more compact
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
                className="flex-1 bg-gradient-to-r from-[#830e4c] to-[#a0125d] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-lg shadow-[#830e4c2a] min-w-0 border border-white/10"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0 backdrop-blur-sm">
                        <Download size={18} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-white uppercase tracking-wider leading-none mb-1 shadow-sm">Add to Home Screen</span>
                        <p className="text-[9px] font-bold text-white/80 truncate uppercase tracking-widest leading-none">
                            {platform === 'ios' ? 'Tap Share > Add to Home Screen' : 'Unlock full app experience'}
                        </p>
                    </div>
                </div>

                {platform === 'ios' ? (
                    <div className="flex items-center gap-2 text-white bg-white/10 px-2.5 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                        <Share size={14} strokeWidth={2.5} />
                        <span className="text-[12px] font-black opacity-60">+</span>
                        <PlusSquare size={14} strokeWidth={2.5} />
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-[#830e4c] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex-shrink-0 active:scale-95 transition-all shadow-md hover:shadow-lg"
                    >
                        {deferredPrompt ? 'Install' : 'Open'}
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

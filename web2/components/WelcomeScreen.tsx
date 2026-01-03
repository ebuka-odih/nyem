import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ShoppingBag, Briefcase, RefreshCw, ArrowRight } from 'lucide-react';
import { InstallPromptDialog } from './InstallPromptDialog';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignUp?: () => void;
}

// Check if app is already installed (standalone mode)
const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Detect if device is mobile
const isMobile = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSignUp }) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile()) {
      return;
    }

    // Don't show if already installed
    if (isStandalone()) {
      return;
    }

    // Check if user has already dismissed the prompt
    const hasSeenPrompt = localStorage.getItem('nyem-install-prompt-dismissed');
    if (hasSeenPrompt) {
      return;
    }

    // Show prompt after a short delay (2 seconds) to not interrupt the welcome experience
    const timer = setTimeout(() => {
      setShowInstallPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleCloseInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Remember that user dismissed the prompt (don't show again)
    localStorage.setItem('nyem-install-prompt-dismissed', 'true');
  };

  return (
    <div 
      className="flex flex-col h-full w-full min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: '#880e4f',
        backgroundImage: 'linear-gradient(135deg, #880e4f 0%, #751043 50%, #5c0d35 100%)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles for depth */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-white/3 blur-3xl" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col flex-1 relative z-10">
        
        {/* Hero Section */}
        <div className="shrink-0 flex flex-col items-center px-6 pt-14 pb-8">
          
          {/* Logo - using transform to scale and reduce visible padding */}
          <div className="animate-[fadeIn_0.6s_ease-out] mb-6">
            <img 
              src="/img/logo.png" 
              alt="Nyem Logo" 
              className="h-16 w-auto object-contain drop-shadow-2xl transform scale-[1.4] origin-center"
            />
          </div>

          {/* Tagline */}
          <h1 className="text-white text-2xl font-bold tracking-wide text-center animate-[fadeIn_0.6s_ease-out_0.1s_both] mb-3">
            Your Local Marketplace
          </h1>

          {/* Description */}
          <p className="text-white/70 text-center text-sm leading-relaxed max-w-xs animate-[fadeIn_0.4s_ease-out_0.2s_both]">
            Connect with your community to buy, sell, trade, and hire — all in one app.
          </p>
        </div>

        {/* Features & CTA Section - Takes remaining space */}
        <div className="flex-1 bg-white rounded-t-[2rem] px-6 pt-6 pb-6 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] animate-[slideUp_0.5s_ease-out_0.2s_both] flex flex-col">

          {/* Feature Pills */}
          <div className="flex flex-col gap-3 mb-6">
            
            {/* Marketplace Feature */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand/5 border border-brand/8">
              <div className="w-11 h-11 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <ShoppingBag size={20} className="text-brand" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Marketplace</h3>
                <p className="text-gray-500 text-xs">Buy & sell from local sellers</p>
              </div>
            </div>

            {/* Services Feature */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand/5 border border-brand/8">
              <div className="w-11 h-11 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <Briefcase size={20} className="text-brand" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Services</h3>
                <p className="text-gray-500 text-xs">Hire skilled professionals nearby</p>
              </div>
            </div>

            {/* Swap Feature */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand/5 border border-brand/8">
              <div className="w-11 h-11 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="text-brand" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Swap</h3>
                <p className="text-gray-500 text-xs">Trade items — no cash needed</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-3 animate-[fadeIn_0.4s_ease-out_0.7s_both]">
            <Button 
              fullWidth 
              onClick={onGetStarted} 
              className="py-3.5 text-base font-bold rounded-2xl shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group"
            >
              <span>Start Exploring</span>
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Create Account Link */}
          <p className="mt-4 text-center text-sm text-gray-500 animate-[fadeIn_0.4s_ease-out_0.75s_both]">
            Ready to join? <button onClick={onSignUp || onGetStarted} className="text-brand font-semibold hover:underline">Create an account</button>
          </p>

          {/* Legal Footer */}
          <div className="mt-6 text-center animate-[fadeIn_0.4s_ease-out_0.8s_both]">
            <p className="text-xs text-gray-400 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#" className="text-brand font-semibold hover:underline underline-offset-2">
                Terms of Use
              </a>{' '}
              and{' '}
              <a href="#" className="text-brand font-semibold hover:underline underline-offset-2">
                Privacy Policy
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Install Prompt Dialog */}
      <InstallPromptDialog
        isOpen={showInstallPrompt}
        onClose={handleCloseInstallPrompt}
      />
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, PlusCircle, MessageSquare, User } from 'lucide-react';

type PageType = 'discover' | 'upload' | 'matches' | 'profile';
type AuthState = 'welcome' | 'login' | 'register' | 'otp' | 'forgot' | 'authenticated' | 'discover';

interface BottomNavProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  authState: AuthState;
  setAuthState: (state: AuthState) => void;
  isChatOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activePage,
  setActivePage,
  authState,
  setAuthState,
  isChatOpen = false,
}) => {
  // Check if user has valid token
  const hasValidToken = localStorage.getItem('auth_token') !== null;

  // Don't show nav when chat is open
  if (isChatOpen) return null;

  const pages: PageType[] = ['discover', 'upload', 'matches', 'profile'];
  const icons = {
    discover: Compass,
    upload: PlusCircle,
    matches: MessageSquare,
    profile: User,
  };
  const labels = {
    discover: 'discover',
    upload: 'New Listing',
    matches: 'matches',
    profile: 'profile',
  };

  const handlePageClick = (page: PageType) => {
    const isProtected = page !== 'discover';
    
    if (isProtected && !hasValidToken) {
      // Show login prompt for protected pages
      setAuthState('login');
    } else {
      setActivePage(page);
      if (authState === 'discover' && hasValidToken) {
        setAuthState('authenticated');
      }
    }
  };

  const safeAreaBottom = `calc(8px + env(safe-area-inset-bottom, 0px))`;

  return (
    <nav
      className="w-full bg-white/80 backdrop-blur-xl border-t border-neutral-200/50 flex items-center justify-around"
      style={{
        paddingTop: '6px',
        paddingBottom: safeAreaBottom,
        boxShadow: '0 -1px 0 0 rgba(0, 0, 0, 0.05), 0 -4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {pages.map((page) => {
        const isActive = activePage === page;
        const Icon = icons[page];
        const label = labels[page];

        return (
          <motion.button
            key={page}
            onClick={() => handlePageClick(page)}
            className="flex flex-col items-center justify-center gap-1 relative flex-1 min-w-0 py-1"
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="relative">
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-200 ${
                  isActive ? 'text-[#830e4c]' : 'text-neutral-500'
                }`}
              />
              {isActive && (
                <motion.div
                  layoutId="activeBackground"
                  className="absolute inset-0 -z-10 bg-[#830e4c]/8 rounded-full -m-2"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.03em] leading-tight transition-all duration-200 ${
                isActive ? 'text-[#830e4c]' : 'text-neutral-500'
              }`}
            >
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#830e4c]"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};


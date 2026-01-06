import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, PlusCircle, MessageSquare, User } from 'lucide-react';

type PageType = 'discover' | 'upload' | 'matches' | 'profile';

interface BottomNavProps {
  isChatOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isChatOpen = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if user has valid token
  const hasValidToken = localStorage.getItem('auth_token') !== null;

  // Don't show nav when chat is open
  if (isChatOpen) return null;

  // Determine active page from location
  const getActivePage = (): PageType => {
    const path = location.pathname;
    if (path.startsWith('/discover')) return 'discover';
    if (path.startsWith('/upload')) return 'upload';
    if (path.startsWith('/matches')) return 'matches';
    if (path.startsWith('/profile')) return 'profile';
    return 'discover';
  };

  const activePage = getActivePage();

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

  const handlePageClick = (e: React.MouseEvent, page: PageType) => {
    const isProtected = page !== 'discover';
    
    if (isProtected && !hasValidToken) {
      e.preventDefault();
      navigate('/login', { state: { from: location } });
    }
    // Otherwise, let the Link handle navigation
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
        const path = page === 'discover' ? '/discover' : `/${page}`;

        return (
          <Link
            key={page}
            to={path}
            onClick={(e) => handlePageClick(e, page)}
            className="flex flex-col items-center justify-center gap-1 relative flex-1 min-w-0 py-1"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full h-full flex flex-col items-center justify-center"
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
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
};


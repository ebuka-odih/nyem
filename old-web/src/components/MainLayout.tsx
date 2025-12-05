import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Plus, Heart, User } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout Component
 * Provides bottom navigation and layout wrapper for authenticated pages
 * Optimized for mobile UI/UX
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/discover', icon: Flame, label: 'Discover' },
    { path: '/upload', icon: Plus, label: 'Upload' },
    { path: '/matches', icon: Heart, label: 'Matches' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E0E0E0',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          zIndex: 1000,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingTop: '8px',
            paddingBottom: '8px',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                type="button"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  padding: '8px 12px',
                  minWidth: '60px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon
                  size={22}
                  style={{
                    color: active ? '#990033' : '#999999',
                    marginBottom: '4px',
                  }}
                  fill={active && tab.path === '/upload' ? '#990033' : 'none'}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: active ? '600' : '400',
                    color: active ? '#990033' : '#999999',
                    lineHeight: '1.2',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


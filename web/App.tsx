import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Settings, Sparkles } from 'lucide-react';
import { Product, Vendor } from './types';
import { UploadPage } from './pages/UploadPage';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OtpVerificationPage } from './pages/OtpVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { SellerProfilePage } from './pages/SellerProfilePage';
import { LoginPrompt } from './components/LoginPrompt';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { SwipeControls } from './components/SwipeControls';
import { AuthLayout } from './components/AuthLayout';
import { DiscoverLayout } from './components/DiscoverLayout';
import { GeneralLayout } from './components/GeneralLayout';
import { BottomNav } from './components/BottomNav';
import { useAuth } from './hooks/useAuth';
import { useLocation as useLocationHook } from './hooks/useLocation';
import { useWishlist } from './hooks/useWishlist';
import { useServiceWorker } from './hooks/useServiceWorker';
import { getStoredUser } from './utils/api';
import { ServiceWorkerUpdate } from './components/ServiceWorkerUpdate';
import { useCategories } from './hooks/api/useCategories';
import { useWishlistQuery } from './hooks/api/useWishlist';
import { useProfile } from './hooks/api/useProfile';

// Discover Route Component
const DiscoverRoute: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const activeTab = (tab === 'services' || tab === 'barter' ? tab : 'marketplace') as 'marketplace' | 'services' | 'barter';

  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [triggerDir, setTriggerDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [hasOpenModal, setHasOpenModal] = useState(false);

  const { hasValidToken, setAuthState } = useAuth();
  const {
    showLocationModal,
    setShowLocationModal,
    currentCity,
    setCurrentCity,
    cities,
  } = useLocationHook();

  const { likedItems } = useWishlist();
  const { data: profile } = useProfile();

  const [discoverItems, setDiscoverItems] = useState<Product[]>([]);
  const [discoverHistory, setDiscoverHistory] = useState<Product[]>([]);
  const [discoverUndoLast, setDiscoverUndoLast] = useState<(() => void) | null>(null);

  const handleItemsChange = useCallback((items: Product[], history: Product[], undoLast: () => void) => {
    setDiscoverItems(items);
    setDiscoverHistory(history);
    setDiscoverUndoLast(() => undoLast);
  }, []);

  const handleModalStateChange = useCallback((hasOpenModal: boolean) => {
    setHasOpenModal(hasOpenModal);
  }, []);

  const getCurrentUserId = (): string | number | null => {
    return profile?.id || null;
  };

  const currentItemIsOwn = (): boolean => {
    if (discoverItems.length === 0) return false;
    const activeIndex = discoverItems.length - 1;
    const currentItem = discoverItems[activeIndex];
    if (!currentItem || currentItem.isAd) return false;

    const currentUserId = getCurrentUserId();
    if (!currentUserId || !currentItem.userId) return false;

    return String(currentItem.userId) === String(currentUserId);
  };

  const handleShare = async () => {
    if (discoverItems.length === 0) return;
    const currentItem = discoverItems[discoverItems.length - 1]; // Active item is at the end
    if (!currentItem) return;

    const deepLink = `${window.location.origin}/discover?item=${currentItem.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.name,
          text: `Check out this ${currentItem.name} on Nyem! It's going for ${currentItem.price}.`,
          url: deepLink
        });
      } catch (err) {
        // ignore abort
      }
    } else {
      try {
        await navigator.clipboard.writeText(deepLink);
        alert('Item link copied to clipboard!');
      } catch (e) {
        alert('Item link copied!');
      }
    }
  };

  const setActiveTab = (tab: 'marketplace' | 'services' | 'barter') => {
    const path = tab === 'marketplace' ? '/discover' : `/discover/${tab}`;
    navigate(path);
  };

  return (
    <>
      {/* ServiceWorkerUpdate moved to root */}
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={async () => {
            setShowLocationModal(false);
          }}
          onSkip={() => {
            setShowLocationModal(false);
          }}
        />
      )}
      <DiscoverLayout
        headerProps={{
          onFilter: () => setShowFilterDialog(true),
          onLocation: () => setShowLocationDialog(true),
          onWishlist: () => setShowWishlist(true),
          activeCategory,
          setActiveTab,
          activeTab,
          wishlistCount: likedItems.length
        }}
        bottomNav={<BottomNav />}
        floatingControls={activeTab === 'marketplace' && discoverItems.length > 0 && !hasOpenModal ? (
          <SwipeControls
            onUndo={() => discoverUndoLast?.()}
            onNope={() => setTriggerDir('left')}
            onStar={() => {
              if (!hasValidToken) {
                navigate('/login');
              } else {
                setTriggerDir('up');
              }
            }}
            onLike={() => {
              if (!hasValidToken) {
                navigate('/login');
              } else {
                setTriggerDir('right');
              }
            }}
            onShare={handleShare}
            canUndo={discoverHistory.length > 0}
            disableStar={currentItemIsOwn()}
            disableLike={currentItemIsOwn()}
          />
        ) : undefined}
      >
        <DiscoverPage
          activeTab={activeTab}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          currentCity={currentCity}
          setCurrentCity={setCurrentCity}
          cities={cities}
          likedItems={likedItems}
          onWishlistClick={() => setShowWishlist(true)}
          onNavigateToUpload={() => navigate('/upload')}
          hasValidToken={hasValidToken}
          onLogin={() => navigate('/login')}
          triggerDir={triggerDir}
          setTriggerDir={setTriggerDir}
          showFilterDialog={showFilterDialog}
          setShowFilterDialog={setShowFilterDialog}
          showLocationDialog={showLocationDialog}
          setShowLocationDialog={setShowLocationDialog}
          showWishlist={showWishlist}
          setShowWishlist={setShowWishlist}
          onItemsChange={handleItemsChange}
          onModalStateChange={handleModalStateChange}
        />
      </DiscoverLayout>
    </>
  );
};

// Protected Route Component - Shows LoginPrompt if not authenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const hasValidToken = localStorage.getItem('auth_token') !== null;
  const navigate = useNavigate();

  if (!hasValidToken) {
    return (
      <LoginPrompt
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
        title={`${title} Requires Login`}
        message={`Please login or register to access ${title.toLowerCase()}`}
      />
    );
  }

  return <>{children}</>;
};

// Upload Route Component
const UploadRoute: React.FC = () => {
  return (
    <>
      {/* ServiceWorkerUpdate moved to root */}
      <GeneralLayout
        title="Studio"
        rightAction={{ icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => { } }}
        bottomNav={<BottomNav />}
      >
        <ProtectedRoute title="Studio">
          <UploadPage />
        </ProtectedRoute>
      </GeneralLayout>
    </>
  );
};

// Matches Route Component
const MatchesRoute: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* ServiceWorkerUpdate moved to root */}
      <GeneralLayout
        title="Inbox"
        rightAction={{ icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => { } }}
        bottomNav={<BottomNav />}
      >
        <ProtectedRoute title="Inbox">
          <MatchesPage onChatToggle={setIsChatOpen} />
        </ProtectedRoute>
      </GeneralLayout>
    </>
  );
};

// Profile Route Component
const ProfileRoute: React.FC = () => {
  const navigate = useNavigate();
  const [forceProfileSettings, setForceProfileSettings] = useState(0);
  const { signOut } = useAuth();

  const handleProfileSettingsClick = () => {
    setForceProfileSettings(prev => prev + 1);
  };

  return (
    <>
      {/* ServiceWorkerUpdate moved to root */}
      <GeneralLayout
        title="Account"
        rightAction={{ icon: <Settings size={20} strokeWidth={2.5} />, onClick: handleProfileSettingsClick }}
        bottomNav={<BottomNav />}
      >
        <ProtectedRoute title="Account">
          <ProfilePage
            key={`profile-${forceProfileSettings}`}
            forceSettingsTab={forceProfileSettings > 0}
            onSignOut={() => {
              signOut();
              navigate('/discover');
            }}
            onNavigateToUpload={() => navigate('/upload')}
          />
        </ProtectedRoute>
      </GeneralLayout>
    </>
  );
};

// Auth Routes Component
const AuthRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    authState,
    setAuthState,
    tempUserEmail,
    setTempUserEmail,
    tempRegisterData,
    setTempRegisterData,
  } = useAuth();

  const {
    showLocationModal,
    setShowLocationModal,
    checkLocationAndShowModal
  } = useLocationHook();

  // Determine auth state from route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/welcome') setAuthState('welcome');
    else if (path === '/login') setAuthState('login');
    else if (path === '/register') setAuthState('register');
    else if (path === '/otp') setAuthState('otp');
    else if (path === '/forgot') setAuthState('forgot');
  }, [location.pathname, setAuthState]);

  return (
    <>
      {/* ServiceWorkerUpdate moved to root */}
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={async () => {
            setShowLocationModal(false);
          }}
          onSkip={() => {
            setShowLocationModal(false);
          }}
        />
      )}
      <AuthLayout>
        <AnimatePresence mode="wait">
          {authState === 'welcome' && (
            <WelcomePage
              onStart={() => navigate('/discover')}
              onLogin={() => navigate('/login')}
              onRegister={() => navigate('/register')}
            />
          )}
          {authState === 'login' && (
            <LoginPage
              onLogin={async () => {
                await checkLocationAndShowModal();
                navigate('/discover');
              }}
              onGoToRegister={() => navigate('/register')}
              onGoToForgot={() => navigate('/forgot')}
              onSkip={() => navigate('/discover')}
            />
          )}
          {authState === 'register' && (
            <RegisterPage
              onRegister={(email, name, password) => {
                setTempUserEmail(email);
                setTempRegisterData({ name, password });
                navigate('/otp');
              }}
              onGoToLogin={() => navigate('/login')}
              onSkip={() => navigate('/discover')}
            />
          )}
          {authState === 'otp' && (
            <OtpVerificationPage
              email={tempUserEmail}
              name={tempRegisterData?.name}
              password={tempRegisterData?.password}
              onVerify={async () => {
                setTempRegisterData(null);
                await checkLocationAndShowModal();
                localStorage.removeItem('has_seen_welcome_card');
                navigate('/discover');
              }}
              onBack={() => {
                setTempRegisterData(null);
                navigate('/register');
              }}
            />
          )}
          {authState === 'forgot' && (
            <ForgotPasswordPage
              onBack={() => navigate('/login')}
              onSubmit={() => navigate('/login')}
            />
          )}
        </AnimatePresence>
      </AuthLayout>
    </>
  );
};

const App = () => {
  const { hasValidToken } = useAuth();
  const {
    showLocationModal,
    setShowLocationModal,
  } = useLocationHook();

  // Service worker update handling
  const { isUpdateReady, activateUpdate } = useServiceWorker();

  // Auto-reload is now handled inside ServiceWorkerUpdate component only

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      <ServiceWorkerUpdate />
      <Routes>
        {/* Auth Routes */}
        <Route path="/welcome" element={<AuthRoutes />} />
        <Route path="/login" element={<AuthRoutes />} />
        <Route path="/register" element={<AuthRoutes />} />
        <Route path="/otp" element={<AuthRoutes />} />
        <Route path="/forgot" element={<AuthRoutes />} />

        {/* Main App Routes */}
        <Route path="/discover" element={<DiscoverRoute />} />
        <Route path="/discover/:tab" element={<DiscoverRoute />} />
        <Route path="/seller/:id" element={<SellerProfilePage />} />
        <Route path="/upload" element={<UploadRoute />} />
        <Route path="/matches" element={<MatchesRoute />} />
        <Route path="/profile" element={<ProfileRoute />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={hasValidToken ? "/discover" : "/welcome"} replace />} />
        <Route path="*" element={<Navigate to={hasValidToken ? "/discover" : "/welcome"} replace />} />
      </Routes>
    </>
  );
};

export default App;

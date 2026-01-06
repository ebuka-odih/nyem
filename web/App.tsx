import React, { useState, useEffect, useCallback } from 'react';
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
import { LoginPrompt } from './components/LoginPrompt';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { SwipeControls } from './components/SwipeControls';
import { AuthLayout } from './components/AuthLayout';
import { DiscoverLayout } from './components/DiscoverLayout';
import { GeneralLayout } from './components/GeneralLayout';
import { BottomNav } from './components/BottomNav';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useWishlist } from './hooks/useWishlist';
import { apiFetch } from './utils/api';
import { ENDPOINTS } from './constants/endpoints';

const App = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'services' | 'barter'>('marketplace');
  const [activePage, setActivePage] = useState<'discover' | 'upload' | 'matches' | 'profile'>('discover');
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [forceProfileSettings, setForceProfileSettings] = useState(0);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [triggerDir, setTriggerDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [hasOpenModal, setHasOpenModal] = useState(false);

  const {
    authState,
    setAuthState,
    tempUserEmail,
    setTempUserEmail,
    tempRegisterData,
    setTempRegisterData,
    hasValidToken,
    isAuthenticated,
    signOut
  } = useAuth();

  const {
    showLocationModal,
    setShowLocationModal,
    currentCity,
    setCurrentCity,
    cities,
    checkLocationAndShowModal
  } = useLocation();

  const { likedItems, fetchWishlist } = useWishlist();

  // Items and history are managed in DiscoverPage, but we need them here for SwipeControls
  const [discoverItems, setDiscoverItems] = useState<Product[]>([]);
  const [discoverHistory, setDiscoverHistory] = useState<Product[]>([]);
  const [discoverUndoLast, setDiscoverUndoLast] = useState<(() => void) | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch categories from backend on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await apiFetch(`${ENDPOINTS.categories}?parent=Shop`);
        const categoriesData = categoriesResponse.categories || categoriesResponse.data?.categories || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch wishlist when authenticated
  useEffect(() => {
    if (hasValidToken && (activePage === 'discover' || authState === 'discover')) {
      fetchWishlist();
    }
  }, [activePage, authState, hasValidToken, fetchWishlist]);

  const handleProfileSettingsClick = () => {
    setForceProfileSettings(prev => prev + 1);
  };

  const handleItemsChange = useCallback((items: Product[], history: Product[], undoLast: () => void) => {
    setDiscoverItems(items);
    setDiscoverHistory(history);
    setDiscoverUndoLast(() => undoLast);
  }, []);

  const handleModalStateChange = useCallback((hasOpenModal: boolean) => {
    setHasOpenModal(hasOpenModal);
  }, []);

  // Show auth pages (welcome, login, register, etc.)
  if (authState === 'welcome' || authState === 'login' || authState === 'register' || authState === 'otp' || authState === 'forgot') {
    return (
      <>
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
                onStart={() => {
                  setAuthState('discover');
                  setActivePage('discover');
                }}
                onLogin={() => setAuthState('login')}
                onRegister={() => setAuthState('register')}
              />
            )}
            {authState === 'login' && (
              <LoginPage
                onLogin={async () => {
                  await checkLocationAndShowModal();
                  setAuthState('discover');
                  setActivePage('discover');
                }}
                onGoToRegister={() => setAuthState('register')}
                onGoToForgot={() => setAuthState('forgot')}
                onSkip={() => {
                  setAuthState('discover');
                  setActivePage('discover');
                }}
              />
            )}
            {authState === 'register' && (
              <RegisterPage
                onRegister={(email, name, password) => {
                  setTempUserEmail(email);
                  setTempRegisterData({ name, password });
                  setAuthState('otp');
                }}
                onGoToLogin={() => setAuthState('login')}
                onSkip={() => {
                  setAuthState('discover');
                  setActivePage('discover');
                }}
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
                  setAuthState('discover');
                  setActivePage('discover');
                }}
                onBack={() => {
                  setTempRegisterData(null);
                  setAuthState('register');
                }}
              />
            )}
            {authState === 'forgot' && (
              <ForgotPasswordPage
                onBack={() => setAuthState('login')}
                onSubmit={() => setAuthState('login')}
              />
            )}
          </AnimatePresence>
        </AuthLayout>
      </>
    );
  }

  // Handle discover state - allow access without auth
  if (authState === 'discover' || (authState === 'authenticated' && activePage === 'discover')) {
    if (activePage !== 'discover') {
      setActivePage('discover');
    }
  }

  if (activePage === 'discover' || authState === 'discover') {
    return (
      <>
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
          bottomNav={
            <BottomNav
              activePage={activePage}
              setActivePage={setActivePage}
              authState={authState}
              setAuthState={setAuthState}
              isChatOpen={isChatOpen}
            />
          }
          floatingControls={activeTab === 'marketplace' && discoverItems.length > 0 && !hasOpenModal ? (
            <SwipeControls
              onUndo={() => discoverUndoLast?.()}
              onNope={() => setTriggerDir('left')}
              onStar={() => {
                if (!hasValidToken) {
                  setAuthState('login');
                } else {
                  setTriggerDir('up');
                }
              }}
              onLike={() => {
                if (!hasValidToken) {
                  setAuthState('login');
                } else {
                  setTriggerDir('right');
                }
              }}
              onShare={() => {
                // Share handled in DiscoverPage via handleShare
              }}
              canUndo={discoverHistory.length > 0}
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
            onNavigateToUpload={() => setActivePage('upload')}
            hasValidToken={hasValidToken}
            onLogin={() => setAuthState('login')}
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
  }

  const pageTitles = { upload: 'Studio', matches: 'Inbox', profile: 'Account' };
  const rightActions = {
    upload: { icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => { } },
    matches: { icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => { } },
    profile: { icon: <Settings size={20} strokeWidth={2.5} />, onClick: handleProfileSettingsClick }
  };

  // Show login prompt for protected pages if not authenticated
  if ((activePage === 'upload' || activePage === 'matches' || activePage === 'profile') && !hasValidToken) {
    return (
      <>
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
        <GeneralLayout
          title={pageTitles[activePage]}
          rightAction={rightActions[activePage]}
          bottomNav={
            <BottomNav
              activePage={activePage}
              setActivePage={setActivePage}
              authState={authState}
              setAuthState={setAuthState}
              isChatOpen={isChatOpen}
            />
          }
        >
          <LoginPrompt
            onLogin={() => setAuthState('login')}
            onRegister={() => setAuthState('register')}
            title={`${pageTitles[activePage]} Requires Login`}
            message={`Please login or register to access ${pageTitles[activePage].toLowerCase()}`}
          />
        </GeneralLayout>
      </>
    );
  }

  return (
    <>
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
      <GeneralLayout
        title={pageTitles[activePage]}
        rightAction={rightActions[activePage]}
        bottomNav={
          <BottomNav
            activePage={activePage}
            setActivePage={setActivePage}
            authState={authState}
            setAuthState={setAuthState}
            isChatOpen={isChatOpen}
          />
        }
      >
        {activePage === 'upload' ? (
          <UploadPage />
        ) : activePage === 'matches' ? (
          <MatchesPage onChatToggle={setIsChatOpen} />
        ) : (
          <ProfilePage
            key={`profile-${forceProfileSettings}`}
            forceSettingsTab={forceProfileSettings > 0}
            onSignOut={() => {
              signOut();
              setActivePage('discover');
            }}
            onNavigateToUpload={() => {
              setActivePage('upload');
            }}
          />
        )}
      </GeneralLayout>
    </>
  );
};

export default App;

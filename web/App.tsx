import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AppShell } from './components/AppShell';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScreenState, TabState, SwipeItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNavigationHistory } from './hooks/useNavigationHistory';
import { useSwipeToGoBack } from './hooks/useSwipeToGoBack';
import { apiFetch } from './utils/api';
import { ENDPOINTS } from './constants/endpoints';

// Lazy load all screen components for code splitting
// These will only load when needed, reducing initial bundle size
// React.lazy requires default exports, so we wrap named exports
// Add error handling for failed imports
const lazyWithErrorHandling = (importFn: () => Promise<any>) => {
  return lazy(() =>
    importFn().catch((error) => {
      console.error('[Lazy Loading] Failed to load component:', error);
      // Return a fallback component that shows an error message
      return {
        default: () => (
          <div className="flex-1 bg-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Failed to load component</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg"
              >
                Reload
              </button>
            </div>
          </div>
        ),
      };
    })
  );
};

const WelcomeScreen = lazyWithErrorHandling(() => 
  import('./components/WelcomeScreen').then(module => ({ default: module.WelcomeScreen }))
);
const SignInScreen = lazyWithErrorHandling(() => 
  import('./components/SignInScreen').then(module => ({ default: module.SignInScreen }))
);
const SignUpScreen = lazyWithErrorHandling(() => 
  import('./components/SignUpScreen').then(module => ({ default: module.SignUpScreen }))
);
const SignUpEmailOtpScreen = lazyWithErrorHandling(() => 
  import('./components/SignUpEmailOtpScreen').then(module => ({ default: module.SignUpEmailOtpScreen }))
);
const SetupProfileScreen = lazyWithErrorHandling(() => 
  import('./components/SetupProfileScreen').then(module => ({ default: module.SetupProfileScreen }))
);
const ForgotPasswordScreen = lazyWithErrorHandling(() => 
  import('./components/ForgotPasswordScreen').then(module => ({ default: module.ForgotPasswordScreen }))
);
const ResetPasswordScreen = lazyWithErrorHandling(() => 
  import('./components/ResetPasswordScreen').then(module => ({ default: module.ResetPasswordScreen }))
);
const SwipeScreen = lazyWithErrorHandling(() => 
  import('./components/SwipeScreen').then(module => ({ default: module.SwipeScreen }))
);
const UploadScreen = lazyWithErrorHandling(() => 
  import('./components/UploadScreen').then(module => ({ default: module.UploadScreen }))
);
const MatchesScreen = lazyWithErrorHandling(() => 
  import('./components/MatchesScreen').then(module => ({ default: module.MatchesScreen }))
);
const MatchRequestsScreen = lazyWithErrorHandling(() => 
  import('./components/MatchRequestsScreen').then(module => ({ default: module.MatchRequestsScreen }))
);
const ChatScreen = lazyWithErrorHandling(() => 
  import('./components/ChatScreen').then(module => ({ default: module.ChatScreen }))
);
const ProfileScreen = lazyWithErrorHandling(() => 
  import('./components/ProfileScreen').then(module => ({ default: module.ProfileScreen }))
);
const EditProfileScreen = lazyWithErrorHandling(() => 
  import('./components/EditProfileScreen').then(module => ({ default: module.EditProfileScreen }))
);
const ItemDetailsScreen = lazyWithErrorHandling(() => 
  import('./components/ItemDetailsScreen').then(module => ({ default: module.ItemDetailsScreen }))
);

// Loading fallback - shows a visible loading state
const ScreenSkeleton = () => (
  <div className="flex-1 bg-white flex items-center justify-center">
    <div className="text-gray-400">Loading...</div>
  </div>
);

// Valid screen states that don't require props
const VALID_STANDALONE_SCREENS: ScreenState[] = [
  'welcome',
  'signin',
  'signup',
  'signup_email_otp',
  'setup_profile',
  'forgot_password',
  'reset_password',
  'home',
];

// Screens that require props and should not be restored from localStorage
const SCREENS_REQUIRING_PROPS: ScreenState[] = [
  'item_details', // Requires selectedItem
  'chat', // Requires selectedConversation
  'edit_profile', // Should only be accessed from profile
  'match_requests', // Should only be accessed from matches
];

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, loginWithGoogle, refreshUser, setToken, setUser, storeToken, storeUser } = useAuth();
  
  // Detect if app was closed vs just minimized
  // Native apps: minimized apps restore state, closed apps start fresh
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    // Check if app was recently active (within last 10 seconds)
    // This indicates the app was just minimized/switched away, not fully closed
    const lastActiveTime = localStorage.getItem('app_last_active');
    const appWasClosed = localStorage.getItem('app_was_closed') === 'true';
    const now = Date.now();
    const timeSinceLastActive = lastActiveTime ? now - parseInt(lastActiveTime, 10) : Infinity;
    
    // If app was explicitly closed or inactive for more than 10 seconds, start fresh
    // This mimics native app behavior - closed apps start fresh
    if (appWasClosed || timeSinceLastActive > 10000) {
      console.log('[App] App was closed or inactive, starting fresh');
      // Clear saved state and close flag
      localStorage.removeItem('last_screen');
      localStorage.removeItem('last_tab');
      localStorage.removeItem('app_was_closed');
      return 'welcome';
    }
    
    // App was recently active (minimized), try to restore state
    const saved = localStorage.getItem('last_screen') as ScreenState;
    
    // Validate saved screen
    if (!saved) {
      return 'welcome';
    }
    
    // Don't restore screens that require props (item_details, chat, etc.)
    // These won't work on reload since props won't be available
    if (SCREENS_REQUIRING_PROPS.includes(saved)) {
      console.log('[App] Restored screen requires props, falling back to home');
      return 'home';
    }
    
    // Validate it's a known screen state
    if (!VALID_STANDALONE_SCREENS.includes(saved) && !SCREENS_REQUIRING_PROPS.includes(saved)) {
      console.warn('[App] Invalid screen state in localStorage:', saved);
      return 'welcome';
    }
    
    console.log('[App] Restoring state from minimized app:', saved);
    return saved;
  });
  
  // Handle Google OAuth callback from redirect flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    const token = urlParams.get('token');
    const newUser = urlParams.get('new_user');
    const error = urlParams.get('error');

    if (googleAuth === 'success' && token) {
      // Google OAuth callback successful
      // Store token
      setToken(token);
      storeToken(token);
      
      // Fetch user data
      apiFetch(ENDPOINTS.profile.me, { token })
        .then((res: any) => {
          const userData = res.user || res.data?.user;
          if (userData) {
            setUser(userData);
            storeUser(userData);
          }
          
          // Navigate based on new user status
          if (newUser === 'true') {
            navigateTo('setup_profile', true);
          } else {
            navigateTo('home', true);
            setActiveTab('discover');
          }
          
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((err: any) => {
          console.error('Failed to fetch user after Google auth:', err);
          alert('Authentication successful but failed to load user data. Please try again.');
        });
    } else if (error) {
      // Handle error from Google OAuth
      console.error('Google OAuth error:', error);
      alert(`Google authentication failed: ${error}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setToken, setUser, storeToken, storeUser]);
  
  // Track app visibility and closure to detect when app is minimized vs closed
  useEffect(() => {
    // Update last active time when app becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App is visible again - clear close flag and update active time
        localStorage.removeItem('app_was_closed');
        localStorage.setItem('app_last_active', Date.now().toString());
      } else {
        // App is hidden (minimized/switched away)
        // Update active time but don't mark as closed yet
        localStorage.setItem('app_last_active', Date.now().toString());
      }
    };
    
    // Update last active time periodically while app is active
    const updateActiveTime = () => {
      if (document.visibilityState === 'visible') {
        localStorage.setItem('app_last_active', Date.now().toString());
      }
    };
    
    // Mark app as closed when page is being unloaded
    const handleBeforeUnload = () => {
      // App is being closed - mark it so we start fresh on next open
      localStorage.setItem('app_was_closed', 'true');
    };
    
    const handlePageHide = (e: PageTransitionEvent) => {
      // If page is being unloaded (not just hidden), mark as closed
      // persisted = false means page is being unloaded (closed)
      // persisted = true means page is being cached (minimized)
      if (!e.persisted) {
        localStorage.setItem('app_was_closed', 'true');
      }
    };
    
    // Update on visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Update every 2 seconds while app is active
    const interval = setInterval(updateActiveTime, 2000);
    
    // Initial update
    updateActiveTime();
    
    // Listen for app closure
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      clearInterval(interval);
    };
  }, []);
  
  // Clean up invalid localStorage data on mount
  useEffect(() => {
    // Clear any invalid screen state that requires props
    const savedScreen = localStorage.getItem('last_screen') as ScreenState;
    if (savedScreen && SCREENS_REQUIRING_PROPS.includes(savedScreen)) {
      console.log('[App] Clearing invalid screen state from localStorage:', savedScreen);
      localStorage.removeItem('last_screen');
    }
  }, []);
  const [activeTab, setActiveTab] = useState<TabState>(() => {
    const saved = localStorage.getItem('last_tab');
    return (saved as TabState) || 'discover';
  });
  const [swipeTab, setSwipeTab] = useState<'Marketplace' | 'Services' | 'Swap'>('Marketplace');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedItem, setSelectedItem] = useState<SwipeItem | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  // Password reset flow state
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  // Store current index per tab to preserve position when navigating back
  const [swipeIndex, setSwipeIndex] = useState<Record<'Marketplace' | 'Services' | 'Swap', number>>({
    Marketplace: 0,
    Services: 0,
    Swap: 0,
  });
  const navigationHistory = useNavigationHistory();

  // Navigate to a new screen and track history
  const navigateTo = useCallback((screen: ScreenState, replace: boolean = false) => {
    if (replace) {
      navigationHistory.replace(screen);
    } else {
      navigationHistory.push(screen);
    }
    setCurrentScreen(screen);
    // Persist current screen for state restoration
    localStorage.setItem('last_screen', screen);
  }, [navigationHistory]);

  // Handle back navigation
  const handleGoBack = useCallback(() => {
    const previousScreen = navigationHistory.goBack();
    if (previousScreen) {
      setCurrentScreen(previousScreen);
    }
  }, [navigationHistory]);

  // Determine if swipe-to-go-back should be enabled
  // Enable for screens that can go back (not welcome/home when authenticated)
  const canGoBack = navigationHistory.canGoBack() &&
    currentScreen !== 'welcome' &&
    !(currentScreen === 'home' && isAuthenticated);

  // Enable swipe-to-go-back for appropriate screens
  useSwipeToGoBack({
    onSwipeBack: handleGoBack,
    enabled: canGoBack,
  });


  // Persist active tab changes
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('last_tab', activeTab);
    }
  }, [activeTab]);

  // Handle authentication state changes (non-blocking - runs after first render)
  useEffect(() => {
    // Don't wait for loading - render optimistically with cached state
    if (isAuthenticated) {
      // User is authenticated, show home screen with discover tab
      // setup_profile is only used for Google login users who need to complete their profile
      if (currentScreen === 'welcome' || currentScreen === 'signin' || currentScreen === 'signup_email_otp' || currentScreen === 'forgot_password' || currentScreen === 'reset_password') {
        navigationHistory.reset('home');
        setCurrentScreen('home');
        setActiveTab('discover'); // Always redirect to discover page after login
      }
    } else {
      // User is not authenticated
      // Allow browsing (home/discover) but restrict authenticated-only screens
      if (currentScreen === 'edit_profile' || currentScreen === 'match_requests' || currentScreen === 'chat') {
        navigationHistory.reset('home');
        setCurrentScreen('home');
      }
      // Don't force welcome screen - allow browsing without login
    }
  }, [isAuthenticated, currentScreen, navigationHistory]); // Removed loading dependency

  const handleBackToProfile = () => {
    navigateTo('home');
    setActiveTab('profile');
  };

  const handleItemClick = (item: SwipeItem, currentSwipeTab?: 'Marketplace' | 'Services' | 'Swap', currentIndex?: number) => {
    // Store the current swipe tab when opening item details
    if (currentSwipeTab) {
      setSwipeTab(currentSwipeTab);
      // Preserve the current index when navigating to item details
      if (currentIndex !== undefined) {
        setSwipeIndex(prev => ({
          ...prev,
          [currentSwipeTab]: currentIndex,
        }));
      }
    }
    setSelectedItem(item);
    navigateTo('item_details');
  };

  const handleLoginRequest = async (method: 'google' | 'email') => {
    if (method === 'email') {
      navigateTo('signin');
      } else if (method === 'google') {
      // Handle Google sign-in
      try {
        const result = await loginWithGoogle();
        if (result.new_user) {
          // New user - navigate to profile setup
          navigateTo('setup_profile', true);
        } else {
          // Existing user - go to home with discover tab
          navigateTo('home', true);
          setActiveTab('discover'); // Redirect to discover page after Google login
        }
      } catch (error: any) {
        console.error('Google sign-in error:', error);
        alert(error.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  // Navigate to sign up page for creating account
  const handleSignUpRequest = () => {
    navigateTo('signup');
  };

  // Navigate to forgot password flow
  const handleForgotPassword = () => {
    navigateTo('forgot_password');
  };

  // Handle forgot password email submission
  const handleForgotPasswordSubmit = (email: string) => {
    setResetPasswordEmail(email);
    navigateTo('reset_password');
  };

  // Memoize onIndexChange to prevent infinite loops
  const handleIndexChange = useCallback((index: number) => {
    setSwipeIndex(prev => ({
      ...prev,
      [swipeTab]: index,
    }));
  }, [swipeTab]);

  // Clear editItem when navigating away from upload tab
  useEffect(() => {
    if (activeTab !== 'upload' && editItem) {
      setEditItem(null);
    }
  }, [activeTab, editItem]);

  const renderMainContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <Suspense fallback={<ScreenSkeleton />}>
            <SwipeScreen
              onBack={() => navigateTo('welcome')}
              onItemClick={(item, currentTab, currentIndex) => handleItemClick(item, currentTab, currentIndex)}
              onLoginRequest={handleLoginRequest}
              onSignUpRequest={handleSignUpRequest}
              initialTab={swipeTab}
              onTabChange={setSwipeTab}
              initialIndex={swipeIndex[swipeTab]}
              onIndexChange={handleIndexChange}
            />
          </Suspense>
        );
      case 'upload':
        return (
          <Suspense fallback={<ScreenSkeleton />}>
            <UploadScreen 
              onLoginRequest={handleLoginRequest} 
              onSignUpRequest={handleSignUpRequest}
              editItem={editItem}
              onEditComplete={async () => {
                setEditItem(null);
                // Refresh user data to update items list
                await refreshUser();
                // Navigate back to profile tab to see updated items
                setActiveTab('profile');
              }}
            />
          </Suspense>
        );
      case 'matches':
        return (
          <Suspense fallback={<ScreenSkeleton />}>
            <MatchesScreen
              onNavigateToRequests={() => navigateTo('match_requests')}
              onNavigateToChat={(conversation) => {
                setSelectedConversation(conversation);
                navigateTo('chat');
              }}
              onLoginRequest={handleLoginRequest}
              onSignUpRequest={handleSignUpRequest}
            />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<ScreenSkeleton />}>
            <ProfileScreen
              onEditProfile={() => navigateTo('edit_profile')}
              onLoginRequest={handleLoginRequest}
              onSignUpRequest={handleSignUpRequest}
              onItemClick={(item) => {
                setSelectedItem(item);
                navigateTo('item_details');
              }}
              onItemEdit={(item) => {
                setEditItem(item);
                setActiveTab('upload');
              }}
              onAddItem={() => {
                setEditItem(null);
                setActiveTab('upload');
              }}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<ScreenSkeleton />}>
            <SwipeScreen
              onBack={() => navigateTo('welcome')}
              onItemClick={(item, currentTab, currentIndex) => handleItemClick(item, currentTab, currentIndex)}
              onLoginRequest={handleLoginRequest}
              onSignUpRequest={handleSignUpRequest}
              initialTab={swipeTab}
              onTabChange={setSwipeTab}
              initialIndex={swipeIndex[swipeTab]}
              onIndexChange={handleIndexChange}
            />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary>
      <AppShell>
        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative w-full overscroll-none" data-scrollable style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
        {currentScreen === 'welcome' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <WelcomeScreen 
              onGetStarted={() => navigateTo('home')} 
              onSignUp={() => navigateTo('signup')}
            />
          </Suspense>
        )}

        {currentScreen === 'signin' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <SignInScreen
              onSignIn={() => {
                navigateTo('home', true);
                setActiveTab('discover'); // Redirect to discover page after login
              }}
              onBack={handleGoBack}
              onSignUp={() => navigateTo('signup')}
              onForgotPassword={handleForgotPassword}
            />
          </Suspense>
        )}

        {currentScreen === 'signup' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <SignUpScreen
              onSignUp={(email, name, password) => {
                setSignupEmail(email);
                setSignupName(name);
                setSignupPassword(password);
                navigateTo('signup_email_otp');
              }}
              onBack={handleGoBack}
              onSignIn={() => navigateTo('signin')}
            />
          </Suspense>
        )}

        {currentScreen === 'signup_email_otp' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <SignUpEmailOtpScreen
              email={signupEmail}
              name={signupName}
              password={signupPassword}
              onVerify={(isNewUser) => {
                // After email verification, redirect directly to profile
                // User already has name, email, and password from registration
                // They can edit profile later if needed
                navigateTo('home', true);
                setActiveTab('profile');
              }}
              onBack={handleGoBack}
            />
          </Suspense>
        )}

        {currentScreen === 'forgot_password' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <ForgotPasswordScreen
              onSubmit={handleForgotPasswordSubmit}
              onBack={handleGoBack}
              onSignIn={() => navigateTo('signin')}
            />
          </Suspense>
        )}

        {currentScreen === 'reset_password' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <ResetPasswordScreen
              email={resetPasswordEmail}
              onSuccess={() => navigateTo('signin', true)}
              onBack={handleGoBack}
            />
          </Suspense>
        )}

        {currentScreen === 'setup_profile' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <SetupProfileScreen
              onComplete={() => {
                // Navigate to home and set profile tab as active
                navigateTo('home', true);
                setActiveTab('profile');
              }}
              onBack={handleGoBack}
            />
          </Suspense>
        )}

        {/* Full Screen Overlays (Hide Bottom Nav) */}
        {currentScreen === 'match_requests' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <MatchRequestsScreen onBack={handleGoBack} />
          </Suspense>
        )}

        {currentScreen === 'chat' && (
          <Suspense fallback={<ScreenSkeleton />}>
            {selectedConversation ? (
              <ChatScreen 
                conversation={selectedConversation}
                onBack={() => {
                  setSelectedConversation(null);
                  handleGoBack();
                }} 
              />
            ) : (
              // If chat screen was restored but no conversation is available, go back to home
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">No conversation selected</p>
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      navigateTo('home', true);
                    }}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            )}
          </Suspense>
        )}

        {currentScreen === 'edit_profile' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <EditProfileScreen onBack={handleBackToProfile} />
          </Suspense>
        )}

        {currentScreen === 'item_details' && (
          <Suspense fallback={<ScreenSkeleton />}>
            {selectedItem ? (
              <ItemDetailsScreen
                item={selectedItem}
                onBack={handleGoBack}
                isAuthenticated={isAuthenticated}
                onLoginPrompt={() => handleLoginRequest('email')}
                onChat={(item) => {
                  // Navigate to chat with seller
                  // For now, just go back - you can implement chat navigation later
                  navigateTo('chat');
                }}
                onItemClick={(item) => {
                  setSelectedItem(item);
                  // Stay on item_details screen, just update the item
                }}
              />
            ) : (
              // If item_details screen was restored but no item is available, go back to home
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Item not found</p>
                  <button
                    onClick={() => navigateTo('home', true)}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            )}
          </Suspense>
        )}

        {currentScreen === 'home' && (
          <div className="flex flex-col h-full w-full relative">
            {/* Content Area with minimal bottom padding for nav */}
            <div className="flex-1 overflow-y-auto relative md:pb-0" style={{
              paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))'
            }}>
              {renderMainContent()}
            </div>

            {/* Persistent Bottom Navigation - Sticky/Fixed to bottom, extends into safe area */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        )}
        </div>
      </AppShell>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

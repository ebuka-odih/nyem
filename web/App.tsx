import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AppShell } from './components/AppShell';
import { BottomNav } from './components/BottomNav';
import { ScreenState, TabState, SwipeItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNavigationHistory } from './hooks/useNavigationHistory';
import { useSwipeToGoBack } from './hooks/useSwipeToGoBack';

// Lazy load all screen components for code splitting
// These will only load when needed, reducing initial bundle size
// React.lazy requires default exports, so we wrap named exports
const WelcomeScreen = lazy(() => 
  import('./components/WelcomeScreen').then(module => ({ default: module.WelcomeScreen }))
);
const SignInScreen = lazy(() => 
  import('./components/SignInScreen').then(module => ({ default: module.SignInScreen }))
);
const SignUpScreen = lazy(() => 
  import('./components/SignUpScreen').then(module => ({ default: module.SignUpScreen }))
);
const SignUpEmailOtpScreen = lazy(() => 
  import('./components/SignUpEmailOtpScreen').then(module => ({ default: module.SignUpEmailOtpScreen }))
);
const SetupProfileScreen = lazy(() => 
  import('./components/SetupProfileScreen').then(module => ({ default: module.SetupProfileScreen }))
);
const ForgotPasswordScreen = lazy(() => 
  import('./components/ForgotPasswordScreen').then(module => ({ default: module.ForgotPasswordScreen }))
);
const ResetPasswordScreen = lazy(() => 
  import('./components/ResetPasswordScreen').then(module => ({ default: module.ResetPasswordScreen }))
);
const SwipeScreen = lazy(() => 
  import('./components/SwipeScreen').then(module => ({ default: module.SwipeScreen }))
);
const UploadScreen = lazy(() => 
  import('./components/UploadScreen').then(module => ({ default: module.UploadScreen }))
);
const MatchesScreen = lazy(() => 
  import('./components/MatchesScreen').then(module => ({ default: module.MatchesScreen }))
);
const MatchRequestsScreen = lazy(() => 
  import('./components/MatchRequestsScreen').then(module => ({ default: module.MatchRequestsScreen }))
);
const ChatScreen = lazy(() => 
  import('./components/ChatScreen').then(module => ({ default: module.ChatScreen }))
);
const ProfileScreen = lazy(() => 
  import('./components/ProfileScreen').then(module => ({ default: module.ProfileScreen }))
);
const EditProfileScreen = lazy(() => 
  import('./components/EditProfileScreen').then(module => ({ default: module.EditProfileScreen }))
);
const ItemDetailsScreen = lazy(() => 
  import('./components/ItemDetailsScreen').then(module => ({ default: module.ItemDetailsScreen }))
);

// Minimal loading fallback - just a blank screen to avoid layout shift
const ScreenSkeleton = () => <div className="flex-1 bg-white" />;

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, loginWithGoogle, refreshUser } = useAuth();
  
  // Restore state from localStorage for instant restoration
  // This allows the app to show the last viewed screen immediately
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => {
    const saved = localStorage.getItem('last_screen');
    return (saved as ScreenState) || 'welcome';
  });
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
            <ChatScreen 
              conversation={selectedConversation}
              onBack={() => {
                setSelectedConversation(null);
                handleGoBack();
              }} 
            />
          </Suspense>
        )}

        {currentScreen === 'edit_profile' && (
          <Suspense fallback={<ScreenSkeleton />}>
            <EditProfileScreen onBack={handleBackToProfile} />
          </Suspense>
        )}

        {currentScreen === 'item_details' && (
          <Suspense fallback={<ScreenSkeleton />}>
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
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

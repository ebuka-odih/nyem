import React, { useState, useEffect, useCallback } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SignInScreen } from './components/SignInScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { SignUpEmailOtpScreen } from './components/SignUpEmailOtpScreen';
import { SetupProfileScreen } from './components/SetupProfileScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { SwipeScreen } from './components/SwipeScreen';
import { UploadScreen } from './components/UploadScreen';
import { MatchesScreen } from './components/MatchesScreen';
import { MatchRequestsScreen } from './components/MatchRequestsScreen';
import { ChatScreen } from './components/ChatScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { EditProfileScreen } from './components/EditProfileScreen';
import { ItemDetailsScreen } from './components/ItemDetailsScreen';
import { BottomNav } from './components/BottomNav';
import { ScreenState, TabState, SwipeItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNavigationHistory } from './hooks/useNavigationHistory';
import { useSwipeToGoBack } from './hooks/useSwipeToGoBack';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, loginWithGoogle, refreshUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [activeTab, setActiveTab] = useState<TabState>('discover');
  const [swipeTab, setSwipeTab] = useState<'Marketplace' | 'Services' | 'Swap'>('Marketplace');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedItem, setSelectedItem] = useState<SwipeItem | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
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


  // Handle authentication state changes
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // User is authenticated, show home screen
        // Allow setup_profile to remain visible for new users to complete their profile
        if (currentScreen === 'welcome' || currentScreen === 'signin' || currentScreen === 'signup_email_otp' || currentScreen === 'forgot_password' || currentScreen === 'reset_password') {
          navigationHistory.reset('home');
          setCurrentScreen('home');
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
    }
  }, [isAuthenticated, loading, currentScreen, navigationHistory]);

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
          // Existing user - go to home
          navigateTo('home', true);
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
        return <SwipeScreen
          onBack={() => navigateTo('welcome')}
          onItemClick={(item, currentTab, currentIndex) => handleItemClick(item, currentTab, currentIndex)}
          onLoginRequest={handleLoginRequest}
          onSignUpRequest={handleSignUpRequest}
          initialTab={swipeTab}
          onTabChange={setSwipeTab}
          initialIndex={swipeIndex[swipeTab]}
          onIndexChange={handleIndexChange}
        />;
      case 'upload':
        return (
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
        );
      case 'matches':
        return <MatchesScreen
          onNavigateToRequests={() => navigateTo('match_requests')}
          onNavigateToChat={() => navigateTo('chat')}
          onLoginRequest={handleLoginRequest}
          onSignUpRequest={handleSignUpRequest}
        />;
      case 'profile':
        return (
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
        );
      default:
        return <SwipeScreen
          onBack={() => navigateTo('welcome')}
          onItemClick={(item, currentTab, currentIndex) => handleItemClick(item, currentTab, currentIndex)}
          onLoginRequest={handleLoginRequest}
          onSignUpRequest={handleSignUpRequest}
          initialTab={swipeTab}
          onTabChange={setSwipeTab}
          initialIndex={swipeIndex[swipeTab]}
          onIndexChange={handleIndexChange}
        />;
    }
  };

  return (
    // Main container with safe area support - extends to cover bottom safe area
    <div className="w-full md:max-w-md md:mx-auto md:h-[95dvh] md:my-[2.5dvh] bg-white relative overflow-visible md:overflow-hidden md:rounded-[3rem] shadow-2xl md:border-[8px] md:border-gray-900 flex flex-col safe-area-container">

      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative w-full overscroll-none" data-scrollable style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
        {currentScreen === 'welcome' && (
          <WelcomeScreen 
            onGetStarted={() => navigateTo('home')} 
            onSignUp={() => navigateTo('signup')}
          />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen
            onSignIn={() => navigateTo('home', true)}
            onBack={handleGoBack}
            onSignUp={() => navigateTo('signup')}
            onForgotPassword={handleForgotPassword}
          />
        )}

        {currentScreen === 'signup' && (
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
        )}

        {currentScreen === 'signup_email_otp' && (
          <SignUpEmailOtpScreen
            email={signupEmail}
            name={signupName}
            password={signupPassword}
            onVerify={(isNewUser) => {
              // After email verification, new users go to profile setup
              // Existing users go directly to home
              if (isNewUser) {
                navigateTo('setup_profile', true);
              } else {
                navigateTo('home', true);
              }
            }}
            onBack={handleGoBack}
          />
        )}

        {currentScreen === 'forgot_password' && (
          <ForgotPasswordScreen
            onSubmit={handleForgotPasswordSubmit}
            onBack={handleGoBack}
            onSignIn={() => navigateTo('signin')}
          />
        )}

        {currentScreen === 'reset_password' && (
          <ResetPasswordScreen
            email={resetPasswordEmail}
            onSuccess={() => navigateTo('signin', true)}
            onBack={handleGoBack}
          />
        )}

        {currentScreen === 'setup_profile' && (
          <SetupProfileScreen
            onComplete={() => navigateTo('home', true)}
            onBack={handleGoBack}
          />
        )}

        {/* Full Screen Overlays (Hide Bottom Nav) */}
        {currentScreen === 'match_requests' && (
          <MatchRequestsScreen onBack={handleGoBack} />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen onBack={handleGoBack} />
        )}

        {currentScreen === 'edit_profile' && (
          <EditProfileScreen onBack={handleBackToProfile} />
        )}

        {currentScreen === 'item_details' && (
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
          />
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
    </div>
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

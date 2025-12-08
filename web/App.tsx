
import React, { useState, useEffect, useCallback } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SignInScreen } from './components/SignInScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { SignUpPhoneScreen } from './components/SignUpPhoneScreen';
import { SignUpOtpScreen } from './components/SignUpOtpScreen';
import { SignUpEmailOtpScreen } from './components/SignUpEmailOtpScreen';
import { SetupProfileScreen } from './components/SetupProfileScreen';
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
  const { isAuthenticated, loading, loginWithGoogle } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [activeTab, setActiveTab] = useState<TabState>('discover');
  const [swipeTab, setSwipeTab] = useState<'Marketplace' | 'Services' | 'Swap'>('Marketplace');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedItem, setSelectedItem] = useState<SwipeItem | null>(null);
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
        if (currentScreen === 'welcome' || currentScreen === 'signin' || currentScreen === 'signup_phone' || currentScreen === 'signup_otp' || currentScreen === 'signup_email_otp' || currentScreen === 'setup_profile') {
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

  const handleSendOtp = (phone: string) => {
    setSignupPhone(phone);
    navigateTo('signup_otp');
  };

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

  const handleLoginRequest = async (method: 'phone_otp' | 'google' | 'email') => {
    if (method === 'phone_otp') {
      navigateTo('signup_phone');
    } else if (method === 'email') {
      navigateTo('signin');
    } else if (method === 'google') {
      // Handle Google sign-in
      try {
        const result = await loginWithGoogle();
        if (result.new_user) {
          // New user - might need to complete profile
          navigateTo('home', true);
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

  const handleSignUpRequest = () => {
    navigateTo('signup_phone');
  };

  // Memoize onIndexChange to prevent infinite loops
  const handleIndexChange = useCallback((index: number) => {
    setSwipeIndex(prev => ({
      ...prev,
      [swipeTab]: index,
    }));
  }, [swipeTab]);

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
        return <UploadScreen onLoginRequest={handleLoginRequest} onSignUpRequest={handleSignUpRequest} />;
      case 'matches':
        return <MatchesScreen
          onNavigateToRequests={() => navigateTo('match_requests')}
          onNavigateToChat={() => navigateTo('chat')}
          onLoginRequest={handleLoginRequest}
          onSignUpRequest={handleSignUpRequest}
        />;
      case 'profile':
        return <ProfileScreen
          onEditProfile={() => navigateTo('edit_profile')}
          onLoginRequest={handleLoginRequest}
          onSignUpRequest={handleSignUpRequest}
        />;
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
          <WelcomeScreen onGetStarted={() => navigateTo('home')} />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen
            onSignIn={() => navigateTo('home', true)}
            onBack={handleGoBack}
            onSignUp={() => navigateTo('signup')}
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

        {currentScreen === 'signup_phone' && (
          <SignUpPhoneScreen
            onSendOtp={handleSendOtp}
            onBack={handleGoBack}
          />
        )}

        {currentScreen === 'signup_otp' && (
          <SignUpOtpScreen
            phoneNumber={signupPhone}
            onVerify={(isNewUser) => {
              if (isNewUser) {
                navigateTo('setup_profile');
              } else {
                navigateTo('home', true);
              }
            }}
            onBack={handleGoBack}
          />
        )}

        {currentScreen === 'signup_email_otp' && (
          <SignUpEmailOtpScreen
            email={signupEmail}
            name={signupName}
            password={signupPassword}
            onVerify={(isNewUser) => {
              // After email verification, go directly to discover page
              // Profile setup is optional and can be done later
              navigateTo('home', true);
            }}
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
            onLoginPrompt={() => handleLoginRequest('phone_otp')}
            onChat={(item) => {
              // Navigate to chat with seller
              // For now, just go back - you can implement chat navigation later
              navigateTo('chat');
            }}
          />
        )}

        {currentScreen === 'home' && (
          <div className="flex flex-col h-full w-full relative">
            {/* Content Area with bottom padding for fixed nav */}
            <div className="flex-1 overflow-y-auto relative md:pb-0" style={{
              paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 1.5rem)'
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

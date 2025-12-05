
import React, { useState, useEffect, useCallback } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SignInScreen } from './components/SignInScreen';
import { SignUpPhoneScreen } from './components/SignUpPhoneScreen';
import { SignUpOtpScreen } from './components/SignUpOtpScreen';
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
  const { isAuthenticated, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [activeTab, setActiveTab] = useState<TabState>('discover');
  const [signupPhone, setSignupPhone] = useState('');
  const [selectedItem, setSelectedItem] = useState<SwipeItem | null>(null);
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
        if (currentScreen === 'welcome' || currentScreen === 'signin' || currentScreen === 'signup_phone' || currentScreen === 'signup_otp' || currentScreen === 'setup_profile') {
          navigationHistory.reset('home');
          setCurrentScreen('home');
        }
      } else {
        // User is not authenticated, show welcome screen
        if (currentScreen === 'home' || currentScreen === 'edit_profile' || currentScreen === 'item_details' || currentScreen === 'match_requests' || currentScreen === 'chat') {
          navigationHistory.reset('welcome');
          setCurrentScreen('welcome');
        }
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
  
  const handleItemClick = (item: SwipeItem) => {
      setSelectedItem(item);
      navigateTo('item_details');
  };

  const renderMainContent = () => {
      switch (activeTab) {
          case 'discover':
              return <SwipeScreen onBack={() => navigateTo('welcome')} onItemClick={handleItemClick} />;
          case 'upload':
              return <UploadScreen />;
          case 'matches':
              return <MatchesScreen 
                        onNavigateToRequests={() => navigateTo('match_requests')} 
                        onNavigateToChat={() => navigateTo('chat')}
                     />;
          case 'profile':
              return <ProfileScreen onEditProfile={() => navigateTo('edit_profile')} />;
          default:
              return <SwipeScreen onBack={() => navigateTo('welcome')} onItemClick={handleItemClick} />;
      }
  };

  return (
    // Main container with safe area support
    <div className="w-full h-[100dvh] md:max-w-md md:mx-auto md:h-[95dvh] md:my-[2.5dvh] bg-white relative overflow-visible md:overflow-hidden md:rounded-[3rem] shadow-2xl md:border-[8px] md:border-gray-900 flex flex-col safe-area-container" style={{ minHeight: 'calc(100dvh + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      
      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative w-full overscroll-none" data-scrollable style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
        {currentScreen === 'welcome' && (
          <WelcomeScreen onGetStarted={() => navigateTo('signin')} />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen 
            onSignIn={() => navigateTo('home', true)} 
            onBack={handleGoBack}
            onSignUp={() => navigateTo('signup_phone')}
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
            <ItemDetailsScreen item={selectedItem} onBack={handleGoBack} />
        )}

        {currentScreen === 'home' && (
          <div className="flex flex-col h-full w-full relative overflow-hidden">
              {/* Content Area with bottom padding for fixed nav */}
              <div className="flex-1 overflow-hidden relative pb-20 md:pb-0">
                  {renderMainContent()}
              </div>

              {/* Persistent Bottom Navigation - Fixed to bottom, extends into safe area */}
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

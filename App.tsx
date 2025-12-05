
import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [activeTab, setActiveTab] = useState<TabState>('discover');
  const [signupPhone, setSignupPhone] = useState('');
  const [selectedItem, setSelectedItem] = useState<SwipeItem | null>(null);

  const handleSendOtp = (phone: string) => {
    setSignupPhone(phone);
    setCurrentScreen('signup_otp');
  };

  const handleBackToProfile = () => {
    setCurrentScreen('home');
    setActiveTab('profile');
  };
  
  const handleItemClick = (item: SwipeItem) => {
      setSelectedItem(item);
      setCurrentScreen('item_details');
  };

  const renderMainContent = () => {
      switch (activeTab) {
          case 'discover':
              return <SwipeScreen onBack={() => setCurrentScreen('welcome')} onItemClick={handleItemClick} />;
          case 'upload':
              return <UploadScreen />;
          case 'matches':
              return <MatchesScreen 
                        onNavigateToRequests={() => setCurrentScreen('match_requests')} 
                        onNavigateToChat={() => setCurrentScreen('chat')}
                     />;
          case 'profile':
              return <ProfileScreen onEditProfile={() => setCurrentScreen('edit_profile')} />;
          default:
              return <SwipeScreen onBack={() => setCurrentScreen('welcome')} onItemClick={handleItemClick} />;
      }
  };

  return (
    // Main container 
    <div className="w-full h-[100dvh] md:max-w-md md:mx-auto md:h-[95dvh] md:my-[2.5dvh] bg-white relative overflow-hidden md:rounded-[3rem] shadow-2xl md:border-[8px] md:border-gray-900 flex flex-col">
      
      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative w-full">
        {currentScreen === 'welcome' && (
          <WelcomeScreen onGetStarted={() => setCurrentScreen('signin')} />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen 
            onSignIn={() => setCurrentScreen('home')} 
            onBack={() => setCurrentScreen('welcome')}
            onSignUp={() => setCurrentScreen('signup_phone')}
          />
        )}

        {currentScreen === 'signup_phone' && (
            <SignUpPhoneScreen 
                onSendOtp={handleSendOtp}
                onBack={() => setCurrentScreen('signin')}
            />
        )}

        {currentScreen === 'signup_otp' && (
            <SignUpOtpScreen 
                phoneNumber={signupPhone}
                onVerify={() => setCurrentScreen('setup_profile')}
                onBack={() => setCurrentScreen('signup_phone')}
            />
        )}

        {currentScreen === 'setup_profile' && (
            <SetupProfileScreen 
                onComplete={() => setCurrentScreen('home')}
                onBack={() => setCurrentScreen('signup_otp')}
            />
        )}
        
        {/* Full Screen Overlays (Hide Bottom Nav) */}
        {currentScreen === 'match_requests' && (
            <MatchRequestsScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'chat' && (
            <ChatScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'edit_profile' && (
            <EditProfileScreen onBack={handleBackToProfile} />
        )}
        
        {currentScreen === 'item_details' && (
            <ItemDetailsScreen item={selectedItem} onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'home' && (
          <div className="flex flex-col h-full w-full">
              {/* Content Area */}
              <div className="flex-1 overflow-hidden relative">
                  {renderMainContent()}
              </div>

              {/* Persistent Bottom Navigation */}
              <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

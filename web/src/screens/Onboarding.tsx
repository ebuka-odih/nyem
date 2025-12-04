import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeaderGradient } from '../components/HeaderGradient';
import { cn } from '@/lib/utils';

/**
 * Onboarding Screen
 * Matches the mobile app WelcomeScreen design exactly using ShadCN components
 */
const Onboarding = () => {
  const navigate = useNavigate();
  const headerHeight = typeof window !== 'undefined' ? window.innerHeight * 0.35 : 280;

  return (
    <div className="screen-container">
      {/* Header Gradient with Avatar - 35% of viewport height */}
      <HeaderGradient
        height={headerHeight}
        showAvatar={true}
        avatarText="N"
        title="Nyem"
        subtitle="Tinder For Barter"
      />

      {/* Content Section - White Card using ShadCN Card */}
      <Card
        className={cn(
          "flex-1 relative z-10 flex flex-col border-0 shadow-lg",
          "rounded-t-[30px] rounded-b-none"
        )}
        style={{ 
          marginTop: '-20px',
          paddingTop: '40px', 
          paddingLeft: '30px', 
          paddingRight: '30px', 
          paddingBottom: '30px',
        }}
      >
        <CardContent className="flex flex-col p-0">
          {/* Title and Subtitle */}
          <div className="text-center mb-10">
            <h2 
              className="font-bold text-textPrimary mb-3"
              style={{ fontSize: '28px', fontWeight: '700' }}
            >
              Swap. Match. Trade.
            </h2>
            <p 
              className="text-textSecondary"
              style={{ 
                fontSize: '16px', 
                lineHeight: '24px',
                paddingLeft: '20px',
                paddingRight: '20px'
              }}
            >
              Turn your unused items into something you actually want
            </p>
          </div>

          {/* Features */}
          <div className="mb-5" style={{ width: '100%' }}>
            <div className="flex items-center mb-4" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 bg-iconBackground"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '22px',
                  marginRight: '16px',
                }}
              >
                <span style={{ fontSize: '20px' }}>📱</span>
              </div>
              <span className="text-body text-textPrimary" style={{ fontWeight: '500' }}>
                Swipe to discover items
              </span>
            </div>

            <div className="flex items-center mb-4" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 bg-iconBackground"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '22px',
                  marginRight: '16px',
                }}
              >
                <span style={{ fontSize: '20px' }}>💚</span>
              </div>
              <span className="text-body text-textPrimary" style={{ fontWeight: '500' }}>
                Match with traders
              </span>
            </div>

            <div className="flex items-center mb-4" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0 bg-iconBackground"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '22px',
                  marginRight: '16px',
                }}
              >
                <span style={{ fontSize: '20px' }}>🔄</span>
              </div>
              <span className="text-body text-textPrimary" style={{ fontWeight: '500' }}>
                Trade locally
              </span>
            </div>
          </div>

          {/* Button Container */}
          <div style={{ marginTop: '24px' }}>
            <Button
              size="xl"
              className="w-full rounded-full shadow-lg hover:shadow-xl transition-all text-white border-0 focus:ring-0 focus:ring-offset-0 uppercase"
              style={{
                backgroundColor: '#990033',
                color: '#FFFFFF',
                boxShadow: '0 4px 8px rgba(153, 0, 51, 0.3)',
                border: 'none',
                outline: 'none',
                padding: '18px',
                fontWeight: '800',
                fontSize: '18px',
              }}
              onClick={() => navigate('/signin')}
            >
              GET STARTED
            </Button>
          </div>

          {/* Terms Container */}
          <div 
            className="flex flex-wrap justify-center items-center"
            style={{ 
              marginTop: '16px',
              paddingLeft: '10px', 
              paddingRight: '10px' 
            }}
          >
            <span 
              className="text-tiny text-textSecondary" 
              style={{ 
                fontSize: '12px',
                lineHeight: '18px',
                color: '#555555'
              }}
            >
              By continuing, you agree to our{' '}
            </span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Navigate to Terms of Use
                console.log('Terms of Use');
              }}
              className="text-tiny font-semibold hover:opacity-80 transition-opacity"
              style={{ 
                color: '#990033',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                lineHeight: '18px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Terms of Use
            </a>
            <span 
              className="text-tiny text-textSecondary" 
              style={{ 
                fontSize: '12px',
                lineHeight: '18px',
                color: '#555555'
              }}
            >
              {' '}and{' '}
            </span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Navigate to Privacy Policy
                console.log('Privacy Policy');
              }}
              className="text-tiny font-semibold hover:opacity-80 transition-opacity"
              style={{ 
                color: '#990033',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                lineHeight: '18px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;

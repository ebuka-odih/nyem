import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeaderGradient } from '../components/HeaderGradient';
import { OTPField } from '../components/OTPField';
import { cn } from '@/lib/utils';

/**
 * OtpVerification Screen
 * Screen for entering OTP code sent to user's phone
 */
const OtpVerification = () => {
  const [otp, setOtp] = useState('');
  const userPhone = "+234 80 123 45678";

  const handleVerify = () => {
    if (otp.length === 6) {
      // TODO: Implement OTP verification logic
      console.log('Verify OTP', otp);
    }
  };

  const handleResend = () => {
    // TODO: Implement resend OTP logic
    console.log('Resend OTP');
  };

  return (
    <div className="screen-container">
      {/* Header Gradient with Back Button */}
      <HeaderGradient
        height={160}
        showBackButton={true}
        title="Verify code"
        alignment="left"
        titleSize="small"
      />

      {/* Content Section */}
      <Card
        className={cn(
          "flex-1 relative z-10 flex flex-col border-0 shadow-lg",
          "rounded-t-[30px] rounded-b-none"
        )}
        style={{ 
          marginTop: '-20px',
          paddingTop: '48px', 
          paddingLeft: '30px', 
          paddingRight: '30px', 
          paddingBottom: '30px',
        }}
      >
        <CardContent className="flex flex-col p-0">
          {/* Subtitle */}
          <p 
            className="mb-6"
            style={{ 
              fontSize: '16px',
              color: '#222222',
              lineHeight: '24px',
              textAlign: 'left'
            }}
          >
            We sent a code to {userPhone}
          </p>

          {/* OTP Field */}
          <div className="flex items-center justify-center" style={{ marginBottom: '16px' }}>
            <OTPField length={6} value={otp} onChange={setOtp} />
          </div>

          {/* Footer */}
          <div style={{ marginTop: '8px' }}>
            <Button
              size="xl"
              className="w-full rounded-full shadow-lg hover:shadow-xl transition-all text-white border-0 focus:ring-0 focus:ring-offset-0 uppercase mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#990033',
                color: '#FFFFFF',
                boxShadow: '0 4px 8px rgba(153, 0, 51, 0.3)',
                border: 'none',
                outline: 'none',
                padding: '18px',
                fontWeight: '800',
                fontSize: '18px',
                marginBottom: '16px',
              }}
              onClick={handleVerify}
              disabled={otp.length !== 6}
            >
              VERIFY
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                className="cursor-pointer"
                style={{ 
                  background: 'none',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  color: '#222222',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Resend OTP
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpVerification;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeaderGradient } from '../components/HeaderGradient';
import { cn } from '@/lib/utils';

/**
 * PhoneEntry Screen
 * Screen for entering phone number to receive OTP
 */
const PhoneEntry = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendOTP = () => {
    if (phoneNumber.length >= 10) {
      navigate('/otp-verification');
    }
  };

  return (
    <div className="screen-container">
      {/* Header Gradient with Back Button */}
      <HeaderGradient
        height={160}
        showBackButton={true}
        title={`Enter your\nphone number`}
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
              lineHeight: '24px'
            }}
          >
            We'll send a one-time code
          </p>

          {/* Phone Input */}
          <div>
            <div 
              className="flex items-center border-b pb-3"
              style={{ 
                borderBottomColor: '#E0E0E0', 
                borderBottomWidth: '1px',
                paddingBottom: '12px'
              }}
            >
              <span 
                style={{ 
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#222222',
                  marginRight: '8px'
                }}
              >
                +234
              </span>
              <div 
                style={{ 
                  width: '1px',
                  height: '24px',
                  backgroundColor: '#E0E0E0',
                  marginRight: '8px'
                }}
              />
              <input
                type="tel"
                placeholder="8234345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="flex-1 bg-transparent border-none outline-none"
                style={{ 
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#222222',
                  padding: '4px 0',
                  outline: 'none',
                }}
              />
            </div>
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
              onClick={handleSendOTP}
              disabled={phoneNumber.length < 10}
            >
              SEND OTP
            </Button>

            <p 
              className="text-center"
              style={{ 
                fontSize: '12px',
                color: '#555555',
                marginTop: '8px'
              }}
            >
              Standard SMS rates may apply
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneEntry;

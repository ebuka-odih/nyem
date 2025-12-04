import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HeaderGradient } from '../components/HeaderGradient';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SignIn Screen
 * User authentication screen with username/phone and password
 * Matches mobile app design with bottom-border inputs
 */
const SignIn = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    // TODO: Implement sign in logic
    console.log('Sign in', { username, password });
    // Navigate to Discover page after successful login
    navigate('/discover');
  };

  return (
    <div className="screen-container">
      {/* Header Gradient with Back Button */}
      <HeaderGradient
        height={160}
        showBackButton={true}
        title={`Hello\nSign in!`}
        alignment="left"
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
          {/* Input Fields */}
          <div>
            {/* Username or Phone Field */}
            <div className="mb-6">
              <label 
                htmlFor="username" 
                className="block mb-3"
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#990033'
                }}
              >
                Username or Phone
              </label>
              <div 
                className="flex items-center border-b pb-3"
                style={{ 
                  borderBottomColor: '#E0E0E0', 
                  borderBottomWidth: '1px',
                  paddingBottom: '12px'
                }}
              >
                <input
                  id="username"
                  type="text"
                  placeholder="Joydeo@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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

            {/* Password Field */}
            <div className="mb-6">
              <label 
                htmlFor="password" 
                className="block mb-3"
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#990033'
                }}
              >
                Password
              </label>
              <div 
                className="flex items-center border-b pb-3"
                style={{ 
                  borderBottomColor: '#E0E0E0', 
                  borderBottomWidth: '1px',
                  paddingBottom: '12px'
                }}
              >
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="•••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{ 
                    fontSize: '18px',
                    fontWeight: '500',
                    color: '#222222',
                    padding: '4px 0',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    marginLeft: '8px',
                    padding: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={20} style={{ color: '#555555' }} />
                  ) : (
                    <Eye size={20} style={{ color: '#555555' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end" style={{ alignSelf: 'flex-end', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => console.log('Forgot password')}
                className="cursor-pointer"
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: '#555555',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Footer - Button moved up */}
          <div style={{ marginTop: '8px' }}>
            {/* Sign In Button */}
            <Button
              size="xl"
              className="w-full rounded-full shadow-lg hover:shadow-xl transition-all text-white border-0 focus:ring-0 focus:ring-offset-0 uppercase mb-4"
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
              onClick={handleSignIn}
            >
              SIGN IN
            </Button>

            {/* Sign Up Link */}
            <div className="flex justify-center items-center" style={{ marginTop: '24px', marginBottom: '24px' }}>
              <span 
                className="text-body"
                style={{ fontSize: '14px', color: '#555555' }}
              >
                Don't have account?{' '}
              </span>
              <button
                type="button"
                onClick={() => navigate('/phone-entry')}
                className="cursor-pointer"
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: '#990033',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Sign up
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;

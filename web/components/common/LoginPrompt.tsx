import React from 'react';
import { Lock, Mail, Chrome } from 'lucide-react';
import { Button } from '../Button';

interface LoginPromptProps {
  title?: string;
  message?: string;
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  title = 'Sign In Required',
  message = 'Please sign in to continue.',
  onLoginRequest,
  onSignUpRequest
}) => {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-brand" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {message}
        </p>
        
        {/* Login Options */}
        {onLoginRequest && (
          <div className="space-y-3">
            {/* Email Sign In - Primary Option */}
            <Button
              fullWidth
              onClick={() => onLoginRequest('email')}
              className="flex items-center justify-center space-x-3"
            >
              <Mail size={20} />
              <span>Continue with Email</span>
            </Button>
            
            {/* Google Sign In */}
            <button
              onClick={() => onLoginRequest('google')}
              className="w-full py-4 px-6 rounded-full font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center space-x-3 shadow-md"
            >
              <Chrome size={20} className="text-blue-500" />
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Sign Up Link */}
        {onSignUpRequest && (
          <div className="text-center mt-6">
            <span className="text-gray-500 text-sm">Don't have an account? </span>
            <button
              onClick={onSignUpRequest}
              className="text-brand font-semibold text-sm hover:underline transition-colors"
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


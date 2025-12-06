import React from 'react';
import { Lock, Phone, Mail, Chrome } from 'lucide-react';
import { Button } from '../Button';

interface LoginPromptProps {
  title?: string;
  message?: string;
  onLoginRequest?: (method: 'phone_otp' | 'google' | 'email') => void;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  title = 'Sign In Required',
  message = 'Please sign in to continue.',
  onLoginRequest 
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
            <Button
              fullWidth
              onClick={() => onLoginRequest('phone_otp')}
              className="flex items-center justify-center space-x-3"
            >
              <Phone size={20} />
              <span>Continue with Phone</span>
            </Button>
            
            <button
              onClick={() => onLoginRequest('google')}
              className="w-full py-4 px-6 rounded-full font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center space-x-3 shadow-md"
            >
              <Chrome size={20} className="text-blue-500" />
              <span>Continue with Google</span>
            </button>
            
            <button
              onClick={() => onLoginRequest('email')}
              className="w-full py-4 px-6 rounded-full font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center space-x-3 shadow-md"
            >
              <Mail size={20} />
              <span>Continue with Email</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


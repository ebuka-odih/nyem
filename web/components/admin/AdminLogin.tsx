import React, { useState } from 'react';
import { Button } from '../Button';
import { Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!usernameOrPhone.trim() || !password.trim()) {
        setError('Please enter both username/email/phone and password');
        setLoading(false);
        return;
      }

      // Get CSRF token first
      const csrfResponse = await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      const csrfToken = getCsrfToken();

      // Submit to backend login endpoint using form data (Laravel expects form data, not JSON)
      const formData = new FormData();
      formData.append('username_or_phone', usernameOrPhone.trim());
      formData.append('password', password);
      if (remember) {
        formData.append('remember', '1');
      }
      formData.append('_token', csrfToken);

      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        // Try to parse error response
        const text = await response.text();
        let errorMessage = 'Login failed. Please try again.';
        
        try {
          const data = JSON.parse(text);
          if (data.message) {
            errorMessage = data.message;
          } else if (data.errors && data.errors.username_or_phone) {
            errorMessage = Array.isArray(data.errors.username_or_phone) 
              ? data.errors.username_or_phone[0] 
              : data.errors.username_or_phone;
          }
        } catch {
          // If not JSON, check if it's HTML with error messages
          if (text.includes('credentials are incorrect')) {
            errorMessage = 'The provided credentials are incorrect.';
          } else if (text.includes('admin access')) {
            errorMessage = 'You do not have admin access.';
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is a redirect
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      // Redirect to admin dashboard
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin.replace(':8000', ':5173');
      window.location.href = `${frontendUrl}/admin`;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCsrfToken = (): string => {
    // Get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content') || '';
    }
    // Fallback: try to get from cookie (Laravel stores it as XSRF-TOKEN)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return '';
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand relative">
      {/* Top Section: Header */}
      <div className="px-6 pt-8 pb-8 md:pt-10 md:pb-10 shrink-0">
        <div className="mt-6 md:mt-8 mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-wide">
            Admin<br/>Login
          </h1>
          <p className="text-white/80 mt-2 text-sm">Sign in to access the admin panel</p>
        </div>
      </div>

      {/* Bottom Section: Form Card */}
      <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 flex-1 flex flex-col">
          {/* Username/Email/Phone Input */}
          <div className="flex flex-col space-y-2">
            <label className="text-brand font-bold text-sm">
              Username, Email, or Phone
            </label>
            <input 
              type="text" 
              value={usernameOrPhone}
              onChange={(e) => setUsernameOrPhone(e.target.value)}
              placeholder="admin@site.com" 
              className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
              autoFocus
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-2 relative">
            <label className="text-brand font-bold text-sm">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="........" 
                className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent pr-10 tracking-widest transition-colors rounded-none"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-3 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <label htmlFor="remember" className="text-sm text-gray-600 font-medium">
              Remember me
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              fullWidth 
              type="submit" 
              className="shadow-xl py-4 uppercase text-lg tracking-wide"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>

          {/* Spacer to push footer down if there is space */}
          <div className="flex-grow"></div>
        </form>
      </div>
    </div>
  );
};


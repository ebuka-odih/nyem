import { useState, FormEvent, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Login() {
  const { errors: pageErrors } = usePage().props as any;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get error from page props (Inertia shared errors)
  useEffect(() => {
    if (pageErrors) {
      // Extract error message
      let errorMessage: string | null = null;
      
      if (pageErrors.email) {
        errorMessage = Array.isArray(pageErrors.email) ? pageErrors.email[0] : pageErrors.email;
      } else if (pageErrors.message) {
        errorMessage = Array.isArray(pageErrors.message) ? pageErrors.message[0] : pageErrors.message;
      } else if (typeof pageErrors === 'string') {
        errorMessage = pageErrors;
      }
      
      if (errorMessage) {
        setError(String(errorMessage));
      }
    }
  }, [pageErrors]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    router.post('/login', {
      email: email.trim(),
      password,
      remember: remember ? '1' : '',
    }, {
      onError: (errors) => {
        // Extract error message
        let errorMessage: string = 'Login failed. Please check your credentials and try again.';
        
        if (errors.email) {
          errorMessage = Array.isArray(errors.email) ? errors.email[0] : String(errors.email);
        } else if (errors.message) {
          errorMessage = Array.isArray(errors.message) ? errors.message[0] : String(errors.message);
        } else if (errors.password) {
          errorMessage = Array.isArray(errors.password) ? errors.password[0] : String(errors.password);
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
        
        setError(String(errorMessage));
        setLoading(false);
      },
      onSuccess: () => {
        setLoading(false);
      },
      onFinish: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 bg-card border-border shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Login</h1>
            <p className="text-muted-foreground text-sm">Sign in to access the admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@site.com" 
                className="bg-background border-input text-foreground"
                autoFocus
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2 relative">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="bg-background border-input text-foreground pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground font-medium cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="bg-red-500/20 border-2 border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm font-medium flex items-center gap-2 shadow-lg"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  color: '#f87171'
                }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
                <span style={{ color: '#f87171', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              fullWidth 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}







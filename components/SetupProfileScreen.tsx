import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowLeft, Camera, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SetupProfileScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export const SetupProfileScreen: React.FC<SetupProfileScreenProps> = ({ onComplete, onBack }) => {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        username: username.trim(),
        city: location || undefined,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-brand relative">
        {/* Top Section: Header */}
        <div className="px-6 pt-8 pb-8 md:pt-10 md:pb-8 shrink-0">
            <button 
                onClick={onBack} 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                aria-label="Go back"
            >
                <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="mt-4 md:mt-6 mb-4 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-wide">
                    Setup your<br/>profile
                </h1>
            </div>
        </div>

        {/* Bottom Section: Form Card */}
        <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {/* Avatar Upload */}
                <div className="flex justify-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                            <User className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
                        </div>
                        <button type="button" className="absolute bottom-0 right-0 bg-brand text-white p-2.5 rounded-full shadow-md hover:bg-brand-light transition-colors z-10">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                {/* Username Input */}
                <div className="flex flex-col space-y-2 mb-6">
                    <label className="text-brand font-bold text-sm">Username</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username" 
                        className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
                    />
                </div>

                {/* Location Input */}
                 <div className="flex flex-col space-y-2 mb-10">
                    <label className="text-brand font-bold text-sm">Location</label>
                    <div className="relative">
                        <select 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="appearance-none border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none pr-8 cursor-pointer"
                        >
                            <option value="" disabled>Select your city</option>
                            <option value="lagos">Lagos, Nigeria</option>
                            <option value="abuja">Abuja, Nigeria</option>
                            <option value="london">London, UK</option>
                            <option value="new_york">New York, USA</option>
                            <option value="toronto">Toronto, Canada</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                
                {/* Submit Button */}
                <div className="mt-auto">
                     <Button 
                        fullWidth 
                        type="submit" 
                        className="shadow-xl py-4 font-extrabold text-lg tracking-wide rounded-full"
                        disabled={loading}
                     >
                        {loading ? 'Saving...' : 'Complete Setup'}
                    </Button>
                </div>

            </form>
        </div>
    </div>
  );
};
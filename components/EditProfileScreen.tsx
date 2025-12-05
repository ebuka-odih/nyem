import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Camera, ChevronDown, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EditProfileScreenProps {
  onBack: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack }) => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setCity(user.city || '');
      setBio(user.bio || '');
    }
  }, [user]);

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
        city: city || undefined,
        bio: bio || undefined,
      });
      await refreshUser();
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 flex items-center z-10 sticky top-0">
        <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
        >
            <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 ml-2">Edit Profile</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* Error Message */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Avatar Upload */}
        <div className="flex justify-center">
            <div className="relative">
                <img 
                    src={user?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random`}
                    alt="Profile Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
                />
                <button 
                    type="button"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-sm hover:bg-brand-light transition-transform active:scale-90"
                    onClick={() => alert('Photo upload coming soon!')}
                >
                    <Camera size={16} />
                </button>
            </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
            {/* Username */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Username</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
                <p className="text-xs text-gray-400 mt-2 pl-1">You can change your username once every 24 hours.</p>
            </div>

            {/* City */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">City</label>
                <div className="relative">
                    <select 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer"
                    >
                        <option value="abuja">Abuja, Nigeria</option>
                        <option value="lagos">Lagos, Nigeria</option>
                        <option value="london">London, UK</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Bio</label>
                <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..." 
                    className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
                ></textarea>
            </div>

            {/* Save Button */}
            <div className="pt-4">
                <Button 
                    fullWidth 
                    className="bg-brand hover:bg-brand-light text-white rounded-xl py-4 shadow-lg text-lg"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Change Password */}
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 text-gray-700">
                    <Lock size={18} className="text-brand" />
                    <span className="font-bold text-sm">Change Password</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </button>
        </div>
      </div>
    </div>
  );
};
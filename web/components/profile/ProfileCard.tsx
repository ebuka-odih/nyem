import React from 'react';
import { MapPin, Pencil } from 'lucide-react';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../../constants/placeholders';

interface User {
  username?: string;
  city?: string;
  bio?: string;
  profile_photo?: string;
}

interface ProfileCardProps {
  user: User | null;
  onEditProfile: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEditProfile }) => {
  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white pb-8 px-6 pt-8 mb-3 border-b border-gray-100 shadow-sm rounded-b-[2rem] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand/5 rounded-full -ml-12 -mb-12"></div>
      
      <div className="flex flex-col items-center text-center relative z-10">
        {/* Avatar with enhanced styling */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 p-1 mb-5 relative shadow-lg">
          <div className="w-full h-full rounded-full bg-white p-0.5">
            <img 
              src={(() => {
                const profilePhoto = user?.profile_photo;
                const userName = (user as any)?.name || user?.username || 'User';
                
                // Check if profile_photo exists and is not empty
                if (!profilePhoto || profilePhoto.trim() === '') {
                  return generateInitialsAvatar(userName);
                }
                // Filter out known generated avatar service URLs
                const generatedAvatarPatterns = [
                  'ui-avatars.com',
                  'pravatar.cc',
                  'i.pravatar.cc',
                  'robohash.org',
                  'dicebear.com',
                  'avatar.vercel.sh',
                ];
                const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
                  profilePhoto.toLowerCase().includes(pattern.toLowerCase())
                );
                return isGeneratedAvatar ? generateInitialsAvatar(userName) : profilePhoto;
              })()}
              onError={(e) => {
                const userName = (user as any)?.name || user?.username || 'User';
                (e.target as HTMLImageElement).src = generateInitialsAvatar(userName);
              }}
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {/* Online status indicator */}
          <div className="absolute bottom-2 right-2 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Display Name or Username */}
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
          {(user as any)?.name || user?.username || 'User'}
        </h2>
        {/* Show username if different from display name */}
        {(user as any)?.name && user?.username && (
          <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
        )}
        
        {/* Location */}
        {(user?.cityLocation?.name || user?.city || user?.city_id) && (
          <div className="flex items-center justify-center text-gray-600 text-sm font-medium mb-4 px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm">
            <MapPin size={14} className="mr-1.5 text-brand" />
            <span>
              {user?.cityLocation?.name || user?.city || 'Location not set'}
              {user?.areaLocation?.name && `, ${user.areaLocation.name}`}
            </span>
          </div>
        )}
        
        {/* Bio */}
        {user?.bio && (
          <p className="text-gray-600 text-sm max-w-[280px] leading-relaxed mb-6 px-2">
            {user.bio}
          </p>
        )}

        {/* Edit Button with enhanced styling */}
        <button 
          onClick={onEditProfile}
          className="flex items-center space-x-2 bg-gradient-to-r from-brand to-brand/90 text-white px-7 py-3 rounded-full font-bold text-sm shadow-lg shadow-brand/30 hover:shadow-xl hover:shadow-brand/40 active:scale-95 transition-all duration-200 hover:from-brand/95 hover:to-brand/85"
        >
          <Pencil size={16} strokeWidth={2.5} />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
};





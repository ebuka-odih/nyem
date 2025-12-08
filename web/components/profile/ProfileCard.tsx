import React from 'react';
import { MapPin, Pencil } from 'lucide-react';

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
    <div className="bg-white pb-8 px-6 pt-6 mb-3 border-b border-gray-100 shadow-sm rounded-b-[2rem]">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full bg-gray-100 p-1 mb-4 relative shadow-sm">
          <img 
            src={user?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random`}
            alt="Profile" 
            className="w-full h-full rounded-full object-cover border-4 border-white"
          />
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        {/* Info */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{user?.username || 'User'}</h2>
        {user?.city && (
          <div className="flex items-center text-gray-500 text-sm font-medium mb-3">
            <MapPin size={14} className="mr-1 text-brand" />
            <span>{user.city}</span>
          </div>
        )}
        
        {user?.bio && (
          <p className="text-gray-500 text-sm max-w-[250px] leading-relaxed mb-6">
            {user.bio}
          </p>
        )}

        {/* Edit Button */}
        <button 
          onClick={onEditProfile}
          className="flex items-center space-x-2 bg-brand text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-brand/20 active:scale-95 transition-transform"
        >
          <Pencil size={16} />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
};





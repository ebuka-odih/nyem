import React from 'react';
import { Heart, Users, Share2, TrendingUp } from 'lucide-react';

interface AboutTabProps {
  user: any;
}

export const AboutTab: React.FC<AboutTabProps> = ({ user }) => {
  // Mock data for likes, follows, and shares
  // In the future, these should come from the backend API
  const stats = {
    likes: (user as any)?.likes_count || 0,
    follows: (user as any)?.follows_count || 0,
    shares: (user as any)?.shares_count || 0,
  };

  const statCards = [
    {
      icon: Heart,
      label: 'Likes',
      value: stats.likes,
    },
    {
      icon: Users,
      label: 'Follows',
      value: stats.follows,
    },
    {
      icon: Share2,
      label: 'Shares',
      value: stats.shares,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-2 mx-auto">
                <Icon size={16} className="text-gray-600" />
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold text-gray-900 mb-0.5">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional User Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
            <TrendingUp size={18} className="text-brand" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Activity Summary</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-gray-600">Total Items Listed</span>
            <span className="text-sm font-bold text-gray-900">
              {((user as any)?.items_count || 0).toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-gray-600">Member Since</span>
            <span className="text-sm font-bold text-gray-900">
              {user?.created_at 
                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Recently'}
            </span>
          </div>
          
          {user?.city && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-medium text-gray-600">Location</span>
              <span className="text-sm font-bold text-gray-900">
                {user.cityLocation?.name || user.city}
                {user.areaLocation?.name && `, ${user.areaLocation.name}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bio Section (if available) */}
      {user?.bio && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
        </div>
      )}
    </div>
  );
};














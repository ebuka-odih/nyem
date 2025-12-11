import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../../constants/placeholders';

interface Match {
  id: number;
  name: string;
  message: string;
  avatar: string;
  time: string;
  unread: boolean;
}

interface MatchListProps {
  matches: Match[];
  loading: boolean;
  onMatchClick: (match: Match) => void;
}

export const MatchList: React.FC<MatchListProps> = ({ 
  matches, 
  loading, 
  onMatchClick 
}) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading matches...</div>;
  }

  if (matches.length === 0) {
    return <div className="text-center py-8 text-gray-500">No matches yet</div>;
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <button 
          key={match.id}
          onClick={() => onMatchClick(match)}
          className="w-full bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
        >
          <div className="relative mr-4 shrink-0">
            <img 
              src={(() => {
                const avatar = match.avatar;
                const name = match.name || 'User';
                if (!avatar || avatar.trim() === '') {
                  return generateInitialsAvatar(name);
                }
                // Filter out generated avatars
                const generatedAvatarPatterns = [
                  'ui-avatars.com',
                  'pravatar.cc',
                  'i.pravatar.cc',
                  'robohash.org',
                  'dicebear.com',
                  'avatar.vercel.sh',
                ];
                const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
                  avatar.toLowerCase().includes(pattern.toLowerCase())
                );
                return isGeneratedAvatar ? generateInitialsAvatar(name) : avatar;
              })()}
              alt={match.name} 
              className="w-12 h-12 rounded-full object-cover border border-gray-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = generateInitialsAvatar(match.name || 'User');
              }}
            />
            {match.unread && <div className="absolute top-0 right-0 w-3 h-3 bg-brand border-2 border-white rounded-full"></div>}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-bold text-gray-900 truncate">{match.name}</h3>
              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">{match.time}</span>
            </div>
            <p className={`text-sm truncate ${match.unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              {match.message}
            </p>
          </div>
          
          <ChevronRight size={18} className="text-gray-300 ml-2" />
        </button>
      ))}
    </div>
  );
};






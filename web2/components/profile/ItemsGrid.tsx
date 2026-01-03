import React, { useState } from 'react';
import { Eye, Pencil, MoreVertical } from 'lucide-react';
import { SwipeItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../../constants/placeholders';

interface UserItem {
  id: number;
  title: string;
  image: string;
  description?: string;
  condition?: string;
  category_id?: number;
  type?: string;
  price?: string;
  looking_for?: string;
  images?: string[];
  gallery?: string[];
}

interface ItemsGridProps {
  items: UserItem[];
  loading: boolean;
  onAddItem?: () => void;
  onItemClick?: (item: SwipeItem) => void;
  onItemEdit?: (item: UserItem) => void;
}

export const ItemsGrid: React.FC<ItemsGridProps> = ({ 
  items, 
  loading, 
  onAddItem,
  onItemClick,
  onItemEdit
}) => {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="col-span-2 text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <p className="text-gray-500 text-sm mt-3">Loading items...</p>
      </div>
    );
  }

  // Helper function to check if URL is a generated avatar
  const isGeneratedAvatar = (url: string | null | undefined): boolean => {
    if (!url || url.trim() === '') return false;
    const generatedAvatarPatterns = [
      'ui-avatars.com',
      'pravatar.cc',
      'i.pravatar.cc',
      'robohash.org',
      'dicebear.com',
      'avatar.vercel.sh',
    ];
    return generatedAvatarPatterns.some(pattern => 
      url.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Convert UserItem to SwipeItem format for viewing
  const convertToSwipeItem = (item: UserItem): SwipeItem => {
    // Use actual user profile photo, filter out generated avatars
    const profilePhoto = (user as any)?.profile_photo || null;
    const userName = (user as any)?.name || (user as any)?.username || 'You';
    const ownerImage = (profilePhoto && !isGeneratedAvatar(profilePhoto)) 
      ? profilePhoto 
      : generateInitialsAvatar(userName);
    
    const owner = {
      name: 'You',
      image: ownerImage,
      location: (user as any)?.cityLocation?.name || (user as any)?.city || '',
      distance: '',
    };

    if (item.type === 'marketplace') {
      return {
        id: item.id,
        type: 'marketplace',
        title: item.title,
        price: item.price || '₦0',
        image: item.image,
        description: item.description || '',
        category: '',
        owner,
        gallery: item.gallery || item.images || [],
      };
    } else {
      return {
        id: item.id,
        type: 'barter',
        title: item.title,
        condition: item.condition || 'used',
        image: item.image,
        description: item.description || '',
        lookingFor: item.looking_for || '',
        category: '',
        owner,
        gallery: item.gallery || item.images || [],
      };
    }
  };

  const handleItemClick = (item: UserItem, e: React.MouseEvent) => {
    // If clicking on action buttons, don't trigger item view
    if ((e.target as HTMLElement).closest('.item-actions')) {
      return;
    }
    if (onItemClick) {
      onItemClick(convertToSwipeItem(item));
    }
  };

  const handleEdit = (item: UserItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onItemEdit) {
      onItemEdit(item);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer relative group"
            onClick={(e) => handleItemClick(item, e)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* Image Container */}
            <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
              />
              
              {/* Overlay with actions on hover */}
              {hoveredItem === item.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleItemClick(item, e)}
                    className="bg-white/90 hover:bg-white text-gray-900 p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                    title="View Item"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={(e) => handleEdit(item, e)}
                    className="bg-brand hover:bg-brand/90 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                    title="Edit Item"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              )}

              {/* Price/Condition Badge */}
              {item.price && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-brand to-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                  {item.price}
                </div>
              )}
              {!item.price && item.condition && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md uppercase">
                  {item.condition}
                </div>
              )}
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-gray-900 text-sm px-1 truncate">{item.title}</h3>
          </div>
        ))
      ) : (
        <div className="col-span-2 text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">No items yet</p>
          <p className="text-gray-400 text-xs mb-4">Start by adding your first item</p>
        </div>
      )}
      
      {/* Add New Placeholder */}
      <div 
        onClick={onAddItem}
        className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-all duration-200 cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-full bg-brand/10 group-hover:bg-brand/20 flex items-center justify-center mb-2 transition-colors">
          <span className="text-2xl font-light text-brand group-hover:scale-110 transition-transform">+</span>
        </div>
        <span className="text-xs font-bold">Add Item</span>
      </div>
    </div>
  );
};





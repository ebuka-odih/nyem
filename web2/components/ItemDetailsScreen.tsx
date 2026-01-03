
import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, MessageCircle, User, Lock } from 'lucide-react';
import { SwipeItem } from '../types';
import { ItemDetails } from './item/ItemDetails';
import { OwnerInfo } from './item/OwnerInfo';
import { UserProfileScreen } from './UserProfileScreen';
import { ImageViewerModal } from './item/ImageViewerModal';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface ItemDetailsScreenProps {
    item: SwipeItem | null;
    onBack: () => void;
    isAuthenticated?: boolean;
    onLoginPrompt?: () => void;
    onChat?: (item: SwipeItem) => void;
    onItemClick?: (item: SwipeItem) => void;
}

export const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({
    item,
    onBack,
    isAuthenticated = false,
    onLoginPrompt,
    onChat,
    onItemClick,
}) => {
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Track item view when component mounts
    useEffect(() => {
        if (!item?.id) return;

        // Track view asynchronously (don't block UI)
        const trackView = async () => {
            try {
                await apiFetch(ENDPOINTS.items.trackView(item.id), {
                    method: 'POST',
                });
                // Silently track - no need to show error to user if it fails
            } catch (error) {
                // Silently fail - view tracking is not critical for UX
                console.debug('Failed to track item view:', error);
            }
        };

        trackView();
    }, [item?.id]);

    if (!item) return <div>No item selected</div>;

    // Get all images (main image + gallery)
    const allImages = item.gallery && item.gallery.length > 0 
        ? [item.image, ...item.gallery.filter(img => img !== item.image)]
        : [item.image];

    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index);
        setShowImageViewer(true);
    };

    const isMarketplace = item.type === 'marketplace';

    const handleViewProfile = () => {
        setShowUserProfile(true);
    };

    const handleChatClick = () => {
        if (isAuthenticated) {
            onChat?.(item);
        } else {
            onLoginPrompt?.();
        }
    };

    const handleBackFromProfile = () => {
        setShowUserProfile(false);
    };

    // Show User Profile Screen
    if (showUserProfile) {
        // Get user data from item - check if we have user object with phone_verified_at
        // The item might have a 'user' property with full user data, or just 'owner' with basic info
        const userData = (item as any).user 
            ? {
                ...item.owner,
                id: (item as any).user.id || item.owner.id,
                phone_verified_at: (item as any).user.phone_verified_at || null,
              }
            : item.owner;

        return (
            <UserProfileScreen
                user={userData}
                onBack={handleBackFromProfile}
                onChat={() => {
                    if (isAuthenticated) {
                        onChat?.(item);
                    } else {
                        onLoginPrompt?.();
                    }
                }}
                isAuthenticated={isAuthenticated}
                onLoginPrompt={onLoginPrompt}
                onItemClick={onItemClick}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Transparent Header for Back/Close Buttons */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingLeft: '1rem', paddingRight: '1rem' }}>
                <button
                    onClick={onBack}
                    className="pointer-events-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                >
                    <ArrowLeft size={22} />
                </button>

                {/* Close Button */}
                <button
                    onClick={onBack}
                    className="pointer-events-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
                {/* Image Gallery with Title Overlay */}
                <div 
                    className="h-[45vh] relative bg-gray-200 cursor-pointer"
                    onClick={() => handleImageClick(0)}
                >
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-12 left-4 right-4 text-white pointer-events-none">
                        {isMarketplace ? (
                            <div className="inline-block bg-gradient-to-r from-brand to-brand-600 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-2 shadow-lg">
                                {item.price}
                            </div>
                        ) : (
                            <div className="inline-block bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-2 shadow-lg uppercase">
                                {item.condition}
                            </div>
                        )}
                        <h1 className="text-3xl font-extrabold leading-tight drop-shadow-lg">{item.title}</h1>
                    </div>
                </div>

                {/* Item Details */}
                <ItemDetails item={item} onImageClick={handleImageClick} />

                {/* Owner Info - Enhanced */}
                <div className="px-6 pb-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-brand rounded-full" />
                        Listed by
                    </h3>
                    <OwnerInfo owner={item.owner} />
                </div>
            </div>

            {/* Sticky Bottom Action Footer - Enhanced */}
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
                <div className="px-4 pt-3 pb-2">
                    <div className="flex gap-3 max-w-md mx-auto">
                        {/* View Profile Button */}
                        <button
                            onClick={handleViewProfile}
                            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            View Profile
                        </button>

                        {/* Chat Button with Auth Check */}
                        <button
                            onClick={handleChatClick}
                            className="flex-[1.4] bg-gradient-to-r from-brand to-brand-600 text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {isAuthenticated ? (
                                <>
                                    <MessageCircle size={16} strokeWidth={2} />
                                    Chat Now
                                </>
                            ) : (
                                <>
                                    <Lock size={16} strokeWidth={2} />
                                    Login to Chat
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Viewer Modal */}
            <ImageViewerModal
                images={allImages}
                initialIndex={selectedImageIndex}
                isOpen={showImageViewer}
                onClose={() => setShowImageViewer(false)}
            />
        </div>
    );
};

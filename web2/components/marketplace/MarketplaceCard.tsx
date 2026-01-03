import React, { useState } from 'react';
import { MapPin, Heart, Share2, ShoppingCart, Sparkles, Star, Verified } from 'lucide-react';
import { PLACEHOLDER_AVATAR } from '../../constants/placeholders';

// Dummy data for design sample
const DUMMY_MARKETPLACE_ITEM = {
    id: 'sample-001',
    title: 'Apple iPhone 14 Pro Max',
    price: '₦750,000',
    originalPrice: '₦850,000',
    discount: '12% OFF',
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&q=80&w=800',
    description: 'Brand new iPhone 14 Pro Max, 256GB, Deep Purple. Comes with original accessories, screen protector, and premium case. Warranty included.',
    category: 'Electronics',
    condition: 'Brand New',
    inStock: true,
    rating: 4.9,
    reviews: 127,
    seller: {
        name: 'TechHub Nigeria',
        avatar: null, // Will use placeholder in component
        location: 'Lekki, Lagos',
        distance: '2.5km',
        verified: true,
        rating: 4.8,
        sales: 2340,
    },
    tags: ['Fast Shipping', 'Premium Seller', 'Warranty'],
    gallery: [
        'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800',
    ],
};

interface MarketplaceCardProps {
    variant?: 'full' | 'compact' | 'minimal';
    onBuyClick?: () => void;
    onSaveClick?: () => void;
    onShareClick?: () => void;
    onCardClick?: () => void;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
    variant = 'full',
    onBuyClick,
    onSaveClick,
    onShareClick,
    onCardClick,
}) => {
    const [isSaved, setIsSaved] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const item = DUMMY_MARKETPLACE_ITEM;

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSaved(!isSaved);
        onSaveClick?.();
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: item.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
        onShareClick?.();
    };

    const handleBuy = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBuyClick?.();
    };

    // Full variant - Detailed card for main view
    if (variant === 'full') {
        return (
            <div
                onClick={onCardClick}
                className="w-full max-w-[340px] mx-auto cursor-pointer group"
            >
                {/* Card Container with glassmorphism effect */}
                <div className="relative rounded-[28px] overflow-hidden bg-white shadow-2xl border border-gray-100/60 transition-all duration-300 group-hover:shadow-3xl group-hover:scale-[1.01]">

                    {/* Image Section */}
                    <div className="relative h-[240px] overflow-hidden">
                        {/* Image Gallery */}
                        <div className="relative w-full h-full">
                            <img
                                src={item.gallery[activeImageIndex]}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                        </div>

                        {/* Image Dots Indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {item.gallery.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageIndex(idx);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeImageIndex
                                            ? 'bg-white w-6'
                                            : 'bg-white/50 hover:bg-white/70'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Top Actions */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            {/* Discount Badge */}
                            <div className="flex flex-col gap-2">
                                <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                    {item.discount}
                                </span>
                                {item.inStock && (
                                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Sparkles size={10} />
                                        IN STOCK
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all duration-300 ${isSaved
                                            ? 'bg-rose-500 border-rose-400 text-white scale-110'
                                            : 'bg-black/20 border-white/30 text-white hover:bg-black/40'
                                        }`}
                                >
                                    <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white hover:bg-black/40 transition-all duration-300"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Category Tag */}
                        <div className="absolute top-16 left-4">
                            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                {item.category}
                            </span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-4">
                        {/* Title & Price */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
                                {item.title}
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-600">
                                    {item.price}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                    {item.originalPrice}
                                </span>
                            </div>
                        </div>

                        {/* Rating & Reviews */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                <span className="text-sm font-semibold text-gray-900">{item.rating}</span>
                                <span className="text-xs text-gray-400">({item.reviews})</span>
                            </div>
                            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-600 font-medium rounded-full">
                                {item.condition}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                            {item.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img
                                        src={item.seller.avatar || PLACEHOLDER_AVATAR}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = PLACEHOLDER_AVATAR;
                                        }}
                                        alt={item.seller.name}
                                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
                                    />
                                    {item.seller.verified && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                                            <Verified size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                                        {item.seller.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span className="flex items-center gap-0.5">
                                            <MapPin size={10} />
                                            {item.seller.location}
                                        </span>
                                        <span>•</span>
                                        <span className="text-brand font-medium">{item.seller.distance}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-xs">
                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                    <span className="font-semibold">{item.seller.rating}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{item.seller.sales} sales</span>
                            </div>
                        </div>

                        {/* Buy Button */}
                        <button
                            onClick={handleBuy}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-brand to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand/25 flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-brand/30 active:scale-[0.98]"
                        >
                            <ShoppingCart size={18} />
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Compact variant - For lists/grids
    if (variant === 'compact') {
        return (
            <div
                onClick={onCardClick}
                className="w-full max-w-[300px] cursor-pointer group"
            >
                <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100/60 transition-all duration-300 group-hover:shadow-xl">
                    {/* Image */}
                    <div className="relative h-[160px]">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* Discount Badge */}
                        <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            {item.discount}
                        </span>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-all duration-300 ${isSaved
                                    ? 'bg-rose-500 border-rose-400 text-white'
                                    : 'bg-black/20 border-white/30 text-white'
                                }`}
                        >
                            <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-brand">{item.price}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin size={10} />
                                <span>{item.seller.distance}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <img
                                src={item.seller.avatar}
                                alt={item.seller.name}
                                className="w-6 h-6 rounded-full"
                            />
                            <span className="text-xs text-gray-500 truncate">{item.seller.name}</span>
                            {item.seller.verified && (
                                <Verified size={12} className="text-blue-500" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Minimal variant - For small spaces
    return (
        <div
            onClick={onCardClick}
            className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-md border border-gray-100 cursor-pointer transition-all hover:shadow-lg"
        >
            <img
                src={item.image}
                alt={item.title}
                className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h4>
                <p className="text-lg font-black text-brand">{item.price}</p>
                <span className="text-xs text-gray-400">{item.seller.location}</span>
            </div>
            <Heart
                size={18}
                className={`shrink-0 transition-colors ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-gray-300'}`}
                onClick={handleSave}
            />
        </div>
    );
};

// Demo component to showcase all variants
export const MarketplaceCardDemo: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-gray-900">
                    Marketplace Card Design
                </h1>
                <p className="text-gray-500">Design samples for the marketplace tab</p>
            </div>

            {/* Full Variant */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-brand to-brand-600" />
                    Full Card (Main View)
                </h2>
                <div className="flex justify-center">
                    <MarketplaceCard
                        variant="full"
                        onBuyClick={() => alert('Buy clicked!')}
                    />
                </div>
            </section>

            {/* Compact Variant */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                    Compact Card (Grid View)
                </h2>
                <div className="flex gap-4 justify-center flex-wrap">
                    <MarketplaceCard variant="compact" />
                    <MarketplaceCard variant="compact" />
                </div>
            </section>

            {/* Minimal Variant */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                    Minimal Card (List View)
                </h2>
                <div className="max-w-sm mx-auto space-y-3">
                    <MarketplaceCard variant="minimal" />
                    <MarketplaceCard variant="minimal" />
                    <MarketplaceCard variant="minimal" />
                </div>
            </section>
        </div>
    );
};

export default MarketplaceCard;

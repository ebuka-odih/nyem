import React from 'react';
import { Package } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  image?: string;
  price?: number;
  type?: string;
}

interface ItemCardProps {
  item: Item;
  label?: string;
}

/**
 * Component to display a single item in the chat context
 * Used when users are chatting about a specific product/item
 */
export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  label = 'Item' 
}) => {
  const itemImage = item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=880e4f&color=fff&size=128`;
  
  return (
    <div className="bg-gray-50 p-4 shrink-0 border-b border-gray-100">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-brand relative overflow-hidden">
        <div className="flex items-center text-brand font-bold text-xs uppercase tracking-wider mb-3">
          <Package size={14} className="mr-1.5" />
          {label}
        </div>

        <div className="flex items-center gap-3">
          {/* Item Image */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
            <img 
              src={itemImage} 
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=880e4f&color=fff&size=128`;
              }}
            />
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate mb-1">{item.title}</h3>
            {item.price && (
              <p className="text-xs text-gray-600 font-semibold">
                {(() => {
                  // If it's already a string with commas, use it as is
                  if (typeof item.price === 'string' && item.price.includes(',')) {
                    return item.price.includes('₦') ? item.price : `₦${item.price}`;
                  }
                  // If it's a number or string without commas, format it
                  const numValue = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[₦,]/g, ''));
                  return isNaN(numValue) ? `₦${item.price}` : `₦${numValue.toLocaleString('en-US')}`;
                })()}
              </p>
            )}
            {item.type && (
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                {item.type}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};













import React from 'react';
import { Phone, Heart, MapPin } from 'lucide-react';

interface FeatureRowProps {
  icon: 'phone' | 'heart' | 'location';
  label: string;
}

/**
 * FeatureRow Component
 * Displays a feature with icon and label in a row layout
 */
export const FeatureRow: React.FC<FeatureRowProps> = ({ icon, label }) => {
  const getIcon = () => {
    switch (icon) {
      case 'phone':
        return <Phone size={20} className="text-textPrimary" />;
      case 'heart':
        return <Heart size={20} className="text-textPrimary" />;
      case 'location':
        return <MapPin size={20} className="text-textPrimary" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center mb-5">
      <div
        className="flex items-center justify-center rounded-full bg-iconBackground flex-shrink-0"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '30px',
          marginRight: '12px',
        }}
      >
        {getIcon()}
      </div>
      <span className="text-body text-textPrimary" style={{ fontSize: '16px', fontWeight: '400' }}>{label}</span>
    </div>
  );
};


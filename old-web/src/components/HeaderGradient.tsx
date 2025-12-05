import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderGradientProps {
  height?: number;
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  showAvatar?: boolean;
  avatarText?: string;
  alignment?: 'center' | 'left';
  titleSize?: 'default' | 'small';
}

/**
 * HeaderGradient Component
 * Displays a gradient header with optional back button, title, subtitle, and avatar
 */
export const HeaderGradient: React.FC<HeaderGradientProps> = ({
  height = 220,
  showBackButton = false,
  title,
  subtitle,
  showAvatar = false,
  avatarText = 'N',
  alignment = 'center',
  titleSize = 'default',
}) => {
  const navigate = useNavigate();
  const isCenter = alignment === 'center';

  return (
    <div
      className="relative"
      style={{
        height: `${height}px`,
        background: 'linear-gradient(135deg, #990033 0%, #330033 100%)',
        borderBottomLeftRadius: '30px',
        borderBottomRightRadius: '30px',
      }}
    >
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="absolute flex items-center justify-center z-20 hover:opacity-90 transition-opacity cursor-pointer"
          aria-label="Go back"
          style={{
            top: '10px',
            left: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
            padding: '8px',
            position: 'absolute',
            zIndex: 10,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={24} color="#990033" strokeWidth={2.5} />
        </button>
      )}

      <div
        className={`flex flex-col justify-center h-full ${
          isCenter ? 'items-center text-center' : 'items-start text-left'
        }`}
        style={{ 
          paddingLeft: showBackButton ? '60px' : '24px', 
          paddingRight: '24px',
          paddingTop: '20px',
          paddingBottom: '20px'
        }}
      >
        {showAvatar && (
          <div
            className="rounded-full flex items-center justify-center mb-4"
            style={{ 
              width: '100px', 
              height: '100px',
              borderRadius: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <span className="text-white font-bold" style={{ fontSize: '50px', lineHeight: '1' }}>{avatarText}</span>
          </div>
        )}

        {title && (
          <h1 
            className="font-bold whitespace-pre-line" 
            style={{ 
              fontSize: titleSize === 'small' ? '32px' : '40px', 
              lineHeight: '1.1', 
              letterSpacing: '1px', 
              color: '#FFFFFF' 
            }}
          >
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="text-white" style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
};


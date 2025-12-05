import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  showBorder?: boolean;
}

/**
 * AppHeader Component
 * Header for app pages (not auth pages) - properly aligned below the notch
 * Does not extend into the notch area, starts below it with proper spacing
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightAction,
  children,
  className = '',
  showBorder = true,
}) => {
  return (
    <div className={`app-header-safe bg-white z-20 shrink-0 ${showBorder ? 'border-b border-gray-100' : ''} ${className}`}>
      <div className="px-4 md:px-6 flex items-center justify-between min-h-[56px]">
        {/* Left side - Back button or empty */}
        <div className="flex items-center min-w-[44px]">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 touch-manipulation"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
          )}
        </div>

        {/* Center - Title or custom content */}
        <div className="flex-1 flex items-center justify-center">
          {children || (title && (
            <h1 className="text-lg md:text-xl font-extrabold text-gray-900 text-center">
              {title}
            </h1>
          ))}
        </div>

        {/* Right side - Action button or empty */}
        <div className="flex items-center min-w-[44px] justify-end">
          {rightAction}
        </div>
      </div>
    </div>
  );
};


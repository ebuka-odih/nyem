import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '../Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  isServiceProfile?: boolean;
}

/**
 * Success modal shown when an item is successfully created or updated
 */
export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  isEditMode = false,
  isServiceProfile = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isServiceProfile 
              ? 'Service Profile Saved!'
              : isEditMode 
                ? 'Item Updated!' 
                : 'Item Posted!'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isServiceProfile
              ? 'Your service profile has been saved successfully and is now visible on the discover page.'
              : isEditMode 
                ? 'Your item has been successfully updated.' 
                : 'Your item has been posted successfully and is now live.'}
          </p>

          {/* Close Button */}
          <Button
            onClick={onClose}
            fullWidth
            className="bg-brand hover:bg-brand-light text-white rounded-xl py-3"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

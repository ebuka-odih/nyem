import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface PhotoUploadProps {
  photos: string[];
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  onCameraCapture: () => void;
  onGallerySelect: () => void;
  onRemovePhoto: (index: number) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  activeTab,
  onCameraCapture,
  onGallerySelect,
  onRemovePhoto,
}) => {
  return (
    <div>
      <label className="block text-brand font-bold text-sm mb-3">
        {activeTab === 'Services' 
          ? 'Work Samples (Select from Gallery)' 
          : activeTab === 'Swap' 
            ? 'Photos (Camera Only)' 
            : 'Photos (Select from Gallery)'}
      </label>
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {activeTab === 'Swap' ? (
          // Camera only for swap items
          <>
            {photos.length === 0 ? (
              <button 
                type="button"
                onClick={onCameraCapture}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors shrink-0"
              >
                <Camera size={24} className="mb-1" />
                <span className="text-[10px] font-bold">Take Photo</span>
              </button>
            ) : (
              photos.map((photo, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-gray-200">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
            {photos.length > 0 && photos.length < 5 && (
              <button 
                type="button"
                onClick={onCameraCapture}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors shrink-0"
              >
                <Camera size={24} className="mb-1" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>
            )}
          </>
        ) : (
          // Gallery selection for marketplace and services items
          <>
            {photos.map((photo, index) => (
              <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-gray-200">
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <button 
                type="button"
                onClick={onGallerySelect}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors shrink-0"
              >
                <ImageIcon size={24} className="mb-1" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};





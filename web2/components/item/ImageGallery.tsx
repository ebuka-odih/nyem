import React from 'react';

interface ImageGalleryProps {
  mainImage: string;
  gallery?: string[];
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ mainImage, gallery }) => {
  return (
    <div className="h-[45vh] relative bg-gray-200">
      <img src={mainImage} alt="Item" className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
      
      {/* Gallery Thumbnails */}
      {gallery && gallery.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 flex space-x-2 overflow-x-auto pb-2">
          {gallery.map((img, i) => (
            <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-white/50">
              <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


















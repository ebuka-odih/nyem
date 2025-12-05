import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Camera, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Upload Screen
 * Form to upload items for trade
 */
const Upload = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');

  const handlePhotoCapture = () => {
    // TODO: Implement camera capture
    console.log('Open camera');
  };

  const handleSubmit = () => {
    // TODO: Implement submit logic
    console.log('Submit', { photos, title, description, category, condition });
  };

  return (
    <MainLayout>
      {/* Header */}
      <div
        style={{
          paddingTop: '16px',
          paddingBottom: '12px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#222222',
            lineHeight: '1.2',
          }}
        >
          Upload
        </h1>
      </div>

      {/* Form Content */}
      <div
        style={{
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '100px',
          paddingTop: '8px',
        }}
      >
        {/* Title Section */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#222222',
              marginBottom: '6px',
              lineHeight: '1.3',
            }}
          >
            Upload Item
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#666666',
              lineHeight: '1.4',
            }}
          >
            What would you like to trade?
          </p>
        </div>

        {/* Photos Section */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#990033',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Photos * (Camera Only)
          </label>
          <button
            type="button"
            onClick={handlePhotoCapture}
            style={{
              width: '100%',
              border: '2px dashed #E0E0E0',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: '#E0E0E0',
              backgroundColor: '#FAFAFA',
              padding: '32px 20px',
              minHeight: '180px',
              cursor: 'pointer',
            }}
          >
            <Camera size={48} color="#999999" style={{ marginBottom: '12px' }} />
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#666666',
              }}
            >
              Take Photo
            </span>
          </button>
          {photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Title Field */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="title"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#990033',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Title *
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g., iPhone 13 Pro"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-b pb-3"
            style={{
              borderBottomColor: '#E0E0E0',
              borderBottomWidth: '1px',
              fontSize: '16px',
              color: '#222222',
              outline: 'none',
              padding: '8px 0',
            }}
          />
        </div>

        {/* Description Field */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="description"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#990033',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Description
          </label>
          <textarea
            id="description"
            placeholder="Describe your item..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border-b pb-3 resize-none"
            style={{
              borderBottomColor: '#E0E0E0',
              borderBottomWidth: '1px',
              fontSize: '16px',
              color: '#222222',
              outline: 'none',
              padding: '8px 0',
            }}
          />
        </div>

        {/* Category Field */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="category"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#990033',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Category *
          </label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-b pb-3 appearance-none"
              style={{
                borderBottomColor: '#E0E0E0',
                borderBottomWidth: '1px',
                fontSize: '16px',
                color: category ? '#222222' : '#999999',
                outline: 'none',
                padding: '8px 30px 8px 0',
                backgroundColor: 'transparent',
              }}
            >
              <option value="">Select category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="furniture">Furniture</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown
              size={20}
              color="#999999"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        {/* Condition Field */}
        <div style={{ marginBottom: '32px' }}>
          <label
            htmlFor="condition"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#990033',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Condition *
          </label>
          <div className="relative">
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full border-b pb-3 appearance-none"
              style={{
                borderBottomColor: '#E0E0E0',
                borderBottomWidth: '1px',
                fontSize: '16px',
                color: condition ? '#222222' : '#999999',
                outline: 'none',
                padding: '8px 30px 8px 0',
                backgroundColor: 'transparent',
              }}
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            <ChevronDown
              size={20}
              color="#999999"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          size="xl"
          className="w-full rounded-full shadow-lg hover:shadow-xl transition-all text-white border-0 focus:ring-0 focus:ring-offset-0 uppercase"
          style={{
            backgroundColor: '#990033',
            color: '#FFFFFF',
            boxShadow: '0 4px 8px rgba(153, 0, 51, 0.3)',
            border: 'none',
            outline: 'none',
            padding: '18px',
            fontWeight: '800',
            fontSize: '18px',
            marginBottom: '20px',
          }}
          onClick={handleSubmit}
        >
          Upload Item
        </Button>
      </div>
    </MainLayout>
  );
};

export default Upload;


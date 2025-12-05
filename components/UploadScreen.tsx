
import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';

interface Category {
  id: number;
  name: string;
  order: number;
}

export const UploadScreen: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'exchange' | 'marketplace'>('exchange');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [price, setPrice] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiFetch(ENDPOINTS.categories);
        const cats = (response.categories || []) as Category[];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Fallback to hardcoded categories
        setCategories([
          { id: 1, name: 'Electronics', order: 1 },
          { id: 2, name: 'Fashion', order: 2 },
          { id: 3, name: 'Home & Garden', order: 3 },
          { id: 4, name: 'Vehicles', order: 4 },
          { id: 5, name: 'Other', order: 5 },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle camera capture (instant snap only)
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setPhotos(prev => [...prev, imageUrl]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Handle gallery selection
  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const readers = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(imageUrls => {
        setPhotos(prev => [...prev, ...imageUrls]);
      });
    }
    // Reset input so same files can be selected again
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!category) {
      setError('Category is required');
      return;
    }
    if (!condition) {
      setError('Condition is required');
      return;
    }
    if (activeTab === 'exchange' && !lookingFor.trim()) {
      setError('Please specify what you are looking for');
      return;
    }
    if (activeTab === 'marketplace' && !price.trim()) {
      setError('Price is required');
      return;
    }

    if (!token) {
      setError('You must be logged in to post items');
      return;
    }

    setLoading(true);
    try {
      // Find category name from selected category ID
      const selectedCategoryObj = categories.find(cat => cat.id.toString() === category);
      if (!selectedCategoryObj) {
        setError('Please select a valid category');
        setLoading(false);
        return;
      }

      // Map condition values to backend expected values
      let conditionValue = condition;
      if (condition === 'used_good' || condition === 'used_fair') {
        conditionValue = 'used';
      }

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategoryObj.name, // Backend expects category name, not ID
        condition: conditionValue,
        type: activeTab === 'exchange' ? 'barter' : 'marketplace',
      };

      if (activeTab === 'exchange') {
        payload.looking_for = lookingFor.trim();
      } else {
        payload.price = parseFloat(price.replace(/,/g, ''));
      }

      // TODO: Implement image upload endpoint
      // For now, photos are stored locally but not sent to backend
      // The backend expects photo URLs (max 2048 chars), not base64 data URIs
      // Once image upload is implemented, upload photos first and then include URLs here
      // if (photos.length > 0) {
      //   payload.photos = uploadedPhotoUrls;
      // }

      await apiFetch(ENDPOINTS.items.create, {
        method: 'POST',
        token,
        body: payload,
      });

      setSuccess(true);
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setCondition('');
      setLookingFor('');
      setPrice('');
      setPhotos([]);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to post item. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        title="Upload"
        className="pb-4"
      />
        
      {/* Tabs */}
      <div className="px-6 pb-4">
        <div className="bg-gray-100 p-1 rounded-full flex items-center">
          <button 
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'exchange' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setActiveTab('exchange')}
          >
            Exchange Item
          </button>
          <button 
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'marketplace' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            onClick={() => setActiveTab('marketplace')}
          >
            Marketplace Item
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* Success/Error Messages */}
        {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Item posted successfully!
            </div>
        )}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Title Section */}
        <div>
           <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Upload Item</h2>
           <p className="text-gray-500 text-sm">
             {activeTab === 'exchange' ? 'What would you like to trade?' : 'What would you like to sell?'}
           </p>
        </div>

        {/* Photo Upload */}
        <div>
            <label className="block text-brand font-bold text-sm mb-3">
              Photos {activeTab === 'exchange' ? '(Camera Only)' : '(Select from Gallery)'}
            </label>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {activeTab === 'exchange' ? (
                // Camera only for exchange items
                <>
                  {photos.length === 0 ? (
                    <button 
                      type="button"
                      onClick={handleCameraCapture}
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
                          onClick={() => removePhoto(index)}
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
                      onClick={handleCameraCapture}
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors shrink-0"
                    >
                      <Camera size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">Add Photo</span>
                    </button>
                  )}
                </>
              ) : (
                // Gallery selection for marketplace items
                <>
                  {photos.map((photo, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-gray-200">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button 
                      type="button"
                      onClick={handleGallerySelect}
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

        {/* Form Fields */}
        <div className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Title *</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., iPhone 13 Pro" 
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Description</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your item..." 
                    className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
                ></textarea>
            </div>

            {/* Category */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Category *</label>
                <div className="relative">
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={loadingCategories}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            {/* Condition */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Condition *</label>
                <div className="relative">
                    <select 
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Select condition</option>
                        <option value="new">New</option>
                        <option value="like_new">Like New</option>
                        <option value="used">Used</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>
            
            {/* Exchange-specific: Looking For */}
            {activeTab === 'exchange' && (
              <div>
                <label className="block text-brand font-bold text-sm mb-2">Looking For *</label>
                <input 
                  type="text" 
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="What do you want in exchange?" 
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
              </div>
            )}

            {/* Marketplace-specific: Price */}
            {activeTab === 'marketplace' && (
              <div>
                <label className="block text-brand font-bold text-sm mb-2">Price (₦) *</label>
                <input 
                  type="text" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9,.]/g, ''))}
                  placeholder="0.00" 
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
              </div>
            )}

            {/* Submit */}
            <form onSubmit={handleSubmit}>
                <div className="pt-4 pb-8">
                    <Button 
                        fullWidth 
                        type="submit"
                        className="bg-brand hover:bg-brand-light text-white rounded-xl py-4 shadow-lg text-lg"
                        disabled={loading}
                    >
                        {loading ? 'Posting...' : 'Post Item'}
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

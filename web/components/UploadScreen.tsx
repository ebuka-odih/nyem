
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';
import { LoginPrompt } from './common/LoginPrompt';
import { UploadTabs } from './upload/UploadTabs';
import { PhotoUpload } from './upload/PhotoUpload';
import { UploadForm } from './upload/UploadForm';
import { PhoneVerificationModal } from './PhoneVerificationModal';

interface Category {
  id: number;
  name: string;
  order: number;
}

interface UploadScreenProps {
  onLoginRequest?: (method: 'phone_otp' | 'google' | 'email') => void;
  onSignUpRequest?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onLoginRequest, onSignUpRequest }) => {
  const { token, user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'exchange' | 'marketplace'>('exchange');
  const [showPreUploadProfile, setShowPreUploadProfile] = useState(false);
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
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  
  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Check if pre-upload profile setup is needed (first time upload)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user needs to complete profile before uploading
      // According to flow: profile_photo, username_auto, city_auto, short_bio_optional
      const needsProfileSetup = !user.profile_photo || !user.username || !user.city;
      setShowPreUploadProfile(needsProfileSetup);
    } else if (!isAuthenticated) {
      // If not authenticated, show login prompt (handled by parent)
      setShowPreUploadProfile(false);
    }
  }, [isAuthenticated, user]);

  // Map activeTab to parent category name for filtering
  const getParentCategoryName = (tab: 'exchange' | 'marketplace'): string => {
    // Exchange items use Swap categories, marketplace items use Shop categories
    return tab === 'exchange' ? 'Swap' : 'Shop';
  };

  // Fetch categories filtered by active tab
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        
        // Reset category selection when tab changes
        setCategory('');
        
        // Fetch categories filtered by parent (based on activeTab)
        const parentCategory = getParentCategoryName(activeTab);
        const categoriesUrl = `${ENDPOINTS.categories}?parent=${encodeURIComponent(parentCategory)}`;
        
        const response = await apiFetch(categoriesUrl);
        const cats = (response.categories || []) as Category[];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Fallback to empty array
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [activeTab]);

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

    // Check if phone verification is required for marketplace items
    if (activeTab === 'marketplace' && user && !user.phone_verified_at) {
      setShowPhoneVerification(true);
      return;
    }

    setLoading(true);
    try {
      // Validate category ID
      const categoryId = parseInt(category, 10);
      if (!categoryId || isNaN(categoryId)) {
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
        category_id: categoryId, // Backend now expects category_id
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
      // Check if error is due to phone verification requirement
      if (err.message?.includes('phone verification') || err.message?.includes('requires_phone_verification')) {
        setShowPhoneVerification(true);
        setError(null);
      } else {
        setError(err.message || 'Failed to post item. Please try again.');
      }
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader 
          title="Upload"
          className="pb-4"
        />
        <LoginPrompt 
          title="Sign In Required"
          message="Please sign in to upload items and start trading with others."
          onLoginRequest={onLoginRequest}
          onSignUpRequest={onSignUpRequest}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        title="Upload"
        className="pb-4"
      />
        
      {/* Tabs */}
      <UploadTabs activeTab={activeTab} onTabChange={setActiveTab} />

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
        <PhotoUpload
          photos={photos}
          activeTab={activeTab}
          onCameraCapture={handleCameraCapture}
          onGallerySelect={handleGallerySelect}
          onRemovePhoto={removePhoto}
        />

        {/* Form Fields */}
        <UploadForm
          activeTab={activeTab}
          title={title}
          description={description}
          category={category}
          condition={condition}
          lookingFor={lookingFor}
          price={price}
          categories={categories}
          loadingCategories={loadingCategories}
          loading={loading}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onCategoryChange={setCategory}
          onConditionChange={setCondition}
          onLookingForChange={setLookingFor}
          onPriceChange={setPrice}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onVerified={async () => {
          await refreshUser();
          // Retry submission after verification
          // Note: We'll need to store the form data or trigger submit again
        }}
      />
    </div>
  );
};

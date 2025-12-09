
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
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onLoginRequest, onSignUpRequest }) => {
  const { token, user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'Marketplace' | 'Services' | 'Swap'>('Marketplace');
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
  const [pendingSubmit, setPendingSubmit] = useState(false); // Track if we need to retry submit after verification
  
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
  const getParentCategoryName = (tab: 'Marketplace' | 'Services' | 'Swap'): string => {
    // Map Marketplace to Shop for backend API (backend uses 'Shop' as parent category)
    if (tab === 'Marketplace') return 'Shop';
    return tab; // Services or Swap
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
    if (activeTab === 'Swap' && !lookingFor.trim()) {
      setError('Please specify what you are looking for');
      return;
    }
    if (activeTab === 'Marketplace' && !price.trim()) {
      setError('Price is required');
      return;
    }

    if (!token) {
      setError('You must be logged in to post items');
      return;
    }

    // Check if phone verification is required for ALL uploads
    // Users must verify their phone to upload any items (Marketplace, Services, or Swap)
    if (user && !user.phone_verified_at) {
      setPendingSubmit(true); // Mark that we have a pending submission
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
        type: activeTab === 'Swap' ? 'barter' : activeTab === 'Marketplace' ? 'marketplace' : 'services',
      };

      if (activeTab === 'Swap') {
        payload.looking_for = lookingFor.trim();
      } else if (activeTab === 'Marketplace') {
        payload.price = parseFloat(price.replace(/,/g, ''));
      }
      // Services items might not need price or looking_for, depending on backend requirements

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
        
        {/* Phone Verification Required Banner */}
        {user && !user.phone_verified_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-amber-800 font-semibold text-sm">Phone Verification Required</h3>
                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                  Verify your phone number to start uploading items. This helps keep our community safe and trustworthy.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPhoneVerification(true)}
                  className="mt-3 text-amber-700 font-bold text-sm hover:text-amber-800 underline underline-offset-2"
                >
                  Verify Now →
                </button>
              </div>
            </div>
          </div>
        )}

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
             {activeTab === 'Swap' ? 'What would you like to trade?' : activeTab === 'Marketplace' ? 'What would you like to sell?' : 'What service would you like to offer?'}
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
        onClose={() => {
          setShowPhoneVerification(false);
          setPendingSubmit(false);
        }}
        onVerified={async () => {
          await refreshUser();
          // If there was a pending submission, retry it after verification
          if (pendingSubmit) {
            setPendingSubmit(false);
            // Small delay to ensure user state is updated
            setTimeout(() => {
              const form = document.querySelector('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              }
            }, 500);
          }
        }}
      />
    </div>
  );
};

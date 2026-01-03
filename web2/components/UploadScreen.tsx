
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';
import { LoginPrompt } from './common/LoginPrompt';
import { UploadTabs } from './upload/UploadTabs';
import { PhotoUpload } from './upload/PhotoUpload';
import { UploadForm } from './upload/UploadForm';
import { ServiceProfileForm } from './upload/ServiceProfileForm';
import { ServiceProfileCard } from './upload/ServiceProfileCard';
import { PhoneVerificationModal } from './PhoneVerificationModal';
import { PreUploadProfileSetup } from './upload/PreUploadProfileSetup';
import { SuccessModal } from './upload/SuccessModal';

// Number of items users can upload before phone verification is required
const FREE_UPLOAD_LIMIT = 2;

interface Category {
  id: number;
  name: string;
  order: number;
}

interface EditItem {
  id: number;
  title: string;
  description?: string;
  condition?: string;
  category_id?: number;
  type?: string;
  price?: string;
  looking_for?: string;
  images?: string[];
  gallery?: string[];
}

interface UploadScreenProps {
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
  editItem?: EditItem | null;
  onEditComplete?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ 
  onLoginRequest, 
  onSignUpRequest,
  editItem = null,
  onEditComplete
}) => {
  const { token, user, isAuthenticated, refreshUser } = useAuth();
  const isEditMode = !!editItem;
  
  // Determine initial tab based on edit item type or default to Marketplace
  const getInitialTab = (): 'Marketplace' | 'Services' | 'Swap' => {
    if (editItem?.type === 'barter') return 'Swap';
    if (editItem?.type === 'services') return 'Services';
    return 'Marketplace';
  };
  
  const [activeTab, setActiveTab] = useState<'Marketplace' | 'Services' | 'Swap'>(getInitialTab());
  const [showPreUploadProfile, setShowPreUploadProfile] = useState(false);
  const [title, setTitle] = useState(editItem?.title || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [category, setCategory] = useState(editItem?.category_id?.toString() || '');
  const [condition, setCondition] = useState(editItem?.condition || '');
  const [lookingFor, setLookingFor] = useState(editItem?.looking_for || '');
  const [price, setPrice] = useState(editItem?.price ? editItem.price.replace('$', '').replace(',', '') : '');
  const [photos, setPhotos] = useState<string[]>(editItem?.images || editItem?.gallery || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false); // Track if we need to retry submit after verification
  
  // Service profile state
  const [serviceCategory, setServiceCategory] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [bio, setBio] = useState('');
  const [workImages, setWorkImages] = useState<string[]>([]);
  const [loadingServiceProfile, setLoadingServiceProfile] = useState(false);
  const [serviceProfile, setServiceProfile] = useState<any>(null); // Store full profile data
  const [showProfileView, setShowProfileView] = useState(false); // Toggle between card and form
  
  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Check if pre-upload profile setup is needed (first time upload)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user needs to complete profile before uploading
      // Required: display name, username, and city. Profile photo is recommended but optional.
      const needsProfileSetup = !user.name || !user.username || !user.city_id;
      setShowPreUploadProfile(needsProfileSetup);
    } else if (!isAuthenticated) {
      // If not authenticated, show login prompt (handled by parent)
      setShowPreUploadProfile(false);
    }
  }, [isAuthenticated, user]);

  // Calculate items count and verification requirements
  const itemsCount = user?.items_count ?? 0;
  const needsPhoneVerification = !user?.phone_verified_at && itemsCount >= FREE_UPLOAD_LIMIT;
  const remainingFreeUploads = Math.max(0, FREE_UPLOAD_LIMIT - itemsCount);

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

  // Load existing service profile when Services tab is active
  useEffect(() => {
    const loadServiceProfile = async () => {
      if (activeTab === 'Services' && isAuthenticated && token && !isEditMode) {
        try {
          setLoadingServiceProfile(true);
          const response = await apiFetch(ENDPOINTS.serviceProviders.me, { token });
          if (response.success && response.data) {
            const profile = response.data;
            setServiceProfile(profile); // Store full profile
            setServiceCategory(profile.service_category_id?.toString() || '');
            setStartingPrice(profile.starting_price ? profile.starting_price.toString().replace(/,/g, '') : '');
            setServiceCity(profile.city || '');
            setBio(profile.bio || '');
            setWorkImages(profile.work_images || []);
            setShowProfileView(true); // Show profile card by default if profile exists
          } else {
            // No existing profile - set default city from user
            setServiceProfile(null);
            setShowProfileView(false);
            if (user?.city) {
              setServiceCity(user.city);
            }
          }
        } catch (err) {
          // No existing profile, that's fine - set default city from user
          setServiceProfile(null);
          setShowProfileView(false);
          if (user?.city) {
            setServiceCity(user.city);
          }
          console.log('No existing service profile found');
        } finally {
          setLoadingServiceProfile(false);
        }
      } else if (activeTab === 'Services' && user?.city && !serviceCity) {
        // Set default city when tab is first opened
        setServiceCity(user.city);
      }
    };

    loadServiceProfile();
  }, [activeTab, isAuthenticated, token, isEditMode, user?.city, serviceCity]);

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
        if (activeTab === 'Services') {
          setWorkImages(prev => [...prev, imageUrl]);
        } else {
          setPhotos(prev => [...prev, imageUrl]);
        }
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
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const readers = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(imageUrls => {
        if (activeTab === 'Services') {
          setWorkImages(prev => [...prev, ...imageUrls]);
        } else {
          setPhotos(prev => [...prev, ...imageUrls]);
        }
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

  // Reset form when editItem changes
  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setDescription(editItem.description || '');
      setCategory(editItem.category_id?.toString() || '');
      setCondition(editItem.condition || '');
      setLookingFor(editItem.looking_for || '');
      setPrice(editItem.price ? editItem.price.replace('$', '').replace(',', '') : '');
      setPhotos(editItem.images || editItem.gallery || []);
      // Set active tab based on item type
      if (editItem.type === 'barter') {
        setActiveTab('Swap');
      } else if (editItem.type === 'services') {
        setActiveTab('Services');
      } else {
        setActiveTab('Marketplace');
      }
    } else {
      // Reset form for new item
      setTitle('');
      setDescription('');
      setCategory('');
      setCondition('');
      setLookingFor('');
      setPrice('');
      setPhotos([]);
    }
  }, [editItem]);

  // Handle service profile submission
  const handleServiceProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setShowSuccessModal(false);

    if (!serviceCategory) {
      setError('Service category is required');
      return;
    }
    if (!serviceCity.trim()) {
      setError('City is required');
      return;
    }

    if (!token) {
      setError('You must be logged in to create a service profile');
      return;
    }

    setLoading(true);
    try {
      // Validate category ID
      const categoryId = parseInt(serviceCategory, 10);
      if (!categoryId || isNaN(categoryId)) {
        setError('Please select a valid service category');
        setLoading(false);
        return;
      }

      const payload: any = {
        service_category_id: categoryId,
        city: serviceCity.trim(),
        bio: bio.trim() || undefined,
      };

      if (startingPrice.trim()) {
        payload.starting_price = parseFloat(startingPrice.replace(/,/g, ''));
      }

      // Upload work images if we have photos
      if (workImages.length > 0) {
        // Check if photos are already URLs (from existing profile) or base64 data URIs (new uploads)
        const needsUpload = workImages.some(photo => photo.startsWith('data:image/'));
        
        if (needsUpload) {
          // Upload base64 images
          try {
            const uploadResponse = await apiFetch(ENDPOINTS.images.uploadMultipleBase64, {
              method: 'POST',
              token,
              body: {
                images: workImages,
              },
            });
            
            if (uploadResponse.success && uploadResponse.urls && uploadResponse.urls.length > 0) {
              payload.work_images = uploadResponse.urls;
            } else {
              throw new Error('Failed to upload images. Please try again.');
            }
          } catch (uploadError: any) {
            setError(uploadError.message || 'Failed to upload images. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          // Photos are already URLs (from existing profile), use them directly
          payload.work_images = workImages;
        }
      }

      await apiFetch(ENDPOINTS.serviceProviders.create, {
        method: 'POST',
        token,
        body: payload,
      });

      setSuccess(true);
      setShowSuccessModal(true);
      
      // Reload service profile to show updated card
      const updatedResponse = await apiFetch(ENDPOINTS.serviceProviders.me, { token });
      if (updatedResponse.success && updatedResponse.data) {
        setServiceProfile(updatedResponse.data);
        setShowProfileView(true);
      }
      
      // Refresh user to update profile
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to save service profile. Please try again.');
      console.error('Service profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setShowSuccessModal(false);

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

    // Check if phone verification is required (only for new items, not edits)
    // Users can upload up to FREE_UPLOAD_LIMIT items without verification
    // After that, phone verification is required to upload more items
    if (!isEditMode && user && !user.phone_verified_at && itemsCount >= FREE_UPLOAD_LIMIT) {
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
      // Backend transforms condition for display (e.g., 'like_new' → 'Like new')
      // We need to convert it back to the backend format before sending
      let conditionValue: string | undefined = undefined;
      
      // Convert display format back to backend format
      if (condition === 'New' || condition === 'new') {
        conditionValue = 'new';
      } else if (condition === 'Like new' || condition === 'like_new') {
        conditionValue = 'like_new';
      } else if (condition === 'Used' || condition === 'used' || condition === 'used_good' || condition === 'used_fair') {
        conditionValue = 'used';
      }
      
      // Validate that we have a valid condition value
      if (!conditionValue) {
        setError('Please select a valid condition');
        setLoading(false);
        return;
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

      // Upload images first if we have photos
      // For new items, always upload photos. For edits, only upload if photos have changed
      if (photos.length > 0) {
        // Check if photos are already URLs (from existing item) or base64 data URIs (new uploads)
        const needsUpload = photos.some(photo => photo.startsWith('data:image/'));
        
        if (needsUpload) {
          // Upload base64 images
          try {
            const uploadResponse = await apiFetch(ENDPOINTS.images.uploadMultipleBase64, {
              method: 'POST',
              token,
              body: {
                images: photos,
              },
            });
            
            if (uploadResponse.success && uploadResponse.urls && uploadResponse.urls.length > 0) {
              payload.photos = uploadResponse.urls;
            } else {
              throw new Error('Failed to upload images. Please try again.');
            }
          } catch (uploadError: any) {
            setError(uploadError.message || 'Failed to upload images. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          // Photos are already URLs (from existing item), use them directly
          payload.photos = photos;
        }
      }

      // Use PUT for updates, POST for new items
      const endpoint = isEditMode 
        ? ENDPOINTS.items.update(editItem!.id)
        : ENDPOINTS.items.create;
      
      const method = isEditMode ? 'PUT' : 'POST';

      await apiFetch(endpoint, {
        method,
        token,
        body: payload,
      });

      setSuccess(true);
      setShowSuccessModal(true);
      
      // Refresh user to update items_count after successful upload
      await refreshUser();
      
      // Reset form only if not in edit mode
      if (!isEditMode) {
        setTitle('');
        setDescription('');
        setCategory('');
        setCondition('');
        setLookingFor('');
        setPrice('');
        setPhotos([]);
      }
    } catch (err: any) {
      // Check if error is due to phone verification requirement
      if (err.message?.includes('phone verification') || err.message?.includes('requires_phone_verification')) {
        setShowPhoneVerification(true);
        setError(null);
      } else {
        setError(err.message || (isEditMode ? 'Failed to update item. Please try again.' : 'Failed to post item. Please try again.'));
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

  // Show profile setup for first-time uploaders (new users without complete profile)
  if (showPreUploadProfile && !isEditMode) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <PreUploadProfileSetup
          onComplete={() => setShowPreUploadProfile(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        title={isEditMode ? "Edit Item" : "Upload"}
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
        
        {/* Error Messages */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Title Section */}
        <div>
           <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
             {isEditMode ? 'Edit Item' : 'Upload Item'}
           </h2>
           <p className="text-gray-500 text-sm">
             {isEditMode 
               ? 'Update your item details below'
               : activeTab === 'Swap' 
                 ? 'What would you like to trade?' 
                 : activeTab === 'Marketplace' 
                   ? 'What would you like to sell?' 
                   : 'What service would you like to offer?'}
           </p>
        </div>

        {/* Services Tab - Coming Soon */}
        {activeTab === 'Services' && !isEditMode ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Services feature is under development. Check back soon!
            </p>
          </div>
        ) : (
          <>
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
              isEditMode={isEditMode}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onCategoryChange={setCategory}
              onConditionChange={setCondition}
              onLookingForChange={setLookingFor}
              onPriceChange={setPrice}
              onSubmit={handleSubmit}
            />
          </>
        )}
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
        message={needsPhoneVerification 
          ? "Verify your phone number to continue uploading items and build trust with buyers in our community."
          : undefined
        }
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        isEditMode={isEditMode}
        isServiceProfile={activeTab === 'Services'}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccess(false);
          // Call onEditComplete callback if provided and in edit mode
          if (isEditMode && onEditComplete) {
            onEditComplete();
          }
        }}
      />
    </div>
  );
};

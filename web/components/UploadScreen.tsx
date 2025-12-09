
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
import { PreUploadProfileSetup } from './upload/PreUploadProfileSetup';

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

      // Call onEditComplete callback if provided
      if (isEditMode && onEditComplete) {
        setTimeout(() => {
          onEditComplete();
        }, 1500);
      } else {
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
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
        
        {/* Verification Banner - Show different messages based on item count */}
        {user && !user.phone_verified_at && (
          <div className={`rounded-xl p-4 ${needsPhoneVerification ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${needsPhoneVerification ? 'bg-amber-100' : 'bg-blue-100'}`}>
                <svg className={`w-5 h-5 ${needsPhoneVerification ? 'text-amber-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                {needsPhoneVerification ? (
                  <>
                    <h3 className="text-amber-800 font-semibold text-sm">Verify to Upload More Items</h3>
                    <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                      You've reached the limit of {FREE_UPLOAD_LIMIT} free uploads. Verify your phone number to continue uploading items and build trust in our community.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPhoneVerification(true)}
                      className="mt-3 text-amber-700 font-bold text-sm hover:text-amber-800 underline underline-offset-2"
                    >
                      Verify Now →
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-blue-800 font-semibold text-sm">
                      {remainingFreeUploads} Free Upload{remainingFreeUploads !== 1 ? 's' : ''} Remaining
                    </h3>
                    <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                      You can upload {remainingFreeUploads} more item{remainingFreeUploads !== 1 ? 's' : ''} before verifying your phone. Verify now to unlock unlimited uploads!
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPhoneVerification(true)}
                      className="mt-3 text-blue-700 font-bold text-sm hover:text-blue-800 underline underline-offset-2"
                    >
                      Verify Early →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {isEditMode ? 'Item updated successfully!' : 'Item posted successfully!'}
            </div>
        )}
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
        message={needsPhoneVerification 
          ? `You've used your ${FREE_UPLOAD_LIMIT} free uploads! Verify your phone number to continue uploading items and build trust with buyers in our community.`
          : undefined
        }
      />
    </div>
  );
};

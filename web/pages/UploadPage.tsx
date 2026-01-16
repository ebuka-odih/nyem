
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Edit3,
  Trash2,
  ImageIcon,
  LayoutGrid,
  PlusSquare,
  Send,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { useCategories } from '../hooks/api/useCategories';
import { useProfile } from '../hooks/api/useProfile';
import { useCreateListing, useUpdateListing, useDeleteListing } from '../hooks/api/useListings';

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

interface Category {
  id: number;
  name: string;
  order?: number;
}

interface UserListing {
  id: string | number;
  title: string;
  photos?: string[];
  price?: number;
  status: string;
  category_id?: number;
  condition?: string;
  description?: string;
}

export const UploadPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collection' | 'new'>('new');
  const [editingItem, setEditingItem] = useState<UserListing | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { data: userData, isLoading: loadingListings, refetch: fetchUserListings } = useProfile();
  const { data: categories = [], isLoading: loadingCategories } = useCategories('Shop');
  const createListingMutation = useCreateListing();
  const updateListingMutation = useUpdateListing();
  const deleteListingMutation = useDeleteListing();

  // Form States
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Phone Verification States
  const [phone, setPhone] = useState(userData?.phone || "");
  const [otpCode, setOtpCode] = useState("");
  const [verificationStep, setVerificationStep] = useState<'input' | 'otp'>('input');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [expiryTime, setExpiryTime] = useState<string | null>(null);

  // Sync phone from userData
  useEffect(() => {
    if (userData?.phone && !phone) {
      setPhone(userData.phone);
    }
  }, [userData?.phone]);

  const myListings = (userData?.listings || userData?.items || []).map((listing: any) => ({
    id: listing.id,
    title: listing.title || listing.name || 'Untitled',
    photos: listing.photos || (listing.image ? [listing.image] : []),
    price: listing.price,
    status: listing.status || 'active',
    category_id: listing.category_id,
    condition: listing.condition,
    description: listing.description,
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitting = createListingMutation.isPending || updateListingMutation.isPending;

  // Condition options matching backend Listing model constants
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'used', label: 'Used' },
    { value: 'fair', label: 'Fair' },
  ];

  const [isUploading, setIsUploading] = useState(false);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    const remainingSlots = 4 - images.length;
    const filesToUpload = (Array.from(files) as File[]).slice(0, remainingSlots);

    if (filesToUpload.length < files.length) {
      setError(`Only ${remainingSlots} more images allowed. Selected first ${remainingSlots}.`);
    } else {
      setError(null);
    }

    const newPreviews = filesToUpload.map(file => URL.createObjectURL(file));
    const startIdx = images.length;
    setImages(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      setIsUploading(true);
      const token = getStoredToken();
      if (!token) {
        setError('Please login to upload images');
        setIsUploading(false);
        return;
      }

      const uploadPromises = filesToUpload.map(async (file, idx) => {
        const targetIdx = startIdx + idx;
        const localBlobUrl = newPreviews[idx];

        try {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large (max 10MB)`);
          }

          const formData = new FormData();
          formData.append('image', file);

          const result = await apiFetch<{ url: string }>(ENDPOINTS.images.upload, {
            method: 'POST',
            token,
            body: formData,
          });

          if (!result.url) {
            throw new Error('Upload failed');
          }

          setImages(prev => {
            const next = [...prev];
            if (next[targetIdx] === localBlobUrl) {
              next[targetIdx] = result.url;
              URL.revokeObjectURL(localBlobUrl);
            }
            return next;
          });
        } catch (err: any) {
          console.error(`Failed to upload image ${idx}:`, err);
          setImages(prev => prev.filter(url => url !== localBlobUrl));
          URL.revokeObjectURL(localBlobUrl);
          setError(`Failed to upload ${file.name}: ${err.message}`);
        }
      });

      await Promise.all(uploadPromises);
    } catch (err: any) {
      console.error('Batch upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startEdit = (item: UserListing) => {
    setEditingItem(item);
    setTitle(item.title);
    setDesc(item.description || '');
    setImages(item.photos || []);
    setSelectedCategoryId(item.category_id || '');
    setSelectedCondition(item.condition || '');
    setPrice(item.price ? String(item.price).replace(/[₦,]/g, '') : '');
    setActiveTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setDesc("");
    setImages([]);
    setSelectedCategoryId("");
    setSelectedCondition("");
    setPrice("");
    setError(null);
  };

  // Handle auto-edit from URL parameter
  useEffect(() => {
    if (editId && myListings.length > 0 && !editingItem) {
      const itemToEdit = myListings.find(item => String(item.id) === String(editId));
      if (itemToEdit) {
        startEdit(itemToEdit);
        setActiveTab('new');
      }
    }
  }, [editId, myListings, editingItem]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setIsSendingOtp(true);
      setError(null);
      const result = await apiFetch<{ message: string, expires_at: string }>(ENDPOINTS.auth.sendOtp, {
        method: 'POST',
        body: { phone }
      });

      setVerificationStep('otp');
      setExpiryTime(result.expires_at);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setError(null);
      const token = getStoredToken();
      await apiFetch(ENDPOINTS.auth.verifyPhoneForSeller, {
        method: 'POST',
        token,
        body: { phone, code: otpCode }
      });

      // Success! Refetch profile to update phone_verified_at
      await fetchUserListings();
      setVerificationStep('input');
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (!userData?.city_id && !userData?.city) {
      setError('Please complete your profile (City & Area) before publishing');
      return;
    }

    if (!title.trim()) {
      setError('Listing title is required');
      return;
    }
    if (images.length < 2) {
      setError(images.length === 1
        ? 'You have only 1 image. Please upload at least one more.'
        : 'At least 2 images are required');
      return;
    }
    if (!selectedCategoryId) {
      setError('Category is required');
      return;
    }
    if (!selectedCondition) {
      setError('Condition is required');
      return;
    }
    if (!price.trim() || parseFloat(price) <= 0) {
      setError('Valid price is required');
      return;
    }

    try {
      setError(null);
      const payload: any = {
        title: title.trim(),
        description: desc.trim() || null,
        category_id: Number(selectedCategoryId),
        condition: selectedCondition,
        photos: images,
        type: 'marketplace',
        price: parseFloat(price),
      };

      if (editingItem) {
        await updateListingMutation.mutateAsync({ id: editingItem.id, data: payload });
        setActiveTab('collection');
        resetForm();
      } else {
        await createListingMutation.mutateAsync(payload);
        setActiveTab('collection');
        resetForm();
      }
    } catch (err: any) {
      console.error('Failed to submit listing:', err);
      setError(err.message || 'Failed to save listing. Please try again.');
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteListingMutation.mutateAsync(id);
    } catch (err: any) {
      console.error('Failed to delete listing:', err);
      setError(err.message || 'Failed to delete listing. Please try again.');
      alert(err.message || 'Failed to delete listing. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col gap-6"
    >
      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-neutral-100 p-1 rounded-3xl shrink-0">
        <button
          onClick={() => setActiveTab('collection')}
          className={`relative flex-1 py-3.5 flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'collection' ? 'bg-white text-[#830e4c] shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          <LayoutGrid size={16} strokeWidth={activeTab === 'collection' ? 3 : 2} />
          Your Collection
        </button>
        <button
          onClick={() => { setActiveTab('new'); if (!editingItem) resetForm(); }}
          className={`relative flex-1 py-3.5 flex items-center justify-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'new' ? 'bg-white text-[#830e4c] shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          <PlusSquare size={16} strokeWidth={activeTab === 'new' ? 3 : 2} />
          {editingItem ? 'Edit Drop' : 'New Drop'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'collection' ? (
          <motion.div
            key="collection-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={subtleTransition}
            className="grid grid-cols-2 gap-4 pb-20"
          >
            <button
              onClick={() => setActiveTab('new')}
              className="aspect-square bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-[#830e4c33] hover:bg-[#830e4c1a]/30 transition-all group shadow-sm"
            >
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-neutral-100 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                <Plus size={28} className="text-neutral-400 group-hover:text-[#830e4c]" strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Add New Drop</span>
            </button>

            {loadingListings ? (
              <div className="col-span-2 flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-[#830e4c] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              myListings.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="group relative aspect-square bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-neutral-100"
                >
                  {item.photos && item.photos.length > 0 && (
                    <img
                      src={item.photos[0]}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={item.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border ${item.status === 'active' ? 'bg-[#830e4c]/90' : 'bg-emerald-500/90'} text-white border-white/20`}>
                      {item.status === 'active' ? 'Active' : item.status}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <h4 className="text-white text-xs font-black uppercase tracking-widest truncate w-full px-2">{item.title}</h4>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} className="p-3 bg-white text-[#830e4c] rounded-2xl active:scale-90 shadow-xl"><Edit3 size={18} strokeWidth={2.5} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-rose-500 text-white rounded-2xl active:scale-90 shadow-xl"><Trash2 size={18} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {!loadingListings && myListings.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-neutral-400 mb-2">No listings yet</p>
                <p className="text-xs text-neutral-300">Create your first listing to get started</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="new-drop-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={subtleTransition}
            className="space-y-8 flex flex-col pb-32"
          >
            {(!userData?.city_id && !userData?.city) ? (
              <div className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-7 text-center shadow-xl shadow-amber-900/5 mt-2">
                <div className="w-14 h-14 bg-amber-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-amber-600" />
                </div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-[0.2em] mb-3 italic">Complete Your Profile</h4>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed mb-6 px-4">
                  Buyers need to know where you're located! Please set your <span className="font-black text-amber-900">City & Area</span> in settings before you can publish listings.
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full bg-amber-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg shadow-amber-600/20"
                >
                  Navigate to Settings
                </button>
              </div>
            ) : !userData?.phone_verified_at ? (
              <div className="bg-[#830e4c]/5 border border-[#830e4c]/10 rounded-[2.5rem] p-7 text-center shadow-xl shadow-[#830e4c]/5 mt-2">
                <div className="w-14 h-14 bg-[#830e4c]/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={24} className="text-[#830e4c]" />
                </div>
                <h4 className="text-sm font-black text-[#830e4c] uppercase tracking-[0.2em] mb-3 italic">Verify Your Identity</h4>
                <p className="text-[11px] text-neutral-600 font-medium leading-relaxed mb-6 px-4">
                  For a safer marketplace, sellers are required to verify their <span className="font-black text-[#830e4c]">Phone Number</span> before publishing.
                </p>

                {verificationStep === 'input' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Phone size={14} className="text-neutral-400" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g., +234 800 000 0000"
                        className="w-full bg-white border border-neutral-200 rounded-2xl pl-12 pr-4 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-[#830e4c] transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || !phone}
                      className="w-full bg-[#830e4c] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg shadow-[#830e4c]/20 flex items-center justify-center gap-2"
                    >
                      {isSendingOtp ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Verification Link</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="ENTER 6-DIGIT CODE"
                        className="w-full bg-white border border-neutral-200 rounded-2xl px-4 py-4 text-center text-lg font-black tracking-[0.5em] focus:outline-none focus:border-[#830e4c] transition-all placeholder:text-[10px] placeholder:tracking-widest placeholder:font-medium"
                      />
                    </div>
                    <button
                      onClick={handleVerifyPhone}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="w-full bg-[#830e4c] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg shadow-[#830e4c]/20 flex items-center justify-center gap-2"
                    >
                      {isVerifyingOtp ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Verify & Continue</span>
                      )}
                    </button>
                    <button
                      onClick={() => setVerificationStep('input')}
                      className="text-[9px] font-black text-neutral-400 uppercase tracking-widest hover:text-[#830e4c] transition-colors"
                    >
                      Change Number
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Context Header */}
                {editingItem && (
                  <div className="flex items-center justify-between bg-[#830e4c] rounded-[2rem] p-5 shadow-xl border border-white/10 shrink-0">
                    <div className="flex items-center gap-4 overflow-hidden">
                      {editingItem.photos && editingItem.photos.length > 0 && (
                        <img
                          src={editingItem.photos[0]}
                          className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0"
                          alt={editingItem.title}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Editing Drop</span>
                        <h4 className="text-white text-xs font-black uppercase truncate tracking-tight">{editingItem.title}</h4>
                      </div>
                    </div>
                    <button onClick={resetForm} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all active:scale-90 shrink-0">
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                )}

                {/* Media Upload Section */}
                <div className="space-y-4 shrink-0">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em]">Product Imagery</label>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${images.length === 1 ? 'text-amber-600' : 'text-neutral-400'}`}>
                      {images.length}/4 (Min 2 Required)
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => {
                      const isLocal = img.startsWith('blob:');
                      return (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={img}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-200 shadow-sm group"
                        >
                          <img src={img} className="w-full h-full object-cover" alt={`Upload ${idx + 1}`} />

                          {isLocal && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (isLocal) URL.revokeObjectURL(img);
                              removeImage(idx);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </motion.div>
                      );
                    })}

                    {images.length < 4 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`aspect-square rounded-2xl bg-white border-2 border-dashed ${images.length === 1 ? 'border-amber-400 bg-amber-50/50' : 'border-neutral-200'} flex flex-col items-center justify-center text-neutral-400 hover:text-[#830e4c] hover:border-[#830e4c33] hover:bg-[#830e4c1a]/30 transition-all active:scale-95 group shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploading ? (
                          <div className="w-6 h-6 border-2 border-[#830e4c] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ImageIcon size={20} className={`group-hover:scale-110 transition-transform ${images.length === 1 ? 'text-amber-500' : ''}`} />
                            {images.length === 1 && (
                              <span className="text-[8px] font-black text-amber-600 uppercase mt-1 tracking-tight">Add 1 More</span>
                            )}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Structured Form Fields */}
                <div className="space-y-6">
                  {/* 1. Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Listing Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., iPhone 15 Pro Max"
                      className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm placeholder:text-neutral-200"
                    />
                  </div>

                  {/* 2. Description */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Description</label>
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Tell buyers why they need this..."
                      rows={4}
                      className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm placeholder:text-neutral-200 resize-none"
                    />
                  </div>

                  {/* 3. Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Category</label>
                    <select
                      value={selectedCategoryId === '' ? '' : String(selectedCategoryId)}
                      onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
                      disabled={loadingCategories}
                      className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 text-[11px] font-black uppercase tracking-widest text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Category</option>
                      {Array.isArray(categories) && categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Condition */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Condition</label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 text-[11px] font-black uppercase tracking-widest text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm"
                    >
                      <option value="">Item Condition</option>
                      {conditions.map((cond) => (
                        <option key={cond.value} value={cond.value}>
                          {cond.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Price */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Asking Price</label>
                    <div className="flex h-[62px] bg-white border border-neutral-300 rounded-[1.5rem] focus-within:border-[#830e4c] focus-within:ring-4 focus-within:ring-[#830e4c]/5 transition-all overflow-hidden shadow-sm items-stretch">
                      <div className="flex items-center justify-center pl-6 pr-3 border-r border-neutral-100 bg-neutral-50/30 shrink-0">
                        <span className="text-[#830e4c] font-black text-lg">₦</span>
                      </div>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full bg-transparent border-none px-4 py-0 text-sm font-black text-neutral-900 focus:ring-0 focus:outline-none placeholder:text-neutral-200"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || isUploading}
                  className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading Images...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className="text-white/60" />
                      {editingItem ? 'Finalize Updates' : 'Publish to Marketplace'}
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

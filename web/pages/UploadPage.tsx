
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ChevronDown, 
  X, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  ImageIcon, 
  LayoutGrid, 
  PlusSquare,
  Send
} from 'lucide-react';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

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
  
  // Form States
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [showConditionList, setShowConditionList] = useState(false);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [myListings, setMyListings] = useState<UserListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Condition options matching backend Listing model constants
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'used', label: 'Used' },
    { value: 'fair', label: 'Fair' },
  ];

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch user listings when collection tab is active
  useEffect(() => {
    if (activeTab === 'collection') {
      fetchUserListings();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = getStoredToken();
      const response = await apiFetch<{ categories: Category[] }>(ENDPOINTS.categories, { token });
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please refresh the page.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      setLoadingListings(true);
      const token = getStoredToken();
      if (!token) return;

      const response = await apiFetch<{ user: { items?: UserListing[]; listings?: UserListing[] } }>(ENDPOINTS.profile.me, { token });
      const userData = response.user || (response as any).data?.user;
      const listings = userData?.listings || userData?.items || [];
      
      // Format listings for display
      const formattedListings: UserListing[] = listings.map((listing: any) => ({
        id: listing.id,
        title: listing.title || listing.name || 'Untitled',
        photos: listing.photos || (listing.image ? [listing.image] : []),
        price: listing.price,
        status: listing.status || 'active',
        category_id: listing.category_id,
        condition: listing.condition,
        description: listing.description,
      }));
      
      setMyListings(formattedListings);
    } catch (err) {
      console.error('Failed to fetch user listings:', err);
      setError('Failed to load your listings. Please refresh the page.');
    } finally {
      setLoadingListings(false);
    }
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    try {
      setError(null);
      const token = getStoredToken();
      if (!token) {
        setError('Please login to upload images');
        return;
      }

      // Convert files to base64
      const base64Promises = Array.from(files).slice(0, 4 - images.length).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(base64Promises);

      // Upload images
      const uploadPromises = base64Images.map((base64) => {
        return apiFetch<{ url: string }>(ENDPOINTS.images.uploadBase64, {
          method: 'POST',
          token,
          body: { image: base64 },
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      const newUrls = uploadResults.map((result) => result.url);
      
      setImages([...images, ...newUrls]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Failed to upload images:', err);
      setError(err.message || 'Failed to upload images. Please try again.');
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

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Listing title is required');
      return;
    }
    if (images.length === 0) {
      setError('At least one image is required');
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
      setSubmitting(true);
      setError(null);
      const token = getStoredToken();
      if (!token) {
        setError('Please login to create a listing');
        return;
      }

      const payload: any = {
        title: title.trim(),
        description: desc.trim() || null,
        category_id: Number(selectedCategoryId),
        condition: selectedCondition,
        photos: images,
        type: 'marketplace', // Default to marketplace for now
        price: parseFloat(price),
      };

      if (editingItem) {
        // Update existing listing
        const response = await apiFetch(ENDPOINTS.items.update(editingItem.id), {
          method: 'PUT',
          token,
          body: payload,
        });
        
        // Refresh listings
        await fetchUserListings();
        setActiveTab('collection');
        resetForm();
      } else {
        // Create new listing
        const response = await apiFetch(ENDPOINTS.items.create, {
          method: 'POST',
          token,
          body: payload,
        });
        
        // Refresh listings
        await fetchUserListings();
        setActiveTab('collection');
        resetForm();
      }
    } catch (err: any) {
      console.error('Failed to submit listing:', err);
      setError(err.message || 'Failed to save listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const token = getStoredToken();
      if (!token) return;

      await apiFetch(ENDPOINTS.items.delete(id), {
        method: 'DELETE',
        token,
      });

      // Refresh listings
      await fetchUserListings();
    } catch (err: any) {
      console.error('Failed to delete listing:', err);
      setError(err.message || 'Failed to delete listing. Please try again.');
      alert(err.message || 'Failed to delete listing. Please try again.');
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

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
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{images.length}/4 Required</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    key={idx} 
                    className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-200 shadow-sm group"
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Upload ${idx + 1}`} />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
                
                {images.length < 4 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl bg-white border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:text-[#830e4c] hover:border-[#830e4c33] hover:bg-[#830e4c1a]/30 transition-all active:scale-95 group shadow-sm"
                  >
                    <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
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
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Category</label>
                <button 
                  onClick={() => { setShowCategoryList(!showCategoryList); setShowConditionList(false); }}
                  disabled={loadingCategories}
                  className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 flex items-center justify-between text-left transition-all hover:bg-neutral-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`text-[11px] font-black uppercase tracking-widest ${selectedCategory ? 'text-[#830e4c]' : 'text-neutral-300'}`}>
                    {loadingCategories ? 'Loading...' : (selectedCategory?.name || "Select Category")}
                  </span>
                  <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showCategoryList ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCategoryList && !loadingCategories && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-[1.5rem] shadow-2xl max-h-60 overflow-y-auto p-3"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setSelectedCategoryId(cat.id); setShowCategoryList(false); }}
                          className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-neutral-50 transition-colors group"
                        >
                          <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">{cat.name}</span>
                        </button>
                      ))}
                      {categories.length === 0 && (
                        <div className="px-4 py-3.5 text-sm text-neutral-400">No categories available</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Condition */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Condition</label>
                <button 
                  onClick={() => { setShowConditionList(!showConditionList); setShowCategoryList(false); }}
                  className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 flex items-center justify-between text-left transition-all hover:bg-neutral-50 shadow-sm"
                >
                  <span className={`text-[11px] font-black uppercase tracking-widest ${selectedCondition ? 'text-[#830e4c]' : 'text-neutral-300'}`}>
                    {selectedCondition ? conditions.find(c => c.value === selectedCondition)?.label : "Item Condition"}
                  </span>
                  <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showConditionList ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showConditionList && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-[1.5rem] shadow-2xl p-3"
                    >
                      {conditions.map((cond) => (
                        <button
                          key={cond.value}
                          onClick={() => { setSelectedCondition(cond.value); setShowConditionList(false); }}
                          className="w-full text-left px-4 py-4 rounded-xl hover:bg-neutral-50 flex items-center gap-4 transition-colors group"
                        >
                          <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <ShieldCheck size={16} />
                          </div>
                          <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">{cond.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
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
              disabled={submitting}
              className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} className="text-white/60" />
                  {editingItem ? 'Finalize Updates' : 'Publish to Marketplace'}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

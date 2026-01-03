import React, { useState } from 'react';
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
import { CATEGORIES_DATA } from '../data';

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

export const UploadPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collection' | 'new'>('new');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  // Form States
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [showConditionList, setShowConditionList] = useState(false);
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("FIXED");

  // Mock Active Listings
  const [myListings, setMyListings] = useState([
    {
      id: 1,
      name: "Vintage Film Camera",
      price: "₦115,000",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400",
      status: 'Active',
      views: 124,
      category: 'ELECTRONICS',
      condition: 'Used',
      description: 'Perfectly functional Canon AE-1 with 50mm f/1.8 lens.'
    },
    {
      id: 2,
      name: "Smart Coffee Scale",
      price: "₦42,000",
      image: "https://images.unsplash.com/photo-1544350285-1811bc3bb970?auto=format&fit=crop&q=80&w=400",
      status: 'Under Review',
      views: 12,
      category: 'HOME & DECOR',
      condition: 'New',
      description: 'High precision digital scale for perfect pour-overs.'
    }
  ]);

  const addPhoto = () => {
    if (images.length < 4) {
      const mockImages = [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400"
      ];
      setImages([...images, mockImages[images.length % mockImages.length]]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setTitle(item.name);
    setDesc(item.description);
    setImages([item.image]);
    setSelectedCategory(item.category);
    setSelectedCondition(item.condition);
    setPrice(item.price.replace('₦', '').replace(',', ''));
    setActiveTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle("");
    setDesc("");
    setImages([]);
    setSelectedCategory("");
    setSelectedCondition("");
    setPrice("");
    setPriceType("FIXED");
  };

  const handleAction = () => {
    setActiveTab('collection');
    resetForm();
  };

  const conditions = ["New", "Likely New", "Used"];

  return (
    <MotionDiv 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="w-full flex flex-col gap-6"
    >
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
          <MotionDiv 
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

            {myListings.map((item) => (
              <MotionDiv 
                layout
                key={item.id} 
                className="group relative aspect-square bg-white rounded-[2.5rem] overflow-hidden shadow-md border border-neutral-100"
              >
                <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.name} />
                <div className="absolute top-4 left-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border ${item.status === 'Active' ? 'bg-[#830e4c]/90' : 'bg-emerald-500/90'} text-white border-white/20`}>
                    {item.status}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <h4 className="text-white text-xs font-black uppercase tracking-widest truncate w-full px-2">{item.name}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="p-3 bg-white text-[#830e4c] rounded-2xl active:scale-90 shadow-xl"><Edit3 size={18} strokeWidth={2.5} /></button>
                    <button onClick={() => setMyListings(prev => prev.filter(l => l.id !== item.id))} className="p-3 bg-rose-500 text-white rounded-2xl active:scale-90 shadow-xl"><Trash2 size={18} strokeWidth={2.5} /></button>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>
        ) : (
          <MotionDiv 
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
                  <img src={editingItem.image} className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Editing Drop</span>
                    <h4 className="text-white text-xs font-black uppercase truncate tracking-tight">{editingItem.name}</h4>
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
                  <MotionDiv 
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-200 shadow-sm group"
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </MotionDiv>
                ))}
                
                {images.length < 4 && (
                  <button 
                    onClick={addPhoto}
                    className="aspect-square rounded-2xl bg-white border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:text-[#830e4c] hover:border-[#830e4c33] hover:bg-[#830e4c1a]/30 transition-all active:scale-95 group shadow-sm"
                  >
                    <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Structured Form Fields */}
            <div className="space-y-6">
              {/* 1. Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Listing Title</label>
                <input 
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., iPhone 15 Pro Max" 
                  className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm placeholder:text-neutral-200"
                />
              </div>

              {/* 2. Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Description</label>
                <textarea 
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Tell buyers why they need this..." rows={4}
                  className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm placeholder:text-neutral-200 resize-none"
                />
              </div>

              {/* 3. Category */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Category</label>
                <button 
                  onClick={() => { setShowCategoryList(!showCategoryList); setShowConditionList(false); }}
                  className="w-full bg-white border border-neutral-300 rounded-[1.5rem] px-6 py-5 flex items-center justify-between text-left transition-all hover:bg-neutral-50 shadow-sm"
                >
                  <span className={`text-[11px] font-black uppercase tracking-widest ${selectedCategory ? 'text-[#830e4c]' : 'text-neutral-300'}`}>
                    {selectedCategory || "Select Category"}
                  </span>
                  <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showCategoryList ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCategoryList && (
                    <MotionDiv 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-[1.5rem] shadow-2xl max-h-60 overflow-y-auto p-3"
                    >
                      {CATEGORIES_DATA.filter(c => c.name !== "All").map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => { setSelectedCategory(cat.name); setShowCategoryList(false); }}
                          className="w-full text-left px-4 py-3.5 rounded-xl hover:bg-neutral-50 flex items-center gap-4 transition-colors group"
                        >
                          <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-[#830e4c] group-hover:text-white transition-colors">
                            <cat.icon size={16} />
                          </div>
                          <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">{cat.name}</span>
                        </button>
                      ))}
                    </MotionDiv>
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
                    {selectedCondition || "Item Condition"}
                  </span>
                  <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showConditionList ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showConditionList && (
                    <MotionDiv 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-[1.5rem] shadow-2xl p-3"
                    >
                      {conditions.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => { setSelectedCondition(cond); setShowConditionList(false); }}
                          className="w-full text-left px-4 py-4 rounded-xl hover:bg-neutral-50 flex items-center gap-4 transition-colors group"
                        >
                          <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-[#830e4c] group-hover:text-white transition-colors">
                            <ShieldCheck size={16} />
                          </div>
                          <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest">{cond}</span>
                        </button>
                      ))}
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>

              {/* 5. Price Row (Last Input) */}
              <div className="flex gap-3 w-full">
                <div className="flex-1 space-y-2">
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
                      className="w-full bg-transparent border-none px-4 py-0 text-sm font-black text-neutral-900 focus:ring-0 focus:outline-none placeholder:text-neutral-200" 
                    />
                  </div>
                </div>

                <div className="w-[140px] space-y-2 shrink-0">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 text-center block w-full">Type</label>
                  <div className="relative h-[62px]">
                    <select 
                      value={priceType}
                      onChange={(e) => setPriceType(e.target.value)}
                      className="w-full h-full bg-white border border-neutral-300 rounded-[1.5rem] px-5 text-[10px] font-black uppercase tracking-widest text-[#830e4c] appearance-none focus:outline-none focus:border-[#830e4c] focus:ring-4 focus:ring-[#830e4c]/5 transition-all shadow-sm pr-12 cursor-pointer"
                    >
                      <option value="FIXED">Fixed</option>
                      <option value="NEGOTIABLE">Negotiable</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                      <ChevronDown size={14} strokeWidth={4} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAction}
              className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 shrink-0"
            >
              <Send size={16} className="text-white/60" />
              {editingItem ? 'Finalize Updates' : 'Publish to Marketplace'}
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>
    </MotionDiv>
  );
};
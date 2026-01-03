import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Compass, 
  PlusCircle, 
  MessageSquare, 
  User, 
  RotateCcw, 
  Share2, 
  Globe, 
  MapPin, 
  Check, 
  ChevronRight, 
  Zap, 
  Trash2, 
  Heart, 
  Settings, 
  Sparkles,
  BadgeCheck,
  Star,
  Info,
  SendHorizontal,
  ChevronLeft,
  X
} from 'lucide-react';
import { Product, Vendor } from './types';
import { PRODUCTS, CATEGORIES_DATA, NIGERIA_CITIES } from './data';
import { SwipeCard } from './components/SwipeCard';
import { SwipeControls } from './components/SwipeControls';
import { Modal } from './components/Modal';
import { UploadPage } from './pages/UploadPage';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OtpVerificationPage } from './pages/OtpVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ComingSoonState } from './components/ComingSoonState';
import { RatingStars } from './components/RatingStars';
import { SellerProfileView } from './components/SellerProfileView';

// New Layouts
import { AuthLayout } from './components/AuthLayout';
import { DiscoverLayout } from './components/DiscoverLayout';
import { GeneralLayout } from './components/GeneralLayout';

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

type AuthState = 'welcome' | 'login' | 'register' | 'otp' | 'forgot' | 'authenticated';

export const App = () => {
  const [items, setItems] = useState<Product[]>(PRODUCTS);
  const [history, setHistory] = useState<Product[]>([]);
  const [likedItems, setLikedItems] = useState<Product[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);
  
  // Navigation State for Discover Sub-Pages
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewingSeller, setViewingSeller] = useState<Vendor | null>(null);

  const [triggerDir, setTriggerDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [showSellerToast, setShowSellerToast] = useState(false);
  const [lastSparkedItem, setLastSparkedItem] = useState<Product | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentCity, setCurrentCity] = useState("All Locations");

  const [activeTab, setActiveTab] = useState<'marketplace' | 'services' | 'barter'>('marketplace');
  const [activePage, setActivePage] = useState<'discover' | 'upload' | 'matches' | 'profile'>('discover');
  
  const [authState, setAuthState] = useState<AuthState>('welcome');
  const [tempUserEmail, setTempUserEmail] = useState("");
  const [forceProfileSettings, setForceProfileSettings] = useState(0);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendNativeNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { 
        body, 
        icon: icon || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=100'
      });
    }
  };

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS;
    if (activeCategory !== "All") result = result.filter(p => p.category.toUpperCase() === activeCategory.toUpperCase());
    if (currentCity !== "All Locations") result = result.filter(p => p.vendor.location.toLowerCase().includes(currentCity.toLowerCase()));
    return result;
  }, [activeCategory, currentCity]);

  useEffect(() => {
    setItems([...filteredProducts]);
    setHistory([]);
  }, [filteredProducts]);

  const activeIndex = items.length - 1;

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    const swipedItem = items[activeIndex];
    if (!swipedItem) return;
    
    if (direction === 'up') {
      setLastSparkedItem(swipedItem);
      setShowSellerToast(true);
      sendNativeNotification(
        "New Super Interest! ⚡️",
        `A buyer is highly interested in your "${swipedItem.name}". Open Nyem to chat!`,
        swipedItem.images[0]
      );
      setTimeout(() => setShowSellerToast(false), 3500);
    }
    
    if (direction === 'right' || direction === 'up') {
      const enhancedItem = direction === 'up' ? { ...swipedItem, isSuper: true } : swipedItem;
      setLikedItems(prev => prev.find(i => i.id === enhancedItem.id) ? prev : [...prev, enhancedItem]);
    }
    setHistory(prev => [...prev, swipedItem]);
    setItems(prev => prev.slice(0, -1));
    setTriggerDir(null);
  }, [items, activeIndex]);

  const handleShare = async (product: Product | null = null) => {
    const itemToShare = product || items[activeIndex] || selectedProduct;
    if (!itemToShare) return;
    
    const deepLink = `https://nyem.app/item/${itemToShare.id}`;
    
    window.focus();

    if (navigator.share) {
      try { 
        await navigator.share({ 
          title: itemToShare.name, 
          text: `Check out this ${itemToShare.name} on Nyem! It's going for ${itemToShare.price}.`, 
          url: deepLink 
        }); 
        return;
      } catch (err: any) { 
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(deepLink);
      alert('Item link copied to clipboard!'); 
    } catch (err) {
      const dummy = document.createElement("input");
      document.body.appendChild(dummy);
      dummy.value = deepLink;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      alert('Item link copied!');
    }
  };

  const undoLast = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setItems(prev => [...prev, last]);
    setHistory(prev => prev.slice(0, -1));
    setLikedItems(prev => prev.filter(i => i.id !== last.id));
  };

  const refreshDrops = () => {
    if (activeCategory === "All" && currentCity === "All Locations") {
      setItems([...PRODUCTS]);
      setHistory([]);
    } else {
      setActiveCategory("All");
      setCurrentCity("All Locations");
    }
  };

  const removeFromWishlist = (id: number) => {
    setLikedItems(prev => prev.filter(item => item.id !== id));
  };

  const openSellerProfile = (vendor: Vendor) => {
    setViewingSeller(vendor);
  };

  const handleProfileSettingsClick = () => {
    setForceProfileSettings(prev => prev + 1);
  };

  const renderBottomNav = () => {
    if (isChatOpen) return null;
    return (
      <nav className="w-full bg-white border-t border-neutral-100 px-4 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.03)]">
        {(['discover', 'upload', 'matches', 'profile'] as const).map((page) => {
          const isActive = activePage === page;
          const icons = { discover: Compass, upload: PlusCircle, matches: MessageSquare, profile: User };
          const Icon = icons[page];
          return (
            <button key={page} onClick={() => { setActivePage(page); setSelectedProduct(null); setViewingSeller(null); }} className={`flex flex-col items-center gap-1 transition-all duration-300 relative min-w-[70px] ${isActive ? 'text-[#830e4c]' : 'text-neutral-400'}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">{page}</span>
              {isActive && <MotionDiv layoutId="navIndicator" className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-[#830e4c]" />}
            </button>
          );
        })}
      </nav>
    );
  };

  if (authState !== 'authenticated') {
    return (
      <AuthLayout>
        <AnimatePresence mode="wait">
          {authState === 'welcome' && (
            <WelcomePage 
              onStart={() => setAuthState('authenticated')} 
              onLogin={() => setAuthState('login')}
              onRegister={() => setAuthState('register')}
            />
          )}
          {authState === 'login' && (
            <LoginPage 
              onLogin={() => setAuthState('authenticated')} 
              onGoToRegister={() => setAuthState('register')}
              onGoToForgot={() => setAuthState('forgot')}
              onSkip={() => setAuthState('authenticated')}
            />
          )}
          {authState === 'register' && (
            <RegisterPage 
              onRegister={() => setAuthState('otp')}
              onGoToLogin={() => setAuthState('login')}
              onSkip={() => setAuthState('authenticated')}
            />
          )}
          {authState === 'otp' && (
            <OtpVerificationPage 
              email={tempUserEmail}
              onVerify={() => setAuthState('authenticated')}
              onBack={() => setAuthState('register')}
            />
          )}
          {authState === 'forgot' && (
            <ForgotPasswordPage 
              onBack={() => setAuthState('login')}
              onSubmit={() => setAuthState('login')}
            />
          )}
        </AnimatePresence>
      </AuthLayout>
    );
  }

  if (activePage === 'discover') {
    return (
      <DiscoverLayout
        headerProps={{
          onFilter: () => setShowFilterDialog(true),
          onLocation: () => setShowLocationDialog(true),
          onWishlist: () => setShowWishlist(true),
          activeCategory,
          setActiveTab,
          activeTab,
          wishlistCount: likedItems.length
        }}
        bottomNav={renderBottomNav()}
        floatingControls={activeTab === 'marketplace' && items.length > 0 && !selectedProduct && !viewingSeller ? (
          <SwipeControls 
            onUndo={undoLast} onNope={() => setTriggerDir('left')}
            onStar={() => setTriggerDir('up')} onLike={() => setTriggerDir('right')}
            onShare={handleShare} canUndo={history.length > 0}
          />
        ) : undefined}
      >
        <div className="flex items-center justify-center pt-0 pb-1 shrink-0 mt-[-2px]">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200/50 shadow-sm">
            <MapPin size={9} className="text-[#830e4c]" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-900/60">
              Discovery in <span className="text-[#830e4c] italic">{currentCity}</span>
            </span>
          </div>
        </div>

        <div className="relative flex-1 w-full mt-1 mb-[2px]">
          <AnimatePresence mode="popLayout">
            {activeTab === 'marketplace' ? (
              items.length > 0 ? (
                items.map((product: Product, idx: number) => (
                  <SwipeCard 
                    key={`${product.id}-${items.length}`} product={product} index={activeIndex - idx} isTop={idx === activeIndex}
                    onSwipe={handleSwipe} triggerDirection={idx === activeIndex ? triggerDir : null}
                    onShowDetail={(p) => { setActiveImageIndex(0); setSelectedProduct(p); }}
                  />
                ))
              ) : (
                <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100 shadow-inner">
                    <RotateCcw size={32} className="text-neutral-300" />
                  </div>
                  <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">End of the line</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-2 mb-8">No more drops to show right now</p>
                  <button onClick={refreshDrops} className="px-10 py-5 bg-[#830e4c] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all">Refresh Drops</button>
                </MotionDiv>
              )
            ) : (
              <div className="h-full flex items-center justify-center px-2">
                <ComingSoonState type={activeTab === 'services' ? 'services' : 'barter'} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Item Detail Page Overlay */}
        <AnimatePresence>
          {selectedProduct && (
            <MotionDiv 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-white z-[300] flex flex-col overflow-y-auto no-scrollbar"
            >
              {/* Custom Detail Header */}
              <header className="shrink-0 px-6 py-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-10">
                <button onClick={() => setSelectedProduct(null)} className="p-3 bg-neutral-100 rounded-2xl text-[#830e4c] active:scale-90 transition-all">
                  <ChevronLeft size={20} strokeWidth={3} />
                </button>
                <h3 className="text-[12px] font-black text-neutral-900 uppercase tracking-[0.2em]">Item Detail</h3>
                <button onClick={() => setSelectedProduct(null)} className="p-3 bg-neutral-100 rounded-2xl text-neutral-400 active:scale-90 transition-all">
                  <X size={20} strokeWidth={3} />
                </button>
              </header>

              <div className="flex flex-col gap-8 pb-40 px-6">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {selectedProduct.images.map((img, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveImageIndex(i)}
                        className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === i ? 'border-[#830e4c] scale-105 shadow-sm' : 'border-neutral-100 opacity-60'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <MotionDiv 
                    key={activeImageIndex}
                    initial={{ opacity: 0.8 }} animate={{ opacity: 1 }}
                    className="w-full aspect-square rounded-[2.5rem] overflow-hidden bg-neutral-100 border border-neutral-100 shadow-sm"
                  >
                    <img src={selectedProduct.images[activeImageIndex]} className="w-full h-full object-cover" />
                  </MotionDiv>
                </div>

                {/* Info Section */}
                <div className="space-y-6">
                  <div className="flex items-center">
                    <span className="text-[10px] font-black text-[#830e4c] uppercase tracking-[0.2em] bg-[#830e4c1a] px-4 py-2 rounded-xl border border-[#830e4c33]">
                      {selectedProduct.category}
                    </span>
                  </div>

                  <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic leading-[0.85] w-full">
                    {selectedProduct.name}
                  </h1>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-[#830e4c] tracking-tighter">{selectedProduct.price}</span>
                      <div className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest italic">NEGOTIABLE</span>
                    </div>
                    <button 
                      onClick={() => handleShare(selectedProduct)}
                      className="w-12 h-12 bg-[#830e4c] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    >
                      <Share2 size={18} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="h-px bg-neutral-100 w-full my-4" />

                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black text-neutral-300 uppercase tracking-[0.25em]">THE DESCRIPTION</h4>
                    <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                      {selectedProduct.longDescription}
                    </p>
                  </div>

                  {/* Owner Section (Links to Seller Page) */}
                  <div className="space-y-4 pt-4">
                    <h4 className="text-[11px] font-black text-neutral-300 uppercase tracking-[0.25em]">OWNER OF ITEM</h4>
                    <button 
                      onClick={() => openSellerProfile(selectedProduct.vendor)}
                      className="w-full bg-white rounded-[4rem] p-4 flex items-center gap-5 border border-neutral-100 shadow-[0_15px_45px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all text-left"
                    >
                      <div className="relative shrink-0">
                        <img src={selectedProduct.vendor.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-white shadow-md" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#29B3F0] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                           <div className="w-2 h-2 bg-white rounded-full opacity-60" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h4 className="text-lg font-black text-[#830e4c] uppercase italic leading-none truncate">{selectedProduct.vendor.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <Star size={14} fill="#FFD700" className="text-[#FFD700]" />
                          <span className="text-xs font-black text-neutral-900">{selectedProduct.vendor.rating.toFixed(1)}</span>
                          <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <MapPin size={10} className="text-[#830e4c]" />
                            {selectedProduct.distance} {selectedProduct.vendor.location.split(',')[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-200">
                        <ChevronRight size={24} strokeWidth={3} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Request Button */}
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 z-20">
                <button className="w-full max-w-[360px] mx-auto bg-[#830e4c] text-white py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_60px_rgba(131,14,76,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 italic">
                  <SendHorizontal size={18} strokeWidth={3} className="text-white/60" />
                  SEND REQUEST TO SELLER
                </button>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Seller Profile Page Overlay */}
        <AnimatePresence>
          {viewingSeller && (
            <SellerProfileView 
              vendor={viewingSeller} 
              onBack={() => setViewingSeller(null)}
              onClose={() => { setViewingSeller(null); setSelectedProduct(null); }} 
              onProductClick={(p) => { setViewingSeller(null); setSelectedProduct(p); }} 
            />
          )}
        </AnimatePresence>

        <Modal isOpen={showWishlist} onClose={() => setShowWishlist(false)} title="Your Wishlist" fullHeight>
          <div className="space-y-4 pb-10">
            {likedItems.length > 0 ? likedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 group">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200"><img src={item.images[0]} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">{item.isSuper && <Zap size={10} className="text-[#830e4c]" fill="currentColor" />}<span className="text-[8px] font-black text-[#830e4c] uppercase tracking-widest">{item.category}</span></div>
                  <h4 className="text-sm font-black text-neutral-900 truncate tracking-tight uppercase italic">{item.name}</h4>
                  <p className="text-xs font-black text-[#830e4c] mt-0.5">{item.price}</p>
                  <div className="flex items-center gap-3 mt-2"><button onClick={() => { setSelectedProduct(item); setShowWishlist(false); }} className="text-[9px] font-black uppercase tracking-widest text-[#830e4c] hover:text-[#830e4c]/70 transition-colors">Details</button><button onClick={() => removeFromWishlist(item.id)} className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1"><Trash2 size={10} /> Remove</button></div>
                </div>
                <button onClick={() => { setShowWishlist(false); setSelectedProduct(item); }} className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-[#830e4c] active:scale-90 transition-all"><MessageSquare size={18} strokeWidth={2.5} /></button>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4"><div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100"><Heart size={32} className="text-neutral-200" /></div><div className="space-y-1"><h4 className="text-base font-black text-neutral-900 uppercase tracking-tighter">No items yet</h4><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Swipe right on items you want to buy!</p></div></div>
            )}
          </div>
        </Modal>

        <Modal isOpen={showFilterDialog} onClose={() => setShowFilterDialog(false)} title="DISCOVERY FILTER">
          <div className="space-y-2">{CATEGORIES_DATA.map(cat => (
            <button key={cat.name} onClick={() => { setActiveCategory(cat.name); setShowFilterDialog(false); }} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${activeCategory === cat.name ? 'bg-[#830e4c] border-[#830e4c] shadow-md text-white' : 'bg-white border-neutral-50 hover:border-neutral-100'}`}>
              <div className="flex items-center gap-3.5"><div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeCategory === cat.name ? 'bg-white/20 text-white' : 'bg-neutral-50 text-neutral-400'}`}><cat.icon size={20} /></div><div className="text-left"><h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${activeCategory === cat.name ? 'text-white' : 'text-neutral-900'}`}>{cat.name}</h4><p className={`text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 ${activeCategory === cat.name ? 'text-white/70' : 'text-neutral-300'}`}>EXPLORE COLLECTION</p></div></div>
              <div className="flex items-center justify-center">{activeCategory === cat.name ? <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm"><Check size={14} strokeWidth={4} className="text-[#830e4c]" /></div> : <ChevronRight size={18} className="text-neutral-200" />}</div>
            </button>
          ))}</div>
        </Modal>

        <Modal isOpen={showLocationDialog} onClose={() => setShowLocationDialog(false)} title="SELECT CITY">
          <div className="space-y-2">{NIGERIA_CITIES.map(cityObj => (
            <button key={cityObj.city} onClick={() => { setCurrentCity(cityObj.city); setShowLocationDialog(false); }} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${currentCity === cityObj.city ? 'bg-[#830e4c1a] border-[#830e4c] shadow-sm' : 'bg-white border-neutral-50 hover:border-neutral-100'}`}>
              <div className="flex items-center gap-3.5"><div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${currentCity === cityObj.city ? 'bg-[#830e4c] text-white' : 'bg-neutral-50 text-neutral-400'}`}>{cityObj.city === "All Locations" ? <Globe size={20} /> : <MapPin size={20} />}</div><div className="text-left"><h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${currentCity === cityObj.city ? 'text-[#830e4c]' : 'text-neutral-900'}`}>{cityObj.city}</h4><p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.15em] mt-0.5">{cityObj.city === "All Locations" ? "NATIONWIDE COVERAGE" : "CITY-WIDE SEARCH"}</p></div></div>
              <div className="flex items-center justify-center">{currentCity === cityObj.city ? <div className="w-7 h-7 bg-[#830e4c] rounded-full flex items-center justify-center shadow-sm"><Check size={14} strokeWidth={4} className="text-white" /></div> : <ChevronRight size={18} className="text-neutral-200" />}</div>
            </button>
          ))}</div>
        </Modal>

        <AnimatePresence>
          {showSellerToast && lastSparkedItem && (
            <MotionDiv initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }} animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={{ opacity: 0, y: 40, x: '-50%', scale: 0.9 }} className="fixed bottom-36 left-1/2 -translate-x-1/2 w-[85%] max-w-[340px] bg-[#830e4c]/90 backdrop-blur-[40px] px-5 py-4 rounded-[2.5rem] flex items-center gap-4 z-[200] shadow-[0_25px_60px_-12px_rgba(131,14,76,0.3)] border border-white/20 ring-1 ring-black/5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-white/50"><img src={lastSparkedItem.images[0]} className="w-full h-full object-cover" /></div>
              <div className="flex flex-col flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-1"><Zap size={10} className="text-white" fill="currentColor" /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-white leading-none">Super Interest Sent!</span></div><span className="text-[11px] font-black uppercase tracking-tight text-white truncate italic">Request sent for {lastSparkedItem.name}</span></div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </DiscoverLayout>
    );
  }

  const pageTitles = { upload: 'Studio', matches: 'Inbox', profile: 'Account' };
  const rightActions = {
    upload: { icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => {} },
    matches: { icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => {} },
    profile: { icon: <Settings size={20} strokeWidth={2.5} />, onClick: handleProfileSettingsClick }
  };

  return (
    <GeneralLayout
      title={pageTitles[activePage]}
      rightAction={rightActions[activePage]}
      bottomNav={renderBottomNav()}
    >
      {activePage === 'upload' ? (
        <UploadPage />
      ) : activePage === 'matches' ? (
        <MatchesPage onChatToggle={setIsChatOpen} />
      ) : (
        <ProfilePage key={`profile-${forceProfileSettings}`} forceSettingsTab={forceProfileSettings > 0} />
      )}
    </GeneralLayout>
  );
};

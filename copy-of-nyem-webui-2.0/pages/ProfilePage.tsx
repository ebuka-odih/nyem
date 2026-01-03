import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ShieldCheck, 
  MapPin, 
  Package, 
  Star, 
  Wallet, 
  ChevronRight, 
  LogOut, 
  Bell, 
  CreditCard, 
  History,
  ExternalLink,
  Edit3,
  BadgeCheck,
  Zap,
  ArrowLeft,
  Plus,
  Lock,
  Smartphone,
  CheckCircle2,
  Clock,
  ShieldAlert,
  SmartphoneNfc,
  Building2,
  MoreVertical,
  Check,
  Banknote,
  Shield
} from 'lucide-react';

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

type SubPageView = 'main' | 'notifications' | 'payments' | 'security' | 'history';

interface ProfilePageProps {
  forceSettingsTab?: boolean;
}

const CustomToggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${active ? 'bg-[#830e4c]' : 'bg-neutral-200'}`}
  >
    <MotionDiv 
      animate={{ x: active ? 24 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-4 h-4 bg-white rounded-full shadow-md"
    />
  </button>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ forceSettingsTab }) => {
  const [activeTab, setActiveTab] = useState<'drops' | 'settings'>('drops');
  const [currentView, setCurrentView] = useState<SubPageView>('main');
  
  // Settings States
  const [notifs, setNotifs] = useState({ push: true });
  const [escrowActive, setEscrowActive] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    bankName: "Kuda Microfinance Bank",
    accountNumber: "2044291024",
    accountName: "Alex Thompson"
  });

  useEffect(() => {
    if (forceSettingsTab) {
      setActiveTab('settings');
      setCurrentView('main');
    }
  }, [forceSettingsTab]);

  const stats = [
    { label: 'Deals', value: '24', icon: Package },
    { label: 'Rating', value: '4.9', icon: Star },
    { label: 'Drops', value: '3', icon: Zap },
  ];

  const menuItems = [
    { id: 'notifications', label: 'Notification Settings', icon: Bell, color: 'text-[#830e4c]' },
    { id: 'payments', label: 'Escrow & Payments', icon: CreditCard, color: 'text-emerald-600' },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck, color: 'text-[#830e4c]' },
    { id: 'history', label: 'Trade History', icon: History, color: 'text-neutral-900' },
  ];

  const myDrops = [
    {
      id: 1,
      name: "Nebula Smart Bottle",
      price: "₦48,500",
      image: "https://images.unsplash.com/photo-1602143399827-bd95968c471c?auto=format&fit=crop&q=80&w=200",
      views: 128,
      status: 'Active'
    },
    {
      id: 2,
      name: "Vintage Film Camera",
      price: "₦115,000",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=200",
      views: 45,
      status: 'Sold'
    }
  ];

  const renderSubPage = () => {
    switch (currentView) {
      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Push Notifications</h4>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Chat messages and system alerts</p>
                </div>
                <CustomToggle active={notifs.push} onClick={() => setNotifs({...notifs, push: !notifs.push})} />
              </div>
            </div>
            
            <div className="p-5 bg-[#830e4c1a] rounded-3xl border border-[#830e4c33] flex gap-4 items-start">
              <Zap size={18} className="text-[#830e4c] shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-[#830e4c] uppercase tracking-widest leading-relaxed">
                Stay updated on the latest drops in your area by enabling location-based alerts in your phone settings.
              </p>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            {/* Escrow Activation Card */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Escrow Status</label>
              <div 
                onClick={() => setEscrowActive(!escrowActive)}
                className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${escrowActive ? 'bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white border-neutral-100 shadow-sm'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${escrowActive ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                    <Shield size={24} strokeWidth={2.5} />
                  </div>
                  <CustomToggle active={escrowActive} onClick={() => setEscrowActive(!escrowActive)} />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-base font-black uppercase tracking-tight ${escrowActive ? 'text-emerald-900' : 'text-neutral-900'}`}>
                    {escrowActive ? 'Escrow Protection Active' : 'Escrow Protection Disabled'}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${escrowActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
                    {escrowActive 
                      ? 'Your deals are secured by Nyem Escrow. Funds are held until buyers confirm delivery.' 
                      : 'Activate escrow to build trust and protect your transactions from disputes.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Withdrawal Destination */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Withdrawal Destination</label>
                <button className="text-[10px] font-black text-[#830e4c] uppercase tracking-widest flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#830e4c] rounded-2xl flex items-center justify-center text-white">
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Bank Name</h5>
                    <p className="text-sm font-black text-neutral-900 truncate">{bankDetails.bankName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Account Number</h5>
                    <p className="text-sm font-black text-neutral-900 tracking-[0.1em]">{bankDetails.accountNumber}</p>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Recipient Name</h5>
                    <p className="text-sm font-black text-neutral-900 truncate uppercase">{bankDetails.accountName}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                  <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Account verified for instant settlement</p>
              </div>
            </div>

            <button className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <Banknote size={16} strokeWidth={2.5} />
              Save Payment Settings
            </button>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Authentication</label>
              <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <SmartphoneNfc size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-neutral-900 tracking-tight">Two-Factor Auth</h4>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Check size={10} strokeWidth={4} /> Enabled
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-neutral-200" />
                </div>
                <div className="h-px bg-neutral-50" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#830e4c1a] text-[#830e4c] rounded-2xl">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-neutral-900 tracking-tight">Biometric Login</h4>
                      <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1">FaceID or Fingerprint</p>
                    </div>
                  </div>
                  <CustomToggle active={true} onClick={() => {}} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Active Sessions</label>
              <div className="bg-white border border-neutral-100 rounded-[2rem] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-[#830e4c]">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900 tracking-tight">iPhone 15 Pro</h4>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Current Device</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-[#830e4c] uppercase tracking-widest px-2 py-1 bg-[#830e4c1a] rounded-lg">Lagos, NG</span>
              </div>
            </div>
            
            <button className="w-full py-5 bg-[#830e4c] text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-xl active:scale-95 transition-all">
              Change Login Password
            </button>
          </div>
        );
      case 'history':
        return (
          <div className="space-y-4">
            {[
              { id: '1', item: 'Nike Air Max', price: '₦125,000', date: 'Oct 12, 2023', type: 'PURCHASE', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=100' },
              { id: '2', item: 'Sony WH-1000XM5', price: '₦340,000', date: 'Sep 28, 2023', type: 'SALE', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100' },
              { id: '3', item: 'Coffee Grinder', price: '₦45,000', date: 'Sep 15, 2023', type: 'PURCHASE', img: 'https://images.unsplash.com/photo-1544350285-1811bc3bb970?auto=format&fit=crop&q=80&w=100' }
            ].map((order) => (
              <div key={order.id} className="bg-white border border-neutral-100 rounded-[2.5rem] p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-100 shrink-0">
                  <img src={order.img} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit mb-1 ${order.type === 'SALE' ? 'bg-[#830e4c1a] text-[#830e4c]' : 'bg-emerald-50 text-emerald-600'}`}>
                        {order.type}
                      </span>
                      <h4 className="text-sm font-black text-neutral-900 tracking-tight uppercase italic truncate">{order.item}</h4>
                    </div>
                    <span className="text-xs font-black text-[#830e4c]">{order.price}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {order.date}
                    </p>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={10} /> Completed
                    </span>
                  </div>
                </div>
                <button className="p-2 text-neutral-200 hover:text-[#830e4c] transition-colors">
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>
            ))}
            
            <button className="w-full py-5 text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em] mt-4 flex items-center justify-center gap-2 hover:text-[#830e4c] transition-colors">
              <History size={14} /> Request Transaction Export
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={subtleTransition}
      className="w-full max-w-2xl mx-auto flex flex-col pb-48 px-4"
    >
      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <MotionDiv 
            key="main-profile"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="w-full"
          >
            {/* Profile Header */}
            <div className="flex flex-col items-center pt-8 pb-10">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[2.5rem] bg-[#830e4c1a] border-4 border-white shadow-xl overflow-hidden">
                  <img 
                    src="https://i.pravatar.cc/300?u=current_user" 
                    className="w-full h-full object-cover" 
                    alt="Profile"
                  />
                </div>
                <button className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-2xl shadow-lg border border-neutral-100 text-[#830e4c] active:scale-90 transition-all">
                  <Edit3 size={16} strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase italic">Alex Thompson</h2>
                  <BadgeCheck size={20} className="text-[#29B3F0]" fill="currentColor" />
                </div>
                <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
                  <MapPin size={12} className="text-[#830e4c]" /> Victoria Island, Lagos
                </p>
              </div>
            </div>

            {/* Wallet / Escrow Card */}
            <div className="bg-[#830e4c] rounded-[2.5rem] p-6 mb-8 shadow-2xl shadow-[#830e4c1a]/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                      <Wallet size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Escrow Balance</span>
                  </div>
                  <button className="text-[10px] font-black text-white/80 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                    Details <ExternalLink size={12} />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-black text-white tracking-tighter">₦420,500.00</h3>
                  <button className="px-5 py-2.5 bg-white text-[#830e4c] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white border border-[#830e4c1a] rounded-3xl p-4 flex flex-col items-center text-center shadow-sm">
                  <stat.icon size={18} className="text-[#830e4c] mb-2" />
                  <span className="text-lg font-black text-neutral-900 leading-none">{stat.value}</span>
                  <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mt-1.5">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Content Tabs */}
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setActiveTab('drops')}
                className={`relative px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'drops' ? 'bg-[#830e4c] text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-100'}`}
              >
                My Drops
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`relative px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-[#830e4c] text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-100'}`}
              >
                Account
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'drops' ? (
                <MotionDiv 
                  key="drops-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  {myDrops.map((drop) => (
                    <div key={drop.id} className="bg-white border border-neutral-100 rounded-[2rem] p-3 flex items-center gap-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-100">
                        <img src={drop.image} className="w-full h-full object-cover" alt={drop.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${drop.status === 'Active' ? 'bg-[#830e4c1a] text-[#830e4c]' : 'bg-neutral-100 text-neutral-400'}`}>
                            {drop.status}
                          </span>
                          <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{drop.views} Views</span>
                        </div>
                        <h4 className="text-sm font-black text-neutral-900 truncate tracking-tight">{drop.name}</h4>
                        <p className="text-xs font-black text-[#830e4c] mt-0.5">{drop.price}</p>
                      </div>
                      <button className="p-3 text-[#830e4c] hover:text-[#830e4c]/70 transition-colors">
                        <ChevronRight size={20} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-6 border-2 border-dashed border-[#830e4c1a] rounded-[2rem] flex flex-col items-center justify-center gap-2 text-neutral-300 hover:border-[#830e4c33] hover:text-[#830e4c] transition-all group">
                    <Zap size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Post a new drop</span>
                  </button>
                </MotionDiv>
              ) : (
                <MotionDiv 
                  key="settings-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-2 pb-24"
                >
                  {menuItems.map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => setCurrentView(item.id as SubPageView)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-[1.5rem] hover:bg-[#830e4c1a]/5 hover:border-[#830e4c1a] active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 bg-neutral-50 rounded-xl ${item.color}`}>
                          <item.icon size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-black text-neutral-900 tracking-tight">{item.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-neutral-200 group-hover:text-[#830e4c]" strokeWidth={3} />
                    </button>
                  ))}
                  
                  <button className="w-full flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] mt-6 hover:bg-rose-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-xl text-rose-500 shadow-sm">
                        <LogOut size={20} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-black text-rose-600 tracking-tight">Sign Out</span>
                    </div>
                  </button>
                </MotionDiv>
              )}
            </AnimatePresence>
          </MotionDiv>
        ) : (
          <MotionDiv 
            key="sub-page"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="w-full"
          >
            <div className="flex items-center gap-4 mb-8 pt-4">
              <button 
                onClick={() => setCurrentView('main')}
                className="p-3 bg-neutral-100 rounded-2xl text-[#830e4c] active:scale-90 transition-all shadow-sm"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#830e4c] uppercase tracking-[0.2em] leading-none mb-1">Account Setting</span>
                <h3 className="text-xl font-black text-neutral-900 tracking-tighter uppercase italic">
                  {menuItems.find(i => i.id === currentView)?.label || 'Settings'}
                </h3>
              </div>
            </div>
            
            <div className="pb-32">
              {renderSubPage()}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </MotionDiv>
  );
};

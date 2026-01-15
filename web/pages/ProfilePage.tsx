import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  Camera,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { getStoredUser, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { useProfile, useUpdateProfile, usePaymentSettings, useUpdatePaymentSettings, useBanks, useVerifyBank, useUpdatePassword, useTradeHistory } from '../hooks/api/useProfile';
import { useCities, useAreas } from '../hooks/api/useLocations';

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

type SubPageView = 'main' | 'notifications' | 'payments' | 'security' | 'history' | 'edit';

interface ProfilePageProps {
  forceSettingsTab?: boolean;
  onSignOut?: () => void;
  onNavigateToUpload?: () => void;
}

const CustomToggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${active ? 'bg-[#830e4c]' : 'bg-neutral-200'}`}
  >
    <motion.div
      animate={{ x: active ? 24 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-4 h-4 bg-white rounded-full shadow-md"
    />
  </button>
);

interface User {
  id: number;
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  city_id?: number;
  area_id?: number;
  bio?: string;
  profile_photo?: string;
  items_count?: number;
  cityLocation?: {
    id: number;
    name: string;
    type: string;
  };
  areaLocation?: {
    id: number;
    name: string;
    type: string;
  };
}

interface Drop {
  id: string | number;
  name: string;
  price: string;
  image: string;
  views: number;
  status: string;
}


const PaymentSettingsView: React.FC = () => {
  const { data: settings, isLoading } = usePaymentSettings();
  const { data: banks = [], isLoading: loadingBanks } = useBanks();
  const verifyBankMutation = useVerifyBank();
  const updateSettingsMutation = useUpdatePaymentSettings();

  const [escrowEnabled, setEscrowEnabled] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isverified, setIsVerified] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize state from fetched settings
  useEffect(() => {
    if (settings) {
      setEscrowEnabled(settings.escrow_enabled);
      if (settings.bank_details) {
        setAccountNumber(settings.bank_details.account_number || '');
        setAccountName(settings.bank_details.account_name || '');
        if (!settings.bank_details.account_number) {
          setIsEditing(true);
        }
      } else {
        setIsEditing(true);
      }
    }
  }, [settings]);

  // Derive bank name from code
  const selectedBankName = React.useMemo(() => {
    const bank = banks.find((b: any) => b.code === bankCode);
    return bank ? bank.name : '';
  }, [bankCode, banks]);

  // Find bank code if we have a bank name from settings but no code
  useEffect(() => {
    if (settings?.bank_details?.bank_name && banks.length > 0 && !bankCode) {
      const bank = banks.find((b: any) => b.name === settings.bank_details.bank_name);
      if (bank) {
        setBankCode(bank.code);
        setIsVerified(true); // Assume verified if loaded from DB
      }
    }
  }, [settings, banks, bankCode]);

  const handleVerify = async () => {
    if (!bankCode || accountNumber.length < 10) return;

    setIsVerifying(true);
    setVerificationError(null);
    setAccountName('');
    setIsVerified(false);

    try {
      const result = await verifyBankMutation.mutateAsync({
        account_number: accountNumber,
        bank_code: bankCode
      });
      setAccountName((result as any).account_name);
      setIsVerified(true);
    } catch (err: any) {
      setVerificationError('Could not verify account. Please check details.');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (escrowEnabled && !isverified) {
      setVerificationError('Please verify your bank account before enabling escrow.');
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        escrow_enabled: escrowEnabled,
        bank_name: selectedBankName || settings?.bank_details?.bank_name,
        account_number: accountNumber,
        account_name: accountName || settings?.bank_details?.account_name
      });
      setIsEditing(false); // Success, switch to view mode
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-400 text-xs font-black uppercase tracking-widest">Loading settings...</div>;
  }

  const hasSavedDetails = settings?.bank_details?.account_number && settings?.bank_details?.bank_name;

  return (
    <div className="space-y-6">
      {/* Escrow Activation Card */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Escrow Status</label>
        <div
          onClick={() => isverified && setEscrowEnabled(!escrowEnabled)}
          className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${escrowEnabled ? 'bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white border-neutral-100 shadow-sm'} ${!isverified ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${escrowEnabled ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <CustomToggle active={escrowEnabled} onClick={() => isverified && setEscrowEnabled(!escrowEnabled)} />
          </div>
          <div className="space-y-1">
            <h4 className={`text-base font-black uppercase tracking-tight ${escrowEnabled ? 'text-emerald-900' : 'text-neutral-900'}`}>
              {escrowEnabled ? 'Escrow Protection Active' : 'Escrow Protection Disabled'}
            </h4>
            <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${escrowEnabled ? 'text-emerald-600' : 'text-neutral-400'}`}>
              {escrowEnabled
                ? 'Your deals are secured by Nyem Escrow. Funds are held until buyers confirm delivery.'
                : 'Activate escrow to build trust and protect your transactions from disputes. You must add a verified bank account first.'}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Destination */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Withdrawal Destination</label>
          {!isEditing && hasSavedDetails && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-black text-[#830e4c] uppercase tracking-widest flex items-center gap-1.5"
            >
              <Edit3 size={12} strokeWidth={2.5} /> Edit Details
            </button>
          )}
          {isEditing && hasSavedDetails && (
            <button
              onClick={() => setIsEditing(false)}
              className="text-[10px] font-black text-neutral-400 uppercase tracking-widest"
            >
              Cancel
            </button>
          )}
        </div>

        {!isEditing && hasSavedDetails ? (
          /* View Mode Card */
          <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <Building2 size={120} />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-[#830e4c]">
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-0.5">Bank Name</p>
                  <h4 className="text-base font-black text-neutral-900 uppercase tracking-tight">{settings.bank_details.bank_name}</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Account Number</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-neutral-900 tracking-[0.1em]">{settings.bank_details.account_number}</span>
                    <BadgeCheck size={18} className="text-emerald-500" />
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-50">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Verified Account Name</p>
                  <h5 className="text-sm font-black text-neutral-900 uppercase">{settings.bank_details.account_name}</h5>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 shadow-sm space-y-5">
            {/* Bank Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} /> Bank Name
              </label>
              <div className="relative">
                <select
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    setIsVerified(false);
                  }}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all appearance-none"
                  disabled={loadingBanks}
                >
                  <option value="">Select Bank</option>
                  {banks.map((bank: any) => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={12} /> Account Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ''));
                    setIsVerified(false);
                  }}
                  maxLength={10}
                  placeholder="0123456789"
                  className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all placeholder:text-neutral-300 tracking-widest"
                />
                <button
                  onClick={handleVerify}
                  disabled={!bankCode || accountNumber.length < 10 || isVerifying}
                  className="bg-neutral-900 text-white px-6 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* Verification Result */}
            {(accountName || verificationError) && (
              <div className={`p-4 rounded-2xl ${verificationError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'} flex items-center gap-3`}>
                {verificationError ? (
                  <>
                    <ShieldAlert size={18} />
                    <span className="text-xs font-bold">{verificationError}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Verified Name</p>
                      <p className="text-sm font-black uppercase">{accountName}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending || !isverified}
                className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                <Banknote size={16} strokeWidth={2.5} />
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Payment Settings'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SecuritySettingsView: React.FC = () => {
  const updatePasswordMutation = useUpdatePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });
      setStatus({ type: 'success', message: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to update password' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Change Password</label>
        <form onSubmit={handleUpdatePassword} className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-5 shadow-sm">
          {status && (
            <div className={`p-4 rounded-xl text-xs font-bold ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {status.message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className="w-full bg-[#830e4c] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Security Options</label>
        <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-6">
          <div className="flex items-center justify-between opacity-40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-100 text-neutral-400 rounded-2xl">
                <SmartphoneNfc size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-neutral-900 tracking-tight">Two-Factor Auth</h4>
                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1">Coming Soon</p>
              </div>
            </div>
            <CustomToggle active={false} onClick={() => { }} />
          </div>
          <div className="h-px bg-neutral-50" />
          <div className="flex items-center justify-between opacity-40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-100 text-neutral-400 rounded-2xl">
                <Lock size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black text-neutral-900 tracking-tight">Biometric Login</h4>
                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1">Coming Soon</p>
              </div>
            </div>
            <CustomToggle active={false} onClick={() => { }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ forceSettingsTab, onSignOut, onNavigateToUpload }) => {
  const [activeTab, setActiveTab] = useState<'drops' | 'settings'>('drops');
  const [currentView, setCurrentView] = useState<SubPageView>('main');
  // React Query Hooks
  const { data: user, isLoading: loading, refetch: refetchUser } = useProfile();
  const { data: transactions = [], isLoading: loadingHistory } = useTradeHistory();
  const updateProfileMutation = useUpdateProfile();
  const { data: cities = [], isLoading: loadingCities } = useCities();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings States
  const [notifs, setNotifs] = useState({ push: true });

  // Local UI states for editing
  const [displayName, setDisplayName] = useState('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: areas = [], isLoading: loadingAreas } = useAreas(cityId);
  const editLoading = updateProfileMutation.isPending;
  const myDrops: Drop[] = React.useMemo(() => {
    if (!user) return [];
    const items = (user as any).items || (user as any).listings || [];
    return items
      .filter((item: any) => item.status === 'active')
      .slice(0, 5)
      .map((item: any) => {
        const photos = item.photos || [];
        const primaryImage = photos[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

        let formattedPrice = 'Price not set';
        if (item.price) {
          if (typeof item.price === 'string') {
            formattedPrice = item.price.includes('₦') ? item.price : `₦${item.price}`;
          } else {
            formattedPrice = `₦${parseFloat(item.price).toLocaleString()}`;
          }
        }

        return {
          id: item.id,
          name: item.title || 'Untitled Item',
          price: formattedPrice,
          image: primaryImage,
          views: (item.views_count || item.views || 0),
          status: item.status === 'active' ? 'Active' : 'Sold'
        };
      });
  }, [user]);

  // Manual fetches removed in favor of React Query hooks

  useEffect(() => {
    if (forceSettingsTab) {
      setActiveTab('settings');
      setCurrentView('main');
    }
  }, [forceSettingsTab]);

  // Update edit form fields when user data changes or when entering edit view
  useEffect(() => {
    if (user && currentView === 'edit') {
      setDisplayName(user.name || user.username || '');
      setCityId(user.city_id || '');
      setAreaId(user.area_id || '');
      setBio(user.bio || '');
      setProfilePhoto(user.profile_photo || null);
    }
  }, [user, currentView]);

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setEditError('Image must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setEditError('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        setEditError(null);
      };
      reader.onerror = () => {
        setEditError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = [
    {
      label: 'Deals',
      value: ((user as any)?.purchases_count || 0) + ((user as any)?.sales_count || 0),
      icon: Package
    },
    {
      label: 'Rating',
      value: (user as any)?.reviews_avg_rating ? Number((user as any).reviews_avg_rating).toFixed(1) : '0.0',
      icon: Star
    },
    {
      label: 'Drops',
      value: (user as any)?.listings_count?.toString() || user?.items_count?.toString() || '0',
      icon: Zap
    },
  ];

  const menuItems = [
    { id: 'edit', label: 'Edit Profile', icon: Edit3, color: 'text-[#830e4c]' },
    { id: 'notifications', label: 'Notification Settings', icon: Bell, color: 'text-[#830e4c]' },
    { id: 'payments', label: 'Escrow & Payments', icon: CreditCard, color: 'text-emerald-600' },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck, color: 'text-neutral-900' },
    { id: 'history', label: 'Trade History', icon: History, color: 'text-neutral-900' },
  ];


  const handleUpdateProfile = async () => {
    setEditError(null);

    if (!displayName.trim()) {
      setEditError('Display name is required');
      return;
    }

    if (!cityId) {
      setEditError('City is required');
      return;
    }

    try {
      const updateData: any = {
        name: displayName.trim(),
        city_id: typeof cityId === 'number' ? cityId : parseInt(cityId as string),
        bio: bio || undefined,
      };

      if (areaId && areaId !== '' && !isNaN(Number(areaId))) {
        updateData.area_id = typeof areaId === 'number' ? areaId : parseInt(areaId as string);
      } else {
        updateData.area_id = null;
      }

      if (profilePhoto && profilePhoto !== user?.profile_photo && profilePhoto.startsWith('data:image/')) {
        updateData.profile_photo = profilePhoto;
      }

      await updateProfileMutation.mutateAsync(updateData);
      setCurrentView('main');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    }
  };

  const renderSubPage = () => {
    switch (currentView) {
      case 'edit':
        return (
          <div className="space-y-6">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {editError}
              </div>
            )}

            {/* Profile Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="w-28 h-28 rounded-[2.5rem] bg-[#830e4c1a] border-4 border-white shadow-xl overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      className="w-full h-full object-cover"
                      alt="Profile"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/300?u=${user?.id || user?.email || 'user'}`;
                      }}
                    />
                  ) : user?.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      className="w-full h-full object-cover"
                      alt="Profile"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/300?u=${user.id || user.email || 'user'}`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://i.pravatar.cc/300?u=${user?.id || user?.email || user?.username || 'user'}`}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  )}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 bg-[#830e4c] text-white p-2.5 rounded-2xl shadow-lg border border-white active:scale-90 transition-all"
                  onClick={handlePhotoSelect}
                >
                  <Camera size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Display Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm placeholder:text-neutral-200"
              />
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">This is how your name appears to others</p>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <MapPin size={12} />
                City *
              </label>
              <div className="relative">
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value ? parseInt(e.target.value) : '')}
                  disabled={loadingCities}
                  className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-indigo-600 transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select your city</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={18} />
              </div>
              {loadingCities && (
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Loading cities...</p>
              )}
            </div>

            {/* Area */}
            {cityId && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
                  <MapPin size={12} />
                  Area {areas.length > 0 ? '(Optional)' : ''}
                </label>
                <div className="relative">
                  <select
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value ? parseInt(e.target.value) : '')}
                    disabled={loadingAreas || areas.length === 0}
                    className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select your area (optional)</option>
                    {areas.map((area: any) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={18} />
                </div>
                {loadingAreas && (
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Loading areas...</p>
                )}
                {!loadingAreas && areas.length === 0 && cityId && (
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">No areas available for this city</p>
                )}
              </div>
            )}

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm resize-none min-h-[120px] placeholder:text-neutral-200"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleUpdateProfile}
              disabled={editLoading}
              className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Push Notifications</h4>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Chat messages and system alerts</p>
                </div>
                <CustomToggle active={notifs.push} onClick={() => setNotifs({ ...notifs, push: !notifs.push })} />
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
        return <PaymentSettingsView />;
      case 'security':
        return <SecuritySettingsView />;
      case 'history':
        return (
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="p-12 text-center text-neutral-400 text-[10px] font-black uppercase tracking-widest">Loading history...</div>
            ) : transactions.length > 0 ? (
              transactions.map((order: any) => (
                <div key={order.id} className="bg-white border border-neutral-100 rounded-[2.5rem] p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-100 shrink-0 bg-neutral-50 flex items-center justify-center">
                    {order.listing?.image ? (
                      <img src={order.listing.image} className="w-full h-full object-cover" alt={order.listing.title} />
                    ) : (
                      <Package size={20} className="text-neutral-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit mb-1 ${order.type === 'SALE' ? 'bg-[#830e4c1a] text-[#830e4c]' : 'bg-emerald-50 text-emerald-600'}`}>
                          {order.type}
                        </span>
                        <h4 className="text-sm font-black text-neutral-900 tracking-tight uppercase truncate">{order.listing?.title || 'Unknown Item'}</h4>
                      </div>
                      <span className="text-xs font-black text-neutral-900">{order.price}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {order.date}
                      </p>
                      <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${order.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {order.status === 'COMPLETED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-neutral-50 flex items-center justify-center border border-neutral-100 opacity-50">
                  <History size={24} className="text-neutral-300" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-black text-neutral-400 uppercase tracking-widest">No transaction history</h4>
                  <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-[0.2em] mt-1">Activities will appear here</p>
                </div>
              </div>
            )}

            <button className="w-full py-5 text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em] mt-4 flex items-center justify-center gap-2">
              <History size={14} /> Request Transaction Export
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // Show loading state while fetching user data
  if (loading && !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={subtleTransition}
        className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center pb-48 px-4 min-h-[400px]"
      >
        <div className="w-16 h-16 border-4 border-[#830e4c] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-black text-neutral-400 uppercase tracking-widest">Loading profile...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={subtleTransition}
      className="w-full max-w-2xl mx-auto flex flex-col pb-48 px-4"
    >
      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <motion.div
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
                  {user?.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      className="w-full h-full object-cover"
                      alt="Profile"
                      onError={(e) => {
                        // Fallback to generated avatar if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/300?u=${user.id || user.email || 'user'}`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://i.pravatar.cc/300?u=${user?.id || user?.email || user?.username || 'user'}`}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-2xl shadow-lg border border-neutral-100 text-[#830e4c] active:scale-90 transition-all">
                  <Edit3 size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase italic">
                    {loading ? 'Loading...' : (user?.name || user?.username || 'User')}
                  </h2>
                  {user?.email_verified_at && (
                    <BadgeCheck size={20} className="text-[#29B3F0]" fill="currentColor" />
                  )}
                </div>
                <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
                  <MapPin size={12} /> {user?.cityLocation?.name || user?.city || 'Location not set'}
                </p>
                {user?.bio && (
                  <p className="text-xs font-medium text-neutral-500 mt-2 max-w-xs">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>


            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white border border-neutral-100 rounded-3xl p-4 flex flex-col items-center text-center">
                  <stat.icon size={18} className="text-neutral-400 mb-2" />
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
                My Listings
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
                <motion.div
                  key="drops-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  {myDrops.length > 0 ? (
                    <>
                      {myDrops.map((drop) => (
                        <div key={drop.id} className="bg-white border border-neutral-100 rounded-[2rem] p-3 flex items-center gap-4 group">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-100">
                            <img src={drop.image} className="w-full h-full object-cover" alt={drop.name} onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }} />
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
                          <button className="p-3 text-neutral-300 hover:text-neutral-900 transition-colors">
                            <ChevronRight size={20} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          if (onNavigateToUpload) {
                            onNavigateToUpload();
                          }
                        }}
                        className="w-full py-6 border-2 border-dashed border-neutral-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-neutral-300 hover:border-[#830e4c1a] hover:text-[#830e4c] transition-all group"
                      >
                        <Zap size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Post a new drop</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                        <Package size={32} className="text-neutral-300" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-base font-black text-neutral-900 uppercase tracking-tighter">No drops yet</h4>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Start sharing your items with the community!</p>
                      </div>
                      <button
                        onClick={() => {
                          if (onNavigateToUpload) {
                            onNavigateToUpload();
                          }
                        }}
                        className="w-full py-6 border-2 border-dashed border-neutral-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-neutral-300 hover:border-[#830e4c1a] hover:text-[#830e4c] transition-all group"
                      >
                        <Zap size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Post a new drop</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
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
                      className="w-full flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-[1.5rem] hover:bg-neutral-50 active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 bg-neutral-50 rounded-xl ${item.color}`}>
                          <item.icon size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-black text-neutral-900 tracking-tight">{item.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-neutral-200" strokeWidth={3} />
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      if (onSignOut) {
                        onSignOut();
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] mt-6 hover:bg-rose-100 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-xl text-rose-500 shadow-sm">
                        <LogOut size={20} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-black text-rose-600 tracking-tight">Sign Out</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="sub-page"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="w-full"
          >
            <div className="flex items-center gap-4 mb-8 pt-4">
              <button
                onClick={() => setCurrentView('main')}
                className="p-3 bg-neutral-100 rounded-2xl text-neutral-900 active:scale-90 transition-all"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
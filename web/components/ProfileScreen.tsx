
import React, { useState } from 'react';
import { MapPin, Pencil, Settings, HelpCircle, LogOut, ChevronRight, Grid, List } from 'lucide-react';

interface ProfileScreenProps {
  onEditProfile: () => void;
}

// Mock Data for User Items
const MY_ITEMS = [
  { id: 101, title: "AirPod Pro", image: "https://images.unsplash.com/photo-1603351154351-5cf233081e35?auto=format&fit=crop&w=300&q=80" },
  { id: 102, title: "Camera", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80" },
  { id: 103, title: "Shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" },
  { id: 104, title: "Headphones", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80" },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onEditProfile }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card Section */}
        <div className="bg-white pb-8 px-6 pt-6 mb-3 border-b border-gray-100 shadow-sm rounded-b-[2rem]">
            <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-gray-100 p-1 mb-4 relative shadow-sm">
                    <img 
                        src="https://i.pravatar.cc/150?img=11" 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover border-4 border-white"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Info */}
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">tester</h2>
                <div className="flex items-center text-gray-500 text-sm font-medium mb-3">
                    <MapPin size={14} className="mr-1 text-brand" />
                    <span>Abuja, Nigeria</span>
                </div>
                
                <p className="text-gray-500 text-sm max-w-[250px] leading-relaxed mb-6">
                    Odio sit quo rerum similique. Love trading gadgets and cool stuff!
                </p>

                {/* Edit Button */}
                <button 
                  onClick={onEditProfile}
                  className="flex items-center space-x-2 bg-brand text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-brand/20 active:scale-95 transition-transform"
                >
                    <Pencil size={16} />
                    <span>Edit Profile</span>
                </button>
            </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 mb-4">
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('items')}
                    className={`flex-1 pb-3 text-sm font-bold transition-all relative ${activeTab === 'items' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    My Items
                    {activeTab === 'items' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 pb-3 text-sm font-bold transition-all relative ${activeTab === 'settings' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Settings
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>}
                </button>
            </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-20">
            {activeTab === 'items' ? (
                // My Items Grid
                <div className="grid grid-cols-2 gap-4">
                    {MY_ITEMS.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm px-1 truncate">{item.title}</h3>
                        </div>
                    ))}
                    {/* Add New Placeholder */}
                    <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer">
                        <span className="text-4xl mb-2 font-light">+</span>
                        <span className="text-xs font-bold">Add Item</span>
                    </div>
                </div>
            ) : (
                // Settings List
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <Settings size={20} />
                            <span className="font-bold text-sm">App Settings</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <HelpCircle size={20} />
                            <span className="font-bold text-sm">Help & Support</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group">
                        <div className="flex items-center space-x-3 text-red-500">
                            <LogOut size={20} />
                            <span className="font-bold text-sm">Logout</span>
                        </div>
                        <ChevronRight size={18} className="text-red-200 group-hover:text-red-300" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

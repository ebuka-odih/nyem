import React from 'react';
import { Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

interface SettingsListProps {
  onLogout: () => void;
}

export const SettingsList: React.FC<SettingsListProps> = ({ onLogout }) => {
  return (
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
      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group"
      >
        <div className="flex items-center space-x-3 text-red-500">
          <LogOut size={20} />
          <span className="font-bold text-sm">Logout</span>
        </div>
        <ChevronRight size={18} className="text-red-200 group-hover:text-red-300" />
      </button>
    </div>
  );
};


















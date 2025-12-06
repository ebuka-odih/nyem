import React from 'react';
import { Button } from './Button';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col h-full bg-brand relative overflow-hidden">

      {/* Top Section: Branding */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-6 px-6 text-white z-10">

        {/* Logo Circle */}
        <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/10 mb-3 backdrop-blur-md shadow-lg">
          <span className="text-3xl font-bold tracking-tight">N</span>
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold tracking-wide mb-1">Nyem</h1>

        {/* Headline */}
        <h2 className="text-base font-medium text-white/90 tracking-wide text-center px-4">
          Shop. Find Artisans. Swap Items.
        </h2>
      </div>

      {/* Bottom Card Section */}
      <div className="flex-grow bg-white rounded-t-[32px] w-full px-6 pt-8 pb-6 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-500">

        {/* Card Header */}
        <div className="text-center mb-6 w-full">
          <p className="text-gray-500 text-base leading-relaxed max-w-[340px] mx-auto">
            Discover items, artisans, and swap opportunities around you — all in one place.
          </p>
        </div>

        {/* Features List */}
        <div className="w-full space-y-3 mb-6">

          {/* Item 1 - Shop */}
          <div className="flex items-center space-x-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🛍</span>
            </div>
            <span className="text-gray-700 font-medium text-sm">Shop: Great deals near you</span>
          </div>

          {/* Item 2 - Services */}
          <div className="flex items-center space-x-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💼</span>
            </div>
            <span className="text-gray-700 font-medium text-sm">Services: Book trusted artisans</span>
          </div>

          {/* Item 3 - Swap */}
          <div className="flex items-center space-x-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔁</span>
            </div>
            <span className="text-gray-700 font-medium text-sm">Swap: Trade items effortlessly</span>
          </div>

        </div>

        {/* Action Button */}
        <div className="w-full mt-10">
          <Button fullWidth onClick={onGetStarted} className="py-4 text-base font-bold shadow-xl shadow-brand/20 rounded-full hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            Start Exploring
          </Button>
        </div>

        {/* Footer Legal */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 font-medium">
            By continuing, you agree to our <a href="#" className="text-brand font-semibold hover:underline">Terms of Use</a> and <a href="#" className="text-brand font-semibold hover:underline">Privacy Policy</a>
          </p>
        </div>

      </div>
    </div>
  );
};
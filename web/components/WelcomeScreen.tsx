import React from 'react';
import { Button } from './Button';
import { Smartphone, Heart, Repeat } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col min-h-full bg-brand relative">
      
      {/* Top Section: Branding */}
      <div className="flex-grow flex flex-col items-center justify-center py-8 md:py-12 px-6 text-white z-10 shrink-0">
        
        {/* Logo Circle */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 mb-4 md:mb-6 backdrop-blur-sm shadow-xl">
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight">N</span>
        </div>
        
        {/* App Name */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide mb-2">Nyem</h1>
        
        {/* Tagline */}
        <p className="text-white/90 font-medium text-base md:text-lg tracking-wide">Tinder For Barter</p>
      </div>

      {/* Bottom Card Section */}
      <div className="bg-white rounded-t-[36px] w-full px-6 md:px-8 pt-8 md:pt-10 pb-8 md:pb-10 flex flex-col items-center shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500 shrink-0">
        
        {/* Card Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 md:mb-3">Swap. Match. Trade.</h2>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-[280px] mx-auto">
            Turn your unused items into something you actually want
          </p>
        </div>

        {/* Features List */}
        <div className="w-full space-y-5 md:space-y-6 mb-8 md:mb-10">
          
          {/* Item 1 */}
          <div className="flex items-center space-x-5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-gray-800" strokeWidth={2.5} />
            </div>
            <span className="text-gray-800 font-semibold text-base md:text-lg">Swipe to discover items</span>
          </div>

          {/* Item 2 */}
          <div className="flex items-center space-x-5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-green-500 fill-green-500" />
            </div>
            <span className="text-gray-800 font-semibold text-base md:text-lg">Match with traders</span>
          </div>

          {/* Item 3 */}
          <div className="flex items-center space-x-5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Repeat className="w-5 h-5 md:w-6 md:h-6 text-blue-500" strokeWidth={2.5} />
            </div>
            <span className="text-gray-800 font-semibold text-base md:text-lg">Trade locally</span>
          </div>

        </div>

        {/* Action Button */}
        <div className="w-full">
          <Button fullWidth onClick={onGetStarted}>
            Get Started
          </Button>
        </div>

        {/* Footer Legal */}
        <div className="mt-6 md:mt-7 text-center">
          <p className="text-xs text-gray-400 leading-normal">
            By continuing, you agree to our <a href="#" className="font-bold underline decoration-1">Terms of Use</a> and <a href="#" className="font-bold underline decoration-1 text-brand">Privacy Policy</a>
          </p>
        </div>

      </div>
    </div>
  );
};
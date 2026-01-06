import React from 'lucide-react';
import { Globe, MapPin, Check, ChevronRight } from 'lucide-react';
import { NIGERIA_CITIES } from '../../data';
import { Modal } from '../Modal';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  cities: Array<{ id: number; name: string }>;
  onCitySelect: (city: string) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  cities,
  onCitySelect
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SELECT CITY">
      <div className="space-y-2">
        {/* "All Locations" option */}
        <button
          key="all"
          onClick={() => { 
            onCitySelect("All Locations"); 
            onClose(); 
          }}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${
            currentCity === "All Locations" 
              ? 'bg-[#830e4c1a] border-[#830e4c] shadow-sm' 
              : 'bg-white border-neutral-50 hover:border-neutral-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              currentCity === "All Locations" 
                ? 'bg-[#830e4c] text-white' 
                : 'bg-neutral-50 text-neutral-400'
            }`}>
              <Globe size={20} />
            </div>
            <div className="text-left">
              <h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${
                currentCity === "All Locations" ? 'text-[#830e4c]' : 'text-neutral-900'
              }`}>
                All Locations
              </h4>
              <p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.15em] mt-0.5">
                NATIONWIDE COVERAGE
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            {currentCity === "All Locations" ? (
              <div className="w-7 h-7 bg-[#830e4c] rounded-full flex items-center justify-center shadow-sm">
                <Check size={14} strokeWidth={4} className="text-white" />
              </div>
            ) : (
              <ChevronRight size={18} className="text-neutral-200" />
            )}
          </div>
        </button>

        {/* Cities from backend */}
        {cities.length > 0 ? (
          cities.map(city => (
            <button
              key={city.id}
              onClick={() => { 
                onCitySelect(city.name); 
                onClose(); 
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${
                currentCity === city.name 
                  ? 'bg-[#830e4c1a] border-[#830e4c] shadow-sm' 
                  : 'bg-white border-neutral-50 hover:border-neutral-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  currentCity === city.name 
                    ? 'bg-[#830e4c] text-white' 
                    : 'bg-neutral-50 text-neutral-400'
                }`}>
                  <MapPin size={20} />
                </div>
                <div className="text-left">
                  <h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${
                    currentCity === city.name ? 'text-[#830e4c]' : 'text-neutral-900'
                  }`}>
                    {city.name}
                  </h4>
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.15em] mt-0.5">
                    CITY-WIDE SEARCH
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {currentCity === city.name ? (
                  <div className="w-7 h-7 bg-[#830e4c] rounded-full flex items-center justify-center shadow-sm">
                    <Check size={14} strokeWidth={4} className="text-white" />
                  </div>
                ) : (
                  <ChevronRight size={18} className="text-neutral-200" />
                )}
              </div>
            </button>
          ))
        ) : (
          // Fallback to hardcoded cities if backend fetch failed
          NIGERIA_CITIES.filter(c => c.city !== "All Locations").map(cityObj => (
            <button
              key={cityObj.city}
              onClick={() => { 
                onCitySelect(cityObj.city); 
                onClose(); 
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${
                currentCity === cityObj.city 
                  ? 'bg-[#830e4c1a] border-[#830e4c] shadow-sm' 
                  : 'bg-white border-neutral-50 hover:border-neutral-100'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  currentCity === cityObj.city 
                    ? 'bg-[#830e4c] text-white' 
                    : 'bg-neutral-50 text-neutral-400'
                }`}>
                  <MapPin size={20} />
                </div>
                <div className="text-left">
                  <h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${
                    currentCity === cityObj.city ? 'text-[#830e4c]' : 'text-neutral-900'
                  }`}>
                    {cityObj.city}
                  </h4>
                  <p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.15em] mt-0.5">
                    CITY-WIDE SEARCH
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {currentCity === cityObj.city ? (
                  <div className="w-7 h-7 bg-[#830e4c] rounded-full flex items-center justify-center shadow-sm">
                    <Check size={14} strokeWidth={4} className="text-white" />
                  </div>
                ) : (
                  <ChevronRight size={18} className="text-neutral-200" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
};


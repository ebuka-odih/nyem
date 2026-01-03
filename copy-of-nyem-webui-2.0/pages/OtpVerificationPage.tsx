
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface OtpVerificationPageProps {
  email: string;
  onVerify: () => void;
  onBack: () => void;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({ email, onVerify, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  return (
    <MotionDiv 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col px-8 pt-8 pb-12 w-full h-full overflow-y-auto no-scrollbar"
    >
      <button 
        onClick={onBack}
        className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900 mb-8 active:scale-90 transition-all"
      >
        <ArrowLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 bg-[#830e4c1a] rounded-[2rem] flex items-center justify-center text-[#830e4c] shadow-sm mb-6">
          <ShieldCheck size={32} strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none mb-4">
          Verify Email
        </h1>
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[220px] mx-auto leading-relaxed">
          Enter the 4-digit code sent to <br /><span className="text-neutral-900">{email || "your email"}</span>
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-12">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={data}
            // Fix: Ref callback explicitly ensures it returns void by using a block statement
            ref={(el) => { inputRefs.current[index] = el; }}
            onChange={(e) => handleChange(e.target as HTMLInputElement, index)}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            className="w-16 h-20 bg-white border-2 border-neutral-100 rounded-[1.5rem] text-center text-2xl font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] focus:shadow-lg focus:shadow-[#830e4c1a] transition-all"
          />
        ))}
      </div>

      <div className="space-y-8">
        <button 
          onClick={onVerify}
          className="w-full bg-neutral-900 text-white py-6 rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Verify & Finish
          <ArrowRight size={18} strokeWidth={3} />
        </button>

        <div className="text-center">
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
            Didn't receive code? <button className="text-[#830e4c]">Resend Code</button>
          </p>
        </div>
      </div>
    </MotionDiv>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

interface OTPFieldProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

/**
 * OTPField Component
 * Displays OTP input boxes with individual character inputs
 */
export const OTPField: React.FC<OTPFieldProps> = ({
  length = 6,
  value,
  onChange,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(
    value.split('').slice(0, length).concat(Array(Math.max(0, length - value.length)).fill(''))
  );

  // Sync internal state with external value prop
  useEffect(() => {
    const newOtp = value.split('').slice(0, length).concat(Array(Math.max(0, length - value.length)).fill(''));
    setOtp(newOtp);
  }, [value, length]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;

    const newOtp = [...otp];
    newOtp[index] = char.slice(-1);
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    const newOtp = pastedData.split('').concat(Array(length - pastedData.length).fill(''));
    setOtp(newOtp);
    onChange(newOtp.join(''));
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-5">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="text-center border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            borderColor: otp[index] ? '#990033' : '#E0E0E0',
            borderWidth: '1px',
            fontSize: '24px',
            fontWeight: '600',
            color: '#222222',
            backgroundColor: '#FFFFFF',
            boxShadow: otp[index] ? '0 0 0 2px rgba(153, 0, 51, 0.1)' : 'none',
          }}
        />
      ))}
    </div>
  );
};


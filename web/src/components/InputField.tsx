import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps {
  label: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'tel' | 'email';
  value: string;
  onChange: (value: string) => void;
  showPasswordToggle?: boolean;
  prefix?: string;
  maxLength?: number;
}

/**
 * InputField Component
 * Displays a labeled input field with optional password toggle and prefix
 */
export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  showPasswordToggle = false,
  prefix,
  maxLength,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="mb-6">
      <label className="block text-small text-textPrimary mb-2 font-normal">
        {label}
      </label>
      <div
        className="flex items-center border rounded-md"
        style={{
          height: '48px',
          paddingLeft: '12px',
          paddingRight: '12px',
          borderColor: '#D9D9D9', // inputBorder color
          borderRadius: '10px',
        }}
      >
        {prefix && (
          <>
            <span className="text-body text-textPrimary font-medium mr-2">
              {prefix}
            </span>
            <div className="w-px h-6 bg-input-border mr-2" />
          </>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 text-body text-textPrimary bg-transparent border-none outline-none placeholder:text-textSecondary"
          style={{ fontSize: '16px' }}
        />
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 p-1 hover:opacity-70 transition-opacity"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} className="text-textSecondary" />
            ) : (
              <Eye size={20} className="text-textSecondary" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};


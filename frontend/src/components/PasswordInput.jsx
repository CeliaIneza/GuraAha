import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordInput = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  id,
  required,
  minLength,
  autoComplete,
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`w-full h-11 px-3.5 pr-11 border border-brand-line rounded-[9px] text-sm text-brand-ink bg-white shadow-xs focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 placeholder:text-brand-ink-soft/60 transition-colors ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ink-soft/70 hover:text-brand-ink transition-colors cursor-pointer"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

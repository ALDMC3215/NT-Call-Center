import React from 'react';

export interface AuthFormFieldProps {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  error?: string;
  rightAddon?: React.ReactNode;
  direction?: string;
  autoComplete?: string;
  disabled?: boolean;
}

export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  error,
  rightAddon,
  direction = 'rtl',
  autoComplete,
  disabled = false,
}) => {
  const isLtrType = type === 'email' || type === 'password';
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <style>{`
        #${id}.auth-dark-input {
          background-color: #0b130e !important;
          color: #ffffff !important;
          border-color: rgba(16, 185, 129, 0.22) !important;
        }
        #${id}.auth-dark-input:hover {
          border-color: rgba(16, 185, 129, 0.45) !important;
        }
        #${id}.auth-dark-input:focus {
          border-color: #006319 !important;
          box-shadow: 0 0 0 2px rgba(0, 99, 25, 0.35) !important;
        }
        #${id}.auth-dark-input:-webkit-autofill,
        #${id}.auth-dark-input:-webkit-autofill:hover, 
        #${id}.auth-dark-input:-webkit-autofill:focus, 
        #${id}.auth-dark-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0b130e inset !important;
          box-shadow: 0 0 0 1000px #0b130e inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}</style>

      <label
        htmlFor={id}
        className="text-[13px] font-bold text-stone-200 px-0.5 select-none"
      >
        {label}
      </label>

      <div className="relative flex items-center group">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={isLtrType ? 'ltr' : direction}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={[
            'auth-dark-input w-full h-12 rounded-xl border px-3.5 text-[14px] font-medium text-white',
            'placeholder:text-stone-500 tracking-normal',
            'transition-all duration-150 outline-none shadow-inner',
            rightAddon ? 'pr-10' : '',
            error
              ? '!border-rose-500/80 focus:!border-rose-500 focus:!ring-2 focus:!ring-rose-500/25'
              : '',
          ].join(' ')}
          style={{
            backgroundColor: '#0b130e',
            color: '#ffffff',
            colorScheme: 'dark',
          }}
        />

        {rightAddon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none [&>button]:pointer-events-auto text-stone-400 group-focus-within:text-emerald-400 transition-colors">
            {rightAddon}
          </div>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[11.5px] text-rose-400 font-bold px-1 mt-0.5 animate-fadeIn"
        >
          {error}
        </p>
      )}
    </div>
  );
};

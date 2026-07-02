import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface TableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export const TableDropdown = ({ value, onChange, options, placeholder, disabled }: TableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative inline-flex items-center text-right">
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`outline-none pl-8 pr-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer w-full justify-between min-w-[120px] max-w-[150px] ${
          disabled ? 'opacity-60 grayscale cursor-not-allowed border-transparent text-slate-400' :
          !value ? 'border-transparent hover:border-slate-300 text-[13px] text-slate-500 font-medium' : 'border-slate-300 bg-white hover:bg-slate-50 text-[14px] font-bold text-slate-800'
        }`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-max min-w-[140px] bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <div className="max-h-60 overflow-y-auto custom-select-scroll">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-right px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between gap-3 ${
                  value === opt.value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-primary hover:bg-surface-hover'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

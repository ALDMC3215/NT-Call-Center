import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  badgeClass?: string;
  dotColor?: string;
}

interface TableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TableDropdown = ({ value, onChange, options, placeholder, disabled, className }: TableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0, direction: 'down' as 'down' | 'up' });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const dropdownHeight = 250;
      const direction = spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'up' : 'down';

      setCoords({
        right: window.innerWidth - rect.right,
        top: direction === 'down' ? rect.bottom + 4 : rect.top - 4,
        direction
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScroll = (e: Event) => {
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
        setIsOpen(false);
      };
      const handleResize = () => setIsOpen(false);

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
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
    <div ref={wrapperRef} className="inline-flex items-center text-right">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={className || `outline-none px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer justify-between min-w-[120px] max-w-[165px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs ${
          disabled ? 'opacity-60 grayscale cursor-not-allowed border-transparent text-slate-400' :
          !value ? 'border-slate-200 dark:border-[#2b3a4c] bg-slate-50 dark:bg-[#18222e] hover:border-slate-300 hover:bg-slate-100 dark:hover:bg-[#222f3e] text-[12px] text-slate-500 dark:text-[#a5b4c5] font-medium' :
          selected?.badgeClass ? selected.badgeClass :
          'border-slate-300 dark:border-[#33465c] bg-white dark:bg-[#18222e] hover:bg-slate-50 dark:hover:bg-[#202c3b] text-[12.5px] font-semibold text-slate-800 dark:text-[#f3f5f7]'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selected?.dotColor && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dotColor}`} />
          )}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </div>
        <ChevronDown size={13} className={`text-slate-500 dark:text-[#9bb0c4] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.direction === 'down' ? coords.top : 'auto',
            bottom: coords.direction === 'up' ? window.innerHeight - coords.top : 'auto',
            right: coords.right,
          }}
          className="min-w-[145px] w-max bg-white dark:bg-[#202b38] border border-slate-200 dark:border-[#35465a] rounded-xl shadow-xl z-[99999] overflow-hidden py-1"
        >
          <div className="max-h-60 overflow-y-auto custom-select-scroll">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-right px-3.5 py-2 text-[12.5px] transition-colors flex items-center justify-between gap-3 ${
                  value === opt.value ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-bold' : 'text-slate-800 dark:text-[#e8edf3] hover:bg-slate-50 dark:hover:bg-[#2b3949]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.dotColor && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                  )}
                  <span>{opt.label}</span>
                </div>
                {value === opt.value && <Check size={14} className="stroke-[2.5]" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`outline-none pl-8 pr-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer w-full justify-between min-w-[120px] max-w-[150px] ${
          disabled ? 'opacity-60 grayscale cursor-not-allowed border-transparent text-slate-400' :
          !value ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 text-[13px] text-slate-600 font-bold' : 'border-slate-300 bg-white hover:bg-slate-50 text-[14px] font-extrabold text-slate-800'
        }`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
          className="min-w-[140px] w-max bg-surface border border-border rounded-xl shadow-xl z-[99999] overflow-hidden py-1"
        >
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
        </div>,
        document.body
      )}
    </div>
  );
};

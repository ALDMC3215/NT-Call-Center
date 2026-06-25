import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jalaali from 'jalaali-js';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface InlineJalaliCalendarProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];
const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Helper for Persian numbers
export const toPersianNumbers = (num: number | string) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, x => persianDigits[parseInt(x, 10)]);
};

export const InlineJalaliCalendar: React.FC<InlineJalaliCalendarProps> = ({ value, onChange, className = '' }) => {
  const parts = value ? value.split('/') : [];
  const currentJy = parts.length === 3 ? parseInt(parts[0], 10) : jalaali.toJalaali(new Date()).jy;
  const currentJm = parts.length === 3 ? parseInt(parts[1], 10) : jalaali.toJalaali(new Date()).jm;
  const currentJd = parts.length === 3 ? parseInt(parts[2], 10) : null;

  const [viewJy, setViewJy] = useState(currentJy);
  const [viewJm, setViewJm] = useState(currentJm);

  useEffect(() => {
    if (value) {
      const p = value.split('/');
      if (p.length === 3) {
        setViewJy(parseInt(p[0], 10));
        setViewJm(parseInt(p[1], 10));
      }
    }
  }, [value]);

  const handlePrevMonth = useCallback(() => {
    setViewJm(prev => {
      if (prev === 1) {
        setViewJy(y => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewJm(prev => {
      if (prev === 12) {
        setViewJy(y => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  const handleDayClick = useCallback((day: number) => {
    const newVal = `${viewJy}/${String(viewJm).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onChange(newVal);
  }, [viewJy, viewJm, onChange]);

  // fixed 6*7 = 42 cells grid
  const { blanks, days, trailingBlanks } = useMemo(() => {
    const length = jalaali.jalaaliMonthLength(viewJy, viewJm);
    const firstDayGregorian = jalaali.toGregorian(viewJy, viewJm, 1);
    const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
    const startOffset = (firstDayDate.getDay() + 1) % 7; 
    
    const trailingCount = 42 - (startOffset + length);
    
    return {
      blanks: Array.from({ length: startOffset }, (_, i) => i),
      days: Array.from({ length }, (_, i) => i + 1),
      trailingBlanks: Array.from({ length: trailingCount }, (_, i) => i)
    };
  }, [viewJy, viewJm]);

  return (
    <div className={`flex flex-col w-full font-[var(--font-persian)] select-none ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border mb-2 shrink-0">
        <button 
          onClick={handleNextMonth} 
          className="p-1 rounded-lg text-muted hover:bg-surface-hover  border border-border-hover/5 font-medium transition-all duration-150 ease-out"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="font-medium text-primary text-sm flex gap-1.5 items-center">
           <span>{PERSIAN_MONTHS[viewJm - 1]}</span>
           <span>{toPersianNumbers(viewJy)}</span>
        </div>
        <button 
          onClick={handlePrevMonth} 
          className="p-1 rounded-lg text-muted hover:bg-surface-hover  border border-border-hover/5 font-medium transition-all duration-150 ease-out"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col shrink-0">
        <div className="grid grid-cols-7 gap-1 mb-1 shrink-0">
          {PERSIAN_WEEKDAYS.map((w, i) => (
            <div key={i} className="text-center text-[10px] sm:text-[11px] font-medium text-muted shrink-0">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-1 shrink-0">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="h-6 sm:h-7 md:h-8" />
          ))}
          {days.map((d) => {
            const isSelected = currentJy === viewJy && currentJm === viewJm && currentJd === d;
            return (
              <button
                key={d}
                onClick={() => handleDayClick(d)}
                className={`h-6 sm:h-7 md:h-8 rounded flex items-center justify-center text-[13px] font-normal transition-all ${
                  isSelected 
                    ? 'bg-brand-500 text-slate-900 font-medium' 
                    : 'text-primary hover:bg-surface-hover  border border-border-hover/5'
                }`}
              >
                {toPersianNumbers(d)}
              </button>
            );
          })}
          {trailingBlanks.map((b) => (
            <div key={`trailing-${b}`} className="h-6 sm:h-7 md:h-8" />
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toJalali } from '../../utils/jalali';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOverlayPosition } from '../../hooks/useOverlayPosition';
import { Z } from '../../constants/zIndex';
import { CustomSelect } from './CustomSelect';
import { useLocale } from '../../hooks/useLocale';

interface JalaliDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];
const ENGLISH_MONTHS = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];

export const JalaliDatePicker = ({ value, onChange, placeholder, className = '', compact = false }: JalaliDatePickerProps) => {
  const { isFa, tr } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, overlayRef, position, isMobile } = useOverlayPosition({
    isOpen,
    onClose: () => setIsOpen(false),
  });

  const parts = value.split('/');
  const [month, setMonth] = useState(parts.length === 3 ? parts[1] : '');
  const [day, setDay] = useState(parts.length === 3 ? parts[2] : '');

  const hardcodedYear = "1405";

  useEffect(() => {
    const p = value.split('/');
    if (p.length === 3) {
      setMonth(p[1]);
      setDay(p[2]);
    } else {
      setMonth('');
      setDay('');
    }
  }, [value]);

  const handleApply = (m: string, d: string) => {
    if (m && d) {
      onChange(`${hardcodedYear}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`);
      setIsOpen(false);
    }
  };

  const handleToday = () => {
    const today = toJalali();
    // Assuming today gives 14xx/mm/dd, replace year
    const parts = today.split('/');
    if (parts.length === 3) {
        onChange(`${hardcodedYear}/${parts[1]}/${parts[2]}`);
    } else {
        onChange(today);
    }
    setIsOpen(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  return (
    <div className={`relative ${compact ? 'w-full h-full flex items-center' : ''}`}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={(e) => {
             e.preventDefault(); 
             setIsOpen(!isOpen);
        }}
        className={`flex justify-between items-center w-full bg-transparent hover:bg-brand-50 border-transparent focus:bg-surface  border border-border focus:ring-1 focus:ring-brand-300 rounded-xl p-2.5 text-sm font-normal transition-all ${className}`}
      >
        <span className={`${value ? 'text-gray-900' : 'text-gray-400'}`} dir="ltr">
          {value || placeholder || tr('تاریخ...', 'Date...')}
        </span>
        <Calendar size={16} className={`transition-colors text-gray-400 group-hover:text-muted`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/45"
              style={{ zIndex: Z.MODAL_BACKDROP }}
            />
          )}
          <AnimatePresence>
            <motion.div 
              ref={overlayRef}
              initial={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, y: position.isTop ? 5 : -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, y: position.isTop ? 5 : -5 }}
              transition={{ duration: 0.15 }}
              style={isMobile ? {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: Z.MODAL_CONTENT,
              } : {
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: Z.DROPDOWN,
              }}
              className={isMobile
                ? "bg-surface  border border-border border-t border-border rounded-t-3xl p-6 pb-8 mx-auto w-full text-left"
                : `bg-surface  border border-border border border-border rounded-xl p-5 w-[250px] flex flex-col gap-4 text-left ${position.isTop ? 'origin-bottom' : 'origin-top'}`
              }
              dir="ltr"
            >
              
              {isMobile && (
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
              )}
                
              <div className={`flex items-center justify-between border-b border-gray-100 pb-4 ${isMobile ? 'mb-4' : ''}`}>
                  <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-primary ">
                        <Calendar size={18} />
                      </div>
                      <span className="font-normal text-gray-900 text-sm">{tr('تاریخ خورشیدی', 'Jalali date')}</span>
                  </div>
              </div>

              <div className={`grid grid-cols-2 gap-2.5 ${isMobile ? 'mb-4' : ''}`}>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-secondary ml-1 block text-start">{tr('ماه', 'Month')}</label>
                    <div className="relative">
                        <CustomSelect
                        value={month}
                        onChange={(newMonth) => {
                            setMonth(newMonth);
                            if (newMonth && day) handleApply(newMonth, day);
                        }}
                        options={(isFa ? PERSIAN_MONTHS : ENGLISH_MONTHS).map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }))}
                        placeholder={tr('ماه', 'Month')}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-secondary ml-1 block text-start">{tr('روز', 'Day')}</label>
                    <div className="relative">
                        <CustomSelect
                        value={day}
                        onChange={(newDay) => {
                            setDay(newDay);
                            if (month && newDay) handleApply(month, newDay);
                        }}
                        options={days.map(d => ({ value: d.padStart(2, '0'), label: d }))}
                        placeholder={tr('روز', 'Day')}
                        />
                    </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToday}
                className="w-full py-3.5 mt-1 bg-brand-500 text-slate-900 border border-brand-500 hover:bg-brand-600 transition-colors rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                {tr('برو به امروز', 'Today')}
              </button>
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};

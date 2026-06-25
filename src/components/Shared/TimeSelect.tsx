import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOverlayPosition } from '../../hooks/useOverlayPosition';
import { Z } from '../../constants/zIndex';
import { useLocale } from '../../hooks/useLocale';

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
}

const PRESET_TIMES: string[] = [];
for (let h = 8; h <= 21; h++) {
  if (h === 8) {
    PRESET_TIMES.push("08:30");
  } else if (h === 21) {
    PRESET_TIMES.push("21:00");
  } else {
    PRESET_TIMES.push(`${h.toString().padStart(2, '0')}:00`);
    PRESET_TIMES.push(`${h.toString().padStart(2, '0')}:30`);
  }
}

export const TimeSelect: React.FC<TimeSelectProps> = ({ 
  value, 
  onChange, 
  onBlur,
  className = ""
}) => {
  const { tr } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const { triggerRef, overlayRef, position, isMobile } = useOverlayPosition({
    isOpen,
    onClose: () => {
      setIsOpen(false);
      if (onBlur) onBlur();
    },
  });

  // When switching to custom mode, focus the native input
  useEffect(() => {
    if (isCustomMode && nativeInputRef.current) {
       // @ts-ignore
      if (typeof nativeInputRef.current.showPicker === 'function') {
        try {
          nativeInputRef.current.showPicker();
        } catch(e) {}
      } else {
         nativeInputRef.current.focus();
      }
    }
  }, [isCustomMode]);

  const handleSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handleCustomTimeClick = () => {
    setIsOpen(false);
    setIsCustomMode(true);
  };

  if (isCustomMode) {
     return (
        <input 
          ref={nativeInputRef}
          type="time" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setIsCustomMode(false);
            if (onBlur) onBlur();
          }}
          className={`w-full bg-surface  border border-border border border-border hover:border-brand-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-2.5 text-sm font-normal text-slate-900 transition-all [color-scheme:light] outline-none text-center ${className}`} 
        />
     );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface  border border-border border border-border hover:border-brand-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-2.5 text-sm font-normal transition-all flex items-center justify-between outline-none ${value ? 'text-slate-900' : 'text-muted'}`}
      >
        <span className={value ? "" : "text-gray-400 font-normal"} dir="ltr">{value || tr('زمان...', 'Time...')}</span>
        <Clock size={16} className="text-gray-400" />
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
                width: position.width,
                zIndex: Z.DROPDOWN,
              }}
              className={isMobile
                ? "bg-surface  border border-border border-t border-border rounded-t-3xl pt-2 pb-8 flex flex-col max-h-[70vh] text-left"
                : `bg-surface  border border-border border border-border rounded-xl overflow-hidden flex flex-col max-h-[220px] text-left ${position.isTop ? 'origin-bottom' : 'origin-top'}`
              }
            >
              {isMobile && (
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />
              )}
              <div className={`overflow-y-auto hide-scrollbar ${isMobile ? 'py-2 px-4' : 'py-1'}`}>
                {PRESET_TIMES.map((time) => (
                  <button
                    key={time}
                    onClick={(e) => { e.preventDefault(); handleSelect(time); }}
                    className={`w-full text-left ${isMobile ? 'px-6 py-4 border-b border-border last:border-0 rounded-xl mb-1' : 'px-4 py-2.5'} text-sm hover:bg-brand-50 transition-colors flex items-center justify-between ${value === time ? 'bg-brand-100 text-brand-700 font-medium' : 'text-primary'}`}
                    dir="ltr"
                  >
                    {time}
                  </button>
                ))}
              </div>
              <div className={`border-t border-gray-100 p-2 bg-surface-hover/50 shrink-0 ${isMobile ? 'mt-auto pb-6' : ''}`}>
                 <button
                    onClick={(e) => { e.preventDefault(); handleCustomTimeClick(); }}
                    className={`w-full text-center px-4 ${isMobile ? 'py-4 text-base' : 'py-2.5 text-sm'} font-normal text-secondary hover:bg-surface-hover  border border-border-hover/5 hover:text-primary transition-colors rounded-xl`}
                 >
                    {tr('زمان دلخواه (دستی)', 'Custom time')}
                 </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};

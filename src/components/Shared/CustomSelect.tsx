import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocale } from '../../hooks/useLocale';
import { useOverlayPosition } from '../../hooks/useOverlayPosition';
import { Z } from '../../constants/zIndex';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'ghost' | 'unstyled';
  customTrigger?: React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  icon,
  className = "",
  variant = 'default',
  customTrigger
}) => {
  const { tr } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRef, overlayRef, position, isMobile } = useOverlayPosition({
    isOpen,
    onClose: () => setIsOpen(false),
  });

  const selectedOption = options.find(opt => opt.value === value);

  const btnClass = variant === 'ghost' 
    ? "w-full bg-transparent border-transparent hover:bg-surface-hover focus:bg-surface  border border-border focus:border focus:border-border rounded-xl p-2 text-sm font-medium text-primary transition-all duration-150 ease-out flex items-center justify-between outline-none"
    : variant === 'unstyled' 
    ? "w-full outline-none rounded-xl" 
    : "w-full h-9 bg-surface  border border-border border border-border hover:border-brand-300 hover:bg-brand-50/40 focus:border-brand-500 rounded-lg px-2.5 text-xs font-medium text-primary transition-all duration-150 flex items-center justify-between outline-none";

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={btnClass}
      >
        {customTrigger ? customTrigger : (
          <>
            <div className="flex items-center gap-2 truncate">
              {icon && <span className="text-muted">{icon}</span>}
              <span className={`truncate ${!selectedOption && 'text-muted font-normal'}`}>
                {selectedOption ? selectedOption.label : (placeholder || tr('-- انتخاب کنید --', '-- Select --'))}
              </span>
            </div>
            <ChevronDown 
              size={14} 
              className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
            />
          </>
        )}
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
        {isOpen && (
        <>
          {isMobile && (
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-surface-hover "
              style={{ zIndex: Z.MODAL_BACKDROP }}
            />
          )}
            <motion.div
              ref={overlayRef}
              initial={{ opacity: 0, y: position.isTop ? 5 : -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: position.isTop ? 4 : -4 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
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
                ? "bg-surface  border border-border border-t border-border flex flex-col py-2 rounded-t-xl"
                : `bg-surface  border border-border border border-border rounded-xl overflow-hidden flex flex-col p-1.5`
              }
            >
              {isMobile && (
                <div className="w-12 h-1 bg-surface-hover rounded-full mx-auto mb-2" />
              )}
              <div className={isMobile ? "max-h-[60vh] overflow-y-auto custom-select-scroll scroll-smooth" : "max-h-[260px] overflow-y-auto custom-select-scroll scroll-smooth"}>
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-9 rounded-lg text-right px-3 py-2 text-xs font-medium transition-all duration-150 flex items-center justify-between gap-2 outline-none ${
                      value === opt.value 
                        ? 'bg-brand-50 text-brand-700' 
                        : 'text-secondary hover:bg-surface-hover hover:text-slate-900'
                    } ${isMobile ? 'border-b border-border last:border-0' : ''}`}
                  >
                    <span className="flex items-center gap-2">{opt.icon && <span className={value === opt.value ? 'text-brand-600' : 'text-muted'}>{opt.icon}</span>}{opt.label}</span>
                    {value === opt.value && <Check size={14} className="text-brand-600" />}
                  </button>
                ))}
              </div>
            </motion.div>
        </>
        )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

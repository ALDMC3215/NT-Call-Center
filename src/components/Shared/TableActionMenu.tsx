import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface TableAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  disabled?: boolean;
}

interface TableActionMenuProps {
  actions: TableAction[];
  disabled?: boolean;
  attemptCount?: number;
}

export const TableActionMenu = ({ actions, disabled, attemptCount }: TableActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, direction: 'down' as 'down' | 'up' });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const dropdownHeight = actions.length * 40 + 20; // approximate height
      const direction = spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'up' : 'down';

      setCoords({
        left: rect.left,
        top: direction === 'down' ? rect.bottom + 4 : rect.top - 4,
        direction
      });
    }
  }, [actions.length]);

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

  const logAttemptAction = actions.find(a => a.id === 'log_manual_attempt');
  const visibleActions = actions.filter(a => !a.disabled && a.id !== 'log_manual_attempt');
  if (visibleActions.length === 0 && !logAttemptAction) return <div className="w-9 h-9" />;

  return (
    <div ref={wrapperRef} className="inline-flex items-center gap-1.5 text-right">
      {logAttemptAction && (
        <button
          disabled={logAttemptAction.disabled}
          onClick={(e) => {
            e.stopPropagation();
            logAttemptAction.onClick();
          }}
          className={`relative w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all border bg-emerald-50 dark:bg-[#163326] text-emerald-600 dark:text-[#8de0b5] border-emerald-200 dark:border-[#2f674b] hover:bg-emerald-100 dark:hover:bg-[#1e4a36] hover:border-emerald-300 dark:hover:border-[#387a58] active:scale-95 ${logAttemptAction.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={logAttemptAction.label}
        >
          {logAttemptAction.icon}
          {attemptCount !== undefined && attemptCount > 0 && (
             <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                {attemptCount}
             </span>
          )}
        </button>
      )}
      <button
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all border ${
          isOpen ? 'bg-slate-200 dark:bg-[#243140] text-slate-900 dark:text-white border-slate-300 dark:border-[#46596e]' : 'bg-slate-100 dark:bg-[#18222d] text-slate-700 dark:text-[#e8edf3] border-slate-200 dark:border-[#344457] hover:bg-slate-200 dark:hover:bg-[#243140] hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-[#46596e]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="عملیات بیشتر"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.direction === 'down' ? coords.top : 'auto',
            bottom: coords.direction === 'up' ? window.innerHeight - coords.top : 'auto',
            left: coords.left,
          }}
          className="min-w-[160px] w-max bg-white dark:bg-[#202b38] border border-slate-200 dark:border-[#35465a] rounded-xl shadow-xl z-[99999] overflow-hidden py-1"
        >
          <div className="max-h-60 overflow-y-auto custom-select-scroll p-1 flex flex-col gap-0.5">
            {visibleActions.map(action => {

              let colorClasses = 'text-slate-700 dark:text-[#e8edf3] hover:bg-slate-100 dark:hover:bg-[#2b3949] hover:text-slate-900 dark:hover:text-white';
              if (action.variant === 'danger') {
                colorClasses = 'text-rose-600 dark:text-[#ff9aa9] hover:bg-rose-50 dark:hover:bg-[#3a1d25] hover:text-rose-700 dark:hover:text-[#ffb3be] font-bold';
              } else if (action.variant === 'primary') {
                colorClasses = 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 font-bold';
              } else if (action.variant === 'warning') {
                colorClasses = 'text-amber-600 dark:text-[#ffc477] hover:bg-amber-50 dark:hover:bg-[#3b2917] hover:text-amber-700 dark:hover:text-[#ffd699] font-bold';
              }

              return (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2 text-[12.5px] rounded-lg transition-colors flex items-center gap-2.5 ${colorClasses}`}
                >
                  <span className={action.variant === 'danger' ? 'text-rose-500' : action.variant === 'primary' ? 'text-brand-500' : action.variant === 'warning' ? 'text-amber-500' : 'text-slate-400'}>
                    {action.icon}
                  </span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

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

  const visibleActions = actions.filter(a => !a.disabled);
  if (visibleActions.length === 0) return <div className="w-9 h-9" />;

  return (
    <div ref={wrapperRef} className="inline-flex items-center gap-1.5 text-right">
      {attemptCount !== undefined && attemptCount > 0 && (
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 h-6 flex items-center justify-center rounded-lg border border-slate-200 whitespace-nowrap">
          {attemptCount} تلاش
        </span>
      )}
      <button
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all border ${
          isOpen ? 'bg-slate-200 text-slate-900 border-slate-300' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300'
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
          className="min-w-[160px] w-max bg-white border border-slate-200 rounded-xl shadow-xl z-[99999] overflow-hidden py-1"
        >
          <div className="max-h-60 overflow-y-auto custom-select-scroll p-1 flex flex-col gap-0.5">
            {actions.map(action => {
              if (action.disabled) return null;

              let colorClasses = 'text-slate-700 hover:bg-slate-100 hover:text-slate-900';
              if (action.variant === 'danger') {
                colorClasses = 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold';
              } else if (action.variant === 'primary') {
                colorClasses = 'text-brand-600 hover:bg-brand-50 hover:text-brand-700 font-bold';
              } else if (action.variant === 'warning') {
                colorClasses = 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold';
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

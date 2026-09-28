import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../../hooks/useLocale';

interface FilterPopoverProps {
  statusStats?: Record<string, number>;
  selectedStatusFilter?: string | null;
  onSelectFilter?: (status: string | null) => void;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  statusStats = {},
  selectedStatusFilter = null,
  onSelectFilter
}) => {
  const { tr } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<string | null>(selectedStatusFilter);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync draft when opened
  useEffect(() => {
    if (isOpen) {
      setDraftFilter(selectedStatusFilter);
    }
  }, [isOpen, selectedStatusFilter]);

  // Click outside and Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleApply = () => {
    onSelectFilter?.(draftFilter);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = () => {
    setDraftFilter(null);
    onSelectFilter?.(null);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const isFilterActive = !!selectedStatusFilter;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`h-[38px] px-2 2xl:px-3 rounded-xl border flex items-center gap-1 2xl:gap-1.5 text-[11px] 2xl:text-[12px] font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs cursor-pointer ${
          isOpen
            ? 'bg-slate-100 dark:bg-[#1f2b3b] ring-2 ring-brand-500/20 border-brand-400 dark:border-brand-600'
            : isFilterActive
            ? 'bg-brand-50/90 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-800'
            : 'bg-white dark:bg-[#18222e] text-slate-700 dark:text-[#c4d0df] border-slate-200 dark:border-[#2e3e50] hover:bg-slate-100/80 dark:hover:bg-[#202c3b]'
        }`}
        title={tr('فیلترها', 'Filters')}
      >
        <Filter
          size={14}
          className={isFilterActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}
        />
        <span className="hidden sm:inline">{tr('فیلترها', 'Filters')}</span>

        {/* Badge of active filter count: '۱' */}
        {isFilterActive && (
          <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            ۱
          </span>
        )}

        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1.5 left-0 w-[280px] sm:w-[310px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#17202c] border border-slate-200 dark:border-[#2d3d50] rounded-2xl shadow-xl overflow-hidden p-3.5 text-right flex flex-col gap-2.5"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#243142]">
              <div>
                <h3 className="text-[13px] font-bold text-slate-800 dark:text-[#f3f5f7]">
                  {tr('فیلتر بر اساس وضعیت', 'Filter by Status')}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-[#7f8da0] mt-0.5">
                  {tr('وضعیت را انتخاب و اعمال کنید.', 'Select a status and apply.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222e3e] transition-colors"
                aria-label={tr('بستن', 'Close')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Status Options */}
            <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto custom-scrollbar py-0.5">
              {Object.entries(statusStats).map(([status, count]) => {
                const isDraftSelected = draftFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDraftFilter(isDraftSelected ? null : status)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-all text-right ${
                      isDraftSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800/60 shadow-2xs'
                        : 'text-slate-700 dark:text-[#c4d0df] hover:bg-slate-50 dark:hover:bg-[#202b3a] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                          isDraftSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 dark:border-[#38485c]'
                        }`}
                      >
                        {isDraftSelected && <Check size={9} className="stroke-[3]" />}
                      </span>
                      <span>{status}</span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                        isDraftSelected
                          ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                          : 'bg-slate-100 dark:bg-[#243142] text-slate-500 dark:text-[#8e9faa]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#243142]">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 h-8 rounded-xl border border-slate-200 dark:border-[#2e3e50] text-[11.5px] font-semibold text-slate-600 dark:text-[#a0b0c2] hover:bg-slate-100 dark:hover:bg-[#222e3e] transition-colors"
              >
                {tr('پاک کردن', 'Clear')}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 h-8 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11.5px] font-semibold transition-colors shadow-2xs"
              >
                {tr('اعمال فیلتر', 'Apply Filter')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

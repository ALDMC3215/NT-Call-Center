import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../../hooks/useLocale';

interface HeaderSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch
}) => {
  const { tr } = useLocale();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileExpanded) {
      mobileInputRef.current?.focus();
    }
  }, [isMobileExpanded]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (searchQuery) {
        onClearSearch();
      } else {
        setIsMobileExpanded(false);
      }
    }
  };

  return (
    <>
      {/* Desktop Search Input (xl and up) - Compact with controlled width to prevent overlap */}
      <div className="hidden xl:block relative w-32 xl:w-36 2xl:w-48 max-w-[190px] min-w-0 transition-all duration-200 focus-within:w-40 2xl:focus-within:w-52">
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search size={13.5} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tr('جستجو...', 'Search...')}
          aria-label={tr('جستجو در شماره یا نام مخاطب', 'Search contacts')}
          className="w-full h-[38px] bg-slate-50/90 dark:bg-[#18222e] border border-slate-200 dark:border-[#2b3848] rounded-xl pr-7 pl-7 text-[11.5px] font-medium text-slate-800 dark:text-[#f3f5f7] placeholder-slate-400 dark:placeholder-[#67778b] focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-[#1c2735] focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label={tr('پاک کردن جستجو', 'Clear search')}
            className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={13.5} />
          </button>
        )}
      </div>

      {/* Medium / Tablet Screens (md to lg, 768-1279px): Compact Input */}
      <div className="hidden md:block xl:hidden relative w-36 lg:w-44 shrink-0">
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
          <Search size={13} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tr('جستجو...', 'Search...')}
          aria-label={tr('جستجو در شماره یا نام مخاطب', 'Search contacts')}
          className="w-full h-[38px] bg-slate-50 dark:bg-[#18222e] border border-slate-200 dark:border-[#2b3848] rounded-xl pr-7 pl-7 text-[11.5px] font-medium text-slate-800 dark:text-[#f3f5f7] placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-[#1c2735] focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label={tr('پاک کردن جستجو', 'Clear search')}
            className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Mobile Search Trigger Button (< 768px) */}
      <button
        type="button"
        onClick={() => setIsMobileExpanded(true)}
        aria-label={tr('جستجو', 'Search')}
        className={`md:hidden h-[38px] w-[38px] rounded-xl border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs ${
          searchQuery
            ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-600 dark:text-brand-400'
            : 'bg-white dark:bg-[#18222e] border-slate-200 dark:border-[#2e3e50] text-slate-600 dark:text-[#c4d0df]'
        }`}
      >
        <Search size={15} />
      </button>

      {/* Mobile Search Overlay Full-Width in Mobile Header */}
      <AnimatePresence>
        {isMobileExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="md:hidden absolute inset-0 z-50 bg-white dark:bg-[#151c24] px-3 flex items-center gap-2 border-b border-slate-200 dark:border-[#263342]"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tr('جستجو در شماره یا نام...', 'Search phone or name...')}
                className="w-full h-[40px] bg-slate-50 dark:bg-[#1c2735] border border-slate-200 dark:border-[#2d3d50] rounded-xl pr-9 pl-9 text-[12.5px] font-medium text-slate-900 dark:text-[#f3f5f7] focus:outline-none focus:border-brand-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileExpanded(false)}
              className="h-[40px] px-3 rounded-xl text-slate-600 dark:text-[#a2b2c4] text-[12px] font-semibold hover:bg-slate-100 dark:hover:bg-[#1e2837] shrink-0"
            >
              {tr('بستن', 'Close')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

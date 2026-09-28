import React, { useState } from 'react';
import { Home, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../../hooks/useLocale';
import { AdaptiveCommandHeaderProps } from './types';
import { PageIdentity } from './PageIdentity';
import { SectionNavigation } from './SectionNavigation';
import { SectionSwitcher } from './SectionSwitcher';
import { HeaderSearch } from './HeaderSearch';
import { FilterPopover } from './FilterPopover';
import { ActionsMenu } from './ActionsMenu';
import { MobileNavigationSheet } from './MobileNavigationSheet';

/**
 * Stable Dashboard Header
 * - Symmetrical 3-slot CSS Grid [1fr auto 1fr] locking primary navigation to the true mathematical center
 * - ContextualControlsSlot remains mounted across all tabs; inner controls fade smoothly with zero layout shift
 * - Seamless SectionSwitcher for tablets (768px - 1279px) eliminating search/tab collision
 * - Compact single-row App Bar (<768px) with drawer navigation
 */
export const AdaptiveCommandHeader: React.FC<AdaptiveCommandHeaderProps> = ({
  displayedCount,
  totalActiveCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onReturnHome,
  activeTab,
  onTabChange,
  statusStats = {},
  selectedStatusFilter = null,
  onSelectFilter,
  onExcelUploadClick,
  onManualAddClick,
  onMoveNotInterestedClick,
  onDeleteAllClick,
  isScrolled = false
}) => {
  const { tr, direction } = useLocale();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-all duration-200 select-none bg-white/95 dark:bg-[#151c24]/95 backdrop-blur-md border-b ${
        isScrolled
          ? 'border-slate-300/90 dark:border-[#2e3e52] shadow-xs'
          : 'border-slate-200/80 dark:border-[#24303e]'
      }`}
      dir={direction}
    >
      {/* 1. Large Desktop Layout (xl+: >= 1280px): Symmetrical 3-Slot CSS Grid [1fr auto 1fr] */}
      <div className="hidden xl:grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 2xl:gap-6 items-center px-3 sm:px-4 2xl:px-6 h-[64px] sm:h-[68px]">
        {/* Slot 1 (RTL Start - Right): PageIdentitySlot */}
        <div className="flex items-center gap-2 2xl:gap-3 justify-self-start min-w-0 overflow-hidden">
          <PageIdentity
            displayedCount={displayedCount}
            totalActiveCount={totalActiveCount}
          />
        </div>

        {/* Slot 2 (Center): PrimaryNavigationSlot - Locked in True Center */}
        <div className="flex items-center justify-center justify-self-center shrink-0">
          <SectionNavigation
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>

        {/* Slot 3 (RTL End - Left): ContextualControlsSlot (Always Mounted Container) */}
        <div className="flex items-center gap-1.5 2xl:gap-2 justify-self-end min-w-0 max-w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'list' && (
              <motion.div
                key="list-contextual-controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1.5 2xl:gap-2 min-w-0"
              >
                {/* Active Filter Removable Chip */}
                {selectedStatusFilter && (
                  <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-[11.5px] font-semibold shadow-2xs">
                    <span>
                      {tr('وضعیت:', 'Status:')} {selectedStatusFilter}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectFilter?.(null)}
                      aria-label={tr('حذف فیلتر', 'Clear filter')}
                      className="p-0.5 hover:bg-brand-100 dark:hover:bg-brand-900/60 rounded-md transition-colors mr-0.5 text-brand-600 dark:text-brand-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Calls List Search */}
                <HeaderSearch
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  onClearSearch={onClearSearch}
                />

                {/* Status Filter Popover */}
                <FilterPopover
                  statusStats={statusStats}
                  selectedStatusFilter={selectedStatusFilter}
                  onSelectFilter={onSelectFilter}
                />

                {/* Unified Actions Menu */}
                <ActionsMenu
                  onManualAddClick={onManualAddClick}
                  onExcelUploadClick={onExcelUploadClick}
                  onMoveNotInterestedClick={onMoveNotInterestedClick}
                  onDeleteAllClick={onDeleteAllClick}
                />

                <div className="w-px h-5 bg-slate-200 dark:bg-[#283648] shrink-0 mx-0.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Return to Home Button (Always mounted at the end) */}
          <button
            type="button"
            onClick={onReturnHome}
            aria-label={tr('بازگشت به صفحه اصلی', 'Return to Home')}
            className="h-[38px] px-2.5 sm:px-3 rounded-xl bg-slate-50 dark:bg-[#18222e] border border-slate-200 dark:border-[#2e3e50] hover:bg-slate-100 dark:hover:bg-[#202c3b] text-slate-700 dark:text-[#c4d0df] hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap shrink-0 text-[12px] font-semibold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs cursor-pointer"
            title={tr('بازگشت به صفحه اصلی', 'Return to Home')}
          >
            <Home size={15} className="text-slate-500 dark:text-[#8a99aa] shrink-0" />
            <span className="hidden 2xl:inline">{tr('بازگشت', 'Back')}</span>
          </button>
        </div>
      </div>

      {/* 2. Tablet Layout (768px - 1279px: md to lg) */}
      <div className="hidden md:flex xl:hidden items-center justify-between gap-3 px-4 h-[62px]">
        {/* Right in RTL: Page Identity + Section Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <PageIdentity
            displayedCount={displayedCount}
            totalActiveCount={totalActiveCount}
          />
          <SectionSwitcher
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>

        {/* Left in RTL: Contextual actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'list' && (
            <>
              <HeaderSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onClearSearch={onClearSearch}
              />
              <FilterPopover
                statusStats={statusStats}
                selectedStatusFilter={selectedStatusFilter}
                onSelectFilter={onSelectFilter}
              />
              <ActionsMenu
                onManualAddClick={onManualAddClick}
                onExcelUploadClick={onExcelUploadClick}
                onMoveNotInterestedClick={onMoveNotInterestedClick}
                onDeleteAllClick={onDeleteAllClick}
              />
              <div className="w-px h-5 bg-slate-200 dark:bg-[#283648] shrink-0 mx-0.5" />
            </>
          )}

          <button
            type="button"
            onClick={onReturnHome}
            aria-label={tr('بازگشت به صفحه اصلی', 'Return to Home')}
            className="h-[38px] px-2.5 rounded-xl bg-slate-50 dark:bg-[#18222e] border border-slate-200 dark:border-[#2e3e50] hover:bg-slate-100 dark:hover:bg-[#202c3b] text-slate-700 dark:text-[#c4d0df] hover:text-slate-900 dark:hover:text-white transition-all text-[12px] font-semibold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs"
            title={tr('بازگشت به صفحه اصلی', 'Return to Home')}
          >
            <Home size={15} className="text-slate-500 dark:text-[#8a99aa]" />
            <span className="hidden lg:inline">{tr('بازگشت', 'Back')}</span>
          </button>
        </div>
      </div>

      {/* 3. Mobile Layout (< 768px): Compact Single-Row App Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 px-3 h-[58px]">
        {/* Right in RTL: Mobile Sheet Trigger + Page Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <MobileNavigationSheet
            isOpen={isMobileSheetOpen}
            onOpen={() => setIsMobileSheetOpen(true)}
            onClose={() => setIsMobileSheetOpen(false)}
            activeTab={activeTab}
            onTabChange={onTabChange}
            displayedCount={displayedCount}
            totalActiveCount={totalActiveCount}
          />

          <PageIdentity
            displayedCount={displayedCount}
            totalActiveCount={totalActiveCount}
          />
        </div>

        {/* Left in RTL: Contextual action triggers */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab === 'list' && (
            <>
              <HeaderSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onClearSearch={onClearSearch}
              />

              <FilterPopover
                statusStats={statusStats}
                selectedStatusFilter={selectedStatusFilter}
                onSelectFilter={onSelectFilter}
              />

              <ActionsMenu
                onManualAddClick={onManualAddClick}
                onExcelUploadClick={onExcelUploadClick}
                onMoveNotInterestedClick={onMoveNotInterestedClick}
                onDeleteAllClick={onDeleteAllClick}
              />
            </>
          )}

          <button
            type="button"
            onClick={onReturnHome}
            aria-label={tr('بازگشت به صفحه اصلی', 'Return to Home')}
            className="h-[38px] w-[38px] rounded-xl bg-slate-50 dark:bg-[#18222e] border border-slate-200 dark:border-[#2e3e50] flex items-center justify-center text-slate-600 dark:text-[#c4d0df] hover:text-slate-900 dark:hover:text-white transition-colors shadow-2xs"
            title={tr('بازگشت به صفحه اصلی', 'Return to Home')}
          >
            <Home size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

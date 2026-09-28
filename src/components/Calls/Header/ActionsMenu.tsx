import React, { useState, useRef, useEffect } from 'react';
import {
  ListPlus,
  ChevronDown,
  Plus,
  FileSpreadsheet,
  ShieldBan,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../../hooks/useLocale';

interface ActionsMenuProps {
  onManualAddClick?: () => void;
  onExcelUploadClick?: () => void;
  onMoveNotInterestedClick?: () => void;
  onDeleteAllClick?: () => void;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({
  onManualAddClick,
  onExcelUploadClick,
  onMoveNotInterestedClick,
  onDeleteAllClick
}) => {
  const { tr } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button - Strong Primary Contextual Contrast */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`h-[38px] px-2 2xl:px-3 rounded-xl border flex items-center gap-1 2xl:gap-1.5 text-[11px] 2xl:text-[12px] font-bold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 shadow-2xs cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-400/30'
            : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
        }`}
        title={tr('عملیات', 'Actions')}
      >
        <ListPlus size={15} className="text-slate-200 dark:text-slate-800 shrink-0" />
        <span className="hidden sm:inline">{tr('عملیات', 'Actions')}</span>
        <ChevronDown
          size={12}
          className={`text-slate-300 dark:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Unified Actions Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1.5 left-0 w-[270px] sm:w-[295px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#17202c] border border-slate-200 dark:border-[#2d3d50] rounded-2xl shadow-xl overflow-hidden p-2 text-right flex flex-col"
          >
            {/* Group 1: Add Data */}
            <div className="text-[10.5px] font-bold text-slate-400 dark:text-[#7f8da0] px-2 py-1 select-none">
              {tr('افزودن اطلاعات', 'Add Data')}
            </div>

            {/* Manual Add */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
                onManualAddClick?.();
              }}
              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#202b3a] transition-colors text-right group focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-[#202b3a]"
            >
              <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 shrink-0 mt-0.5">
                <Plus size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-800 dark:text-[#f3f5f7]">
                  {tr('افزودن شماره جدید', 'Add New Number')}
                </div>
                <div className="text-[10.5px] text-slate-400 dark:text-[#7f8da0] mt-0.5">
                  {tr('ثبت دستی یک شماره در لیست', 'Manually register a phone number')}
                </div>
              </div>
            </button>

            {/* Excel Upload */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
                onExcelUploadClick?.();
              }}
              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#202b3a] transition-colors text-right group focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-[#202b3a]"
            >
              <div className="p-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50 shrink-0 mt-0.5">
                <FileSpreadsheet size={14} />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-800 dark:text-[#f3f5f7]">
                  {tr('ورود شماره‌ها از اکسل', 'Import from Excel')}
                </div>
                <div className="text-[10.5px] text-slate-400 dark:text-[#7f8da0] mt-0.5">
                  {tr('افزودن گروهی شماره‌ها از فایل Excel', 'Bulk add numbers from Excel')}
                </div>
              </div>
            </button>

            <div className="w-full h-px bg-slate-100 dark:bg-[#243142] my-1" />

            {/* Group 2: List Management */}
            <div className="text-[10.5px] font-bold text-slate-400 dark:text-[#7f8da0] px-2 py-1 select-none">
              {tr('مدیریت لیست', 'List Management')}
            </div>

            {/* Move Not Interested */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
                onMoveNotInterestedClick?.();
              }}
              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-[#202b3a] transition-colors text-right group focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-[#202b3a]"
            >
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-[#243142] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0 mt-0.5">
                <ShieldBan size={14} />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-700 dark:text-[#d0dbe7]">
                  {tr('انتقال عدم تمایل‌ها به لیست سیاه', 'Move Not Interested to Blacklist')}
                </div>
                <div className="text-[10.5px] text-slate-400 dark:text-[#7f8da0] mt-0.5">
                  {tr('انتقال تمام شماره‌های دارای وضعیت عدم تمایل', 'Move not-interested contacts to blacklist')}
                </div>
              </div>
            </button>

            <div className="w-full h-px bg-slate-100 dark:bg-[#243142] my-1" />

            {/* Delete Displayed */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
                onDeleteAllClick?.();
              }}
              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-right group focus-visible:outline-none focus-visible:bg-rose-50 dark:focus-visible:bg-rose-950/30"
            >
              <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 shrink-0 mt-0.5">
                <Trash2 size={14} />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">
                  {tr('حذف شماره‌های نمایش‌داده‌شده', 'Delete Displayed Numbers')}
                </div>
                <div className="text-[10.5px] text-rose-400/80 dark:text-rose-400/60 mt-0.5">
                  {tr('حذف موارد موجود در نتیجه فعلی جدول', 'Delete current table items')}
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

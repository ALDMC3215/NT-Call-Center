import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CalendarClock,
  CalendarOff,
  MessageSquareQuote,
  RefreshCcw,
  Trash2
} from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';

interface BatchSelectionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchFollowUp: () => void;
  onBatchCancelFollowUp: () => void;
  onBatchNotes: () => void;
  onBatchReset: () => void;
  onBatchDelete: () => void;
}

export const BatchSelectionBar: React.FC<BatchSelectionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBatchFollowUp,
  onBatchCancelFollowUp,
  onBatchNotes,
  onBatchReset,
  onBatchDelete
}) => {
  const { tr, direction } = useLocale();

  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        role="toolbar"
        aria-label={tr('عملیات گروهی', 'Batch operations')}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 dark:bg-[#111721]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 px-3.5 py-2 flex items-center gap-2.5 flex-nowrap overflow-x-auto hide-scrollbar max-w-[95vw]"
        dir={direction}
      >
        {/* Count Badge (First in RTL) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[12px] font-bold whitespace-nowrap shrink-0">
          <span className="tabular-nums text-brand-400 font-extrabold">{selectedCount}</span>
          <span>{tr('شماره انتخاب شده', 'selected')}</span>
        </div>

        {/* Clear selection button */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 hover:bg-slate-800 dark:hover:bg-[#1a2330] rounded-lg transition-colors text-slate-400 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title={tr('لغو انتخاب', 'Clear selection')}
          aria-label={tr('لغو انتخاب شماره‌ها', 'Clear selection')}
        >
          <X size={16} />
        </button>

        <div className="w-px h-5 bg-slate-700 shrink-0 mx-0.5" />

        {/* Action: Mark Follow-Up */}
        <button
          type="button"
          onClick={onBatchFollowUp}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all text-[11.5px] font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          title={tr('نشانه‌گذاری به عنوان پیگیری', 'Mark as follow-up')}
        >
          <CalendarClock size={14} />
          <span>{tr('پیگیری', 'Follow-up')}</span>
        </button>

        {/* Action: Cancel Follow-Up */}
        <button
          type="button"
          onClick={onBatchCancelFollowUp}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-[11.5px] font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          title={tr('لغو نشانه‌گذاری پیگیری', 'Cancel follow-up')}
        >
          <CalendarOff size={14} />
          <span>{tr('لغو پیگیری', 'Cancel Follow-up')}</span>
        </button>

        {/* Action: Shared Note */}
        <button
          type="button"
          onClick={onBatchNotes}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-[11.5px] font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          title={tr('افزودن یادداشت مشترک', 'Shared Note')}
        >
          <MessageSquareQuote size={14} />
          <span>{tr('یادداشت مشترک', 'Shared Note')}</span>
        </button>

        {/* Action: Reset to Raw */}
        <button
          type="button"
          onClick={onBatchReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-[11.5px] font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          title={tr('بازگردانی اطلاعات به حالت خام', 'Reset to raw')}
        >
          <RefreshCcw size={14} />
          <span>{tr('ریست خام', 'Reset')}</span>
        </button>

        <div className="w-px h-5 bg-slate-700 shrink-0 mx-0.5" />

        {/* Destructive Action: Batch Delete */}
        <button
          type="button"
          onClick={onBatchDelete}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 transition-all text-[11.5px] font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          title={tr('حذف تمامی شماره‌های انتخاب شده', 'Delete selected')}
        >
          <Trash2 size={14} />
          <span>{tr('حذف گروهی', 'Batch Delete')}</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

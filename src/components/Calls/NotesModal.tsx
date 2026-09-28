import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Check } from 'lucide-react';
import { CallRecord } from '../../types';
import { useLocale } from '../../hooks/useLocale';
import { formatPhoneNumber } from '../../utils/format';

interface NotesModalProps {
  call: CallRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  call,
  isOpen,
  onClose,
  onSave
}) => {
  const { tr, direction } = useLocale();
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && call) {
      setNotes(call.notes || '');
    }
  }, [isOpen, call]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        dir={direction}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-[#161f2b] border border-slate-200 dark:border-[#2b3a4c] rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-[#243142] flex items-center justify-between bg-slate-50/70 dark:bg-[#1b2533]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                <FileText size={15} />
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#f3f5f7] text-[13.5px]">
                {tr('یادداشت تماس', 'Call Notes')}
                {call && (
                  <span className="text-slate-400 dark:text-slate-500 font-normal mr-1.5" dir="ltr">
                    ({formatPhoneNumber(call.phone)})
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-[#253243] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={tr('بستن', 'Close')}
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col gap-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tr('یادداشت خود درباره این تماس را بنویسید...', 'Write your notes here...')}
              rows={6}
              className="w-full bg-slate-50 dark:bg-[#1b2533] border border-slate-200 dark:border-[#2e3e50] rounded-xl p-3 text-[13px] font-medium text-slate-900 dark:text-[#e8edf3] placeholder-slate-400 dark:placeholder-[#67778b] outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-[#17202c] focus:ring-2 focus:ring-brand-500/20 resize-none transition-all leading-relaxed"
              dir="rtl"
              autoFocus
            />

            {/* Actions */}
            <div className="flex gap-2.5 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl text-[12.5px] font-semibold text-slate-600 dark:text-[#b4c3d4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#243142] border border-slate-200 dark:border-[#2e3e50] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {tr('انصراف', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(notes);
                  onClose();
                }}
                className="h-9 px-4.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-[12.5px] transition-colors shadow-2xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Check size={14} />
                <span>{tr('ذخیره یادداشت', 'Save Note')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

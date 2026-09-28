import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Route } from 'lucide-react';
import { LearningPathMap } from '../Courses/LearningPathMap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export const LearningPathsModal = ({ isOpen, onClose, embedded }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, embedded]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const content = (
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#0f1419] w-full h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Compact Section Toolbar */}
        <div className="flex-none bg-white/90 dark:bg-[#151c24]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#24303e] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-20 shrink-0 min-h-[58px] sm:min-h-[64px]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 flex items-center justify-center text-purple-600 dark:text-[#c4a1ff] shrink-0 shadow-2xs">
              <Route size={16} />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14.5px] sm:text-[15px] font-bold text-slate-900 dark:text-[#f3f5f7]">مسیرهای یادگیری</h2>
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#8e9aaa] hidden md:inline">(مسیر پیشنهادی از شروع تا مهارت تخصصی)</span>
            </div>
          </div>
          {!embedded && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#202b38] flex items-center justify-center text-slate-500 dark:text-[#8e9aaa] hover:bg-slate-200 dark:hover:bg-[#2c3b4d] hover:text-slate-900 dark:hover:text-[#f3f5f7] transition-colors shrink-0"
              title="بستن"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 relative w-full h-full bg-slate-50 dark:bg-[#0f1419]">
          <LearningPathMap />
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#0f1419] flex items-center justify-center p-0"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      {content}
    </div>,
    document.body
  );
};


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
        {/* Header */}
        <div className="flex-none bg-white dark:bg-[#171e27] border-b border-slate-200 dark:border-[#2b3745] px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-[#2c1d38] flex items-center justify-center text-purple-600 dark:text-[#c4a1ff] shrink-0">
              <Route size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-[#f3f5f7] leading-tight">مسیرهای یادگیری</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-[#8e9aaa] mt-0.5">مسیر پیشنهادی از شروع تا مهارت تخصصی</p>
            </div>
          </div>
          {!embedded && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#202b38] flex items-center justify-center text-slate-500 dark:text-[#8e9aaa] hover:bg-slate-200 dark:hover:bg-[#2c3b4d] hover:text-slate-900 dark:hover:text-[#f3f5f7] transition-colors shrink-0"
            title="بستن"
          >
            <X size={18} strokeWidth={2.5} />
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


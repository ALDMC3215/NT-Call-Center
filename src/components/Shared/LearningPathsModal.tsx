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
        className="bg-white w-full h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Route size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">مسیرهای یادگیری</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">مسیر پیشنهادی از شروع تا مهارت تخصصی</p>
            </div>
          </div>
          {!embedded && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
            title="بستن"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 relative w-full h-full bg-slate-50">
          <LearningPathMap />
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-50 flex items-center justify-center p-0"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      {content}
    </div>,
    document.body
  );
};


import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, GraduationCap, Code, ShieldCheck, Gamepad2, Brain, Smartphone, Route, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LearningPathsModal = ({ isOpen, onClose }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Route size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">مسیرهای یادگیری</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">مسیر پیشنهادی از شروع تا مهارت تخصصی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 overflow-y-auto hide-scrollbar flex-1 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Card 1 */}
            <div className="rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full bg-white">
              <div className="flex items-center gap-2 mb-4 text-blue-700">
                <Brain size={18} />
                <h3 className="font-bold text-[15px]">هوش مصنوعی و تحلیل داده</h3>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-2">مسیر:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                  پایتون ← دیتابیس ← تحلیل داده ← یادگیری عمیق
                </div>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-2">تخصص‌ها:</div>
                <ul className="text-[13px] text-slate-600 list-disc list-inside space-y-1">
                  <li>بینایی ماشین</li>
                  <li>شبکه‌های عصبی بازگشتی</li>
                </ul>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-[12px] text-slate-500">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">جاوا در این مسیر اختیاری و مکمل است؛ برای شروع هوش مصنوعی، پایتون مهم‌ترین پیش‌نیاز است.</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full bg-white">
              <div className="flex items-center gap-2 mb-4 text-blue-700">
                <ShieldCheck size={18} />
                <h3 className="font-bold text-[15px]">شبکه و امنیت</h3>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-2">مسیر:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                  Network+ ← Linux LPIC-1 ← Linux LPIC-2 ← پایتون برای اتوماسیون ← امنیت و تست نفوذ مجاز
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-[12px] text-slate-500">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">برای ورود جدی به امنیت، یادگیری لینوکس و پایتون ضروری است.</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full bg-white">
              <div className="flex items-center gap-2 mb-4 text-blue-700">
                <Gamepad2 size={18} />
                <h3 className="font-bold text-[15px]">کودک و نوجوان</h3>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-1.5">برای سنین ۶ تا ۸ سال:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  Scratch ← بازی‌سازی مقدماتی
                </div>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-1.5">برای نوجوانان:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  پایتون نوجوان ← برنامه‌نویسی شی‌گرا ← بازی‌سازی
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-[12px] text-slate-500">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">Scratch فقط برای کودکان ۶ تا ۸ سال پیشنهاد می‌شود.</p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full bg-white">
              <div className="flex items-center gap-2 mb-4 text-blue-700">
                <Code size={18} />
                <h3 className="font-bold text-[15px]">مبانی برنامه‌نویسی و ربات تلگرام</h3>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-1.5">برنامه‌نویسی پایه خصوصی:</div>
                <ul className="text-[13px] text-slate-600 list-disc list-inside bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <li>C++</li>
                  <li>C#</li>
                </ul>
                <div className="text-[11px] text-slate-500 mt-1 mr-1">این دو دوره فقط به‌صورت خصوصی برگزار می‌شوند.</div>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-1.5">ربات تلگرام عمومی:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  پایتون ← ربات‌نویسی تلگرام
                </div>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-1.5">ربات تلگرام تحلیلی یا مالی:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                  پایتون ← دیتابیس ← تحلیل داده ← یادگیری عمیق
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-[12px] text-slate-500">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">برای ربات‌های ساده، یادگیری پایتون کافی است. تحلیل داده و یادگیری عمیق فقط برای ربات‌های مالی، تحلیلی یا پیش‌بینی‌محور لازم می‌شوند.</p>
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full bg-white">
              <div className="flex items-center gap-2 mb-4 text-blue-700">
                <Code size={18} />
                <h3 className="font-bold text-[15px]">API نویسی و بک‌اند</h3>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-2">مسیر:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                  پایتون ← دیتابیس ← Django ← Django REST Framework (DRF)
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-[12px] text-slate-500">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">بعد از این مسیر، دانشجو می‌تواند API و بک‌اند پروژه‌های واقعی را توسعه دهد.</p>
                </div>
              </div>
            </div>

            {/* Card 6 */}
            <div className="rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full bg-white">
              <div className="flex items-center gap-2 mb-4 text-blue-700">
                <Smartphone size={18} />
                <h3 className="font-bold text-[15px]">برنامه‌نویسی موبایل</h3>
              </div>
              <div className="mb-4">
                <div className="text-[13px] font-semibold text-slate-700 mb-2">مسیر:</div>
                <div className="text-[13px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                  برنامه‌نویسی موبایل جامع ← اپلیکیشن‌نویسی پروژه‌محور
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-[12px] text-slate-500">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">هدف این مسیر، ساخت و انتشار اپلیکیشن‌های واقعی است.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Final guidance strip */}
          <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <h4 className="font-bold text-[14px] text-blue-800 mb-3 flex items-center gap-2">
              <GraduationCap size={18} />
              راهنمای انتخاب مسیر
            </h4>
            <ul className="text-[13px] text-slate-700 space-y-2 font-medium list-disc list-inside">
              <li>مسیر مناسب براساس سن، سطح فعلی و هدف دانشجو انتخاب می‌شود.</li>
              <li>هر مرحله، پیش‌نیاز مرحله بعدی است.</li>
              <li>شروع مسیر بدون گذراندن پیش‌نیازها توصیه نمی‌شود.</li>
              <li>برای انتخاب دقیق‌تر، ابتدا سطح دانشجو بررسی شود.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

import React from 'react';
import * as Icons from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { useAppContext } from '../../hooks/useAppContext';

export const IntroTextView = ({ isModal, onClose, embedded }: { isModal?: boolean, onClose?: () => void, embedded?: boolean }) => {
  const { direction } = useLocale();
  const { setCurrentView } = useAppContext();

  return (
    <div className="relative w-full h-full flex flex-col bg-[#f8fafc] overflow-hidden" dir={direction}>
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100">
            <Icons.MessageSquareQuote size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-tight">متن‌های تماس و پرزنت</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">نسخه‌های مختلف برای شروع مکالمه با مشتری</p>
          </div>
        </div>

        {!embedded && (
          <>
          {isModal ? (
             <button
               onClick={onClose}
               className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
               title="بستن"
             >
               <Icons.X size={18} strokeWidth={2.5} />
             </button>
          ) : (
             <button
               onClick={() => setCurrentView('home')}
               className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors shrink-0"
             >
               بازگشت
             </button>
          )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar relative z-10 p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Important Notice */}
        <div className="bg-red-50 border-r-4 border-red-500 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Icons.AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 font-bold text-sm mb-1">نکته طلایی و بسیار مهم!</h3>
              <p className="text-red-700 text-xs sm:text-sm leading-relaxed">
                در صورتی که مخاطب از شما پرسید: <strong>«آیا شما از طرف دانشگاه شیراز تماس می‌گیرید؟»</strong><br/>
                پاسخ شما باید دقیقاً به این صورت باشد: <span className="font-bold">«نوین‌تک مجری برگزاری دوره‌های آموزشی کامپیوتر و برنامه‌نویسی مرکز آموزش‌های آزاد پردیس بین‌الملل شیراز است.»</span>
                <br/><br/>
                در صورتی که مخاطب از شما پرسید: <strong>«شماره منو از کجا آوردید؟»</strong><br/>
                پاسخ شما باید دقیقاً به این صورت باشد: <span className="font-bold">«این دیتاست رو مجموعه در اختیار ما قرار داده تا با شما تماس گرفته شود.»</span>
                <br/><br/>
                <span className="bg-red-100 px-2 py-0.5 rounded text-red-900 font-bold">از به کارگیری نام دانشگاه شیراز به هر عنوانی غیر از «محل برگزاری کلاس‌ها» و «مرجع صدور گواهینامه» به شدت خودداری نمایید.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Text */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
            <Icons.PhoneCall size={48} className="text-slate-300 mb-4" strokeWidth={1.5} />
            <h2 className="text-lg font-bold text-slate-600">متن‌های تماس تلفنی بیشتر در آینده اضافه خواهد شد</h2>
            <p className="text-slate-400 text-sm mt-2">در حال آماده‌سازی نسخه‌های جدید و حرفه‌ای پرزنت هستیم.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

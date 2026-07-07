import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { calculateStats } from '../../utils/stats';
import { BarChart3, PhoneCall, CheckCircle, XCircle, Clock, Search, X, ArrowLeft } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';

export const StatsView = ({ isModal, onClose }: { isModal?: boolean, onClose?: () => void }) => {
  const { calls, setCurrentView } = useAppContext();
  const { tr, direction } = useLocale();
  const stats = calculateStats(calls);

    const statCards = [
      { label: tr('کل تماس‌ها', 'Total calls'), value: stats.total, icon: PhoneCall, color: 'text-brand-700', bg: 'bg-brand-100', border: 'border-brand-200' },
      { label: tr('علاقه‌مند', 'Interested'), value: stats.interested, icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
      { label: tr('عدم تمایل', 'Not interested'), value: stats.notInterested, icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' },
      { label: tr('عدم پاسخ', 'No answer'), value: stats.noAnswer, icon: X, color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200' },
      { label: tr('پیگیری مجدد', 'Follow-up'), value: stats.followUp, icon: Clock, color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-200' },
      { label: tr('غیرفعال', 'Inactive'), value: stats.inactive, icon: Search, color: 'text-secondary', bg: 'bg-surface-hover', border: 'border-border' },
    ];
  
    return (
      <div className="relative w-full h-full flex flex-col bg-[#f8fafc] overflow-hidden" dir={direction}>
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <BarChart3 size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-tight">{tr('آمار و عملکرد', 'Statistics and performance')}</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{tr('نمای کلی وضعیت تماس‌ها و نرخ موفقیت در شیفت فعلی.', 'Overview of call results and success rate for the current shift.')}</p>
            </div>
          </div>

          {isModal ? (
             <button
               onClick={onClose}
               className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
               title="بستن"
             >
               <X size={18} strokeWidth={2.5} />
             </button>
          ) : (
             <button
               onClick={() => setCurrentView('home')}
               className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors shrink-0"
             >
               بازگشت
             </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
  
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statCards.map((card, i) => (
              <div key={i} className={`flex flex-col p-4 bento-card border-l-[3px] ${card.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                      <card.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-3xl font-medium text-primary">{card.value}</span>
                 </div>
                 <span className="text-[14px] font-medium text-secondary">{card.label}</span>
              </div>
            ))}
          </div>
  
          <div className="flex items-center justify-between p-5 rounded-xl bg-brand-500 text-white  ">
            <div className="flex flex-col gap-1 text-right">
               <span className="text-[15px] font-medium text-white">{tr('نرخ موفقیت شیفت', 'Shift success rate')}</span>
               <span className="text-[13px] font-normal text-brand-100">{tr('بر اساس درصد علاقه‌مندان نسبت به کل تماس‌ها', 'Interested contacts as a percentage of total calls')}</span>
            </div>
            <span className="text-4xl font-medium text-white" dir="ltr">{stats.successRate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

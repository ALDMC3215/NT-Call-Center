import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { calculateStats } from '../../utils/stats';
import { BarChart3, PhoneCall, CheckCircle, XCircle, Clock, Search, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';

export const StatsView = () => {
  const { calls } = useAppContext();
  const { tr } = useLocale();
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
      <div className="flex flex-col gap-6 w-full h-full overflow-y-auto p-4 md:p-8 bg-slate-50" >
        <div className="bento-card p-4 sm:p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1 text-right">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <BarChart3 size={18} />
               </div>
               <h2 className="text-xl font-medium text-primary">{tr('آمار و عملکرد', 'Statistics and performance')}</h2>
            </div>
            <p className="text-[14px] text-secondary">{tr('نمای کلی وضعیت تماس‌ها و نرخ موفقیت در شیفت فعلی.', 'Overview of call results and success rate for the current shift.')}</p>
          </div>
  
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
    );
};

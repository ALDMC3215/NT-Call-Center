import React, { useMemo } from 'react';
import { CallRecord } from '../../types';
import { useLocale } from '../../hooks/useLocale';
import { BarChart2, Phone, PhoneOff, CalendarDays } from 'lucide-react';

interface CallStatsViewProps {
  calls: CallRecord[];
}

export const CallStatsView: React.FC<CallStatsViewProps> = ({ calls }) => {
  const { tr, direction } = useLocale();

  // Aggregate stats by Jalali Date
  const statsByDate = useMemo(() => {
    const map: Record<string, { total: number; answered: number; unanswered: number }> = {};

    calls.forEach(call => {
      if (call.attempts) {
        call.attempts.forEach(attempt => {
          if (!attempt.jalaliDateTime || attempt.jalaliDateTime === 'Invalid Date') return;
          const datePart = attempt.jalaliDateTime.split(' ')[0];
          if (!datePart) return;

          if (!map[datePart]) {
            map[datePart] = { total: 0, answered: 0, unanswered: 0 };
          }
          
          map[datePart].total += 1;
          
          if (['مردد', 'ثبت نام کرد'].includes(attempt.callStatus)) {
            map[datePart].answered += 1;
          } else {
             // Treat all other attempts (جواب نداد, خاموش, مشغول, etc) as unanswered/failed
            map[datePart].unanswered += 1;
          }
        });
      }
    });

    // Sort dates descending
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [calls]);

  return (
    <div className="w-full h-full flex flex-col p-6 bg-slate-50 dark:bg-[#0f1419] overflow-y-auto" dir={direction}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-[#163326] flex items-center justify-center text-emerald-600 dark:text-[#8de0b5] shadow-sm border border-emerald-200 dark:border-[#2f674b]">
          <BarChart2 size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-[#f3f5f7] tracking-tight">{tr('آمار تعداد تماس‌ها', 'Call Counts Stats')}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-[#8e9aaa] mt-1">{tr('تعداد تماس‌های روزانه شما به تفکیک پاسخ‌داده و بی‌پاسخ', 'Your daily call counts broken down by answered and unanswered')}</p>
        </div>
      </div>

      {statsByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-slate-400">
           <BarChart2 size={48} className="mb-4 opacity-20" />
           <p className="font-bold">{tr('هیچ تماسی ثبت نشده است.', 'No calls recorded yet.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsByDate.map(([date, stats]) => (
            <div key={date} className="bg-white dark:bg-[#1c2530] rounded-2xl border border-slate-200 dark:border-[#2b3745] p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#344457] pb-3 mb-4">
                <div className="flex items-center gap-2 text-slate-700 dark:text-[#e8edf3] font-bold text-lg tracking-wide">
                  <CalendarDays size={18} className="text-emerald-500" />
                  <span dir="ltr">{date}</span>
                </div>
                <div className="bg-slate-100 dark:bg-[#344457] text-slate-600 dark:text-[#b7c2cf] font-black text-xs px-2.5 py-1 rounded-lg">
                  {tr('کل تماس‌ها:', 'Total:')} <span className="text-lg mr-1 text-slate-800 dark:text-[#f3f5f7]">{stats.total}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-teal-50 dark:bg-[#163832] border border-teal-100 dark:border-[#26524a] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-[#7ce3ce] font-bold text-sm">
                    <Phone size={16} />
                    {tr('پاسخ داده', 'Answered')}
                  </div>
                  <span className="text-xl font-black text-teal-700 dark:text-[#7ce3ce]">{stats.answered}</span>
                </div>
                
                <div className="flex items-center justify-between bg-rose-50 dark:bg-[#3d1920] border border-rose-100 dark:border-[#632935] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-[#ff9aa9] font-bold text-sm">
                    <PhoneOff size={16} />
                    {tr('بی‌پاسخ', 'Unanswered')}
                  </div>
                  <span className="text-xl font-black text-rose-600 dark:text-[#ff9aa9]">{stats.unanswered}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

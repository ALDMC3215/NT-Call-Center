import React, { useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { Phone, PhoneForwarded, Calendar, BookOpen, User } from 'lucide-react';

export const HomeView = () => {
  const { profile, calls, setCurrentView, setActiveCallTab } = useAppContext();
  const { tr, direction } = useLocale();

  // Simple counts using existing local state without new API calls
  const counts = useMemo(() => {
    let followupCount = 0;
    let todayCount = 0;

    // Quick approximation based on current local arrays (not perfect, but uses existing state as requested)
    // Note: Accurate counts depend on the backend, but we avoid new API calls.
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    for (const c of calls) {
      if (c.workList === 'followup') followupCount++;
      if (c.workList === 'today' && c.workListDate === todayStr) todayCount++;
    }

    return { followupCount, todayCount, totalCount: calls.length };
  }, [calls]);

  const cards = [
    {
      id: 'queue',
      title: tr('شمارهها', 'Numbers'),
      description: tr('مدیریت شماره‌های تماس جدید و در حال انتظار', 'Manage new and pending contact numbers'),
      icon: Phone,
      count: counts.totalCount,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('queue'); },
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      id: 'followup',
      title: tr('پیگیریهای من', 'Follow-ups'),
      description: tr('پیگیری‌های زمان‌بندی شده برای تماس مجدد', 'Scheduled follow-ups for call backs'),
      icon: PhoneForwarded,
      count: counts.followupCount,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('followup'); },
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      id: 'today',
      title: tr('فعالیت امروز', 'Today'),
      description: tr('شماره‌های منتقل شده به لیست فعالیت‌های امروز', 'Numbers transferred to today activity list'),
      icon: Calendar,
      count: counts.todayCount,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('today'); },
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
    },
    {
      id: 'courses',
      title: tr('دورهها', 'Courses'),
      description: tr('مشاهده لیست و اطلاعات دوره‌های آموزشی', 'View courses list and details'),
      icon: BookOpen,
      count: null,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('courses'); },
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      border: 'border-brand-100',
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col pt-6 pb-10 hide-scrollbar" dir={direction}>

      {/* Compact Welcome Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0 border border-brand-100">
            <User size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-wide">
              {tr('خوش آمدید', 'Welcome')} {profile?.name ? `، ${profile.name}` : ''}
            </h1>
            <p className="text-sm font-medium text-slate-600 mt-1 max-w-lg leading-relaxed">
              {tr('برای شروع، شمارهها را مدیریت کنید یا وضعیت پیگیریها و فعالیت امروز را بررسی کنید.', 'To start, manage numbers or check the status of follow-ups and today activity.')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Entry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={card.onClick}
              className="flex flex-col text-right items-start p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-300 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 border ${card.bg} ${card.color} ${card.border}`}>
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-[15px] text-slate-900 group-hover:text-brand-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-[12px] font-medium text-slate-500 mt-1.5 leading-relaxed flex-1">
                {card.description}
              </p>

              {card.count !== null && (
                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{tr('تعداد:', 'Count:')}</span>
                  <span className={`text-[13px] font-extrabold ${card.count > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                    {card.count}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};

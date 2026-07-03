import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { Phone, PhoneForwarded, Calendar, BookOpen, Activity, Sparkles, ArrowLeft, Settings, Info, Route, Shield } from 'lucide-react';
import { LearningPathsModal } from '../Shared/LearningPathsModal';

export const HomeView = () => {
  const { profile, calls, setCurrentView, setActiveCallTab } = useAppContext();
  const { tr, direction } = useLocale();
  const [learningPathsOpen, setLearningPathsOpen] = useState(false);

  // Simple counts using existing local state without new API calls
  const counts = useMemo(() => {
    let followupCount = 0;
    let todayCount = 0;

    // Quick approximation based on current local arrays
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
      id: 'today',
      title: tr('فعالیت امروز', 'Today'),
      description: tr('شماره‌های منتقل شده به لیست فعالیت‌های امروز', 'Numbers transferred to today activity list'),
      icon: Calendar,
      count: counts.todayCount,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('today'); },
      gradient: 'from-emerald-400 to-teal-500',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'followup',
      title: tr('پیگیری‌های من', 'Follow-ups'),
      description: tr('پیگیری‌های زمان‌بندی شده برای تماس مجدد', 'Scheduled follow-ups for call backs'),
      icon: PhoneForwarded,
      count: counts.followupCount,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('followup'); },
      gradient: 'from-amber-400 to-orange-500',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'courses',
      title: tr('دوره‌ها', 'Courses'),
      description: tr('مشاهده لیست و اطلاعات دوره‌های آموزشی', 'View courses list and details'),
      icon: BookOpen,
      count: null,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('courses'); },
      gradient: 'from-purple-500 to-brand-600',
      iconColor: 'text-brand-600',
      iconBg: 'bg-brand-50',
    },
    {
      id: 'queue',
      title: tr('شماره‌ها', 'Numbers'),
      description: tr('مدیریت شماره‌های تماس جدید و در حال انتظار', 'Manage new and pending contact numbers'),
      icon: Phone,
      count: counts.totalCount,
      onClick: () => { setCurrentView('dashboard'); setActiveCallTab('queue'); },
      gradient: 'from-indigo-500 to-blue-600',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      id: 'settings',
      title: tr('تنظیمات', 'Settings'),
      description: tr('تنظیمات شخصی‌سازی و پیکربندی سیستم', 'Personalization and system configuration settings'),
      icon: Settings,
      count: null,
      onClick: () => { setCurrentView('settings'); },
      gradient: 'from-slate-500 to-slate-700',
      iconColor: 'text-slate-600',
      iconBg: 'bg-slate-100',
    },
    {
      id: 'about',
      title: tr('راهنما', 'Guide'),
      description: tr('آموزش و راهنمای استفاده از پنل', 'Instructions and guide for using the panel'),
      icon: Info,
      count: null,
      onClick: () => { setCurrentView('about'); },
      gradient: 'from-blue-400 to-blue-600',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    ...(profile?.role !== 'admin' ? [{
      id: 'learning-paths',
      title: tr('مسیرها', 'Learning Paths'),
      description: tr('مسیرهای یادگیری و پیشرفت شخصی', 'Personal learning paths and progress'),
      icon: Route,
      count: null,
      onClick: () => { setLearningPathsOpen(true); },
      gradient: 'from-rose-400 to-red-500',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
    }] : []),
    ...(profile?.role === 'admin' ? [{
      id: 'admin',
      title: tr('مدیریت', 'Admin'),
      description: tr('پنل مدیریت کاربران و دسترسی‌ها', 'User management and permissions panel'),
      icon: Shield,
      count: null,
      onClick: () => { setCurrentView('admin'); },
      gradient: 'from-red-500 to-rose-700',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
    }] : [])
  ];

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col pt-4 pb-12 px-4 hide-scrollbar" dir={direction}>
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-800 p-8 md:p-10 mb-8 text-white shadow-xl shadow-brand-500/20 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center md:items-start md:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-5 shadow-sm">
            <Sparkles size={14} className="text-amber-300" />
            <span className="text-xs font-semibold text-brand-50 tracking-wide">
              {tr('پنل مدیریت تماس نوین‌تک', 'NovinTech Call Management Panel')}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            <span>{tr('خوش آمدید', 'Welcome')}</span>
            {profile?.name && (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-white pb-2 pr-1">
                {profile.name}
              </span>
            )}
          </h1>
          
          <p className="text-brand-100 font-medium max-w-xl text-sm sm:text-base leading-relaxed opacity-90">
            {tr('برای شروع، وضعیت پیگیری‌ها و فعالیت‌های امروز خود را بررسی کنید یا به بخش مدیریت شماره‌ها بروید تا با مشتریان جدید در ارتباط باشید.', 'To start, check your follow-ups and today’s activities or go to number management to connect with new clients.')}
          </p>
        </div>

        <div className="relative z-10 hidden lg:flex items-center justify-center">
          <div className="w-32 h-32 rounded-[2rem] bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Activity size={48} className="text-white/90 drop-shadow-md" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Stats & Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={card.onClick}
              className="group relative flex flex-col text-right items-start p-6 bg-white rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
            >
              {/* Top Gradient Highlight */}
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="w-full flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconBg} ${card.iconColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} strokeWidth={2} />
                </div>
                {card.count !== null && (
                  <div className="flex flex-col items-end justify-center min-h-[56px]">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider mb-0.5">{tr('تعداد', 'Count')}</span>
                    <span className={`text-2xl font-black ${card.count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                      {card.count}
                    </span>
                  </div>
                )}
              </div>
              
              <h3 className="font-extrabold text-[17px] text-slate-800 group-hover:text-brand-600 transition-colors mb-2.5">
                {card.title}
              </h3>
              
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed flex-1">
                {card.description}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100/80 w-full flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`flex items-center gap-1.5 text-[13px] font-bold ${card.iconColor}`}>
                  <span>{tr('مشاهده', 'View')}</span>
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <LearningPathsModal
        isOpen={learningPathsOpen}
        onClose={() => setLearningPathsOpen(false)}
      />
    </div>
  );
};


import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { Phone, PhoneForwarded, Calendar, BookOpen, Activity, ArrowLeft, Settings, Info, Route, Shield, LogOut, User, Target, CalendarDays, Sun, Moon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LearningPathsModal } from '../Shared/LearningPathsModal';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { ScheduleView } from '../Education/ScheduleView';
import { useTheme } from '../../hooks/useTheme';

export const HomeView = () => {
  const { profile, calls, setCurrentView, setActiveCallTab, setPopupView } = useAppContext();
  const { signOut } = useAuth();
  const { tr, direction } = useLocale();
  const [learningPathsOpen, setLearningPathsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Simple counts using existing local state
  const counts = useMemo(() => {
    let followupCount = 0;
    let todayCount = 0;
    let queueCount = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    for (const c of calls) {
      if (c.workList === 'followup') followupCount++;
      if (c.workList === 'today' && c.workListDate === todayStr) todayCount++;
      if (c.workList === 'none' && !c.isBlacklisted) queueCount++;
    }
    return { followupCount, todayCount, queueCount };
  }, [calls]);

  // Define categorized sections
  const sections = [
    {
      title: tr('ورود به پنل', 'Panel Entry'),
      items: [
        {
          id: 'queue',
          title: tr('پنل شماره‌گیری', 'Dialing Panel'),
          description: tr('ورود به پنل اصلی برای مدیریت تماس‌ها، پیگیری‌ها و دسترسی به ابزارهای کارشناسی', 'Enter main panel for call management, follow-ups, and expert tools'),
          icon: Phone,
          count: counts.queueCount,
          onClick: () => { setCurrentView('dashboard'); setActiveCallTab('queue'); },
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-500/10',
          gradient: 'from-indigo-500 to-blue-500'
        }
      ]
    },
    {
      title: tr('تنظیمات کاربری', 'User Settings'),
      items: [
        {
          id: 'profile',
          title: tr('پروفایل من', 'My Profile'),
          description: tr('مشاهده و ویرایش اطلاعات حساب کاربری', 'View and edit account information'),
          icon: User,
          count: null,
          onClick: () => { setCurrentView('profile'); },
          iconColor: 'text-fuchsia-600',
          iconBg: 'bg-fuchsia-500/10',
          gradient: 'from-fuchsia-400 to-pink-500'
        },
        {
          id: 'settings',
          title: tr('تنظیمات', 'Settings'),
          description: tr('تنظیمات شخصی‌سازی و ورود اطلاعات سیستم', 'Personalization and system configuration settings'),
          icon: Settings,
          count: null,
          onClick: () => { setCurrentView('settings'); },
          iconColor: 'text-slate-600',
          iconBg: 'bg-slate-500/10',
          gradient: 'from-slate-500 to-slate-700'
        },
        profile?.role === 'admin' ? {
          id: 'admin',
          title: tr('مدیریت سیستم', 'Admin'),
          description: tr('پنل مدیریت کاربران، دسترسی‌ها و لاگ‌ها', 'User management, permissions, and logs panel'),
          icon: Shield,
          count: null,
          onClick: () => { setCurrentView('admin'); },
          iconColor: 'text-red-600',
          iconBg: 'bg-red-500/10',
          gradient: 'from-red-500 to-rose-700'
        } : null,
        {
          id: 'about',
          title: tr('راهنمای سیستم', 'System Guide'),
          description: tr('راهنمای سیستم و توضیحات گردش کار', 'System help and workflow'),
          icon: Info,
          count: null,
          onClick: () => { setCurrentView('about'); },
          iconColor: 'text-teal-600',
          iconBg: 'bg-teal-500/10',
          gradient: 'from-teal-400 to-emerald-500'
        }
      ].filter(Boolean)
    }
  ];

  return (
    <div className="relative w-full min-h-full flex flex-col hide-scrollbar overflow-x-hidden select-none" dir={direction}>

      {/* Flat Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAFAFA] dark:bg-[#0f1419]"></div>

      {/* Theme Toggle (Right side) */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50">
        <div className="flex items-center bg-white dark:bg-[#1c2530] border border-stone-200 dark:border-[#2b3745] rounded-2xl p-1 gap-0.5" role="radiogroup" aria-label={tr('حالت نمایش', 'Display Mode')}>
          <button
            onClick={() => setTheme('light')}
            role="radio"
            aria-checked={theme === 'light'}
            aria-label={tr('حالت روشن', 'Light Mode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
              theme === 'light'
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                : 'text-stone-400 dark:text-[#8e9aaa] hover:text-stone-600 dark:hover:text-[#c0c8d2]'
            }`}
          >
            <Sun size={14} strokeWidth={2.2} />
            <span>{tr('روشن', 'Light')}</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            role="radio"
            aria-checked={theme === 'dark'}
            aria-label={tr('حالت تیره', 'Dark Mode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
              theme === 'dark'
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                : 'text-stone-400 dark:text-[#8e9aaa] hover:text-stone-600 dark:hover:text-[#c0c8d2]'
            }`}
          >
            <Moon size={14} strokeWidth={2.2} />
            <span>{tr('تیره', 'Dark')}</span>
          </button>
        </div>
      </div>

      {/* Logout (Left side) */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50">
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          className="flex items-center justify-center w-11 h-11 bg-white dark:bg-[#1c2530] border border-stone-200 dark:border-[#2b3745] rounded-2xl text-stone-400 dark:text-[#8e9aaa] hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:border-red-500/30 transition-colors"
          title={tr('خروج از حساب', 'Logout')}
        >
          <LogOut size={20} strokeWidth={2.2} />
        </button>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col pt-12 md:pt-16 pb-24 px-4 sm:px-6 md:px-8">

        {/* Welcome Header */}
         <div className="mb-12 md:mb-16 flex flex-col items-center text-center justify-center gap-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-800 dark:text-[#f3f5f7] tracking-tight mb-2">
              {tr('سلام،', 'Hello,')} <span className="text-indigo-600 dark:text-indigo-400">{profile?.name}</span>
            </h2>
            <p className="text-stone-500 dark:text-[#c0c8d2] font-medium text-sm sm:text-lg max-w-xl">
              {tr('سیستم مدیریت یکپارچه منابع شرکت نوین فناوری خبره بنیان', 'NovinTech Integrated Resource Management System')}
            </p>
         </div>

        {/* Render sections */}
        {/* Unified App Grid */}
        <div className="w-full mt-4 sm:mt-10">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 sm:gap-x-10 sm:gap-y-12 max-w-[800px] mx-auto">
            {sections.flatMap(s => s.items).map((card: any) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={card.onClick}
                  className="group flex flex-col items-center gap-3 w-[72px] sm:w-[90px] outline-none"
                >
                  <div className="w-[72px] h-[72px] sm:w-[90px] sm:h-[90px] rounded-[1.25rem] sm:rounded-[1.6rem] flex items-center justify-center bg-white dark:bg-[#171e27] border border-stone-200 dark:border-[#2b3745] group-hover:bg-stone-50 dark:group-hover:bg-[#1c2530] group-hover:border-stone-300 dark:group-hover:border-[#3a4757] group-hover:scale-[1.03] transition-all duration-200 relative">
                    <Icon size={36} strokeWidth={1.5} className={card.iconColor} />
                    {card.count !== null && card.count > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[12px] font-bold px-1.5 min-w-[24px] h-[24px] flex items-center justify-center rounded-full border-2 border-[#FAFAFA] dark:border-[#0f1419]">
                        {card.count}
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] sm:text-[14px] font-semibold text-stone-700 dark:text-[#c0c8d2] group-hover:text-stone-900 dark:group-hover:text-[#f3f5f7] transition-colors text-center leading-tight">
                    {card.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-stone-400 dark:text-[#46596e] text-[10px] sm:text-[11px] font-medium opacity-60 tracking-wider pointer-events-none z-0">
        امکانات پیشرفته تر در حال توسعه
      </div>

      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => { signOut(); setLogoutConfirmOpen(false); }}
        title={tr('خروج از حساب', 'Logout')}
        message={tr('آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟', 'Are you sure you want to logout?')}
        confirmText={tr('خروج', 'Logout')}
      />

      <LearningPathsModal
        isOpen={learningPathsOpen}
        onClose={() => setLearningPathsOpen(false)}
      />
    </div>
  );
};

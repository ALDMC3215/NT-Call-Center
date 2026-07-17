import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { Phone, PhoneForwarded, Calendar, BookOpen, Activity, ArrowLeft, Settings, Info, Route, Shield, LogOut, User, Target, CalendarDays } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LearningPathsModal } from '../Shared/LearningPathsModal';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { ScheduleView } from '../Education/ScheduleView';

export const HomeView = () => {
  const { profile, calls, setCurrentView, setActiveCallTab, setPopupView } = useAppContext();
  const { signOut } = useAuth();
  const { tr, direction } = useLocale();
  const [learningPathsOpen, setLearningPathsOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Simple counts using existing local state
  const counts = useMemo(() => {
    let followupCount = 0;
    let todayCount = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    for (const c of calls) {
      if (c.workList === 'followup') followupCount++;
      if (c.workList === 'today' && c.workListDate === todayStr) todayCount++;
    }
    return { followupCount, todayCount, totalCount: calls.length };
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
          count: counts.totalCount,
          onClick: () => { setCurrentView('dashboard'); setActiveCallTab('queue'); },
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-500/10',
          gradient: 'from-indigo-500 to-blue-500'
        },

        {
          id: 'negotiation',
          title: tr('تکنیک‌های مذاکره', 'Negotiation Techniques'),
          description: tr('آموزش جامع فروش و تکنیک‌های متقاعدسازی', 'Comprehensive sales and persuasion techniques'),
          icon: Target,
          count: null,
          onClick: () => { setCurrentView('negotiation'); },
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-500/10',
          gradient: 'from-amber-500 to-orange-500'
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAFAFA]"></div>

      {/* Floating Logout Button */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50">
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          className="flex items-center justify-center w-11 h-11 bg-white border border-stone-200 rounded-2xl text-stone-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
          title={tr('خروج از حساب', 'Logout')}
        >
          <LogOut size={20} strokeWidth={2.2} />
        </button>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col pt-12 md:pt-16 pb-24 px-4 sm:px-6 md:px-8">

        {/* Welcome Header */}
         <div className="mb-12 md:mb-16 flex flex-col items-center text-center justify-center gap-2">
            <span className="inline-block px-4 py-1.5 bg-white border border-stone-200 rounded-full text-[10px] sm:text-xs font-bold tracking-widest text-stone-500 uppercase mb-2">
              Command Center
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-800 tracking-tight mb-2">
              {tr('سلام،', 'Hello,')} <span className="text-indigo-600">{profile?.name}</span>
            </h2>
            <p className="text-stone-500 font-medium text-sm sm:text-lg max-w-xl">
              {tr('به پنل کارشناسی نوین تک خوش اومدی ✨', 'Welcome to NovinTech Operator Panel ✨')}
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
                  <div className="w-[72px] h-[72px] sm:w-[90px] sm:h-[90px] rounded-[1.25rem] sm:rounded-[1.6rem] flex items-center justify-center bg-white border border-stone-200 group-hover:bg-stone-50 group-hover:border-stone-300 group-hover:scale-[1.03] transition-all duration-200 relative">
                    <Icon size={36} strokeWidth={1.5} className={card.iconColor} />
                    {card.count !== null && card.count > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[12px] font-bold px-1.5 min-w-[24px] h-[24px] flex items-center justify-center rounded-full border-2 border-[#FAFAFA]">
                        {card.count}
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] sm:text-[14px] font-semibold text-stone-700 group-hover:text-stone-900 transition-colors text-center leading-tight">
                    {card.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
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

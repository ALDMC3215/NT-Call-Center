import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { Phone, PhoneForwarded, Calendar, BookOpen, Activity, ArrowLeft, Settings, Info, Route, Shield, LogOut, User } from 'lucide-react';
import { LearningPathsModal } from '../Shared/LearningPathsModal';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';

export const HomeView = () => {
  const { profile, calls, setCurrentView, setActiveCallTab } = useAppContext();
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
      title: tr('عملیات روزانه', 'Daily Operations'),
      items: [
        {
          id: 'queue',
          title: tr('شماره‌های جدید', 'New Numbers'),
          description: tr('مدیریت شماره‌های تماس جدید و بررسی نشده', 'Manage new and pending contact numbers'),
          icon: Phone,
          count: counts.totalCount,
          onClick: () => { setCurrentView('dashboard'); setActiveCallTab('queue'); },
          iconColor: 'text-indigo-600',
          iconBg: 'bg-indigo-500/10',
          gradient: 'from-indigo-500 to-blue-500'
        },
        {
          id: 'today',
          title: tr('فعالیت امروز', 'Today'),
          description: tr('شماره‌های منتقل شده به لیست فعالیت‌های امروز', 'Numbers transferred to today activity list'),
          icon: Calendar,
          count: counts.todayCount,
          onClick: () => { setCurrentView('dashboard'); setActiveCallTab('today'); },
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-500/10',
          gradient: 'from-emerald-400 to-teal-500'
        },
        {
          id: 'followup',
          title: tr('پیگیری‌های من', 'Follow-ups'),
          description: tr('پیگیری‌های زمان‌بندی شده برای تماس مجدد', 'Scheduled follow-ups for call backs'),
          icon: PhoneForwarded,
          count: counts.followupCount,
          onClick: () => { setCurrentView('dashboard'); setActiveCallTab('followup'); },
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-500/10',
          gradient: 'from-amber-400 to-orange-500'
        }
      ]
    },
    {
      title: tr('آموزش و اطلاعات', 'Education & Information'),
      items: [
        {
          id: 'courses',
          title: tr('دوره‌ها و قیمت‌ها', 'Courses & Prices'),
          description: tr('مشاهده لیست و اطلاعات به‌روز دوره‌های آموزشی', 'View updated courses list and details'),
          icon: BookOpen,
          count: null,
          onClick: () => { setCurrentView('dashboard'); setActiveCallTab('courses'); },
          iconColor: 'text-brand-600',
          iconBg: 'bg-brand-500/10',
          gradient: 'from-purple-500 to-brand-600'
        },
        profile?.role !== 'admin' ? {
          id: 'learning-paths',
          title: tr('مسیرهای یادگیری', 'Learning Paths'),
          description: tr('مسیرهای یادگیری و پیشرفت شخصی شما', 'Your personal learning paths and progress'),
          icon: Route,
          count: null,
          onClick: () => { setLearningPathsOpen(true); },
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-500/10',
          gradient: 'from-rose-400 to-red-500'
        } : null,
        {
          id: 'about',
          title: tr('راهنمای سیستم', 'System Guide'),
          description: tr('آموزش و راهنمای کامل استفاده از پنل نوین‌تک', 'Complete instructions and guide for using the panel'),
          icon: Info,
          count: null,
          onClick: () => { setCurrentView('about'); },
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-500/10',
          gradient: 'from-blue-400 to-blue-600'
        }
      ].filter(Boolean)
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
          id: 'logout',
          title: tr('خروج از حساب', 'Logout'),
          description: tr('پایان نشست فعلی و خروج امن از سیستم', 'End current session and log out securely'),
          icon: LogOut,
          count: null,
          onClick: () => { setLogoutConfirmOpen(true); },
          iconColor: 'text-slate-500',
          iconBg: 'bg-slate-500/10',
          gradient: 'from-slate-400 to-slate-500'
        }
      ].filter(Boolean)
    }
  ];

  return (
    <div className="relative w-full min-h-full flex flex-col hide-scrollbar overflow-x-hidden" dir={direction}>
      
      {/* Ambient macOS Style Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f8f9fa]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-300/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-300/30 rounded-full blur-[140px]"></div>
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] bg-teal-200/30 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col pt-12 pb-24 px-6 md:px-8">
        
        {/* Welcome Header - Glassmorphic */}
        <div className="mb-14 flex items-center justify-between">
           <div>
             <span className="inline-block px-3 py-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-full text-xs font-bold tracking-widest text-slate-500 uppercase mb-4 shadow-sm">
               Command Center
             </span>
             <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-3">
               {tr('سلام،', 'Hello,')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">{profile?.name}</span>
             </h2>
             <p className="text-slate-500 font-medium text-lg max-w-xl">
               {tr('به پنل کارشناسی نوین تک خوش اومدی ✨', 'Welcome to NovinTech Operator Panel ✨')}
             </p>
           </div>
           <div className="hidden md:flex w-20 h-20 rounded-[1.75rem] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
             <Activity className="text-brand-600 drop-shadow-sm" size={36} strokeWidth={1.5} />
           </div>
        </div>
        
        {/* Render sections */}
        <div className="flex flex-col gap-12">
          {sections.map(section => (
            <div key={section.title} className="w-full">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {section.title}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((card: any) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={card.onClick}
                      className="group relative flex flex-col text-right items-start p-6 sm:p-7 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/70 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-400 ease-out overflow-hidden aspect-video"
                    >
                      {/* Top Gradient Highlight */}
                      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      
                      <div className="w-full flex items-start justify-between mb-auto">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconBg} ${card.iconColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                          <Icon size={26} strokeWidth={2} />
                        </div>
                        {card.count !== null && (
                          <div className="flex flex-col items-end justify-center min-h-[56px] bg-white/60 px-3 py-1.5 rounded-xl border border-white/80 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">{tr('تعداد', 'Count')}</span>
                            <span className={`text-xl font-black ${card.count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                              {card.count}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full pt-6 pl-14">
                        <h3 className="font-extrabold text-[18px] text-slate-800 group-hover:text-brand-600 transition-colors mb-2.5">
                          {card.title}
                        </h3>
                        
                        <p className="text-[13px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                          {card.description}
                        </p>
                      </div>

                      {/* Hover Arrow Overlay */}
                      <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-400">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md ${card.iconColor}`}>
                          <ArrowLeft size={18} strokeWidth={2.5} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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

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
import { UserProfileDropdown } from './UserProfileDropdown';

const newsItems = [
  {
    id: 9,
    title: 'دسته‌بندی و مرتب‌سازی هوشمند جدول!',
    category: 'بهبود رابط کاربری',
    date: 'همین الان',
    description: 'برای اینکه جدول کاری شما خلوت‌تر بشه، لیست کارشناسان حالا به سه دسته «پیگیری‌ها»، «کارشده‌ها» و «خام» تقسیم شده. از این به بعد می‌تونید هر بخش رو به راحتی باز یا بسته (Collapse/Expand) کنید. در ضمن، شماره‌هایی که به صورت دستی اضافه بشن، مستقیم میرن اول لیست خام تا سریع بتونید روشون کار کنید.',
    icon: Icons.LayoutList,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    colSpan: 'md:col-span-2'
  },
  {
    id: 8,
    title: 'انیمیشن‌های نرم و پویا!',
    category: 'رابط کاربری',
    date: 'همین الان',
    description: 'کار با پنل خیلی لذت‌بخش‌تر شده! از این به بعد وقتی نتیجه یه تماس رو تغییر می‌دین یا شماره‌ای رو حذف می‌کنین، اون ردیف خشک و ناگهانی غیب نمیشه؛ بلکه با یه انیمیشن نرم و باحال (Framer Motion) جابه‌جا میشه و میره تو جایگاه جدیدش. حتما امتحانش کنید!',
    icon: Icons.Sparkles,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10',
    colSpan: 'md:col-span-1'
  },
  {
    id: 7,
    title: 'هوشمندسازی دقیق‌تر آمار روزانه',
    category: 'به‌روزرسانی سیستم',
    date: 'امروز',
    description: 'مکانیزم ثبت آمار کارکردهای روزانه شما خیلی دقیق‌تر شده. تغییرات متوالی روی یک شماره فقط در صورتی به عنوان کارکرد جدید حساب میشه که اون شماره از قبل خام بوده باشه، تا جلوی هرگونه اشتباه در محاسبه آمار روزانه‌تون گرفته بشه.',
    icon: Icons.Activity,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    colSpan: 'md:col-span-3'
  },
  {
    id: 6,
    title: 'بهبود لیست سیاه و امکانات کارشناسی',
    category: 'به‌روزرسانی قبلی',
    date: 'امروز',
    description: 'در بروزرسانی‌های قبلی، امکان انتقال سریع عدم‌تمایل‌ها به لیست سیاه با یک کلیک، تاییدیه ثبت‌نام و نمایش زمان دقیق آپدیت جلوی هر شماره اضافه شده بود که امیدواریم به کارتون سرعت بیشتری بخشیده باشه.',
    icon: Icons.ShieldCheck,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    colSpan: 'md:col-span-3'
  },
  {
    id: 5,
    title: 'تحول در مدیریت تماس‌ها؛ کارها خیلی ساده‌تر شده!',
    category: 'راهنمای سیستم',
    date: 'ویژه',
    description: 'روند کار روی شماره‌ها خیلی راحت‌تر شده! دیگه لازم نیست بین لیست‌های مختلف جابجا بشید؛ الان همه شماره‌ها توی یه جدول جمع شدن. هر شماره فقط یه "وضعیت" اصلی داره و بقیه کارها (مثل پیگیری، لیست سیاه، یادداشت یا حذف) رو می‌تونید با دکمه‌های کوچیک جلوی هر ردیف انجام بدید. تازه یه قابلیت خیلی خفن (انتخاب گروهی) هم اضافه شده که باهاش می‌تونید همزمان روی چندتا شماره تغییرات بدید تا سرعت کارتون حسابی بره بالا.',
    icon: Icons.Workflow,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    colSpan: 'md:col-span-2'
  },
  {
    id: 4,
    title: 'پروفایل کاربری تو مشت شماست!',
    category: 'بهبود رابط کاربری',
    date: 'امروز',
    description: 'تنظیمات پروفایل و دکمه تغییر تم (حالت تاریک و روشن) همگی با هم رفتن گوشه بالای صفحه اصلی. حالا خیلی راحت‌تر و سریع‌تر می‌تونید اکانتتون رو مدیریت کنید یا ظاهر پنل رو به سلیقه خودتون تغییر بدید.',
    icon: Icons.UserCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    colSpan: 'md:col-span-1'
  },
  {
    id: 1,
    title: 'انتقال فایل اکسل به پنل کارشناسان',
    category: 'به‌روزرسانی سیستم',
    date: 'امروز',
    description: 'برای اینکه کارتون راحت‌تر بشه، دکمه آپلود فایل اکسل رو از تو بخش تنظیمات برداشتیم و آوردیمش دقیقا بالای همون جدولی که تو پنل کارشناسان باهاش کار می‌کنید تا همیشه دم دستتون باشه.',
    icon: Icons.FileSpreadsheet,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    colSpan: 'md:col-span-2'
  },
  {
    id: 2,
    title: 'تب جدید لیست سیاه در پنل',
    category: 'امکانات جدید',
    date: 'دیروز',
    description: 'مدیریت شماره‌های مسدود شده الان خیلی ساده‌تر شده. به جای اینکه برید تو تنظیمات بگردید، این بخش الان شده یه تب جداگانه بالای همون پنل کارشناسان تا بتونید خیلی سریع شماره‌های بلک لیست رو مدیریت کنید.',
    icon: Icons.ShieldBan,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10',
    colSpan: 'md:col-span-1'
  },
  {
    id: 3,
    title: 'خلوت‌سازی و تغییرات بخش تنظیمات',
    category: 'اطلاعیه',
    date: 'دیروز',
    description: 'صفحه تنظیمات رو کلا خلوت کردیم تا دیگه گیج‌کننده نباشه. الان این صفحه بیشتر مخصوص تنظیمات حساب کاربری شماست. بقیه امکانات اضافی دارن جابجا میشن و میرن همون‌جایی که دقیقا بهشون نیاز دارید.',
    icon: Icons.Settings,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    colSpan: 'md:col-span-3'
  }
];

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
          title: tr('پنل کارشناسان', 'Dialing Panel'),
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

      {/* Theme Toggle & User Dropdown (Right side) */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 flex items-center gap-3">
        <UserProfileDropdown />
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1c2530] border border-stone-200 dark:border-[#2b3745] rounded-2xl shadow-sm" role="radiogroup" aria-label={tr('انتخاب تم', 'Theme Selection')}>
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

        {/* News Feed Section */}
        <div className="w-full mt-12 md:mt-20 pt-12 md:pt-16 border-t border-stone-200/60 dark:border-[#2b3745]/60 flex flex-col items-center">
           <div className="w-full mx-auto">
             <div className="flex flex-col mb-8 sm:mb-10 w-full text-right">
               <h3 className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-[#f3f5f7] flex items-center gap-2.5 mb-2">
                 <Icons.Newspaper size={28} strokeWidth={2.2} className="text-indigo-500" />
                 {tr('تازه‌های سیستم', 'System Updates & News')}
               </h3>
               <p className="text-[13px] font-bold text-stone-500 dark:text-[#8e9aaa] pr-10">
                 {tr('اطلاعیه‌ها، امکانات جدید و تغییرات اخیر سیستم را از این بخش دنبال کنید.', 'Follow announcements, new features and recent changes of the system from here.')}
               </p>
             </div>
             <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {newsItems.map(item => (
                  <div key={item.id} className={`group bg-white dark:bg-[#1c2530] border border-stone-200 dark:border-[#2b3745] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col ${item.colSpan}`}>
                    <div className="p-6 md:p-7 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-5">
                         <div className="flex items-center gap-3.5">
                           <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${item.bg} ${item.color}`}>
                              <item.icon size={24} strokeWidth={2} />
                           </div>
                           <span className={`text-[12px] font-extrabold px-3 py-1.5 rounded-lg ${item.bg} ${item.color}`}>
                             {item.category}
                           </span>
                         </div>
                         <span className="text-[12px] font-bold text-stone-400 dark:text-[#8e9aaa] bg-stone-50 dark:bg-[#202b38] px-3 py-1.5 rounded-lg border border-stone-100 dark:border-[#2b3745]">
                           {item.date}
                         </span>
                      </div>
                      <h4 className="text-[18px] md:text-[20px] font-bold text-stone-800 dark:text-[#f3f5f7] mb-3 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[14px] md:text-[15px] text-stone-500 dark:text-[#b7c2cf] font-medium leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
             </div>
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

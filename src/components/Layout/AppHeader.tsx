import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Settings,
  User,
  Info,
  LogOut,
  PhoneOff,
  X,
  Phone,
  PhoneForwarded,
  BookOpen,
  Calendar,
  Search,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import NTLogo from '../../NT Logo.svg';

type CallTab = 'queue' | 'today' | 'followup' | 'blacklist' | 'courses';

export const AppHeader = () => {
  const { currentView, setCurrentView, profile, activeCallTab, setActiveCallTab } = useAppContext();
  const { signOut } = useAuth();
  const { tr, direction } = useLocale();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const isDashboard = currentView === 'dashboard';



  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // ─── Hamburger nav: secondary pages only, no duplicates ───────────────────
  // Profile has its own icon button → removed from here
  // Dashboard is reached via logo click → removed from here
  // Blacklist as a full page lives here (not as a dashboard tab)
  const menuItems = [
    { id: 'settings', icon: Settings, label: tr('تنظیمات', 'Settings') },
    { id: 'about', icon: Info, label: tr('راهنما', 'Guide') },
  ];

  // ─── Dashboard tabs: call-related only, no blacklist (it's a separate page) ─
  const callTabs: { id: CallTab; label: string; icon: React.ReactNode }[] = [
    { id: 'followup', label: tr('پیگیری ها', 'Follow-ups'), icon: <PhoneForwarded size={14} /> },
    { id: 'queue',    label: tr('شماره ها',  'Numbers'),    icon: <Phone size={14} /> },
    { id: 'courses',  label: tr('دوره ها',   'Courses'),    icon: <BookOpen size={14} /> },
  ];

  const viewLabels: Record<string, string> = {
    blacklist: tr('لیست سیاه', 'Blacklist'),
    profile:   tr('پروفایل',   'Profile'),
    settings:  tr('تنظیمات',   'Settings'),
    about:     tr('راهنما',    'Guide'),
    admin:     tr('مدیریت',    'Admin'),
  };
  const viewLabel = viewLabels[currentView] || tr('داشبورد', 'Dashboard');

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="w-full shrink-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between w-full h-14 px-4 md:px-6 relative" dir="ltr">

          {/* ── LEFT: Logo ─────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 flex items-center justify-center transition-colors">
              <img src={NTLogo} alt="Novin Tech Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-slate-900 font-extrabold text-sm hidden md:block tracking-wide transition-colors">
              Novin Tech Panel
            </span>
          </div>

          {/* ── CENTER: Universal Navigation ─────────── */}
          {/* ── CENTER: Unified Navigation ─────────── */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto z-10 w-auto">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-2 py-1">
              
              {/* Call Tabs */}
              {callTabs.map(tab => {
                const isActive = currentView === 'dashboard' && activeCallTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (currentView !== 'dashboard') setCurrentView('dashboard');
                      setActiveCallTab(tab.id as any);
                    }}
                    className={`flex flex-row-reverse items-center gap-1.5 px-3 h-8 rounded-md text-[13px] transition-all whitespace-nowrap font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1 ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                );
              })}

              <div className="w-px h-5 bg-border mx-2"></div>

              {/* Menu Items */}
              {menuItems.map(item => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`flex flex-row-reverse items-center gap-1.5 px-3 h-8 rounded-md text-[13px] transition-all whitespace-nowrap font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1 ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                );
              })}

              {/* Admin */}
              {profile?.role === 'admin' && (
                <>
                  <div className="w-px h-5 bg-border mx-2"></div>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`flex flex-row-reverse items-center gap-1.5 px-3 h-8 rounded-md text-[13px] transition-all whitespace-nowrap font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1 ${
                      currentView === 'admin'
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Settings size={14} />
                    <span className="hidden xl:inline">{tr('مدیریت', 'Admin')}</span>
                  </button>
                </>
              )}

            </div>
          </div>

          {/* ── RIGHT: Profile + Time + Logout ─────────────────── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Live Clock */}
            <div className="hidden lg:flex flex-row items-center justify-center gap-2 px-3 py-1.5 bg-surface-hover rounded-md border border-border/50 mr-2">
              <span className="text-xs font-medium text-slate-500">
                {time.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <div className="w-px h-3 bg-border"></div>
              <span className="text-[13px] font-semibold text-brand-600 tracking-wider">
                {time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Logout button */}
            <button
              id="header-logout"
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              title={tr('خروج از حساب', 'Logout')}
              className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
            >
              <LogOut size={16} />
            </button>

          </div>

        </div>
      </header>

      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => { signOut(); setLogoutConfirmOpen(false); }}
        title={tr('خروج از حساب', 'Logout')}
        message={tr('آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟', 'Are you sure you want to logout?')}
        confirmText={tr('خروج', 'Logout')}
      />
    </>
  );
};

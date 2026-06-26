/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useAppContext } from './hooks/useAppContext';
import { ToastProvider, customToast as toast } from './components/UI/toast';

const ProfileView        = React.lazy(() => import('./components/Profile/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView       = React.lazy(() => import('./components/Settings/SettingsView').then(m => ({ default: m.SettingsView })));
const BlacklistView      = React.lazy(() => import('./components/Blacklist/BlacklistView').then(m => ({ default: m.BlacklistView })));
const CallListWorkspace  = React.lazy(() => import('./components/Calls/CallListWorkspace').then(m => ({ default: m.CallListWorkspace })));
const AboutView          = React.lazy(() => import('./components/About/AboutView').then(m => ({ default: m.AboutView })));
const AuthScreen         = React.lazy(() => import('./components/Auth/AuthScreen').then(m => ({ default: m.AuthScreen })));
const PendingScreen      = React.lazy(() => import('./components/Auth/PendingScreen').then(m => ({ default: m.PendingScreen })));
const ManagerDashboard   = React.lazy(() => import('./components/Manager/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));

import { LoadingSpinner } from './components/Shared/LoadingSpinner';
import { AnimatePresence, motion } from 'motion/react';
import { AppHeader } from './components/Layout/AppHeader';
import { useLocale } from './hooks/useLocale';
import ClickSpark from './components/UI/ClickSpark';
import { Shield, ArrowLeft, UserCheck } from 'lucide-react';

// ---------------------------------------------------------------------------
// Follow-up reminder — unchanged from original
// ---------------------------------------------------------------------------
const FollowupReminder = () => {
  const { calls } = useAppContext();
  React.useEffect(() => {
    const timer = setInterval(() => {
      const followups = calls.filter(c => {
        if (!c.attempts || c.attempts.length === 0) return false;
        const lastAttempt = c.attempts[c.attempts.length - 1];
        const s = lastAttempt.callStatus;
        const adv = lastAttempt.advisory;
        return s === 'عدم تمایل' || s === 'پاسخ نداد' || s === 'نامشخص' ||
               s === 'پیگیری مجدد در هفته آینده' || adv === 'بله' || adv === 'خیر' ||
               adv === 'قصد دارد' || adv === 'در آینده' || adv === 'احتمالا';
      });
      if (followups.length > 0) {
        toast.info(`یادآوری: شما ${followups.length} شماره در لیست پیگیری دارید که نیازمند تماس مجدد هستند.`, { duration: 8000 });
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, [calls]);
  return null;
};

// ---------------------------------------------------------------------------
// Role-mismatch banners — shown inline when a signed-in user hits the wrong panel
// ---------------------------------------------------------------------------
const AdminTriedAgentPanel = () => {
  const { signOut, setLoginMode } = useAuth();
  return (
    <div className="flex w-full min-h-[100vh] items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white rounded-[2rem] border border-indigo-200 p-10 shadow-xl max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-5">
          <Shield size={32} className="text-indigo-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-3">حساب شما مدیر است</h2>
        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
          شما با یک حساب مدیریت وارد شده‌اید. لطفاً از پنل مدیریت استفاده کنید.
        </p>
        <button onClick={e => { e.preventDefault(); setLoginMode('manager'); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-95">
          <ArrowLeft size={16} />
          <span>رفتن به پنل مدیریت</span>
        </button>
        <button onClick={signOut} className="block w-full mt-3 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">خروج از حساب</button>
      </div>
    </div>
  );
};

const AgentTriedManagerPanel = () => {
  const { signOut, setLoginMode } = useAuth();
  return (
    <div className="flex w-full min-h-[100vh] items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white rounded-[2rem] border border-red-200 p-10 shadow-xl max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <UserCheck size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-3">این حساب مدیر نیست</h2>
        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
          حساب شما از نوع کارشناس است و به پنل مدیریت دسترسی ندارد.<br />
          اگر فکر می‌کنید این اشتباه است، با مدیر سیستم تماس بگیرید.
        </p>
        <button onClick={e => { e.preventDefault(); setLoginMode('agent'); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95">
          <ArrowLeft size={16} />
          <span>ورود به پنل کارشناسی</span>
        </button>
        <button onClick={signOut} className="block w-full mt-3 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">خروج از حساب</button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const { authStatus, loginMode } = useAuth();
  const { profile, currentView, accentColor, sparkColor } = useAppContext();
  const { direction } = useLocale();

  // Determine if there's a role/panel mismatch
  const adminTriedAgent   = authStatus === 'active_admin'  && loginMode === 'agent';
  const agentTriedManager = authStatus === 'active_agent'  && loginMode === 'manager';

  return (
    <>
      <style>{`
        :root {
          --theme-brand-500: ${accentColor};
          --theme-brand-600: ${accentColor};
          --theme-brand-400: ${accentColor};
          --theme-brand-700: ${accentColor};
        }
        .bg-brand-500 { background-color: var(--theme-brand-500); }
        .text-brand-500 { color: var(--theme-brand-500); }
        .border-brand-500 { border-color: var(--theme-brand-500); }
        .ring-brand-500 { --tw-ring-color: var(--theme-brand-500); }
        .from-brand-500 { --tw-gradient-from: var(--theme-brand-500) var(--tw-gradient-from-position); }
      `}</style>
      <ToastProvider />

      <ClickSpark sparkColor={sparkColor} sparkSize={8} sparkRadius={25} sparkCount={6} duration={500}>
        <div className="selection:bg-brand-200 relative w-full h-screen font-sans antialiased text-primary bg-slate-50 flex flex-col overflow-hidden">
          <div className="relative z-10 w-full h-full flex flex-col">
            <AnimatePresence mode="wait">

              {/* 1. Loading ───────────────────────────────────────────── */}
              {authStatus === 'loading' && (
                <motion.div key="auth-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center">
                  <LoadingSpinner />
                </motion.div>
              )}

              {/* 2. Unauthenticated ─────────────────────────────────── */}
              {authStatus === 'unauthenticated' && (
                <motion.div key="auth-screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="w-full min-h-[100vh] bg-surface-hover">
                  <React.Suspense fallback={<LoadingSpinner />}><AuthScreen /></React.Suspense>
                </motion.div>
              )}

              {/* 3. Pending / Disabled ──────────────────────────────── */}
              {(authStatus === 'pending' || authStatus === 'disabled') && (
                <motion.div key="pending-screen" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="w-full min-h-[100vh] bg-surface-hover">
                  <React.Suspense fallback={<LoadingSpinner />}><PendingScreen /></React.Suspense>
                </motion.div>
              )}

              {/* 4. Admin tried agent panel → guide to manager panel ── */}
              {adminTriedAgent && (
                <motion.div key="admin-wrong-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="w-full min-h-[100vh]">
                  <AdminTriedAgentPanel />
                </motion.div>
              )}

              {/* 5. Agent tried manager panel → clear mismatch message  */}
              {agentTriedManager && (
                <motion.div key="agent-wrong-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="w-full min-h-[100vh]">
                  <AgentTriedManagerPanel />
                </motion.div>
              )}

              {/* 6. Active admin, manager panel ─────────────────────── */}
              {authStatus === 'active_admin' && !adminTriedAgent && (
                <motion.div key="manager-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="w-full h-screen overflow-hidden bg-slate-50 flex flex-col" dir={direction}>
                  <React.Suspense fallback={<LoadingSpinner />}><ManagerDashboard /></React.Suspense>
                </motion.div>
              )}

              {/* 7. Active agent, operational panel (unchanged) ─────── */}
              {authStatus === 'active_agent' && !agentTriedManager && profile && (
                <motion.div key="main-app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="w-full h-screen overflow-hidden bg-transparent flex relative" dir={direction}>
                  <div className="flex flex-col w-full h-full overflow-hidden z-10">
                    <FollowupReminder />
                    <div className="w-full pointer-events-auto shrink-0 z-20"><AppHeader /></div>
                    <div className="flex-1 w-full min-h-0 overflow-auto pointer-events-auto bg-transparent relative z-10">
                      <AnimatePresence mode="wait">
                        <motion.div key={currentView} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="w-full h-full flex flex-col overflow-hidden bg-transparent">
                          <React.Suspense fallback={<LoadingSpinner />}>
                            {currentView === 'dashboard' && <CallListWorkspace />}
                            {currentView === 'profile'   && <ProfileView />}
                            {currentView === 'settings'  && <SettingsView />}
                            {currentView === 'blacklist' && <BlacklistView />}
                            {currentView === 'about'     && <AboutView />}
                          </React.Suspense>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </ClickSpark>
    </>
  );
}

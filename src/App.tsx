/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from './hooks/useAppContext';
import { ToastProvider, customToast as toast } from './components/UI/toast';

const ProfileSetup = React.lazy(() => import('./components/Profile/ProfileSetup').then(m => ({ default: m.ProfileSetup })));
const ProfileView = React.lazy(() => import('./components/Profile/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView = React.lazy(() => import('./components/Settings/SettingsView').then(m => ({ default: m.SettingsView })));
const BlacklistView = React.lazy(() => import('./components/Blacklist/BlacklistView').then(m => ({ default: m.BlacklistView })));
const CallListWorkspace = React.lazy(() => import('./components/Calls/CallListWorkspace').then(m => ({ default: m.CallListWorkspace })));
const AdminView = React.lazy(() => import('./components/Admin/AdminView').then(m => ({ default: m.AdminView })));
const AboutView = React.lazy(() => import('./components/About/AboutView').then(m => ({ default: m.AboutView })));

import { LoadingSpinner } from './components/Shared/LoadingSpinner';
import { AnimatePresence, motion } from 'motion/react';
import { AppHeader } from './components/Layout/AppHeader';
import { useLocale } from './hooks/useLocale';
import ClickSpark from './components/UI/ClickSpark';

const FollowupReminder = () => {
  const { calls } = useAppContext();
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      const followups = calls.filter(c => {
         if (!c.attempts || c.attempts.length === 0) return false;
         const lastAttempt = c.attempts[c.attempts.length - 1];
         const s = lastAttempt.callStatus;
         const adv = lastAttempt.advisory;
         return s === 'عدم تمایل' || 
                s === 'پاسخ نداد' || 
                s === 'نامشخص' || 
                s === 'پیگیری مجدد در هفته آینده' ||
                adv === 'بله' || 
                adv === 'خیر' || 
                adv === 'قصد دارد' ||
                adv === 'در آینده' ||
                adv === 'احتمالا';
      });
      if (followups.length > 0) {
        toast.info(`یادآوری: شما ${followups.length} شماره در لیست پیگیری دارید که نیازمند تماس مجدد هستند.`, { duration: 8000 });
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(timer);
  }, [calls]);
  
  return null;
};

export default function App() {
  const { profile, currentView, activeCallTab, accentColor, sparkColor } = useAppContext();
  const { direction } = useLocale();

  const isHomeView = currentView === 'home';

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
          
          {/* Animated Background removed */}

          <div className="relative z-10 w-full h-full flex flex-col">
            <AnimatePresence mode="wait">
            {!profile ? (
              <motion.div
                key="profile-setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full min-h-[100vh] origin-center bg-surface-hover"
              >
                <React.Suspense fallback={<LoadingSpinner />}>
                  <ProfileSetup />
                </React.Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="main-app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full h-screen overflow-hidden bg-transparent flex relative"
                dir={direction}
              >
                <div className="flex flex-col w-full h-full overflow-hidden z-10">
                  <FollowupReminder />
                  <div className="w-full pointer-events-auto shrink-0 z-20">
                    <AppHeader />
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 w-full min-h-0 overflow-auto pointer-events-auto bg-transparent relative z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`w-full h-full flex flex-col overflow-hidden bg-transparent`}
                      >
                        <React.Suspense fallback={<LoadingSpinner />}>
                          {currentView === 'dashboard' && <CallListWorkspace />}
                          {currentView === 'profile' && <ProfileView />}
                          {currentView === 'settings' && <SettingsView />}
                          {currentView === 'blacklist' && <BlacklistView />}
                          {currentView === 'about' && <AboutView />}
                          {(currentView === 'admin' || currentView === 'stats' || currentView === 'experts' || currentView === 'managers') && <AdminView />}
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

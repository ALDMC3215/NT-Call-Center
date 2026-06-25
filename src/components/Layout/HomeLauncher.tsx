import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../hooks/useLocale';
import { LogOut, PhoneForwarded } from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';
import { customToast as toast } from '../UI/toast';

export const HomeLauncher = () => {
  const { tr, direction } = useLocale();
  const { setCurrentView, setActiveCallTab, logout } = useAppContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    toast.success(tr('با موفقیت خارج شدید', 'Logged out successfully'));
  };

  const handleStartCalls = () => {
    setActiveCallTab('queue');
    setCurrentView('dashboard');
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-transparent overflow-hidden w-full p-4 md:p-8 relative" dir={direction}>
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* Main Content Area */}
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center gap-12"
        >
          {/* Welcome Text */}
          <div className="text-center flex flex-col items-center gap-4">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/20 tracking-tight"
              dir="ltr"
            >
              Welcome
            </motion.h1>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent w-3/4 max-w-sm"
            />
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-secondary font-normal tracking-widest uppercase text-sm md:text-base mt-2"
            >
              NovinTech Call Manager
            </motion.p>
          </div>

          {/* Huge Animated Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartCalls}
            className="group relative flex items-center justify-center gap-4 px-10 py-5 rounded-full overflow-hidden transition-all  hover:"
          >
            {/* Button Background Gradients */}
            <div className="absolute inset-0 bg-purple-600/80 border border-border rounded-full" />
            
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 rounded-full group-hover:opacity-70 transition-opacity" />
            
            {/* Content */}
            <PhoneForwarded className="relative z-10 w-8 h-8 text-white drop- transition-transform group-hover:scale-110" />
            <span className="relative z-10 text-2xl font-medium text-white tracking-wide drop-">
              {tr('شروع تماس‌ها', 'Start Calls')}
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Logout Corner Button */}
      <div className="absolute bottom-8 end-8 z-50 flex items-center gap-3" dir="rtl">
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="flex items-center gap-2 bg-surface  border border-red-500/50 px-4 py-2 rounded-full "
            >
              <span className="text-sm text-secondary font-medium">{tr('خارج می‌شوید؟', 'Are you sure?')}</span>
              <button 
                onClick={handleLogoutConfirm}
                className="text-sm font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full transition-colors "
              >
                {tr('بله', 'Yes')}
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="text-sm font-medium bg-slate-200 hover:bg-slate-300 text-secondary px-4 py-1.5 rounded-full transition-colors"
              >
                {tr('خیر', 'No')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
          className="w-12 h-12 rounded-full bg-surface-hover border border-border hover:border-red-500/80 hover:bg-red-500/20 flex items-center justify-center text-secondary hover:text-red-400 transition-all  hover:"
          title={tr('خروج از سیستم', 'Logout')}
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

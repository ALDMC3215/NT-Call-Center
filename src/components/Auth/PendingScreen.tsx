/**
 * PendingScreen — shown when account_status = pending | disabled
 *
 * Blocks access to the operational panel and explains clearly (in Persian)
 * that the account is awaiting manager approval or has been disabled.
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'motion/react';
import { ShieldAlert, LogOut, Clock, Ban } from 'lucide-react';

export const PendingScreen: React.FC = () => {
  const { authStatus, supabaseUser, signOut } = useAuth();

  const isDisabled = authStatus === 'disabled';

  return (
    <div className="flex w-full min-h-[100vh] items-center justify-center relative overflow-hidden bg-slate-50" dir="rtl">

      {/* Background blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-300/10 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-300/10 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">

          {/* Top glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent ${isDisabled ? 'via-red-400' : 'via-amber-400'} to-transparent opacity-70`} />

          {/* Icon */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${
            isDisabled
              ? 'bg-red-50 border-red-100'
              : 'bg-amber-50 border-amber-100'
          }`}>
            {isDisabled
              ? <Ban size={36} className="text-red-500" />
              : <ShieldAlert size={36} className="text-amber-500" />
            }
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {isDisabled ? 'حساب غیرفعال شده' : 'در انتظار تأیید مدیر'}
          </h1>

          {/* Message */}
          <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
            {isDisabled
              ? 'حساب کاربری شما توسط مدیر غیرفعال شده است. برای اطلاعات بیشتر با مدیر سیستم تماس بگیرید.'
              : 'حساب شما با موفقیت ثبت شده است. مدیر سیستم باید حساب شما را فعال کند تا بتوانید وارد پنل شوید.'}
          </p>

          {/* Status indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 text-right ${
            isDisabled
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <Clock size={18} className={isDisabled ? 'text-red-500' : 'text-amber-500'} />
            <div className="flex-1">
              <p className={`text-xs font-bold ${isDisabled ? 'text-red-700' : 'text-amber-700'}`}>
                وضعیت حساب
              </p>
              <p className={`text-sm font-extrabold mt-0.5 ${isDisabled ? 'text-red-800' : 'text-amber-800'}`}>
                {isDisabled ? 'غیرفعال' : 'در انتظار تأیید'}
              </p>
            </div>
          </div>

          {/* Email display */}
          {supabaseUser?.email && (
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-8" dir="ltr">
              <span className="text-sm font-bold text-slate-700 tracking-wide">
                {supabaseUser.email}
              </span>
            </div>
          )}

          {/* Logout button */}
          <button
            id="pending-logout"
            type="button"
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm
              bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900
              border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <LogOut size={16} />
            <span>خروج از حساب</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          نوین‌تک — سامانه هوشمند مدیریت تماس
        </p>
      </motion.div>
    </div>
  );
};

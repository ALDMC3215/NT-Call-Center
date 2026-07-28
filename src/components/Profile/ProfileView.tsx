import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { User, Calendar, Clock, MapPin, Briefcase, ShieldCheck, Lock, RefreshCw } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { supabase } from '../../lib/supabase';

export const ProfileView: React.FC = () => {
  const { profile } = useAppContext();
  const { supabaseUser } = useAuth();
  const { tr, direction } = useLocale();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(tr('لطفاً تمام فیلدها را پر کنید.', 'Please fill all fields.'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(tr('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.', 'New password must be at least 8 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(tr('رمز عبور جدید و تکرار آن مطابقت ندارند.', 'New password and confirmation do not match.'));
      return;
    }
    if (newPassword === currentPassword) {
      toast.error(tr('رمز عبور جدید نمی‌تواند مشابه رمز فعلی باشد.', 'New password cannot be the same as current password.'));
      return;
    }
    if (!supabaseUser?.email) {
      toast.error(tr('ایمیل کاربر یافت نشد.', 'User email not found.'));
      return;
    }

    setIsChangingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: supabaseUser.email,
      password: currentPassword
    });

    if (signInError) {
      setIsChangingPassword(false);
      toast.error(tr('رمز عبور فعلی نامعتبر است.', 'Current password invalid.'));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    setIsChangingPassword(false);

    if (updateError) {
      toast.error(tr('خطایی در تغییر رمز عبور رخ داد. دوباره تلاش کنید.', 'Generic retry error.'));
    } else {
      toast.success(tr('رمز عبور با موفقیت تغییر کرد.', 'Password changed successfully.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (!profile) return null;

  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar flex flex-col items-center pt-4 pb-32 bg-slate-50 dark:bg-[#0f1419] px-4 md:px-8" dir={direction}>
      
      <div className="w-full flex flex-col items-center mb-8 text-center mt-4">
        <div className="w-16 h-16 bg-white dark:bg-[#1c2530] rounded-[1.25rem] flex items-center justify-center text-slate-800 dark:text-[#f3f5f7] mb-4 shadow-sm border border-slate-200 dark:border-[#2b3745]">
           <User size={32} className="text-cyan-600 dark:text-cyan-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-[#f3f5f7] mb-2 tracking-tight">{tr('پروفایل کاربری', 'User Profile')}</h1>
        <p className="text-sm text-slate-600 dark:text-[#8e9aaa] max-w-xl leading-relaxed">{tr('اطلاعات نشست فعلی شما در سامانه ثبت شده است.', 'Your current session information is recorded in the system.')}</p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 auto-rows-max">
        
        {/* Main User Card */}
        <div className="md:col-span-8 bg-white dark:bg-[#1c2530] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-[#2b3745] p-5 sm:p-8 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md hover:border-slate-300 dark:hover:border-[#3b4b5e] transition-all group">
          <div className="flex justify-between items-start">
            <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 dark:bg-[#202b38] flex items-center justify-center text-cyan-600 dark:text-cyan-500 mb-6 border border-slate-100 dark:border-[#2b3745] group-hover:scale-110 transition-transform">
              <User size={32} />
            </div>
            <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-700 dark:text-[#8de0b5] bg-emerald-50 dark:bg-[#163326] py-2 px-4 rounded-xl border border-emerald-100 dark:border-[#2f674b] shadow-sm">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="pt-0.5">{tr('آنلاین', 'Online')}</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-[#f3f5f7] mb-3">{profile.name}</h2>
            <div className="flex items-center gap-2 text-[15px] text-slate-600 dark:text-[#b7c2cf] font-medium bg-slate-50 dark:bg-[#202b38] w-fit px-4 py-2 rounded-xl border border-slate-100 dark:border-[#2b3745]">
               <Briefcase size={18} className="text-slate-500 dark:text-[#8e9aaa]" />
               <span>{tr('اپراتور سیستم', 'System Operator')}</span>
            </div>
          </div>
        </div>

        {/* Date Card */}
        <div className="md:col-span-4 bg-white dark:bg-[#1c2530] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-[#2b3745] p-5 sm:p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-[#3b4b5e] transition-all group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 dark:bg-[#1e1b4b] flex items-center justify-center text-indigo-600 dark:text-[#a5b4fc] mb-4 border border-indigo-100 dark:border-[#312e81] group-hover:scale-110 transition-transform">
             <Calendar size={32} />
          </div>
          <div>
             <span className="text-[13px] font-bold text-slate-500 dark:text-[#8e9aaa] tracking-wide mb-1.5 block">{tr('تاریخ نشست', 'Session Date')}</span>
             <span className="text-2xl font-extrabold text-slate-800 dark:text-[#f3f5f7]" dir="ltr">{profile.date}</span>
          </div>
        </div>

        {/* Shift Card */}
        <div className="md:col-span-4 bg-white dark:bg-[#1c2530] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-[#2b3745] p-5 sm:p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-[#3b4b5e] transition-all group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-amber-50 dark:bg-[#452003] flex items-center justify-center text-amber-600 dark:text-[#fcd34d] mb-4 border border-amber-100 dark:border-[#78350f] group-hover:scale-110 transition-transform">
             <Clock size={32} />
          </div>
          <div>
             <span className="text-[13px] font-bold text-slate-500 dark:text-[#8e9aaa] tracking-wide mb-1.5 block">{tr('شیفت فعال', 'Active Shift')}</span>
             <span className="text-2xl font-extrabold text-slate-800 dark:text-[#f3f5f7]">
               {profile.shift === 'Morning' ? tr('صبح', 'Morning') : profile.shift === 'Evening' ? tr('عصر', 'Evening') : profile.shift.includes('to') ? profile.shift.replace('to', tr('تا', 'to')) : profile.shift}
             </span>
          </div>
        </div>

        {/* Branch Card */}
        <div className="md:col-span-4 bg-white dark:bg-[#1c2530] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-[#2b3745] p-5 sm:p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-[#3b4b5e] transition-all group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-rose-50 dark:bg-[#3d1920] flex items-center justify-center text-rose-600 dark:text-[#ff9aa9] mb-4 border border-rose-100 dark:border-[#632935] group-hover:scale-110 transition-transform">
             <MapPin size={32} />
          </div>
          <div>
             <span className="text-[13px] font-bold text-slate-500 dark:text-[#8e9aaa] tracking-wide mb-1.5 block">{tr('محل استقرار', 'Location')}</span>
             <span className="text-2xl font-extrabold text-slate-800 dark:text-[#f3f5f7]">
               {tr('شعبه', 'Branch')} {profile.branch === 'Pardis' ? tr('پردیس', 'Pardis') : profile.branch === 'Zargari' ? tr('زرگری', 'Zargari') : profile.branch}
             </span>
          </div>
        </div>

        {/* Security / System Info */}
        <div className="md:col-span-4 bg-white dark:bg-[#1c2530] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-[#2b3745] p-5 sm:p-8 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md hover:border-slate-300 dark:hover:border-[#3b4b5e] transition-all group">
           <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 dark:bg-[#202b38] flex items-center justify-center text-slate-600 dark:text-[#b7c2cf] mb-4 border border-slate-200 dark:border-[#344457] group-hover:scale-110 transition-transform">
             <ShieldCheck size={32} />
           </div>
           <div>
             <span className="text-[13px] font-bold text-slate-500 dark:text-[#8e9aaa] tracking-wide mb-1.5 block">{tr('سطح دسترسی', 'Access Level')}</span>
             <span className="text-xl font-extrabold text-slate-800 dark:text-[#f3f5f7]">{tr('محدود (اپراتور)', 'Restricted (Operator)')}</span>
           </div>
        </div>

        {/* Change Password */}
        <div className="md:col-span-12 bg-white dark:bg-[#1c2530] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-[#2b3745] p-5 sm:p-8 shadow-sm flex flex-col hover:shadow-md hover:border-slate-300 dark:hover:border-[#3b4b5e] transition-all">
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-[#f3f5f7] flex items-center gap-2 mb-6">
            <Lock size={20} className="text-rose-500" />
            {tr('تغییر رمز عبور', 'Change Password')}
          </h3>
          <form onSubmit={handleChangePassword} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label className="text-[12px] font-bold text-slate-500 dark:text-[#b7c2cf] mb-2 block">{tr('رمز فعلی', 'Current Password')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] focus:bg-white dark:focus:bg-[#1c2530] text-slate-900 dark:text-[#f3f5f7] rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                  dir="ltr"
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-bold text-slate-500 dark:text-[#b7c2cf] mb-2 block">{tr('رمز جدید', 'New Password')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] focus:bg-white dark:focus:bg-[#1c2530] text-slate-900 dark:text-[#f3f5f7] rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                  dir="ltr"
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-bold text-slate-500 dark:text-[#b7c2cf] mb-2 block">{tr('تکرار رمز جدید', 'Repeat New Password')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium border border-slate-200 dark:border-[#3b4b5e] bg-slate-50 dark:bg-[#171e27] focus:bg-white dark:focus:bg-[#1c2530] text-slate-900 dark:text-[#f3f5f7] rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                  dir="ltr"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="h-12 px-8 w-full md:w-auto bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isChangingPassword ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
              <span>{tr('تغییر رمز عبور', 'Change Password')}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};



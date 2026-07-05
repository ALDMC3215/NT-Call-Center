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
    <div className="w-full h-full overflow-y-auto hide-scrollbar flex flex-col items-center pt-4 pb-32 bg-slate-50 px-4 md:px-8" dir={direction}>
      
      <div className="w-full flex flex-col items-center mb-12 text-center mt-6">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-800 mb-6 shadow-sm border border-slate-200">
           <User size={40} className="text-cyan-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">{tr('پروفایل کاربری', 'User Profile')}</h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">{tr('اطلاعات نشست فعلی شما در سامانه ثبت شده است. این اطلاعات در تمامی فعالیت‌های شما اعمال می‌شود.', 'Your current session information is recorded in the system. This info applies to all your activities.')}</p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 auto-rows-max">
        
        {/* Main User Card */}
        <div className="md:col-span-8 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex justify-between items-start">
            <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-cyan-600 mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
              <User size={32} />
            </div>
            <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-700 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-100 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="pt-0.5">{tr('آنلاین', 'Online')}</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{profile.name}</h2>
            <div className="flex items-center gap-2 text-[15px] text-slate-600 font-medium bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
               <Briefcase size={18} className="text-slate-500" />
               <span>{tr('اپراتور سیستم', 'System Operator')}</span>
            </div>
          </div>
        </div>

        {/* Date Card */}
        <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100 group-hover:scale-110 transition-transform">
             <Calendar size={32} />
          </div>
          <div>
             <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('تاریخ نشست', 'Session Date')}</span>
             <span className="text-2xl font-extrabold text-slate-800" dir="ltr">{profile.date}</span>
          </div>
        </div>

        {/* Shift Card */}
        <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100 group-hover:scale-110 transition-transform">
             <Clock size={32} />
          </div>
          <div>
             <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('شیفت فعال', 'Active Shift')}</span>
             <span className="text-2xl font-extrabold text-slate-800">
               {profile.shift === 'Morning' ? tr('صبح', 'Morning') : profile.shift === 'Evening' ? tr('عصر', 'Evening') : profile.shift.includes('to') ? profile.shift.replace('to', tr('تا', 'to')) : profile.shift}
             </span>
          </div>
        </div>

        {/* Branch Card */}
        <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="w-16 h-16 rounded-[1.25rem] bg-rose-50 flex items-center justify-center text-rose-600 mb-4 border border-rose-100 group-hover:scale-110 transition-transform">
             <MapPin size={32} />
          </div>
          <div>
             <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('محل استقرار', 'Location')}</span>
             <span className="text-2xl font-extrabold text-slate-800">
               {tr('شعبه', 'Branch')} {profile.branch === 'Pardis' ? tr('پردیس', 'Pardis') : profile.branch === 'Zargari' ? tr('زرگری', 'Zargari') : profile.branch}
             </span>
          </div>
        </div>

        {/* Security / System Info */}
        <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md hover:border-slate-300 transition-all group">
           <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-600 mb-4 border border-slate-200 group-hover:scale-110 transition-transform">
             <ShieldCheck size={32} />
           </div>
           <div>
             <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('سطح دسترسی', 'Access Level')}</span>
             <span className="text-xl font-extrabold text-slate-800">{tr('محدود (اپراتور)', 'Restricted (Operator)')}</span>
           </div>
        </div>

        {/* Change Password */}
        <div className="md:col-span-12 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col hover:shadow-md hover:border-slate-300 transition-all">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-6">
            <Lock size={20} className="text-rose-500" />
            {tr('تغییر رمز عبور', 'Change Password')}
          </h3>
          <form onSubmit={handleChangePassword} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label className="text-[12px] font-bold text-slate-500 mb-2 block">{tr('رمز فعلی', 'Current Password')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                  dir="ltr"
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-bold text-slate-500 mb-2 block">{tr('رمز جدید', 'New Password')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                  dir="ltr"
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-bold text-slate-500 mb-2 block">{tr('تکرار رمز جدید', 'Repeat New Password')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-medium border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 rounded-xl outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
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



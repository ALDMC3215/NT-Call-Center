import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { User, Calendar, Clock, MapPin, Briefcase, ShieldCheck } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, layoutMargin } = useAppContext();
  const { tr, direction } = useLocale();

  if (!profile) return null;

  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar flex flex-col items-center pt-8 pb-32 bg-slate-50" dir={direction} style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      
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

      </div>
    </div>
  );
};



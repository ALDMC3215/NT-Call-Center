import React from 'react';
import { Shield } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { BackButton } from '../UI/BackButton';
import { useAppContext } from '../../hooks/useAppContext';

export const AdminView = () => {
  const { tr, direction } = useLocale();
  const { setCurrentView } = useAppContext();
  
  return (
    <div className="flex flex-col gap-3 w-full h-full overflow-y-auto p-4 md:p-8" dir={direction}>
      <div className="w-full max-w-[1000px] flex justify-start mb-4 mx-auto relative z-10">
        <BackButton />
      </div>
      <div className="bg-surface  rounded-xl border border-border p-6 sm:p-10 flex flex-col gap-5 min-h-[400px] flex-1 items-center justify-center max-w-[1000px] mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 border border-brand-200 mb-2">
           <Shield size={28} strokeWidth={2} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{tr('پنل مدیریت', 'Admin panel')}</h2>
        <p className="text-[14px] text-secondary max-w-md text-center">
          {tr('در این بخش به‌زودی امکان مدیریت کاربران و تنظیمات کلی سیستم فراهم خواهد شد. این بخش در حال حاضر در دست توسعه قرار دارد.', 'User management and system-wide controls will be available here. This section is currently under development.')}
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';

interface PageIdentityProps {
  displayedCount: number;
  totalActiveCount: number;
}

export const PageIdentity: React.FC<PageIdentityProps> = ({
  displayedCount,
  totalActiveCount
}) => {
  const { tr } = useLocale();

  const countBadgeText =
    displayedCount === totalActiveCount
      ? tr(`${totalActiveCount} شماره`, `${totalActiveCount} contacts`)
      : tr(
          `${displayedCount} از ${totalActiveCount} شماره`,
          `${displayedCount} of ${totalActiveCount} contacts`
        );

  const fullDescription = tr(
    'مدیریت شماره‌ها، ثبت نتایج تماس و پیگیری مخاطبان',
    'Manage contacts, record call results and follow-ups'
  );

  return (
    <div
      className="flex items-center gap-2.5 shrink-0 select-none"
      title={fullDescription}
    >
      {/* Brand Icon Box */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 shadow-2xs transition-colors">
        <PhoneCall size={18} />
      </div>

      {/* Title & Compact Pill */}
      <div className="flex items-center gap-2">
        <h1 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-[#f3f5f7] tracking-tight whitespace-nowrap">
          {tr('مدیریت تماس‌ها', 'Call Management')}
        </h1>

        <span
          className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1e2734] text-slate-600 dark:text-[#9eb0c3] text-[11px] font-bold border border-slate-200/70 dark:border-[#2b3848] tabular-nums whitespace-nowrap shadow-2xs"
          aria-label={countBadgeText}
        >
          {countBadgeText}
        </span>
      </div>
    </div>
  );
};

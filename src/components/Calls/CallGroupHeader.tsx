import React from 'react';
import { CalendarClock, CheckCircle2, Sparkles, ChevronDown } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';

interface CallGroupHeaderProps {
  groupKey: 'followUp' | 'worked' | 'raw';
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const CallGroupHeader: React.FC<CallGroupHeaderProps> = ({
  groupKey,
  title,
  count,
  isExpanded,
  onToggle
}) => {
  const { tr, direction } = useLocale();

  const getGroupMeta = () => {
    switch (groupKey) {
      case 'followUp':
        return {
          icon: <CalendarClock size={15} className="text-amber-600 dark:text-amber-400" />,
          badgeClasses:
            'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold',
          accentBorder: 'border-r-4 border-r-amber-500'
        };
      case 'worked':
        return {
          icon: <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />,
          badgeClasses:
            'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-300 dark:border-blue-800 font-bold',
          accentBorder: 'border-r-4 border-r-blue-600'
        };
      case 'raw':
      default:
        return {
          icon: <Sparkles size={15} className="text-slate-600 dark:text-slate-400" />,
          badgeClasses:
            'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold',
          accentBorder: 'border-r-4 border-r-slate-400 dark:border-r-slate-500'
        };
    }
  };

  const meta = getGroupMeta();

  return (
    <tr className="border-none select-none">
      <td colSpan={5} className="py-1 px-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#edf2f7] hover:bg-[#e2e8f0] dark:bg-[#182230] dark:hover:bg-[#1e2a3b] border border-slate-300/90 dark:border-[#2b3a4c] transition-all cursor-pointer text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs ${meta.accentBorder}`}
          dir={direction}
        >
          {/* Right Side in RTL: Icon + Title + Count Badge */}
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-white dark:bg-[#1d2733] border border-slate-300/80 dark:border-[#2a3848] shadow-2xs">
              {meta.icon}
            </span>
            <span className="font-bold text-[13px] text-slate-900 dark:text-white">
              {title}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] tabular-nums shadow-2xs ${meta.badgeClasses}`}
            >
              {count} {tr('شماره', 'numbers')}
            </span>
          </div>

          {/* Left Side in RTL: Chevron Indicator */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 text-[11.5px] font-semibold transition-colors">
            <span>{isExpanded ? tr('بستن بخش', 'Collapse') : tr('باز کردن', 'Expand')}</span>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </td>
    </tr>
  );
};

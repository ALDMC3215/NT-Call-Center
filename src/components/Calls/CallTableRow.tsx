import React from 'react';
import { motion } from 'motion/react';
import {
  CalendarClock,
  MessageSquareQuote,
  ShieldBan,
  Trash2,
  Clock
} from 'lucide-react';
import { CallRecord } from '../../types';
import { useLocale } from '../../hooks/useLocale';
import { formatPhoneNumber } from '../../utils/format';
import { TableDropdown } from '../Shared/TableDropdown';
import { CourseAutocomplete } from './CourseAutocomplete';
import { CALL_STATUSES } from '../../constants';

interface CallTableRowProps {
  call: CallRecord;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onFieldChange: (field: keyof CallRecord, value: any) => void;
  onStatusChange: (status: string) => void;
  onOpenNotes: () => void;
  onBlacklist: () => void;
  onDelete: () => void;
}

export const CallTableRow: React.FC<CallTableRowProps> = ({
  call,
  index,
  isSelected,
  onToggleSelect,
  onMouseDown,
  onMouseEnter,
  onFieldChange,
  onStatusChange,
  onOpenNotes,
  onBlacklist,
  onDelete
}) => {
  const { tr, valueLabel } = useLocale();

  const isWorked = !!call.callStatus && CALL_STATUSES.includes(call.callStatus);
  const isFollowUp = !!call.isFollowUp;

  // Semantic Status Options Mapping (WCAG AA Compliant Presentation-Only)
  const getStatusOption = (status: string) => {
    switch (status) {
      case 'علاقه مند':
      case 'علاقه‌مند':
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-[#ecfdf5] dark:bg-[#064e3b]/35 text-[#047857] dark:text-[#34d399] border-[#a7f3d0] dark:border-[#059669]/60 font-bold',
          dotColor: 'bg-[#10b981]'
        };
      case 'پاسخ نداد':
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-[#fffbeb] dark:bg-[#78350f]/35 text-[#92400e] dark:text-[#fbbf24] border-[#fde68a] dark:border-[#b45309]/60 font-bold',
          dotColor: 'bg-[#f59e0b]'
        };
      case 'عدم تمایل':
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-[#fff1f2] dark:bg-[#881337]/35 text-[#be123c] dark:text-[#fb7185] border-[#fecdd3] dark:border-[#e11d48]/60 font-bold',
          dotColor: 'bg-[#f43f5e]'
        };
      case 'مردد':
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-[#eef2ff] dark:bg-[#312e81]/35 text-[#4338ca] dark:text-[#a5b4fc] border-[#c7d2fe] dark:border-[#6366f1]/60 font-bold',
          dotColor: 'bg-[#6366f1]'
        };
      case 'مشاوره حضوری':
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-[#f5f3ff] dark:bg-[#4c1d95]/35 text-[#6d28d9] dark:text-[#c4b5fd] border-[#ddd6fe] dark:border-[#8b5cf6]/60 font-bold',
          dotColor: 'bg-[#8b5cf6]'
        };
      case 'ثبت نام کرد':
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-[#f0fdf4] dark:bg-[#14532d]/35 text-[#15803d] dark:text-[#4ade80] border-[#bbf7d0] dark:border-[#22c55e]/60 font-bold',
          dotColor: 'bg-[#22c55e]'
        };
      default:
        return {
          value: status,
          label: valueLabel(status),
          badgeClass:
            'bg-slate-50 dark:bg-[#18222e] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2b3a4c] font-medium',
          dotColor: 'bg-slate-400'
        };
    }
  };

  // Determine state-based row styling: Neutral default borders, brand on selected/hover
  let rowSurfaceClass =
    'bg-white dark:bg-[#151c24] hover:bg-[#f8fafc] dark:hover:bg-[#1c2736] [&>td]:border-slate-200/90 dark:[&>td]:border-[#263546]';
  let accentBorderClass = 'border-r-slate-200 dark:border-r-[#263546]';

  if (isSelected) {
    rowSurfaceClass =
      'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-50/90 dark:hover:bg-blue-950/40 ring-1 ring-blue-500/40 [&>td]:border-blue-300 dark:[&>td]:border-blue-700';
    accentBorderClass = 'border-r-[4px] border-r-blue-600 dark:border-r-blue-500';
  } else if (isFollowUp) {
    accentBorderClass = 'border-r-[4px] border-r-amber-500 dark:border-r-amber-400';
  } else if (isWorked) {
    accentBorderClass = 'border-r-[4px] border-r-blue-500/80 dark:border-r-blue-400/80';
  }

  const timestamp = call.updatedAt || call.createdAt;
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <motion.tr
      layout
      id={`call-row-${index}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      className={`relative rounded-xl transition-colors duration-150 group shadow-xs ${rowSurfaceClass}`}
    >
      {/* 1. Selection Checkbox */}
      <td
        className={`py-2 px-2 text-center rounded-r-xl border-y border-r border-inherit ${accentBorderClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            aria-label={tr(`انتخاب شماره ${call.phone}`, `Select phone ${call.phone}`)}
            className="w-4 h-4 rounded text-blue-600 border-slate-400 dark:border-slate-500 bg-white dark:bg-[#18222e] focus:ring-blue-500 cursor-pointer transition-colors shadow-2xs"
          />
        </div>
      </td>

      {/* 2. Contact Phone & Name */}
      <td className="py-2 px-2.5 relative whitespace-nowrap border-y border-inherit">
        <div className="flex flex-col items-center justify-center w-full px-1">
          <span
            dir="ltr"
            className="font-bold text-[15px] tracking-wide tabular-nums text-slate-900 dark:text-white select-all font-sans"
          >
            {formatPhoneNumber(call.phone)}
          </span>
          <input
            type="text"
            value={call.fullName || ''}
            onChange={(e) => onFieldChange('fullName', e.target.value)}
            placeholder={tr('نام مخاطب...', 'Contact name...')}
            className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 text-center bg-slate-100/70 dark:bg-[#1b2532] border border-slate-200 dark:border-[#2f3e50] hover:border-slate-300 dark:hover:border-[#3d5066] focus:border-blue-500 focus:bg-white dark:focus:bg-[#17202c] focus:ring-1 focus:ring-blue-500/30 outline-none w-36 py-0.5 px-2 rounded-md mt-1 transition-all placeholder:text-slate-400 dark:placeholder-slate-500"
          />
        </div>
      </td>

      {/* 3. Call Result */}
      <td className="py-2 px-2 relative whitespace-nowrap border-y border-inherit">
        <div className="flex items-center justify-center">
          <TableDropdown
            value={call.callStatus || ''}
            onChange={onStatusChange}
            options={[
              { value: '', label: tr('انتخاب نتیجه...', 'Select Result...'), badgeClass: '', dotColor: '' },
              ...CALL_STATUSES.map(getStatusOption)
            ]}
            placeholder={tr('انتخاب نتیجه...', 'Select Result...')}
          />
        </div>
      </td>

      {/* 4. Interested Course */}
      <td className="py-2 px-2 relative whitespace-nowrap border-y border-inherit">
        <div className="flex items-center justify-center">
          <CourseAutocomplete
            value={call.interestedCourse || ''}
            onChange={(val) => onFieldChange('interestedCourse', val)}
            placeholder={tr('دوره مدنظر...', 'Interested course...')}
          />
        </div>
      </td>

      {/* 5. Actions & Metadata */}
      <td className="py-2 px-2 relative border-y border-l border-inherit rounded-l-xl">
        <div className="flex justify-center items-center gap-1.5">
          {/* Follow-up Button */}
          <button
            type="button"
            onClick={() => onFieldChange('isFollowUp', !call.isFollowUp)}
            title={
              call.isFollowUp
                ? tr('لغو نشانه‌گذاری پیگیری', 'Cancel Follow-up')
                : tr('نشانه‌گذاری پیگیری', 'Needs Follow-up')
            }
            aria-pressed={call.isFollowUp}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-[11.5px] font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
              call.isFollowUp
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs font-bold'
                : 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300'
            }`}
          >
            <CalendarClock size={13} className="shrink-0" />
            <span>
              {call.isFollowUp
                ? tr('لغو پیگیری', 'Cancel')
                : tr('پیگیری', 'Follow-up')}
            </span>
          </button>

          {/* Notes Button */}
          <button
            type="button"
            onClick={onOpenNotes}
            title={
              call.notes
                ? tr('مشاهده و ویرایش یادداشت', 'View/Edit Note')
                : tr('افزودن یادداشت', 'Add Note')
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-[11.5px] font-semibold border relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
              call.notes
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold shadow-2xs'
                : 'bg-slate-50 dark:bg-[#18222e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2b3a4c] hover:bg-slate-100/90 dark:hover:bg-[#202b3a]'
            }`}
          >
            <MessageSquareQuote size={13} className="shrink-0" />
            <span>{tr('یادداشت', 'Notes')}</span>
            {call.notes && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            )}
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-[#2a3848] shrink-0 mx-0.5" />

          {/* Move to Blacklist Button */}
          <button
            type="button"
            onClick={onBlacklist}
            title={tr('انتقال به لیست سیاه', 'Move to Blacklist')}
            aria-label={tr('انتقال شماره به لیست سیاه', 'Move to Blacklist')}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#18222e] text-slate-500 dark:text-[#8e9fae] border border-slate-200 dark:border-[#2b3a4c] hover:bg-amber-50 dark:hover:bg-[#2c2217] hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
          >
            <ShieldBan size={14} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            title={tr('حذف شماره', 'Delete')}
            aria-label={tr('حذف این شماره', 'Delete number')}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#18222e] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#2e171c] hover:border-rose-300 dark:hover:border-[#5a252f] border border-slate-200 dark:border-[#2b3a4c] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>

          {/* Time Display */}
          {formattedTime && (
            <div
              className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums pr-1 shrink-0"
              title={tr('زمان آخرین تغییر', 'Last updated')}
            >
              <Clock size={11} className="shrink-0 text-slate-400 dark:text-[#526275]" />
              <span>{formattedTime}</span>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

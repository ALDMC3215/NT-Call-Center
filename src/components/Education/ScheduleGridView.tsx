import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../hooks/useLocale';
import { CalendarDays, X, Search, Info } from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';
import { COURSES_DATA, FlatCourse } from './ScheduleView';

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
const TIME_SLOTS = [
  { id: '9-12', label: '9 الی 12' },
  { id: '10-13', label: '10 الی 13' },
  { id: '15-18', label: '15 الی 18' },
  { id: '16-20', label: '16 الی 20' },
  { id: '18-21', label: '18 الی 21' }
];

function getCourseSlot(course: FlatCourse): string {
  if (course.note && course.note.includes('۱۰ تا ۱۳')) return '10-13';
  if (course.note && course.note.includes('۱۰ تا ۱۱:۳۰')) return '10-13';

  if (course.time === '۹ تا ۱۲') return '9-12';
  if (course.time === '۱۵ تا ۱۸') return '15-18';
  if (course.time === '۱۶ تا ۲۰') return '16-20';
  if (course.time === '۱۸ تا ۲۱') return '18-21';
  
  return 'unknown';
}

export const ScheduleGridView = ({ isModal, onClose, embedded }: { isModal?: boolean, onClose?: () => void, embedded?: boolean }) => {
  const { direction } = useLocale();
  const { setCurrentView } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return COURSES_DATA;
    const query = searchQuery.toLowerCase();
    return COURSES_DATA.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.teacher && c.teacher.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const gridData = useMemo(() => {
    const data: Record<string, Record<string, FlatCourse[]>> = {};
    DAYS.forEach(day => {
      data[day] = {};
      TIME_SLOTS.forEach(slot => {
        data[day][slot.id] = [];
      });
    });

    filteredCourses.forEach(course => {
      const slotId = getCourseSlot(course);
      if (data[course.day] && data[course.day][slotId]) {
        data[course.day][slotId].push(course);
      }
    });

    return data;
  }, [filteredCourses]);

  const content = (
    <div className={`flex flex-col gap-6 w-full ${embedded ? 'h-full p-4 sm:p-6 lg:p-8 overflow-y-auto' : 'max-w-[1200px] mx-auto p-4'}`}>


      {/* Grid */}
      <div className="bg-white dark:bg-[#1c2530] rounded-2xl border border-slate-200 dark:border-[#2b3745] overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-center border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="py-4 px-3 bg-slate-50 dark:bg-[#171e27] border-b border-l border-slate-200 dark:border-[#2b3745] text-slate-700 dark:text-[#f3f5f7] font-bold text-[13px] w-28 shrink-0">
                  {/* Empty top-right corner */}
                </th>
                {TIME_SLOTS.map((slot, idx) => (
                  <th key={slot.id} className={`py-4 px-4 bg-slate-50 dark:bg-[#171e27] border-b border-slate-200 dark:border-[#2b3745] text-slate-700 dark:text-[#f3f5f7] font-bold text-[13px] ${idx !== TIME_SLOTS.length - 1 ? 'border-l border-slate-200 dark:border-[#2b3745]' : ''}`}>
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              <motion.tbody 
                key={searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="divide-y divide-slate-200 dark:divide-[#2b3745]"
              >
                {DAYS.map(day => (
                  <tr key={day} className="group">
                    <td className="py-4 px-3 bg-slate-50/50 dark:bg-[#171e27]/50 border-l border-slate-200 dark:border-[#2b3745] font-bold text-slate-700 dark:text-[#f3f5f7] text-[13px] whitespace-nowrap">
                      {day}
                    </td>
                    {TIME_SLOTS.map((slot, idx) => {
                      const courses = gridData[day][slot.id];
                      return (
                        <td key={`${day}-${slot.id}`} className={`p-3 align-top transition-colors hover:bg-slate-50/50 dark:hover:bg-[#243140]/50 ${idx !== TIME_SLOTS.length - 1 ? 'border-l border-slate-200 dark:border-[#2b3745]' : ''}`}>
                          <div className="flex flex-col gap-2 min-h-[90px] justify-center">
                            {courses.map((course, cIdx) => (
                              <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: cIdx * 0.05 }}
                                key={`${course.name}-${cIdx}`}
                                className={`flex items-center justify-center text-center p-3 rounded-lg transition-colors border w-full ${
                                  course.status === 'open' 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' 
                                    : 'bg-slate-100 dark:bg-[#243140] text-slate-700 dark:text-[#b7c2cf] border-slate-200 dark:border-[#35465a] hover:bg-slate-200 dark:hover:bg-[#2c3b4c]'
                                }`}
                              >
                                <span className="text-[12px] font-bold leading-snug">
                                  {course.name}
                                </span>
                              </motion.div>
                            ))}
                            {courses.length === 0 && (
                              <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-slate-300 dark:text-[#35465a] text-xs font-bold">-</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col w-full h-full relative" dir={direction}>
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative" dir={direction}>
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-4 sm:px-6 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <CalendarDays size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[17px] sm:text-lg font-extrabold text-slate-800">برنامه کلاس‌ها</h1>
            <p className="text-xs font-medium text-slate-500">جدول زمان‌بندی هفتگی تمامی دوره‌ها</p>
          </div>
        </div>
        {isModal ? (
           <button
             onClick={onClose}
             className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
           >
             <X size={18} strokeWidth={2.5} />
           </button>
        ) : (
          <button
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors shrink-0"
          >
            بازگشت
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-12 hide-scrollbar">
        {content}
      </div>
    </div>
  );
};

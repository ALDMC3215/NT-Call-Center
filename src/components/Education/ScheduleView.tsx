import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../hooks/useLocale';
import { CalendarDays, Info, BookOpen, Clock, MapPin, User, CheckCircle2, CircleDashed, X, Search } from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';

type CourseStatus = 'closed' | 'open';

interface FlatCourse {
  name: string;
  teacher?: string;
  status: CourseStatus;
  note?: string;
  time: string;
  day: string;
  branch: string;
}

const COURSES_DATA: FlatCourse[] = [
  // Branch 2, 9-12, Saturday
  { name: 'PHP 4', teacher: 'کیمیا', status: 'closed', time: '۹ تا ۱۲', day: 'شنبه', branch: 'شعبه ۲' },
  { name: 'UI/UX خصوصی', teacher: 'فرقانی', status: 'closed', time: '۹ تا ۱۲', day: 'شنبه', branch: 'شعبه ۲' },
  { name: 'شی‌گرایی ۴', status: 'closed', time: '۹ تا ۱۲', day: 'شنبه', branch: 'شعبه ۲' },
  { name: 'زبان مهارتی نوجوان', status: 'open', time: '۹ تا ۱۲', day: 'شنبه', branch: 'شعبه ۲' },
  // Branch 2, 9-12, Sunday
  { name: 'ابزار خصوصی', teacher: 'فرقانی', status: 'closed', time: '۹ تا ۱۲', day: 'یکشنبه', branch: 'شعبه ۲' },
  // Branch 2, 9-12, Monday
  { name: 'هک و امنیت شبکه ۱', teacher: 'جلیلیان', status: 'closed', time: '۹ تا ۱۲', day: 'دوشنبه', branch: 'شعبه ۲' },
  { name: 'UI/UX خصوصی', teacher: 'فرقانی', status: 'closed', time: '۹ تا ۱۲', day: 'دوشنبه', branch: 'شعبه ۲' },
  { name: 'PHP 5', status: 'open', time: '۹ تا ۱۲', day: 'دوشنبه', branch: 'شعبه ۲' },
  { name: 'RNN G3', status: 'open', time: '۹ تا ۱۲', day: 'دوشنبه', branch: 'شعبه ۲' },
  // Branch 2, 9-12, Wednesday
  { name: 'زبان مهارتی نوجوان', status: 'open', time: '۹ تا ۱۲', day: 'چهارشنبه', branch: 'شعبه ۲' },
  // Branch 2, 9-12, Thursday
  { name: 'هک و امنیت شبکه ۱', teacher: 'جلیلیان', status: 'closed', time: '۹ تا ۱۲', day: 'پنجشنبه', branch: 'شعبه ۲' },
  { name: 'اسکرچ گروه ۳', note: 'کودکان ۸ سال به پایین', status: 'open', time: '۹ تا ۱۲', day: 'پنجشنبه', branch: 'شعبه ۲' },
  { name: 'زبان تخصصی کامپیوتر بزرگسال', status: 'open', time: '۹ تا ۱۲', day: 'پنجشنبه', branch: 'شعبه ۲' },
  { name: 'پایتون ۲۸', status: 'open', time: '۹ تا ۱۲', day: 'پنجشنبه', branch: 'شعبه ۲' },

  // Branch 2, 15-18, Saturday
  { name: 'برنامه‌نویسی موبایل ۹', teacher: 'دکتر زارع', status: 'closed', time: '۱۵ تا ۱۸', day: 'شنبه', branch: 'شعبه ۲' },
  { name: 'پایتون نوجوان ۹', status: 'closed', time: '۱۵ تا ۱۸', day: 'شنبه', branch: 'شعبه ۲' },
  // Branch 2, 15-18, Sunday
  { name: 'نتورک پلاس ۷', teacher: 'شایقی‌فرد', status: 'closed', time: '۱۵ تا ۱۸', day: 'یکشنبه', branch: 'شعبه ۲' },
  { name: 'بازی‌سازی نوجوان گروه ۶', status: 'open', time: '۱۵ تا ۱۸', day: 'یکشنبه', branch: 'شعبه ۲' },
  { name: 'پایتون نوجوان گروه ۱۰', status: 'open', time: '۱۵ تا ۱۸', day: 'یکشنبه', branch: 'شعبه ۲' },
  { name: 'UI/UX گروه ۷', status: 'open', time: '۱۵ تا ۱۸', day: 'یکشنبه', branch: 'شعبه ۲' },
  // Branch 2, 15-18, Monday
  { name: 'علم داده ۷', teacher: 'دکتر زارع', status: 'closed', time: '۱۵ تا ۱۸', day: 'دوشنبه', branch: 'شعبه ۲' },
  { name: 'Node.js', status: 'closed', time: '۱۵ تا ۱۸', day: 'دوشنبه', branch: 'شعبه ۲' },
  { name: 'علم داده ۹', teacher: 'دکتر زارع', status: 'open', time: '۱۵ تا ۱۸', day: 'دوشنبه', branch: 'شعبه ۲' },
  // Branch 2, 15-18, Tuesday
  { name: 'ICDL گروه ۹', teacher: 'رابعینیا', status: 'closed', time: '۱۵ تا ۱۸', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'ابزار هوش مصنوعی ۱۴', teacher: 'فرقانی', status: 'closed', time: '۱۵ تا ۱۸', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'پایگاه داده ۸', teacher: 'کیمیا', status: 'closed', time: '۱۵ تا ۱۸', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'علم داده و یادگیری ماشین گروه ۸', status: 'closed', time: '۱۵ تا ۱۸', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'زبان تخصصی کامپیوتر نوجوان', status: 'open', time: '۱۵ تا ۱۸', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'ICDL گروه ۱۰', teacher: 'رابعینیا', status: 'open', time: '۱۵ تا ۱۸', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  // Branch 2, 15-18, Wednesday
  { name: 'یادگیری عمیق ۵', teacher: 'دکتر زارع', status: 'closed', time: '۱۵ تا ۱۸', day: 'چهارشنبه', branch: 'شعبه ۲' },
  { name: 'وردپرس ۶ نوجوان', status: 'open', time: '۱۵ تا ۱۸', day: 'چهارشنبه', branch: 'شعبه ۲' },
  { name: 'پایگاه داده ۹', status: 'open', time: '۱۵ تا ۱۸', day: 'چهارشنبه', branch: 'شعبه ۲' },
  // Branch 2, 15-18, Thursday
  { name: 'React & Next.js', status: 'closed', time: '۱۵ تا ۱۸', day: 'پنجشنبه', branch: 'شعبه ۲' },

  // Branch 2, 18-21, Saturday
  { name: 'برنامه‌نویسی موبایل ۱۰', status: 'closed', time: '۱۸ تا ۲۱', day: 'شنبه', branch: 'شعبه ۲' },
  { name: 'ICDL گروه ۱۰', teacher: 'رابعینیا', status: 'closed', time: '۱۸ تا ۲۱', day: 'شنبه', branch: 'شعبه ۲' },
  { name: 'فتوشاپ گروه ۳', status: 'open', time: '۱۸ تا ۲۱', day: 'شنبه', branch: 'شعبه ۲' },
  // Branch 2, 18-21, Sunday
  { name: 'پک فرانت ۱۰', teacher: 'روبی', status: 'closed', time: '۱۸ تا ۲۱', day: 'یکشنبه', branch: 'شعبه ۲' },
  { name: 'وردپرس ۵', teacher: 'یزدانیان', status: 'closed', time: '۱۸ تا ۲۱', day: 'یکشنبه', branch: 'شعبه ۲' },
  { name: 'ویژن ۵', teacher: 'دکتر زارع', status: 'open', time: '۱۸ تا ۲۱', day: 'یکشنبه', branch: 'شعبه ۲' },
  { name: 'DRF-Django', status: 'open', time: '۱۸ تا ۲۱', day: 'یکشنبه', branch: 'شعبه ۲' },
  // Branch 2, 18-21, Monday
  { name: 'UI/UX گروه ۶', status: 'closed', time: '۱۸ تا ۲۱', day: 'دوشنبه', branch: 'شعبه ۲' },
  // Branch 2, 18-21, Tuesday
  { name: 'پک فرانت ۱۰', teacher: 'روبی', status: 'closed', time: '۱۸ تا ۲۱', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'پایتون ۲۲', teacher: 'دکتر زارع', status: 'closed', time: '۱۸ تا ۲۱', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'ابزار هوش مصنوعی گروه ۱۵', status: 'open', time: '۱۸ تا ۲۱', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  { name: 'برنامه‌نویسی موبایل ۱۱', status: 'open', time: '۱۸ تا ۲۱', day: 'سه‌شنبه', branch: 'شعبه ۲' },
  // Branch 2, 18-21, Wednesday
  { name: 'پایتون ۲۴', teacher: 'سالار', status: 'closed', time: '۱۸ تا ۲۱', day: 'چهارشنبه', branch: 'شعبه ۲' },
  { name: 'ICDL گروه ۱۰', teacher: 'رابعینیا', status: 'closed', time: '۱۸ تا ۲۱', day: 'چهارشنبه', branch: 'شعبه ۲' },
  { name: 'ابزار هوش مصنوعی ۱۲', teacher: 'فرقانی', status: 'closed', time: '۱۸ تا ۲۱', day: 'چهارشنبه', branch: 'شعبه ۲' },

  // Branch 1, 16-20, Saturday
  { name: 'نتورک پلاس ۸', status: 'open', time: '۱۶ تا ۲۰', day: 'شنبه', branch: 'شعبه ۱' },
  { name: 'پایتون ۲۷', status: 'open', time: '۱۶ تا ۲۰', day: 'شنبه', branch: 'شعبه ۱' },
  // Branch 1, 16-20, Sunday
  { name: 'پایتون ۲۵', status: 'closed', time: '۱۶ تا ۲۰', day: 'یکشنبه', branch: 'شعبه ۱' },
  // Branch 1, 16-20, Monday
  { name: 'پک فرانت ۹', status: 'open', time: '۱۶ تا ۲۰', day: 'دوشنبه', branch: 'شعبه ۱' },
  { name: 'پایتون ۲۶', status: 'open', time: '۱۶ تا ۲۰', day: 'دوشنبه', branch: 'شعبه ۱' },
  // Branch 1, 16-20, Tuesday
  { name: 'پایتون نوجوان گروه ۸', note: '۱۶ تا ۱۹', status: 'closed', time: '۱۶ تا ۲۰', day: 'سه‌شنبه', branch: 'شعبه ۱' },
  // Branch 1, 16-20, Wednesday
  { name: 'یادگیری عمیق گروه ۶', status: 'open', time: '۱۶ تا ۲۰', day: 'چهارشنبه', branch: 'شعبه ۱' },
];

export const ScheduleView = ({ isModal, onClose }: { isModal?: boolean, onClose?: () => void }) => {
  const { direction } = useLocale();
  const { setCurrentView } = useAppContext();
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [sortBy, setSortBy] = useState<'branch' | 'day' | 'time'>('branch');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter courses based on active tab and sort them logically (by Branch -> Day -> Time)
  const filteredCourses = useMemo(() => {
    return COURSES_DATA
      .filter(c => c.status === activeTab)
      .filter(c => searchQuery === '' || c.name.includes(searchQuery))
      .sort((a, b) => {
        if (sortBy === 'branch') {
          if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
          if (a.day !== b.day) return a.day.localeCompare(b.day);
          return a.time.localeCompare(b.time);
        }
        if (sortBy === 'day') {
          const dayOrder: Record<string, number> = { 'شنبه': 1, 'یکشنبه': 2, 'دوشنبه': 3, 'سه‌شنبه': 4, 'چهارشنبه': 5, 'پنجشنبه': 6, 'جمعه': 7 };
          const dayA = dayOrder[a.day] || 99;
          const dayB = dayOrder[b.day] || 99;
          if (dayA !== dayB) return dayA - dayB;
          if (a.time !== b.time) return a.time.localeCompare(b.time);
          return a.branch.localeCompare(b.branch);
        }
        if (sortBy === 'time') {
          if (a.time !== b.time) return a.time.localeCompare(b.time);
          if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
          return a.day.localeCompare(b.day);
        }
        return 0;
      });
  }, [activeTab, sortBy]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#f8fafc] overflow-hidden" dir={direction}>
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarDays size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800">برنامه کلاسی</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">جدول تمامی سکشن‌ها به صورت فشرده</p>
          </div>
        </div>
        
        {isModal ? (
           <button
             onClick={onClose}
             className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
             title="بستن"
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
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
          
          {/* Summary Alert */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <Info size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  در مجموع <span className="font-bold text-slate-900">۵۵ سکشن</span> ثبت شده است: 
                  <span className="font-bold text-slate-900 mx-1">۳۰ سکشن درحال برگزاری</span> 
                  و <span className="font-bold text-blue-600 mx-1">۲۵ سکشن باز برای ثبت‌نام</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Switcher & Search Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200/50 self-center sm:self-start">
              <button
              onClick={() => setActiveTab('open')}
              className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 flex-1 sm:flex-none ${
                activeTab === 'open'
                  ? 'text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {activeTab === 'open' && (
                <motion.div
                  layoutId="activeStatusTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-200/60"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <CircleDashed size={18} strokeWidth={2.5} className="relative z-10" />
              <span className="relative z-10">در حال ثبت‌نام</span>
              <span className="relative z-10 mr-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">۲۵</span>
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 flex-1 sm:flex-none ${
                activeTab === 'closed'
                  ? 'text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {activeTab === 'closed' && (
                <motion.div
                  layoutId="activeStatusTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-slate-200/60"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <CheckCircle2 size={18} strokeWidth={2.5} className="relative z-10" />
              <span className="relative z-10">در حال برگزاری</span>
              <span className="relative z-10 mr-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">۳۰</span>
            </button>
            </div>
            
            <div className="relative w-full sm:w-72 self-center sm:self-end">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="جستجوی نام دوره..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-4 pr-9 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                dir="rtl"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab + sortBy}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="overflow-x-auto hide-scrollbar"
              >
                <table className="w-full text-right min-w-[800px] border-collapse">
                  <thead className={`border-b ${activeTab === 'open' ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                    <tr>
                      <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700">نام دوره</th>
                      <th 
                        onClick={() => setSortBy('branch')} 
                        className={`py-4 px-6 text-[13px] font-extrabold cursor-pointer transition-colors ${sortBy === 'branch' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'}`}
                      >
                        شعبه {sortBy === 'branch' && '↓'}
                      </th>
                      <th 
                        onClick={() => setSortBy('day')} 
                        className={`py-4 px-6 text-[13px] font-extrabold cursor-pointer transition-colors ${sortBy === 'day' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'}`}
                      >
                        روز {sortBy === 'day' && '↓'}
                      </th>
                      <th 
                        onClick={() => setSortBy('time')} 
                        className={`py-4 px-6 text-[13px] font-extrabold cursor-pointer transition-colors ${sortBy === 'time' ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'}`}
                      >
                        بازه زمانی {sortBy === 'time' && '↓'}
                      </th>
                      <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700">استاد</th>
                      <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.map((course, idx) => (
                      <tr 
                        key={`${course.name}-${course.day}-${course.time}-${idx}`}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} strokeWidth={2} className={activeTab === 'open' ? 'text-blue-500' : 'text-slate-400'} />
                            <span className={`text-[13px] font-bold ${activeTab === 'open' ? 'text-blue-800' : 'text-slate-800'}`}>
                              {course.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="text-[13px] font-semibold">{course.branch}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-[13px] font-bold text-slate-700">
                          {course.day}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-[13px] font-semibold" dir="ltr">{course.time}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {course.teacher ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <User size={14} className="text-slate-400" />
                              <span className="text-[13px] font-semibold">{course.teacher}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[12px] font-medium">-</span>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          {course.note ? (
                            <span className="inline-flex bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {course.note}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[12px] font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </AnimatePresence>
            
            {/* Empty State */}
            {filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <CalendarDays size={28} className="text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-600 mb-1">کلاسی یافت نشد</h3>
                <p className="text-xs text-slate-400">در این وضعیت هیچ کلاسی وجود ندارد.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

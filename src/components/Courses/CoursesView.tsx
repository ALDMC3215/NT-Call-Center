import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COURSE_CATEGORIES, CourseItem } from '../../data/courses';
import * as Icons from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { applyCertificateFee } from '../../utils/format';
import { CourseDetailsModal } from './CourseDetailsModal';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { customToast as toast } from '../UI/toast';
import { useAppContext } from '../../hooks/useAppContext';

const getIcon = (iconName: string) => {
  const Icon = (Icons as any)[iconName];
  if (!Icon) return Icons.Book; // default icon
  return Icon;
};


// Key for storing dynamic data in localStorage
const DYNAMIC_DATA_KEY = 'NOVINTECH_COURSE_DYNAMIC_DATA';

const formatTimePart = (timeStr: string) => {
  if (/^[\d۰-۹]{3,4}$/.test(timeStr)) {
    return timeStr.slice(0, -2) + ':' + timeStr.slice(-2);
  }
  return timeStr;
};

const parseSchedule = (schedule?: string) => {
  if (!schedule) return [];
  if (schedule === "گروه یا شعبه پیش‌فرضی ثبت نشده است." || !schedule.match(/[\d۰-۹]/)) {
    return [{ type: 'text', value: schedule }];
  }
  
  const rawParts = schedule.split(/\s+/);
  const mergedParts: string[] = [];
  
  for (let i = 0; i < rawParts.length; i++) {
     const p = rawParts[i];
     
     if ((p === 'الی' || p === 'تا' || p === '-') && i > 0 && i < rawParts.length - 1) {
         if (mergedParts.length > 0 && mergedParts[mergedParts.length - 1].match(/[\d۰-۹]/) && rawParts[i+1].match(/[\d۰-۹]/)) {
             const prev = mergedParts.pop();
             mergedParts.push(`${prev} الی ${formatTimePart(rawParts[i+1])}`);
             i++; 
             continue;
         }
     }
     
     if ((p === 'گروه' || p === 'کد' || p === 'سکشن' || p === 'شعبه') && i < rawParts.length - 1) {
         mergedParts.push(`${p} ${rawParts[i+1]}`);
         i++;
         continue;
     }

     if (p.match(/^[\d۰-۹]+(:[\d۰-۹]+)?$/) && i < rawParts.length - 1 && rawParts[i+1].match(/^[\d۰-۹]+(:[\d۰-۹]+)?$/)) {
         mergedParts.push(`${formatTimePart(p)} الی ${formatTimePart(rawParts[i+1])}`);
         i++;
         continue;
     }

     mergedParts.push(p);
  }

  const badges: { type: string, value: string }[] = [];
  const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سهشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  
  let currentText = '';
  
  mergedParts.forEach(part => {
    const cleanPart = part.replace(/‌/g, '').replace(/\s/g, ''); // handle zwnj and 'سه شنبه'
    if (days.includes(cleanPart) || days.includes(part)) {
      if (currentText) { badges.push({ type: 'text', value: currentText.trim() }); currentText = ''; }
      badges.push({ type: 'day', value: part });
    } else if (part.startsWith('گروه') || part.startsWith('کد') || part.startsWith('سکشن') || part.startsWith('گر')) {
      if (currentText) { badges.push({ type: 'text', value: currentText.trim() }); currentText = ''; }
      badges.push({ type: 'group_label', value: part });
    } else if (part.startsWith('شعبه')) {
      if (currentText) { badges.push({ type: 'text', value: currentText.trim() }); currentText = ''; }
      badges.push({ type: 'branch', value: part });
    } else if (part.match(/[\d۰-۹]/) && (part.includes('الی') || part.includes('تا') || part.includes('-') || part.match(/^[\d۰-۹]+$/) || part.match(/^[\d۰-۹]+:[\d۰-۹]+$/))) {
      if (currentText) { badges.push({ type: 'text', value: currentText.trim() }); currentText = ''; }
      badges.push({ type: 'time', value: part });
    } else {
      currentText += part + ' ';
    }
  });
  
  if (currentText) {
    badges.push({ type: 'text', value: currentText.trim() });
  }
  
  return badges;
};

export const CoursesView = ({ externalSearchQuery = '', isModal, onClose, embedded }: { externalSearchQuery?: string, isModal?: boolean, onClose?: () => void, embedded?: boolean }) => {
  const { setCurrentView } = useAppContext();
  const { tr, direction } = useLocale();
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const activeSearchQuery = externalSearchQuery || internalSearchQuery;

  const fuzzyMatch = (searchStr: string, text: string) => {
    if (!searchStr) return true;
    const normalize = (str: string) => (str || '').toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/آ|أ|إ/g, 'ا');
    const nSearch = normalize(searchStr);
    const nText = normalize(text);
    
    if (nText.replace(/\s+/g, '').includes(nSearch.replace(/\s+/g, ''))) return true;
    
    const searchWords = nSearch.split(/\s+/).filter(Boolean);
    if (searchWords.length > 0 && searchWords.every(word => nText.includes(word))) return true;

    return false;
  };

  const handleUpdateAllCourses = async () => {
    setIsUpdating(true);
    toast.info(tr('در حال دریافت اطلاعات دوره‌ها از سرور...', 'Fetching latest data from server...'));
    
    let newDynamicData = { ...dynamicData };
    let successCount = 0;
    
    const uniqueCourses = Array.from(new Set(allSubcategories.flatMap(s => s.courses).filter(c => c.url)));
    
    for (const course of uniqueCourses) {
      if (course.url) {
        try {
           const data = await fetchCourseDataDynamic(course.url);
           if (data) {
             newDynamicData[course.url] = data;
             successCount++;
           }
        } catch (e) {
          // ignore error for individual course
        }
      }
    }
    
    setDynamicData(newDynamicData);
    localStorage.setItem(DYNAMIC_DATA_KEY, JSON.stringify(newDynamicData));
    setIsUpdating(false);
    if (successCount > 0) {
      toast.success(tr(`اطلاعات ${successCount} دوره با موفقیت بروزرسانی شد.`, `Successfully updated ${successCount} courses.`));
    } else {
      toast.error(tr('بروزرسانی اطلاعات با خطا مواجه شد.', 'Failed to update data.'));
    }
  };

  // Load cached dynamic data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(DYNAMIC_DATA_KEY);
      if (cached) {
        setDynamicData(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Failed to load dynamic data from localStorage", e);
    }
  }, []);

  // Flatten and merge static + dynamic data
  const allSubcategories = COURSE_CATEGORIES.flatMap(category => 
    category.subcategories.map(sub => ({
      ...sub,
      categoryTitle: category.title,
      categoryIconName: category.iconName,
      courses: sub.courses.map(course => {
        // Merge dynamic data if available
        if (course.url && dynamicData[course.url]) {
          const dyn = { ...dynamicData[course.url] };
          // Do not overwrite local schedules, we want to keep the "open sections" manually synced
          delete dyn.schedules;
          // Do not overwrite price if dynamic price is empty
          if (!dyn.price) delete dyn.price;
          if (!dyn.originalPrice) delete dyn.originalPrice;
          
          return { ...course, ...dyn };
        }
        return course;
      })
    }))
  );

  const filteredSubcategories = allSubcategories.map(sub => ({
    ...sub,
    courses: sub.courses.filter(course => course.isActive !== false && (
      fuzzyMatch(activeSearchQuery, course.title) || 
      fuzzyMatch(activeSearchQuery, course.description) ||
      (course.schedules && course.schedules.some((s: string) => fuzzyMatch(activeSearchQuery, s)))
    ))
  })).filter(sub => sub.courses.length > 0);

  const filteredCourses = filteredSubcategories.flatMap(sub => 
    sub.courses.map(course => ({
      ...course,
      price: applyCertificateFee(course.price),
      originalPrice: applyCertificateFee(course.originalPrice),
      subcategoryTitle: sub.title,
      categoryIconName: sub.categoryIconName || 'Folder'
    }))
  ).map((c, i) => ({ ...c, _origIdx: i })).sort((a, b) => {
    const aHasSchedule = a.schedules && a.schedules.length > 0;
    const bHasSchedule = b.schedules && b.schedules.length > 0;
    if (aHasSchedule && !bHasSchedule) return -1;
    if (!aHasSchedule && bHasSchedule) return 1;
    return a._origIdx - b._origIdx;
  });

  // If search changes, clear selection to show results in grid if needed,
  // or just stay in the category if still valid.
  useEffect(() => {
    if (selectedCategoryId && activeSearchQuery) {
      const stillExists = filteredSubcategories.find(s => s.id === selectedCategoryId);
      if (!stillExists) {
        setSelectedCategoryId(null);
      }
    }
  }, [activeSearchQuery, filteredSubcategories, selectedCategoryId]);

  // Theme colors mapping
  const categoryColors = ['#aadb9f', '#88c4a5', '#7089a9'];

  return (
    <div className={`w-full h-full flex flex-col ${isModal ? 'bg-slate-50 dark:bg-[#0f1419]' : 'bg-transparent'} relative z-10`} dir={direction}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 lg:p-8 bg-white dark:bg-[#171e27] border-b border-slate-200 dark:border-[#2b3745] shrink-0 relative z-20 shadow-sm">
        <div className="flex flex-col gap-1 order-1 md:order-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-[#162744] flex items-center justify-center text-brand-600 dark:text-[#81a5ff] shadow-sm border border-brand-100 dark:border-[#223d6a]">
              <Icons.BookOpen size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-[#f3f5f7] tracking-tight">
              {tr('دوره‌های آموزشی', 'Courses Prices')}
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-[#8e9aaa] mr-14">
            {tr('مشاهده لیست و قیمت به‌روز دوره‌های آموزشی', 'View updated list and prices of courses')}
          </p>
        </div>

        <div className="flex-1 w-full max-w-md order-3 md:order-none relative group">
            {(!externalSearchQuery) && (
              <input 
                type="text"
                placeholder={tr('جستجوی دوره، دسته‌بندی یا سکشن...', 'Search course, category or section...')}
                value={internalSearchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
                className="w-full h-10 bg-slate-50 dark:bg-[#18222d] border border-slate-200 dark:border-[#344457] rounded-xl pr-10 pl-10 text-[13px] font-medium text-slate-900 dark:text-[#f3f5f7] placeholder:text-slate-500 dark:placeholder:text-[#7f8da0] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-sm"
              />
            )}
            {(!externalSearchQuery) && (
              <Icons.Search size={18} className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500/60 group-focus-within:text-brand-500 transition-colors" />
            )}
            
            {internalSearchQuery && !externalSearchQuery && (
              <button 
                onClick={() => setInternalSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <Icons.X size={14} strokeWidth={2.5} />
              </button>
            )}
        </div>

        {!embedded && (
          <div className="order-2 md:order-none shrink-0">
            {isModal ? (
               <button
                 onClick={onClose}
                 className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#202b38] flex items-center justify-center text-slate-500 dark:text-[#8e9aaa] hover:bg-slate-200 dark:hover:bg-[#2c3b4d] hover:text-slate-900 dark:hover:text-[#f3f5f7] transition-colors"
                 title="بستن"
               >
                 <Icons.X size={18} strokeWidth={2.5} />
               </button>
            ) : (
               <button
                 onClick={() => setCurrentView('home')}
                 className="px-4 py-2 bg-slate-100 dark:bg-[#202b38] hover:bg-slate-200 dark:hover:bg-[#2c3b4d] text-slate-700 dark:text-[#e8edf3] text-sm font-bold rounded-lg transition-colors"
               >
                 بازگشت
               </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative z-10 p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="all-courses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 w-full"
          >
            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-20 text-center">
                <Icons.Layers size={48} className="text-slate-400 mb-4" strokeWidth={1.5} />
                <p className="text-slate-500 font-medium">{tr('هیچ دوره‌ای با این عنوان یافت نشد.', 'No courses found.')}</p>
              </div>
            ) : (
              <div className="flex flex-col w-full pb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 px-4 gap-4">
                  <div className="text-[12px] font-medium text-slate-500 flex items-center gap-2">
                    <Icons.Info size={14} className="text-brand-500" />
                    <span>{tr('اطلاعات دوره‌ها مستقیماً از سایت نوین تک به‌روزرسانی می‌شود.', 'Course data is synced directly from Novin Tech.')}</span>
                  </div>
                  <button 
                    onClick={handleUpdateAllCourses}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 dark:text-[#81a5ff] hover:bg-brand-500/20 dark:hover:bg-brand-500/30 hover:text-brand-600 dark:hover:text-[#a0bcff] rounded-xl font-medium text-[12px] transition-colors border border-brand-500/20 dark:border-brand-500/30 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <Icons.RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />
                    <span>{isUpdating ? tr('در حال بروزرسانی...', 'Updating...') : tr('بروزرسانی اطلاعات دوره‌ها', 'Update Course Data')}</span>
                  </button>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full pb-8 items-stretch">
                  {filteredCourses.map((course, idx) => {
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedCourse(course)}
                        className="flex flex-col h-full p-4 bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-2xl relative overflow-hidden group hover:border-brand-500/30 dark:hover:border-brand-500/40 hover:shadow-md transition-all duration-300 min-h-[72px] cursor-pointer"
                      >
                        {/* Left ticket notched decor */}
                        <div className="absolute top-[36px] -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-[#f8fafc] dark:bg-[#0f1419] border-r border-slate-200 dark:border-[#2b3745] z-20"></div>
                        {/* Right ticket notched decor */}
                        <div className="absolute top-[36px] -translate-y-1/2 -right-2.5 w-5 h-5 rounded-full bg-[#f8fafc] dark:bg-[#0f1419] border-l border-slate-200 dark:border-[#2b3745] z-20"></div>

                        <div className="flex items-center justify-between w-full relative z-10">
                          <div className="flex flex-col gap-1 pr-3 pl-3 flex-1 min-w-0">
                            <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-[#f3f5f7] transition-colors truncate tracking-tight" title={course.title}>
                              {course.title}
                            </h4>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-[#8e9aaa] truncate">
                              {course.subcategoryTitle}
                            </span>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-3 pr-3 border-r border-dashed border-slate-200 dark:border-[#344457]">
                            {course.originalPrice && course.originalPrice !== course.price && (
                              <span className="text-[10px] font-medium text-slate-400 dark:text-[#8e9aaa] line-through tracking-tight">{course.originalPrice}</span>
                            )}
                            <span className="text-[13px] font-extrabold text-brand-600 dark:text-[#81a5ff] tracking-tight">{course.price || tr('نامشخص', 'Unknown')}</span>
                          </div>
                        </div>

                        {/* Schedules / Active Sections */}
                        {course.schedules && course.schedules.length > 0 && (
                          <div className="w-full mt-auto pt-3 border-t border-dashed border-slate-200 dark:border-[#344457] flex flex-col gap-1.5 relative z-10">
                             {course.schedules.map((sched: string, sIdx: number) => {
                                const badges = parseSchedule(sched);
                                return (
                                  <div key={sIdx} className="flex flex-wrap items-center gap-1.5">
                                    {badges.map((b, i) => (
                                      <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                        b.type === 'day' ? 'bg-indigo-50 dark:bg-[#1e1b4b] text-indigo-600 dark:text-[#a5b4fc]' :
                                        b.type === 'time' ? 'bg-emerald-50 dark:bg-[#064e3b] text-emerald-600 dark:text-[#6ee7b7]' :
                                        b.type === 'group_label' ? 'bg-orange-50 dark:bg-[#451a03] text-orange-600 dark:text-[#fdba74]' :
                                        b.type === 'branch' ? 'bg-rose-50 dark:bg-[#4c0519] text-rose-600 dark:text-[#fda4af]' :
                                        'bg-slate-50 dark:bg-[#202b38] text-slate-600 dark:text-[#b7c2cf]'
                                      }`}>
                                        {b.value}
                                      </span>
                                    ))}
                                  </div>
                                )
                             })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Course Details Modal */}
      <CourseDetailsModal 
        course={selectedCourse} 
        onClose={() => setSelectedCourse(null)} 
      />
    </div>
  );
};

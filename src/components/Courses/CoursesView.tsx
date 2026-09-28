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
import { SpotlightCard } from '../ReactBits/SpotlightCard';

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
      {/* Compact SectionToolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 bg-white/90 dark:bg-[#151c24]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#24303e] shrink-0 min-h-[58px] sm:min-h-[64px]">
        {/* Right side in RTL: Title & short description */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-800/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 shadow-2xs">
            <Icons.BookOpen size={16} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14.5px] sm:text-[15px] font-bold text-slate-800 dark:text-[#f3f5f7]">
              {tr('دوره‌های آموزشی', 'Courses')}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1e2734] text-slate-600 dark:text-[#9eb0c3] text-[11px] font-bold border border-slate-200/70 dark:border-[#2b3848] tabular-nums">
              {filteredCourses.length} {tr('دوره', 'courses')}
            </span>
          </div>
        </div>

        {/* Left side in RTL: Course Search & Update Action */}
        <div className="flex items-center gap-2">
          {!externalSearchQuery && (
            <div className="relative w-full sm:w-60 md:w-72">
              <input
                type="text"
                placeholder={tr('جستجوی دوره یا سکشن...', 'Search course or section...')}
                value={internalSearchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
                className="w-full h-[36px] bg-slate-50 dark:bg-[#18222d] border border-slate-200 dark:border-[#2e3e50] rounded-xl pr-8 pl-8 text-[12px] font-medium text-slate-800 dark:text-[#f3f5f7] placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-[#1b2532] focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs"
              />
              <Icons.Search
                size={14}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400"
              />
              {internalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setInternalSearchQuery('')}
                  aria-label={tr('پاک کردن جستجو', 'Clear search')}
                  className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <Icons.X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Update Course Data Button */}
          <button
            type="button"
            onClick={handleUpdateAllCourses}
            disabled={isUpdating}
            className="h-[36px] px-3 rounded-xl bg-slate-50 dark:bg-[#18222e] border border-slate-200 dark:border-[#2e3e50] hover:bg-slate-100 dark:hover:bg-[#202c3b] text-slate-700 dark:text-[#c4d0df] hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-[11.5px] font-semibold whitespace-nowrap shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={tr('بروزرسانی داده‌های دوره‌ها', 'Update course data')}
          >
            <Icons.RefreshCw size={13} className={isUpdating ? 'animate-spin text-brand-500' : 'text-slate-400'} />
            <span className="hidden sm:inline">
              {isUpdating ? tr('در حال بروزرسانی...', 'Updating...') : tr('بروزرسانی', 'Update')}
            </span>
          </button>

          {!embedded && !isModal && (
            <button
              onClick={() => setCurrentView('home')}
              className="h-[36px] px-3 bg-slate-100 dark:bg-[#202b38] hover:bg-slate-200 dark:hover:bg-[#2c3b4d] text-slate-700 dark:text-[#e8edf3] text-[12px] font-bold rounded-xl transition-colors shrink-0"
            >
              {tr('بازگشت', 'Back')}
            </button>
          )}

          {isModal && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#202b38] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
              title={tr('بستن', 'Close')}
            >
              <Icons.X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative z-10 p-3 md:p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key="all-courses"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3 w-full"
          >
            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-16 text-center">
                <Icons.Layers size={40} className="text-slate-400 mb-3" strokeWidth={1.5} />
                <p className="text-slate-500 font-medium text-[13px]">{tr('هیچ دوره‌ای با این عنوان یافت نشد.', 'No courses found.')}</p>
              </div>
            ) : (
              <div className="flex flex-col w-full pb-6">


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 w-full pb-8 items-stretch">
                  {filteredCourses.map((course, idx) => {
                    return (
                      <SpotlightCard
                        key={idx}
                        onClick={() => setSelectedCourse(course)}
                        spotlightColor="rgba(99, 102, 241, 0.12)"
                        className="cursor-pointer p-4 flex flex-col justify-between hover:border-brand-500/40 dark:hover:border-brand-500/50 hover:shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 min-h-[82px]"
                      >
                        <div className="flex items-start justify-between gap-3 w-full relative z-20">
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-1">
                            <h4 className="text-[13px] font-bold text-slate-800 dark:text-[#f3f5f7] transition-colors line-clamp-2 leading-snug tracking-tight" title={course.title}>
                              {course.title}
                            </h4>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-[#8e9aaa] truncate">
                              {course.subcategoryTitle}
                            </span>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-1 pr-3 border-r border-slate-200/80 dark:border-[#2b3745] min-w-[85px]">
                            {course.originalPrice && course.originalPrice !== course.price && (
                              <span className="text-[10.5px] font-medium text-slate-400 dark:text-[#7f8da0] line-through tracking-tight tabular-nums">{course.originalPrice}</span>
                            )}
                            <span className="text-[13px] font-extrabold text-brand-600 dark:text-[#81a5ff] tracking-tight tabular-nums whitespace-nowrap">{course.price || tr('نامشخص', 'Unknown')}</span>
                          </div>
                        </div>
                      </SpotlightCard>
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

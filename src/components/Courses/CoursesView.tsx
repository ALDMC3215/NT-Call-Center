import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COURSE_CATEGORIES, CourseItem } from '../../data/courses';
import * as Icons from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { CourseDetailsModal } from './CourseDetailsModal';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { customToast as toast } from '../UI/toast';

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
  if (schedule === "گروه یا شعبه پیش‌فرضی ثبت نشده است." || !schedule.match(/\d/)) {
    return [{ type: 'text', value: schedule }];
  }
  
  const rawParts = schedule.split(' ');
  const mergedParts: string[] = [];
  
  for (let i = 0; i < rawParts.length; i++) {
     const p = rawParts[i];
     
     if ((p === 'الی' || p === 'تا' || p === '-') && i > 0 && i < rawParts.length - 1) {
         if (mergedParts.length > 0 && mergedParts[mergedParts.length - 1].match(/\d/) && rawParts[i+1].match(/\d/)) {
             const prev = mergedParts.pop();
             mergedParts.push(`${prev} الی ${formatTimePart(rawParts[i+1])}`);
             i++; 
             continue;
         }
     }
     
     if ((p === 'گروه' || p === 'کد' || p === 'سکشن') && i < rawParts.length - 1) {
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
    const cleanPart = part.replace('‌', '').replace(' ', ''); // handle zwnj and 'سه شنبه'
    if (days.includes(cleanPart) || days.includes(part)) {
      if (currentText) { badges.push({ type: 'text', value: currentText.trim() }); currentText = ''; }
      badges.push({ type: 'day', value: part });
    } else if (part.startsWith('گروه') || part.startsWith('کد') || part.startsWith('سکشن') || part.startsWith('گر')) {
      if (currentText) { badges.push({ type: 'text', value: currentText.trim() }); currentText = ''; }
      badges.push({ type: 'group_label', value: part });
    } else if (part.match(/\d/) && (part.includes('الی') || part.includes('تا') || part.includes('-') || part.match(/^\d+$/) || part.match(/^\d+:\d+$/))) {
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

export const CoursesView = ({ externalSearchQuery = '' }: { externalSearchQuery?: string }) => {
  const { tr, direction } = useLocale();
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
          return { ...course, ...dynamicData[course.url] };
        }
        return course;
      })
    }))
  );

  const filteredSubcategories = allSubcategories.map(sub => ({
    ...sub,
    courses: sub.courses.filter(course => 
      (course.title?.toLowerCase() || '').includes(externalSearchQuery?.toLowerCase() || '') || 
      (course.description?.toLowerCase() || '').includes(externalSearchQuery?.toLowerCase() || '')
    )
  })).filter(sub => sub.courses.length > 0);

  const filteredCourses = filteredSubcategories.flatMap(sub => 
    sub.courses.map(course => ({
      ...course,
      subcategoryTitle: sub.title,
      categoryIconName: sub.categoryIconName || 'Folder'
    }))
  );

  // If search changes, clear selection to show results in grid if needed,
  // or just stay in the category if still valid.
  useEffect(() => {
    if (selectedCategoryId && externalSearchQuery) {
      const stillExists = filteredSubcategories.find(s => s.id === selectedCategoryId);
      if (!stillExists) {
        setSelectedCategoryId(null);
      }
    }
  }, [externalSearchQuery, filteredSubcategories, selectedCategoryId]);

  // Theme colors mapping
  const categoryColors = ['#aadb9f', '#88c4a5', '#7089a9'];

  return (
    <div className="flex flex-col h-full w-full relative pt-4 pb-4 px-4 md:px-8 bg-slate-50" dir={direction}>
      {/* Content Area - Vertical Layout */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative z-10 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key="all-courses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 w-full"
          >
            {filteredSubcategories.length === 0 ? (
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
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 hover:text-brand-600 rounded-xl font-medium text-[12px] transition-colors border border-brand-500/20 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <Icons.RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} />
                    <span>{isUpdating ? tr('در حال بروزرسانی...', 'Updating...') : tr('بروزرسانی اطلاعات دوره‌ها', 'Update Course Data')}</span>
                  </button>
                </div>
                <div className="hidden md:flex items-center px-4 py-3 mb-2 text-[12px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <div className="w-[45%] pl-4">{tr('مشخصات دوره', 'Course Details')}</div>
                  <div className="w-[15%] text-center">{tr('هزینه دوره', 'Price')}</div>
                  <div className="flex-1 flex items-center pr-4">
                    <div className="w-1/3 text-center">{tr('روز', 'Day')}</div>
                    <div className="w-1/3 text-center">{tr('ساعت', 'Time')}</div>
                    <div className="w-1/3 text-center">{tr('گروه', 'Group')}</div>
                  </div>
                  <div className="w-16 text-left"></div>
                </div>

                <div className="flex flex-col gap-2">
                  {filteredCourses.map((course, idx) => {
                    const CourseIcon = (Icons as any)[course.iconName || course.categoryIconName] || Icons.Book;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedCourse(course as CourseItem)}
                        className="flex flex-col md:flex-row md:items-center gap-4 px-4 py-3 md:px-4 md:py-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-[1.25rem] cursor-pointer transition-all duration-300 group hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-brand-500/20 relative overflow-hidden"
                      >
                        {/* Hover Gradient Effect */}
                        <div className="absolute inset-0 bg-gradient-to-l from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        {/* Course Info */}
                        <div className="w-full md:w-[45%] flex items-center gap-4 relative z-10">
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center group-hover:scale-105 transition-all duration-500 shadow-sm shrink-0 overflow-hidden relative">
                            {course.thumbnail ? (
                               <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                               <CourseIcon size={24} strokeWidth={1.5} className="group-hover:text-brand-500" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h4 className="text-[14px] font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors truncate tracking-tight" title={course.title}>{course.title}</h4>
                            <span className="text-[11px] font-medium text-slate-500 truncate">{course.subcategoryTitle}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="w-full md:w-[15%] flex flex-col items-center justify-center gap-0.5 text-slate-800 group-hover:text-brand-600 transition-colors relative z-10">
                          {course.originalPrice && course.originalPrice !== course.price && (
                             <span className="text-[11px] font-medium text-slate-400 line-through tracking-tight">{course.originalPrice}</span>
                          )}
                          <span className="text-[14px] font-extrabold tracking-tight">{course.price || tr('نامشخص', 'Unknown')}</span>
                        </div>

                        {/* Sections (Day / Time / Group) */}
                        <div className="flex-1 flex flex-col gap-1.5 relative z-10 pr-4 border-r border-slate-100 md:border-transparent">
                          {(course.schedules && course.schedules.length > 0) ? (
                            course.schedules.map((schedule, sIdx) => {
                              const badges = parseSchedule(schedule);
                              const day = badges.find(b => b.type === 'day')?.value || '-';
                              const time = badges.find(b => b.type === 'time')?.value || '-';
                              const group = badges.find(b => b.type === 'group_label')?.value || '-';

                              return (
                                <div key={sIdx} className="flex items-center text-[13px] text-slate-600 font-medium">
                                  <div className="w-1/3 text-center">{day}</div>
                                  <div className="w-1/3 text-center tracking-widest">{time}</div>
                                  <div className="w-1/3 text-center"><span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">{group}</span></div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-[13px] font-medium text-slate-400">
                              {tr('بدون سکشن', 'No Sections')}
                            </div>
                          )}
                        </div>

                        {/* Action Arrow */}
                        <div className="hidden md:flex w-16 justify-end relative z-10">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-slate-500 border border-slate-200 group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500 transition-all duration-500 shadow-sm">
                            <Icons.ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform duration-300" strokeWidth={2} />
                          </div>
                        </div>
                        
                        {/* Mobile Action indicator */}
                        <div className="md:hidden flex items-center justify-between mt-3 pt-4 border-t border-slate-200 relative z-10">
                          <span className="text-[12px] font-extrabold text-brand-500">{tr('مشاهده اطلاعات کامل', 'View Details')}</span>
                          <Icons.ArrowLeft size={16} className="text-brand-500" />
                        </div>
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

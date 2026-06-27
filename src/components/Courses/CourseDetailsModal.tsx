import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Globe, CheckCircle2, ChevronDown, MonitorPlay, Clock, Users, Banknote, FolderOpen } from 'lucide-react';
import { CourseItem } from '../../data/courses';
import { useLocale } from '../../hooks/useLocale';

interface CourseDetailsModalProps {
  course: CourseItem | null;
  onClose: () => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({ course, onClose }) => {
  const { tr, direction } = useLocale();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (course) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [course, onClose]);

  if (!course) return null;

  const websiteUrl = course.url || `https://itech-co.ir/?s=${encodeURIComponent(course.title)}`;

  // Formatter for schedule strings
  const parseSchedule = (schedule: string) => {
    if (schedule === "گروه یا شعبه پیش‌فرضی ثبت نشده است." || !schedule.match(/\d/)) {
      return [{ type: 'text', value: schedule }];
    }
    
    // Split into words
    const rawParts = schedule.split(' ');
    const mergedParts: string[] = [];
    
    // Merge time ranges and group labels
    for (let i = 0; i < rawParts.length; i++) {
       const p = rawParts[i];
       
       if ((p === 'الی' || p === 'تا' || p === '-') && i > 0 && i < rawParts.length - 1) {
           if (mergedParts.length > 0 && mergedParts[mergedParts.length - 1].match(/\d/) && rawParts[i+1].match(/\d/)) {
               const prev = mergedParts.pop();
               mergedParts.push(`${prev} الی ${rawParts[i+1]}`);
               i++; 
               continue;
           }
       }
       
       if ((p === 'گروه' || p === 'کد' || p === 'سکشن') && i < rawParts.length - 1) {
           mergedParts.push(`${p} ${rawParts[i+1]}`);
           i++;
           continue;
       }

       // Catch consecutive numbers without separator
       if (p.match(/^\d+(:\d+)?$/) && i < rawParts.length - 1 && rawParts[i+1].match(/^\d+(:\d+)?$/)) {
           mergedParts.push(`${p} الی ${rawParts[i+1]}`);
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

  return createPortal(
    <AnimatePresence>
      {course && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md overflow-hidden p-4 md:p-8" 
          dir={direction}
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            className="w-full max-w-[1400px] xl:w-[95vw] h-[85vh] bg-surface rounded-[2rem] overflow-hidden flex flex-col border border-border shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 bg-surface border-b border-border shrink-0 z-10">
              <div className="flex items-center gap-5">
                <button 
                  onClick={onClose}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-hover border border-border hover:bg-rose-50 text-secondary hover:text-rose-600 hover:border-rose-200 transition-all"
                >
                  <X size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-extrabold text-primary">{course.title}</h2>
                </div>
              </div>
              
              <a 
                href={websiteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-500/20"
              >
                <Globe size={18} />
                <span>{tr('مشاهده در سایت', 'View on Website')}</span>
                <ExternalLink size={16} className="opacity-80" />
              </a>
            </div>

            {/* Body - Bento Grid */}
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-surface-hover/40 p-6 md:p-10 relative">
              <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-max">
                 
                 {/* Top Row: Price & Schedules */}
                 <div className="md:col-span-5 bg-brand-500/10 rounded-[2rem] border-2 border-brand-500/20 p-8 lg:p-10 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-brand-500/40 transition-all hover:shadow-lg hover:shadow-brand-500/5">
                      <div className="absolute -left-8 -bottom-8 opacity-[0.03] text-brand-500 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                        <Banknote size={220} />
                      </div>
                      {course.price ? (
                        <>
                          <span className="text-sm font-extrabold text-brand-600 uppercase tracking-wider relative z-10">{tr('هزینه دوره', 'Investment')}</span>
                          <div className="flex flex-col gap-2 relative z-10 mt-4">
                            {course.originalPrice && course.originalPrice !== course.price && (
                               <span className="text-lg font-medium text-slate-500 line-through tracking-tight">{course.originalPrice}</span>
                            )}
                            <div className="flex items-center gap-3 text-brand-600">
                              <span className="text-4xl lg:text-5xl font-extrabold tracking-tight">{course.price}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-4 relative z-10 items-center justify-center text-center">
                           <span className="text-sm font-extrabold text-brand-600 uppercase tracking-wider">{tr('هزینه نامشخص', 'Price Unknown')}</span>
                           <a
                             href={websiteUrl}
                             target="_blank"
                             rel="noreferrer"
                             className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-extrabold transition-all shadow-md text-sm"
                           >
                             <Globe size={18} />
                             <span>{tr('بررسی در سایت', 'Check on Website')}</span>
                           </a>
                        </div>
                      )}
                 </div>

                 {course.schedules && course.schedules.length > 0 && (
                   <div className="md:col-span-7 bg-surface rounded-[2rem] border-2 border-border p-8 shadow-sm hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/5">
                        <h4 className="text-xl font-extrabold text-primary flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                             <Clock size={20} />
                           </div>
                           {tr('سکشن‌های تشکیل', 'Active sections')}
                        </h4>
                        <div className="flex flex-col gap-4">
                           {course.schedules.map((schedule, idx) => (
                                <div key={idx} className="bg-surface-hover/40 border border-border/80 p-5 rounded-2xl flex flex-wrap items-center gap-3 hover:border-amber-500/40 transition-colors group">
                                  {parseSchedule(schedule).map((badge, i) => {
                                    if (badge.type === 'text') {
                                      return <span key={i} className="text-[15px] font-extrabold text-primary ml-1">{badge.value}</span>;
                                    } else if (badge.type === 'day') {
                                      return <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-extrabold border border-amber-100">{badge.value}</span>;
                                    } else if (badge.type === 'time') {
                                      return <span key={i} className="px-3 py-1.5 bg-surface text-secondary rounded-xl text-[15px] font-medium border border-border shadow-sm">{badge.value}</span>;
                                    } else if (badge.type === 'group_label') {
                                      return <span key={i} className="px-2.5 py-1.5 bg-brand-500/10 text-brand-600 rounded-xl text-xs font-extrabold">{badge.value}</span>;
                                    }
                                    return null;
                                  })}
                                </div>
                              ))}
                        </div>
                   </div>
                 )}

                 {/* Bottom Row: Metadata & Syllabus */}
                 {course.metadata && course.metadata.length > 0 && (
                   <div className="md:col-span-12 bg-surface rounded-[2rem] border-2 border-border p-8 shadow-sm hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/5">
                      <h4 className="text-xl font-extrabold text-primary flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                             <CheckCircle2 size={20} />
                           </div>
                           {tr('مشخصات و الزامات', 'Course Info')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {course.metadata.map((meta, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-5 bg-surface-hover/50 rounded-2xl border border-border/50 hover:border-emerald-500/20 transition-colors text-[14px] font-medium text-secondary">
                            <div className="w-2 h-2 rounded-full bg-[#88c4a5] shrink-0 mt-1.5"></div>
                            <span className="leading-relaxed flex-1">{meta}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {course.sections && course.sections.length > 0 && (
                   <div className="md:col-span-12 bg-surface rounded-[2rem] border-2 border-border p-8 shadow-sm hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/5 flex flex-col justify-center">
                      <h4 className="text-xl font-extrabold text-primary flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                             <FolderOpen size={20} />
                           </div>
                           {tr('سرفصل‌ها و توضیحات تکمیلی', 'Syllabus & Details')}
                      </h4>
                      <div className="flex flex-col gap-6">
                        {course.sections.map((section, idx) => (
                          <div key={idx} className="flex flex-col gap-3">
                            <h5 className="font-extrabold text-slate-800 text-[16px] border-b border-border pb-2">{section.title}</h5>
                            <ul className="flex flex-col gap-2">
                              {section.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-[14px] font-medium text-slate-600">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2"></div>
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* Mobile CTA */}
                 <div className="md:col-span-12 sm:hidden mt-2">
                    <a 
                      href={websiteUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-6 py-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-extrabold transition-all shadow-xl shadow-brand-500/20 text-lg"
                    >
                      <Globe size={20} />
                      <span>{tr('مشاهده در سایت', 'View on Website')}</span>
                    </a>
                 </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

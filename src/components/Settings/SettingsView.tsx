import React, { useState, useRef } from 'react';
import { Settings, Trash2, Bell, RefreshCw, Calendar, PhoneOff, LogOut, Palette, MousePointerClick, Upload, FileText, ChevronDown, ChevronUp, User, Briefcase, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { useAppContext } from '../../hooks/useAppContext';
import { customToast as toast } from '../UI/toast';
import { useLocale } from '../../hooks/useLocale';
import * as xlsx from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from '../Shared/ConfirmDialog';

const SettingCard = ({ title, icon, onClick, desc, isDanger, iconBg, iconColor }: any) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer rounded-3xl p-6 bg-white border ${isDanger ? 'border-red-100' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group`}
    >
      <div className={`w-12 h-12 rounded-2xl ${iconBg || 'bg-slate-50'} flex items-center justify-center mb-5 relative z-10 ${iconColor || 'text-slate-600'} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className={`text-[17px] font-bold mb-1.5 relative z-10 ${isDanger ? 'text-red-600' : 'text-slate-800'}`}>{title}</h3>
      <p className={`text-sm font-medium leading-relaxed relative z-10 ${isDanger ? 'text-red-400' : 'text-slate-500'}`}>{desc}</p>
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle }: any) => (
  <div onClick={onToggle} className="flex items-center justify-between w-full p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm mb-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    </div>
    <div className="text-slate-400">
      {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
    </div>
  </div>
);

export const SettingsView: React.FC = () => {
  const { wipeAllData, setCurrentView, setActiveCallTab, logout, accentColor, setAccentColor, sparkColor, setSparkColor, layoutMargin, calls, profile, blacklist, bulkAddCalls } = useAppContext();
  const { tr, direction } = useLocale();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    calls: true,
    appearance: true,
    system: true
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    const allUrls = new Set<string>();
    COURSE_CATEGORIES.forEach(c => {
      c.subcategories.forEach(sub => {
        sub.courses.forEach(course => {
          if (course.url) allUrls.add(course.url);
        });
      });
    });

    const urlList = Array.from(allUrls);
    let existingData = {};
    try {
      const cached = localStorage.getItem('NOVINTECH_COURSE_DYNAMIC_DATA');
      if (cached) existingData = JSON.parse(cached);
    } catch (e) {}

    const newData: Record<string, any> = { ...existingData };

    let completed = 0;
    await Promise.all(
      urlList.map(async (url) => {
        try {
          const data = await fetchCourseDataDynamic(url);
          if (data) {
            newData[url] = data;
          }
        } catch (e) {
          console.error("Error fetching", url, e);
        } finally {
          completed++;
          setSyncProgress(Math.round((completed / urlList.length) * 100));
        }
      })
    );

    localStorage.setItem('NOVINTECH_COURSE_DYNAMIC_DATA', JSON.stringify(newData));
    setIsSyncing(false);
    toast.success(tr('به‌روزرسانی قیمت دوره‌ها با موفقیت انجام شد.', 'Course prices updated successfully.'));
  };

  const handleClearData = () => {
    wipeAllData();
    localStorage.removeItem('app-appearance');
    window.dispatchEvent(new Event('storage'));
    toast.success(tr('تمامی داده‌ها و تنظیمات سیستم با موفقیت حذف شدند.', 'All application data and settings were deleted.'));
    setShowConfirm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        let count = 0;
        let skippedPhones: string[] = [];
        const toAdd: any[] = [];
        
        data.forEach((row: any[]) => {
          if (!row || row.length === 0) return;
          const phoneRegex = /(09\d{9})|(\+989\d{9})|(9\d{9})/;
          let phoneStr = '';
          let nameStr = '';

          for (let i = 0; i < row.length; i++) {
             const rawValue = row[i];
             if (rawValue === undefined || rawValue === null) continue;
             
             const cellValue = String(rawValue);
             const noSpaceStr = cellValue.replace(/\s+/g, '');
             
             if (!phoneStr && phoneRegex.test(noSpaceStr)) {
                const match = noSpaceStr.match(phoneRegex);
                if (match) {
                   let p = match[0];
                   if (p.startsWith('+98')) p = '0' + p.substring(3);
                   else if (p.length === 10 && p.startsWith('9')) p = '0' + p;
                   phoneStr = p;
                }
             } else if (typeof rawValue === 'string' && rawValue.length > 2 && !rawValue.match(/\d/) && !nameStr) {
                nameStr = rawValue.trim();
             }
          }
          if (phoneStr) {
             if (blacklist.includes(phoneStr)) {
               skippedPhones.push(phoneStr);
             } else {
               toAdd.push({ phone: phoneStr, fullName: nameStr || '' });
               count++;
             }
          }
        });
        
        if (toAdd.length > 0) {
          bulkAddCalls(toAdd);
        }
        
        if (skippedPhones.length > 0) {
          toast.error(tr(`تعداد ${skippedPhones.length} شماره به دلیل قرار داشتن در لیست سیاه حذف شدند:\n${skippedPhones.join(' ، ')}`, `${skippedPhones.length} numbers skipped due to blacklist:\n${skippedPhones.join(', ')}`), { duration: 8000 });
        }
        
        if (count > 0) {
          toast.success(tr(`تعداد ${count} شماره با موفقیت از اکسل اضافه شد.`, `${count} numbers added from Excel.`));
        } else if (skippedPhones.length > 0) {
          // Already shown error
        } else {
          toast.error(tr('شماره معتبری یافت نشد.', 'No valid number found.'));
        }
      } catch (error) {
        toast.error(tr('خطا در خواندن فایل اکسل.', 'Error reading excel file.'));
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    const exportData = calls.map(c => {
      const lastAttempt = c.attempts && c.attempts.length > 0 ? c.attempts[c.attempts.length - 1] : c;
      return {
        'شماره': c.phone,
        'نام و نام خانوادگی': c.fullName || '',
        'آخرین وضعیت تماس': lastAttempt.callStatus || c.callStatus || '',
        'دوره ها': (lastAttempt.courses || c.courses)?.join(', ') || '',
        'وضعیت مشاوره': lastAttempt.advisory || c.advisory || '',
        'تاریخ مشاوره': lastAttempt.advisoryDate || c.advisoryDate || '',
        'ساعت مشاوره': lastAttempt.advisoryTime || c.advisoryTime || '',
        'وضعیت ثبت نام': lastAttempt.registered || c.registered || '',
        'آخرین یادداشت': lastAttempt.notes || c.notes || '',
        'تاریخ ورود به سیستم': c.createdAt || '',
        'تاریخ آخرین پیگیری': lastAttempt.createdAt || c.createdAt || ''
      };
    });
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Calls");
    xlsx.writeFile(wb, `calls_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(tr('فایل Excel با موفقیت دریافت شد.', 'Excel downloaded.'));
  };

  const handleExportJSON = () => {
    const exportData = { profile, blacklist, calls };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `calls_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success(tr('فایل JSON با موفقیت دریافت شد.', 'JSON downloaded.'));
  };

  return (
    <div className="w-full h-full pt-4 pb-32 overflow-y-auto hide-scrollbar bg-slate-50" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      <div className="w-full flex flex-col items-center max-w-5xl mx-auto" dir={direction}>
        
        <div className="w-full flex flex-col items-center mb-10 text-center mt-6">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-800 mb-6 shadow-sm border border-slate-200">
             <Settings size={40} className="text-indigo-600" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">{tr('تنظیمات سیستم', 'Application settings')}</h2>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">{tr('پیکربندی و شخصی‌سازی تنظیمات برنامه. تغییرات شما به صورت خودکار ذخیره می‌شوند.', 'Configure and personalize the application. Your changes are saved automatically.')}</p>
        </div>

        {/* PROFILE SECTION */}
        <div className="w-full mb-8">
          <SectionHeader title={tr('پروفایل کاربری', 'User Profile')} icon={User} isExpanded={expandedSections.profile} onToggle={() => toggleSection('profile')} />
          <AnimatePresence>
            {expandedSections.profile && profile && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-max pb-4">
                  <div className="md:col-span-8 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md hover:border-slate-300 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-cyan-600 mb-6 border border-slate-100 group-hover:scale-110 transition-transform">
                        <User size={32} />
                      </div>
                      <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-700 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-100 shadow-sm">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="pt-0.5">{tr('آنلاین', 'Online')}</span>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{profile.name}</h2>
                      <div className="flex items-center gap-2 text-[15px] text-slate-600 font-medium bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
                         <Briefcase size={18} className="text-slate-500" />
                         <span>{tr('اپراتور سیستم', 'System Operator')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 transition-all group">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100 group-hover:scale-110 transition-transform">
                       <Calendar size={32} />
                    </div>
                    <div>
                       <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('تاریخ نشست', 'Session Date')}</span>
                       <span className="text-2xl font-extrabold text-slate-800" dir="ltr">{profile.date}</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 transition-all group">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100 group-hover:scale-110 transition-transform">
                       <Clock size={32} />
                    </div>
                    <div>
                       <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('شیفت فعال', 'Active Shift')}</span>
                       <span className="text-2xl font-extrabold text-slate-800">
                         {profile.shift === 'Morning' ? tr('صبح', 'Morning') : profile.shift === 'Evening' ? tr('عصر', 'Evening') : profile.shift.includes('to') ? profile.shift.replace('to', tr('تا', 'to')) : profile.shift}
                       </span>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col min-h-[220px] justify-between hover:shadow-md hover:border-slate-300 transition-all group">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-rose-50 flex items-center justify-center text-rose-600 mb-4 border border-rose-100 group-hover:scale-110 transition-transform">
                       <MapPin size={32} />
                    </div>
                    <div>
                       <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('محل استقرار', 'Location')}</span>
                       <span className="text-2xl font-extrabold text-slate-800">
                         {tr('شعبه', 'Branch')} {profile.branch === 'Pardis' ? tr('پردیس', 'Pardis') : profile.branch === 'Zargari' ? tr('زرگری', 'Zargari') : profile.branch}
                       </span>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col justify-between min-h-[220px] hover:shadow-md hover:border-slate-300 transition-all group">
                     <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-600 mb-4 border border-slate-200 group-hover:scale-110 transition-transform">
                       <ShieldCheck size={32} />
                     </div>
                     <div>
                       <span className="text-[13px] font-bold text-slate-500 tracking-wide mb-1.5 block">{tr('سطح دسترسی', 'Access Level')}</span>
                       <span className="text-xl font-extrabold text-slate-800">{tr('محدود (اپراتور)', 'Restricted (Operator)')}</span>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CALL NUMBERS SECTION */}
        <div className="w-full mb-8">
          <SectionHeader title={tr('تنظیمات شماره‌های تماس', 'Call Numbers Settings')} icon={FileText} isExpanded={expandedSections.calls} onToggle={() => toggleSection('calls')} />
          <AnimatePresence>
            {expandedSections.calls && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">{tr('ورودی و خروجی اطلاعات', 'Data Import / Export')}</h4>
                    <div className="flex flex-col gap-3">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 group">
                        <span className="font-bold">{tr('ورود فایل اکسل', 'Import Excel')}</span>
                        <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                      </button>
                      <button onClick={handleExportExcel} className="flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors border border-green-200 group">
                        <span className="font-bold">{tr('خروجی اطلاعات در اکسل', 'Export Excel')}</span>
                        <Upload size={20} className="rotate-180 group-hover:translate-y-1 transition-transform" />
                      </button>
                      <button onClick={handleExportJSON} className="flex items-center justify-between p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200 group">
                        <span className="font-bold">{tr('دریافت بکاپ JSON', 'Export JSON')}</span>
                        <FileText size={20} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">{tr('فعالیت مربوط به شماره‌ها', 'Numbers Activities')}</h4>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => { setActiveCallTab('today'); setCurrentView('dashboard'); }} className="flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 group">
                        <span className="font-bold">{tr('فعالیت امروز', "Today's Activity")}</span>
                        <Calendar size={20} className="group-hover:scale-110 transition-transform" />
                      </button>
                      <button onClick={() => setCurrentView('blacklist')} className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group">
                        <span className="font-bold">{tr('لیست سیاه', 'Blacklist')}</span>
                        <PhoneOff size={20} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* APPEARANCE SECTION */}
        <div className="w-full mb-8">
          <SectionHeader title={tr('شخصی‌سازی ظاهر', 'Appearance')} icon={Palette} isExpanded={expandedSections.appearance} onToggle={() => toggleSection('appearance')} />
          <AnimatePresence>
            {expandedSections.appearance && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  
                  <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-slate-200 transition-colors">
                    <label className="flex items-center justify-between text-slate-800 font-bold">
                      <div className="flex items-center gap-2 text-lg">
                        <Palette size={20} className="text-brand-500" />
                        {tr('رنگ اصلی سیستم', 'System Accent Color')}
                      </div>
                      <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600" dir="ltr">{accentColor}</span>
                    </label>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {['#005082', '#005938', '#8b1c2b', '#7a4b00', '#5b3b8c', '#4f5b66', '#0f0f0f'].map(c => (
                        <button key={c} onClick={() => setAccentColor(c)} className={`w-9 h-9 rounded-full shadow-sm transition-transform hover:scale-110 ${accentColor === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''}`} style={{ backgroundColor: c }} />
                      ))}
                      <div className="w-px h-8 bg-slate-200 mx-2"></div>
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:scale-110 transition-transform flex items-center justify-center">
                         <div className="absolute inset-0 bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)] opacity-40 pointer-events-none" />
                         <div className="w-4 h-4 rounded-full bg-white shadow-sm pointer-events-none z-10" />
                         <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer opacity-0 z-20" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-slate-200 transition-colors">
                    <label className="flex items-center justify-between text-slate-800 font-bold">
                      <div className="flex items-center gap-2 text-lg">
                        <MousePointerClick size={20} className="text-brand-500" />
                        {tr('رنگ افکت کلیک', 'Click Effect Color')}
                      </div>
                      <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600" dir="ltr">{sparkColor}</span>
                    </label>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {['#005082', '#005938', '#8b1c2b', '#7a4b00', '#5b3b8c', '#4f5b66', '#0f0f0f'].map(c => (
                        <button key={c} onClick={() => setSparkColor(c)} className={`w-9 h-9 rounded-full shadow-sm transition-transform hover:scale-110 ${sparkColor === c ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : ''}`} style={{ backgroundColor: c }} />
                      ))}
                      <div className="w-px h-8 bg-slate-200 mx-2"></div>
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:scale-110 transition-transform flex items-center justify-center">
                         <div className="absolute inset-0 bg-[conic-gradient(red,yellow,lime,aqua,blue,fuchsia,red)] opacity-40 pointer-events-none" />
                         <div className="w-4 h-4 rounded-full bg-white shadow-sm pointer-events-none z-10" />
                         <input type="color" value={sparkColor} onChange={(e) => setSparkColor(e.target.value)} className="absolute -inset-4 w-[200%] h-[200%] cursor-pointer opacity-0 z-20" />
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SYSTEM SECTION */}
        <div className="w-full mb-8">
          <SectionHeader title={tr('مدیریت داده‌ها و نشست', 'System & Data')} icon={Settings} isExpanded={expandedSections.system} onToggle={() => toggleSection('system')} />
          <AnimatePresence>
            {expandedSections.system && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
                  <SettingCard title={tr('به‌روزرسانی دوره‌ها', 'Sync Courses')} desc={isSyncing ? `${tr('در حال به‌روزرسانی...', 'Updating...')} ${syncProgress}%` : tr('دریافت جدیدترین قیمت و اطلاعات دوره‌ها', 'Get latest prices and course info')} icon={<RefreshCw size={24} className={isSyncing ? 'animate-spin text-brand-500' : ''} />} iconBg="bg-teal-50" iconColor="text-teal-600" onClick={() => { if(!isSyncing) handleSyncData(); }} />
                  <SettingCard title={tr('پاک کردن داده‌ها', 'Clear data')} desc={tr('حذف غیرقابل بازگشت تمامی داده‌ها', 'Permanently delete all application data')} icon={<Trash2 size={24} />} iconBg="bg-red-50" iconColor="text-red-500" isDanger onClick={() => setShowConfirm(true)} />
                  <SettingCard title={tr('خروج از حساب', 'Logout')} desc={tr('پایان نشست فعلی', 'End current session')} icon={<LogOut size={24} />} iconBg="bg-rose-50" iconColor="text-rose-500" isDanger onClick={() => setShowLogoutConfirm(true)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleClearData}
        title={tr('پاک کردن تمامی داده‌ها', 'Clear All Data')}
        message={tr('آیا مطمئن هستید؟ این عملیات تمامی تماس‌ها، لیست سیاه و تنظیمات شما را به طور غیرقابل بازگشت حذف می‌کند.', 'Are you sure? This will permanently delete all your calls, blacklist, and settings.')}
        confirmText={tr('بله، حذف کن', 'Yes, Delete')}
      />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
        title={tr('خروج از سیستم', 'Logout')}
        message={tr('آیا می‌خواهید از سیستم خارج شوید؟', 'Are you sure you want to log out?')}
        confirmText={tr('خروج', 'Logout')}
      />
    </div>
  );
};

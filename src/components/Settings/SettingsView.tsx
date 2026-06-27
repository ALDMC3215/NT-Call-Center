import React, { useState, useRef } from 'react';
import { Settings, RefreshCw, Calendar, PhoneOff, Upload, FileText, User, Briefcase, MapPin, Clock, Download } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { useAppContext } from '../../hooks/useAppContext';
import { customToast as toast } from '../UI/toast';
import { useLocale } from '../../hooks/useLocale';
import * as xlsx from 'xlsx';

export const SettingsView: React.FC = () => {
  const { setCurrentView, setActiveCallTab, layoutMargin, calls, profile, blacklist, bulkAddCalls } = useAppContext();
  const { tr, direction } = useLocale();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        {/* Title */}
        <div className="w-full flex flex-col items-center mb-8 text-center mt-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-800 mb-4 shadow-sm border border-slate-200">
             <Settings size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{tr('ابزارها و عملیات کارشناس', 'Expert Tools & Operations')}</h2>
          <p className="text-[15px] text-slate-600 max-w-2xl leading-relaxed">{tr('دسترسی سریع به عملیات روزانه، مدیریت داده‌ها و فایل‌ها', 'Quick access to daily operations, data management and files')}</p>
        </div>

        {/* Compact Profile Strip */}
        {profile && (
          <div className="w-full bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-cyan-600 border border-slate-100 shrink-0">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-1">{profile.name}</h3>
                <div className="flex items-center gap-2 text-[13px] text-slate-500 font-bold mt-1">
                  <Briefcase size={14} />
                  <span>{tr('اپراتور سیستم', 'System Operator')}</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-100"></div>

            <div className="flex items-center gap-6 md:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col text-[13px] font-bold">
                  <span className="text-slate-400 mb-0.5">{tr('تاریخ امروز', 'Today Date')}</span>
                  <span className="text-slate-800" dir="ltr">{profile.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex flex-col text-[13px] font-bold">
                  <span className="text-slate-400 mb-0.5">{tr('شیفت فعال', 'Active Shift')}</span>
                  <span className="text-slate-800">
                    {profile.shift === 'Morning' ? tr('صبح', 'Morning') : profile.shift === 'Evening' ? tr('عصر', 'Evening') : profile.shift.includes('to') ? profile.shift.replace('to', tr('تا', 'to')) : profile.shift}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col text-[13px] font-bold">
                  <span className="text-slate-400 mb-0.5">{tr('محل استقرار', 'Location')}</span>
                  <span className="text-slate-800">
                    {tr('شعبه', 'Branch')} {profile.branch === 'Pardis' ? tr('پردیس', 'Pardis') : profile.branch === 'Zargari' ? tr('زرگری', 'Zargari') : profile.branch}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main quick-actions area */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 px-1">
              {tr('ابزارهای کاری', 'Working Tools')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 transition-all shadow-md shadow-brand-500/25 group col-span-1 sm:col-span-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Upload size={32} className="mb-3 group-hover:-translate-y-1 transition-transform" />
                <span className="font-extrabold text-lg">{tr('ورود فایل اکسل', 'Import Excel')}</span>
                <span className="text-[13px] text-white/80 font-medium mt-1">{tr('وارد کردن لیست شماره‌های جدید', 'Import new contact numbers list')}</span>
              </button>

              <button onClick={() => { setActiveCallTab('today'); setCurrentView('dashboard'); }} className="flex items-center p-5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group gap-4 text-right">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar size={24} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px]">{tr('فعالیت امروز', "Today's Activity")}</span>
                  <span className="text-[12px] text-slate-500 font-bold mt-0.5">{tr('مشاهده گزارش عملکرد امروز', 'View today performance report')}</span>
                </div>
              </button>

              <button onClick={() => setCurrentView('blacklist')} className="flex items-center p-5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-slate-400 hover:shadow-md transition-all group gap-4 text-right">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <PhoneOff size={24} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px]">{tr('لیست سیاه', 'Blacklist')}</span>
                  <span className="text-[12px] text-slate-500 font-bold mt-0.5">{tr('مدیریت شماره‌های مسدود', 'Manage blocked numbers')}</span>
                </div>
              </button>

              <button onClick={() => { if(!isSyncing) handleSyncData(); }} disabled={isSyncing} className="flex items-center p-5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:border-teal-300 hover:shadow-md transition-all group gap-4 disabled:opacity-70 disabled:hover:shadow-none col-span-1 sm:col-span-2 text-right">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <RefreshCw size={24} className={isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px]">{tr('به‌روزرسانی دوره‌ها', 'Sync Courses')}</span>
                  <span className="text-[12px] text-slate-500 font-bold mt-0.5">
                    {isSyncing ? `${tr('در حال دریافت اطلاعات...', 'Fetching info...')} ${syncProgress}%` : tr('دریافت جدیدترین قیمت و اطلاعات دوره‌ها از وب‌سایت', 'Get latest prices and course info from website')}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Secondary data tools area */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 px-1">
              {tr('خروجی و پشتیبان', 'Export & Backup')}
            </h3>
            <div className="flex flex-col gap-3">
              <button onClick={handleExportExcel} className="flex items-center p-4 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors group gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                </div>
                <span className="font-bold text-[14px]">{tr('خروجی اطلاعات در اکسل', 'Export Excel')}</span>
              </button>

              <button onClick={handleExportJSON} className="flex items-center p-4 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors group gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText size={20} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-[14px]">{tr('دریافت بکاپ JSON', 'Export JSON')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

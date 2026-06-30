import React, { useState, useRef, useEffect } from 'react';
import { Settings, RefreshCw, Calendar, PhoneOff, Upload, User, Briefcase, MapPin, Clock, Download, Send, History, X } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { useAppContext } from '../../hooks/useAppContext';
import { customToast as toast } from '../UI/toast';
import { useLocale } from '../../hooks/useLocale';
import * as xlsx from 'xlsx';
import { getActiveFollowups, buildFollowUpSnapshot } from '../../utils/followups';
import { exportFollowupsToExcel } from '../../utils/followupExcel';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { setCurrentView, setActiveCallTab, layoutMargin, calls, profile, blacklist, bulkAddCalls } = useAppContext();
  const { tr, direction } = useLocale();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeManagers, setActiveManagers] = useState<{id: string, name: string}[]>([]);
  const [managerLoadState, setManagerLoadState] = useState<'loading' | 'success' | 'rpc_missing' | 'error'>('loading');
  const [lastSent, setLastSent] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const followups = getActiveFollowups(calls);
  const activeCount = followups.length;

  const fetchManagers = async () => {
    setManagerLoadState('loading');
    const { data, error } = await supabase.rpc('get_active_managers');
    if (error) {
      if (error.code === '42883' || (error.message && error.message.includes('function')) || (error.message && error.message.includes('does not exist'))) {
         setManagerLoadState('rpc_missing');
         console.error('get_active_managers RPC missing:', error);
      } else {
         setManagerLoadState('error');
         console.error('Error fetching managers:', error);
      }
    } else if (data) {
      setActiveManagers(data.map((m: any) => ({ id: m.id, name: m.full_name })));
      setManagerLoadState('success');
    }
  };

  useEffect(() => {
    if (profile) {
      fetchManagers();
      fetchLastSent();
    }
  }, [profile]);

  const fetchLastSent = () => {
    if (!profile) return;
    supabase.from('followup_shares')
      .select('receiver_manager_id, sent_at, item_count')
      .eq('sender_expert_id', profile.id)
      .order('sent_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLastSent(data[0]);
        }
      });
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

  const handleDownloadExcel = async () => {
    if (activeCount === 0) return toast.error(tr('پیگیری فعالی برای خروجی وجود ندارد.', 'No active follow-ups to export.'));
    const snapshot = buildFollowUpSnapshot(calls);

    try {
      await exportFollowupsToExcel(snapshot, activeCount);
      toast.success(tr('فایل اکسل پیگیری‌ها با موفقیت دریافت شد.', 'Follow-ups Excel downloaded successfully.'));
    } catch (err) {
      console.error(err);
      toast.error(tr('خطا در ایجاد فایل اکسل.', 'Error creating Excel file.'));
    }
  };

  const handleDownloadFollowups = () => {
    if (activeCount === 0) return toast.error(tr('پیگیری فعالی برای خروجی وجود ندارد.', 'No active follow-ups to export.'));
    const snapshot = buildFollowUpSnapshot(calls);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `novintech-followups-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success(tr('فایل JSON پیگیری‌ها با موفقیت دریافت شد.', 'Follow-ups JSON downloaded successfully.'));
  };

  const handleSendToManager = async () => {
    if (!selectedManagerId) return toast.error(tr('لطفا یک مدیر را انتخاب کنید.', 'Please select a manager.'));
    if (!profile) return;
    const snapshot = buildFollowUpSnapshot(calls);

    setIsSending(true);
    const { error } = await supabase.rpc('create_followup_share', {
      p_receiver_manager_id: selectedManagerId,
      p_payload_json: snapshot,
      p_item_count: snapshot.length
    });
    setIsSending(false);

    if (error) {
      toast.error(tr('ارسال با خطا مواجه شد.', 'Sending failed.'));
    } else {
      toast.success(tr('لیست پیگیری‌ها با موفقیت به مدیر ارسال شد.', 'Follow-ups successfully sent to manager.'));
      setIsShareModalOpen(false);
      fetchLastSent();
    }
  };

  return (
    <div className="w-full h-full pt-6 pb-32 overflow-y-auto hide-scrollbar bg-slate-100" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      <div className="w-full flex flex-col max-w-[1100px] mx-auto" dir={direction}>

        {/* Title */}
        <div className="w-full flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-800 mb-4 shadow-sm border border-slate-200">
             <Settings size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{tr('ابزارها و عملیات کارشناس', 'Expert Tools & Operations')}</h2>
          <p className="text-[15px] text-slate-500 font-medium max-w-2xl leading-relaxed">{tr('دسترسی سریع به عملیات روزانه، مدیریت داده‌ها و تبادل پیگیری‌ها', 'Quick access to daily operations, data management and follow-up exchange')}</p>
        </div>

        {/* Compact Profile Strip */}
        {profile && (
          <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-cyan-600 border border-slate-100 shrink-0">
                <User size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{profile.name}</h3>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-bold mt-1">
                  <Briefcase size={12} />
                  <span>{tr('اپراتور سیستم', 'System Operator')}</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-100"></div>

            <div className="flex items-center justify-end flex-1 gap-4 md:gap-8">
              <div className="flex items-center gap-3 bg-indigo-50/50 px-4 py-2 rounded-xl border border-indigo-50">
                <Calendar size={18} className="text-indigo-500 shrink-0" />
                <div className="flex flex-col text-[12px] font-bold">
                  <span className="text-slate-400 leading-none mb-1">{tr('تاریخ امروز', 'Today Date')}</span>
                  <span className="text-slate-700 leading-none" dir="ltr">{profile.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-amber-50/50 px-4 py-2 rounded-xl border border-amber-50">
                <Clock size={18} className="text-amber-500 shrink-0" />
                <div className="flex flex-col text-[12px] font-bold">
                  <span className="text-slate-400 leading-none mb-1">{tr('شیفت فعال', 'Active Shift')}</span>
                  <span className="text-slate-700 leading-none">
                    {profile.shift === 'Morning' ? tr('صبح', 'Morning') : profile.shift === 'Evening' ? tr('عصر', 'Evening') : profile.shift.includes('to') ? profile.shift.replace('to', tr('تا', 'to')) : profile.shift}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-rose-50/50 px-4 py-2 rounded-xl border border-rose-50">
                <MapPin size={18} className="text-rose-500 shrink-0" />
                <div className="flex flex-col text-[12px] font-bold">
                  <span className="text-slate-400 leading-none mb-1">{tr('محل استقرار', 'Location')}</span>
                  <span className="text-slate-700 leading-none">
                    {tr('شعبه', 'Branch')} {profile.branch === 'Pardis' ? tr('پردیس', 'Pardis') : profile.branch === 'Zargari' ? tr('زرگری', 'Zargari') : profile.branch}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main quick-actions area */}
          <div className="xl:col-span-7 2xl:col-span-8 flex flex-col gap-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-w-0">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-2">
              <Briefcase size={20} className="text-indigo-500" />
              {tr('ابزارهای کاری', 'Working Tools')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 transition-all shadow-md shadow-brand-500/30 group col-span-1 sm:col-span-2 relative overflow-hidden border border-brand-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Upload size={36} className="mb-4 group-hover:-translate-y-1 transition-transform" />
                <span className="font-black text-xl mb-1.5">{tr('ورود فایل اکسل', 'Import Excel')}</span>
                <span className="text-[14px] text-brand-100 font-medium">{tr('وارد کردن لیست شماره‌های جدید', 'Import new contact numbers list')}</span>
              </button>

              <button onClick={() => { setActiveCallTab('today'); setCurrentView('dashboard'); }} className="flex items-center p-5 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all group gap-4 text-right">
                <div className="w-12 h-12 rounded-xl bg-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px]">{tr('فعالیت امروز', "Today's Activity")}</span>
                  <span className="text-[12px] text-slate-500 font-bold mt-0.5">{tr('مشاهده گزارش عملکرد امروز', 'View today performance report')}</span>
                </div>
              </button>

              <button onClick={() => setCurrentView('blacklist')} className="flex items-center p-5 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl hover:bg-white hover:border-slate-400 hover:shadow-sm transition-all group gap-4 text-right">
                <div className="w-12 h-12 rounded-xl bg-slate-200/50 text-slate-600 flex items-center justify-center shrink-0">
                  <PhoneOff size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px]">{tr('لیست سیاه', 'Blacklist')}</span>
                  <span className="text-[12px] text-slate-500 font-bold mt-0.5">{tr('مدیریت شماره‌های مسدود', 'Manage blocked numbers')}</span>
                </div>
              </button>

              <button onClick={() => { if(!isSyncing) handleSyncData(); }} disabled={isSyncing} className="flex items-center p-5 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl hover:bg-white hover:border-teal-300 hover:shadow-sm transition-all group gap-4 disabled:opacity-70 disabled:hover:shadow-none col-span-1 sm:col-span-2 text-right">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <RefreshCw size={22} className={isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
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

          {/* Follow-up Exchange Area */}
          <div className="xl:col-span-5 2xl:col-span-4 flex flex-col gap-5 bg-brand-50/30 p-6 rounded-3xl border border-brand-100/50 shadow-sm min-w-0">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-2">
              <Send size={20} className="text-brand-500" />
              {tr('تبادل پیگیری‌ها', 'Follow-up Exchange')}
            </h3>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  if (activeCount > 0) setIsShareModalOpen(true);
                  else toast.error(tr('شما هیچ پیگیری فعالی ندارید.', 'You have no active follow-ups.'));
                }}
                className={`flex items-center p-5 bg-white border ${activeCount > 0 ? 'border-brand-200 text-slate-700 hover:border-brand-400 hover:shadow-md cursor-pointer' : 'border-slate-200 text-slate-400 cursor-not-allowed opacity-80'} rounded-2xl transition-all group gap-4 text-right`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activeCount > 0 ? 'bg-brand-50 text-brand-600 border border-brand-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                  <Send size={24} className={activeCount > 0 ? "group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" : ""} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-extrabold text-[15px] truncate">{tr('ارسال لیست پیگیری‌ها', 'Send Follow-up List')}</span>
                  <span className="text-[12px] font-bold text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{tr('ارسال امن لیست به مدیر سیستم', 'Securely send list to system manager')}</span>
                </div>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
                <button
                  onClick={handleDownloadExcel}
                  className={`flex items-center p-5 bg-white border ${activeCount > 0 ? 'border-slate-200 text-slate-700 hover:border-emerald-500 hover:shadow-md cursor-pointer' : 'border-slate-100 text-slate-400 cursor-not-allowed opacity-80'} rounded-2xl transition-all group gap-4 text-right`}
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${activeCount > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <Download size={24} className={activeCount > 0 ? "group-hover:translate-y-1 transition-transform" : ""} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-extrabold text-[15px] truncate">{tr('دانلود اکسل پیگیری‌ها', 'Download Follow-ups Excel')}</span>
                    <span className="text-[12px] font-bold mt-0.5 text-slate-500 truncate">{activeCount > 0 ? `${activeCount} پیگیری فعال` : 'بدون پیگیری'}</span>
                  </div>
                </button>

                <button
                  onClick={handleDownloadFollowups}
                  className={`flex items-center p-5 bg-white border ${activeCount > 0 ? 'border-slate-200 text-slate-700 hover:border-slate-400 hover:shadow-md cursor-pointer' : 'border-slate-100 text-slate-400 cursor-not-allowed opacity-80'} rounded-2xl transition-all group gap-4 text-right`}
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${activeCount > 0 ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <Download size={24} className={activeCount > 0 ? "group-hover:translate-y-1 transition-transform" : ""} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-extrabold text-[15px] truncate">{tr('دانلود JSON پیگیری‌ها', 'Download Follow-ups JSON')}</span>
                    <span className="text-[12px] font-bold mt-0.5 text-slate-500 truncate">{activeCount > 0 ? `نسخه خام و ساختاریافته` : 'بدون پیگیری'}</span>
                  </div>
                </button>
              </div>

              {lastSent && (
                <div className="flex flex-col mt-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700 font-extrabold text-[14px] mb-3">
                    <History size={18} className="text-slate-400" />
                    <span>{tr('آخرین ارسال من', 'My Last Sent')}</span>
                  </div>
                  <div className="text-[13px] font-bold text-slate-500 space-y-2">
                    <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                       <span>به:</span>
                       <span className="font-black text-slate-800">{activeManagers.find(m => m.id === lastSent.receiver_manager_id)?.name || 'مدیر'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                       <span>زمان:</span>
                       <span className="font-black text-slate-800" dir="ltr">{new Date(lastSent.sent_at).toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                       <span>تعداد:</span>
                       <span className="font-black text-slate-800">{lastSent.item_count} مورد</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={direction}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShareModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><Send size={20} /></div>
                   <span className="font-extrabold text-slate-900 text-lg">{tr('ارسال پیگیری‌ها به مدیر', 'Send follow-ups to manager')}</span>
                 </div>
                 <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-2 border border-slate-200 transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-6">
                 <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-1">
                   <span className="text-4xl font-black text-brand-600">{activeCount}</span>
                   <span className="text-[13px] font-bold text-brand-700 mt-1">{tr('مورد جهت ارسال آماده است', 'items ready to send')}</span>
                 </div>

                 <div className="flex flex-col gap-3">
                    <label className="text-[14px] font-extrabold text-slate-800">{tr('انتخاب مدیر', 'Select Manager')}</label>

                    {managerLoadState === 'rpc_missing' ? (
                      <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl text-[13px] font-bold leading-relaxed text-center">
                        سامانه تبادل پیگیریها هنوز روی سرور راهاندازی نشده است.
                      </div>
                    ) : managerLoadState === 'error' ? (
                      <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-[13px] font-bold flex flex-col items-center justify-center gap-3 text-center">
                        <span>خطا در دریافت لیست مدیران</span>
                        <button onClick={fetchManagers} className="bg-red-100 px-4 py-2 rounded-xl hover:bg-red-200 transition-colors">تلاش مجدد</button>
                      </div>
                    ) : managerLoadState === 'loading' ? (
                      <div className="p-4 bg-slate-50 text-slate-500 border border-slate-200 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        در حال دریافت لیست مدیران...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
                        {activeManagers.length === 0 ? (
                           <div className="text-center text-[13px] font-bold text-slate-500 p-4 border border-dashed border-slate-200 rounded-2xl">
                             مدیر فعالی یافت نشد.
                           </div>
                        ) : (
                          activeManagers.map(m => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedManagerId(m.id)}
                              className={`flex items-center justify-between p-4 rounded-2xl border ${selectedManagerId === m.id ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'} transition-all text-right w-full`}
                            >
                              <span className={`font-extrabold text-[14px] ${selectedManagerId === m.id ? 'text-brand-700' : 'text-slate-700'}`}>{m.name}</span>
                              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">فعال</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                 </div>

                 <button
                   onClick={handleSendToManager}
                   disabled={isSending || !selectedManagerId || managerLoadState !== 'success'}
                   className="w-full h-14 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand-500/25 disabled:shadow-none"
                 >
                   {isSending ? (
                     <RefreshCw size={20} className="animate-spin" />
                   ) : (
                     <>
                       <Send size={20} />
                       <span>{tr('تایید و ارسال سریع', 'Confirm & Quick Send')}</span>
                     </>
                   )}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

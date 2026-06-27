import React, { useState, useRef, useEffect } from 'react';
import { Settings, RefreshCw, Calendar, PhoneOff, Upload, User, Briefcase, MapPin, Clock, Download, Send, History, X } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { useAppContext } from '../../hooks/useAppContext';
import { customToast as toast } from '../UI/toast';
import { useLocale } from '../../hooks/useLocale';
import * as xlsx from 'xlsx';
import { getActiveFollowups, buildFollowUpSnapshot } from '../../utils/followups';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { setCurrentView, setActiveCallTab, layoutMargin, calls, profile, blacklist, bulkAddCalls } = useAppContext();
  const { tr, direction } = useLocale();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeManagers, setActiveManagers] = useState<{id: string, name: string}[]>([]);
  const [lastSent, setLastSent] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const followups = getActiveFollowups(calls);
  const activeCount = followups.length;

  useEffect(() => {
    if (profile) {
      supabase.rpc('get_active_managers').then(({ data }) => {
        if (data) setActiveManagers(data);
      });
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
    <div className="w-full h-full pt-4 pb-32 overflow-y-auto hide-scrollbar bg-slate-50" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      <div className="w-full flex flex-col items-center max-w-5xl mx-auto" dir={direction}>

        {/* Title */}
        <div className="w-full flex flex-col items-center mb-8 text-center mt-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-800 mb-4 shadow-sm border border-slate-200">
             <Settings size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{tr('ابزارها و عملیات کارشناس', 'Expert Tools & Operations')}</h2>
          <p className="text-[15px] text-slate-600 max-w-2xl leading-relaxed">{tr('دسترسی سریع به عملیات روزانه، مدیریت داده‌ها و تبادل پیگیری‌ها', 'Quick access to daily operations, data management and follow-up exchange')}</p>
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

          {/* Follow-up Exchange Area */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 px-1">
              {tr('تبادل پیگیری‌ها', 'Follow-up Exchange')}
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (activeCount > 0) setIsShareModalOpen(true);
                  else toast.error(tr('شما هیچ پیگیری فعالی ندارید.', 'You have no active follow-ups.'));
                }}
                className={`flex items-center p-5 bg-white border ${activeCount > 0 ? 'border-brand-300 text-brand-700 hover:bg-brand-50 hover:shadow-md cursor-pointer' : 'border-slate-200 text-slate-400 cursor-not-allowed opacity-80'} rounded-2xl transition-all group gap-4`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activeCount > 0 ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Send size={24} className={activeCount > 0 ? "group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" : ""} />
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-extrabold text-[15px]">{tr('ارسال لیست پیگیری‌ها', 'Send Follow-up List')}</span>
                  <span className="text-[12px] font-bold mt-0.5 opacity-80">{tr('ارسال امن لیست به مدیر سیستم', 'Securely send list to system manager')}</span>
                </div>
              </button>

              <button onClick={handleDownloadFollowups} className="flex items-center p-4 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors group gap-3 text-right">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px]">{tr('دانلود JSON پیگیری‌ها', 'Download Follow-ups JSON')}</span>
                  <span className="text-[11px] text-slate-500 font-bold mt-0.5">{activeCount > 0 ? `${activeCount} پیگیری فعال` : 'بدون پیگیری'}</span>
                </div>
              </button>

              {lastSent && (
                <div className="flex flex-col mt-2 p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-[13px] mb-2">
                    <History size={16} />
                    <span>{tr('آخرین ارسال من', 'My Last Sent')}</span>
                  </div>
                  <div className="text-[12px] font-medium text-slate-500 space-y-1">
                    <div className="flex justify-between"><span>به:</span><span className="font-bold text-slate-800">{activeManagers.find(m => m.id === lastSent.receiver_manager_id)?.name || 'مدیر'}</span></div>
                    <div className="flex justify-between"><span>زمان:</span><span className="font-bold text-slate-800" dir="ltr">{new Date(lastSent.sent_at).toLocaleString('fa-IR')}</span></div>
                    <div className="flex justify-between"><span>تعداد:</span><span className="font-bold text-slate-800">{lastSent.item_count} مورد</span></div>
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
                 <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-2 border border-slate-200"><X size={18} /></button>
              </div>
              <div className="p-6 flex flex-col gap-5">
                 <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                   <span className="text-3xl font-black text-brand-600">{activeCount}</span>
                   <span className="text-sm font-bold text-brand-700">{tr('مورد جهت ارسال آماده است', 'items ready to send')}</span>
                 </div>

                 <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-700">{tr('انتخاب مدیر', 'Select Manager')}</label>
                    <select
                      value={selectedManagerId}
                      onChange={e => setSelectedManagerId(e.target.value)}
                      className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 cursor-pointer"
                    >
                      <option value="" disabled>{tr('یک مدیر را انتخاب کنید...', 'Select a manager...')}</option>
                      {activeManagers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                 </div>

                 <button
                   onClick={handleSendToManager}
                   disabled={isSending || !selectedManagerId}
                   className="w-full h-12 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand-500/25 disabled:shadow-none"
                 >
                   {isSending ? (
                     <RefreshCw size={18} className="animate-spin" />
                   ) : (
                     <>
                       <Send size={18} />
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

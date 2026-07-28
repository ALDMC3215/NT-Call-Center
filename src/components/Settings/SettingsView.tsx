import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, RefreshCw, PhoneOff, Upload, Briefcase, Download, Send, History, X, MessageSquare, Inbox, Lock, Trash2, Info } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { customToast as toast } from '../UI/toast';
import { useLocale } from '../../hooks/useLocale';
import { supabase } from '../../lib/supabase';
import { parseContactsFile } from '../../utils/contactFileImport';
import { motion, AnimatePresence } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { setCurrentView, setActiveCallTab, layoutMargin, calls, profile, blacklist, isBlacklisted, bulkAddCalls } = useAppContext();
  const { tr, direction } = useLocale();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [managerLoadState, setManagerLoadState] = useState<'idle' | 'loading' | 'success' | 'error' | 'rpc_missing'>('idle');
  const [activeManagers, setActiveManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<any>(null);

  const activeCount = calls.filter(c => c.status === 'active' || c.status === 'pending').length;

  const fetchManagers = useCallback(async () => {
    setManagerLoadState('loading');
    const { data, error } = await supabase.from('profiles').select('id, name:full_name').eq('role', 'admin');
    if (error) {
      setManagerLoadState('error');
    } else {
      setActiveManagers(data || []);
      setManagerLoadState('success');
    }
  }, []);

  useEffect(() => {
    if (isShareModalOpen && managerLoadState === 'idle') {
      fetchManagers();
    }
  }, [isShareModalOpen, managerLoadState, fetchManagers]);

  const handleSendToManager = async () => {
    if (!selectedManagerId) return;
    setIsSending(true);
    
    const activeCalls = calls.filter(c => c.status === 'active' || c.status === 'pending');
    const { error } = await supabase.from('followup_shares').insert({
        sender_expert_id: profile?.id,
        receiver_manager_id: selectedManagerId,
        item_count: activeCalls.length,
        payload_json: activeCalls
    });
    
    setIsSending(false);
    if (error) {
        toast.error(tr('خطا در ارسال پیگیری‌ها', 'Error sending follow-ups'));
    } else {
        toast.success(tr('ارسال با موفقیت انجام شد', 'Send successful'));
        setLastSent({ sent_at: new Date().toISOString(), receiver_manager_id: selectedManagerId, item_count: activeCalls.length });
        setIsShareModalOpen(false);
    }
  };

  const handleDownloadExcel = () => {
    const activeCalls = calls.filter(c => c.status === 'active' || c.status === 'pending');
    import('../../utils/followupExcel').then(({ exportFollowupsToExcel }) => {
        exportFollowupsToExcel(activeCalls, activeCount);
    }).catch(err => {
        console.error(err);
        toast.error(tr('خطا در دانلود فایل', 'Error downloading file'));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;

    try {
      const result = await parseContactsFile(file, { isBlacklisted });

      if (result.contacts.length === 0) {
        return toast.error(tr('شماره معتبری یافت نشد.', 'No valid number found.'));
      }

      try {
        await bulkAddCalls(result.contacts);

        const skipped = result.duplicateCount + result.blacklistedCount;
        if (skipped > 0) {
          toast.success(tr(`تعداد ${result.contacts.length} شماره اضافه شد و ${skipped} شماره تکراری یا در لیست سیاه نادیده گرفته شد.`, `${result.contacts.length} added, ${skipped} skipped.`));
        } else {
          toast.success(tr(`تعداد ${result.contacts.length} شماره با موفقیت از اکسل اضافه شد.`, `${result.contacts.length} numbers added from Excel.`));
        }
      } catch (err) {
        console.error(err);
        toast.error(tr('شمارهها از فایل خوانده شدند، اما ثبت آنها در سامانه انجام نشد. دوباره تلاش کنید.', 'Numbers read, but cloud import failed. Try again.'));
      }
    } catch (error) {
      console.error(error);
      toast.error(tr('خطا در خواندن فایل اکسل.', 'Error reading excel file.'));
    }
  };




  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar flex flex-col items-center justify-center pt-4 pb-32 bg-slate-50 dark:bg-[#0f1419] px-4 md:px-8" dir={direction}>
      
      {/* Title */}
      <div className="w-full flex flex-col items-center text-center mt-6">
        <div className="w-20 h-20 bg-white dark:bg-[#171e27] rounded-3xl flex items-center justify-center text-slate-800 dark:text-[#f3f5f7] mb-6 shadow-sm border border-slate-200 dark:border-[#2b3745]">
           <Settings size={40} className="text-indigo-600 dark:text-indigo-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-[#f3f5f7] mb-3 tracking-tight">{tr('تنظیمات', 'Settings')}</h1>
      </div>

      <div className="w-full max-w-2xl mt-12">
         <div className="bg-blue-50 dark:bg-[#162744] border border-blue-200 dark:border-[#223d6a] rounded-3xl p-6 md:p-8 flex flex-col items-center text-center gap-4 shadow-sm">
            <div className="w-14 h-14 bg-blue-100 dark:bg-[#1c3359] text-blue-600 dark:text-[#81a5ff] rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-blue-200/50 dark:border-[#223d6a]/50">
               <Info size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-blue-900 dark:text-[#a0bcff] mb-1">اطلاعیه به‌روزرسانی سیستم</h3>
            <p className="text-[15px] font-bold text-blue-700/80 dark:text-[#81a5ff]/80 leading-relaxed max-w-lg">
               کارشناس گرامی، در نسخه جدید، گزینه‌های این بخش برای دسترسی سریع‌تر به پنل کارشناسان منتقل شده‌اند:
            </p>
            <ul className="text-[14px] font-extrabold text-blue-900 dark:text-[#e8edf3] flex flex-col gap-4 mt-6 text-right w-full bg-white/60 dark:bg-[#0f1419]/40 p-6 rounded-2xl border border-blue-100/50 dark:border-[#223d6a]/30">
               <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> <span><b>ورود فایل اکسل:</b> به بالای جدول لیست شماره‌ها منتقل شد.</span></li>
               <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> <span><b>لیست سیاه:</b> به تب‌های بالای پنل کارشناسان اضافه شد.</span></li>
               <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> <span><b>ارسال به مدیر و خروجی اکسل:</b> در آپدیت‌های بعدی جایگزین خواهند شد.</span></li>
               <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> <span><b>به‌روزرسانی دوره‌ها:</b> موقتاً از دسترس خارج شده است.</span></li>
            </ul>
         </div>
      </div>
    </div>
  );
};

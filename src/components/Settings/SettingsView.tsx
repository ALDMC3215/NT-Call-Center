import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, RefreshCw, PhoneOff, Upload, Briefcase, Download, Send, History, X, MessageSquare, Inbox, Lock, Trash2 } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../data/courses';
import { fetchCourseDataDynamic } from '../../utils/scraper';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { customToast as toast } from '../UI/toast';
import { useLocale } from '../../hooks/useLocale';
import * as xlsx from 'xlsx';
import { getActiveFollowups, buildFollowUpSnapshot } from '../../utils/followups';
import { exportFollowupsToExcel } from '../../utils/followupExcel';
import { supabase } from '../../lib/supabase';
import { parseContactsFile } from '../../utils/contactFileImport';
import { motion, AnimatePresence } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { setCurrentView, setActiveCallTab, layoutMargin, calls, profile, blacklist, isBlacklisted, bulkAddCalls } = useAppContext();
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

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [activeMessageManagerId, setActiveMessageManagerId] = useState('');
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);

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

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true);
    const { data, error } = await supabase.rpc('get_today_followup_messages');
    if (!error && data) setMessages(data);
    setMessagesLoading(false);
  }, []);

  useEffect(() => {
    if (profile) {
      fetchManagers();
      fetchLastSent();
      loadMessages();
    }
  }, [profile, loadMessages]);



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

  const handleMarkRead = async (msgId: string) => {
    await supabase.rpc('mark_followup_message_read', { p_message_id: msgId });
    await loadMessages();
  };

  const openThread = async (managerId: string) => {
    setActiveMessageManagerId(managerId);
    setIsMessagesModalOpen(true);
    const unread = messages.filter(m => m.sender_id === managerId && !m.read_at);
    for (const msg of unread) {
      await handleMarkRead(msg.id);
    }
  };

  const handleSendMessage = async () => {
    if (!activeMessageManagerId) return toast.error(tr('ارتباطی انتخاب نشده است.', 'No thread selected.'));
    if (!messageBody.trim()) return toast.error(tr('متن پیام نمی‌تواند خالی باشد.', 'Message body cannot be empty.'));

    setIsSendingMsg(true);
    const trimmedMessageBody = messageBody.trim();
    const { error } = await supabase.rpc('send_followup_message', {
      p_recipient_id: activeMessageManagerId,
      p_body: trimmedMessageBody
    });
    setIsSendingMsg(false);

    if (error) {
      console.error(error);
      toast.error(tr('ارسال پیام انجام نشد. دوباره تلاش کنید.', 'Sending message failed.'));
    } else {
      toast.success(tr('پیام با موفقیت ارسال شد.', 'Message sent successfully.'));
      setMessageBody('');
      await loadMessages();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMessagesModalOpen) setIsMessagesModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMessagesModalOpen]);

  return (
    <div className="w-full h-full overflow-y-auto hide-scrollbar flex flex-col items-center pt-4 pb-32 bg-slate-50 px-4 md:px-8" dir={direction}>
      
      {/* Title */}
      <div className="w-full flex flex-col items-center mb-12 text-center mt-6">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-800 mb-6 shadow-sm border border-slate-200">
           <Settings size={40} className="text-indigo-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">{tr('ابزارها و تنظیمات', 'Tools & Settings')}</h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">{tr('مدیریت داده‌ها، به‌روزرسانی سیستم و تبادل پیگیری‌ها در این بخش انجام می‌شود.', 'Data management, system update and follow-up exchange is done here.')}</p>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-6">



        {/* --- ROW 1 --- */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main quick-actions area */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-500" />
              {tr('ابزارهای کاری', 'Working Tools')}
            </h3>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center p-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-md hover:bg-brand-100 transition-colors w-full gap-3 text-right group">
                <div className="w-10 h-10 bg-brand-600 text-white rounded-md flex items-center justify-center shrink-0">
                  <Upload size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{tr('ورود فایل اکسل', 'Import Excel')}</span>
                  <span className="text-[11px] text-brand-600 font-medium mt-0.5">{tr('وارد کردن لیست شماره‌های جدید برای تماس', 'Import new contact numbers list')}</span>
                </div>
              </button>

              <div className="flex flex-col gap-3">
                <button onClick={() => setCurrentView('blacklist')} className="flex items-center p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-white hover:border-slate-300 transition-colors gap-3 text-right">
                  <div className="w-8 h-8 rounded-md bg-slate-200/50 text-slate-600 flex items-center justify-center shrink-0">
                    <PhoneOff size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{tr('لیست سیاه', 'Blacklist')}</span>
                  </div>
                </button>

                <button onClick={() => setCurrentView('trash')} className="flex items-center p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-white hover:border-slate-300 transition-colors gap-3 text-right">
                  <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <Trash2 size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{tr('سطل زباله', 'Trash')}</span>
                  </div>
                </button>
              </div>

              <button onClick={() => { if(!isSyncing) handleSyncData(); }} disabled={isSyncing} className="flex items-center p-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-md hover:bg-white hover:border-teal-300 transition-colors gap-3 disabled:opacity-70 text-right">
                <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{tr('به‌روزرسانی دوره‌ها', 'Sync Courses')}</span>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {isSyncing ? `${tr('در حال دریافت...', 'Fetching...')} ${syncProgress}%` : tr('دریافت آخرین قیمت‌های دوره‌ها از وب‌سایت', 'Get latest course prices')}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Follow-up Exchange Area */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Send size={20} className="text-brand-500" />
              {tr('تبادل پیگیری‌ها', 'Follow-up Exchange')}
            </h3>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 h-full hover:shadow-md transition-shadow">
              <button
                onClick={() => {
                  if (activeCount > 0) setIsShareModalOpen(true);
                  else toast.error(tr('شما هیچ پیگیری فعالی ندارید.', 'You have no active follow-ups.'));
                }}
                className={`flex items-center p-3 border ${activeCount > 0 ? 'border-brand-200 bg-brand-50/30 text-brand-700 hover:border-brand-300 hover:bg-brand-50' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-80'} rounded-md transition-colors gap-3 text-right w-full`}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${activeCount > 0 ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Send size={18} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-sm truncate">{tr('ارسال به مدیر', 'Send to Manager')}</span>
                  <span className="text-[11px] font-medium mt-0.5 opacity-80 line-clamp-1">{tr('اشتراک‌گذاری پیگیری‌های فعال', 'Share active follow-ups')}</span>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadExcel}
                  className={`flex items-center p-3 bg-slate-50 border ${activeCount > 0 ? 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-white' : 'border-slate-100 text-slate-400 cursor-not-allowed'} rounded-md transition-colors gap-3 text-right`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${activeCount > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                    <Download size={16} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-[11px] truncate">{tr('اکسل', 'Excel')}</span>
                  </div>
                </button>

                <button
                  onClick={handleDownloadFollowups}
                  className={`flex items-center p-3 bg-slate-50 border ${activeCount > 0 ? 'border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-white' : 'border-slate-100 text-slate-400 cursor-not-allowed'} rounded-md transition-colors gap-3 text-right`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${activeCount > 0 ? 'bg-slate-200/50 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Download size={16} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-[11px] truncate">{tr('جیسون', 'JSON')}</span>
                  </div>
                </button>
              </div>

              {lastSent && (
                <div className="flex flex-col mt-auto p-3 bg-slate-50 rounded-md border border-slate-200">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[12px]">
                      <History size={14} />
                      <span>{tr('آخرین ارسال', 'Last Sent')}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500" dir="ltr">{new Date(lastSent.sent_at).toLocaleString('fa-IR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] text-slate-600 font-medium">
                     <span>به: {activeManagers.find(m => m.id === lastSent.receiver_manager_id)?.name || 'مدیر'}</span>
                     <span className="font-bold text-slate-800">{lastSent.item_count} مورد</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- ROW 2 --- */}
        <div className="w-full grid grid-cols-1 gap-6 items-start">

          {/* Manager Messages Area */}
          <div className="flex flex-col gap-4 min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-500" />
              {tr('پیام‌های مدیر', 'Manager Messages')}
              {messages.filter(m => m.recipient_id === profile?.id && !m.read_at).length > 0 && (
                <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold mr-2">
                  {messages.filter(m => m.recipient_id === profile?.id && !m.read_at).length} {tr('جدید', 'New')}
                </span>
              )}
            </h3>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
              {messagesLoading ? (
                <div className="flex justify-center py-6 h-full items-center"><RefreshCw size={20} className="animate-spin text-slate-300" /></div>
              ) : messages.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-2">
                   <Inbox size={24} className="text-slate-300" />
                   <p className="text-[13px] font-bold text-slate-400">{tr('امروز پیامی ارسال یا دریافت نشده است.', 'No messages today.')}</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from(
                    new Set<string>(
                      messages
                        .map((message) =>
                          message.sender_id === profile?.id
                            ? message.recipient_id
                            : message.sender_id,
                        )
                        .filter((id): id is string => typeof id === 'string' && id.length > 0),
                    ),
                  ).map(managerId => {
                    const threadMessages = messages.filter(m => m.sender_id === managerId || m.recipient_id === managerId);
                    const unreadCount = threadMessages.filter(m => m.recipient_id === profile?.id && !m.read_at).length;
                    const managerName = threadMessages.find(m => m.sender_id === managerId)?.sender_name || threadMessages.find(m => m.recipient_id === managerId)?.recipient_name || 'مدیر';
                    const lastMessage = threadMessages[threadMessages.length - 1];

                    return (
                      <button
                        key={managerId}
                        onClick={() => openThread(managerId)}
                        className="flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-right group h-full"
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-extrabold text-[13px] text-slate-800 truncate">{managerName}</span>
                          {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">{unreadCount} جدید</span>}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                          {lastMessage.message_type === 'share_review' ? 'بررسی لیست پیگیری' : lastMessage.body}
                        </div>
                      </button>
                    );
                  })}
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

      <AnimatePresence>
        {isMessagesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={direction}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMessagesModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><MessageSquare size={20} /></div>
                   <span className="font-extrabold text-slate-900 text-lg">
                     {messages.find(m => m.sender_id === activeMessageManagerId)?.sender_name || messages.find(m => m.recipient_id === activeMessageManagerId)?.recipient_name || 'مدیر'}
                   </span>
                 </div>
                 <button onClick={() => setIsMessagesModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-2 border border-slate-200 transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-3 bg-slate-50/50 hide-scrollbar">
                {messages.filter(m => m.sender_id === activeMessageManagerId || m.recipient_id === activeMessageManagerId).map(m => {
                  const isMine = m.sender_id === profile?.id;

                  if (m.message_type === 'share_review') {
                    const jalaliSentAt = m.related_share_sent_at ? new Date(m.related_share_sent_at).toLocaleString('fa-IR') : '—';
                    const jalaliReviewedAt = new Date(m.created_at).toLocaleString('fa-IR');
                    return (
                      <div key={m.id} className="p-4 rounded-2xl border border-brand-200 bg-brand-50/50 ml-8 text-right">
                        <div className="flex flex-col gap-2">
                          <h4 className="font-extrabold text-sm text-brand-900">لیست پیگیری بررسی شد</h4>
                          <p className="text-sm font-medium text-brand-800">مدیر {m.sender_name} فهرست پیگیری ارسالی شما را بررسی کرد.</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-1 rounded-md border border-slate-200">تعداد پیگیری‌ها: {m.related_share_item_count} مورد</span>
                            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-1 rounded-md border border-slate-200">زمان ارسال لیست: {jalaliSentAt}</span>
                            <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-1 rounded-md border border-slate-200">زمان بررسی: {jalaliReviewedAt}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`p-4 rounded-2xl border ${isMine ? 'bg-indigo-50/50 border-indigo-100 mr-8' : 'bg-white border-slate-200 ml-8'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-xs text-slate-700">{isMine ? tr('شما', 'You') : m.sender_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold" dir="ltr">{new Date(m.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex flex-col gap-3">
                <textarea
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[80px] resize-y"
                  placeholder={tr('پاسخ خود را بنویسید...', 'Type your reply...')}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendMessage}
                    disabled={isSendingMsg || !messageBody.trim()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm disabled:shadow-none"
                  >
                    {isSendingMsg ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    {tr('ارسال پاسخ', 'Send Reply')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

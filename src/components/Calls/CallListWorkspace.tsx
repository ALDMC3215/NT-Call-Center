import React, { useMemo, useState, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { CallRecord, ContactTask, ContactTaskType } from '../../types';
import { CallResultActionModal } from './CallResultActionModal';
import { ContactTaskEditorModal } from './ContactTaskEditorModal';
import { CALL_STATUSES, REGISTRATION_STATUSES } from '../../constants';
import * as Icons from 'lucide-react';
import { PhoneOff, Phone, PhoneForwarded, Link as LinkIcon, BookOpen, Users, CheckCircle2, FileText, Search, XCircle, Filter, X, Check, Plus, Calendar, Eraser, Trash2, Upload, ChevronDown, Ban, ShieldAlert, CalendarDays, Activity, Clock, Route, MessageSquareQuote } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { createPortal } from 'react-dom';
import * as xlsx from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { AdvisoryModal } from './AdvisoryModal';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { Checkbox } from '../UI/checkbox';
import { TableDropdown } from '../Shared/TableDropdown';
import { TableMultiSelect } from '../Shared/TableMultiSelect';
import { BlacklistView } from '../Blacklist/BlacklistView';
import { StatsView } from '../Stats/StatsView';
import { CoursesView } from '../Courses/CoursesView';
import { NegotiationView } from '../Education/NegotiationView';
import { ScheduleView } from '../Education/ScheduleView';
import { IntroTextView } from '../Education/IntroTextView';
import { LearningPathsModal } from '../Shared/LearningPathsModal';
import { OrbitalCardView } from './OrbitalCardView';
import { isActiveFollowup } from '../../utils/followups';
import { jalaliDateTimeToIso } from '../../utils/jalali';

type Tab = 'home' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses';

const getStatusDot = (status: string) => {
  if (status === 'پاسخ داد') return 'bg-teal-500/80';
  if (status === 'پاسخ نداد') return 'bg-amber-400/80';
  if (status === 'ناموجود') return 'bg-rose-400/80';
  return 'bg-slate-300';
};

const getStatusIcon = (status: string) => {
  if (status === 'پاسخ داد') return <Phone size={14} className="text-teal-600/80" />;
  if (status === 'پاسخ نداد') return <PhoneOff size={14} className="text-amber-500/80" />;
  if (status === 'ناموجود') return <PhoneOff size={14} className="text-rose-500/80" />;
  return <Phone size={14} className="text-slate-500" />;
};


const CustomSelect = ({ value, onChange, options, placeholder, className }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const isAbove = spaceBelow < 200;
      setCoords({
        top: isAbove ? rect.top - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
      setIsOpen(true);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all outline-none ${className}`}
      >
        <span className="text-[11px] font-medium text-slate-900 whitespace-nowrap">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={12} className="opacity-50" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute bg-white border border-slate-200 rounded-xl  p-1 z-[101] max-h-60 overflow-y-auto custom-select-scroll flex flex-col gap-0.5"
            style={{
              top: coords.top,
              left: coords.left,
              minWidth: coords.width + 40,
              transform: coords.top < window.innerHeight / 2 ? 'none' : 'translateY(-100%)'
            }}
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {options.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-3 py-2 text-[11px] font-medium rounded-lg transition-colors hover:bg-slate-50 hover:text-slate-900 ${opt.value === value ? 'bg-cyan-50 text-cyan-700' : 'text-slate-500'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
};

const NotesModal = ({ call, isOpen, onClose, onSave }: { call: CallRecord | null; isOpen: boolean; onClose: () => void; onSave: (notes: string) => void }) => {
  const { tr } = useLocale();
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (isOpen && call) {
      setNotes(call.notes || '');
    }
  }, [isOpen, call]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-50/60 " onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-2xl  w-full max-w-md relative z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <span className="font-medium text-slate-900 text-sm">{tr('یادداشت', 'Notes')} — {call?.phone}</span>
          <button onClick={onClose} className="text-muted hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={tr('یادداشت خود را بنویسید...', 'Write your notes here...')}
            rows={6}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none transition-all "
            dir="rtl"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              {tr('لغو', 'Cancel')}
            </button>
            <button
              onClick={() => { onSave(notes); onClose(); }}
              className="h-10 px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {tr('ذخیره', 'Save')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ManualAddModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (phone: string, fullName: string) => void }) => {
  const { tr, direction } = useLocale();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPhone('');
      setFullName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={direction}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-50/40 " />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl  w-full max-w-sm relative z-10 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
               <span className="font-medium text-slate-900">{tr('افزودن دستی شماره', 'Add Number Manually')}</span>
               <button onClick={onClose} className="text-muted hover:text-slate-900"><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-4">
               <div>
                  <label className="text-[12px] font-bold text-slate-600 mb-1.5 block">{tr('شماره موبایل', 'Mobile Number')} <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 px-3 text-[14px] font-medium border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 rounded-xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-left transition-all"
                    placeholder="0912..."
                    dir="ltr"
                  />
               </div>
               <div>
                  <label className="text-[12px] font-bold text-slate-600 mb-1.5 block">{tr('نام و نام خانوادگی', 'Full Name')}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full h-11 px-3 text-[14px] font-medium border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 rounded-xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    placeholder={tr('اختیاری...', 'Optional...')}
                  />
               </div>
               <button onClick={() => {
                  if (!phone.trim()) return toast.error(tr('لطفا شماره را وارد کنید.', 'Please enter a phone number.'));
                  if (phone.length < 10) return toast.error(tr('شماره معتبر نیست.', 'Invalid phone number.'));
                  onAdd(phone, fullName);
                  onClose();
               }} className="w-full mt-2 h-10 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-[13px] transition-colors flex items-center justify-center gap-2">
                 <Plus size={16} />
                 <span>{tr('افزودن به لیست', 'Add to list')}</span>
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};



export const CallListWorkspace = () => {
  const {
    calls,
    isLoadingCalls,
    callsError,
    hasInitialCallsLoaded,
    updateCall,
    deleteCall,
    activeCallTab: activeTab,
    setActiveCallTab,
    addToBlacklist,
    recordAttempt,
    addCall,
    bulkAddCalls,
    profile,
    blacklist,
    layoutMargin,
    setContactWorkList,
    getMyContactTasks,
    recordCallAttemptWithTask,
    updateContactTaskDetails,
    popupView,
    setPopupView
  } = useAppContext();
  const { tr, valueLabel, direction } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [actionModalCall, setActionModalCall] = useState<CallRecord | null>(null);
  const [editModalTask, setEditModalTask] = useState<ContactTask | null>(null);

  const loadTasks = React.useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const data = await getMyContactTasks({ status: 'pending' });
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [getMyContactTasks]);

  React.useEffect(() => { loadTasks(); }, [loadTasks]);

  React.useEffect(() => {
    if (tasks.length > 0) {
      const tehranToday = (new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' }))).toISOString().split('T')[0];
      const consultationTasks = tasks.filter(t => t.task_type === 'consultation_reminder' && t.scheduled_date === tehranToday && t.status === 'pending');
      if (consultationTasks.length > 0) {
        const dismissKey = `consultation_reminder_dismissed_${tehranToday}`;
        if (!localStorage.getItem(dismissKey)) {
          toast.success(`امروز ${consultationTasks.length} مشاوره داری؛ پیگیریشون کن.`, { duration: 8000, icon: '🗓️' });
          localStorage.setItem(dismissKey, 'true');
        }
      }
    }
  }, [tasks]);


  const hasAnyFieldSelected = (c: CallRecord) => {
    return !!(c.callStatus || (c.courses && c.courses.length > 0) || c.advisory || c.registered);
  };

  const [notesModalCall, setNotesModalCall] = useState<CallRecord | null>(null);
  const [advisoryModalCall, setAdvisoryModalCall] = useState<CallRecord | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
             if (blacklist.some(b => b.phone === phoneStr)) {
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
          toast.error(tr(`تعداد ${skippedPhones.length} شماره به دلیل قرار داشتن در لیست سیاه حذف شدند:
${skippedPhones.join(' ، ')}`, `${skippedPhones.length} numbers skipped due to blacklist:
${skippedPhones.join(', ')}`), { duration: 8000 });
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

  const handleManualAdd = (phone: string, fullName: string) => {
    // 1. Blacklist check
    if (blacklist.some(b => b.phone === phone)) {
      toast.error(tr('خطا: این شماره در لیست سیاه قرار دارد و نمی‌تواند اضافه شود.', 'Error: This number is blacklisted and cannot be added.'));
      return;
    }

    const existingCall = calls.find(c => c.phone === phone);
    if (existingCall) {
      // 2. Follow-ups check
      const hasPendingFollowup = tasks.some(t => t.contact_id === existingCall.id && t.status === 'pending' && ['retry_call', 'consultation_reminder', 'other_followup'].includes(t.task_type));
      if (hasPendingFollowup) {
         toast.error(tr('خطا: این شماره در لیست پیگیری‌های شما وجود دارد.', 'Error: This number is in your follow-ups list.'));
         return;
      }
      
      // 3. Queue (New list) check
      const hasAnyAttempt = existingCall.attempts && existingCall.attempts.length > 0;
      if (!hasAnyAttempt) {
         toast.error(tr('خطا: این شماره در لیست جدید شما وجود دارد.', 'Error: This number is in your new list.'));
         return;
      }
    }

    addCall({ phone, fullName });
    toast.success(tr('شماره جدید با موفقیت اضافه شد.', 'New number added successfully.'));
  };

  const handleFieldChange = (call: CallRecord, field: keyof CallRecord, value: any) => {
    updateCall({ ...call, [field]: value });
  };


  const getDayLimits = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const msInDay = 24 * 60 * 60 * 1000;
    return {
      today: todayStr,
      yesterday: new Date(now.getTime() - msInDay).toISOString().split('T')[0]
    };
  };

  const getFollowUpStatus = (isoDate?: string) => {
    if (!isoDate) return { priority: 'none', label: 'بدون زمان', borderCls: 'border-r-slate-200', bgCls: 'bg-slate-50 text-slate-500 border-slate-200' };
    const date = new Date(isoDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() < now.getTime()) {
      return { priority: 'overdue', label: 'عقب‌افتاده', borderCls: 'border-r-rose-500', bgCls: 'bg-rose-50 text-rose-600 border-rose-200' };
    } else if (targetDay.getTime() === today.getTime()) {
      return { priority: 'today', label: 'امروز', borderCls: 'border-r-amber-400', bgCls: 'bg-amber-50 text-amber-600 border-amber-200' };
    } else if (targetDay.getTime() === tomorrow.getTime()) {
      return { priority: 'upcoming', label: 'فردا', borderCls: 'border-r-blue-400', bgCls: 'bg-blue-50 text-blue-600 border-blue-200' };
    } else {
      const d = new DateObject({ date, calendar: persian, locale: persian_fa });
      return {
        priority: 'upcoming',
        label: `${d.format("DD MMMM")} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        borderCls: 'border-r-blue-400', bgCls: 'bg-blue-50 text-blue-600 border-blue-200'
      };
    }
  };

  const handleStatusChange = (call: CallRecord, newStatus: string) => {
    if (newStatus !== 'پاسخ داد') {
      updateCall({ ...call, callStatus: newStatus, courses: [], advisory: undefined, advisoryDate: undefined, advisoryTime: undefined, registered: undefined });
    } else {
      updateCall({ ...call, callStatus: newStatus });
    }
  };

  // Keep an in-flight ref to prevent double-clicks synchronously
  const inFlightSubmit = React.useRef<Set<string>>(new Set());

  const handleRowSubmit = async (call: CallRecord) => {
    if (inFlightSubmit.current.has(call.id)) return;

    const hasNamowjoudAttempt = call.attempts?.some(a => a.callStatus === 'ناموجود');
    if (call.callStatus === 'ناموجود' && hasNamowjoudAttempt) {
      inFlightSubmit.current.add(call.id);
      setSubmittingIds(prev => new Set(prev).add(call.id));
      try {
        addToBlacklist(call.phone, 'ناموجود بودن شماره');
        const deleteSuccess = await deleteCall(call.id);
        if (deleteSuccess) {
          toast.success(tr('شماره ناموجود بود، در لیست سیاه ثبت و حذف شد.', 'Number unavailable, blacklisted and deleted.'));
        } else {
          toast.error(tr('نتیجه ثبت شد، اما حذف شماره انجام نشد. دوباره روی ثبت نتیجه بزنید تا فقط حذف تکمیل شود.', 'Result saved but deletion failed. Press submit again to complete cleanup.'));
        }
      } finally {
        inFlightSubmit.current.delete(call.id);
        setSubmittingIds(prev => {
          const next = new Set(prev);
          next.delete(call.id);
          return next;
        });
      }
      return;
    }

    setActionModalCall(call);
  };

  const handleActionModalSubmit = async (taskData: { taskType: ContactTaskType, scheduledDate?: string, scheduledTime?: string, followupNote?: string }) => {
    if (!actionModalCall) return;
    const call = actionModalCall;
    
    inFlightSubmit.current.add(call.id);
    setSubmittingIds(prev => new Set(prev).add(call.id));
    
    try {
      await recordCallAttemptWithTask({
        contactId: call.id,
        fullName: call.fullName || '',
        callStatus: call.callStatus || '',
        courses: call.courses || [],
        advisory: call.advisory || '',
        advisoryDate: call.advisoryDate || '',
        advisoryTime: call.advisoryTime || '',
        registered: call.registered || '',
        notes: call.notes || '',
        taskType: taskData.taskType,
        scheduledDate: taskData.scheduledDate,
        scheduledTime: taskData.scheduledTime,
        followupNote: taskData.followupNote
      });

      if (call.callStatus === 'ناموجود') {
        addToBlacklist(call.phone, 'ناموجود بودن شماره');
        const deleteSuccess = await deleteCall(call.id);
        if (deleteSuccess) {
          toast.success(tr('شماره ناموجود بود، در لیست سیاه ثبت و حذف شد.', 'Number unavailable, blacklisted and deleted.'));
        } else {
          toast.error(tr('نتیجه ثبت شد، اما حذف شماره انجام نشد. دوباره روی ثبت نتیجه بزنید تا فقط حذف تکمیل شود.', 'Result saved but deletion failed. Press submit again to complete cleanup.'));
        }
      } else {
        toast.success(tr('نتیجه تماس با موفقیت ثبت شد.', 'Call result submitted successfully.'));
        loadTasks();
      }
      setActionModalCall(null);
    } catch (err) {
      console.error(err);
      toast.error(tr('خطا در ثبت نتیجه. لطفاً دوباره تلاش کنید.', 'Error submitting result. Please try again.'));
    } finally {
      inFlightSubmit.current.delete(call.id);
      setSubmittingIds(prev => {
        const next = new Set(prev);
        next.delete(call.id);
        return next;
      });
    }
  };

  const handleEditTaskSubmit = async (taskId: string, data: any) => {
     try {
        await updateContactTaskDetails({
           taskId,
           taskType: data.taskType,
           scheduledDate: data.scheduledDate,
           scheduledTime: data.scheduledTime,
           followupNote: data.followupNote
        });
        toast.success('پیگیری با موفقیت ویرایش شد.');
        setEditModalTask(null);
        loadTasks();
     } catch(err) {
        toast.error('خطا در ویرایش پیگیری');
     }
  };

  const filteredList = useMemo(() => {
    let list = calls;
    const limits = getDayLimits();
    const tehranToday = (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }))).toISOString().split('T')[0];

    if (activeTab === 'today') {
      const todayContactIds = new Set(tasks.filter(t => t.task_type === 'daily_activity' && t.scheduled_date === tehranToday).map(t => t.contact_id));
      list = list.filter(c => todayContactIds.has(c.id));
    } else if (activeTab === 'queue') {
      list = list.filter(c => {
         const hasAttemptToday = c.attempts?.some(a => (a.createdAt || " ").split('T')[0] === limits.today);
         if (hasAttemptToday) return false;

         const hasAnyAttempt = c.attempts && c.attempts.length > 0;
         return !hasAnyAttempt;
      });
    } else if (activeTab === 'followup') {
      return [];
    }

    if (searchQuery.trim()) {
      list = list.filter(c => (c.phone || '').includes(searchQuery) || (c.fullName || '').includes(searchQuery));
    }
    return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [calls, activeTab, searchQuery, tasks]);

  if (isLoadingCalls && !hasInitialCallsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50" dir={direction}>
        <div className="text-slate-500 font-medium">{tr('در حال بارگذاری اطلاعات تماس‌ها از سرور ابری...', 'Loading call data from cloud server...')}</div>
      </div>
    );
  }

  if (callsError && !hasInitialCallsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50" dir={direction}>
        <div className="text-rose-500 font-medium">{callsError}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col pb-4 hide-scrollbar relative bg-slate-50" dir={direction}>
      {callsError && hasInitialCallsLoaded && (
        <div className="w-full max-w-3xl mx-auto mt-4 bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-[13.5px] font-medium text-center border border-rose-200 shadow-sm animate-pulse">
          {callsError}
        </div>
      )}
      {/* Unified Operational Toolbar */}
      <div className="pt-16 md:pt-4 pb-3 w-full flex flex-col md:flex-row gap-3 items-center justify-between px-4 md:pr-6 md:pl-[170px]">
        {/* Right side: Contextual controls (Order 2 on mobile, 1 on desktop) */}
        <div className="order-2 md:order-1 flex items-center gap-3 w-full md:w-[300px] shrink-0 justify-center md:justify-start">
          {activeTab === 'followup' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm h-10">
              <span className="text-[13px] font-extrabold text-slate-800">پیگیری‌های من</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-brand-100 text-brand-700">{filteredList.length}</span>
            </div>
          )}
          {activeTab === 'queue' && (
            <>
              <button
                onClick={() => {
                  setConfirmModalConfig({
                    isOpen: true,
                    title: tr('حذف تمامی شماره‌ها', 'Delete all numbers'),
                    message: tr('آیا مطمئن هستید که می‌خواهید همه شماره‌های این لیست را حذف کنید؟', 'Are you sure you want to delete all?'),
                    onConfirm: () => {
                      calls.filter(c => filteredList.some(f => f.id === c.id)).forEach(c => deleteCall(c.id));
                      toast.success(tr('لیست پاک شد.', 'List cleared.'));
                    }
                  });
                }}
                className="h-10 px-3 rounded-xl bg-white text-rose-600 flex items-center justify-center hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all font-bold text-[13px] gap-1.5 shadow-sm"
              >
                <Trash2 size={15} /> <span className="hidden sm:inline">{tr('حذف همه', 'Delete All')}</span>
              </button>
              <button
                onClick={() => setIsManualAddOpen(true)}
                className="h-10 px-4 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition-all font-bold text-[13px] gap-1.5 border border-brand-200 shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} /> {tr('افزودن دستی', 'Add manually')}
              </button>
            </>
          )}
        </div>

        {/* Center: Search (Order 1 on mobile, 2 on desktop) */}
        <div className="order-1 md:order-2 relative w-full max-w-md group mx-auto">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500/60 group-focus-within:text-brand-500 transition-colors">
              <Search size={16} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'courses' ? tr('جستجو در دوره‌ها...', 'Search courses...') : tr('جستجو در شماره‌ها و نام‌ها...', 'Search numbers and names...')}
              dir={direction}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl pr-10 pl-10 text-[13px] font-medium text-slate-900 placeholder:text-slate-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-muted hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
        </div>

        {/* Left side: Spacer for centering */}
        <div className="hidden md:block order-3 w-[300px]"></div>
      </div>

      {/* Quick Access Bar */}
      <div className="w-full flex items-center justify-center gap-3 flex-wrap px-4 md:px-6 pb-4">
         <a href="?view=dashboard&tab=followup" onClick={e => { e.preventDefault(); setPopupView(popupView === 'followup' ? null : 'followup'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'followup' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <Clock size={16} className="text-amber-500" />
            پیگیری‌ها
         </a>
         <a href="?view=dashboard&tab=stats" onClick={e => { e.preventDefault(); setPopupView(popupView === 'stats' ? null : 'stats'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'stats' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <Activity size={16} className="text-teal-500" />
            فعالیت روزانه
         </a>
         <a href="?view=dashboard&tab=courses" onClick={e => { e.preventDefault(); setPopupView(popupView === 'courses' ? null : 'courses'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'courses' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <BookOpen size={16} className="text-blue-500" />
            دوره‌ها و قیمت‌ها
         </a>
         <a href="?view=home" onClick={e => { e.preventDefault(); setPopupView(popupView === 'learning_paths' ? null : 'learning_paths'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'learning_paths' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <Route size={16} className="text-purple-500" />
            مسیرهای یادگیری
         </a>
         <a href="?view=negotiation" onClick={e => { e.preventDefault(); setPopupView(popupView === 'negotiation' ? null : 'negotiation'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'negotiation' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <ShieldAlert size={16} className="text-rose-500" />
            تکنیک‌های مذاکره
         </a>
         <a href="?view=schedule" onClick={e => { e.preventDefault(); setPopupView(popupView === 'schedule' ? null : 'schedule'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'schedule' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <CalendarDays size={16} className="text-indigo-500" />
            برنامه کلاسی
         </a>
         <a href="?view=intro" onClick={e => { e.preventDefault(); setPopupView(popupView === 'intro' ? null : 'intro'); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-colors text-[13px] font-bold ${popupView === 'intro' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
            <MessageSquareQuote size={16} className="text-pink-500" />
            متن معرفی
         </a>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 w-full min-h-0 flex items-stretch gap-4 pb-4 px-4 md:px-6" >
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="relative h-fit max-h-full bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">

          <div className="min-h-0 overflow-x-auto overflow-y-auto custom-select-scroll relative z-10">
            {/* Compact Table View */}
            <table className="w-full text-center border-collapse table-fixed min-w-[950px]">
              <colgroup>
                <col className="w-[160px]" /> {/* Phone/Name */}
                <col className="w-[140px]" /> {/* Call Status */}
                <col className="w-[200px]" /> {/* Courses */}
                <col className="w-[120px]" /> {/* Consultation */}
                <col className="w-[140px]" /> {/* Registration */}
                <col className="w-[150px]" /> {/* Date/Time */}
                <col className="w-[110px]" /> {/* Actions */}
              </colgroup>
              <thead className="sticky top-0 bg-slate-100 border-b-2 border-slate-200 z-20">
                <tr>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('شماره تماس', 'Phone')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('وضعیت تماس', 'Call Status')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('دوره‌ها', 'Courses')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('مشاوره حضوری', 'Consultation')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('ثبت‌نام', 'Registration')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('تاریخ و ساعت', 'Date & Time')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide">{tr('عملیات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="text-[13px] font-medium text-slate-800 relative z-0">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24">
                      {/* Spacer to give height for the absolute empty state overlay */}
                    </td>
                  </tr>
                ) : (
                filteredList.map((c, i) => {
                  const fuStatus = activeTab === 'followup' ? getFollowUpStatus(c.nextFollowUpAt) : null;
                  return (
                  <React.Fragment key={c.id}>
                  <tr
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors duration-300 group ${fuStatus ? `border-r-4 ${fuStatus.borderCls}` : ''}`}
                  >
                    {/* Phone */}
                    <td className="py-2 px-1.5 relative whitespace-nowrap">
                       <div className="flex flex-col items-center justify-center w-full px-2">
                          <span dir="ltr" className="font-black text-[15px] tracking-wider text-slate-900 group-hover:text-cyan-600 transition-colors">{c.phone}</span>
                          <input
                            type="text"
                            value={c.fullName || ''}
                            onChange={e => handleFieldChange(c, 'fullName', e.target.value)}
                            placeholder={tr('نام شخص...', 'Name...')}
                            className="text-[12px] font-medium text-slate-700 text-center bg-transparent border-b border-transparent hover:border-slate-200 focus:border-cyan-500 outline-none w-32 mt-1 transition-colors placeholder:text-slate-500"
                          />
                          {fuStatus && (
                            <div className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${fuStatus.bgCls}`}>
                              {fuStatus.label}
                            </div>
                          )}
                       </div>
                    </td>

                    {/* Call Status */}
                    <td className="py-2 px-1.5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-1.5">
                          {getStatusIcon(c.callStatus || '')}
                          <TableDropdown
                            value={c.callStatus || ''}
                            onChange={(val) => handleStatusChange(c, val)}
                            options={CALL_STATUSES.map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('وضعیت تماس', 'Status')}
                          />
                       </div>
                    </td>

                    {/* Courses */}
                    <td className="py-2 px-1.5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-1.5">
                          <BookOpen size={14} className="text-muted shrink-0" />
                          <div className="flex-1 min-w-0">
                            <TableMultiSelect
                              values={c.courses || []}
                              onChange={(vals) => handleFieldChange(c, 'courses', vals)}
                              disabled={c.callStatus !== 'پاسخ داد'}
                              placeholder={tr('انتخاب دوره', 'Select course')}
                            />
                          </div>
                       </div>
                    </td>

                    {/* Consultation */}
                    <td className="py-2 px-1.5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-1.5">
                          <Users size={14} className="text-muted shrink-0" />
                          <TableDropdown
                            value={c.advisory || ''}
                            onChange={(val) => handleFieldChange(c, 'advisory', val)}
                            disabled={c.callStatus !== 'پاسخ داد'}
                            options={['بله', 'خیر', 'هماهنگی بعدا'].map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('مشاوره', 'Consultation')}
                          />
                       </div>
                    </td>

                    {/* Registration */}
                    <td className="py-2 px-1.5 relative whitespace-nowrap">
                       <div className="flex items-center gap-1.5 w-[140px] justify-center">
                          {c.registered === 'ثبت نام کرد' ? (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          ) : (
                            <FileText size={16} className="text-slate-400 shrink-0" />
                          )}
                          <TableDropdown
                            value={c.registered || ''}
                            onChange={(val) => handleFieldChange(c, 'registered', val)}
                            disabled={c.callStatus !== 'پاسخ داد'}
                            options={REGISTRATION_STATUSES.map(s => ({ value: s, label: s }))}
                            placeholder={tr('ثبت‌نام', 'Registration')}
                          />
                       </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-2 px-1.5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center">
                          {c.advisory === 'بله' ? (
                             <button
                               onClick={() => setAdvisoryModalCall(c)}
                               className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors border border-brand-100 hover:border-brand-200 min-w-[120px] shadow-sm"
                               dir="ltr"
                             >
                               {c.advisoryDate && c.advisoryTime ? (
                                 <>
                                   <Calendar size={14} className="opacity-70 shrink-0" />
                                   <span className="truncate">{c.advisoryDate} &middot; {c.advisoryTime}</span>
                                 </>
                               ) : (
                                 <>
                                   <Calendar size={14} className="opacity-70 shrink-0" />
                                   <span dir="rtl" className="truncate">{tr('انتخاب زمان', 'Select time')}</span>
                                 </>
                               )}
                             </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                       </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-1.5 relative">
                       <div className="flex items-center justify-center gap-1.5">
                           <button
                             onClick={() => handleRowSubmit(c)}
                             disabled={!hasAnyFieldSelected(c) || submittingIds.has(c.id)}
                             aria-label={tr('ثبت نتیجه', 'Submit result')}
                             className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm tooltip-trigger shrink-0 ${hasAnyFieldSelected(c) ? 'bg-brand-600 text-white hover:bg-brand-500 hover:shadow shadow-brand-600/20' : 'bg-slate-100 text-slate-400 opacity-60 border border-slate-200'}`}
                             title={tr('ثبت نتیجه', 'Submit result')}
                           >
                             {submittingIds.has(c.id) ? <Icons.Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
                           </button>
                           <button
                             onClick={() => {
                                setConfirmModalConfig({
                                  isOpen: true,
                                  title: tr('افزودن به لیست سیاه', 'Add to blacklist'),
                                  message: tr('آیا مطمئن هستید که می‌خواهید این شماره را به لیست سیاه اضافه کنید؟ با این کار شماره از لیست فعلی حذف می‌شود.', 'Are you sure you want to add this number to the blacklist? It will be removed from the current list.'),
                                  onConfirm: () => {
                                     addToBlacklist(c.phone);
                                     deleteCall(c.id);
                                     toast.success(tr('شماره به لیست سیاه اضافه شد.', 'Number added to blacklist.'));
                                  }
                                });
                             }}
                             className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-800 tooltip-trigger shrink-0"
                             title={tr('افزودن به لیست سیاه', 'Add to blacklist')}
                           >
                              <Ban size={16} />
                           </button>
                           <button
                             onClick={() => {
                                setConfirmModalConfig({
                                  isOpen: true,
                                  title: tr('حذف شماره', 'Delete number'),
                                  message: tr('آیا مطمئن هستید که می‌خواهید این شماره را برای همیشه حذف کنید؟', 'Are you sure you want to delete this number?'),
                                  onConfirm: () => {
                                     deleteCall(c.id);
                                     toast.success(tr('شماره حذف شد.', 'Number deleted.'));
                                  }
                                });
                             }}
                             className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-transparent text-slate-500 hover:bg-rose-100 hover:text-rose-600 tooltip-trigger shrink-0"
                             title={tr('حذف شماره', 'Delete number')}
                           >
                              <Trash2 size={16} />
                           </button>
                       </div>
                    </td>
                  </tr>

                  </React.Fragment>
                  );
                })
              )}
              </tbody>
            </table>


            {filteredList.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500">
                  {activeTab === 'followup' ? (
                    <>
                      <CheckCircle2 size={56} className="mb-4 text-emerald-300 opacity-50" />
                      <p className="font-bold text-slate-700 text-lg mb-2">{tr('فعلاً پیگیری فعالی نداری', 'No active follow-ups')}</p>
                      <p className="font-medium text-slate-500">{tr('شماره‌هایی که نیاز به تماس دوباره دارند، اینجا نمایش داده می‌شوند.', 'Contacts needing another call will appear here.')}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                        <Filter size={28} className="text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-600 text-[15px] mb-2">{tr('هیچ داده‌ای یافت نشد', 'No data found')}</p>
                      <p className="text-[13px] text-slate-400 font-medium max-w-sm text-center">{tr('برای این بخش هنوز اطلاعاتی ثبت نشده یا فیلترهای جستجو نتیجه‌ای نداشتند.', 'No information recorded yet or search yielded no results.')}</p>
                    </>
                  )}

                  {activeTab === 'queue' && (
                    <button
                      onClick={() => setIsManualAddOpen(true)}
                      className="h-11 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-[14px] transition-colors flex items-center justify-center gap-2 pointer-events-auto shadow-sm"
                    >
                      <Plus size={18} />
                      {tr('افزودن شماره', 'Add number')}
                    </button>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
      </div>
      <CallResultActionModal 
        isOpen={!!actionModalCall} 
        onClose={() => setActionModalCall(null)} 
        onSubmit={handleActionModalSubmit} 
        isSubmitting={submittingIds.has(actionModalCall?.id || '')} 
        call={actionModalCall}
        activeTab={activeTab}
      />
      {editModalTask && <ContactTaskEditorModal isOpen={!!editModalTask} onClose={() => setEditModalTask(null)} task={editModalTask} onSubmit={handleEditTaskSubmit} isSubmitting={false} />}
      <NotesModal
        call={notesModalCall}
        isOpen={!!notesModalCall}
        onClose={() => setNotesModalCall(null)}
        onSave={(notes) => {
          if (notesModalCall) handleFieldChange(notesModalCall, 'notes', notes);
        }}
      />
      <AdvisoryModal
        call={advisoryModalCall}
        isOpen={!!advisoryModalCall}
        onClose={() => setAdvisoryModalCall(null)}
        onSave={(date, time) => {
          if (advisoryModalCall) {
             const scheduledAdvisory = date && time ? jalaliDateTimeToIso(date, time) : undefined;
             const s = advisoryModalCall.callStatus;
             const r = advisoryModalCall.registered;
             let needsFollowUp = false;
             if (s === 'پاسخ نداد') needsFollowUp = true;
             else if (s === 'پاسخ داد' && r !== 'ثبت نام کرد') needsFollowUp = true;

             let newFollowUpAt = advisoryModalCall.nextFollowUpAt;
             if (scheduledAdvisory) {
               newFollowUpAt = scheduledAdvisory;
             } else if (!needsFollowUp) {
               newFollowUpAt = undefined;
             }

             updateCall({
               ...advisoryModalCall,
               advisoryDate: date,
               advisoryTime: time,
               nextFollowUpAt: newFollowUpAt
             });
          }
        }}
      />
      <ManualAddModal
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onAdd={handleManualAdd}
      />
      <ConfirmDialog
        isOpen={confirmModalConfig.isOpen}
        onCancel={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
      />
      {/* Render Quick Access Modals */}
      <AnimatePresence>
        {popupView && popupView !== 'learning_paths' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" dir="rtl">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPopupView(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-50 rounded-3xl w-full h-full max-w-[1400px] relative z-10 overflow-hidden flex flex-col shadow-2xl border border-slate-200">
               <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                 {popupView === 'negotiation' && <NegotiationView isModal={true} onClose={() => setPopupView(null)} />}
                 {popupView === 'schedule' && <ScheduleView isModal={true} onClose={() => setPopupView(null)} />}
                 {popupView === 'stats' && <StatsView isModal={true} onClose={() => setPopupView(null)} />}
                 {popupView === 'courses' && <CoursesView isModal={true} onClose={() => setPopupView(null)} />}
                 {popupView === 'intro' && <IntroTextView isModal={true} onClose={() => setPopupView(null)} />}
                 {popupView === 'followup' && (
                   <div className="flex flex-col h-full bg-[#F8FAFC]">
                     <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                           <Clock size={22} strokeWidth={2.5} />
                         </div>
                         <div>
                           <h1 className="text-lg font-black text-slate-800">لیست پیگیری‌ها</h1>
                           <p className="text-xs font-medium text-slate-500 mt-0.5">مدیریت تماس‌های معلق و برنامه‌ریزی شده</p>
                         </div>
                       </div>
                       <button onClick={() => setPopupView(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                         <X size={16} strokeWidth={2.5} />
                       </button>
                     </div>
                     <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                       <div className="max-w-[1200px] mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                         <table className="w-full text-right border-separate border-spacing-y-2 min-w-[700px] p-2">
                           <thead>
                             <tr className="text-slate-500 text-[11px] font-bold pb-2">
                               <th className="px-3 pb-2 w-[150px]">شماره تماس</th>
                               <th className="px-3 pb-2 min-w-[150px]">نام</th>
                               <th className="px-3 pb-2 w-[150px] text-center">برچسب پیگیری</th>
                               <th className="px-3 pb-2 w-[200px] text-center">تاریخ و ساعت</th>
                               <th className="px-3 pb-2 w-[100px] text-center">عملیات</th>
                             </tr>
                           </thead>
                           <tbody>
                             {tasks.filter(t => ['retry_call', 'consultation_reminder', 'other_followup'].includes(t.task_type) && t.status === 'pending').sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || '')).map(task => {
                               const contact = calls.find(c => c.id === task.contact_id);
                               if (!contact) return null;
                               let tagColor = 'bg-slate-100 text-slate-700';
                               let tagLabel = 'سایر';
                               if (task.task_type === 'retry_call') { tagColor = 'bg-amber-100 text-amber-700 border border-amber-200'; tagLabel = 'تماس مجدد'; }
                               else if (task.task_type === 'consultation_reminder') { tagColor = 'bg-blue-100 text-blue-700 border border-blue-200'; tagLabel = 'تماس مشاوره'; }
                               else if (task.task_type === 'other_followup') { tagColor = 'bg-purple-100 text-purple-700 border border-purple-200'; tagLabel = 'سایر'; }

                               return (
                                 <tr key={task.id} className="group hover:bg-slate-50 transition-colors bg-white">
                                   <td className="px-3 py-2 border-y border-r border-slate-100 rounded-r-xl">
                                     <div className="flex items-center gap-2">
                                       <Phone size={14} className="text-slate-400" />
                                       <span className="font-semibold text-slate-700 text-[13px]">{contact.phone}</span>
                                     </div>
                                   </td>
                                   <td className="px-3 py-2 border-y border-slate-100">
                                     <span className="font-bold text-slate-800 text-[13px]">{contact.fullName || 'ثبت نشده'}</span>
                                   </td>
                                   <td className="px-3 py-2 border-y border-slate-100 text-center">
                                     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${tagColor}`}>
                                       {tagLabel}
                                     </span>
                                   </td>
                                   <td className="px-3 py-2 border-y border-slate-100 text-center">
                                     {task.scheduled_date ? (
                                       <div className="flex flex-col items-center justify-center">
                                         <div className="flex items-center gap-1.5 text-slate-600">
                                           <Calendar size={12} className="text-brand-500" />
                                           <span className="font-bold text-[12px]">{task.scheduled_date}</span>
                                         </div>
                                         {task.scheduled_time && (
                                           <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                                             <Clock size={12} />
                                             <span className="font-semibold text-[11px]">{task.scheduled_time}</span>
                                           </div>
                                         )}
                                       </div>
                                     ) : (
                                       <span className="text-slate-400 text-[12px]">-</span>
                                     )}
                                   </td>
                                   <td className="px-3 py-2 border-y border-l border-slate-100 rounded-l-xl text-center">
                                     <button 
                                       onClick={() => {
                                         setPopupView(null);
                                         setSearchQuery(contact.phone);
                                         setActiveCallTab('cards');
                                       }}
                                       className="h-8 px-3 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-all text-[12px] font-bold inline-flex items-center gap-1"
                                     >
                                       <Search size={14} />
                                       مشاهده
                                     </button>
                                   </td>
                                 </tr>
                               );
                             })}
                           </tbody>
                         </table>
                         {tasks.filter(t => ['retry_call', 'consultation_reminder', 'other_followup'].includes(t.task_type) && t.status === 'pending').length === 0 && (
                           <div className="flex flex-col items-center justify-center py-12 px-4">
                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                               <Check size={20} className="text-slate-300" />
                             </div>
                             <h3 className="text-sm font-bold text-slate-600">پیگیری معلقی وجود ندارد</h3>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {popupView === 'learning_paths' && (
        <LearningPathsModal isOpen={true} onClose={() => setPopupView(null)} />
      )}
    </div>
  );
};



import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { toJalali } from '../../utils/jalali';
import { useLocale } from '../../hooks/useLocale';
import { CallRecord, ContactTask, ContactTaskType } from '../../types';
import { CallResultActionModal } from './CallResultActionModal';
import { ContactTaskEditorModal } from './ContactTaskEditorModal';
import { CALL_STATUSES, REGISTRATION_STATUSES } from '../../constants';
import * as Icons from 'lucide-react';
import { PhoneOff, Phone, PhoneForwarded, List, Link as LinkIcon, BookOpen, Users, CheckCircle2, FileText, Search, XCircle, Filter, X, Check, Plus, Calendar, Eraser, Trash2, Upload, ChevronDown, Ban, ShieldAlert, CalendarDays, Activity, Clock, Route, MessageSquareQuote } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { createPortal } from 'react-dom';
import * as xlsx from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { Checkbox } from '../UI/checkbox';
import { TableDropdown } from '../Shared/TableDropdown';
import { TableActionMenu, TableAction } from '../Shared/TableActionMenu';
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
import { matchesSearch } from '../../utils/search';
import { jalaliDateTimeToIso } from '../../utils/jalali';
import { exportConsultationsToExcel } from '../../utils/consultationExcel';
import { COURSE_CATEGORIES } from '../../data/courses';
import { formatPhoneNumber } from '../../utils/format';

const CourseAutocomplete = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const ALL_COURSES = useMemo(() => {
    const titles = new Set<string>();
    COURSE_CATEGORIES.forEach(cat => {
      cat.subcategories.forEach(sub => {
        sub.courses.forEach(c => titles.add(c.title));
      });
    });
    return Array.from(titles);
  }, []);

  useEffect(() => { setLocalVal(value); }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = ALL_COURSES.filter(o => o.toLowerCase().includes((localVal||'').toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={localVal || ''}
        onChange={e => {
          setLocalVal(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="دوره مدنظر..."
        className="text-[13px] font-bold text-slate-800 text-center bg-slate-100 border border-slate-200 hover:border-slate-300 focus:border-cyan-600 outline-none w-full min-w-[120px] px-2 py-2 rounded-lg transition-colors placeholder:text-slate-500 placeholder:font-medium"
      />
      <AnimatePresence>
      {isOpen && localVal && filtered.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[100] top-full mt-1 w-[200px] left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-[150px] overflow-y-auto custom-scrollbar flex flex-col p-1 text-right">
          {filtered.map(o => (
             <button key={o} onClick={() => { setLocalVal(o); onChange(o); setIsOpen(false); }} className="px-3 py-1.5 text-[11px] text-slate-700 hover:bg-brand-50 hover:text-brand-700 text-right rounded-lg w-full truncate transition-colors">
               {o}
             </button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

type Tab = 'home' | 'queue' | 'today' | 'stats' | 'blacklist' | 'courses' | 'followup' | 'learning_paths' | 'schedule' | 'intro' | 'consultations';

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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <span className="font-medium text-slate-900 text-sm">{tr('یادداشت', 'Notes')} — <span dir="ltr">{formatPhoneNumber(call?.phone || '')}</span></span>
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
    removeFromBlacklist,
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
    setPopupView,
    hardDeleteCall,
    logManualCallAttempt
  } = useAppContext();
  const { tr, valueLabel, direction } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [actionModalCall, setActionModalCall] = useState<CallRecord | null>(null);
  const [editModalTask, setEditModalTask] = useState<ContactTask | null>(null);
  const [hiddenCalls, setHiddenCalls] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const handleDelete = React.useCallback((c: CallRecord) => {
    setConfirmModalConfig({
      isOpen: true,
      title: tr('حذف شماره', 'Delete number'),
      message: tr('آیا مطمئن هستید که می‌خواهید این شماره را به سطل زباله منتقل کنید؟', 'Are you sure you want to move this number to trash?'),
      onConfirm: () => {
        setHiddenCalls(prev => new Set(prev).add(c.id));
        let undoClicked = false;

        toast.info(tr('شماره حذف شد.', 'Number deleted.'), {
          duration: 5000,
          action: {
            label: tr('بازگردانی', 'Undo'),
            onClick: () => {
              undoClicked = true;
              setHiddenCalls(prev => {
                const next = new Set(prev);
                next.delete(c.id);
                return next;
              });
              toast.success(tr('بازگردانی شد.', 'Restored.'));
            }
          }
        });

        setTimeout(() => {
          if (!undoClicked) {
            deleteCall(c.id);
            const { storage } = require('../../utils/storage');
            storage.addToTrash({ ...c, deletedAt: new Date().toISOString(), deletedBy: profile?.name || 'Unknown' });
          }
        }, 5100);
      }
    });
  }, [deleteCall, profile, tr]);

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
    return !!(c.callStatus || c.advisory || c.notes);
  };

  const [notesModalCall, setNotesModalCall] = useState<CallRecord | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [loggingAttemptIds, setLoggingAttemptIds] = useState<Set<string>>(new Set());
  const [manualReasonModal, setManualReasonModal] = useState<{ isOpen: boolean; call: CallRecord | null; sourceTaskId: string | null }>({ isOpen: false, call: null, sourceTaskId: null });
  const [manualReasonInput, setManualReasonInput] = useState('');

  const handleLogManualAttempt = async (c: CallRecord, reason?: string) => {
    if (loggingAttemptIds.has(c.id)) return;
    setLoggingAttemptIds(prev => new Set(prev).add(c.id));

    let sourceTaskId: string | null = null;
    if (activeTab === 'followup') {
      const task = tasks.find(t => t.contact_id === c.id && t.status === 'pending');
      if (task) {
        sourceTaskId = task.id;
      }
    }

    try {
      await logManualCallAttempt(c.id, { sourceTaskId, manualReason: reason || null });
      toast.success(tr('تلاش تماس ثبت شد', 'Call attempt logged'));
      if (manualReasonModal.isOpen) {
        setManualReasonModal({ isOpen: false, call: null, sourceTaskId: null });
        setManualReasonInput('');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('نوشتن دلیل الزامی است')) {
        setManualReasonModal({ isOpen: true, call: c, sourceTaskId });
      } else if (e.message && e.message.includes('صبر کنید')) {
        toast.error(tr('برای ثبت تلاش بعدی کمی صبر کنید.', 'Please wait a bit before the next attempt.'));
      } else {
        toast.error(e.message || tr('خطا در ثبت تلاش تماس', 'Error logging call attempt'));
      }
    } finally {
      setLoggingAttemptIds(prev => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    }
  };

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
      if (isNaN(date.getTime())) return { priority: 'none', label: 'بدون زمان', borderCls: 'border-r-slate-200', bgCls: 'bg-slate-50 text-slate-500 border-slate-200' };
      const d = new DateObject({ date, calendar: persian, locale: persian_fa });
      return {
        priority: 'upcoming',
        label: `${d.format("DD MMMM")} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        borderCls: 'border-r-blue-400', bgCls: 'bg-blue-50 text-blue-600 border-blue-200'
      };
    }
  };

  const handleStatusChange = (call: CallRecord, newStatus: string) => {
    updateCall({ ...call, callStatus: newStatus });
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
          toast.success(tr('شماره ناموجود بود، در لیست سیاه ثبت و حذف شد.', 'Number unavailable, blacklisted and deleted.'), {
            duration: 5000,
            action: { label: 'بازگردانی', onClick: () => { removeFromBlacklist(call.phone); addCall(call); } }
          });
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
        advisory: call.advisory || '',
        notes: call.notes || '',
        taskType: taskData.taskType,
        scheduledDate: taskData.scheduledDate,
        scheduledTime: taskData.scheduledTime,
        followupNote: taskData.followupNote
      });

      if (call.callStatus === 'ناموجود') {
        addToBlacklist(call.phone, 'ناموجود بودن');
        const deleteSuccess = await deleteCall(call.id);
        if (deleteSuccess) {
          toast.success(tr('شماره ناموجود بود، در لیست سیاه ثبت و حذف شد.', 'Number blacklisted and deleted.'), {
            duration: 5000,
            action: { label: 'بازگردانی', onClick: () => { removeFromBlacklist(call.phone); addCall(call); } }
          });
        } else {
          toast.error(tr('نتیجه ثبت شد، اما حذف شماره انجام نشد. دوباره روی ثبت نتیجه بزنید.', 'Result saved but deletion failed.'));
        }
      } else if (call.callStatus === 'عدم تمایل') {
        addToBlacklist(call.phone, 'عدم تمایل');
        updateCall({ ...call, workList: 'today', isFollowUp: false });
        setContactWorkList(call.id, 'today');
        toast.success(tr('شماره عدم تمایل بود، در لیست سیاه و فعالیت ثبت شد.', 'Number blacklisted and moved to Daily Activity.'), {
          duration: 5000,
          action: { label: 'بازگردانی', onClick: () => { removeFromBlacklist(call.phone); updateCall({ ...call, workList: 'none' }); setContactWorkList(call.id, 'none'); } }
        });
      } else {
        updateCall({ ...call, workList: 'today', isFollowUp: false });
        setContactWorkList(call.id, 'today');
        toast.success(tr('نتیجه تماس به فعالیت منتقل شد.', 'Call result moved to Daily Activity.'), {
          duration: 5000,
          action: { label: 'بازگردانی', onClick: () => { updateCall({ ...call, workList: 'none' }); setContactWorkList(call.id, 'none'); } }
        });
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

  const handleSimpleSubmit = async (call: CallRecord) => {
    if (inFlightSubmit.current.has(call.id)) return;

    inFlightSubmit.current.add(call.id);
    setSubmittingIds(prev => new Set(prev).add(call.id));

    try {
      await recordAttempt(call.id, {
        fullName: call.fullName,
        callStatus: call.callStatus,
        advisory: call.advisory,
        notes: call.notes,
        advisoryDate: call.advisoryDate,
        advisoryTime: call.advisoryTime,
        interestedCourse: call.interestedCourse,
        registered: call.registered,
        consultationConfirmed: call.consultationConfirmed
      });

      const nowIso = new Date().toISOString();

      if (call.callStatus === 'ناموجود') {
        addToBlacklist(call.phone, 'ناموجود بودن');
        await deleteCall(call.id);
        toast.success(tr('در لیست سیاه ثبت و از لیست حذف شد.', 'Blacklisted and deleted.'), { duration: 3000 });
      } else if (call.callStatus === 'عدم تمایل') {
        addToBlacklist(call.phone, 'عدم تمایل');
        updateCall({ ...call, workList: 'today', isFollowUp: false });
        setContactWorkList(call.id, 'today');
        toast.success(tr('در لیست سیاه و فعالیت ثبت شد.', 'Blacklisted and moved to Activity.'), { duration: 3000 });
      } else if (call.callStatus === 'جواب نداد') {
        updateCall({ ...call, workList: 'today', isFollowUp: true, followUpAddedAt: nowIso, isBlacklisted: false });
        setContactWorkList(call.id, 'today');
        toast.success(tr('در پیگیری‌ها و فعالیت ثبت شد.', 'Moved to Follow-ups and Activity.'));
      } else if (call.callStatus === 'پاسخ داد') {
        const needsFollowUp = (call.advisory === 'حضوری' || call.advisory === 'تلفنی') || call.registered === 'مردد';
        if (needsFollowUp) {
           updateCall({ ...call, workList: 'today', isFollowUp: true, followUpAddedAt: nowIso, isBlacklisted: false });
           setContactWorkList(call.id, 'today');
           toast.success(tr('نیاز به پیگیری مجدد دارد و در فعالیت ثبت شد.', 'Needs follow-up, moved to Activity.'));
        } else {
           updateCall({ ...call, workList: 'today', isFollowUp: false, isBlacklisted: false });
           setContactWorkList(call.id, 'today');
           toast.success(tr('با موفقیت ثبت و به فعالیت منتقل شد.', 'Saved and moved to Daily Activity.'));
        }
      } else {
        updateCall({ ...call, workList: 'today', isFollowUp: false });
        setContactWorkList(call.id, 'today');
        toast.success(tr('با موفقیت ثبت و به فعالیت منتقل شد.', 'Saved and moved to Daily Activity.'), { duration: 3000 });
      }
    } catch (err) {
       toast.error(tr('خطا در ثبت نتیجه', 'Error'));
    } finally {
      inFlightSubmit.current.delete(call.id);
      setSubmittingIds(prev => {
        const next = new Set(prev);
        next.delete(call.id);
        return next;
      });
    }
  };

  const handleSubmitAll = () => {
    const toSubmit = displayedList.filter(c => !hiddenCalls.has(c.id) && hasAnyFieldSelected(c));
    if (toSubmit.length === 0) return toast.info(tr('موردی برای ثبت وجود ندارد.', 'No items to submit.'));
    toSubmit.forEach(c => handleSimpleSubmit(c));
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

  const baseFilteredList = useMemo(() => {
    let list = calls;
    const limits = getDayLimits();
    const tehranToday = (new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }))).toISOString().split('T')[0];

    if (activeTab === 'today') {
      list = list.filter(c => c.workList === 'today');
    } else if (activeTab === 'queue') {
      list = list.filter(c => !c.isFollowUp && !c.isBlacklisted && c.workList !== 'today');
    } else if (activeTab === 'followup') {
      list = list.filter(c => c.isFollowUp && !c.isBlacklisted && c.workList !== 'today');
    } else if (activeTab === 'consultations') {
      list = list.filter(c => c.advisory === 'بله' || c.advisory === 'حضوری');
    }

    if (searchQuery.trim()) {
      list = list.filter(c => matchesSearch(c, searchQuery));
    }
    return [...list].sort((a, b) => {
      const aDate = a.attempts && a.attempts.length > 0 ? a.attempts[a.attempts.length - 1].createdAt : '';
      const bDate = b.attempts && b.attempts.length > 0 ? b.attempts[b.attempts.length - 1].createdAt : '';
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      if (aDate && bDate) {
         const timeDiff = String(bDate).localeCompare(String(aDate));
         if (timeDiff !== 0) return timeDiff;
      }
      const timeDiff2 = String(b.createdAt).localeCompare(String(a.createdAt));
      if (timeDiff2 !== 0) return timeDiff2;
      const qDiff = (a.queueOrder ?? 0) - (b.queueOrder ?? 0);
      if (qDiff !== 0) return qDiff;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [calls, activeTab, searchQuery, tasks]);

  const displayedList = useMemo(() => {
    let list = baseFilteredList;
    if (statusFilter.length > 0 && activeTab === 'followup') {
      list = list.filter(c => statusFilter.includes(c.callStatus || 'نامشخص'));
    }
    return list;
  }, [baseFilteredList, statusFilter, activeTab]);

  if (isLoadingCalls && !hasInitialCallsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900" dir={direction}>
        <div className="text-slate-500 font-medium">{tr('در حال بارگذاری اطلاعات تماس‌ها از سرور ابری...', 'Loading call data from cloud server...')}</div>
      </div>
    );
  }

  if (callsError && !hasInitialCallsLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900" dir={direction}>
        <div className="text-rose-500 font-medium">{callsError}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col pb-4 hide-scrollbar relative bg-slate-50 dark:bg-slate-900" dir={direction}>
      {callsError && hasInitialCallsLoaded && (
        <div className="w-full max-w-3xl mx-auto mt-4 bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-[13.5px] font-medium text-center border border-rose-200 shadow-sm animate-pulse">
          {callsError}
        </div>
      )}
      {/* Unified Quick Access & Operational Toolbar */}
      <div className="pt-16 md:pt-4 pb-4 w-full flex items-center justify-start gap-3 flex-wrap px-4 md:pr-6 md:pl-[170px]">


        <a href="?view=dashboard&tab=queue" onClick={e => { e.preventDefault(); setActiveCallTab('queue'); setPopupView(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'queue' && !popupView ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <List size={16} className={activeTab === 'queue' && !popupView ? 'text-white' : 'text-slate-400'} />
          لیست
        </a>
        
        <a href="?view=dashboard&tab=followup" onClick={e => { e.preventDefault(); setActiveCallTab('followup'); setPopupView(null); }} className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'followup' && !popupView ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <PhoneForwarded size={16} className={activeTab === 'followup' && !popupView ? 'text-white' : 'text-slate-400'} />
          لیست پیگیری
          {calls.filter(c => c.isFollowUp && !c.isBlacklisted && c.workList !== 'today').length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white px-1 shadow-sm">
              {calls.filter(c => c.isFollowUp && !c.isBlacklisted && c.workList !== 'today').length}
            </span>
          )}
        </a>

        <a href="?view=dashboard&tab=consultations" onClick={e => { e.preventDefault(); setActiveCallTab('consultations'); setPopupView(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'consultations' && !popupView ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <Users size={16} className={activeTab === 'consultations' && !popupView ? 'text-white' : 'text-slate-400'} />
          لیست مشاوره
        </a>

        <a href="?view=dashboard&tab=today" onClick={e => { e.preventDefault(); setActiveCallTab('today'); setPopupView(null); }} className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'today' && !popupView ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <Activity size={16} className={activeTab === 'today' && !popupView ? 'text-white' : 'text-slate-400'} />
          فعالیت
          {calls.filter(c => c.workList === 'today').length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white px-1 shadow-sm">
              {calls.filter(c => c.workList === 'today').length}
            </span>
          )}
        </a>

        <a href="?view=dashboard&tab=courses" onClick={e => { e.preventDefault(); setActiveCallTab('courses'); setPopupView(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'courses' ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <BookOpen size={16} className={activeTab === 'courses' ? 'text-white' : 'text-slate-400'} />
          قیمت دوره‌ها
        </a>
        <a href="?view=home" onClick={e => { e.preventDefault(); setActiveCallTab('learning_paths'); setPopupView(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'learning_paths' ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <Route size={16} className={activeTab === 'learning_paths' ? 'text-white' : 'text-slate-400'} />
          مسیرهای یادگیری
        </a>

        <a href="?view=intro" onClick={e => { e.preventDefault(); setActiveCallTab('intro'); setPopupView(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-[13px] font-bold ${activeTab === 'intro' ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
          <MessageSquareQuote size={16} className={activeTab === 'intro' ? 'text-white' : 'text-slate-400'} />
          متن تماس
        </a>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 w-full min-h-0 flex items-stretch gap-4 pb-4 px-4 md:px-6" >
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="relative h-full bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">

          {activeTab === 'courses' ? (
             <div className="w-full h-full custom-scrollbar"><CoursesView embedded={true} /></div>

          ) : activeTab === 'intro' ? (
             <div className="w-full h-full custom-scrollbar"><IntroTextView embedded={true} /></div>
          ) : activeTab === 'learning_paths' ? (
             <div className="w-full h-full flex flex-col min-h-0 relative"><LearningPathsModal isOpen={true} onClose={() => {}} embedded={true} /></div>
          ) : (
          <div className="flex flex-col h-full min-h-0">
            {['queue', 'followup', 'today', 'consultations'].includes(activeTab) && (
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/50 border-b border-slate-200 shrink-0">
                {['queue', 'followup', 'today'].includes(activeTab) ? (
                  <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={
                        activeTab === 'queue' ? tr('جستجو در شماره‌ها...', 'Search queue...') :
                        activeTab === 'followup' ? tr('جستجو در پیگیری‌ها...', 'Search follow-ups...') :
                        tr('جستجو در فعالیت‌ها...', 'Search activities...')
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-3">
                  {activeTab === 'queue' && (
                    <>
                      <button
                        onClick={() => {
                          setConfirmModalConfig({
                            isOpen: true,
                            title: tr('حذف تمامی شماره‌ها', 'Delete all numbers'),
                            message: tr('آیا مطمئن هستید که می‌خواهید همه شماره‌های این لیست را حذف کنید؟', 'Are you sure you want to delete all?'),
                            onConfirm: () => {
                              calls.filter(c => displayedList.some(f => f.id === c.id)).forEach(c => deleteCall(c.id));
                              toast.success(tr('لیست پاک شد.', 'List cleared.'));
                            }
                          });
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-[12px] font-bold text-rose-500 hover:bg-rose-50"
                        title={tr('حذف همه', 'Delete All')}
                      >
                        <Trash2 size={14} strokeWidth={2.5} /> <span>{tr('حذف همه', 'Delete All')}</span>
                      </button>
                      <button
                        onClick={() => setIsManualAddOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-[12px] font-bold text-brand-600 hover:bg-brand-50"
                        title={tr('افزودن دستی', 'Add manually')}
                      >
                        <Plus size={14} strokeWidth={2.5} /> <span>{tr('افزودن دستی', 'Add manually')}</span>
                      </button>
                    </>
                  )}
                  {activeTab === 'consultations' && (
                    <button
                      onClick={async () => {
                        const toExport = displayedList.filter(c => !hiddenCalls.has(c.id));
                        if (toExport.length === 0) return toast.info(tr('موردی برای خروجی وجود ندارد.', 'No items to export.'));
                        await exportConsultationsToExcel(toExport, toExport.length);
                        toast.success(tr('فایل اکسل با موفقیت ایجاد شد.', 'Excel created successfully.'));
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-[12px] font-bold text-violet-600 hover:bg-violet-50 border border-violet-200"
                      title={tr('خروجی اکسل', 'Export Excel')}
                    >
                      <FileText size={14} strokeWidth={2.5} /> <span>{tr('خروجی اکسل', 'Export Excel')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-select-scroll relative z-10">
            {activeTab === 'followup' && (
              <div className="flex items-center gap-4 py-2 px-4 bg-slate-50 border-b border-slate-200 sticky left-0 right-0">
                {(() => {
                  const visible = baseFilteredList.filter(c => !hiddenCalls.has(c.id));
                  const statusCounts: Record<string, number> = {};
                  visible.forEach(c => {
                    const st = c.callStatus || 'نامشخص';
                    statusCounts[st] = (statusCounts[st] || 0) + 1;
                  });
                  return Object.entries(statusCounts).map(([status, count]) => {
                    const isActive = statusFilter.includes(status);
                    return (
                      <button 
                        key={status} 
                        onClick={() => {
                          setStatusFilter(prev => {
                            if (prev.includes(status)) return prev.filter(s => s !== status);
                            return [...prev, status];
                          });
                        }}
                        className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm transition-colors border ${isActive ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                      >
                         <span>{status}:</span>
                         <span className={isActive ? 'text-cyan-700' : 'text-brand-600'}>{count}</span>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
            {/* Compact Table View */}
            <table className="w-full text-center border-collapse table-fixed min-w-[1000px]">
              <colgroup>
                <col className="w-[180px]" /> {/* Phone/Name */}
                <col className="w-[150px]" /> {/* Call Result */}
                <col className="w-[140px]" /> {/* Interested Course */}
                <col className="w-[200px]" /> {/* Consultation */}
                <col className="w-[150px]" /> {/* Registration */}
                <col className="w-[160px]" /> {/* Actions */}
              </colgroup>
              <thead className="sticky top-0 bg-slate-100 border-b-2 border-slate-200 z-20">
                <tr>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('شماره تماس', 'Phone')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('نتیجه تماس', 'Call Result')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('دوره مدنظر', 'Course')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('مشاوره', 'Consultation')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide whitespace-nowrap">{tr('ثبت نام', 'Registration')}</th>
                  <th className="py-2.5 px-2 text-[12px] font-extrabold text-slate-800 tracking-wide">
                     <div className="flex flex-col items-center justify-center gap-1.5">
                        {tr('عملیات', 'Actions')}
                     </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px] font-medium text-slate-800 relative">
                <AnimatePresence>
                {(() => {
                  const visibleList = displayedList.filter(c => !hiddenCalls.has(c.id));
                  if (visibleList.length === 0 && searchQuery) {
                     return (
                       <motion.tr key="empty-search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <td colSpan={6} className="py-12">
                            <div className="text-center text-slate-500 font-bold text-[13px]">{tr('نتیجه‌ای پیدا نشد', 'No results found')}</div>
                         </td>
                       </motion.tr>
                     );
                  }
                  if (visibleList.length === 0) {
                     return (
                       <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <td colSpan={4} className="py-24">
                           {/* Spacer to give height for the absolute empty state overlay */}
                         </td>
                       </motion.tr>
                     );
                  }

                  let lastDateGroup = null;
                  const rows = [];
                  visibleList.forEach((c, i) => {
                    let workedDisplayDate = 'بدون تاریخ';
                    let workedDisplayTime = '';
                    if (c.attempts && c.attempts.length > 0) {
                        const parts = (c.attempts[c.attempts.length - 1].jalaliDateTime || '').split(' ');
                        workedDisplayDate = parts[0] || 'بدون تاریخ';
                        workedDisplayTime = parts[1] || '';
                    }

                    if (workedDisplayDate !== lastDateGroup) {
                       rows.push(
                          <tr key={`sep-${workedDisplayDate}`} className="bg-slate-50 border-y border-slate-200 z-10 sticky top-[40px]">
                             <td colSpan={6} className="py-1.5 px-4 text-right bg-slate-50 shadow-sm">
                                <span className="text-[12px] font-black text-slate-600">{workedDisplayDate === 'بدون تاریخ' ? tr('بدون تاریخ', 'No Date') : `${workedDisplayDate}`}</span>
                             </td>
                          </tr>
                       );
                       lastDateGroup = workedDisplayDate;
                    }

                    const fuStatus = activeTab === 'followup' ? getFollowUpStatus(c.nextFollowUpAt) : null;
                    
                    let rowColorIndicator = 'bg-blue-500';
                    if (c.advisory === 'حضوری' && c.advisoryDate) {
                        rowColorIndicator = 'bg-fuchsia-500';
                    } else if (c.isFollowUp) {
                        rowColorIndicator = 'bg-orange-500';
                    } else if (c.callStatus === 'عدم تمایل' || c.advisory === 'عدم تمایل') {
                        rowColorIndicator = 'bg-rose-500';
                    } else if (c.registered === 'ثبت نام کرد') {
                        rowColorIndicator = 'bg-emerald-500';
                    }

                    rows.push(
                    <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`relative focus-within:z-50 hover:z-40 border-b border-slate-200 transition-colors duration-300 group ${c.isBlacklisted ? 'bg-rose-50 hover:bg-rose-100/70' : 'bg-white hover:bg-slate-50'}`}
                  >
                    {/* Phone */}
                    <td className="py-3 sm:py-4 px-2 relative whitespace-nowrap">
                       <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${rowColorIndicator}`} />
                       <div className="flex flex-col items-center justify-center w-full px-2">
                          <div className="flex items-center justify-center relative w-full mx-auto px-4 min-h-[30px] gap-2">
                            <span dir="ltr" className="font-bold text-[19px] tracking-[0.15em] text-slate-800 group-hover:text-cyan-600 transition-colors z-10">{formatPhoneNumber(c.phone)}</span>
                          </div>
                          <input
                            type="text"
                            value={c.fullName || ''}
                            onChange={e => handleFieldChange(c, 'fullName', e.target.value)}
                            placeholder={tr('نام شخص...', 'Name...')}
                            className="text-[13px] font-bold text-slate-800 text-center bg-transparent border-b border-slate-200 hover:border-slate-300 focus:border-cyan-600 outline-none w-32 mt-1 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                          />
                          {(() => {
                             if (!c.attempts || c.attempts.length === 0) return null;
                             const lastAttempt = c.attempts[c.attempts.length - 1];
                             let timeStr = null;
                             if (lastAttempt.jalaliDateTime && lastAttempt.jalaliDateTime !== 'Invalid Date' && lastAttempt.jalaliDateTime.includes(':')) {
                                 timeStr = (lastAttempt.jalaliDateTime || '').split(' ')[1] || lastAttempt.jalaliDateTime;
                             } else if (lastAttempt.createdAt) {
                                 const d = new Date(lastAttempt.createdAt);
                                 if (!isNaN(d.getTime())) {
                                     timeStr = d.toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'});
                                 }
                             }
                             if (!timeStr || timeStr === 'Invalid Date') return null;
                             return (
                                <div className="mt-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200" dir="ltr">
                                   {timeStr}
                                </div>
                             );
                          })()}
                          {fuStatus && fuStatus.priority !== 'none' && (
                            <div className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${fuStatus.bgCls}`}>
                              {fuStatus.label}
                            </div>
                          )}
                       </div>
                    </td>

                    {/* Call Status (Call Result) */}
                    <td className="py-3 sm:py-4 px-2 relative whitespace-nowrap">
                       <div className="flex flex-col items-center justify-center gap-2">
                          <TableDropdown
                            value={c.callStatus || ''}
                            onChange={(val) => handleStatusChange(c, val)}
                            options={CALL_STATUSES.map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('نتیجه تماس', 'Result')}
                          />
                       </div>
                    </td>

                    {/* Interested Course */}
                    <td className="py-3 sm:py-4 px-2 relative whitespace-nowrap overflow-visible">
                       <div className="flex items-center justify-center relative w-full">
                          <CourseAutocomplete
                            value={c.interestedCourse || ''}
                            onChange={(val) => handleFieldChange(c, 'interestedCourse', val)}
                          />
                       </div>
                    </td>

                    {/* Consultation */}
                    <td className="py-3 sm:py-4 px-2 relative whitespace-nowrap">
                       <div className="flex flex-col items-center justify-center gap-2">
                          <TableDropdown
                            value={c.advisory || ''}
                            onChange={(val) => handleFieldChange(c, 'advisory', val)}
                            options={['حضوری', 'تلفنی', 'عدم تمایل'].map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('مشاوره', 'Consultation')}
                          />
                          {c.advisory === 'حضوری' && (
                             <div className="flex flex-col gap-1 w-full max-w-[140px] items-center">
                                <DatePicker
                                  calendar={persian}
                                  locale={persian_fa}
                                  value={c.advisoryDate ? new DateObject(c.advisoryDate) : null}
                                  onChange={(d: DateObject) => handleFieldChange(c, 'advisoryDate', d?.toDate()?.toISOString())}
                                  containerClassName="w-full"
                                  inputClass="w-full text-center bg-slate-50 border border-slate-200 text-slate-800 text-[12px] font-bold rounded-md px-2 py-1 outline-none focus:border-cyan-600 placeholder-slate-500"
                                  placeholder="تاریخ مراجعه"
                                />
                                <input
                                  type="time"
                                  value={c.advisoryTime || ''}
                                  onChange={(e) => handleFieldChange(c, 'advisoryTime', e.target.value)}
                                  className="w-full text-center bg-slate-50 border border-slate-200 text-slate-800 text-[12px] font-bold rounded-md px-2 py-1 outline-none focus:border-cyan-600"
                                />
                                <label className="flex items-center gap-1.5 mt-1 cursor-pointer w-full justify-center">
                                   <input
                                     type="checkbox"
                                     checked={c.consultationConfirmed || false}
                                     onChange={e => handleFieldChange(c, 'consultationConfirmed', e.target.checked)}
                                     className="w-3.5 h-3.5 accent-cyan-600 rounded"
                                   />
                                   <span className="text-[10px] font-bold text-slate-600">{tr('در دفتر نوشته شد', 'Written in office')}</span>
                                </label>
                             </div>
                          )}
                       </div>
                    </td>

                    {/* Registration */}
                    <td className="py-3 sm:py-4 px-2 relative whitespace-nowrap">
                       <div className="flex flex-col items-center justify-center gap-2">
                          <TableDropdown
                            value={c.registered || ''}
                            onChange={(val) => handleFieldChange(c, 'registered', val)}
                            options={REGISTRATION_STATUSES.map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('ثبت نام', 'Registration')}
                          />
                       </div>
                    </td>

                     {/* Actions */}
                    <td className="py-4 sm:py-5 px-2 relative">
                       <div className="flex justify-center items-center gap-1.5">
                          {/* Submit Button */}
                          <button
                            onClick={() => handleSimpleSubmit(c)}
                            disabled={!hasAnyFieldSelected(c) || submittingIds.has(c.id)}
                            title={tr('ثبت نتیجه', 'Submit Result')}
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm border
                              ${hasAnyFieldSelected(c) && !submittingIds.has(c.id) 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md' 
                                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                          >
                            {submittingIds.has(c.id) ? (
                              <Icons.Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Icons.Check size={16} strokeWidth={3} />
                            )}
                          </button>

                          {/* Log Attempt Button (Followups only) */}
                          {activeTab === 'followup' && (
                            <div className="relative shrink-0">
                              <button
                                onClick={() => handleLogManualAttempt(c)}
                                disabled={loggingAttemptIds.has(c.id)}
                                title={tr('ثبت تلاش تماس', 'Log Attempt')}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-indigo-500 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md"
                              >
                                {loggingAttemptIds.has(c.id) ? (
                                  <Icons.Loader2 size={15} className="animate-spin text-indigo-500" />
                                ) : (
                                  <Icons.Phone size={15} />
                                )}
                              </button>
                              {c.attempts && c.attempts.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                                  {c.attempts.length}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Notes Button */}
                          <button
                            onClick={() => setNotesModalCall(c)}
                            title={tr('افزودن یادداشت', 'Notes')}
                            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm border
                              ${c.notes 
                                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-md' 
                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md'}`}
                          >
                            <Icons.MessageSquareQuote size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setConfirmModalConfig({
                                isOpen: true,
                                title: tr('حذف کامل شماره', 'Hard Delete'),
                                message: tr('این شماره و همه اطلاعات کاری مربوط به آن، از جمله پیگیری‌ها و تلاش‌های تماس، حذف می‌شود. این عملیات قابل بازگشت نیست. آیا مطمئن هستید؟', 'This number and all related data will be deleted. Are you sure?'),
                                onConfirm: async () => {
                                  try {
                                    await hardDeleteCall(c.id);
                                    setHiddenCalls(prev => new Set(prev).add(c.id));
                                    toast.success(tr('شماره برای همیشه حذف شد.', 'Number permanently deleted.'));
                                  } catch (err) {
                                    toast.error(tr('خطا در حذف کامل شماره', 'Error hard deleting number.'));
                                  }
                                }
                              });
                            }}
                            title={tr('حذف شماره', 'Delete')}
                            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white text-rose-500 border border-slate-200 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm hover:shadow-md"
                          >
                            <Icons.Trash2 size={15} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                  );
                });
                return rows;
              })()}
              </AnimatePresence>
              </tbody>
            </table>


            {displayedList.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                    <Filter size={28} className="text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-600 text-[15px] mb-2">{tr('هیچ داده‌ای یافت نشد', 'No data found')}</p>
                  <p className="text-[13px] text-slate-400 font-medium max-w-sm text-center">{tr('برای این بخش هنوز اطلاعاتی ثبت نشده یا فیلترهای جستجو نتیجه‌ای نداشتند.', 'No information recorded yet or search yielded no results.')}</p>

                  {activeTab === 'queue' && (
                    <button
                      onClick={() => setIsManualAddOpen(true)}
                      className="h-11 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-[14px] transition-colors flex items-center justify-center gap-2 pointer-events-auto shadow-sm mt-4"
                    >
                      <Plus size={18} />
                      {tr('افزودن شماره', 'Add number')}
                    </button>
                  )}
                </div>
            )}
          </div>
          </div>
          )}
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

      <AnimatePresence>
        {manualReasonModal.isOpen && manualReasonModal.call && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManualReasonModal({ isOpen: false, call: null, sourceTaskId: null })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-xl border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Icons.MessageSquare size={18} className="text-brand-500" />
                  {tr('دلیل تلاش مجدد', 'Reason for Attempt')}
                </h3>
                <button onClick={() => setManualReasonModal({ isOpen: false, call: null, sourceTaskId: null })} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Icons.X size={20} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">
                  برای این شماره امروز چند تلاش ثبت شده است. لطفاً دلیل تلاش مجدد را بنویسید.
                </p>
                <input
                  type="text"
                  autoFocus
                  value={manualReasonInput}
                  onChange={(e) => setManualReasonInput(e.target.value)}
                  placeholder="مثلاً: جواب نداد، خاموش بود، بعداً تماس بگیرد"
                  className="w-full h-11 px-3 text-[13px] border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualReasonInput.trim()) {
                      handleLogManualAttempt(manualReasonModal.call!, manualReasonInput.trim());
                    }
                  }}
                />
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setManualReasonModal({ isOpen: false, call: null, sourceTaskId: null })}
                  className="px-5 py-2.5 rounded-xl font-medium text-[13px] text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleLogManualAttempt(manualReasonModal.call!, manualReasonInput.trim())}
                  disabled={!manualReasonInput.trim() || loggingAttemptIds.has(manualReasonModal.call.id)}
                  className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium text-[13px] hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loggingAttemptIds.has(manualReasonModal.call.id) ? <Icons.Loader2 size={16} className="animate-spin" /> : null}
                  ثبت تلاش
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Render Quick Access Modals */}
      <AnimatePresence>
         {popupView && (
          <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center p-0" dir="rtl">
             <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="bg-white w-full h-full relative z-10 overflow-hidden flex flex-col">
               <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                 {popupView === 'negotiation' && <NegotiationView isModal={true} onClose={() => setPopupView(null)} />}
                 {popupView === 'stats' && <StatsView isModal={true} onClose={() => setPopupView(null)} />}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};



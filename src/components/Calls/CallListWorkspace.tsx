import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { toJalali } from '../../utils/jalali';
import { useLocale } from '../../hooks/useLocale';
import { CallRecord, ContactTask, ContactTaskType } from '../../types';
import { CallResultActionModal } from './CallResultActionModal';
import { ContactTaskEditorModal } from './ContactTaskEditorModal';
import { CALL_STATUSES } from '../../constants';
import * as Icons from 'lucide-react';
import { Search, X, Plus, Trash2, Filter, Home, BookOpen, Route, MessageSquareQuote, FileText, CalendarClock } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import * as xlsx from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { TableDropdown } from '../Shared/TableDropdown';
import { matchesSearch } from '../../utils/search';
import { formatPhoneNumber } from '../../utils/format';
import { COURSE_CATEGORIES } from '../../data/courses';
import { exportConsultationsToExcel } from '../../utils/consultationExcel';

// Views
import { CoursesView } from '../Courses/CoursesView';
import { IntroTextView } from '../Education/IntroTextView';
import { LearningPathsModal } from '../Shared/LearningPathsModal';
import { CallListStats } from './CallListStats';
import { NegotiationView } from '../Education/NegotiationView';

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
    <div className="relative w-full max-w-[180px] mx-auto" ref={wrapperRef}>
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
        className="text-[13px] font-bold text-slate-800 text-center bg-slate-100 border border-slate-200 hover:border-slate-300 focus:border-cyan-600 outline-none w-full px-2 py-2 rounded-lg transition-colors placeholder:text-slate-500 placeholder:font-medium"
      />
      <AnimatePresence>
      {isOpen && localVal && filtered.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-[100] top-full mt-1 w-[240px] left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl  max-h-[250px] overflow-y-auto custom-scrollbar flex flex-col p-1 text-right">
          {filtered.map(o => (
             <button key={o} onClick={() => { setLocalVal(o); onChange(o); setIsOpen(false); }} className="px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 text-right rounded-lg w-full transition-colors truncate">
               {o}
             </button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
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
      <div className="absolute inset-0 bg-slate-50/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-md relative z-10 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <span className="font-medium text-slate-900 text-sm">{tr('یادداشت', 'Notes')} — <span dir="ltr">{formatPhoneNumber(call?.phone || '')}</span></span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={tr('یادداشت خود را بنویسید...', 'Write your notes here...')}
            rows={6}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 resize-none transition-all"
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-50/40" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-sm relative z-10 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
               <span className="font-medium text-slate-900">{tr('افزودن دستی شماره', 'Add Number Manually')}</span>
               <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={18} /></button>
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
    addCall,
    bulkAddCalls,
    blacklist,
    getMyContactTasks,
    updateContactTaskDetails,
    recordCallAttemptWithTask,
    hardDeleteCall,
    setCurrentView,
    getMyDailyStats
  } = useAppContext();
  
  const { tr, valueLabel, direction } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [actionModalCall, setActionModalCall] = useState<CallRecord | null>(null);
  const [editModalTask, setEditModalTask] = useState<ContactTask | null>(null);
  
  const [notesModalCall, setNotesModalCall] = useState<CallRecord | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  // Local state for tabs
  const [activeTab, setActiveTab] = useState<'list' | 'courses' | 'learning_paths' | 'intro' | 'negotiation' | 'stats'>('list');

  // Batch Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadTasks = React.useCallback(async () => {
    try {
      const data = await getMyContactTasks({ status: 'pending' });
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  }, [getMyContactTasks]);

  React.useEffect(() => { loadTasks(); }, [loadTasks]);

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
          toast.error(tr(`تعداد ${skippedPhones.length} شماره به دلیل قرار داشتن در لیست سیاه حذف شدند.`, `${skippedPhones.length} numbers skipped.`));
        }

        if (count > 0) {
          toast.success(tr(`تعداد ${count} شماره با موفقیت از اکسل اضافه شد.`, `${count} numbers added from Excel.`));
        } else if (skippedPhones.length === 0) {
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
    if (blacklist.some(b => b.phone === phone)) {
      toast.error(tr('خطا: این شماره در لیست سیاه قرار دارد.', 'Error: This number is blacklisted.'));
      return;
    }
    const existingCall = calls.find(c => c.phone === phone);
    if (existingCall) {
       toast.error(tr('خطا: این شماره در لیست وجود دارد.', 'Error: This number already exists.'));
       return;
    }
    addCall({ phone, fullName });
    toast.success(tr('شماره جدید با موفقیت اضافه شد.', 'New number added successfully.'));
  };

  const handleFieldChange = (call: CallRecord, field: keyof CallRecord, value: any) => {
    updateCall({ ...call, [field]: value });
  };

  const handleStatusChange = (call: CallRecord, newStatus: string) => {
    updateCall({ ...call, callStatus: newStatus });
  };

  // --- Batch Selection Logic ---
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragSelecting(false);
      setDragStartId(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleRowMouseDown = (e: React.MouseEvent, id: string, index: number) => {
    if (e.button !== 0) return; // Only left click
    // Avoid triggering drag if user is clicking an input, button, or select
    const target = e.target as HTMLElement;
    if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.closest('button')) {
      return;
    }
    
    if (e.shiftKey && lastSelectedId) {
      // Range selection
      const lastIndex = displayedList.findIndex(c => c.id === lastSelectedId);
      if (lastIndex !== -1) {
        const start = Math.min(index, lastIndex);
        const end = Math.max(index, lastIndex);
        const idsToSelect = displayedList.slice(start, end + 1).map(c => c.id);
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          idsToSelect.forEach(i => newSet.add(i));
          return newSet;
        });
      }
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelection(id);
      setLastSelectedId(id);
    } else {
      setIsDragSelecting(true);
      setDragStartId(id);
    }
  };

  const handleRowMouseEnter = (id: string) => {
    if (isDragSelecting) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (dragStartId) {
          newSet.add(dragStartId);
          setDragStartId(null);
        }
        newSet.add(id);
        return newSet;
      });
      setLastSelectedId(id);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: tr('حذف گروهی شماره‌ها', 'Batch delete numbers'),
      message: tr(`آیا مطمئن هستید که می‌خواهید ${selectedIds.size} شماره انتخاب شده را حذف کنید؟`, `Are you sure you want to delete ${selectedIds.size} numbers?`),
      onConfirm: () => {
        Array.from(selectedIds).forEach(id => {
          const call = calls.find(c => c.id === id);
          if (call) hardDeleteCall(id, call.phone);
        });
        toast.success(tr(`${selectedIds.size} شماره حذف شد.`, `${selectedIds.size} numbers deleted.`));
        setSelectedIds(new Set());
      }
    });
  };

  const handleBatchFollowUp = () => {
    if (selectedIds.size === 0) return;
    Array.from(selectedIds).forEach(id => {
      const call = calls.find(c => c.id === id);
      if (call && !call.isFollowUp) updateCall({ ...call, isFollowUp: true });
    });
    toast.success(tr(`نشانه‌گذاری پیگیری برای ${selectedIds.size} شماره انجام شد.`, `Follow-up marked for ${selectedIds.size} numbers.`));
    setSelectedIds(new Set());
  };

  const handleBatchCancelFollowUp = () => {
    if (selectedIds.size === 0) return;
    Array.from(selectedIds).forEach(id => {
      const call = calls.find(c => c.id === id);
      if (call && call.isFollowUp) updateCall({ ...call, isFollowUp: false });
    });
    toast.success(tr(`نشانه‌گذاری پیگیری برای ${selectedIds.size} شماره لغو شد.`, `Follow-up cancelled for ${selectedIds.size} numbers.`));
    setSelectedIds(new Set());
  };

  const handleBatchReset = () => {
    if (selectedIds.size === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: tr('بازگردانی گروهی به حالت اولیه', 'Batch Reset'),
      message: tr(`آیا مطمئن هستید که می‌خواهید اطلاعات ${selectedIds.size} شماره را به حالت خام اولیه (بدون یادداشت، نام، نتیجه و...) برگردانید؟`, `Are you sure you want to reset ${selectedIds.size} numbers to their raw state?`),
      onConfirm: () => {
        Array.from(selectedIds).forEach(id => {
          const call = calls.find(c => c.id === id);
          if (call) {
            updateCall({ 
              ...call, 
              fullName: '', 
              callStatus: '', 
              course: '', 
              notes: '', 
              isFollowUp: false 
            });
          }
        });
        toast.success(tr(`${selectedIds.size} شماره به حالت اولیه بازگردانی شد.`, `${selectedIds.size} numbers reset to raw state.`));
        setSelectedIds(new Set());
      }
    });
  };

  // --- End Batch Logic ---

  const handleActionModalSubmit = async (taskData: { taskType: ContactTaskType, scheduledDate?: string, scheduledTime?: string, followupNote?: string }) => {
    if (!actionModalCall) return;
    const call = actionModalCall;

    setSubmittingIds(prev => new Set(prev).add(call.id));

    try {
      await recordCallAttemptWithTask({
        contactId: call.id,
        fullName: call.fullName || '',
        callStatus: call.callStatus || '',
        taskType: taskData.taskType,
        scheduledDate: taskData.scheduledDate,
        scheduledTime: taskData.scheduledTime,
        followupNote: taskData.followupNote
      });
      toast.success(tr('پیگیری با موفقیت ثبت شد.', 'Follow-up task created.'));
      loadTasks();
      setActionModalCall(null);
    } catch (err) {
      toast.error(tr('خطا در ثبت پیگیری.', 'Error submitting task.'));
    } finally {
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
        toast.success(tr('پیگیری با موفقیت ویرایش شد.', 'Task updated.'));
        setEditModalTask(null);
        loadTasks();
     } catch(err) {
        toast.error(tr('خطا در ویرایش پیگیری', 'Error updating task'));
     }
  };

  const displayedList = useMemo(() => {
    let list = calls.filter(c => !c.isBlacklisted);
    if (searchQuery.trim()) {
      list = list.filter(c => matchesSearch(c, searchQuery));
    }
    if (selectedStatusFilter) {
      if (selectedStatusFilter === 'پیگیری') {
        list = list.filter(c => c.isFollowUp);
      } else if (selectedStatusFilter === 'ثبت نشده') {
        list = list.filter(c => !c.callStatus || !CALL_STATUSES.includes(c.callStatus));
      } else {
        list = list.filter(c => c.callStatus === selectedStatusFilter);
      }
    }
    return list.sort((a, b) => {
      // 1. Follow-ups at the top
      if (a.isFollowUp && !b.isFollowUp) return -1;
      if (!a.isFollowUp && b.isFollowUp) return 1;

      // 2. Original Excel order (queueOrder ASC, then createdAt ASC)
      const qDiff = (a.queueOrder ?? 0) - (b.queueOrder ?? 0);
      if (qDiff !== 0) return qDiff;
      const timeDiff = String(a.createdAt).localeCompare(String(b.createdAt));
      return timeDiff !== 0 ? timeDiff : String(a.id).localeCompare(String(b.id));
    });
  }, [calls, searchQuery, selectedStatusFilter]);

  // Status statistics
  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CALL_STATUSES.forEach(status => {
       stats[status] = 0;
    });
    stats['پیگیری'] = 0;
    stats['ثبت نشده'] = 0;
    
    calls.filter(c => !c.isBlacklisted).forEach(c => {
       if (c.callStatus && CALL_STATUSES.includes(c.callStatus)) {
           stats[c.callStatus]++;
       } else {
           stats['ثبت نشده']++;
       }
       if (c.isFollowUp) {
           stats['پیگیری']++;
       }
    });
    return stats;
  }, [calls]);

  // Today's Date and Total Calls
  const { todayDate, todayCalls } = useMemo(() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
    const isoDate = d.toISOString().split('T')[0];
    
    // Convert to jalali format string
    const dateFormatted = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);

    let count = 0;
    calls.forEach(c => {
       if (c.callStatus && c.updatedAt?.startsWith(isoDate)) {
           count++;
       }
    });
    return { todayDate: dateFormatted, todayCalls: count };
  }, [calls]);

  const exportDailyStats = async () => {
    if (displayedList.length === 0) return toast.info(tr('موردی برای خروجی وجود ندارد.', 'No items to export.'));
    const hStats = await getMyDailyStats();
    const todayStr = require('../../utils/jalali').toJalali();
    const todayCount = calls.filter(c => c.callStatus && c.updatedAt && require('../../utils/jalali').toJalali(c.updatedAt) === todayStr).length;
    await require('../../utils/consultationExcel').exportConsultationsToExcel(displayedList, displayedList.length, hStats, todayCount);
    toast.success(tr('فایل اکسل با موفقیت ایجاد شد.', 'Excel created successfully.'));
  };

  if (isLoadingCalls && !hasInitialCallsLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900" dir={direction}>
        <div className="text-slate-500 font-medium">{tr('در حال بارگذاری اطلاعات...', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col hide-scrollbar relative bg-white dark:bg-slate-900 ${isDragSelecting ? 'select-none' : ''}`} dir={direction}>
      {callsError && hasInitialCallsLoaded && (
        <div className="w-full max-w-3xl mx-auto mt-4 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[13.5px] font-medium text-center border border-rose-200  animate-pulse">
          {callsError}
        </div>
      )}
      
      {/* Batch Action Toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white rounded-xl shadow-2xl border border-slate-700 px-4 py-2.5 flex items-center gap-4 flex-nowrap overflow-x-auto hide-scrollbar max-w-[95vw]"
          >
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0"
              title="لغو انتخاب"
            >
              <X size={18} />
            </button>

            <div className="w-px h-6 bg-slate-600 shrink-0"></div>
            
            <button
              onClick={handleBatchFollowUp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-[12px] font-bold whitespace-nowrap shrink-0"
              title="نشانه‌گذاری به عنوان پیگیری"
            >
              <Icons.CalendarClock size={16} />
              <span>پیگیری</span>
            </button>
            
            <button
              onClick={handleBatchCancelFollowUp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300 text-[12px] font-bold whitespace-nowrap shrink-0"
              title="لغو نشانه‌گذاری پیگیری"
            >
              <Icons.CalendarOff size={16} />
              <span>لغو پیگیری</span>
            </button>

            <button
              onClick={() => {
                const note = window.prompt("متن یادداشت مشترک را وارد کنید:");
                if (note && note.trim()) {
                  Array.from(selectedIds).forEach(id => {
                    const call = calls.find(c => c.id === id);
                    if (call) updateCall({ ...call, notes: note.trim() });
                  });
                  toast.success(tr('یادداشت گروهی اعمال شد.', 'Batch notes applied.'));
                  setSelectedIds(new Set());
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-[12px] font-bold whitespace-nowrap shrink-0"
            >
              <MessageSquareQuote size={16} />
              <span>یادداشت مشترک</span>
            </button>
            
            <div className="w-px h-6 bg-slate-600 shrink-0"></div>

            <button
              onClick={handleBatchReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors text-[12px] font-bold whitespace-nowrap shrink-0"
            >
              <Icons.RefreshCcw size={16} />
              <span>ریست خام</span>
            </button>
            
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-[12px] font-bold whitespace-nowrap shrink-0"
            >
              <Trash2 size={16} />
              <span>حذف گروهی</span>
            </button>
            <div className="w-px h-6 bg-slate-600 shrink-0"></div>

            <div className="flex items-center gap-2 font-bold text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap shrink-0">
              <span className="text-cyan-400">{selectedIds.size}</span>
              <span>شماره انتخاب شده</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 w-full min-h-0 flex items-stretch" >
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="relative h-full bg-white flex flex-col overflow-hidden ">
          
            {/* Navigation & Search (Row 1) */}
            <div className="flex flex-nowrap overflow-x-auto hide-scrollbar items-center justify-between gap-3 p-2.5 bg-white border-b border-slate-200 shrink-0">
               {/* Right Side: Navigation Tabs */}
               <div className="flex items-center gap-1.5 shrink-0">
                 <button
                   onClick={() => setActiveTab('list')}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'list' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <Icons.List size={14} />
                   <span>{tr('لیست شماره‌ها', 'Call List')}</span>
                 </button>
                 <button
                   onClick={() => setActiveTab('courses')}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'courses' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <BookOpen size={14} />
                   <span>{tr('قیمت دوره‌ها', 'Courses')}</span>
                 </button>
                 <button
                   onClick={() => setActiveTab('learning_paths')}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'learning_paths' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <Route size={14} />
                   <span>{tr('مسیرهای یادگیری', 'Learning Paths')}</span>
                 </button>
                 <button
                   onClick={() => setActiveTab('intro')}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'intro' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <MessageSquareQuote size={14} />
                   <span>{tr('متن تماس', 'Intro Text')}</span>
                 </button>
                 <button
                   onClick={() => setActiveTab('negotiation')}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'negotiation' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <Icons.Target size={14} />
                   <span>{tr('تکنیک‌های مذاکره', 'Negotiation')}</span>
                 </button>
                 <button
                   onClick={() => setActiveTab('stats')}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-bold transition-colors whitespace-nowrap shrink-0 ${activeTab === 'stats' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <Icons.BarChart3 size={14} />
                   <span>{tr('آمار', 'Stats')}</span>
                 </button>
               </div>

               {/* Left Side: Search Box & Home */}
               <div className="flex items-center gap-2 w-full max-w-sm">
                 <div className="relative flex-1">
                   <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                     <Search size={14} className="text-slate-400" />
                   </div>
                   <input
                     type="text"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder={tr('جستجو...', 'Search...')}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pr-8 pl-3 text-[12px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
                   />
                   {searchQuery && (
                     <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 hover:text-slate-600">
                       <X size={14} />
                     </button>
                   )}
                 </div>
                 
                 <button
                   onClick={() => setCurrentView('home')}
                   className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                   title={tr('بازگشت به خانه', 'Return to Home')}
                 >
                   <Home size={14} className="text-slate-600" />
                   <span className="text-[12px] font-bold text-slate-700">{tr('بازگشت', 'Back')}</span>
                 </button>
               </div>
            </div>

            {/* Actions & Stats (Row 2) */}
            <div className="flex flex-nowrap overflow-x-auto hide-scrollbar items-center justify-between gap-3 p-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
               
               {/* Right Side: Stats Badges */}
               <div className="flex items-center gap-2 shrink-0">
                 {Object.entries(statusStats).map(([status, count]) => {
                    const isSelected = selectedStatusFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setSelectedStatusFilter(isSelected ? null : status)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap select-none cursor-pointer border ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                        title={isSelected ? tr('حذف فیلتر', 'Clear filter') : tr(`فیلتر براساس ${status}`, `Filter by ${status}`)}
                      >
                         <span>{status}:</span>
                         <span className={isSelected ? 'text-white font-extrabold' : 'text-brand-600'}>{count}</span>
                      </button>
                    );
                 })}
                 {selectedStatusFilter && (
                   <button
                     onClick={() => setSelectedStatusFilter(null)}
                     className="text-[11px] font-bold px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors whitespace-nowrap cursor-pointer"
                   >
                     {tr('نمایش همه', 'Show All')}
                   </button>
                 )}
               </div>
               
               {/* Left Side: Actions */}
               <div className="flex items-center gap-2 shrink-0">

                 {/* Upload */}
                 <button
                   onClick={() => fileInputRef.current?.click()}
                   className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-[11px] font-bold text-slate-700 whitespace-nowrap shrink-0"
                 >
                   <Icons.Upload size={13} />
                   <span>{tr('اکسل', 'Excel')}</span>
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />

                 {/* Add Manual */}
                 <button
                   onClick={() => setIsManualAddOpen(true)}
                   className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors text-[11px] font-bold text-emerald-700 whitespace-nowrap shrink-0"
                 >
                   <Plus size={13} strokeWidth={2.5} /> 
                   <span>{tr('افزودن', 'Add')}</span>
                 </button>
                 
                 {/* Delete All */}
                 <button
                   onClick={() => {
                     setConfirmModalConfig({
                       isOpen: true,
                       title: tr('حذف تمامی شماره‌ها', 'Delete all numbers'),
                       message: tr('آیا مطمئن هستید که می‌خواهید همه شماره‌های این لیست را حذف کنید؟', 'Are you sure you want to delete all?'),
                       onConfirm: () => {
                         calls.filter(c => displayedList.some(f => f.id === c.id)).forEach(c => hardDeleteCall(c.id, c.phone));
                         toast.success(tr('لیست پاک شد.', 'List cleared.'));
                       }
                     });
                   }}
                   className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors text-[11px] font-bold text-rose-700 whitespace-nowrap shrink-0"
                 >
                   <Trash2 size={13} /> 
                   <span>{tr('حذف', 'Delete')}</span>
                 </button>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-select-scroll relative z-10">
              
              {activeTab === 'courses' ? (
                <div className="w-full h-full p-4"><CoursesView embedded={true} /></div>
              ) : activeTab === 'intro' ? (
                <div className="w-full h-full p-4"><IntroTextView embedded={true} /></div>
              ) : activeTab === 'learning_paths' ? (
                <div className="w-full h-full relative"><LearningPathsModal isOpen={true} onClose={() => {}} embedded={true} /></div>
              ) : activeTab === 'stats' ? (
                <div className="w-full h-full relative"><CallListStats calls={displayedList} onExport={exportDailyStats} /></div>
              ) : activeTab === 'negotiation' ? (
                <div className="w-full h-full relative"><NegotiationView embedded={true} /></div>
              ) : (
                <div className="p-3 md:p-4">
                  <table className="w-full text-center border-separate border-spacing-y-2 table-fixed min-w-[900px]">
                  <colgroup>
                    <col className="w-[50px]" /> {/* Checkbox */}
                    <col className="w-[180px]" /> {/* Phone/Name */}
                    <col className="w-[180px]" /> {/* Call Result */}
                    <col className="w-[200px]" /> {/* Interested Course */}
                    <col className="w-[300px]" /> {/* Actions */}
                  </colgroup>
                  <thead className="sticky top-0 z-20 backdrop-blur-md">
                    <tr className="[&>th]:bg-slate-100/90 [&>th]:py-2.5 [&>th]:px-2 [&>th]:border-y [&>th]:border-slate-200/80 [&>th:first-child]:rounded-r-xl [&>th:first-child]:border-r [&>th:last-child]:rounded-l-xl [&>th:last-child]:border-l text-[12px] font-extrabold text-slate-800 tracking-wide">
                      <th className="text-center">
                         <input 
                           type="checkbox" 
                           checked={selectedIds.size > 0 && selectedIds.size === displayedList.length}
                           onChange={(e) => {
                             if (e.target.checked) {
                               setSelectedIds(new Set(displayedList.map(c => c.id)));
                             } else {
                               setSelectedIds(new Set());
                             }
                           }}
                           className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                         />
                      </th>
                      <th className="whitespace-nowrap">{tr('شماره تماس و نام', 'Phone & Name')}</th>
                      <th className="whitespace-nowrap">{tr('نتیجه تماس', 'Call Result')}</th>
                      <th className="whitespace-nowrap">{tr('دوره مدنظر', 'Course')}</th>
                      <th>{tr('عملیات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-medium text-slate-800 relative">
                    <AnimatePresence>
                    {displayedList.length === 0 ? (
                      <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={5} className="py-24 text-center"></td>
                      </motion.tr>
                    ) : (
                      displayedList.map((c, index) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          onMouseDown={(e) => handleRowMouseDown(e, c.id, index)}
                          onMouseEnter={() => handleRowMouseEnter(c.id)}
                          className={`relative focus-within:z-50 hover:z-40 transition-all duration-200 group rounded-xl shadow-2xs hover:shadow-md ${
                            selectedIds.has(c.id)
                              ? 'bg-indigo-50/80 hover:bg-indigo-100/90 [&>td]:border-indigo-200'
                              : c.isFollowUp
                                ? 'bg-orange-50/70 hover:bg-orange-100/80 [&>td]:border-orange-200'
                                : 'bg-white hover:bg-slate-50/90 [&>td]:border-slate-200/80'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-2.5 px-2 text-center rounded-r-xl border-y border-r border-inherit" onClick={(e) => e.stopPropagation()}>
                             <input 
                               type="checkbox"
                               checked={selectedIds.has(c.id)}
                               onChange={() => toggleSelection(c.id)}
                               className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                             />
                          </td>

                          {/* Phone and Name */}
                          <td className="py-2.5 px-2 relative whitespace-nowrap border-y border-inherit">
                             <div className="flex flex-col items-center justify-center w-full px-2">
                                <span dir="ltr" className="font-bold text-[18px] tracking-[0.1em] text-slate-800">{formatPhoneNumber(c.phone)}</span>
                                <input
                                  type="text"
                                  value={c.fullName || ''}
                                  onChange={e => handleFieldChange(c, 'fullName', e.target.value)}
                                  placeholder={tr('نام شخص...', 'Name...')}
                                  className="text-[13px] font-bold text-slate-800 text-center bg-transparent border-b border-slate-200 hover:border-slate-300 focus:border-cyan-600 outline-none w-40 mt-1 transition-colors placeholder:text-slate-400"
                                />
                             </div>
                          </td>

                          {/* Call Status */}
                          <td className="py-2.5 px-2 relative whitespace-nowrap border-y border-inherit">
                             <div className="flex items-center justify-center">
                                <TableDropdown
                                  value={c.callStatus || ''}
                                  onChange={(val) => handleStatusChange(c, val)}
                                  options={[
                                    { value: '', label: 'انتخاب نتیجه...' },
                                    ...CALL_STATUSES.map(s => ({ value: s, label: valueLabel(s) }))
                                  ]}
                                  placeholder={tr('انتخاب نتیجه...', 'Select Result...')}
                                />
                             </div>
                          </td>

                          {/* Course */}
                          <td className="py-2.5 px-2 relative whitespace-nowrap overflow-visible border-y border-inherit">
                             <div className="flex items-center justify-center">
                                <CourseAutocomplete
                                  value={c.interestedCourse || ''}
                                  onChange={(val) => handleFieldChange(c, 'interestedCourse', val)}
                                />
                             </div>
                          </td>

                           {/* Actions */}
                          <td className="py-2.5 px-2 relative border-y border-l border-inherit rounded-l-xl">
                             <div className="flex justify-center items-center gap-2">
                                {/* Follow-up Button */}
                                <button
                                  onClick={() => handleFieldChange(c, 'isFollowUp', !c.isFollowUp)}
                                  title={c.isFollowUp ? tr('لغو پیگیری', 'Cancel Follow-up') : tr('پیگیری شود', 'Needs Follow-up')}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[12px] font-bold border ${
                                    c.isFollowUp 
                                      ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600' 
                                      : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                                  }`}
                                >
                                  <CalendarClock size={16} />
                                  <span>{c.isFollowUp ? tr('لغو پیگیری', 'Cancel Follow-up') : tr('پیگیری شود', 'Needs Follow-up')}</span>
                                </button>
                                
                                {/* Notes Button */}
                                <button
                                  onClick={() => setNotesModalCall(c)}
                                  title={tr('افزودن یادداشت', 'Notes')}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all  border text-[12px] font-bold
                                    ${c.notes 
                                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                >
                                  <MessageSquareQuote size={16} />
                                  <span>{tr('یادداشت', 'Notes')}</span>
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => {
                                    setConfirmModalConfig({
                                      isOpen: true,
                                      title: tr('حذف شماره', 'Delete'),
                                      message: tr('آیا مطمئن هستید که می‌خواهید این شماره را حذف کنید؟', 'Are you sure you want to delete this number?'),
                                      onConfirm: async () => {
                                        try {
                                          await hardDeleteCall(c.id, c.phone);
                                          toast.success(tr('شماره حذف شد.', 'Number deleted.'));
                                        } catch (err) {
                                          toast.error(tr('خطا در حذف شماره', 'Error deleting number.'));
                                        }
                                      }
                                    });
                                  }}
                                  title={tr('حذف شماره', 'Delete')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all  text-[12px] font-bold"
                                >
                                  <Trash2 size={16} />
                                  <span>{tr('حذف', 'Delete')}</span>
                                </button>
                             </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>
                </div>
              )}

              {displayedList.length === 0 && activeTab === 'list' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500 z-0">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 ">
                      <Filter size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600 text-[15px] mb-2">{tr('هیچ داده‌ای یافت نشد', 'No data found')}</p>
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
        activeTab="followup"
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
    </div>
  );
};

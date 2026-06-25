import React, { useMemo, useState, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { CallRecord } from '../../types';
import * as Icons from 'lucide-react';
import { PhoneOff, Phone, PhoneForwarded, Link as LinkIcon, BookOpen, Users, CheckCircle2, FileText, Search, XCircle, Filter, X, Check, Plus, Calendar, Eraser, Trash2, Upload, ChevronDown, Ban } from 'lucide-react';
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
import { OrbitalCardView } from './OrbitalCardView';

type Tab = 'home' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses';

const getStatusDot = (status: string) => {
  if (status === 'پاسخ داد') return 'bg-teal-500/80';
  if (['پاسخ نداد', 'در دسترس نیست', 'مشغول بود', 'دستگاه خاموش'].includes(status)) return 'bg-amber-400/80';
  if (['عدم تمایل قطعی', 'عدم تمایل', 'شماره ناموجود'].includes(status)) return 'bg-rose-400/80';
  return 'bg-slate-300';
};

const getStatusIcon = (status: string) => {
  if (status === 'پاسخ داد') return <Phone size={14} className="text-teal-600/80" />;
  if (['پاسخ نداد', 'در دسترس نیست', 'دستگاه خاموش'].includes(status)) return <PhoneOff size={14} className="text-slate-500" />;
  if (status === 'مشغول بود') return <PhoneForwarded size={14} className="text-amber-500/80" />;
  if (['عدم تمایل', 'عدم تمایل قطعی'].includes(status)) return <PhoneOff size={14} className="text-rose-500/80" />;
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
                  <label className="text-[12px] font-medium text-slate-500 mb-1 block">{tr('شماره موبایل', 'Mobile Number')} *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] font-normal border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-left "
                    placeholder="0912..."
                    dir="ltr"
                  />
               </div>
               <div>
                  <label className="text-[12px] font-medium text-slate-500 mb-1 block">{tr('نام و نام خانوادگی', 'Full Name')}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] font-normal border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 "
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
  const { calls, activeCallTab: activeTab, setActiveCallTab: setActiveTab, updateCall, deleteCall, addCall, bulkAddCalls, recordAttempt, profile, blacklist, addToBlacklist, layoutMargin } = useAppContext();
  const { tr, valueLabel, direction } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  

  const hasAnyFieldSelected = (c: CallRecord) => {
    return !!(c.callStatus || (c.courses && c.courses.length > 0) || c.advisory || c.registered);
  };
  
  const [notesModalCall, setNotesModalCall] = useState<CallRecord | null>(null);
  const [advisoryModalCall, setAdvisoryModalCall] = useState<CallRecord | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
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

  const handleManualAdd = (phone: string, fullName: string) => {
    if (blacklist.includes(phone)) {
      toast.error(tr('خطا: این شماره در لیست سیاه قرار دارد و نمی‌تواند اضافه شود.', 'Error: This number is blacklisted and cannot be added.'));
      return;
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

  const handleStatusChange = (call: CallRecord, newStatus: string) => {
    if (newStatus !== 'پاسخ داد') {
      updateCall({ ...call, callStatus: newStatus, courses: [], advisory: undefined, registered: undefined });
    } else {
      updateCall({ ...call, callStatus: newStatus });
    }
  };

  const handleRowSubmit = (call: CallRecord) => {
    const limits = getDayLimits();
    const hasAttemptToday = call.attempts?.some(a => (a.createdAt || " ").split('T')[0] === limits.today);

    if (hasAttemptToday) {
      const updatedAttempts = call.attempts?.filter(a => (a.createdAt || " ").split('T')[0] !== limits.today) || [];
      updateCall({ ...call, attempts: updatedAttempts });
      toast.success(tr('از فعالیت امروز خارج شد.', 'Removed from today.'));
    } else {
      recordAttempt(call.id, {
        fullName: call.fullName || '',
        callStatus: call.callStatus || '',
        courses: call.courses || [],
        advisory: call.advisory || '',
        advisoryDate: call.advisoryDate || '',
        advisoryTime: call.advisoryTime || '',
        registered: call.registered || '',
        notes: call.notes || ''
      });
      toast.success(tr('به فعالیت امروز اضافه شد.', 'Added to today.'));
    }
  };

  const filteredList = useMemo(() => {
    let list = calls;
    const limits = getDayLimits();

    if (activeTab === 'today') {
      list = list.filter(c => c.attempts?.some(a => (a.createdAt || " ").split('T')[0] === limits.today));
    } else if (activeTab === 'queue') {
      list = list.filter(c => {
         const hasAttemptToday = c.attempts?.some(a => (a.createdAt || " ").split('T')[0] === limits.today);
         if (hasAttemptToday) return false;
         
         const hasAnyAttempt = c.attempts && c.attempts.length > 0;
         return !hasAnyAttempt;
      });
    } else if (activeTab === 'followup') {
      list = list.filter(c => {
         if (!c.attempts || c.attempts.length === 0) return false;
         const lastAttempt = c.attempts[c.attempts.length - 1];
         const s = lastAttempt.callStatus;
         const adv = lastAttempt.advisory;
         return s === 'عدم تمایل' || 
                s === 'پاسخ نداد' || 
                s === 'نامشخص' || 
                s === 'پیگیری مجدد در هفته آینده' ||
                adv === 'بله' || 
                adv === 'خیر' || 
                adv === 'قصد دارد' ||
                adv === 'در آینده' ||
                adv === 'احتمالا';
      });
    }

    if (searchQuery.trim()) {
      list = list.filter(c => (c.phone || '').includes(searchQuery) || (c.fullName || '').includes(searchQuery));
    }
    return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [calls, activeTab, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col pb-4 hide-scrollbar relative bg-slate-50" dir={direction}>
      {/* Global Search Bar Under Header */}
      <div className="pt-4 pb-2 w-full flex justify-center" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
        <div className="relative flex items-center w-full max-w-3xl group">
          <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-500/60 group-focus-within:text-brand-500 transition-colors">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'courses' ? tr('جستجو در دوره‌ها...', 'Search courses...') : tr('جستجو در شماره‌ها و نام‌ها...', 'Search numbers and names...')}
            dir={direction}
            className="w-full h-12 bg-white border border-slate-200/80 rounded-[1.25rem] pr-12 pl-12 text-[14px] font-medium text-slate-900 placeholder:text-muted outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm hover:border-brand-500/40 hover:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-xl bg-slate-50 text-muted hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View with Sidebars */}
      <div className="flex-1 w-full min-h-0 flex items-stretch gap-4 pt-4 pb-4" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
        {/* Center Grid */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Contextual Toolbar (Moved from Right Sidebar) */}
        {activeTab === 'queue' && (
          <div className="flex items-center gap-2 mb-3 px-2">
             <button 
                onClick={() => setIsManualAddOpen(true)}
                className="h-9 px-3 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center hover:bg-brand-500/20 border border-brand-500/20 transition-all font-medium text-[12px] gap-2"
              >
                <Plus size={16} /> {tr('افزودن دستی', 'Add')}
              </button>
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
                className="h-9 px-3 mr-auto rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 border border-rose-500/20 transition-all font-medium text-[12px] gap-2"
              >
                <Trash2 size={16} /> {tr('حذف همه', 'Delete All')}
              </button>
          </div>
        )}
        {activeTab === 'blacklist' ? (
          <BlacklistView />
        ) : activeTab === 'stats' ? (
          <StatsView />
        ) : activeTab === 'courses' ? (
          <CoursesView externalSearchQuery={searchQuery} />
        ) : (
          <div className="relative h-full bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
          
          <div className="flex-1 overflow-auto custom-select-scroll relative z-10">
            <table className="w-full text-center border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-20">
                <tr>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide whitespace-nowrap">{tr('شماره تماس', 'Phone')}</th>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide whitespace-nowrap">{tr('وضعیت تماس', 'Call Status')}</th>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide whitespace-nowrap">{tr('دوره‌ها', 'Courses')}</th>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide whitespace-nowrap">{tr('مشاوره حضوری', 'Consultation')}</th>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide whitespace-nowrap">{tr('ثبت‌نام', 'Registration')}</th>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide whitespace-nowrap">{tr('تاریخ و ساعت', 'Date & Time')}</th>
                  <th className="py-5 px-4 text-[12px] font-bold text-slate-500 tracking-wide w-24">{tr('عملیات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="text-[13px] font-medium text-slate-700 relative z-0">
                {filteredList.map((c, i) => (
                  <React.Fragment key={c.id}>
                  <tr 
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-300 group"
                  >
                    {/* Phone */}
                    <td className="p-5 relative whitespace-nowrap min-w-[200px]">
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10" title={tr('ثبت وضعیت / لغو ثبت', 'Submit / Unsubmit')}>
                          <Checkbox 
                            checked={c.attempts?.some(a => (a.createdAt || " ").split('T')[0] === getDayLimits().today)} 
                            onCheckedChange={() => handleRowSubmit(c)} 
                            variant="default"
                            disabled={!hasAnyFieldSelected(c)}
                          />
                       </div>
                       <div className="flex flex-col items-center justify-center w-full px-8">
                          <span dir="ltr" className="font-extrabold text-[17px] tracking-wider text-slate-900 group-hover:text-cyan-600 transition-colors">{c.phone}</span>
                          <input 
                            type="text" 
                            value={c.fullName || ''} 
                            onChange={e => handleFieldChange(c, 'fullName', e.target.value)}
                            placeholder={tr('نام شخص...', 'Name...')} 
                            className="text-[13px] text-slate-500 group-hover:text-slate-900 font-normal text-center bg-transparent border-b border-transparent hover:border-slate-200 focus:border-cyan-500 outline-none w-28 transition-colors" 
                          />
                       </div>
                    </td>
                    
                    {/* Call Status */}
                    <td className="p-5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(c.callStatus || '')}
                          <TableDropdown
                            value={c.callStatus || ''}
                            onChange={(val) => handleStatusChange(c, val)}
                            options={['پاسخ داد', 'پاسخ نداد', 'در دسترس نیست', 'مشغول بود', 'دستگاه خاموش', 'عدم تمایل قطعی', 'شماره ناموجود', 'پیگیری مجدد در هفته آینده'].map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('وضعیت تماس', 'Status')}
                          />
                       </div>
                    </td>

                    {/* Courses */}
                    <td className="p-5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-2">
                          <BookOpen size={16} className="text-muted" />
                          <TableMultiSelect
                            values={c.courses || []}
                            onChange={(vals) => handleFieldChange(c, 'courses', vals)}
                            disabled={c.callStatus !== 'پاسخ داد'}
                            placeholder={tr('انتخاب دوره', 'Select course')}
                          />
                       </div>
                    </td>

                    {/* Consultation */}
                    <td className="p-5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-2">
                          <Users size={16} className="text-muted" />
                          <TableDropdown
                            value={c.advisory || ''}
                            onChange={(val) => handleFieldChange(c, 'advisory', val)}
                            disabled={c.callStatus !== 'پاسخ داد'}
                            options={['بله', 'خیر', 'هماهنگی بعدا'].map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('مشاوره حضوری', 'Consultation')}
                          />
                       </div>
                    </td>

                    {/* Registration */}
                    <td className="p-5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center gap-2">
                          {c.registered === 'ثبت نام کرد' || c.registered === 'قصد دارد' ? (
                            <CheckCircle2 size={16} className="text-teal-500/80" />
                          ) : c.registered === 'قصد ندارد' ? (
                            <XCircle size={16} className="text-rose-400/80" />
                          ) : (
                            <CheckCircle2 size={16} className="text-slate-500" />
                          )}
                          <TableDropdown
                            value={c.registered || ''}
                            onChange={(val) => handleFieldChange(c, 'registered', val)}
                            disabled={c.callStatus !== 'پاسخ داد'}
                            options={['ثبت نام کرد', 'ثبت نام نکرد', 'نامشخص', 'قصد دارد', 'در آینده', 'احتمالا', 'قصد ندارد'].map(s => ({ value: s, label: valueLabel(s) }))}
                            placeholder={tr('ثبت‌نام', 'Registration')}
                          />
                       </div>
                    </td>

                    {/* Date & Time */}
                    <td className="p-5 relative whitespace-nowrap">
                       <div className="flex items-center justify-center">
                          {c.advisory === 'بله' ? (
                             <button 
                               onClick={() => setAdvisoryModalCall(c)}
                               className="text-[14px] font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors border border-transparent hover:border-brand-200 min-w-[120px]"
                             >
                               {c.advisoryDate && c.advisoryTime ? `${c.advisoryDate} ${c.advisoryTime}` : tr('انتخاب تاریخ...', 'Select date...')}
                             </button>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                       </div>
                    </td>

                    {/* Actions */}
                    <td className="p-5 relative">
                       <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => setNotesModalCall(c)}
                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                               c.notes 
                                 ? 'bg-cyan-600 text-white  border border-cyan-700' 
                                 : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-cyan-600'
                             }`} 
                             title={c.notes || tr('یادداشت', 'Notes')}
                           >
                              <FileText size={18} />
                           </button>
                           <button 
                             onClick={() => {
                                updateCall({ 
                                   ...c, 
                                   callStatus: '', 
                                   courses: [], 
                                   advisory: '', 
                                   advisoryDate: '', 
                                   advisoryTime: '', 
                                   registered: '', 
                                   notes: '' 
                                });
                                toast.success(tr('اطلاعات ریست شد.', 'Information reset.'));
                             }}
                             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-amber-600 border border-slate-200 hover:bg-amber-50 hover:border-amber-200 tooltip-trigger"
                             title={tr('ریست کردن فیلدهای این شماره', 'Reset fields')}
                           >
                              <Eraser size={18} />
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
                             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-800 tooltip-trigger"
                             title={tr('افزودن به لیست سیاه', 'Add to blacklist')}
                           >
                              <Ban size={18} />
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
                             className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-slate-50 text-rose-600 border border-slate-200 hover:bg-rose-500/20 hover:text-rose-700 hover:border-rose-400/50 tooltip-trigger"
                             title={tr('حذف شماره', 'Delete number')}
                           >
                              <Trash2 size={18} />
                           </button>
                       </div>
                    </td>
                  </tr>
                  
                  
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            {filteredList.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50 text-slate-500">
                  <Filter size={48} className="mb-4 text-slate-400" />
                  <p className="font-medium">{tr('هیچ داده‌ای یافت نشد.', 'No data found.')}</p>
                </div>
            )}
          </div>
        </div>
        )}
      </div>
      </div>
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
             handleFieldChange(advisoryModalCall, 'advisoryDate', date);
             handleFieldChange(advisoryModalCall, 'advisoryTime', time);
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
    </div>
  );
};



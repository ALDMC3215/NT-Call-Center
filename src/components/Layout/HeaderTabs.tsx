import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { User, Settings, LayoutDashboard, LogOut, Upload, FileSpreadsheet, FileJson, BarChart3, Shield, ShieldBan, Bell, Calendar as CalendarIcon, Clock as ClockIcon, Menu, Blocks } from 'lucide-react';
import { motion } from 'motion/react';
import { calculateStats } from '../../utils/stats';
import { toJalali, nowJalali } from '../../utils/jalali';
import { customToast as toast } from '../UI/toast';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import * as XLSX from 'xlsx';
import { useLocale } from '../../hooks/useLocale';
import { isActiveFollowup } from '../../utils/followups';

interface TabItem {
  id: 'home' | 'today' | 'dashboard' | 'profile' | 'settings' | 'stats' | 'admin' | 'blacklist';
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'خانه', icon: Blocks },
  { id: 'dashboard', label: 'شماره ها', icon: LayoutDashboard },
  { id: 'today', label: 'فعالیت امروز', icon: CalendarIcon },
  { id: 'blacklist', label: 'لیست سیاه', icon: ShieldBan },
  { id: 'stats', label: 'آمار', icon: BarChart3 },
  { id: 'admin', label: 'مدیریت', icon: Shield },
];

export const HeaderTabs = () => {
  const { activeCallTab: activeTab, setActiveCallTab: setActiveTab, profile, calls, blacklist, isBlacklisted, logout, currentView, setCurrentView, bulkAddCalls, restoreBackup } = useAppContext();
  const { isFa, tr, language, direction } = useLocale();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsRemindersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const today = toJalali();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const reminders = calls
    .filter(c => c.nextFollowUpAt && new Date(c.nextFollowUpAt).getTime() <= currentTime)
    .sort((a, b) => (a.nextFollowUpAt || '').localeCompare(b.nextFollowUpAt || ''));

  useEffect(() => {
    // Relying on the visual badge instead of toasts to prevent notification spam
  }, [reminders.length]);

  if (!profile) return null;

  const handleExportAllExcel = () => {
    const wb = XLSX.utils.book_new();

    // Profile Info
    const profileWs = XLSX.utils.json_to_sheet([profile]);
    XLSX.utils.book_append_sheet(wb, profileWs, "Operator");

    // Calls Info
    if (calls.length > 0) {
      const callsWs = XLSX.utils.json_to_sheet(calls);
      XLSX.utils.book_append_sheet(wb, callsWs, "Calls");
    }

    const safeDate = toJalali().replace(/\//g, '-');
    const safeName = profile.name.replace(/\s+/g, '-').toLowerCase();
    XLSX.writeFile(wb, `novintech_${safeName}_${safeDate}.xlsx`);
    toast.success(tr('خروجی اکسل با موفقیت ایجاد شد.', 'Excel export created successfully.'));
  };

  const handleExportAllJson = () => {
    const stats = calculateStats(calls);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const filteredCalls = calls.filter(c => {
      const isToday = c.attempts?.some(a => (a.createdAt || " ").split('T')[0] === todayStr);
      if (isToday) return true;
      if (isToday) return true;
      return isActiveFollowup(c);
    });

    // Add complete and accurate information
    const exportData = {
      exportVersion: "4.0",
      exportedAt: nowJalali(),
      timestamp: new Date().toISOString(),
      sessionInfo: {
        ...profile,
        durationLimit: '8h', // just a placeholder since we don't have shift duration
        activeCalls: filteredCalls.length,
      },
      summary: {
        ...stats,
        lastActivity: filteredCalls.length ? filteredCalls[0].createdAt : null, // calls sorted descending
      },
      blacklist: blacklist,
      callsDetailed: filteredCalls.map(c => ({
        ...c,
        isAdvisoryScheduled: !!(c.advisoryDate || c.advisoryTime),
        hasNotes: !!c.notes,
        tags: c.courses,
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    const safeName = profile.name.replace(/\s+/g, '-').toLowerCase();
    const safeDate = toJalali().replace(/\//g, '-');
    downloadAnchorNode.setAttribute("download", `novintech_${safeName}_${safeDate}.json`);
    
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success(tr('خروجی JSON با موفقیت ایجاد شد.', 'JSON export created successfully.'));
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const jsonStr = evt.target?.result as string;
        const data = JSON.parse(jsonStr);
        
        if (data.sessionInfo && data.sessionInfo.name && data.callsDetailed) {
          const importedCalls = data.callsDetailed.map((c: any) => {
            const { isAdvisoryScheduled, hasNotes, tags, ...rest } = c;
            return rest;
          });
          const importedBlacklist = data.blacklist || [];
          
          restoreBackup(data.sessionInfo, importedCalls, importedBlacklist);
          toast.success(tr('بکاپ با موفقیت بازیابی شد.', 'Backup restored successfully.'));
        } else {
          toast.error(tr('فایل بکاپ نامعتبر است.', 'Invalid backup file.'));
        }
      } catch (err) {
        toast.error(tr('خطا در پردازش فایل JSON.', 'Unable to process the JSON file.'));
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        let count = 0;
        let skippedPhones: string[] = [];
        const newCalls: any[] = [];
        data.forEach((row: any) => {
          for (let i = 0; i < Math.min(row.length, 3); i++) {
            const cellVal = String(row[i] || '').trim();
            if (cellVal.length >= 7 && /\d{4}/.test(cellVal) && !/[a-zA-Z]/.test(cellVal)) {
              if (isBlacklisted(cellVal)) {
                skippedPhones.push(cellVal);
              } else {
                newCalls.push({
                  phone: cellVal,
                  callStatus: '',
                  courses: [],
                  advisory: '',
                  advisoryDate: '',
                  advisoryTime: '',
                  registered: '',
                  notes: ''
                });
                count++;
              }
              break; 
            }
          }
        });
        if (newCalls.length > 0) {
          bulkAddCalls(newCalls);
        }
        
        if (skippedPhones.length > 0) {
          toast.error(tr(`تعداد ${skippedPhones.length} شماره به دلیل قرار داشتن در لیست سیاه حذف شدند:\n${skippedPhones.join(' ، ')}`, `${skippedPhones.length} numbers skipped due to blacklist:\n${skippedPhones.join(', ')}`), { duration: 8000 });
        }
        
        if (count > 0) {
          toast.success(tr(`تعداد ${count} شماره با موفقیت وارد شد.`, `${count} numbers imported successfully.`));
        } else if (skippedPhones.length === 0) {
          toast.error(tr('هیچ شماره معتبری در فایل یافت نشد.', 'No valid phone number was found.'));
        }
      } catch (err) {
        toast.error(tr('خطا در پردازش فایل اکسل.', 'Unable to process the Excel file.'));
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderTab = (tab: TabItem) => {
    const isActive = currentView === tab.id;
    const Icon = tab.icon;
    
    return (
      <motion.button
        key={tab.id}
        onClick={() => setCurrentView(tab.id as any)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative flex h-10 items-center justify-center gap-2 rounded-xl px-4 transition-colors duration-300 ease-out outline-none z-10 border-2 ${
          isActive 
            ? 'text-[#4e6077] border-[#4e6077] bg-[#fffcfb]' 
            : 'text-[#7089a9] border-transparent hover:border-[#aadb9f] bg-transparent'
        }`}
      >
        <span className={`hidden whitespace-nowrap pt-0.5 text-[13px] tracking-wide md:inline ${isActive ? 'font-extrabold' : 'font-medium'}`}>{isFa ? tab.label : ({ home: 'Home', dashboard: 'Calls', today: 'Today', blacklist: 'Blacklist', stats: 'Statistics', admin: 'Admin' }[tab.id] || tab.label)}</span>
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      </motion.button>
    );
  };

  return (
    <div className="w-full flex items-center justify-between px-2.5 md:px-4 h-full shrink-0 relative z-30" dir="ltr">
      <div className="flex items-center justify-between w-full h-full" dir="ltr">
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className="order-0 flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-slate-900 hover:bg-surface-hover transition-colors"
          aria-label={tr('صفحه اصلی', 'Home')}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-400/40 bg-brand-100 text-brand-700"><Blocks size={17} /></span>
          <span className="hidden text-left md:block" dir="ltr">
            <span className="block text-[12px] font-extrabold tracking-[0.14em] text-slate-900">NOVIN BITS</span>
            <span className="block text-[9px] font-medium tracking-[0.12em] text-secondary">CALL WORKSPACE</span>
          </span>
        </button>
        {/* Right Side in RTL - Actions Menu */}
        <div className="order-2 flex flex-row-reverse items-center justify-start gap-1.5 relative w-auto" ref={menuRef} dir={direction}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden" 
          />
          <input 
            type="file" 
            ref={jsonInputRef} 
            onChange={handleImportJson} 
            accept=".json, application/json"
            className="hidden" 
          />
          
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              if (!isMenuOpen) setIsRemindersOpen(false);
            }}
            className="flex items-center gap-2 px-3 md:px-4 h-10 rounded-xl border border-border bg-surface  hover:border-brand-300 hover:bg-brand-50 transition-all duration-150 ease-out outline-none font-medium text-[13px] text-secondary"
          >
            {tr('منو', 'Menu')}
            <Menu size={18} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => {
              setIsRemindersOpen(!isRemindersOpen);
              if (!isRemindersOpen) setIsMenuOpen(false);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-transparent hover:border-brand-200 hover:bg-brand-50 transition-all duration-150 ease-out outline-none relative text-secondary hover:text-brand-700"
          >
            <Bell size={18} strokeWidth={2.5} />
            {reminders.length > 0 && (
              <span className="absolute -top-0.5 -left-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-amber-500 text-slate-900 text-[9px] font-medium rounded-full ring-2 ring-white">
                {reminders.length}
              </span>
            )}
          </button>

          {isRemindersOpen && (
            <div className="absolute top-12 right-0 w-[min(320px,calc(100vw-24px))] bg-surface  rounded-xl border border-border z-50 flex flex-col overflow-hidden" dir={direction}>
               <div className="p-3 border-b border-border bg-surface-hover flex items-center justify-between rounded-xl-t-sm">
                <div className="flex items-center gap-2 text-secondary">
                  <Bell size={16} strokeWidth={2.5} />
                  <span className="font-medium text-[13px]">{tr('یادآوری‌ها', 'Reminders')}</span>
                </div>
                <span className="bg-slate-200 text-secondary px-2 py-0.5 rounded-xl text-[11px] font-medium">{reminders.length}</span>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto hide-scrollbar flex flex-col p-1 gap-1">
                {reminders.length === 0 ? (
                  <div className="p-4 text-center text-secondary text-[13px] font-normal">
                    {tr('هیچ یادآوری برای امروز یا گذشته وجود ندارد.', 'There are no due reminders.')}
                  </div>
                ) : (
                  reminders.map(r => (
                    <div key={r.id} className="flex flex-col p-3 rounded-xl hover:bg-surface-hover border border-transparent hover:border-border cursor-default">
                      <div className="flex items-center justify-between mb-2">
                         <span className="font-extrabold text-[13px] text-secondary tracking-wider block text-left" dir="ltr">{r.phone}</span>
                         <span className="text-[11px] font-medium px-2 py-0.5 rounded-xl bg-amber-100 text-amber-800">
                           {tr('موعدرسیده', 'Due')}
                         </span>
                      </div>
                      <div className="flex items-center gap-4 text-[12px] font-normal text-secondary">
                        <div className="flex items-center gap-1.5"><CalendarIcon size={14} /> {today}</div>
                        <div className="flex items-center gap-1.5"><ClockIcon size={14} /> {r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toLocaleTimeString(language === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : tr('نامشخص', 'Unknown')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {isMenuOpen && (
            <div className="absolute top-12 right-0 w-[260px] md:w-[290px] max-w-[calc(100vw-24px))] bg-surface  rounded-xl border border-border z-50 flex flex-col overflow-hidden" dir={direction}>
                <div className="flex flex-col p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'today') {
                           setCurrentView('dashboard');
                           setActiveTab('today');
                        } else {
                           setCurrentView(tab.id as any);
                        }
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover border border-transparent hover:border-border rounded-xl w-full text-right transition-all duration-150 ease-out justify-between"
                    >
                      <span className="text-[14px] font-medium text-secondary">{tab.label}</span>
                      <tab.icon size={16} strokeWidth={2} className="text-secondary shrink-0" />
                    </button>
                  ))}

                  <div className="h-px bg-surface-hover my-1 mx-2" />
                  
                  <button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover border border-transparent hover:border-border rounded-xl w-full text-right transition-all duration-150 ease-out justify-between">
                    <span className="text-[14px] font-medium text-secondary">{tr('ورود فایل اکسل', 'Import Excel')}</span>
                    <Upload size={16} strokeWidth={2} className="text-secondary shrink-0" />
                  </button>

                  <button onClick={() => { jsonInputRef.current?.click(); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover border border-transparent hover:border-border rounded-xl w-full text-right transition-all duration-150 ease-out justify-between">
                    <span className="text-[14px] font-medium text-secondary">{tr('ورود فایل پشتیبان', 'Import Backup')}</span>
                    <Upload size={16} strokeWidth={2} className="text-secondary shrink-0" />
                  </button>
                  
                  <div className="h-px bg-surface-hover my-1 mx-2" />
                  
                  <div className="px-3 py-2 pb-1 text-[11px] font-medium text-secondary uppercase tracking-wider text-start">{tr('ورود و خروج فایل', 'Data transfer')}</div>
                  <button onClick={() => { handleExportAllExcel(); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover border border-transparent hover:border-border rounded-xl w-full text-right transition-all duration-150 ease-out justify-between">
                    <span className="text-[14px] font-medium text-secondary">{tr('خروجی اکسل', 'Export Excel')}</span>
                    <FileSpreadsheet size={16} strokeWidth={2} className="text-secondary shrink-0" />
                  </button>
                  <button onClick={() => { handleExportAllJson(); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover border border-transparent hover:border-border rounded-xl w-full text-right transition-all duration-150 ease-out justify-between">
                    <span className="text-[14px] font-medium text-secondary">{tr('خروجی JSON', 'Export JSON')}</span>
                    <FileJson size={16} strokeWidth={2} className="text-secondary shrink-0" />
                  </button>
                  
                  <div className="h-px bg-surface-hover my-1 mx-2" />
                  <button onClick={() => { setIsLogoutConfirmOpen(true); setIsMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl w-full text-right transition-all duration-150 ease-out justify-between">
                    <span className="text-[14px] font-medium text-red-600">{tr('خروج', 'Sign out')}</span>
                    <LogOut size={16} strokeWidth={2} className="text-red-500 shrink-0" />
                  </button>
                </div>
            </div>
          )}
        </div>

        {/* Left Side in RTL - Tabs */}
        <div className="order-1 flex flex-1 items-center justify-center overflow-x-auto w-auto">
          <div className="flex items-center gap-1 min-w-max mr-2 md:mr-4">
            {TABS.map(renderTab)}
          </div>
        </div>

      </div>

      <ConfirmDialog 
        isOpen={isLogoutConfirmOpen}
        title={tr('تایید خروج', 'Confirm sign out')}
        message={tr('آیا مطمئن هستید که می‌خواهید خارج شوید؟', 'Are you sure you want to sign out?')}
        confirmText={tr('بله، خروج', 'Sign out')}
        onConfirm={logout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
};

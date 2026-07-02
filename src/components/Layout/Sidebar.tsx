import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { User, Settings, LayoutDashboard, LogOut, Upload, FileSpreadsheet, FileJson, ShieldBan, Blocks } from 'lucide-react';
import { motion } from 'motion/react';
import NTLogo from '../../NT Logo.svg';
import { calculateStats } from '../../utils/stats';
import { toJalali, nowJalali } from '../../utils/jalali';
import { customToast as toast } from '../UI/toast';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import * as XLSX from 'xlsx';
import { useLocale } from '../../hooks/useLocale';
import { isActiveFollowup } from '../../utils/followups';

interface TabItem {
  id: 'dashboard' | 'blacklist' | 'stats' | 'admin' | 'reports';
  labelFa: string;
  labelEn: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'dashboard', labelFa: 'شماره ها', labelEn: 'Numbers', icon: LayoutDashboard },
  { id: 'blacklist', labelFa: 'لیست سیاه', labelEn: 'Blacklist', icon: ShieldBan },
];

export const Sidebar = () => {
  const { profile, calls, blacklist, isBlacklisted, logout, currentView, setCurrentView, bulkAddCalls, restoreBackup } = useAppContext();
  const { tr, direction } = useLocale();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const jsonInputRef = React.useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const handleExportAllExcel = () => {
    const wb = XLSX.utils.book_new();
    const profileWs = XLSX.utils.json_to_sheet([profile]);
    XLSX.utils.book_append_sheet(wb, profileWs, "Operator");
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

    const exportData = {
      exportVersion: "4.0",
      exportedAt: nowJalali(),
      timestamp: new Date().toISOString(),
      sessionInfo: { ...profile, durationLimit: '8h', activeCalls: filteredCalls.length },
      summary: { ...stats, lastActivity: filteredCalls.length ? filteredCalls[0].createdAt : null },
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
                newCalls.push({ phone: cellVal, callStatus: '', courses: [], advisory: '', advisoryDate: '', advisoryTime: '', registered: '', notes: '' });
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
      <button
        key={tab.id}
        onClick={() => setCurrentView(tab.id as any)}
        className={`relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ease-out outline-none w-full text-right ${
          isActive 
            ? 'bg-brand-500 text-white   font-normal' 
            : 'text-secondary hover:bg-surface-hover hover:text-slate-900 font-normal'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[14px]">{tr(tab.labelFa, tab.labelEn)}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 h-full bg-surface border-l border-border flex flex-col justify-between shrink-0 relative z-30 " dir={direction}>
      <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
        {/* Brand */}
        <div className="px-5 py-6 flex flex-col items-center gap-2 border-b border-border/50 mb-4">
           <div className="flex items-center gap-3 w-full justify-start">
             <div className="w-10 h-10 shrink-0">
               <img src={NTLogo} alt="Novin Tech Logo" className="w-full h-full object-contain" />
             </div>
            <div className="flex flex-col text-right">
              <span className="text-[15px] font-medium tracking-wide text-slate-900">{tr("نوین تک", "Novin Tech")}</span>
              <span className="text-[11px] font-normal text-secondary">{tr("پنل کارشناسی", "Agent Panel")}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1 px-3">
          {TABS.map(renderTab)}
        </nav>

        <div className="flex-1" />

        <div className="px-3 pb-4 pt-4 border-t border-border mt-4 flex flex-col gap-1">
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" />
          <input type="file" ref={jsonInputRef} onChange={handleImportJson} accept=".json, application/json" className="hidden" />
          
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover hover:text-slate-900 rounded-xl w-full text-right transition-colors text-secondary font-normal text-[13px]">
            <Upload size={16} strokeWidth={2} />
            <span>{tr('Import Numbers', 'Import Numbers')}</span>
          </button>
          
          <button onClick={handleExportAllExcel} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover hover:text-slate-900 rounded-xl w-full text-right transition-colors text-secondary font-normal text-[13px]">
            <FileSpreadsheet size={16} strokeWidth={2} />
            <span>{tr('Export Excel', 'Export Excel')}</span>
          </button>

          <button onClick={handleExportAllJson} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover hover:text-slate-900 rounded-xl w-full text-right transition-colors text-secondary font-normal text-[13px]">
            <FileJson size={16} strokeWidth={2} />
            <span>{tr('Export JSON', 'Export JSON')}</span>
          </button>
          
          <button onClick={() => setCurrentView('profile')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover hover:text-slate-900 rounded-xl w-full text-right transition-colors text-secondary font-normal text-[13px]">
            <User size={16} strokeWidth={2} />
            <span>{tr('پروفایل کارشناسی', 'Agent Profile')}</span>
          </button>

          <button onClick={() => setCurrentView('settings')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover hover:text-slate-900 rounded-xl w-full text-right transition-colors text-secondary font-normal text-[13px]">
            <Settings size={16} strokeWidth={2} />
            <span>{tr('تنظیمات', 'Settings')}</span>
          </button>
          
          <button onClick={() => setIsLogoutConfirmOpen(true)} className="flex items-center gap-3 px-4 py-2.5 mt-2 hover:bg-red-50 text-red-600 rounded-xl w-full text-right transition-colors font-normal text-[13px]">
            <LogOut size={16} strokeWidth={2} />
            <span>{tr('خروج از حساب', 'Sign out')}</span>
          </button>
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
    </aside>
  );
};

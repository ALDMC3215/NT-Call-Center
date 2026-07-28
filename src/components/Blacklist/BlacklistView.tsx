import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { ShieldBan, Trash2, Plus, Search, UserMinus } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { useLocale } from '../../hooks/useLocale';
import { formatPhoneNumber } from '../../utils/format';

export const BlacklistView = () => {
  const { blacklist, addToBlacklist, removeFromBlacklist, setCurrentView, layoutMargin } = useAppContext();
  const { direction, tr } = useLocale();
  const [newPhone, setNewPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneToDelete, setPhoneToDelete] = useState<string | null>(null);

  const filteredList = blacklist.filter(b => b.phone.includes(searchQuery) || b.reason.includes(searchQuery));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      toast.error(tr('شماره تلفن معتبر نیست.', 'Invalid phone number.'));
      return;
    }
    if (blacklist.some(b => b.phone === cleanPhone)) {
      toast.error(tr('این شماره قبلاً در لیست سیاه ثبت شده است.', 'This number is already blacklisted.'));
      return;
    }
    addToBlacklist(cleanPhone, 'افزودن دستی');
    setNewPhone('');
    toast.success(tr('شماره به لیست سیاه اضافه شد.', 'Number added to the blacklist.'));
  };

  const handleDelete = () => {
    if (phoneToDelete) {
      removeFromBlacklist(phoneToDelete);
      setPhoneToDelete(null);
      toast.success(tr('شماره از لیست سیاه خارج شد.', 'Number removed from the blacklist.'));
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pt-6 md:pt-10 pb-32 px-4 md:px-8 font-sans text-start hide-scrollbar bg-slate-50 dark:bg-[#0f1419]" dir={direction}>

      <div className="max-w-6xl mx-auto w-full flex flex-col gap-8">
        
        {/* Minimal Header */}
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="w-14 h-14 bg-rose-100/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center border border-rose-200/60 dark:border-rose-900/50 shadow-sm">
            <ShieldBan strokeWidth={2.5} size={28} />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {tr('لیست سیاه', 'Blacklist')}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {tr('شماره‌هایی که در این لیست قرار بگیرند، هنگام ورود فایل اکسل جدید به طور خودکار حذف می‌شوند.', 'Numbers in this list are automatically skipped when a new Excel file is imported.')}
            </p>
          </div>
        </div>

        {/* Action Bar (Add & Search) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 w-full xl:max-w-lg">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <UserMinus size={18} />
              </div>
              <input 
                type="text" 
                placeholder={tr('افزودن شماره تلفن...', 'Add phone number...')}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full h-12 bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-2xl pr-12 pl-4 text-left text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 dark:focus:border-rose-500/50 dark:focus:ring-rose-900/20 transition-all shadow-sm"
                dir="ltr"
              />
            </div>
            <button 
              type="submit"
              className="h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              {tr('افزودن', 'Add')}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#1c2530] p-1.5 pl-4 rounded-2xl border border-slate-200 dark:border-[#2b3745] shadow-sm w-full xl:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder={tr('جستجو در لیست...', 'Search blacklist...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pr-10 pl-4 bg-transparent text-sm font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                dir="ltr"
              />
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-[#2b3745]"></div>
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-center px-2">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                {tr('مجموع:', 'Total:')} <span className="text-rose-600 dark:text-rose-400 ml-1 text-sm bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/50">{blacklist.length}</span>
              </span>
            </div>
          </div>

        </div>

        {/* List Content */}
        <div className="w-full">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-[#8e9aaa] bg-white dark:bg-[#1c2530] rounded-3xl border border-slate-200 dark:border-[#2b3745] border-dashed shadow-sm">
              <ShieldBan size={48} strokeWidth={1.5} className="mb-5 opacity-40 text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-sm">{tr('هیچ شماره‌ای یافت نشد.', 'No blacklisted number found.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredList.map(entry => (
                <div key={entry.phone} className="flex flex-col p-5 bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-[2rem] hover:border-rose-300 dark:hover:border-rose-900/60 hover:shadow-md transition-all group gap-5 relative overflow-hidden">
                  
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1 z-10">
                      <span className="font-black text-slate-900 dark:text-white tracking-[0.05em] text-lg" dir="ltr">{formatPhoneNumber(entry.phone)}</span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-[#8e9aaa]">{entry.createdAt && new Date(entry.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                    
                    <button
                      onClick={() => setPhoneToDelete(entry.phone)}
                      className="w-9 h-9 rounded-[14px] bg-slate-50 dark:bg-[#202b38] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-[#344457] hover:border-rose-200 dark:hover:border-rose-900/50 flex items-center justify-center transition-all z-10 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                  
                  <div className="flex items-center z-10">
                    <span className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#344457] bg-slate-50 dark:bg-[#202b38] text-slate-600 dark:text-[#b7c2cf]">
                      {entry.reason}
                    </span>
                  </div>

                  {/* decorative background element */}
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-rose-50 dark:bg-rose-950/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog 
         isOpen={!!phoneToDelete}
         title={tr('حذف از لیست سیاه', 'Remove from blacklist')}
         message={tr('آیا مطمئن هستید که می‌خواهید این شماره را از لیست سیاه خارج کنید؟', 'Are you sure you want to remove this number from the blacklist?')}
         confirmText={tr('بله، حذف', 'Remove')}
         onConfirm={handleDelete}
         onCancel={() => setPhoneToDelete(null)}
      />
    </div>
  );
};

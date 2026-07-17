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
    <div className="w-full h-full overflow-y-auto pt-4 md:pt-6 pb-32 px-4 md:px-8 font-sans text-start hide-scrollbar bg-slate-50" dir={direction}>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-rose-600 mb-2 flex items-center gap-3">
             <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                <ShieldBan strokeWidth={2.5} size={24} />
             </div>
             {tr('لیست سیاه', 'Blacklist')}
          </h2>
          <p className="text-secondary font-normal mr-13 text-xs">
             {tr('شماره‌هایی که در این لیست قرار بگیرند، هنگام ورود فایل اکسل جدید به طور خودکار حذف می‌شوند.', 'Numbers in this list are automatically skipped when a new Excel file is imported.')}
          </p>
        </div>
      </div>

      <div className="bg-surface-hover/80 rounded-xl p-4 border border-border mb-3">
        <h3 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
          <UserMinus size={18} />
          {tr('افزودن شماره جدید به لیست سیاه', 'Add a number to the blacklist')}
        </h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1 relative">
            <input 
               type="text" 
               placeholder={tr('شماره تلفن (مثال: 09123456789)...', 'Phone number (e.g. 09123456789)...')}
               value={newPhone}
               onChange={(e) => setNewPhone(e.target.value)}
               className="w-full h-10 bg-surface-hover border border-border rounded-lg px-3 text-left text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition-all text-secondary"
               dir="ltr"
            />
          </div>
          <button 
             type="submit"
             className="h-10 px-5 bg-rose-600/90 hover:bg-rose-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            {tr('افزودن', 'Add')}
          </button>
        </form>
      </div>

      <div className="bg-surface  rounded-xl border border-border overflow-hidden flex flex-col min-h-[360px]">
        <div className="p-4 border-b border-border bg-surface-hover flex justify-between items-center">
          <div className="font-medium text-secondary text-sm">
            {tr('مجموع:', 'Total:')} <span className="text-rose-600 mx-1">{blacklist.length}</span> {tr('شماره', 'numbers')}
          </div>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
            <input 
               type="text"
               placeholder={tr('جستجو در لیست...', 'Search blacklist...')}
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full h-9 pl-4 pr-9 bg-surface  border border-border rounded-lg text-sm focus:outline-none focus:border-brand-500"
               dir="ltr"
            />
          </div>
        </div>

        <div className="flex-1 p-2">
          {filteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-secondary my-20">
               <ShieldBan size={48} strokeWidth={1} className="mb-4 text-secondary" />
               <p className="font-normal text-sm text-muted">{tr('هیچ شماره‌ای در لیست سیاه یافت نشد.', 'No blacklisted number found.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-2">
               {filteredList.map(entry => (
             <div key={entry.phone} className="flex flex-col p-3 bg-surface-hover/80 border border-border rounded-lg hover:border-rose-500/50 hover:bg-rose-900/20 transition-all group gap-2">
                <div className="flex items-center justify-between">
                   <span className="font-extrabold text-slate-800 tracking-[0.1em] text-[16px]" dir="ltr">{formatPhoneNumber(entry.phone)}</span>
                   <button
                      onClick={() => setPhoneToDelete(entry.phone)}
                      className="text-muted hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-900/40 transition-colors opacity-0 group-hover:opacity-100"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                   <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600">{entry.reason}</span>
                   <span className="text-[10px] text-slate-400 font-medium">{entry.createdAt && new Date(entry.createdAt).toLocaleDateString('fa-IR')}</span>
                </div>
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

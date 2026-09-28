import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { ShieldBan, Trash2, Plus, Search, UserMinus } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { useLocale } from '../../hooks/useLocale';
import { formatPhoneNumber } from '../../utils/format';

export const BlacklistView = () => {
  const { blacklist, addToBlacklist, removeFromBlacklist } = useAppContext();
  const { direction, tr } = useLocale();
  const [newPhone, setNewPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneToDelete, setPhoneToDelete] = useState<string | null>(null);

  const filteredList = blacklist.filter(
    (b) => b.phone.includes(searchQuery) || b.reason.includes(searchQuery)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      toast.error(tr('شماره تلفن معتبر نیست.', 'Invalid phone number.'));
      return;
    }
    if (blacklist.some((b) => b.phone === cleanPhone)) {
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
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-[#0f1419] overflow-hidden" dir={direction}>
      {/* Compact Section Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white/90 dark:bg-[#151c24]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#24303e] shrink-0 min-h-[58px] sm:min-h-[64px]">
        {/* Right side in RTL: Icon + Title + Count */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
            <ShieldBan size={16} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14.5px] sm:text-[15px] font-bold text-slate-900 dark:text-[#f3f5f7]">
              {tr('لیست سیاه', 'Blacklist')}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1e2734] text-slate-600 dark:text-[#9eb0c3] text-[11px] font-bold border border-slate-200/70 dark:border-[#2b3848] tabular-nums">
              {blacklist.length} {tr('شماره مسدود', 'blocked')}
            </span>
          </div>
        </div>

        {/* Left side in RTL: Quick Add & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Add form */}
          <form onSubmit={handleAdd} className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder={tr('افزودن شماره...', 'Add phone...')}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full h-[36px] bg-slate-50 dark:bg-[#18222d] border border-slate-200 dark:border-[#2e3e50] rounded-xl px-3 text-[12px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-[#1c2735] focus:ring-2 focus:ring-rose-500/20 transition-all shadow-2xs text-left"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="h-[36px] px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-[12px] rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{tr('افزودن', 'Add')}</span>
            </button>
          </form>

          {/* Search */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder={tr('جستجو...', 'Search...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[36px] bg-slate-50 dark:bg-[#18222d] border border-slate-200 dark:border-[#2e3e50] rounded-xl pr-8 pl-3 text-[12px] font-medium text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-[#1c2735] focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-[#8e9aaa] bg-white dark:bg-[#1c2530] rounded-2xl border border-slate-200 dark:border-[#2b3745] border-dashed shadow-2xs">
            <ShieldBan size={36} strokeWidth={1.5} className="mb-3 opacity-40 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-[13px]">{tr('هیچ شماره‌ای در لیست سیاه یافت نشد.', 'No blacklisted number found.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filteredList.map((entry) => (
              <div
                key={entry.phone}
                className="flex flex-col justify-between p-4 bg-white dark:bg-[#1c2530] border border-slate-200 dark:border-[#2b3745] rounded-2xl hover:border-slate-300 dark:hover:border-[#38485c] hover:shadow-xs transition-all group gap-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5 z-10">
                    <span className="font-extrabold text-slate-900 dark:text-white tracking-wide text-[14px]" dir="ltr">
                      {formatPhoneNumber(entry.phone)}
                    </span>
                    <span className="text-[10.5px] font-medium text-slate-400 dark:text-[#8e9aaa]">
                      {entry.createdAt && new Date(entry.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>

                  <button
                    onClick={() => setPhoneToDelete(entry.phone)}
                    aria-label={tr('حذف از لیست سیاه', 'Remove from blacklist')}
                    className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-[#202b38] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-[#344457] hover:border-rose-200 dark:hover:border-rose-900/50 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    title={tr('خروج از لیست سیاه', 'Remove from blacklist')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center z-10">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-[#344457] bg-slate-50 dark:bg-[#202b38] text-slate-600 dark:text-[#b7c2cf]">
                    {entry.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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

import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Trash2, Search, XCircle } from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { useLocale } from '../../hooks/useLocale';
import { storage } from '../../utils/storage';

export const TrashView = () => {
  const { direction, tr } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [trashList, setTrashList] = useState(() => storage.getTrash());
  
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredList = trashList.filter(t => t.phone.includes(searchQuery) || (t.fullName && t.fullName.includes(searchQuery)));

  const handleDelete = () => {
    if (itemToDelete) {
      storage.removeFromTrash(itemToDelete);
      setTrashList(storage.getTrash());
      setItemToDelete(null);
      toast.success(tr('شماره برای همیشه از سطل زباله حذف شد.', 'Permanently deleted.'));
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pt-4 md:pt-6 pb-32 px-4 md:px-8 font-sans text-start hide-scrollbar bg-slate-50" dir={direction}>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-rose-600 mb-2 flex items-center gap-3">
             <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                <Trash2 strokeWidth={2.5} size={24} />
             </div>
             {tr('سطل زباله', 'Trash')}
          </h2>
          <p className="text-secondary font-normal mr-13 text-xs">
             {tr('شماره‌هایی که از لیست اصلی حذف شده‌اند موقتاً در اینجا نگهداری می‌شوند.', 'Deleted numbers are kept here.')}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden flex flex-col min-h-[360px]">
        <div className="p-4 border-b border-border bg-surface-hover flex justify-between items-center">
          <div className="font-medium text-secondary text-sm">
            {tr('مجموع:', 'Total:')} <span className="text-rose-600 mx-1">{trashList.length}</span> {tr('شماره', 'numbers')}
          </div>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
            <input 
               type="text"
               placeholder={tr('جستجو...', 'Search...')}
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full h-9 pl-4 pr-9 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-brand-500"
               dir="ltr"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead className="bg-surface-hover border-b border-border">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-muted">{tr('شماره تلفن', 'Phone')}</th>
                <th className="py-3 px-4 text-xs font-bold text-muted">{tr('نام', 'Name')}</th>
                <th className="py-3 px-4 text-xs font-bold text-muted">{tr('زمان حذف', 'Deleted At')}</th>
                <th className="py-3 px-4 text-xs font-bold text-muted w-24">{tr('عملیات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted font-medium text-sm">
                    {tr('موردی یافت نشد.', 'No items found.')}
                  </td>
                </tr>
              ) : (
                filteredList.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-bold text-slate-800" dir="ltr">{entry.phone}</td>
                    <td className="py-3 px-4 text-sm text-secondary">{entry.fullName || '—'}</td>
                    <td className="py-3 px-4 text-xs text-muted" dir="ltr">
                       {entry.deletedAt ? new Date(entry.deletedAt).toLocaleString('fa-IR') : '—'}
                    </td>
                    <td className="py-3 px-4">
                       <div className="flex items-center justify-center gap-3">
                         <button onClick={() => setItemToDelete(entry.id)} className="text-rose-400 hover:text-rose-600 transition-colors" title={tr('حذف دائمی', 'Delete permanently')}>
                           <XCircle size={18} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!itemToDelete}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title={tr('حذف برای همیشه', 'Delete Permanently')}
        message={tr('آیا مطمئن هستید که می‌خواهید این شماره را برای همیشه از سطل زباله حذف کنید؟ این عمل غیرقابل بازگشت است.', 'Are you sure? This action cannot be undone.')}
      />

    </div>
  );
};

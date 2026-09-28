import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, PhoneCall } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { customToast as toast } from '../UI/toast';

interface ManualAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (phone: string, fullName: string) => void;
}

export const ManualAddModal: React.FC<ManualAddModalProps> = ({
  isOpen,
  onClose,
  onAdd
}) => {
  const { tr, direction } = useLocale();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setFullName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return toast.error(tr('لطفا شماره را وارد کنید.', 'Please enter a phone number.'));
    }
    if (cleanPhone.length < 10) {
      return toast.error(tr('شماره معتبر نیست.', 'Invalid phone number.'));
    }
    onAdd(cleanPhone, fullName.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        dir={direction}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-[#161f2b] border border-slate-200 dark:border-[#2b3a4c] rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-[#243142] bg-slate-50/70 dark:bg-[#1b2533]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <PhoneCall size={15} />
              </span>
              <span className="font-semibold text-slate-800 dark:text-[#f3f5f7] text-[13.5px]">
                {tr('افزودن دستی شماره', 'Add Number Manually')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-[#253243] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={tr('بستن', 'Close')}
            >
              <X size={17} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 dark:text-[#c5d3e3] mb-1.5 block">
                {tr('شماره موبایل', 'Mobile Number')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 text-[14px] font-medium border border-slate-200 dark:border-[#2e3e50] bg-slate-50 dark:bg-[#1b2533] focus:bg-white dark:focus:bg-[#17202c] text-slate-900 dark:text-[#f3f5f7] rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-left transition-all placeholder:text-slate-400 dark:placeholder-[#647488]"
                placeholder="0912..."
                dir="ltr"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-slate-700 dark:text-[#c5d3e3] mb-1.5 block">
                {tr('نام و نام خانوادگی', 'Full Name')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 text-[13.5px] font-medium border border-slate-200 dark:border-[#2e3e50] bg-slate-50 dark:bg-[#1b2533] focus:bg-white dark:focus:bg-[#17202c] text-slate-900 dark:text-[#f3f5f7] rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-400 dark:placeholder-[#647488]"
                placeholder={tr('اختیاری...', 'Optional...')}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl text-[12.5px] font-semibold text-slate-600 dark:text-[#b4c3d4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#243142] border border-slate-200 dark:border-[#2e3e50] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {tr('انصراف', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>{tr('افزودن به لیست', 'Add to list')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

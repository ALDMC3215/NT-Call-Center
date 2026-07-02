import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../UI/alert-dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ isOpen, title, message, confirmText = 'بله، تایید', onConfirm, onCancel }: ConfirmDialogProps) => {
  const { direction, isFa, tr } = useLocale();
  const destructive = /حذف|خروج|پاک|سیاه|delete|remove|sign out|blacklist/i.test(title);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent dir={direction}>
        <div className="flex flex-col items-center text-center">
           <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-2xl mb-4 border ${destructive ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
              {destructive ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
           </div>
           <AlertDialogHeader>
             <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
             <AlertDialogDescription className="text-center mt-2">{message}</AlertDialogDescription>
           </AlertDialogHeader>
        </div>
        <div className={`mt-6 w-full flex flex-row gap-3 ${direction === 'rtl' ? 'justify-start' : 'justify-end'}`}>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`mt-0 font-bold ${destructive ? 'bg-rose-500 hover:bg-rose-600 text-white border-transparent shadow-sm shadow-rose-500/20' : 'bg-brand-500 hover:bg-brand-600 text-white border-transparent shadow-sm shadow-brand-500/20'}`}
          >
            {!isFa && confirmText === 'بله، تایید' ? 'Confirm' : confirmText}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onCancel} className="mt-0 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200">
            {tr('لغو', 'Cancel')}
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

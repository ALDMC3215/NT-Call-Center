import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export interface AuthStatusAlertProps {
  type?: 'error' | 'success' | 'info';
  message: string;
}

export const AuthStatusAlert: React.FC<AuthStatusAlertProps> = ({
  type = 'error',
  message,
}) => {
  if (!message) return null;

  const styles = {
    error: {
      container:
        'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200',
      icon: <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
    },
    success: {
      container:
        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    },
    info: {
      container:
        'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300',
      icon: <Info size={16} className="text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 p-3 rounded-xl border text-[12.5px] font-semibold leading-relaxed ${styles.container}`}
    >
      {styles.icon}
      <span>{message}</span>
    </div>
  );
};

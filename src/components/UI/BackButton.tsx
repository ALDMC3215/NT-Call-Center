import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';

export const BackButton = () => {
  const { setCurrentView } = useAppContext();
  const { tr } = useLocale();

  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => setCurrentView('dashboard')}
      title={tr('بازگشت', 'Back')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-hover border border-border text-secondary hover:text-primary hover:border-brand-500 transition-all text-[12px] font-medium"
    >
      <ArrowRight size={16} />
      <span>{tr('بازگشت', 'Back')}</span>
    </motion.button>
  );
};

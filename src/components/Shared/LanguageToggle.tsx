import React from 'react';
import { motion } from 'motion/react';
import { useLocale } from '../../hooks/useLocale';

export const LanguageToggle = ({ compact = false }: { compact?: boolean }) => {
  const { language, setLanguage } = useLocale();
  return (
    <div 
      className={`relative flex items-center bg-surface-hover rounded-full cursor-pointer p-1  border border-border transition-colors ${compact ? 'w-24 h-8' : 'w-28 h-10'}`} 
      onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
      dir="ltr"
    >
      <motion.div
        className="absolute h-[calc(100%-8px)] top-1 bg-surface  border border-border rounded-full "
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ width: 'calc(50% - 4px)' }}
        animate={{ x: language === 'fa' ? 0 : '100%' }}
      />
      <div className={`flex-1 text-center relative z-10 text-[11px] font-medium transition-colors ${language === 'fa' ? 'text-brand-600' : 'text-muted'}`}>
        فارسی
      </div>
      <div className={`flex-1 text-center relative z-10 text-[11px] font-medium transition-colors ${language === 'en' ? 'text-brand-600' : 'text-muted'}`}>
        EN
      </div>
    </div>
  );
};

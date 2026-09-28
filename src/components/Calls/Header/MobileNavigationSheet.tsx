import React, { useEffect } from 'react';
import {
  Menu,
  X,
  List,
  BookOpen,
  Route,
  BarChart3,
  ShieldBan,
  PhoneCall,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../../hooks/useLocale';
import { WorkspaceTabKey, NavGroup } from './types';

interface MobileNavigationSheetProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeTab: WorkspaceTabKey;
  onTabChange: (tab: WorkspaceTabKey) => void;
  displayedCount: number;
  totalActiveCount: number;
}

export const MobileNavigationSheet: React.FC<MobileNavigationSheetProps> = ({
  isOpen,
  onOpen,
  onClose,
  activeTab,
  onTabChange,
  displayedCount,
  totalActiveCount
}) => {
  const { tr, direction } = useLocale();

  const groups: NavGroup[] = [
    {
      id: 'main',
      title: tr('مدیریت تماس', 'Call Operations'),
      tabs: [
        { key: 'list', label: tr('لیست شماره‌ها', 'Call List'), icon: <List size={16} />, groupId: 'main' },
        { key: 'courses', label: tr('دوره‌ها', 'Courses'), icon: <BookOpen size={16} />, groupId: 'main' }
      ]
    },
    {
      id: 'tools',
      title: tr('ابزارهای کارشناسی', 'Specialist Tools'),
      tabs: [
        { key: 'learning_paths', label: tr('مسیرهای یادگیری', 'Learning Paths'), icon: <Route size={16} />, groupId: 'tools' }
      ]
    },
    {
      id: 'reporting',
      title: tr('گزارش و کنترل', 'Reporting & Control'),
      tabs: [
        { key: 'stats', label: tr('آمار', 'Stats'), icon: <BarChart3 size={16} />, groupId: 'reporting' },
        { key: 'blacklist', label: tr('لیست سیاه', 'Blacklist'), icon: <ShieldBan size={16} />, groupId: 'reporting' }
      ]
    }
  ];

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Drawer Trigger (< 768px) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={tr('ناوبری بخش‌ها', 'Toggle navigation sheet')}
        aria-expanded={isOpen}
        className="md:hidden h-[38px] w-[38px] rounded-xl border border-slate-200 dark:border-[#2e3e50] bg-white dark:bg-[#18222e] text-slate-700 dark:text-[#c4d0df] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs"
      >
        <Menu size={18} />
      </button>

      {/* Slide-out Drawer & Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden" dir={direction}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            {/* RTL Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-[#141c26] border-l border-slate-200 dark:border-[#243142] shadow-2xl flex flex-col p-4 z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#202b3a]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200/80 dark:border-brand-800/40">
                    <PhoneCall size={16} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-slate-900 dark:text-[#f3f5f7]">
                      {tr('مدیریت تماس‌ها', 'Call Management')}
                    </h2>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-[#7f8da0]">
                      {tr(`${displayedCount} از ${totalActiveCount} شماره`, `${displayedCount} of ${totalActiveCount} contacts`)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={tr('بستن', 'Close')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202b3a] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 overflow-y-auto custom-scrollbar py-3 flex flex-col gap-3">
                {groups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-1">
                    <div className="text-[11px] font-bold text-slate-400 dark:text-[#78889b] px-2 py-0.5 select-none">
                      {group.title}
                    </div>
                    {group.tabs.map((tab) => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            onTabChange(tab.key);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-medium transition-colors text-right ${
                            isActive
                              ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800/60 shadow-2xs'
                              : 'text-slate-700 dark:text-[#c4d0df] hover:bg-slate-50 dark:hover:bg-[#1a2432]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}>
                              {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                          </div>
                          {isActive && (
                            <Check size={14} className="text-brand-600 dark:text-brand-400 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

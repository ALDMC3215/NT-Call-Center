import React, { useState, useRef, useEffect } from 'react';
import {
  List,
  BookOpen,
  Route,
  BarChart3,
  ShieldBan,
  ChevronDown,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocale } from '../../../hooks/useLocale';
import { WorkspaceTabKey, TabItem, NavGroup } from './types';

interface SectionSwitcherProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (tab: WorkspaceTabKey) => void;
  className?: string;
}

export const SectionSwitcher: React.FC<SectionSwitcherProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  const { tr } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const groups: NavGroup[] = [
    {
      id: 'main',
      title: tr('مدیریت تماس', 'Call Operations'),
      tabs: [
        { key: 'list', label: tr('لیست شماره‌ها', 'Call List'), icon: <List size={14} />, groupId: 'main' },
        { key: 'courses', label: tr('دوره‌ها', 'Courses'), icon: <BookOpen size={14} />, groupId: 'main' }
      ]
    },
    {
      id: 'tools',
      title: tr('ابزارهای کارشناسی', 'Specialist Tools'),
      tabs: [
        { key: 'learning_paths', label: tr('مسیرهای یادگیری', 'Learning Paths'), icon: <Route size={14} />, groupId: 'tools' }
      ]
    },
    {
      id: 'reporting',
      title: tr('گزارش و کنترل', 'Reporting & Control'),
      tabs: [
        { key: 'stats', label: tr('آمار', 'Stats'), icon: <BarChart3 size={14} />, groupId: 'reporting' },
        { key: 'blacklist', label: tr('لیست سیاه', 'Blacklist'), icon: <ShieldBan size={14} />, groupId: 'reporting' }
      ]
    }
  ];

  const allTabs: TabItem[] = groups.flatMap((g) => g.tabs);
  const currentTab = allTabs.find((t) => t.key === activeTab) || allTabs[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`h-[38px] px-3 rounded-xl border flex items-center gap-2 text-[12.5px] font-bold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-2xs ${
          isOpen
            ? 'bg-slate-100 dark:bg-[#1f2b3b] text-slate-900 dark:text-white border-brand-400 dark:border-brand-600'
            : 'bg-white dark:bg-[#18222e] text-slate-800 dark:text-[#e2eaf3] border-slate-200 dark:border-[#2e3e50] hover:bg-slate-100/80 dark:hover:bg-[#202c3b]'
        }`}
      >
        <span className="text-brand-600 dark:text-brand-400 shrink-0">
          {currentTab.icon}
        </span>
        <span className="whitespace-nowrap">{currentTab.label}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute z-50 top-full mt-1.5 right-0 w-60 bg-white dark:bg-[#17202c] border border-slate-200 dark:border-[#2d3d50] rounded-2xl shadow-xl p-2 text-right flex flex-col gap-1.5"
          >
            {groups.map((group, idx) => (
              <div key={group.id} className="flex flex-col gap-0.5">
                {idx > 0 && <div className="w-full h-px bg-slate-100 dark:bg-[#243142] my-0.5" />}
                <div className="text-[10px] font-bold text-slate-400 dark:text-[#7f8da0] px-2 py-0.5 select-none uppercase tracking-wider">
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
                        setIsOpen(false);
                        buttonRef.current?.focus();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-colors text-right ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200/80 dark:border-brand-800/60 shadow-2xs'
                          : 'text-slate-700 dark:text-[#c4d0df] hover:bg-slate-100 dark:hover:bg-[#202c3b] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}>
                          {tab.icon}
                        </span>
                        <span>{tab.label}</span>
                      </div>
                      {isActive && <Check size={14} className="stroke-[2.5] text-brand-600 dark:text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

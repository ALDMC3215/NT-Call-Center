'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface PillNavTab<T extends string = string> {
  key: T;
  label: string;
  icon: React.ReactNode;
}

interface PillNavProps<T extends string = string> {
  tabs: PillNavTab<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
  className?: string;
}

/**
 * PillNav Component - Minimal & Refined Segmented Control
 * - Soft, harmonious contrast (no harsh pitch-black blocks)
 * - Compact dimensions (28px height per pill) preventing header clutter
 * - Subtle 140ms sliding pill indicator with gentle shadow and fine border
 * - Brand-accented icon on active tab for clear visual affordance
 * - Full RTL stability and keyboard accessibility
 */
export function PillNav<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: PillNavProps<T>) {
  return (
    <nav
      aria-label="بخش‌های پنل کارشناسی"
      className={`flex items-center justify-center select-none ${className}`}
    >
      <div className="flex items-center p-0.5 2xl:p-1 rounded-xl bg-slate-100/90 dark:bg-[#121922] border border-slate-200/80 dark:border-[#202c3b] gap-0.5 2xl:gap-1 relative shadow-2xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-1 2xl:gap-1.5 px-2 py-1 2xl:px-2.5 2xl:py-1.2 rounded-lg text-[11px] 2xl:text-[11.5px] transition-all duration-150 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#1d2735] text-slate-900 dark:text-white font-bold border border-slate-200/90 dark:border-[#2f3f54] shadow-xs'
                  : 'text-slate-600 dark:text-[#8d9eae] hover:text-slate-900 dark:hover:text-[#dbe4ee] hover:bg-slate-200/50 dark:hover:bg-[#182330] font-medium border border-transparent'
              }`}
            >
              {/* Icon & Label */}
              <span
                className={`relative z-10 shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 dark:text-[#728395]'
                }`}
              >
                {tab.icon}
              </span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default PillNav;

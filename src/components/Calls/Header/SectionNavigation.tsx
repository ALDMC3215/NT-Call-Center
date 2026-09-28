import React from 'react';
import {
  List,
  BookOpen,
  Route,
  BarChart3,
  ShieldBan
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { WorkspaceTabKey } from './types';
import { PillNav, PillNavTab } from '../../ReactBits/PillNav';

interface SectionNavigationProps {
  activeTab: WorkspaceTabKey;
  onTabChange: (tab: WorkspaceTabKey) => void;
  className?: string;
}

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  const { tr } = useLocale();

  const tabs: PillNavTab<WorkspaceTabKey>[] = [
    { key: 'list', label: tr('لیست شماره‌ها', 'Call List'), icon: <List size={14} /> },
    { key: 'courses', label: tr('دوره‌ها', 'Courses'), icon: <BookOpen size={14} /> },
    { key: 'learning_paths', label: tr('مسیرهای یادگیری', 'Learning Paths'), icon: <Route size={14} /> },
    { key: 'stats', label: tr('آمار', 'Stats'), icon: <BarChart3 size={14} /> },
    { key: 'blacklist', label: tr('لیست سیاه', 'Blacklist'), icon: <ShieldBan size={14} /> }
  ];

  return (
    <PillNav<WorkspaceTabKey>
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      className={className}
    />
  );
};

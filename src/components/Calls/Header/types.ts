import React from 'react';

export type WorkspaceTabKey =
  | 'list'
  | 'courses'
  | 'learning_paths'
  | 'stats'
  | 'blacklist';

export interface TabItem {
  key: WorkspaceTabKey;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  groupId: 'main' | 'tools' | 'reporting';
}

export interface NavGroup {
  id: 'main' | 'tools' | 'reporting';
  title: string;
  tabs: TabItem[];
}

export interface AdaptiveCommandHeaderProps {
  displayedCount: number;
  totalActiveCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onReturnHome: () => void;
  activeTab: WorkspaceTabKey;
  onTabChange: (tab: WorkspaceTabKey) => void;
  // Filters & stats
  statusStats?: Record<string, number>;
  selectedStatusFilter?: string | null;
  onSelectFilter?: (status: string | null) => void;
  // Actions
  onExcelUploadClick?: () => void;
  onManualAddClick?: () => void;
  onMoveNotInterestedClick?: () => void;
  onDeleteAllClick?: () => void;
  // Scroll elevation indicator
  isScrolled?: boolean;
}

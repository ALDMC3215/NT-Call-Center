import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { toJalali } from '../../utils/jalali';
import { useLocale } from '../../hooks/useLocale';
import { CallRecord, ContactTask, ContactTaskType } from '../../types';
import { CallResultActionModal } from './CallResultActionModal';
import { ContactTaskEditorModal } from './ContactTaskEditorModal';
import { CALL_STATUSES } from '../../constants';
import { customToast as toast } from '../UI/toast';
import * as xlsx from 'xlsx';
import { AnimatePresence, motion } from 'motion/react';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { matchesSearch } from '../../utils/search';
import { exportConsultationsToExcel } from '../../utils/consultationExcel';
import { Filter } from 'lucide-react';

import { AdaptiveCommandHeader, WorkspaceTabKey } from './AdaptiveCommandHeader';
import { CallGroupHeader } from './CallGroupHeader';
import { CallTableRow } from './CallTableRow';
import { BatchSelectionBar } from './BatchSelectionBar';
import { NotesModal } from './NotesModal';
import { ManualAddModal } from './ManualAddModal';

// Views
import { CoursesView } from '../Courses/CoursesView';
import { LearningPathsModal } from '../Shared/LearningPathsModal';
import { CallListStats } from './CallListStats';
import { BlacklistView } from '../Blacklist/BlacklistView';

export const CallListWorkspace = () => {
  const {
    calls,
    isLoadingCalls,
    callsError,
    hasInitialCallsLoaded,
    updateCall,
    addCall,
    bulkAddCalls,
    blacklist,
    getMyContactTasks,
    updateContactTaskDetails,
    recordCallAttemptWithTask,
    deleteCall,
    setCurrentView,
    getMyDailyStats,
    addToBlacklist,
    recordAttempt
  } = useAppContext();

  const { tr, direction } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  const [, setTasks] = useState<ContactTask[]>([]);
  const [actionModalCall, setActionModalCall] = useState<CallRecord | null>(null);
  const [editModalTask, setEditModalTask] = useState<ContactTask | null>(null);

  const [notesModalCall, setNotesModalCall] = useState<CallRecord | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  // Local state for tabs with safe normalization for legacy values
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['list', 'courses', 'learning_paths', 'stats', 'blacklist'].includes(tab)) {
          return tab as WorkspaceTabKey;
        }
        const saved = localStorage.getItem('call_list_active_tab');
        if (saved && ['list', 'courses', 'learning_paths', 'stats', 'blacklist'].includes(saved)) {
          return saved as WorkspaceTabKey;
        }
      } catch (e) {}
    }
    return 'list';
  });
  const [isContentScrolled, setIsContentScrolled] = useState(false);

  // Batch Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Section Toggle state
  const [expandedSections, setExpandedSections] = useState({
    followUp: true,
    worked: true,
    raw: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await getMyContactTasks({ status: 'pending' });
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  }, [getMyContactTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        let count = 0;
        const skippedPhones: string[] = [];
        const toAdd: any[] = [];

        data.forEach((row: any[]) => {
          if (!row || row.length === 0) return;
          const phoneRegex = /(09\d{9})|(\+989\d{9})|(9\d{9})/;
          let phoneStr = '';
          let nameStr = '';

          for (let i = 0; i < row.length; i++) {
            const rawValue = row[i];
            if (rawValue === undefined || rawValue === null) continue;

            const cellValue = String(rawValue);
            const noSpaceStr = cellValue.replace(/\s+/g, '');

            if (!phoneStr && phoneRegex.test(noSpaceStr)) {
              const match = noSpaceStr.match(phoneRegex);
              if (match) {
                let p = match[0];
                if (p.startsWith('+98')) p = '0' + p.substring(3);
                else if (p.length === 10 && p.startsWith('9')) p = '0' + p;
                phoneStr = p;
              }
            } else if (
              typeof rawValue === 'string' &&
              rawValue.length > 2 &&
              !rawValue.match(/\d/) &&
              !nameStr
            ) {
              nameStr = rawValue.trim();
            }
          }
          if (phoneStr) {
            if (blacklist.some((b) => b.phone === phoneStr)) {
              skippedPhones.push(phoneStr);
            } else {
              toAdd.push({ phone: phoneStr, fullName: nameStr || '' });
              count++;
            }
          }
        });

        if (toAdd.length > 0) {
          bulkAddCalls(toAdd);
        }

        if (skippedPhones.length > 0) {
          toast.error(
            tr(
              `تعداد ${skippedPhones.length} شماره به دلیل قرار داشتن در لیست سیاه حذف شدند.`,
              `${skippedPhones.length} numbers skipped.`
            )
          );
        }

        if (count > 0) {
          toast.success(
            tr(
              `تعداد ${count} شماره با موفقیت از اکسل اضافه شد.`,
              `${count} numbers added from Excel.`
            )
          );
        } else if (skippedPhones.length === 0) {
          toast.error(tr('شماره معتبری یافت نشد.', 'No valid number found.'));
        }
      } catch (error) {
        toast.error(tr('خطا در خواندن فایل اکسل.', 'Error reading excel file.'));
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualAdd = (phone: string, fullName: string) => {
    if (blacklist.some((b) => b.phone === phone)) {
      toast.error(tr('خطا: این شماره در لیست سیاه قرار دارد.', 'Error: This number is blacklisted.'));
      return;
    }
    const existingCall = calls.find((c) => c.phone === phone);
    if (existingCall) {
      toast.error(tr('خطا: این شماره در لیست وجود دارد.', 'Error: This number already exists.'));
      return;
    }
    addCall({ phone, fullName });
    toast.success(tr('شماره جدید با موفقیت اضافه شد.', 'New number added successfully.'));
  };

  const handleFieldChange = (call: CallRecord, field: keyof CallRecord, value: any) => {
    updateCall({ ...call, [field]: value });
  };

  const handleStatusChange = (call: CallRecord, newStatus: string) => {
    if (newStatus === 'ثبت نام کرد') {
      setConfirmModalConfig({
        isOpen: true,
        title: tr('تایید ثبت‌نام', 'Confirm Registration'),
        message: tr('آیا مطمئن هستید که این فرد ثبت نام کرده است؟', 'Are you sure this person has registered?'),
        onConfirm: () => {
          updateCall({ ...call, callStatus: newStatus });
          recordAttempt(call.id, { ...call, callStatus: newStatus });
          toast.success(tr('وضعیت اعمال شد.', 'Status applied.'));
        }
      });
    } else {
      updateCall({ ...call, callStatus: newStatus });
      recordAttempt(call.id, { ...call, callStatus: newStatus });
    }
  };

  // --- Batch Selection Logic ---
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragSelecting(false);
      setDragStartId(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleRowMouseDown = (e: React.MouseEvent, id: string, index: number) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.closest('button')) {
      return;
    }

    if (e.shiftKey && lastSelectedId) {
      const lastIndex = displayedList.findIndex((c) => c.id === lastSelectedId);
      if (lastIndex !== -1) {
        const start = Math.min(index, lastIndex);
        const end = Math.max(index, lastIndex);
        const idsToSelect = displayedList.slice(start, end + 1).map((c) => c.id);
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          idsToSelect.forEach((i) => newSet.add(i));
          return newSet;
        });
      }
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelection(id);
      setLastSelectedId(id);
    } else {
      setIsDragSelecting(true);
      setDragStartId(id);
    }
  };

  const handleRowMouseEnter = (id: string) => {
    if (isDragSelecting) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (dragStartId) {
          newSet.add(dragStartId);
          setDragStartId(null);
        }
        newSet.add(id);
        return newSet;
      });
      setLastSelectedId(id);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: tr('حذف گروهی شماره‌ها', 'Batch delete numbers'),
      message: tr(
        `آیا مطمئن هستید که می‌خواهید ${selectedIds.size} شماره انتخاب شده را حذف کنید؟`,
        `Are you sure you want to delete ${selectedIds.size} numbers?`
      ),
      onConfirm: async () => {
        const ids: string[] = Array.from(selectedIds);
        const promises = ids.map((id) => deleteCall(id));
        const results = await Promise.all(promises);

        const failedIds = new Set<string>();
        let successCount = 0;

        results.forEach((success, index) => {
          if (success) {
            successCount++;
          } else {
            failedIds.add(ids[index]);
          }
        });

        if (failedIds.size === 0) {
          toast.success(
            tr(
              `${selectedIds.size} شماره با موفقیت حذف شد.`,
              `${selectedIds.size} numbers successfully deleted.`
            )
          );
          setSelectedIds(new Set());
        } else {
          toast.error(
            tr(
              `تعداد ${failedIds.size} شماره حذف نشد. لطفا دوباره تلاش کنید.`,
              `${failedIds.size} numbers failed to delete. Please try again.`
            )
          );
          if (successCount > 0) {
            toast.success(
              tr(
                `${successCount} شماره با موفقیت حذف شد.`,
                `${successCount} numbers successfully deleted.`
              )
            );
          }
          setSelectedIds(failedIds);
        }
      }
    });
  };

  const handleBatchFollowUp = () => {
    if (selectedIds.size === 0) return;
    Array.from(selectedIds).forEach((id) => {
      const call = calls.find((c) => c.id === id);
      if (call && !call.isFollowUp) updateCall({ ...call, isFollowUp: true });
    });
    toast.success(
      tr(
        `نشانه‌گذاری پیگیری برای ${selectedIds.size} شماره انجام شد.`,
        `Follow-up marked for ${selectedIds.size} numbers.`
      )
    );
    setSelectedIds(new Set());
  };

  const handleBatchCancelFollowUp = () => {
    if (selectedIds.size === 0) return;
    Array.from(selectedIds).forEach((id) => {
      const call = calls.find((c) => c.id === id);
      if (call && call.isFollowUp) updateCall({ ...call, isFollowUp: false });
    });
    toast.success(
      tr(
        `نشانه‌گذاری پیگیری برای ${selectedIds.size} شماره لغو شد.`,
        `Follow-up cancelled for ${selectedIds.size} numbers.`
      )
    );
    setSelectedIds(new Set());
  };

  const handleBatchReset = () => {
    if (selectedIds.size === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: tr('بازگردانی گروهی به حالت اولیه', 'Batch Reset'),
      message: tr(
        `آیا مطمئن هستید که می‌خواهید اطلاعات ${selectedIds.size} شماره را به حالت خام اولیه (بدون یادداشت، نام، نتیجه و...) برگردانید؟`,
        `Are you sure you want to reset ${selectedIds.size} numbers to their raw state?`
      ),
      onConfirm: () => {
        Array.from(selectedIds).forEach((id) => {
          const call = calls.find((c) => c.id === id);
          if (call) {
            updateCall({
              ...call,
              fullName: '',
              callStatus: '',
              interestedCourse: '',
              notes: '',
              isFollowUp: false
            });
          }
        });
        toast.success(
          tr(
            `${selectedIds.size} شماره به حالت اولیه بازگردانی شد.`,
            `${selectedIds.size} numbers reset to raw state.`
          )
        );
        setSelectedIds(new Set());
      }
    });
  };

  const handleBatchNote = () => {
    const note = window.prompt('متن یادداشت مشترک را وارد کنید:');
    if (note && note.trim()) {
      Array.from(selectedIds).forEach((id) => {
        const call = calls.find((c) => c.id === id);
        if (call) updateCall({ ...call, notes: note.trim() });
      });
      toast.success(tr('یادداشت گروهی اعمال شد.', 'Batch notes applied.'));
      setSelectedIds(new Set());
    }
  };

  const handleActionModalSubmit = async (taskData: {
    taskType: ContactTaskType;
    scheduledDate?: string;
    scheduledTime?: string;
    followupNote?: string;
  }) => {
    if (!actionModalCall) return;
    const call = actionModalCall;

    setSubmittingIds((prev) => new Set(prev).add(call.id));

    try {
      await recordCallAttemptWithTask({
        contactId: call.id,
        fullName: call.fullName || '',
        callStatus: call.callStatus || '',
        taskType: taskData.taskType,
        scheduledDate: taskData.scheduledDate,
        scheduledTime: taskData.scheduledTime,
        followupNote: taskData.followupNote
      });
      toast.success(tr('پیگیری با موفقیت ثبت شد.', 'Follow-up task created.'));
      loadTasks();
      setActionModalCall(null);
    } catch (err) {
      toast.error(tr('خطا در ثبت پیگیری.', 'Error submitting task.'));
    } finally {
      setSubmittingIds((prev) => {
        const next = new Set(prev);
        next.delete(call.id);
        return next;
      });
    }
  };

  const handleEditTaskSubmit = async (taskId: string, data: any) => {
    try {
      await updateContactTaskDetails({
        taskId,
        taskType: data.taskType,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        followupNote: data.followupNote
      });
      toast.success(tr('پیگیری با موفقیت ویرایش شد.', 'Task updated.'));
      setEditModalTask(null);
      loadTasks();
    } catch (err) {
      toast.error(tr('خطا در ویرایش پیگیری', 'Error updating task'));
    }
  };

  const displayedList = useMemo(() => {
    let list = calls.filter((c) => !c.isBlacklisted);
    if (searchQuery.trim()) {
      list = list.filter((c) => matchesSearch(c, searchQuery));
    }
    if (selectedStatusFilter) {
      if (selectedStatusFilter === 'پیگیری') {
        list = list.filter((c) => c.isFollowUp);
      } else if (selectedStatusFilter === 'ثبت نشده') {
        list = list.filter((c) => !c.callStatus || !CALL_STATUSES.includes(c.callStatus));
      } else {
        list = list.filter((c) => c.callStatus === selectedStatusFilter);
      }
    }
    return list.sort((a, b) => {
      // 1. Follow-ups at the top
      if (a.isFollowUp && !b.isFollowUp) return -1;
      if (!a.isFollowUp && b.isFollowUp) return 1;

      // If both are follow-ups, sort by Date (descending)
      if (a.isFollowUp && b.isFollowUp) {
        const aTime = a.updatedAt || a.createdAt;
        const bTime = b.updatedAt || b.createdAt;
        const timeDiff = String(bTime).localeCompare(String(aTime));
        if (timeDiff !== 0) return timeDiff;
        return String(a.id).localeCompare(String(b.id));
      }

      // 2. Worked numbers (has callStatus) come before Raw numbers
      const aWorked = !!a.callStatus;
      const bWorked = !!b.callStatus;

      if (aWorked && !bWorked) return -1;
      if (!aWorked && bWorked) return 1;

      // If both are worked, sort by Date (descending)
      if (aWorked && bWorked) {
        const aTime = a.updatedAt || a.createdAt;
        const bTime = b.updatedAt || b.createdAt;
        const timeDiff = String(bTime).localeCompare(String(aTime));
        if (timeDiff !== 0) return timeDiff;
        return String(a.id).localeCompare(String(b.id));
      }

      // 3. Raw numbers sort by Date (createdAt descending), then by phone
      const aRawTime = a.createdAt || '';
      const bRawTime = b.createdAt || '';
      const rawTimeDiff = String(bRawTime).localeCompare(String(aRawTime));
      if (rawTimeDiff !== 0) return rawTimeDiff;

      const phoneDiff = String(a.phone || '').localeCompare(String(b.phone || ''));
      if (phoneDiff !== 0) return phoneDiff;

      // Fallback
      const qDiff = (a.queueOrder ?? 0) - (b.queueOrder ?? 0);
      if (qDiff !== 0) return qDiff;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [calls, searchQuery, selectedStatusFilter]);

  // Status statistics
  const totalActiveCount = useMemo(() => {
    return calls.filter((c) => !c.isBlacklisted).length;
  }, [calls]);

  const displayedCount = displayedList.length;

  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CALL_STATUSES.forEach((status) => {
      stats[status] = 0;
    });
    stats['پیگیری'] = 0;
    stats['ثبت نشده'] = 0;

    calls
      .filter((c) => !c.isBlacklisted)
      .forEach((c) => {
        if (c.callStatus && CALL_STATUSES.includes(c.callStatus)) {
          stats[c.callStatus]++;
        } else {
          stats['ثبت نشده']++;
        }
        if (c.isFollowUp) {
          stats['پیگیری']++;
        }
      });
    return stats;
  }, [calls]);

  const exportDailyStats = async () => {
    if (displayedList.length === 0) {
      return toast.info(tr('موردی برای خروجی وجود ندارد.', 'No items to export.'));
    }
    const hStats = await getMyDailyStats();
    const todayStr = toJalali();
    const todayWorkedCount = calls.filter(
      (c) => c.callStatus && c.updatedAt && toJalali(c.updatedAt) === todayStr
    ).length;
    await exportConsultationsToExcel(
      displayedList,
      displayedList.length,
      hStats,
      todayWorkedCount
    );
    toast.success(tr('فایل اکسل با موفقیت ایجاد شد.', 'Excel created successfully.'));
  };

  const rowGroups = [
    {
      key: 'followUp' as const,
      title: tr('پیگیری‌ها', 'Follow-ups'),
      items: displayedList.filter((c) => c.isFollowUp)
    },
    {
      key: 'worked' as const,
      title: tr('کارشده‌ها', 'Worked'),
      items: displayedList.filter((c) => !c.isFollowUp && !!c.callStatus)
    },
    {
      key: 'raw' as const,
      title: tr('خام (کارنشده)', 'Raw'),
      items: displayedList.filter((c) => !c.isFollowUp && !c.callStatus)
    }
  ];

  if (isLoadingCalls && !hasInitialCallsLoaded) {
    return (
      <div
        className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#0b0f14]"
        dir={direction}
      >
        <div className="text-slate-500 font-medium text-[13px]">
          {tr('در حال بارگذاری اطلاعات...', 'Loading...')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col hide-scrollbar relative bg-slate-50/50 dark:bg-[#0b0f14] ${
        isDragSelecting ? 'select-none' : ''
      }`}
      dir={direction}
    >
      {callsError && hasInitialCallsLoaded && (
        <div className="w-full max-w-3xl mx-auto mt-3 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[13px] font-medium text-center border border-rose-200 animate-pulse">
          {callsError}
        </div>
      )}

      {/* Floating Batch Action Toolbar */}
      <BatchSelectionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBatchFollowUp={handleBatchFollowUp}
        onBatchCancelFollowUp={handleBatchCancelFollowUp}
        onBatchNotes={handleBatchNote}
        onBatchReset={handleBatchReset}
        onBatchDelete={handleBatchDelete}
      />

      <div className="flex-1 w-full min-h-0 flex items-stretch">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="relative h-full bg-[#f3f6fa] dark:bg-[#0c1017] flex flex-col overflow-hidden">
            {/* Adaptive Command Header: Single consolidated row with Identity, Navigation, Search, Filters & Actions */}
            <AdaptiveCommandHeader
              displayedCount={displayedCount}
              totalActiveCount={totalActiveCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClearSearch={() => setSearchQuery('')}
              onReturnHome={() => setCurrentView('home')}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              statusStats={statusStats}
              selectedStatusFilter={selectedStatusFilter}
              onSelectFilter={setSelectedStatusFilter}
              onExcelUploadClick={() => fileInputRef.current?.click()}
              onManualAddClick={() => setIsManualAddOpen(true)}
              onMoveNotInterestedClick={() => {
                setConfirmModalConfig({
                  isOpen: true,
                  title: tr('انتقال به لیست سیاه', 'Move to Blacklist'),
                  message: tr(
                    'آیا مطمئن هستید که می‌خواهید تمام شماره‌های با وضعیت "عدم تمایل" را به لیست سیاه منتقل کنید؟',
                    'Are you sure you want to move all "Not Interested" numbers to blacklist?'
                  ),
                  onConfirm: () => {
                    const toBlacklist = calls.filter(
                      (c) => c.callStatus === 'عدم تمایل' && !c.isBlacklisted
                    );
                    toBlacklist.forEach((c) => addToBlacklist(c.phone, 'عدم تمایل'));
                    toast.success(
                      tr(
                        `${toBlacklist.length} شماره به لیست سیاه منتقل شد.`,
                        `${toBlacklist.length} numbers moved to blacklist.`
                      )
                    );
                  }
                });
              }}
              onDeleteAllClick={() => {
                setConfirmModalConfig({
                  isOpen: true,
                  title: tr('حذف شماره‌های نمایش‌داده‌شده', 'Delete Displayed Numbers'),
                  message: tr(
                    'آیا مطمئن هستید که می‌خواهید تمام شماره‌های نمایش‌داده‌شده در این بخش را حذف کنید؟',
                    'Are you sure you want to delete the displayed numbers in this view?'
                  ),
                  onConfirm: async () => {
                    const toDelete = calls.filter((c) =>
                      displayedList.some((f) => f.id === c.id)
                    );
                    const promises = toDelete.map((c) => deleteCall(c.id));
                    const results = await Promise.all(promises);

                    const failedCount = results.filter((success) => !success).length;

                    if (failedCount === 0) {
                      toast.success(tr('لیست با موفقیت پاک شد.', 'List successfully cleared.'));
                    } else {
                      toast.error(
                        tr(
                          `خطا در پاک کردن ${failedCount} شماره. لطفا دوباره تلاش کنید.`,
                          `Error clearing ${failedCount} numbers. Please try again.`
                        )
                      );
                    }
                  }
                });
              }}
              isScrolled={isContentScrolled}
            />

            {/* Hidden Excel File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />

            {/* Main Content Area */}
            <div
              onScroll={(e) => setIsContentScrolled(e.currentTarget.scrollTop > 8)}
              className="flex-1 overflow-x-auto overflow-y-auto custom-select-scroll relative z-10"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="w-full h-full min-h-full flex flex-col"
                >
                  {activeTab === 'courses' ? (
                    <div className="w-full h-full">
                      <CoursesView embedded={true} />
                    </div>
                  ) : activeTab === 'learning_paths' ? (
                    <div className="w-full h-full relative">
                      <LearningPathsModal isOpen={true} onClose={() => {}} embedded={true} />
                    </div>
                  ) : activeTab === 'stats' ? (
                    <div className="w-full h-full relative">
                      <CallListStats calls={displayedList} onExport={exportDailyStats} />
                    </div>
                  ) : activeTab === 'blacklist' ? (
                    <div className="w-full h-full relative">
                      <BlacklistView />
                    </div>
                  ) : (
                <div className="p-3 md:p-4 pb-28">
                  <table className="w-full text-center border-separate border-spacing-y-2 table-fixed min-w-[960px]">
                    <colgroup>
                      <col className="w-[48px]" /> {/* Checkbox */}
                      <col className="w-[230px]" /> {/* Phone & Name */}
                      <col className="w-[190px]" /> {/* Call Result */}
                      <col className="w-[220px]" /> {/* Interested Course */}
                      <col className="w-[330px]" /> {/* Actions & Time */}
                    </colgroup>
                    <thead className="sticky top-0 z-20 backdrop-blur-md">
                      <tr className="[&>th]:bg-[#e2e8f0] dark:[&>th]:bg-[#1e293b] [&>th]:py-3 [&>th]:px-2.5 [&>th]:border-y [&>th]:border-slate-300 dark:[&>th]:border-[#334155] [&>th:first-child]:rounded-r-xl [&>th:first-child]:border-r [&>th:last-child]:rounded-l-xl [&>th:last-child]:border-l text-[12.5px] font-bold text-slate-800 dark:text-slate-100 tracking-wide shadow-xs">
                        <th className="text-center">
                          <input
                            type="checkbox"
                            checked={
                              displayedList.length > 0 &&
                              selectedIds.size === displayedList.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(new Set(displayedList.map((c) => c.id)));
                              } else {
                                setSelectedIds(new Set());
                              }
                            }}
                            aria-label={tr('انتخاب همه شماره‌ها', 'Select all numbers')}
                            className="w-4 h-4 rounded text-brand-600 border-slate-400 dark:border-slate-500 bg-white dark:bg-[#18222e] focus:ring-brand-500 cursor-pointer shadow-2xs"
                          />
                        </th>
                        <th className="whitespace-nowrap">
                          {tr('شماره تماس و نام', 'Phone & Name')}
                        </th>
                        <th className="whitespace-nowrap">
                          {tr('نتیجه تماس', 'Call Result')}
                        </th>
                        <th className="whitespace-nowrap">
                          {tr('دوره مدنظر', 'Course')}
                        </th>
                        <th className="whitespace-nowrap">
                          {tr('عملیات و زمان', 'Actions & Time')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] font-medium text-slate-800 dark:text-[#c0c8d2] relative">
                      <AnimatePresence>
                        {rowGroups.map((group) => (
                          <React.Fragment key={group.key}>
                            {group.items.length > 0 && (
                              <CallGroupHeader
                                groupKey={group.key}
                                title={group.title}
                                count={group.items.length}
                                isExpanded={expandedSections[group.key]}
                                onToggle={() => toggleSection(group.key)}
                              />
                            )}
                            <AnimatePresence>
                              {expandedSections[group.key] &&
                                group.items.map((c) => {
                                  const index = displayedList.findIndex(
                                    (item) => item.id === c.id
                                  );
                                  return (
                                    <CallTableRow
                                      key={c.id}
                                      call={c}
                                      index={index}
                                      isSelected={selectedIds.has(c.id)}
                                      onToggleSelect={() => toggleSelection(c.id)}
                                      onMouseDown={(e) => handleRowMouseDown(e, c.id, index)}
                                      onMouseEnter={() => handleRowMouseEnter(c.id)}
                                      onFieldChange={(field, value) =>
                                        handleFieldChange(c, field, value)
                                      }
                                      onStatusChange={(status) =>
                                        handleStatusChange(c, status)
                                      }
                                      onOpenNotes={() => setNotesModalCall(c)}
                                      onBlacklist={() => {
                                        setConfirmModalConfig({
                                          isOpen: true,
                                          title: tr('انتقال به لیست سیاه', 'Move to Blacklist'),
                                          message: tr(
                                            'آیا مطمئن هستید که می‌خواهید این شماره را به لیست سیاه منتقل کنید؟',
                                            'Are you sure you want to move this number to blacklist?'
                                          ),
                                          onConfirm: () => {
                                            addToBlacklist(c.phone);
                                            toast.success(
                                              tr(
                                                'شماره به لیست سیاه منتقل شد.',
                                                'Number moved to blacklist.'
                                              )
                                            );
                                          }
                                        });
                                      }}
                                      onDelete={() => {
                                        setConfirmModalConfig({
                                          isOpen: true,
                                          title: tr('حذف شماره', 'Delete'),
                                          message: tr(
                                            'آیا مطمئن هستید که می‌خواهید این شماره را حذف کنید؟',
                                            'Are you sure you want to delete this number?'
                                          ),
                                          onConfirm: async () => {
                                            try {
                                              const success = await deleteCall(c.id);
                                              if (success) {
                                                toast.success(
                                                  tr('شماره حذف شد.', 'Number deleted.')
                                                );
                                              } else {
                                                toast.error(
                                                  tr(
                                                    'خطا در حذف شماره',
                                                    'Error deleting number.'
                                                  )
                                                );
                                              }
                                            } catch (err) {
                                              toast.error(
                                                tr(
                                                  'خطا در حذف شماره',
                                                  'Error deleting number.'
                                                )
                                              );
                                            }
                                          }
                                        });
                                      }}
                                    />
                                  );
                                })}
                            </AnimatePresence>
                          </React.Fragment>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {/* Empty state */}
                  {displayedList.length === 0 && activeTab === 'list' && (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#192330] border border-slate-200 dark:border-[#2a3848] flex items-center justify-center mb-3.5 text-slate-400 dark:text-slate-500 shadow-2xs">
                        <Filter size={24} />
                      </div>
                      <h3 className="font-bold text-slate-700 dark:text-[#d3dfed] text-[14.5px] mb-1">
                        {tr('هیچ شماره‌ای یافت نشد', 'No calls found')}
                      </h3>
                      <p className="text-slate-500 dark:text-[#7f8da0] text-[12.5px] max-w-sm mb-4">
                        {searchQuery || selectedStatusFilter
                          ? tr(
                              'با توجه به فیلترها یا عبارت جستجوی فعلی، موردی برای نمایش وجود ندارد.',
                              'No calls match current search or status filter.'
                            )
                          : tr('لیست شماره‌های شما خالی است.', 'Your call list is empty.')}
                      </p>
                      {(searchQuery || selectedStatusFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedStatusFilter(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1f2a38] dark:hover:bg-[#283648] text-slate-700 dark:text-[#c4d0df] border border-slate-200 dark:border-[#2e3e50] text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                          {tr('پاک‌سازی فیلترها و جستجو', 'Clear filters and search')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <CallResultActionModal
        isOpen={!!actionModalCall}
        onClose={() => setActionModalCall(null)}
        onSubmit={handleActionModalSubmit}
        isSubmitting={submittingIds.has(actionModalCall?.id || '')}
        call={actionModalCall}
        activeTab="followup"
      />
      {editModalTask && (
        <ContactTaskEditorModal
          isOpen={!!editModalTask}
          onClose={() => setEditModalTask(null)}
          task={editModalTask}
          onSubmit={handleEditTaskSubmit}
          isSubmitting={false}
        />
      )}
      <NotesModal
        call={notesModalCall}
        isOpen={!!notesModalCall}
        onClose={() => setNotesModalCall(null)}
        onSave={(notes) => {
          if (notesModalCall) handleFieldChange(notesModalCall, 'notes', notes);
        }}
      />
      <ManualAddModal
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onAdd={handleManualAdd}
      />
      <ConfirmDialog
        isOpen={confirmModalConfig.isOpen}
        onCancel={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
      />
    </div>
  );
};

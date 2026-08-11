/**
 * ManagerDashboard — RTL 2D Flat Design Launchpad & Management Center for active admins
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import NTLogo from '../../NT Logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../hooks/useAppContext';
import { supabase } from '../../lib/supabase';
import { SupabaseProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, Clock, CheckCircle2, Ban, LogOut,
  RefreshCw, AlertCircle, Activity, Inbox, Download, FileText, X, MessageSquare, Send, Lock, Trash2, Award, User,
  ArrowRight, ArrowLeft, Sparkles, Plus, Grid, ChevronLeft, Search
} from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import * as XLSX from 'xlsx';
import { toJalali } from '../../utils/jalali';
import { formatPhoneNumber } from '../../utils/format';

const DUTY_LABELS: Record<string, string> = {
  early_week: 'مدیر اول هفته',
  late_week:  'مدیر آخر هفته',
};

const EXPERT_DUTY_LABELS: Record<string, string> = {
  early_week: 'اول هفته',
  late_week: 'آخر هفته'
};

const DutyBadge = ({ group }: { group?: string | null }) => {
  if (!group) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 mx-1">بدون گروه</span>;
  if (group === 'early_week') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/60 mx-1">اول هفته</span>;
  if (group === 'late_week') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/60 mx-1">آخر هفته</span>;
  return null;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'در انتظار',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900' },
    active:   { label: 'فعال',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900' },
    disabled: { label: 'غیرفعال',     cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
  return <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${cls}`}>{label}</span>;
};

export type AdminSubView = null | 'users' | 'presence' | 'stats' | 'followups' | 'security';

export const ManagerDashboard: React.FC = () => {
  const { supabaseProfile, supabaseUser, signOut, approveAgent, disableAgent } = useAuth();
  const { currentView, setCurrentView } = useAppContext();

  // Navigation State
  const [activeSubView, setActiveSubView] = useState<AdminSubView>(null);
  const [userTab, setUserTab] = useState<'pending' | 'agents' | 'managers'>('pending');

  // Data State
  const [profiles, setProfiles]     = useState<SupabaseProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);

  // Followups
  const [receivedShares, setReceivedShares] = useState<any[]>([]);
  const [sharesLoading, setSharesLoading] = useState(true);
  const [sharesError, setSharesError] = useState(false);
  const [viewingShare, setViewingShare] = useState<any>(null);

  const [activeExperts, setActiveExperts] = useState<{id: string, full_name: string}[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);


  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Presence
  const [presenceList, setPresenceList] = useState<any[]>([]);
  const [presenceLoading, setPresenceLoading] = useState(true);
  const [presenceError, setPresenceError] = useState(false);

  // Daily Stats
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [rangeFromDate, setRangeFromDate] = useState<string>('');
  const [rangeToDate, setRangeToDate] = useState<string>('');
  const [rangeSummary, setRangeSummary] = useState<any>(null);
  const [rangeError, setRangeError] = useState<string>('');
  const [rangeDutyFilter, setRangeDutyFilter] = useState<'all' | 'early_week' | 'late_week'>('all');
  const [rangeSort, setRangeSort] = useState<'calls_desc' | 'calls_asc' | 'name'>('calls_desc');

  const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');
  const [statsSortOrder, setStatsSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dailyDutyFilter, setDailyDutyFilter] = useState<'all' | 'early_week' | 'late_week'>('all');

  const profileMap = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error) setProfiles((data as SupabaseProfile[]) || []);
    setLoadingProfiles(false);
  }, []);

  const loadShares = useCallback(async () => {
    if (!supabaseProfile?.id) return;
    setSharesLoading(true); setSharesError(false);
    const { data, error } = await supabase.from('followup_shares')
      .select('id, item_count, sent_at, payload_json, reviewed_at, reviewed_by_manager_id, sender:profiles!sender_expert_id(full_name)')
      .eq('receiver_manager_id', supabaseProfile.id).order('sent_at', { ascending: false });
    if (error) setSharesError(true);
    else setReceivedShares(data || []);
    setSharesLoading(false);
  }, [supabaseProfile?.id]);

  const loadExperts = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_active_experts');
    if (!error && data) setActiveExperts(data);
  }, []);

  const fetchPresence = useCallback(async () => {
    setPresenceLoading(true);
    const { data, error } = await supabase.rpc('get_presence_summary');
    if (error) setPresenceError(true);
    else { setPresenceError(false); setPresenceList(data || []); }
    setPresenceLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    if (profiles.length === 0) return;
    setStatsLoading(true);

    const { data, error } = await supabase
      .from('expert_daily_stats')
      .select('expert_id, jalali_date, call_count')
      .gte('jalali_date', '1405/04/22');

    if (error) setStatsError(true);
    else if (data) {
      setStatsError(false);

      const statsArr = data.filter(row => {
        return /^\d{4}\/\d{2}\/\d{2}$/.test(row.jalali_date);
      }).map(row => {
        const profile = profiles.find(p => p.id === row.expert_id);
        return {
          expertId: row.expert_id,
          dateStr: row.jalali_date,
          expertName: profile ? profile.full_name : 'کارشناس نامشخص',
          workedCount: row.call_count,
          attemptsCount: row.call_count,
          minTimeStr: '---',
          maxTimeStr: '---'
        };
      });

      statsArr.sort((a, b) => {
        return b.dateStr.localeCompare(a.dateStr);
      });

      setDailyStats(statsArr);
    }
    setStatsLoading(false);
  }, [profiles]);

  const handleCalculateRange = useCallback(() => {
    setRangeError('');
    setRangeSummary(null);

    if (!rangeFromDate || !rangeToDate) {
      setRangeError('لطفاً ابتدا بازه تاریخ را کامل انتخاب کنید.');
      return;
    }

    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(rangeFromDate) || !/^\d{4}\/\d{2}\/\d{2}$/.test(rangeToDate)) {
      setRangeError('فرمت تاریخ باید YYYY/MM/DD باشد.');
      return;
    }

    if (rangeFromDate > rangeToDate) {
      setRangeError('تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.');
      return;
    }

    let totalCalls = 0;
    let earlyWeekCalls = 0;
    let lateWeekCalls = 0;
    const activeDaysSet = new Set<string>();
    const expertMap = new Map<string, { expertName: string, count: number, duty_group?: string }>();

    const filtered = dailyStats.filter(row => {
      if (row.dateStr < rangeFromDate || row.dateStr > rangeToDate) return false;
      if (rangeDutyFilter !== 'all') {
        const p = profileMap.get(row.expertId);
        const group = p ? p.duty_group : null;
        if (group !== rangeDutyFilter) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      setRangeError('در این بازه با فیلتر انتخاب شده هیچ تماسی ثبت نشده است.');
      return;
    }

    filtered.forEach(row => {
      totalCalls += row.workedCount;
      activeDaysSet.add(row.dateStr);

      const p = profileMap.get(row.expertId);
      const duty_group = p ? p.duty_group : null;
      if (duty_group === 'early_week') earlyWeekCalls += row.workedCount;
      if (duty_group === 'late_week') lateWeekCalls += row.workedCount;

      const existing = expertMap.get(row.expertId);
      if (existing) {
        existing.count += row.workedCount;
      } else {
        expertMap.set(row.expertId, { expertName: row.expertName, count: row.workedCount, duty_group });
      }
    });

    const finalExperts = Array.from(expertMap.values()).sort((a, b) => b.count - a.count);
    const activeExpertsCount = finalExperts.length;
    const avgCalls = activeExpertsCount > 0 ? Math.round(totalCalls / activeExpertsCount) : 0;

    setRangeSummary({
      totalCalls,
      activeDays: activeDaysSet.size,
      activeExperts: activeExpertsCount,
      avgCalls,
      expertsList: finalExperts,
      earlyWeekCalls,
      lateWeekCalls,
      filterLabel: rangeDutyFilter === 'all' ? 'همه کارشناسان' : EXPERT_DUTY_LABELS[rangeDutyFilter]
    });
  }, [rangeFromDate, rangeToDate, dailyStats, rangeDutyFilter, profiles]);

  const handleExportRangeTxt = useCallback(() => {
    if (!rangeSummary) return;

    const lines = [
      'گزارش تماس کارشناسان نوینتک',
      '--------------------------------',
      '',
      'بازه گزارش:',
      `${rangeFromDate} تا ${rangeToDate}`,
      '',
      'گروه:',
      rangeDutyFilter === 'all' ? 'همه کارشناسان' : EXPERT_DUTY_LABELS[rangeDutyFilter] || 'نامشخص',
      '',
      'جمع کل تماس‌ها:',
      rangeSummary.totalCalls.toLocaleString('en-US'),
      '',
      'تعداد کارشناسان فعال:',
      rangeSummary.activeExperts.toLocaleString('en-US'),
      '',
      'تعداد روزهای فعال:',
      rangeSummary.activeDays.toLocaleString('en-US'),
      '',
      'میانگین تماس هر کارشناس:',
      rangeSummary.avgCalls.toLocaleString('en-US'),
      '',
      '--------------------------------',
      'آمار کارشناسان',
      '--------------------------------',
      ''
    ];

    let sortedExperts = [...rangeSummary.expertsList];
    if (rangeSort === 'calls_asc') sortedExperts.sort((a, b) => a.count - b.count);
    else if (rangeSort === 'name') sortedExperts.sort((a, b) => a.expertName.localeCompare(b.expertName));
    else sortedExperts.sort((a, b) => b.count - a.count);

    sortedExperts.forEach((exp, idx) => {
      lines.push(`${idx + 1}. ${exp.expertName}`);
      lines.push(`تعداد تماس: ${exp.count}`);
      lines.push(`گروه: ${exp.duty_group === 'early_week' ? 'اول هفته' : exp.duty_group === 'late_week' ? 'آخر هفته' : 'بدون گروه'}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-report-${rangeDutyFilter}-${rangeFromDate.replace(/\//g, '-')}-to-${rangeToDate.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rangeSummary, rangeDutyFilter, rangeFromDate, rangeToDate, rangeSort]);

  const setQuickPreset = useCallback((preset: '1month' | '7days' | 'startOfMonth') => {
    const todayStr = toJalali(new Date());
    setRangeToDate(todayStr);

    if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setRangeFromDate(toJalali(d));
    } else if (preset === '1month') {
      let [y, m, d] = todayStr.split('/').map(Number);
      m -= 1;
      if (m === 0) { m = 12; y -= 1; }
      if (m >= 7 && m <= 11 && d > 30) d = 30;
      if (m === 12 && d > 29) d = 29;
      const mm = m.toString().padStart(2, '0');
      const dd = d.toString().padStart(2, '0');
      setRangeFromDate(`${y}/${mm}/${dd}`);
    } else if (preset === 'startOfMonth') {
      setRangeFromDate(todayStr.substring(0, 8) + '01');
    }
  }, []);

  useEffect(() => {
    loadProfiles(); loadShares(); loadExperts(); fetchPresence();
  }, [loadProfiles, loadShares, loadExperts, fetchPresence]);

  useEffect(() => {
    fetchStats();
  }, [profiles, fetchStats]);

  useEffect(() => {
    const presenceInt = setInterval(fetchPresence, 30000);
    const statsInt = setInterval(fetchStats, 60000);
    return () => { clearInterval(presenceInt); clearInterval(statsInt); };
  }, [fetchPresence, fetchStats]);

  // Back Navigation Helper & Keyboard/Mouse Shortcuts Listener
  const handleBackNavigation = useCallback(() => {
    if (viewingShare && !isReviewing) {
      setViewingShare(null);
      return true;
    }
    if (activeSubView !== null) {
      setActiveSubView(null);
      return true;
    }
    if (currentView && currentView !== 'home') {
      setCurrentView('home');
      return true;
    }
    return false;
  }, [viewingShare, activeSubView, isReviewing, currentView, setCurrentView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) {
        e.preventDefault();
        handleBackNavigation();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) { // Browser Back/Forward buttons
        e.preventDefault();
        handleBackNavigation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleBackNavigation]);

  const refreshAll = () => {
    loadProfiles(); loadShares(); fetchPresence(); fetchStats();
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleApprove = async (p: SupabaseProfile) => {
    setActionId(p.id);
    const err = await approveAgent(p.id);
    if (err) toast.error(err); else { toast.success(`حساب «${p.full_name}» فعال شد.`); await loadProfiles(); }
    setActionId(null);
  };

  const handleDisable = async (p: SupabaseProfile) => {
    setActionId(p.id);
    const err = await disableAgent(p.id);
    if (err) toast.error(err); else { toast.success(`حساب «${p.full_name}» غیرفعال شد.`); await loadProfiles(); }
    setActionId(null);
  };

  const handleReviewShare = async (shareId: string) => {
    setIsReviewing(true);
    const { error } = await supabase.rpc('review_followup_share', { p_share_id: shareId });
    setIsReviewing(false);
    if (error) toast.error('خطا در بررسی لیست.');
    else {
      toast.success('لیست بررسی‌شد.');
      await loadShares();
      setViewingShare((prev: any) => prev?.id === shareId ? { ...prev, reviewed_at: new Date().toISOString() } : prev);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('آیا از حذف این لیست پیگیری مطمئن هستید؟')) return;
    setIsReviewing(true);
    const { error } = await supabase.rpc('delete_followup_share', { p_share_id: shareId });
    setIsReviewing(false);
    if (error) toast.error('خطا در حذف لیست.');
    else {
      toast.success('لیست پیگیری حذف شد.');
      setViewingShare(null);
      await loadShares();
    }
  };



  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('تمام فیلدها را پر کنید.');
    if (newPassword.length < 8) return toast.error('رمز جدید حداقل ۸ کاراکتر.');
    if (newPassword !== confirmPassword) return toast.error('تکرار رمز مطابقت ندارد.');
    if (newPassword === currentPassword) return toast.error('رمز مشابه قبلی است.');
    if (!supabaseUser?.email) return;

    setIsChangingPassword(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: supabaseUser.email, password: currentPassword });
    if (signInError) { setIsChangingPassword(false); return toast.error('رمز فعلی نامعتبر است.'); }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (updateError) toast.error('خطا در تغییر رمز عبور.');
    else {
      toast.success('رمز عبور تغییر کرد.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  };


  const exportAllStatsToExcel = async () => {
    const targetDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" })).toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('get_experts_daily_stats_export', { target_date: targetDate });
    if (error || !data) {
       toast.error('خطا در دریافت آمار.');
       return;
    }
    if (data.length === 0) {
       toast.error('آماری برای امروز یافت نشد.');
       return;
    }

    const worksheetData = data.map((item: any) => ({
      'نام کارشناس': item.full_name,
      'تعداد کل تماس‌ها': item.total_calls,
      'تعداد ثبت نام': item.registered_count,
      'تعداد پیگیری': item.followup_count,
      'تعداد مشاوره': item.consultation_count,
      'تعداد فعالیت (لیست اصلی)': item.activity_count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
    ];
    worksheet['!dir'] = 'rtl';

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'آمار امروز');

    const fileName = `آمار_کارشناسان_${targetDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportDailyTxt = useCallback(() => {
    if (dailyStats.length === 0) return;

    const filtered = dailyStats.filter(s => {
      if (statsSearchQuery && !s.expertName?.toLowerCase().includes(statsSearchQuery.toLowerCase())) return false;
      if (dailyDutyFilter !== 'all') {
        const p = profileMap.get(s.expertId);
        const group = p ? p.duty_group : null;
        if (group !== dailyDutyFilter) return false;
      }
      return true;
    });

    if (filtered.length === 0) return toast.error('هیچ آماری برای خروجی یافت نشد.');

    const groups: Record<string, any[]> = {};
    filtered.forEach(s => {
      if (!groups[s.dateStr]) groups[s.dateStr] = [];
      groups[s.dateStr].push(s);
    });

    let dates = Object.keys(groups);
    dates.sort((a, b) => {
      if (statsSortOrder === 'newest') return a < b ? 1 : -1;
      return a > b ? 1 : -1;
    });

    const lines = [
      'گزارش کارکرد و آمار روزانه نوینتک',
      '--------------------------------',
      '',
      `فیلتر جستجو: ${statsSearchQuery || 'ندارد'}`,
      `فیلتر گروه: ${dailyDutyFilter === 'all' ? 'همه کارشناسان' : EXPERT_DUTY_LABELS[dailyDutyFilter] || 'بدون گروه'}`,
      '',
      '--------------------------------',
    ];

    dates.forEach(date => {
      const dayStats = groups[date];
      const totalDayCalls = dayStats.reduce((sum, item) => sum + item.workedCount, 0);
      dayStats.sort((a, b) => b.workedCount - a.workedCount);

      lines.push(`تاریخ: ${date}`);
      lines.push(`کارشناسان فعال: ${dayStats.length} | کل تماس‌ها: ${totalDayCalls}`);
      lines.push('');

      dayStats.forEach((exp, idx) => {
        const p = profileMap.get(exp.expertId);
        const dg = p ? p.duty_group : null;
        const gName = dg === 'early_week' ? 'اول هفته' : dg === 'late_week' ? 'آخر هفته' : 'بدون گروه';
        lines.push(`${idx + 1}. ${exp.expertName} - ${exp.workedCount} تماس - [${gName}] (${exp.minTimeStr} تا ${exp.maxTimeStr})`);
      });
      lines.push('');
      lines.push('--------------------------------');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dailyStats, statsSearchQuery, dailyDutyFilter, statsSortOrder, profileMap]);

  // ---------------------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------------------
  const pendingAgents = profiles.filter(p => p.role === 'agent' && p.account_status === 'pending');
  const activeAgents  = profiles.filter(p => p.role === 'agent' && p.account_status === 'active');
  const managers      = profiles.filter(p => p.role === 'admin'  && p.account_status === 'active');
  const unreviewedShares = receivedShares.filter(s => !s.reviewed_at);
  const onlineCount = presenceList.filter(p => p.status === 'online').length;

  const sortedRangeExperts = useMemo(() => {
    if (!rangeSummary) return [];
    const list = [...rangeSummary.expertsList];
    if (rangeSort === 'calls_asc') return list.sort((a, b) => a.count - b.count);
    if (rangeSort === 'name') return list.sort((a, b) => a.expertName.localeCompare(b.expertName));
    return list.sort((a, b) => b.count - a.count);
  }, [rangeSummary, rangeSort]);

  const formatTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '-';

  // ---------------------------------------------------------------------------
  // Apps Configuration (2D Flat Design Tiles)
  // ---------------------------------------------------------------------------
  const appModules = [
    {
      id: 'users' as AdminSubView,
      title: 'مدیریت کاربران',
      subtitle: 'کارشناسان، مدیران و درخواست‌ها',
      icon: Users,
      badge: pendingAgents.length > 0 ? pendingAgents.length : null,
      badgeColor: 'bg-amber-500',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-900',
      bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/30',
    },
    {
      id: 'presence' as AdminSubView,
      title: 'وضعیت آنلاین',
      subtitle: 'مشاهده فعالیت زنده کارشناسان',
      icon: Activity,
      badge: onlineCount > 0 ? onlineCount : null,
      badgeColor: 'bg-emerald-500',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    },
    {
      id: 'stats' as AdminSubView,
      title: 'گزارش کارکرد',
      subtitle: 'آمار تماس‌ها و عملکرد کارشناسان',
      icon: FileText,
      badge: dailyStats.length > 0 ? dailyStats.length : null,
      badgeColor: 'bg-indigo-500',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-900',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    },

    {
      id: 'security' as AdminSubView,
      title: 'امنیت و تنظیمات',
      subtitle: 'رمز عبور و تنظیمات دسترسی',
      icon: Lock,
      badge: null,
      badgeColor: 'bg-slate-500',
      iconColor: 'text-slate-700 dark:text-slate-300',
      borderColor: 'border-slate-300 dark:border-slate-700',
      bgColor: 'bg-slate-100/60 dark:bg-slate-800/60',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAFAFA] dark:bg-slate-900 text-slate-800 select-none overflow-x-hidden" dir="rtl">

      {/* ── 2D Flat Header ────────────────────────────────────────── */}
      <header className="w-full shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center justify-between w-full h-16 px-4 lg:px-8 max-w-7xl mx-auto">

          {/* Right Section (Visual Right in RTL): User Profile, Actions & Back Button */}
          <div className="flex items-center gap-3">

            {/* Admin Profile Info */}
            <div className="hidden md:flex flex-col items-start border-l border-slate-200 dark:border-slate-800 pl-3 ml-1 text-right">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{supabaseProfile?.full_name}</span>
              {supabaseProfile?.duty_group && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{DUTY_LABELS[supabaseProfile.duty_group] || supabaseProfile.duty_group}</span>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshAll}
              title="بروزرسانی اطلاعات"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw size={15} className={loadingProfiles || presenceLoading || statsLoading ? 'animate-spin text-indigo-600' : ''} />
            </button>

            {/* Logout Button */}
            <button
              onClick={signOut}
              title="خروج از حساب"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-900"
            >
              <LogOut size={15} />
            </button>

            {/* Back Button (Right-aligned next to controls) */}
            {(activeSubView !== null || (currentView && currentView !== 'home' && currentView !== 'calls')) && (
              <button
                onClick={handleBackNavigation}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-extrabold transition-colors active:bg-slate-200 group mr-2"
                title="بازگشت (Esc / Alt + ⬅)"
              >
                <ArrowRight size={16} strokeWidth={2.2} className="text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span>بازگشت</span>
              </button>
            )}

          </div>

          {/* Left Section (Visual Left in RTL): Logo & Page Title / Breadcrumb */}
          <div className="flex items-center gap-3">
            {activeSubView && (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                {appModules.find(m => m.id === activeSubView)?.title || (activeSubView === 'followups' ? 'لیست‌های پیگیری' : '')}
              </span>
            )}
            {activeSubView && <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>}
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              پنل مدیریت نوین‌تک
            </span>
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5">
              <img src={NTLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col">

        <AnimatePresence mode="wait">

          {/* ═════════════════════════════════════════════════════════ */}
          {/* 1. DASHBOARD HUB                                          */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === null && (
            <motion.div
              key="launchpad-hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex flex-col gap-6 w-full py-2"
            >
              {/* Dashboard Header */}
              <div className="flex flex-col gap-1 mb-2 mt-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  صبح بخیر، <span className="text-indigo-600 dark:text-indigo-400">{supabaseProfile?.full_name}</span> 👋
                </h1>
                <p className="text-slate-500 text-xs font-bold">
                  نمای کلی وضعیت و دسترسی سریع به بخش‌های مدیریتی
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <button
                  onClick={() => { setUserTab('managers'); setActiveSubView('users'); }}
                  className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-[20px] border border-indigo-100 dark:border-indigo-900/50 p-5 flex flex-col items-start gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-1 hover:shadow-sm text-right w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Shield size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-indigo-700 dark:text-indigo-300 leading-none mb-1.5">{managers.length}</span>
                    <span className="text-xs font-bold text-indigo-600/80 dark:text-indigo-400/80">مدیران فعال</span>
                  </div>
                </button>

                <button
                  onClick={() => { setUserTab('agents'); setActiveSubView('users'); }}
                  className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[20px] border border-emerald-100 dark:border-emerald-900/50 p-5 flex flex-col items-start gap-4 transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-1 hover:shadow-sm text-right w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300 leading-none mb-1.5">{activeAgents.length}</span>
                    <span className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/80">کارشناسان فعال</span>
                  </div>
                </button>

                <button
                  onClick={() => { setUserTab('pending'); setActiveSubView('users'); }}
                  className="bg-amber-50/50 dark:bg-amber-950/20 rounded-[20px] border border-amber-100 dark:border-amber-900/50 p-5 flex flex-col items-start gap-4 transition-all hover:border-amber-300 dark:hover:border-amber-700 hover:-translate-y-1 hover:shadow-sm text-right w-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-amber-700 dark:text-amber-300 leading-none mb-1.5">{pendingAgents.length}</span>
                    <span className="text-xs font-bold text-amber-600/80 dark:text-amber-400/80">درخواست جدید</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubView('followups')}
                  className="bg-violet-50/50 dark:bg-violet-950/20 rounded-[20px] border border-violet-100 dark:border-violet-900/50 p-5 flex flex-col items-start gap-4 transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:-translate-y-1 hover:shadow-sm text-right w-full focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100/80 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <Inbox size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-violet-700 dark:text-violet-300 leading-none mb-1.5">{receivedShares.length}</span>
                    <span className="text-xs font-bold text-violet-600/80 dark:text-violet-400/80">پیگیری دریافتی</span>
                  </div>
                </button>
              </div>

              {/* Action Cards Grid */}
              <div className="w-full mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full">
                  {appModules.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <button
                        key={app.id}
                        onClick={() => setActiveSubView(app.id)}
                        className="group flex items-start gap-4 p-5 rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 text-right w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                      >
                        <div className="relative w-12 h-12 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 flex items-center justify-center shrink-0 transition-colors">
                          <AppIcon size={22} strokeWidth={2} className="text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />

                          {app.badge !== null && app.badge > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black min-w-[20px] h-[20px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                              {app.badge}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 pt-0.5">
                          <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {app.title}
                          </span>
                          <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {app.subtitle}
                          </span>
                        </div>

                        <div className="shrink-0 pt-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                           <ArrowLeft size={16} className="text-indigo-400 dark:text-indigo-500" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Info Strip */}
              <div className="w-full mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                <Sparkles size={12} className="text-indigo-400 dark:text-indigo-500" />
                <span>پنل مدیریت قابل توسعه است. بخش‌های جدید در آینده بدون تغییر ساختار اصلی اضافه خواهند شد.</span>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md text-[9px] mr-1">v2.0</span>
              </div>

            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* 2. SUB-VIEW: USER MANAGEMENT                               */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === 'users' && (
            <motion.div
              key="view-users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 w-full"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">مدیریت کاربران و دسترسی‌ها</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">بررسی درخواست‌های جدید، کارشناسان و مدیران سیستم</p>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setUserTab('pending')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${userTab === 'pending' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    <Clock size={14} /> درخواست‌ها ({pendingAgents.length})
                  </button>
                  <button
                    onClick={() => setUserTab('agents')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${userTab === 'agents' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    <Users size={14} /> کارشناسان ({activeAgents.length})
                  </button>
                  <button
                    onClick={() => setUserTab('managers')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${userTab === 'managers' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                  >
                    <Shield size={14} /> مدیران ({managers.length})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 min-h-[400px]">

                {/* 1. Pending Agents */}
                {userTab === 'pending' && (
                  <div className="flex flex-col gap-4">
                    {pendingAgents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">هیچ درخواست عضویتی در انتظار نیست</p>
                        <p className="text-xs text-slate-400 mt-1">تمام ثبت‌نام‌ها تعیین تکلیف شده‌اند.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingAgents.map((p) => (
                          <div key={p.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-sm text-slate-900 dark:text-white">{p.full_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" dir="ltr">{p.email}</p>
                              </div>
                              <StatusBadge status={p.account_status} />
                            </div>
                            <div className="flex gap-2">
                              <button
                                disabled={actionId === p.id}
                                onClick={() => handleApprove(p)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-emerald-700"
                              >
                                تأیید حساب
                              </button>
                              <button
                                disabled={actionId === p.id}
                                onClick={() => handleDisable(p)}
                                className="flex-1 bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                              >
                                رد درخواست
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Active Agents */}
                {userTab === 'agents' && (
                  <div className="flex flex-col gap-4">
                    {activeAgents.length === 0 ? (
                      <div className="py-16 text-center text-xs font-bold text-slate-400">هیچ کارشناس فعالی وجود ندارد.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeAgents.map((p) => (
                          <div key={p.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                              <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{p.full_name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr">{p.email}</p>
                            </div>
                            {p.id !== supabaseProfile?.id && (
                              <button
                                disabled={actionId === p.id}
                                onClick={() => handleDisable(p)}
                                className="shrink-0 bg-white dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                              >
                                غیرفعال‌سازی
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Managers */}
                {userTab === 'managers' && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {managers.map((p) => (
                        <div key={p.id} className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 p-4 flex items-center justify-between gap-4">
                          <div className="flex flex-col min-w-0">
                            <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                              {p.full_name} {p.id === supabaseProfile?.id && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md mr-1">شما</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr">{p.email}</p>
                          </div>
                          {p.duty_group && (
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-bold shrink-0 border border-indigo-200 dark:border-indigo-800">
                              {DUTY_LABELS[p.duty_group] || p.duty_group}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* 3. SUB-VIEW: LIVE PRESENCE                                 */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === 'presence' && (
            <motion.div
              key="view-presence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">وضعیت لحظه‌ای کارشناسان</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">بررسی وضعیت آنلاین بودن، بیکاری و آخرین فعالیت کارشناسان</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">بروزرسانی خودکار هر ۳۰ ثانیه</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 min-h-[400px]">
                {presenceLoading && presenceList.length === 0 ? (
                  <div className="py-16 flex justify-center"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
                ) : presenceError && presenceList.length === 0 ? (
                  <p className="text-xs text-rose-500 text-center font-bold py-16">خطا در دریافت وضعیت حضور کارشناسان</p>
                ) : presenceList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-16 font-bold">هیچ کارشناسی در حال حاضر ثبت حضور نکرده است.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...presenceList].sort((a,b) => (a.status==='online'?0:a.status==='idle'?1:2) - (b.status==='online'?0:b.status==='idle'?1:2)).map((p) => (
                      <div
                        key={p.expert_id}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          p.status === 'online'
                            ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900'
                            : p.status === 'idle'
                            ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900'
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${p.status === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : p.status === 'idle' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              <User size={22} strokeWidth={2.2} />
                            </div>
                            {p.status === 'online' && (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{p.full_name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-bold" dir="ltr">
                              <span>ورود: {formatTime(p.login_time)}</span>
                              <span>-</span>
                              <span>آخرین: {formatTime(p.last_activity_time)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1.5">
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${p.status === 'online' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : p.status === 'idle' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {p.status === 'online' ? 'آنلاین' : p.status === 'idle' ? 'بیکار' : 'آفلاین'}
                          </span>
                          {p.has_active_alert && <AlertCircle size={15} className="text-rose-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* 4. SUB-VIEW: DAILY WORKED STATS                           */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === 'stats' && (
            <motion.div
              key="view-stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 w-full"
            >
              {/* ═════════════════════════════════════════════════════════ */}
              {/* RANGE SUMMARY UI                                          */}
              {/* ═════════════════════════════════════════════════════════ */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
                    <Search size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">گزارش بازه‌ای تماس‌ها</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">محاسبه مجموع تماس کارشناسان در یک بازه زمانی خاص</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-end gap-4 mb-4">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-32">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">از تاریخ</label>
                      <input type="text" value={rangeFromDate} onChange={e => setRangeFromDate(e.target.value)} placeholder="1405/01/01" className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500" dir="ltr" />
                    </div>
                    <div className="flex-1 md:w-32">
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">تا تاریخ</label>
                      <input type="text" value={rangeToDate} onChange={e => setRangeToDate(e.target.value)} placeholder="1405/12/29" className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500" dir="ltr" />
                    </div>
                  </div>

                  <div className="w-full md:w-64">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">گروه کارشناسان</label>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full h-10 items-center">
                      {(['all', 'early_week', 'late_week'] as const).map(g => (
                        <button
                          key={g}
                          onClick={() => setRangeDutyFilter(g)}
                          className={`flex-1 h-8 text-[11px] font-bold rounded-lg transition-all ${
                            rangeDutyFilter === g
                              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {g === 'all' ? 'همه' : EXPERT_DUTY_LABELS[g]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 md:mt-0 flex-1 flex justify-end gap-2">
                    <button onClick={handleCalculateRange} className="w-full md:w-auto h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center transition-colors shadow-sm shadow-indigo-600/20">
                      محاسبه جمع تماس‌ها
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
                  <button onClick={() => setQuickPreset('7days')} className="px-3 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-colors">۷ روز اخیر</button>
                  <button onClick={() => setQuickPreset('1month')} className="px-3 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold transition-colors">یک ماه اخیر</button>
                  <button onClick={() => setQuickPreset('startOfMonth')} className="px-3 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-colors">از ابتدای ماه</button>
                </div>

                {rangeError && (
                  <div className="mt-3 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} />
                    {rangeError}
                  </div>
                )}

                {rangeSummary && (
                  <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block"></span>
                        گزارش تماس‌ها از <span dir="ltr" className="text-indigo-600 dark:text-indigo-400">{rangeFromDate}</span> تا <span dir="ltr" className="text-indigo-600 dark:text-indigo-400">{rangeToDate}</span>
                        {rangeDutyFilter !== 'all' && (
                          <span className="mr-3 text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">گروه: {rangeSummary.filterLabel}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={handleExportRangeTxt} className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700">
                          <Download size={14} />
                          خروجی TXT
                        </button>
                      </div>
                    </h3>

                    {rangeDutyFilter === 'all' && (
                      <div className="flex gap-4 mb-6">
                        <button onClick={() => setRangeDutyFilter('early_week')} className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex justify-between items-center transition-colors text-right cursor-pointer group">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400">اول هفته</span>
                          <span className="text-lg font-black text-blue-700 dark:text-blue-300 group-hover:scale-110 transition-transform">{rangeSummary.earlyWeekCalls.toLocaleString()} تماس</span>
                        </button>
                        <button onClick={() => setRangeDutyFilter('late_week')} className="flex-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex justify-between items-center transition-colors text-right cursor-pointer group">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-400">آخر هفته</span>
                          <span className="text-lg font-black text-purple-700 dark:text-purple-300 group-hover:scale-110 transition-transform">{rangeSummary.lateWeekCalls.toLocaleString()} تماس</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">کل تماس‌ها</span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{rangeSummary.totalCalls.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">کارشناسان فعال</span>
                        <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{rangeSummary.activeExperts}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">روزهای فعال</span>
                        <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{rangeSummary.activeDays}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">میانگین هر شخص</span>
                        <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{rangeSummary.avgCalls.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 mt-8">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">آمار کارشناسان</h4>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">مرتب‌سازی:</label>
                        <select
                          value={rangeSort}
                          onChange={(e) => setRangeSort(e.target.value as any)}
                          className="h-8 px-2 pr-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        >
                          <option value="calls_desc">بیشترین تماس</option>
                          <option value="calls_asc">کمترین تماس</option>
                          <option value="name">نام کارشناس</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">کارشناس</th>
                            <th className="p-3 text-center w-24">گروه کاری</th>
                            <th className="p-3 text-left">تعداد تماس</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {sortedRangeExperts.map((exp: any, idx: number) => (
                            <tr key={exp.expertName} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                              <td className="p-3 text-center text-slate-400 dark:text-slate-500 font-bold">{idx + 1}</td>
                              <td className="p-3 font-extrabold text-slate-700 dark:text-slate-300">{exp.expertName}</td>
                              <td className="p-3 text-center"><DutyBadge group={exp.duty_group} /></td>
                              <td className="p-3 text-left font-black text-indigo-600 dark:text-indigo-400">{exp.count.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* ═════════════════════════════════════════════════════════ */}
              {/* DAILY REPORTS UI                                          */}
              {/* ═════════════════════════════════════════════════════════ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">گزارش کارکرد و آمار روزانه</h2>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 hidden sm:inline-block">بروزرسانی خودکار هر ۶۰ ثانیه</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {dailyStats.length > 0 ? (
                        <>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{new Set(dailyStats.map(s => s.dateStr)).size}</span> روز فعالیت • <span className="font-bold text-slate-700 dark:text-slate-300">{dailyStats.length}</span> گزارش کارشناسی
                        </>
                      ) : (
                        'مشاهده خلاصه کارکرد کارشناسان در تاریخ‌های مختلف'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={exportAllStatsToExcel} className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                    <Download size={14}/> خروجی اکسل
                  </button>
                  <button onClick={handleExportDailyTxt} className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                    <Download size={14}/> خروجی TXT
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={statsSearchQuery}
                    onChange={(e) => setStatsSearchQuery(e.target.value)}
                    placeholder="جستجوی نام کارشناس..."
                    className="w-full h-11 pr-9 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                  {statsSearchQuery && (
                    <button onClick={() => setStatsSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-48 relative">
                  <select
                    value={dailyDutyFilter}
                    onChange={(e) => setDailyDutyFilter(e.target.value as any)}
                    className="w-full h-11 px-3 pl-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 appearance-none transition-colors cursor-pointer"
                  >
                    <option value="all">همه گروه‌ها</option>
                    <option value="early_week">اول هفته</option>
                    <option value="late_week">آخر هفته</option>
                  </select>
                </div>
                <div className="w-full sm:w-48 relative">
                  <select
                    value={statsSortOrder}
                    onChange={(e) => setStatsSortOrder(e.target.value as any)}
                    className="w-full h-11 px-3 pl-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 appearance-none transition-colors cursor-pointer"
                  >
                    <option value="newest">جدیدترین تاریخ</option>
                    <option value="oldest">قدیمی‌ترین تاریخ</option>
                  </select>
                </div>
              </div>

              {/* Data View */}
              <div className="min-h-[400px]">
                {statsLoading && dailyStats.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 py-16 flex justify-center"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
                ) : statsError && dailyStats.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 py-16 flex justify-center text-xs text-rose-500 font-bold">خطا در دریافت آمارهای روزانه</div>
                ) : dailyStats.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 py-16 flex justify-center text-xs text-slate-400 font-bold">هیچ فعالیت یا تماسی ثبت نشده است.</div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {(() => {
                      const filtered = dailyStats.filter(s => {
                        if (statsSearchQuery && !s.expertName?.toLowerCase().includes(statsSearchQuery.toLowerCase())) return false;
                        if (dailyDutyFilter !== 'all') {
                          const p = profileMap.get(s.expertId);
                          const group = p ? p.duty_group : null;
                          if (group !== dailyDutyFilter) return false;
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 py-16 flex justify-center text-xs text-slate-400 font-bold">گزارشی با این نام یافت نشد.</div>
                      }

                      const groups: Record<string, any[]> = {};
                      filtered.forEach(s => {
                        if (!groups[s.dateStr]) groups[s.dateStr] = [];
                        groups[s.dateStr].push(s);
                      });

                      let dates = Object.keys(groups);
                      dates.sort((a, b) => {
                        if (statsSortOrder === 'newest') return a < b ? 1 : -1;
                        return a > b ? 1 : -1;
                      });

                      return dates.map(date => {
                        const dayStats = groups[date];
                        const totalDayCalls = dayStats.reduce((sum, item) => sum + item.workedCount, 0);
                        dayStats.sort((a, b) => b.workedCount - a.workedCount);

                        return (
                          <div key={date} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            {/* Date Header */}
                            <div className="bg-slate-50/70 dark:bg-slate-900/70 px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[15px] text-slate-900 dark:text-white" dir="ltr">{date}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">{dayStats.length} کارشناس فعال</span>
                                <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/60">{totalDayCalls.toLocaleString()} تماس کل</span>
                              </div>
                            </div>

                            {/* Experts Rows */}
                            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
                              {dayStats.map((exp, idx) => (
                                <div key={exp.expertId} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500">{idx + 1}</span>
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{exp.expertName}</span>
                                    <DutyBadge group={profileMap.get(exp.expertId)?.duty_group} />
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-left">
                                    <span className="text-[10px] text-slate-400 font-bold group-hover:text-slate-500 transition-colors hidden sm:block" dir="ltr">{exp.minTimeStr} - {exp.maxTimeStr}</span>
                                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/60 min-w-[70px] justify-center">
                                      <span className="font-black text-[15px] leading-none">{exp.workedCount}</span>
                                      <span className="text-[10px] font-bold leading-none">تماس</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* 5. SUB-VIEW: RECEIVED FOLLOWUPS                           */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === 'followups' && (
            <motion.div
              key="view-followups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 border border-purple-100 dark:border-purple-900 flex items-center justify-center shrink-0">
                    <Inbox size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">لیست‌های پیگیری دریافتی</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مشاهده و بررسی لیست‌های پیگیری ارسال شده توسط کارشناسان</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 min-h-[400px]">
                {sharesLoading ? (
                  <div className="py-16 flex justify-center"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
                ) : receivedShares.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-16 font-bold">هیچ لیست پیگیری دریافتی وجود ندارد.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {receivedShares.map((s) => {
                      const sName = Array.isArray(s.sender) ? s.sender[0]?.full_name : s.sender?.full_name;
                      return (
                        <div key={s.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-extrabold text-sm text-slate-900 dark:text-white">ارسال‌کننده: {sName || 'کارشناس'}</p>
                              <p className="text-xs text-slate-400 mt-1" dir="ltr">{new Date(s.sent_at).toLocaleString('fa-IR')}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${s.reviewed_at ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                              {s.reviewed_at ? 'بررسی شده' : 'بررسی نشده'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-500">تعداد موارد: {s.item_count}</span>
                            <button
                              onClick={() => setViewingShare({ ...s, senderName: sName })}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors border border-indigo-700"
                            >
                              مشاهده کامل ({s.item_count})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* 7. SUB-VIEW: SECURITY                                      */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === 'security' && (
            <motion.div
              key="view-security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 w-full max-w-xl mx-auto"
            >
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                  <Lock size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">امنیت و تغییر رمز عبور</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">بروزرسانی رمز عبور حساب مدیریتی</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">رمز عبور فعلی:</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">رمز عبور جدید (حداقل ۸ کاراکتر):</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">تکرار رمز عبور جدید:</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="h-11 w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-700 mt-2"
                >
                  {isChangingPassword ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />} تغییر رمز عبور
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* ── 2D Flat Modals ────────────────────────────────────────── */}

      {/* 1. Viewing Share Modal */}
      {viewingShare && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4" onClick={() => !isReviewing && setViewingShare(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 w-full max-w-[95vw] flex flex-col overflow-hidden max-h-[90vh]" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center"><FileText size={20} /></div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">گزارش پیگیری - {viewingShare.senderName}</h3>
                  <span className="text-xs font-bold text-slate-400" dir="ltr">{new Date(viewingShare.sent_at).toLocaleString('fa-IR')}</span>
                </div>
              </div>
              <button disabled={isReviewing} onClick={() => setViewingShare(null)} className="w-9 h-9 flex justify-center items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-extrabold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    <tr>
                      <th className="p-3">نام</th>
                      <th className="p-3">شماره تماس</th>
                      <th className="p-3">وضعیت تماس</th>
                      <th className="p-3">وضعیت ثبت‌نام</th>
                      <th className="p-3">دوره‌ها</th>
                      <th className="p-3">مشاوره حضوری</th>
                      <th className="p-3">تاریخ و ساعت مشاوره</th>
                      <th className="p-3">پیگیری بعدی</th>
                      <th className="p-3">یادداشت‌ها</th>
                      <th className="p-3">آخرین تلاش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-300">
                    {Array.isArray(viewingShare.payload_json) ? viewingShare.payload_json.map((item: any, idx: number) => {
                      const cDate = item.advisoryDate ? new Date(item.advisoryDate).toLocaleDateString('fa-IR') : '';
                      const advisoryStr = cDate && item.advisoryTime ? `${cDate} - ${item.advisoryTime}` : cDate || item.advisoryTime || '—';
                      const fDate = item.nextFollowUpAt ? new Date(item.nextFollowUpAt).toLocaleDateString('fa-IR') : '';
                      const followUpStr = fDate ? `${fDate} - ${new Date(item.nextFollowUpAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}` : '—';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 font-extrabold whitespace-nowrap text-slate-900 dark:text-white">{item.fullName || '—'}</td>
                          <td className="p-3 whitespace-nowrap text-xs font-extrabold tracking-widest text-slate-800 dark:text-slate-200" dir="ltr">{formatPhoneNumber(item.phone || '') || '—'}</td>
                          <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-600">{item.callStatus || '—'}</span></td>
                          <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-600">{item.registered || '—'}</span></td>
                          <td className="p-3 min-w-[140px]">{item.courses && item.courses.length > 0 ? <div className="flex flex-wrap gap-1">{item.courses.map((c:string, i:number) => <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">{c}</span>)}</div> : '—'}</td>
                          <td className="p-3 whitespace-nowrap">{item.advisory === 'بله' ? <CheckCircle2 size={16} className="text-emerald-500"/> : '—'}</td>
                          <td className="p-3 whitespace-nowrap" dir="ltr">{advisoryStr}</td>
                          <td className="p-3 whitespace-nowrap" dir="ltr">{followUpStr}</td>
                          <td className="p-3 min-w-[180px] leading-relaxed text-xs">{item.notes || '—'}</td>
                          <td className="p-3 whitespace-nowrap text-[10px] font-bold text-slate-400" dir="ltr">{item.latestAttemptAt ? new Date(item.latestAttemptAt).toLocaleString('fa-IR') : '—'}</td>
                        </tr>
                      )
                    }) : <tr><td colSpan={10} className="text-center p-6 text-sm font-bold text-slate-400">داده نامعتبر است</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex gap-3">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">مجموع: {viewingShare.item_count} مورد</span>
                <button
                  disabled={isReviewing}
                  onClick={() => {
                    const worksheetData = Array.isArray(viewingShare.payload_json) ? viewingShare.payload_json.map((item: any) => ({
                      'نام': item.fullName || '—',
                      'شماره تماس': item.phone || '—',
                      'وضعیت تماس': item.callStatus || '—',
                      'وضعیت ثبت‌نام': item.registered || '—',
                      'دوره‌ها': item.courses ? item.courses.join('، ') : '—',
                      'مشاوره حضوری': item.advisory === 'بله' ? 'دارد' : 'ندارد',
                      'تاریخ و ساعت مشاوره': (item.advisoryDate || '') + ' ' + (item.advisoryTime || ''),
                      'پیگیری بعدی': item.nextFollowUpAt ? new Date(item.nextFollowUpAt).toLocaleString('fa-IR') : '—',
                      'یادداشت‌ها': item.notes || '—',
                      'آخرین تلاش': item.latestAttemptAt ? new Date(item.latestAttemptAt).toLocaleString('fa-IR') : '—'
                    })) : [];
                    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                    worksheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 20 }];
                    worksheet['!dir'] = 'rtl';
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'لیست پیگیری');
                    XLSX.writeFile(workbook, `followups-${viewingShare.senderName}-${new Date(viewingShare.sent_at).toISOString().split('T')[0]}.xlsx`);
                  }}
                  className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  <Download size={14}/> دانلود اکسل
                </button>
                <button disabled={isReviewing} onClick={() => handleDeleteShare(viewingShare.id)} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"><Trash2 size={14}/> حذف لیست</button>
              </div>

              {!viewingShare.reviewed_at ? (
                <button disabled={isReviewing} onClick={() => handleReviewShare(viewingShare.id)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white px-6 py-2.5 rounded-xl text-xs font-bold border border-indigo-700 transition-colors">
                  {isReviewing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} تایید و ثبت بررسی
                </button>
              ) : (
                <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-6 py-2.5 rounded-xl text-xs font-bold"><CheckCircle2 size={16}/> لیست بررسی شده است</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Viewing Daily Stats Detailed Modal */}


    </div>
  );
};

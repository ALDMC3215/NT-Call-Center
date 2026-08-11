/**
 * ManagerDashboard — RTL 2D Flat Design Launchpad & Management Center for active admins
 */

import React, { useCallback, useEffect, useState } from 'react';
import NTLogo from '../../NT Logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../hooks/useAppContext';
import { supabase } from '../../lib/supabase';
import { SupabaseProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, Clock, CheckCircle2, Ban, LogOut,
  RefreshCw, AlertCircle, Activity, Inbox, Download, FileText, X, MessageSquare, Send, Lock, Trash2, Award, User,
  ArrowRight, Sparkles, Plus, Grid, ChevronLeft, Search
} from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import * as XLSX from 'xlsx';
import { toJalali } from '../../utils/jalali';
import { formatPhoneNumber } from '../../utils/format';

const DUTY_LABELS: Record<string, string> = {
  early_week: 'مدیر اول هفته',
  late_week:  'مدیر آخر هفته',
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

export type AdminSubView = null | 'users' | 'presence' | 'stats' | 'followups' | 'messages' | 'security';

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
  const unreadMessages: any[] = [];

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
  const [viewingDailyStats, setViewingDailyStats] = useState<any>(null);
  const [dailyStatsDetails, setDailyStatsDetails] = useState<any[]>([]);
  const [loadingDailyStatsDetails, setLoadingDailyStatsDetails] = useState(false);
  const [dailyScore, setDailyScore] = useState<number | ''>('');
  const [isScoring, setIsScoring] = useState(false);
  const [isDeletingDaily, setIsDeletingDaily] = useState(false);

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

  const loadDailyStatsDetails = useCallback(async (stat: any) => {
    setLoadingDailyStatsDetails(true);
    setDailyScore('');

    const { data: callsData, error: callsError } = await supabase.from('call_attempts')
      .select('*')
      .eq('expert_id', stat.expertId)
      .like('jalali_date_time', `${stat.dateStr}%`)
      .order('created_at', { ascending: false });

    if (!callsError && callsData) {
      setDailyStatsDetails(callsData);
    } else {
      setDailyStatsDetails([]);
      toast.error('خطا در دریافت جزئیات.');
    }

    const { data: scoreData, error: scoreError } = await supabase.rpc('get_expert_daily_score', {
      p_expert_id: stat.expertId,
      p_jalali_date: stat.dateStr
    });

    if (!scoreError && scoreData && scoreData.length > 0) {
      setDailyScore(scoreData[0].score);
    }

    setLoadingDailyStatsDetails(false);
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
    if (viewingDailyStats) {
      setViewingDailyStats(null);
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
  }, [viewingShare, viewingDailyStats, activeSubView, isReviewing, currentView, setCurrentView]);

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

  const handleSaveDailyScore = async () => {
    if (!viewingDailyStats) return;
    if (dailyScore === '' || Number(dailyScore) < 0 || Number(dailyScore) > 100) return toast.error('امتیاز باید بین ۰ تا ۱۰۰ باشد.');

    setIsScoring(true);
    const { error } = await supabase.rpc('set_expert_daily_score', {
      p_expert_id: viewingDailyStats.expertId,
      p_jalali_date: viewingDailyStats.dateStr,
      p_score: Number(dailyScore)
    });
    setIsScoring(false);

    if (error) toast.error('خطا در ثبت امتیاز.');
    else toast.success('امتیاز ثبت شد.');
  };

  const handleDeleteDailyStats = async () => {
    if (!viewingDailyStats || !viewingDailyStats.attemptIds) return;
    if (!confirm(`آیا از حذف تمام گزارش کارهای ${viewingDailyStats.expertName} در تاریخ ${viewingDailyStats.dateStr} مطمئن هستید؟ این عمل غیرقابل بازگشت است!`)) return;

    setIsDeletingDaily(true);
    const { data, error } = await supabase.rpc('delete_call_attempts_by_ids', {
      p_ids: viewingDailyStats.attemptIds
    });

    setIsDeletingDaily(false);

    if (error) {
      console.error('Error deleting records:', error);
      toast.error('خطا در حذف داده‌ها.');
    } else {
      toast.success(`${data || 0} رکورد با موفقیت حذف شد.`);
      setViewingDailyStats(null);
      fetchStats();
    }
  };

  const exportDailyStatsToExcel = () => {
    if (!viewingDailyStats || dailyStatsDetails.length === 0) return toast.error('داده‌ای برای خروجی وجود ندارد.');
    const worksheetData = dailyStatsDetails.map(item => ({
      'نام و نام خانوادگی': item.full_name || '—',
      'زمان تماس': item.jalali_date_time ? item.jalali_date_time.split(' ')[1] : '—',
      'وضعیت تماس': item.call_status || '—',
      'وضعیت ثبت‌نام': item.registered || '—',
      'دوره‌ها': item.courses ? item.courses.join('، ') : '—',
      'مشاوره حضوری': item.advisory === 'بله' ? 'دارد' : 'ندارد',
      'تاریخ مشاوره': item.advisory_date || '—',
      'ساعت مشاوره': item.advisory_time || '—',
      'یادداشت‌ها': item.notes || '—',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
    ];
    worksheet['!dir'] = 'rtl';

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش روزانه');

    const fileName = `گزارش_${viewingDailyStats.expertName.replace(/\s+/g, '_')}_${viewingDailyStats.dateStr.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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

  // ---------------------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------------------
  const pendingAgents = profiles.filter(p => p.role === 'agent' && p.account_status === 'pending');
  const activeAgents  = profiles.filter(p => p.role === 'agent' && p.account_status === 'active');
  const managers      = profiles.filter(p => p.role === 'admin'  && p.account_status === 'active');
  const unreviewedShares = receivedShares.filter(s => !s.reviewed_at);
  const onlineCount = presenceList.filter(p => p.status === 'online').length;

  const formatTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '-';

  // ---------------------------------------------------------------------------
  // Apps Configuration (2D Flat Design Tiles)
  // ---------------------------------------------------------------------------
  const appModules = [
    {
      id: 'users' as AdminSubView,
      title: 'مدیریت کاربران',
      subtitle: 'درخواست‌ها، کارشناسان و مدیران',
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
      subtitle: 'رصد فعالیت زنده کارشناسان',
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
      subtitle: 'شماره‌های روزانه، نمره‌دهی و اکسل',
      icon: FileText,
      badge: dailyStats.length > 0 ? dailyStats.length : null,
      badgeColor: 'bg-indigo-500',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-900',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    },
    {
      id: 'followups' as AdminSubView,
      title: 'لیست‌های پیگیری',
      subtitle: 'ارسال‌های دریافتی از کارشناسان',
      icon: Inbox,
      badge: unreviewedShares.length > 0 ? unreviewedShares.length : null,
      badgeColor: 'bg-rose-500',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-900',
      bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    },
    {
      id: 'messages' as AdminSubView,
      title: 'ارسال پیام',
      subtitle: 'ارتباط مستقیم و دستورات مدیریتی',
      icon: MessageSquare,
      badge: unreadMessages.length > 0 ? unreadMessages.length : null,
      badgeColor: 'bg-rose-500',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-900',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/30',
    },
    {
      id: 'security' as AdminSubView,
      title: 'امنیت و تنظیمات',
      subtitle: 'تغییر رمز عبور و دسترسی‌ها',
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
                {appModules.find(m => m.id === activeSubView)?.title}
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
          {/* 1. LAUNCHPAD HUB (2D FLAT DASHBOARD VIEW)                  */}
          {/* ═════════════════════════════════════════════════════════ */}
          {activeSubView === null && (
            <motion.div
              key="launchpad-hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="flex flex-col gap-8 w-full py-4"
            >
              {/* Command Center Title & KPI Bar */}
              <div className="flex flex-col items-center text-center justify-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-900 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                  <Shield size={13} /> Command Center
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  خوش آمدید، <span className="text-indigo-600 dark:text-indigo-400">{supabaseProfile?.full_name}</span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm max-w-lg font-medium">
                  مرکز کنترل و مدیریت سیستم نوین‌تک. از طریق آیکون‌های زیر وارد بخش مورد نظر شوید.
                </p>
              </div>

              {/* 2D Flat KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 max-w-5xl mx-auto w-full">
                {[
                  { label: 'مدیران فعال', count: managers.length, color: 'indigo', icon: <Shield size={16} /> },
                  { label: 'کارشناسان فعال', count: activeAgents.length, color: 'emerald', icon: <Users size={16} /> },
                  { label: 'درخواست جدید', count: pendingAgents.length, color: 'amber', icon: <Clock size={16} /> },
                  { label: 'پیگیری دریافتی', count: receivedShares.length, color: 'purple', icon: <Inbox size={16} /> },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-${s.color}-50 text-${s.color}-600 dark:bg-${s.color}-950/40 dark:text-${s.color}-400 flex items-center justify-center shrink-0 border border-${s.color}-100 dark:border-${s.color}-900`}>
                        {s.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">{s.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* macOS Style Modular 2D Flat App Grid */}
              <div className="w-full mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 max-w-5xl mx-auto">
                  {appModules.map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <button
                        key={app.id}
                        onClick={() => setActiveSubView(app.id)}
                        className="group flex flex-col items-center gap-3 outline-none text-right transition-all duration-150"
                      >
                        <div className={`relative w-[84px] h-[84px] sm:w-[100px] sm:h-[100px] rounded-[1.6rem] sm:rounded-[2rem] bg-white dark:bg-slate-800 border ${app.borderColor} group-hover:border-indigo-500 dark:group-hover:border-indigo-500 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/90 flex items-center justify-center transition-all duration-150 overflow-hidden`}>
                          <AppIcon size={40} strokeWidth={1.6} className={`${app.iconColor} transition-transform duration-150 group-hover:scale-105`} />

                          {app.badge !== null && app.badge > 0 && (
                            <div className={`absolute -top-1 -right-1 ${app.badgeColor} text-white text-[11px] font-black px-2 min-w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900`}>
                              {app.badge}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-center text-center">
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                            {app.title}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {app.subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2D Flat Expansion Card */}
              <div className="w-full max-w-5xl mx-auto mt-6 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-right">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200">گسترش‌پذیری آسان پنل مدیریت</h3>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">بخش‌های جدید مدیریتی در آینده به راحتی به این شبکه اضافه خواهند شد.</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  نسخه ۲.۰ پنل مدیریت (2D Flat)
                </span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">گزارش کارکرد و آمار روزانه</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مشاهده جزئیات تماس‌های روزانه، ثبت امتیاز مدیریت و خروجی اکسل</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline-block">بروزرسانی خودکار هر ۶۰ ثانیه</span>
                  <button onClick={exportAllStatsToExcel} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                    <Download size={14}/> خروجی کل آمار (اکسل)
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 min-h-[400px]">
                {statsLoading && dailyStats.length === 0 ? (
                  <div className="py-16 flex justify-center"><RefreshCw size={24} className="animate-spin text-slate-400" /></div>
                ) : statsError && dailyStats.length === 0 ? (
                  <p className="text-xs text-rose-500 text-center font-bold py-16">خطا در دریافت آمارهای روزانه</p>
                ) : dailyStats.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-16 font-bold">هیچ فعالیت یا تماسی برای امروز ثبت نشده است.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dailyStats.map((row) => (
                      <div key={`${row.expertId}_${row.dateStr}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 flex flex-col gap-3 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{row.expertName}</span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700" dir="ltr">{row.dateStr}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-2.5 rounded-xl flex flex-col items-center">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">شماره کارشده</span>
                            <span className="font-black text-base text-emerald-800 dark:text-emerald-300 mt-0.5">{row.workedCount}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                          <div className="flex text-xs font-bold text-slate-400" dir="ltr">
                            <span>{row.minTimeStr}</span> - <span>{row.maxTimeStr}</span>
                          </div>
                          <button
                            onClick={() => { setViewingDailyStats(row); loadDailyStatsDetails(row); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors border border-indigo-700"
                          >
                            مشاهده جزئیات
                          </button>
                        </div>
                      </div>
                    ))}
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
      {viewingDailyStats && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4" onClick={() => setViewingDailyStats(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center"><Activity size={20} /></div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">جزئیات کارکرد روزانه - {viewingDailyStats.expertName}</h3>
                  <span className="text-xs font-bold text-slate-400" dir="ltr">{viewingDailyStats.dateStr}</span>
                </div>
              </div>
              <button onClick={() => setViewingDailyStats(null)} className="w-9 h-9 flex justify-center items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
            </div>

            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-wrap gap-4 items-center justify-between shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 px-2">امتیاز مدیر:</span>
                <input
                  type="number"
                  min="0" max="100"
                  value={dailyScore}
                  onChange={(e) => setDailyScore(e.target.value ? Number(e.target.value) : '')}
                  className="w-16 h-8 text-center text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="0-100"
                />
                <button
                  onClick={handleSaveDailyScore}
                  disabled={isScoring || dailyScore === ''}
                  className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-700"
                >
                  {isScoring ? <RefreshCw size={12} className="animate-spin" /> : <Award size={12} />} ثبت امتیاز
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={exportDailyStatsToExcel} disabled={loadingDailyStatsDetails || dailyStatsDetails.length === 0} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                  <Download size={14}/> خروجی اکسل
                </button>
                <button onClick={handleDeleteDailyStats} disabled={isDeletingDaily} className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                  {isDeletingDaily ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14}/>} حذف داده‌ها
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-extrabold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    <tr>
                      <th className="p-3">زمان تماس</th>
                      <th className="p-3">نام</th>
                      <th className="p-3">وضعیت تماس</th>
                      <th className="p-3">وضعیت ثبت‌نام</th>
                      <th className="p-3">دوره‌ها</th>
                      <th className="p-3">مشاوره حضوری</th>
                      <th className="p-3">تاریخ و ساعت مشاوره</th>
                      <th className="p-3">یادداشت‌ها</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-300">
                    {loadingDailyStatsDetails ? (
                      <tr><td colSpan={8} className="text-center p-8"><RefreshCw size={24} className="animate-spin mx-auto text-slate-400" /></td></tr>
                    ) : dailyStatsDetails.length === 0 ? (
                      <tr><td colSpan={8} className="text-center p-8 text-xs font-bold text-slate-400">داده‌ای یافت نشد</td></tr>
                    ) : dailyStatsDetails.map((item: any, idx: number) => {
                      const advisoryStr = item.advisory_date && item.advisory_time ? `${item.advisory_date} - ${item.advisory_time}` : item.advisory_date || item.advisory_time || '—';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 whitespace-nowrap text-[10px] font-bold text-slate-500" dir="ltr">{item.jalali_date_time ? item.jalali_date_time.split(' ')[1] : '—'}</td>
                          <td className="p-3 font-extrabold whitespace-nowrap text-slate-900 dark:text-white">{item.full_name || '—'}</td>
                          <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-600">{item.call_status || '—'}</span></td>
                          <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-600">{item.registered || '—'}</span></td>
                          <td className="p-3 min-w-[140px]">{item.courses && item.courses.length > 0 ? <div className="flex flex-wrap gap-1">{item.courses.map((c:string, i:number) => <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">{c}</span>)}</div> : '—'}</td>
                          <td className="p-3 whitespace-nowrap">{item.advisory === 'بله' ? <CheckCircle2 size={16} className="text-emerald-500"/> : '—'}</td>
                          <td className="p-3 whitespace-nowrap" dir="ltr">{advisoryStr}</td>
                          <td className="p-3 min-w-[180px] leading-relaxed text-xs">{item.notes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">تعداد کل رکوردها: {dailyStatsDetails.length}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

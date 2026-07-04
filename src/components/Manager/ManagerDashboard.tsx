/**
 * ManagerDashboard — RTL manager tools for active admins
 * Single-page compact cockpit redesign.
 */

import React, { useCallback, useEffect, useState } from 'react';
import NTLogo from '../../NT Logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { SupabaseProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, Clock, CheckCircle2, Ban, LogOut,
  RefreshCw, AlertCircle, Activity, Inbox, Download, FileText, X, MessageSquare, Send, Lock, Trash2, Award, User
} from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import * as XLSX from 'xlsx';
import { toJalali } from '../../utils/jalali';

const DUTY_LABELS: Record<string, string> = {
  early_week: 'مدیر اول هفته',
  late_week:  'مدیر آخر هفته',
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'در انتظار',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    active:   { label: 'فعال',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    disabled: { label: 'غیرفعال',     cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>;
};

export const ManagerDashboard: React.FC = () => {
  const { supabaseProfile, supabaseUser, signOut, approveAgent, disableAgent } = useAuth();

  // State
  const [profiles, setProfiles]     = useState<SupabaseProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'pending' | 'agents' | 'managers' | 'followups' | 'messages' | 'security'>('pending');
  
  // Followups
  const [receivedShares, setReceivedShares] = useState<any[]>([]);
  const [sharesLoading, setSharesLoading] = useState(true);
  const [sharesError, setSharesError] = useState(false);
  const [viewingShare, setViewingShare] = useState<any>(null);

  // Messaging
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeExperts, setActiveExperts] = useState<{id: string, full_name: string}[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
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

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true);
    const { data, error } = await supabase.rpc('get_today_followup_messages');
    if (!error && data) setMessages(data);
    setMessagesLoading(false);
  }, []);

  const fetchPresence = useCallback(async () => {
    setPresenceLoading(true);
    const { data, error } = await supabase.rpc('get_presence_summary');
    if (error) setPresenceError(true);
    else { setPresenceError(false); setPresenceList(data); }
    setPresenceLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    if (profiles.length === 0) return;
    setStatsLoading(true);
    const { data, error } = await supabase.from('call_attempts').select('id, expert_id, contact_id, created_at');
    if (error) setStatsError(true);
    else if (data) {
      setStatsError(false);
      const grouped = new Map<string, { expertId: string, dateStr: string, contactIds: Set<string>, attemptIds: string[], attemptsCount: number, minTime: Date, maxTime: Date }>();
      for (const row of data) {
        const rowDate = new Date(row.created_at);
        const dayStr = toJalali(rowDate);
        const key = `${row.expert_id}_${dayStr}`;
        let group = grouped.get(key);
        if (!group) {
          group = { expertId: row.expert_id, dateStr: dayStr, contactIds: new Set(), attemptIds: [], attemptsCount: 0, minTime: rowDate, maxTime: rowDate };
          grouped.set(key, group);
        }
        group.contactIds.add(row.contact_id);
        group.attemptIds.push(row.id);
        group.attemptsCount++;
        if (rowDate < group.minTime) group.minTime = rowDate;
        if (rowDate > group.maxTime) group.maxTime = rowDate;
      }
      const statsArr = Array.from(grouped.values()).map(g => {
        const profile = profiles.find(p => p.id === g.expertId);
        return {
          ...g,
          expertName: profile ? profile.full_name : 'کارشناس نامشخص',
          workedCount: g.contactIds.size,
          minTimeStr: g.minTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          maxTimeStr: g.maxTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          sortTime: g.maxTime.getTime()
        };
      });
      statsArr.sort((a, b) => b.sortTime - a.sortTime);
      setDailyStats(statsArr);
    }
    setStatsLoading(false);
  }, [profiles]);

  const loadDailyStatsDetails = useCallback(async (stat: any) => {
    setLoadingDailyStatsDetails(true);
    setDailyScore('');
    
    // Fetch attempts using precise IDs
    const { data: callsData, error: callsError } = await supabase.from('call_attempts')
      .select('*')
      .in('id', stat.attemptIds)
      .order('created_at', { ascending: false });
      
    if (!callsError && callsData) {
      setDailyStatsDetails(callsData);
    } else {
      setDailyStatsDetails([]);
      toast.error('خطا در دریافت جزئیات.');
    }
    
    // Fetch score
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
    loadProfiles(); loadShares(); loadExperts(); loadMessages(); fetchPresence();
  }, [loadProfiles, loadShares, loadExperts, loadMessages, fetchPresence]);

  useEffect(() => {
    fetchStats();
  }, [profiles, fetchStats]);

  useEffect(() => {
    const presenceInt = setInterval(fetchPresence, 30000);
    const statsInt = setInterval(fetchStats, 60000);
    return () => { clearInterval(presenceInt); clearInterval(statsInt); };
  }, [fetchPresence, fetchStats]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && viewingShare && !isReviewing) setViewingShare(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [viewingShare, isReviewing]);

  const refreshAll = () => {
    loadProfiles(); loadShares(); loadMessages(); fetchPresence(); fetchStats();
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
      await loadShares(); await loadMessages();
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

  const handleSendMessage = async () => {
    if (!selectedExpertId || !messageBody.trim()) return;
    setIsSendingMsg(true);
    const { error } = await supabase.rpc('send_followup_message', { p_recipient_id: selectedExpertId, p_body: messageBody.trim() });
    setIsSendingMsg(false);
    if (error) toast.error('ارسال انجام نشد.'); else { toast.success('پیام ارسال شد.'); setMessageBody(''); await loadMessages(); }
  };

  const handleMarkRead = async (msgId: string) => {
    await supabase.rpc('mark_followup_message_read', { p_message_id: msgId });
    await loadMessages();
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
    // Adjust column widths roughly
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
    ];
    worksheet['!dir'] = 'rtl'; // Try to set RTL

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش روزانه');
    
    const fileName = `گزارش_${viewingDailyStats.expertName.replace(/\s+/g, '_')}_${viewingDailyStats.dateStr.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // ---------------------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------------------
  const pendingAgents = profiles.filter(p => p.role === 'agent' && p.account_status === 'pending');
  const activeAgents  = profiles.filter(p => p.role === 'agent' && p.account_status === 'active');
  const managers      = profiles.filter(p => p.role === 'admin'  && p.account_status === 'active');
  const unreadMessages = messages.filter(m => m.recipient_id === supabaseProfile?.id && !m.read_at);

  const tabs = [
    { id: 'pending',  label: 'درخواست‌ها', count: pendingAgents.length, icon: <Clock size={14} /> },
    { id: 'agents',   label: 'کارشناسان',   count: activeAgents.length,  icon: <Users size={14} /> },
    { id: 'managers', label: 'مدیران',      count: managers.length,      icon: <Shield size={14} /> },
    { id: 'followups', label: 'پیگیری‌ها',   count: receivedShares.length, icon: <Inbox size={14} /> },
    { id: 'messages', label: 'پیام‌ها',     count: unreadMessages.length, icon: <MessageSquare size={14} /> },
    { id: 'security', label: 'امنیت',       count: 0, icon: <Lock size={14} /> },
  ] as const;

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------
  const formatTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 overflow-hidden text-slate-800" dir="rtl">
      
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="w-full shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-10" dir="ltr">
        <div className="flex items-center justify-between w-full h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8"><img src={NTLogo} alt="Logo" className="w-full h-full object-contain" /></div>
            <span className="font-extrabold text-[14px] tracking-wide text-slate-900 hidden sm:block">Novin Tech Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={refreshAll} title="بروزرسانی همه" className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
              <RefreshCw size={15} className={loadingProfiles || presenceLoading || statsLoading ? 'animate-spin text-indigo-600' : ''} />
            </button>
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-4 mr-1">
              <span className="text-[12px] font-bold text-slate-700">{supabaseProfile?.full_name}</span>
            </div>
            <button onClick={signOut} title="خروج" className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content Grid ─────────────────────────────────────────── */}
      <div className="flex-1 w-full p-3 md:p-4 lg:p-6 flex flex-col gap-4 overflow-hidden min-h-0">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
          {[
            { label: 'مدیران فعال', count: managers.length, color: 'indigo', icon: <Shield size={16} /> },
            { label: 'کارشناسان فعال', count: activeAgents.length, color: 'emerald', icon: <Users size={16} /> },
            { label: 'درخواست‌های جدید', count: pendingAgents.length, color: 'amber', icon: <Clock size={16} /> },
            { label: 'پیگیری‌های دریافتی', count: receivedShares.length, color: 'brand', icon: <FileText size={16} /> },
            { label: 'پیام‌های جدید', count: unreadMessages.length, color: 'rose', icon: <MessageSquare size={16} /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500">{s.label}</span>
                  <span className="text-lg font-black text-slate-900 leading-none mt-1">{s.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bento Grid layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          
          {/* Quick Actions Panel */}
          <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 shrink-0 flex gap-2 overflow-x-auto hide-scrollbar bg-slate-50">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold shrink-0 transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                  {t.icon} <span>{t.label}</span>
                  {t.count > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${activeTab === t.id ? 'bg-white/20' : 'bg-brand-100 text-brand-700'}`}>{t.count}</span>}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="h-full flex flex-col">
                  
                  {activeTab === 'pending' && (
                    <div className="flex flex-col gap-3">
                      {pendingAgents.length === 0 && <p className="text-xs text-slate-400 text-center py-6 font-bold">درخواستی نیست</p>}
                      {pendingAgents.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-extrabold text-sm text-slate-900">{p.full_name}</p>
                              <p className="text-[11px] text-slate-500 mt-1" dir="ltr">{p.email}</p>
                            </div>
                            <StatusBadge status={p.account_status} />
                          </div>
                          <div className="flex gap-2">
                            <button disabled={actionId === p.id} onClick={() => handleApprove(p)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-lg transition-colors">تأیید</button>
                            <button disabled={actionId === p.id} onClick={() => handleDisable(p)} className="flex-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-[11px] font-bold py-2 rounded-lg transition-colors border border-slate-200 hover:border-red-200">رد</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'agents' && (
                    <div className="flex flex-col gap-3">
                      {activeAgents.length === 0 && <p className="text-xs text-slate-400 text-center py-6 font-bold">کارشناسی نیست</p>}
                      {activeAgents.map(p => (
                        <div key={p.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                             <p className="font-extrabold text-[13px] text-slate-900 truncate">{p.full_name}</p>
                             <p className="text-[10px] text-slate-500 truncate" dir="ltr">{p.email}</p>
                          </div>
                          {p.id !== supabaseProfile?.id && (
                            <button disabled={actionId === p.id} onClick={() => handleDisable(p)} className="shrink-0 bg-white hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-red-200">غیرفعال</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'managers' && (
                    <div className="flex flex-col gap-3">
                      {managers.map(p => (
                        <div key={p.id} className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3 shadow-sm flex items-center justify-between gap-3">
                          <div className="flex flex-col min-w-0">
                             <p className="font-extrabold text-[13px] text-slate-900 truncate">{p.full_name} {p.id === supabaseProfile?.id && <span className="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded ml-1">شما</span>}</p>
                             <p className="text-[10px] text-slate-500 truncate" dir="ltr">{p.email}</p>
                          </div>
                          {p.duty_group && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-bold shrink-0">{DUTY_LABELS[p.duty_group] || p.duty_group}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'followups' && (
                    <div className="flex flex-col gap-3">
                      {sharesLoading ? <div className="py-6 flex justify-center"><RefreshCw size={16} className="animate-spin text-slate-400" /></div> : receivedShares.length === 0 ? <p className="text-xs text-slate-400 text-center py-6 font-bold">پیگیری دریافت نشده</p> : receivedShares.map(s => {
                        const sName = Array.isArray(s.sender) ? s.sender[0]?.full_name : s.sender?.full_name;
                        return (
                          <div key={s.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <p className="font-extrabold text-[13px] text-slate-900">از طرف {sName || 'کارشناس'}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${s.reviewed_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.reviewed_at ? 'بررسی شده' : 'بررسی نشده'}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[10px] font-bold text-slate-500" dir="ltr">{new Date(s.sent_at).toLocaleString('fa-IR')}</span>
                              <button onClick={() => setViewingShare({ ...s, senderName: sName })} className="bg-brand-100 text-brand-700 hover:bg-brand-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors">مشاهده ({s.item_count})</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'messages' && (
                    <div className="flex flex-col h-full gap-4">
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 shadow-sm shrink-0">
                        <div className="flex gap-2">
                          <select className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 outline-none" value={selectedExpertId} onChange={(e) => setSelectedExpertId(e.target.value)}>
                            <option value="">انتخاب کارشناس...</option>
                            {activeExperts.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                          </select>
                          <button onClick={handleSendMessage} disabled={isSendingMsg || !selectedExpertId || !messageBody.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                            {isSendingMsg ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                          </button>
                        </div>
                        <textarea className="w-full mt-2 p-3 rounded-lg border border-slate-200 bg-white text-[12px] font-medium resize-none outline-none h-16" placeholder="متن پیام خود را بنویسید..." value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
                      </div>
                      <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2 p-1">
                         {messagesLoading ? <div className="py-4 flex justify-center"><RefreshCw size={16} className="animate-spin text-slate-400" /></div> : messages.length === 0 ? <p className="text-xs text-slate-400 text-center py-4 font-bold">پیامی نیست</p> : messages.map(m => {
                           const isMine = m.sender_id === supabaseProfile?.id;
                           if (m.message_type === 'share_review') {
                             return <div key={m.id} className="p-3 rounded-xl bg-brand-50/50 border border-brand-100 mr-6 shadow-sm"><p className="text-[11px] font-bold text-brand-800">بررسی لیست پیگیری ثبت شد.</p></div>
                           }
                           return (
                             <div key={m.id} className={`p-3 rounded-xl border shadow-sm ${isMine ? 'bg-indigo-50/50 border-indigo-100 mr-6' : 'bg-white border-slate-200 ml-6'}`}>
                               <div className="flex justify-between mb-2"><span className="font-extrabold text-[10px] text-slate-700">{isMine ? 'شما' : m.sender_name}</span><span className="text-[9px] text-slate-400 font-bold" dir="ltr">{formatTime(m.created_at)}</span></div>
                               <p className="text-[11px] font-medium text-slate-800 leading-relaxed">{m.body}</p>
                               {!isMine && !m.read_at && <div className="mt-2 flex justify-end"><button onClick={() => handleMarkRead(m.id)} className="text-[9px] text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md font-bold transition-colors">خوانده شد</button></div>}
                             </div>
                           );
                         })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                      <input type="password" placeholder="رمز فعلی" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full h-11 px-3 text-[13px] font-medium border border-slate-200 bg-white rounded-lg outline-none focus:border-rose-500" dir="ltr" />
                      <input type="password" placeholder="رمز جدید" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-11 px-3 text-[13px] font-medium border border-slate-200 bg-white rounded-lg outline-none focus:border-rose-500" dir="ltr" />
                      <input type="password" placeholder="تکرار رمز جدید" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-11 px-3 text-[13px] font-medium border border-slate-200 bg-white rounded-lg outline-none focus:border-rose-500" dir="ltr" />
                      <button onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword} className="h-11 w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-sm">
                        {isChangingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />} تغییر رمز عبور
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Expert Status (Presence) */}
          <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 shrink-0 flex items-center justify-between bg-slate-50">
               <h3 className="text-[13px] font-extrabold text-slate-800 flex items-center gap-2"><Activity size={16} className="text-indigo-600" /> وضعیت لحظه‌ای کارشناسان</h3>
               <span className="text-[10px] text-slate-400 font-bold">آپدیت ۳۰s</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
               {presenceLoading && presenceList.length === 0 ? <div className="py-8 flex justify-center"><RefreshCw size={18} className="animate-spin text-slate-300" /></div> : presenceError && presenceList.length === 0 ? <p className="text-xs text-red-500 text-center font-bold py-8">خطا در دریافت وضعیت</p> : presenceList.length === 0 ? <p className="text-xs text-slate-400 text-center py-8 font-bold">کارشناسی آنلاین نیست</p> : (
                 <div className="flex flex-col gap-3">
                   {[...presenceList].sort((a,b) => (a.status==='online'?0:a.status==='idle'?1:2) - (b.status==='online'?0:b.status==='idle'?1:2)).map(p => (
                     <div key={p.expert_id} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm transition-all hover:shadow-md ${p.status === 'online' ? 'bg-white border-emerald-100 hover:border-emerald-200' : p.status === 'idle' ? 'bg-white border-amber-100 hover:border-amber-200' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}>
                       <div className="flex items-center gap-3 min-w-0">
                         <div className="relative shrink-0">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.status === 'online' ? 'bg-emerald-50 text-emerald-600' : p.status === 'idle' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-400'}`}><User size={20} strokeWidth={2.5} /></div>
                           {p.status === 'online' && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="font-extrabold text-[13px] text-slate-900 truncate">{p.full_name}</span>
                           <div className="flex items-center gap-1 mt-0.5 justify-start">
                             <span className="text-[10px] font-bold text-slate-500" dir="ltr">{formatTime(p.login_time)}</span>
                             <span className="text-[10px] font-bold text-slate-400">-</span>
                             <span className="text-[10px] font-bold text-slate-500" dir="ltr">{formatTime(p.last_activity_time)}</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end shrink-0 gap-1.5">
                         <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${p.status === 'online' ? 'bg-emerald-50 text-emerald-700' : p.status === 'idle' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{p.status === 'online' ? 'آنلاین' : p.status === 'idle' ? 'بیکار' : 'آفلاین'}</span>
                         {p.has_active_alert && <AlertCircle size={14} className="text-rose-500" />}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          {/* Daily Stats */}
          <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 shrink-0 flex items-center justify-between bg-slate-50">
               <h3 className="text-[13px] font-extrabold text-slate-800 flex items-center gap-2"><Users size={16} className="text-emerald-600" /> کارکرد روزانه</h3>
               <span className="text-[10px] text-slate-400 font-bold">آپدیت ۶۰s</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
               {statsLoading && dailyStats.length === 0 ? <div className="py-8 flex justify-center"><RefreshCw size={18} className="animate-spin text-slate-300" /></div> : statsError && dailyStats.length === 0 ? <p className="text-xs text-red-500 text-center font-bold py-8">خطا در دریافت آمار</p> : dailyStats.length === 0 ? <p className="text-xs text-slate-400 text-center py-8 font-bold">فعالیتی ثبت نشده</p> : (
                 <div className="flex flex-col gap-3">
                   {dailyStats.map(row => (
                     <div key={row.expertId} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-300 shadow-sm flex flex-col gap-2 transition-colors">
                       <div className="flex items-center justify-between">
                         <span className="font-extrabold text-[12px] text-slate-900 truncate">{row.expertName}</span>
                         <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md" dir="ltr">{row.dateStr}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mt-1">
                         <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg flex flex-col items-center">
                           <span className="text-[9px] font-bold text-emerald-600">شماره کارشده</span>
                           <span className="font-black text-[14px] text-emerald-700 mt-0.5">{row.workedCount}</span>
                         </div>
                         <div className="bg-brand-50/50 border border-brand-100 p-2 rounded-lg flex flex-col items-center">
                           <span className="text-[9px] font-bold text-brand-600">تلاش‌ها</span>
                           <span className="font-black text-[14px] text-brand-700 mt-0.5">{row.attemptsCount}</span>
                         </div>
                       </div>
                       <div className="flex justify-between items-center mt-1">
                         <div className="flex text-[10px] font-bold text-slate-400" dir="ltr">
                           <span>{row.minTimeStr}</span> - <span>{row.maxTimeStr}</span>
                         </div>
                         <button onClick={() => { setViewingDailyStats(row); loadDailyStatsDetails(row); }} className="bg-brand-100 text-brand-700 hover:bg-brand-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">مشاهده جزئیات</button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

        </div>
      </div>

      {/* Share Modal */}
      {viewingShare && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !isReviewing && setViewingShare(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] flex flex-col overflow-hidden max-h-[90vh]" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><FileText size={20} /></div>
                 <div>
                   <h3 className="font-extrabold text-slate-900 text-[15px]">گزارش پیگیری - {viewingShare.senderName}</h3>
                   <span className="text-[11px] font-bold text-slate-500" dir="ltr">{new Date(viewingShare.sent_at).toLocaleString('fa-IR')}</span>
                 </div>
              </div>
              <button disabled={isReviewing} onClick={() => setViewingShare(null)} className="w-9 h-9 flex justify-center items-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={16}/></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 hide-scrollbar">
               <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                 <table className="w-full text-right text-[12px]">
                   <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 whitespace-nowrap">
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
                   <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                     {Array.isArray(viewingShare.payload_json) ? viewingShare.payload_json.map((item: any, idx: number) => {
                       const cDate = item.advisoryDate ? new Date(item.advisoryDate).toLocaleDateString('fa-IR') : '';
                       const advisoryStr = cDate && item.advisoryTime ? `${cDate} - ${item.advisoryTime}` : cDate || item.advisoryTime || '—';
                       const fDate = item.nextFollowUpAt ? new Date(item.nextFollowUpAt).toLocaleDateString('fa-IR') : '';
                       const followUpStr = fDate ? `${fDate} - ${new Date(item.nextFollowUpAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}` : '—';
                       return (
                         <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-3 font-extrabold whitespace-nowrap text-slate-900">{item.fullName || '—'}</td>
                           <td className="p-3 whitespace-nowrap" dir="ltr">{item.phone || '—'}</td>
                           <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">{item.callStatus || '—'}</span></td>
                           <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">{item.registered || '—'}</span></td>
                           <td className="p-3 min-w-[140px]">{item.courses && item.courses.length > 0 ? <div className="flex flex-wrap gap-1">{item.courses.map((c:string, i:number) => <span key={i} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">{c}</span>)}</div> : '—'}</td>
                           <td className="p-3 whitespace-nowrap">{item.advisory === 'بله' ? <CheckCircle2 size={16} className="text-emerald-500"/> : '—'}</td>
                           <td className="p-3 whitespace-nowrap" dir="ltr">{advisoryStr}</td>
                           <td className="p-3 whitespace-nowrap" dir="ltr">{followUpStr}</td>
                           <td className="p-3 min-w-[180px] leading-relaxed text-[11px]">{item.notes || '—'}</td>
                           <td className="p-3 whitespace-nowrap text-[10px] font-bold text-slate-400" dir="ltr">{item.latestAttemptAt ? new Date(item.latestAttemptAt).toLocaleString('fa-IR') : '—'}</td>
                         </tr>
                       )
                     }) : <tr><td colSpan={10} className="text-center p-6 text-sm font-bold text-slate-400">داده نامعتبر است</td></tr>}
                   </tbody>
                 </table>
               </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
               <div className="flex gap-3">
                 <span className="text-[12px] font-extrabold text-slate-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">مجموع: {viewingShare.item_count} مورد</span>
                 <button disabled={isReviewing} onClick={() => {
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
                 }} className="flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-100 shadow-sm transition-colors"><Download size={14}/> دانلود اکسل</button>
                 <button disabled={isReviewing} onClick={() => handleDeleteShare(viewingShare.id)} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-[12px] font-bold text-rose-700 hover:bg-rose-100 shadow-sm transition-colors"><Trash2 size={14}/> حذف لیست</button>
               </div>
               {!viewingShare.reviewed_at ? (
                 <button disabled={isReviewing} onClick={() => handleReviewShare(viewingShare.id)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-70 text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-brand-500/20 transition-all">
                   {isReviewing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} تایید و ثبت بررسی
                 </button>
               ) : (
                 <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-6 py-2.5 rounded-xl text-[13px] font-bold"><CheckCircle2 size={16}/> لیست بررسی شده است</span>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Stats Detailed Modal */}
      {viewingDailyStats && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewingDailyStats(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]" dir="rtl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Activity size={20} /></div>
                 <div>
                   <h3 className="font-extrabold text-slate-900 text-[15px]">جزئیات کارکرد روزانه - {viewingDailyStats.expertName}</h3>
                   <span className="text-[11px] font-bold text-slate-500" dir="ltr">{viewingDailyStats.dateStr}</span>
                 </div>
              </div>
              <button onClick={() => setViewingDailyStats(null)} className="w-9 h-9 flex justify-center items-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={16}/></button>
            </div>
            
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap gap-4 items-center justify-between shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 px-2">امتیاز مدیر:</span>
                <input 
                  type="number" 
                  min="0" max="100" 
                  value={dailyScore} 
                  onChange={(e) => setDailyScore(e.target.value ? Number(e.target.value) : '')}
                  className="w-16 h-8 text-center text-[12px] font-bold border border-slate-200 rounded-lg outline-none focus:border-brand-500 hide-arrows" 
                  placeholder="0-100"
                />
                <button 
                  onClick={handleSaveDailyScore} 
                  disabled={isScoring || dailyScore === ''}
                  className="h-8 px-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isScoring ? <RefreshCw size={12} className="animate-spin" /> : <Award size={12} />} ثبت امتیاز
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={exportDailyStatsToExcel} disabled={loadingDailyStatsDetails || dailyStatsDetails.length === 0} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-[12px] font-bold shadow-sm transition-colors">
                  <Download size={14}/> خروجی اکسل
                </button>
                <button onClick={handleDeleteDailyStats} disabled={isDeletingDaily} className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl text-[12px] font-bold shadow-sm transition-colors">
                  {isDeletingDaily ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14}/>} حذف داده‌های این روز
                </button>
              </div>
            </div>

            {/* Content Table */}
            <div className="p-5 overflow-y-auto flex-1 hide-scrollbar bg-slate-50/50">
               <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm bg-white">
                 <table className="w-full text-right text-[12px]">
                   <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 whitespace-nowrap">
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
                   <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                     {loadingDailyStatsDetails ? (
                       <tr><td colSpan={8} className="text-center p-8"><RefreshCw size={24} className="animate-spin mx-auto text-slate-300" /></td></tr>
                     ) : dailyStatsDetails.length === 0 ? (
                       <tr><td colSpan={8} className="text-center p-8 text-sm font-bold text-slate-400">داده‌ای یافت نشد</td></tr>
                     ) : dailyStatsDetails.map((item: any, idx: number) => {
                       const advisoryStr = item.advisory_date && item.advisory_time ? `${item.advisory_date} - ${item.advisory_time}` : item.advisory_date || item.advisory_time || '—';
                       return (
                         <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-3 whitespace-nowrap text-[10px] font-bold text-slate-500" dir="ltr">{item.jalali_date_time ? item.jalali_date_time.split(' ')[1] : '—'}</td>
                           <td className="p-3 font-extrabold whitespace-nowrap text-slate-900">{item.full_name || '—'}</td>
                           <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">{item.call_status || '—'}</span></td>
                           <td className="p-3 whitespace-nowrap"><span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold">{item.registered || '—'}</span></td>
                           <td className="p-3 min-w-[140px]">{item.courses && item.courses.length > 0 ? <div className="flex flex-wrap gap-1">{item.courses.map((c:string, i:number) => <span key={i} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">{c}</span>)}</div> : '—'}</td>
                           <td className="p-3 whitespace-nowrap">{item.advisory === 'بله' ? <CheckCircle2 size={16} className="text-emerald-500"/> : '—'}</td>
                           <td className="p-3 whitespace-nowrap" dir="ltr">{advisoryStr}</td>
                           <td className="p-3 min-w-[180px] leading-relaxed text-[11px]">{item.notes || '—'}</td>
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
               <span className="text-[12px] font-extrabold text-slate-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">تعداد کل رکوردها: {dailyStatsDetails.length}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

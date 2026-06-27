/**
 * ManagerDashboard — RTL manager tools for active admins
 *
 * Features:
 *  1. Pending agent requests — full name, email, date, approve/disable
 *  2. Active agents list
 *  3. Active managers directory with duty_group labels
 *
 * Authorization: rendered only when authStatus === 'active_admin'.
 * RPC calls go through useAuth.approveAgent / disableAgent.
 */

import React, { useCallback, useEffect, useState } from 'react';
import NTLogo from '../../NT Logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { SupabaseProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, Clock, CheckCircle2, Ban, LogOut,
  RefreshCw, User, Mail, Calendar, AlertCircle, Activity,
} from 'lucide-react';
import { customToast as toast } from '../UI/toast';

// ---------------------------------------------------------------------------
// Duty group labels
// ---------------------------------------------------------------------------
const DUTY_LABELS: Record<string, string> = {
  early_week: 'مدیر اول هفته',
  late_week:  'مدیر آخر هفته',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'در انتظار',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    active:   { label: 'فعال',        cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    disabled: { label: 'غیرفعال',     cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cls}`}>{label}</span>;
};

// ---------------------------------------------------------------------------
// Presence Section
// ---------------------------------------------------------------------------
const PresenceSection = () => {
  const [presenceList, setPresenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchPresence = async () => {
    const { data, error } = await supabase.rpc('get_presence_summary');
    if (error) {
      setHasError(true);
    } else if (data) {
      setHasError(false);
      setPresenceList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && presenceList.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8 flex justify-center py-10">
      <RefreshCw size={20} className="animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
           <Activity size={20} className="text-indigo-600" />
           وضعیت لحظه‌ای کارشناسان
         </h2>
         <div className="flex items-center gap-3">
           <span className="text-xs font-medium text-slate-400">به‌روزرسانی خودکار هر ۳۰ ثانیه</span>
           {hasError && (
             <button onClick={fetchPresence} className="flex items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-2 py-1 rounded-md text-xs font-bold transition-colors">
               <RefreshCw size={12} />
               <span>تلاش مجدد</span>
             </button>
           )}
         </div>
      </div>
      {hasError && presenceList.length === 0 ? (
         <div className="text-center py-6 bg-slate-50 rounded-xl">
           <p className="text-[13px] font-bold text-red-600">دریافت وضعیت لحظه‌ای کارشناسان با مشکل مواجه شد.</p>
         </div>
      ) : presenceList.length === 0 ? (
         <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
           <Users size={24} className="mx-auto mb-2 text-slate-300" />
           <p className="text-[13px] font-bold text-slate-500">در حال حاضر کارشناس فعالی در پنل نیست</p>
         </div>
      ) : (
          <div className="flex flex-col gap-2">
            {[...presenceList].sort((a, b) => {
              const order = { online: 0, idle: 1, offline: 2 };
              return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
            }).map(p => (
              <div key={p.expert_id} className={`p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 ${p.status === 'online' ? 'bg-white border-emerald-200 shadow-sm' : p.status === 'idle' ? 'bg-amber-50/50 border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>

                {/* Right side: Identity & Status */}
                <div className="flex items-center gap-3 lg:w-1/3 shrink-0">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${p.status === 'online' ? 'bg-emerald-100 text-emerald-700' : p.status === 'idle' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-500'}`}>
                      {p.full_name.charAt(0)}
                    </div>
                    {p.status === 'online' && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-sm text-slate-900 leading-none">{p.full_name}</span>
                    <span className={`text-[10px] w-fit font-bold px-2 py-0.5 rounded mt-0.5 ${p.status === 'online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : p.status === 'idle' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {p.status === 'online' ? 'آنلاین' : p.status === 'idle' ? 'نیازمند توجه' : 'آفلاین'}
                    </span>
                  </div>
                </div>

                {/* Middle: Metadata Blocks */}
                <div className="flex-1 flex flex-row items-center justify-start lg:justify-center gap-8">
                  <div className="flex flex-col gap-1 lg:items-center">
                    <span className="text-[10px] font-bold text-slate-400">شروع حضور</span>
                    <span className="font-bold text-[13px] text-slate-700" dir="ltr">{formatTime(p.login_time)}</span>
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
                  <div className="flex flex-col gap-1 lg:items-center">
                    <span className="text-[10px] font-bold text-slate-400">آخرین فعالیت</span>
                    <span className="font-bold text-[13px] text-slate-700" dir="ltr">{formatTime(p.last_activity_time)}</span>
                  </div>
                </div>

                {/* Left side: Alerts */}
                <div className="lg:w-1/4 flex justify-start lg:justify-end shrink-0">
                  {p.has_active_alert && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 w-fit">
                      <AlertCircle size={14} />
                      <span>هشدار عدم فعالیت</span>
                    </div>
                  )}
                </div>
             </div>
           ))}
         </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Daily Stats Section
// ---------------------------------------------------------------------------
const DailyStatsSection = ({ profiles }: { profiles: SupabaseProfile[] }) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('call_attempts')
      .select('expert_id, contact_id, created_at, jalali_date_time');

    if (error) {
      setError(true);
    } else if (data) {
      setError(false);

      const grouped = new Map<string, {
        expertId: string,
        dateStr: string,
        contactIds: Set<string>,
        attemptsCount: number,
        minTime: Date,
        maxTime: Date
      }>();

      for (const row of data) {
        const rowDate = new Date(row.created_at);
        const dayStr = rowDate.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });

        const key = `${row.expert_id}_${dayStr}`;
        let group = grouped.get(key);
        if (!group) {
          group = {
            expertId: row.expert_id,
            dateStr: dayStr,
            contactIds: new Set<string>(),
            attemptsCount: 0,
            minTime: rowDate,
            maxTime: rowDate
          };
          grouped.set(key, group);
        }

        group.contactIds.add(row.contact_id);
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

      setStats(statsArr);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profiles.length > 0) {
      fetchStats();
      const interval = setInterval(fetchStats, 60000);
      return () => clearInterval(interval);
    }
  }, [profiles]);

  if (loading && stats.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8 flex justify-center py-10">
      <RefreshCw size={20} className="animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
           <Activity size={20} className="text-indigo-600" />
           کارکرد روزانه کارشناسان
         </h2>
         <div className="flex items-center gap-3">
           <span className="text-xs font-medium text-slate-400">به‌روزرسانی خودکار</span>
           <button onClick={fetchStats} className="flex items-center gap-1 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-700 px-2 py-1 rounded-md text-xs font-bold transition-colors">
             <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
           </button>
         </div>
      </div>

      {error && stats.length === 0 ? (
         <div className="text-center py-6 bg-slate-50 rounded-xl">
           <p className="text-[13px] font-bold text-red-600">دریافت آمار با مشکل مواجه شد.</p>
         </div>
      ) : stats.length === 0 ? (
         <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
           <Activity size={24} className="mx-auto mb-2 text-slate-300" />
           <p className="text-[13px] font-bold text-slate-500">هنوز فعالیت تماسی ثبت نشده</p>
         </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 text-[12px]">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">نام کارشناس</th>
                <th className="py-3 px-4 whitespace-nowrap">تاریخ</th>
                <th className="py-3 px-4 whitespace-nowrap">شماره‌های کارشده</th>
                <th className="py-3 px-4 whitespace-nowrap">تلاش‌های تماس</th>
                <th className="py-3 px-4 whitespace-nowrap">اولین فعالیت</th>
                <th className="py-3 px-4 whitespace-nowrap">آخرین فعالیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] font-medium text-slate-700">
              {stats.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-[11px] shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {row.expertName.charAt(0)}
                    </div>
                    <span className="font-extrabold text-slate-900">{row.expertName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-semibold" dir="ltr">{row.dateStr}</td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-extrabold text-[13px] border border-emerald-100 shadow-sm">
                      {row.workedCount}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg font-extrabold text-[13px] border border-brand-100 shadow-sm">
                      {row.attemptsCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-semibold" dir="ltr">{row.minTimeStr}</td>
                  <td className="py-3 px-4 text-slate-500 font-semibold" dir="ltr">{row.maxTimeStr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const ManagerDashboard: React.FC = () => {
  const { supabaseProfile, supabaseUser, signOut, approveAgent, disableAgent } = useAuth();

  const [profiles, setProfiles]     = useState<SupabaseProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'pending' | 'agents' | 'managers'>('pending');

  // ---------------------------------------------------------------------------
  // Load all profiles (admin RLS policy allows this)
  // ---------------------------------------------------------------------------
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('خطا در بارگذاری لیست کاربران.');
    } else {
      setProfiles((data as SupabaseProfile[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  // ---------------------------------------------------------------------------
  // Approve
  // ---------------------------------------------------------------------------
  const handleApprove = async (p: SupabaseProfile) => {
    setActionId(p.id);
    const err = await approveAgent(p.id);
    if (err) { toast.error(err); }
    else { toast.success(`حساب «${p.full_name}» فعال شد.`); await loadProfiles(); }
    setActionId(null);
  };

  // ---------------------------------------------------------------------------
  // Disable
  // ---------------------------------------------------------------------------
  const handleDisable = async (p: SupabaseProfile) => {
    setActionId(p.id);
    const err = await disableAgent(p.id);
    if (err) { toast.error(err); }
    else { toast.success(`حساب «${p.full_name}» غیرفعال شد.`); await loadProfiles(); }
    setActionId(null);
  };

  // ---------------------------------------------------------------------------
  // Derived lists
  // ---------------------------------------------------------------------------
  const pendingAgents = profiles.filter(p => p.role === 'agent' && p.account_status === 'pending');
  const activeAgents  = profiles.filter(p => p.role === 'agent' && p.account_status === 'active');
  const managers      = profiles.filter(p => p.role === 'admin'  && p.account_status === 'active');

  const tabs = [
    { id: 'pending',  label: 'درخواست‌های جدید', count: pendingAgents.length, icon: <Clock size={15} /> },
    { id: 'agents',   label: 'کارشناسان فعال',    count: activeAgents.length,  icon: <Users size={15} /> },
    { id: 'managers', label: 'مدیران',             count: managers.length,      icon: <Shield size={15} /> },
  ] as const;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col w-full h-full bg-slate-50" dir="rtl">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="w-full shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm" dir="ltr">
        <div className="flex items-center justify-between w-full h-14 px-4 md:px-6">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center transition-colors">
              <img src={NTLogo} alt="Novin Tech Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-slate-900 font-extrabold text-sm tracking-wide">Novin Tech Panel</span>
          </div>

          {/* Manager info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-700">{supabaseProfile?.full_name}</span>
              <span className="text-[11px] text-slate-400 font-medium">{supabaseUser?.email}</span>
            </div>
            <button
              id="mgr-logout"
              type="button"
              onClick={signOut}
              title="خروج از حساب"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

          {/* Page title */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">پنل مدیریت</h1>
              <p className="text-[13px] text-slate-500 font-medium">نمای کلی وضعیت سیستم و کارشناسان</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              آخرین به‌روزرسانی: همین حالا
            </div>
          </div>

          <PresenceSection />

          <DailyStatsSection profiles={profiles} />

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'در انتظار تأیید',  count: pendingAgents.length, color: 'rose',   icon: <Clock size={18} /> },
              { label: 'کارشناسان فعال', count: activeAgents.length,  color: 'emerald', icon: <Users size={18} /> },
              { label: 'مدیران سیستم',     count: managers.length,      color: 'indigo',  icon: <Shield size={18} /> },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-xl border ${s.count > 0 && s.color === 'rose' ? 'border-rose-200 bg-rose-50/30 shadow-sm' : 'border-slate-200 shadow-sm'} p-4 flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 border border-${s.color}-100 flex items-center justify-center text-${s.color}-600 shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900 leading-none mb-1">{s.count}</p>
                  <p className="text-[11px] text-slate-500 font-bold">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-6">
            {tabs.map(t => (
              <button
                key={t.id}
                id={`mgr-tab-${t.id}`}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                {t.count > 0 && <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${activeTab === t.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <div className="flex justify-end mb-4">
            <button
              id="mgr-refresh"
              type="button"
              onClick={loadProfiles}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>بروزرسانی</span>
            </button>
          </div>

          {/* Content panels */}
          <AnimatePresence mode="wait">
            {loading && profiles.length === 0 ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-16">
                <RefreshCw size={24} className="animate-spin text-slate-300" />
              </motion.div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

                {/* ── Pending agents ─────────────────────────────── */}
                {activeTab === 'pending' && (
                  <div className="space-y-3">
                    {pendingAgents.length === 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500">هیچ درخواست در انتظاری وجود ندارد.</p>
                      </div>
                    )}
                    {pendingAgents.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <User size={18} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">{p.full_name}</span>
                            <StatusBadge status={p.account_status} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium" dir="ltr"><Mail size={11} />{p.email}</span>
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium"><Calendar size={11} />{formatDate(p.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            id={`approve-${p.id}`}
                            type="button"
                            disabled={actionId === p.id}
                            onClick={() => handleApprove(p)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-60"
                          >
                            <CheckCircle2 size={13} /><span>تأیید</span>
                          </button>
                          <button
                            id={`disable-${p.id}`}
                            type="button"
                            disabled={actionId === p.id}
                            onClick={() => handleDisable(p)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold transition-all border border-slate-200 hover:border-red-200"
                          >
                            <Ban size={13} /><span>رد</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Active agents ──────────────────────────────── */}
                {activeTab === 'agents' && (
                  <div className="space-y-3">
                    {activeAgents.length === 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                        <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500">هنوز هیچ کارشناس فعالی ثبت نشده.</p>
                      </div>
                    )}
                    {activeAgents.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <User size={18} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">{p.full_name}</span>
                            <StatusBadge status={p.account_status} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium" dir="ltr"><Mail size={11} />{p.email}</span>
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium"><Calendar size={11} />{formatDate(p.created_at)}</span>
                          </div>
                        </div>
                        {/* Don't allow disabling self */}
                        {p.id !== supabaseProfile?.id && (
                          <button
                            id={`disable-active-${p.id}`}
                            type="button"
                            disabled={actionId === p.id}
                            onClick={() => handleDisable(p)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold transition-all border border-slate-200 hover:border-red-200 shrink-0"
                          >
                            <Ban size={13} /><span>غیرفعال</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Manager directory ──────────────────────────── */}
                {activeTab === 'managers' && (
                  <div className="space-y-3">
                    {managers.length === 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                        <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500">هیچ مدیر فعالی یافت نشد.</p>
                      </div>
                    )}
                    {managers.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <Shield size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">{p.full_name}</span>
                            {p.id === supabaseProfile?.id && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 border border-brand-200">شما</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium" dir="ltr"><Mail size={11} />{p.email}</span>
                            {p.duty_group && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {DUTY_LABELS[p.duty_group] || p.duty_group}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        ارتقای نقش به مدیر از طریق رابط کاربری امکان‌پذیر نیست.
                        این عملیات توسط تیم فنی از طریق SQL Editor انجام می‌شود.
                      </p>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

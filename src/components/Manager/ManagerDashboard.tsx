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
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { SupabaseProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Users, Clock, CheckCircle2, Ban, LogOut,
  RefreshCw, User, Mail, Calendar, AlertCircle,
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
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="text-slate-900 font-extrabold text-sm tracking-wide">Novintech</span>
              <span className="text-indigo-600 font-bold text-xs mr-2">پنل مدیریت</span>
            </div>
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
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">پنل مدیریت نوین‌تک</h1>
            <p className="text-sm text-slate-500 font-medium">مدیریت کارشناسان و تأیید حساب‌های جدید</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'در انتظار',  count: pendingAgents.length, color: 'amber',   icon: <Clock size={20} /> },
              { label: 'کارشناسان', count: activeAgents.length,  color: 'emerald', icon: <Users size={20} /> },
              { label: 'مدیران',     count: managers.length,      color: 'indigo',  icon: <Shield size={20} /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 border border-${s.color}-100 flex items-center justify-center text-${s.color}-600 mb-3`}>
                  {s.icon}
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{s.count}</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{s.label}</p>
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
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-16">
                <RefreshCw size={24} className="animate-spin text-slate-400" />
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

/**
 * AuthScreen v3 — Two entry points: Agent (ورود کارشناس) and Manager (ورود مدیریت)
 *
 * UI redesign: fixed contrast, layout, scrollability, RTL correctness.
 * Auth logic is unchanged — only presentation layer modified.
 *
 * Root causes fixed:
 *  • Removed bg-clip-text / text-transparent (killed by global gradient override in index.css)
 *  • Removed bg-emerald-* blobs that caused green selection artefacts
 *  • Icon colors now use explicit hex-safe Tailwind classes, not brand variables
 *  • Sign-up card is now overflow-y-auto so it never clips on short viewports
 *  • Branding column hidden on mobile, shown on lg+
 *  • No mix-blend-mode, no pseudo-element overlays on text
 */

import React, { useState } from 'react';
import { useAuth, LoginMode } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, User, ArrowLeft, Eye, EyeOff,
  Loader2, Shield, UserCheck, CheckCircle,
} from 'lucide-react';
import { customToast as toast } from '../UI/toast';

type AgentFormMode = 'signin' | 'signup' | 'signup_done';

const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'ایمیل معتبر وارد کنید.';

const validatePassword = (v: string) =>
  v.length >= 8 ? null : 'رمز عبور باید حداقل ۸ کاراکتر باشد.';

// ---------------------------------------------------------------------------
// Field — input with label, explicit icon color, error state
// ---------------------------------------------------------------------------
const Field = ({
  label, id, type, value, onChange, placeholder, error, rightAddon, direction,
}: {
  label: string; id: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; error?: string;
  rightAddon?: React.ReactNode; direction: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[13.5px] font-bold text-slate-600 leading-none px-1">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={type === 'email' || type === 'password' ? 'ltr' : direction}
        autoComplete={type === 'password' ? 'current-password' : undefined}
        className={[
          'w-full h-11 rounded-xl border px-4 text-sm font-medium text-slate-900',
          'bg-white placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 transition-all',
          rightAddon ? 'pr-10' : '',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
            : 'border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:ring-sky-100',
        ].join(' ')}
      />
      {rightAddon && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none [&>button]:pointer-events-auto">
          {rightAddon}
        </div>
      )}
    </div>
    {error && <p className="text-[11px] text-red-600 font-semibold px-0.5 mt-0.5">{error}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// PwToggle — explicit slate color, never inherited
// ---------------------------------------------------------------------------
const PwToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-slate-400 hover:text-slate-600 transition-colors"
    tabIndex={-1}
    aria-label={show ? 'مخفی کردن رمز' : 'نمایش رمز'}
  >
    {show ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
  </button>
);

// ---------------------------------------------------------------------------
// PrimaryButton — blue for agent, indigo for manager
// ---------------------------------------------------------------------------
const PrimaryButton = ({
  loading, label, id, color = 'sky',
}: { loading: boolean; label: string; id: string; color?: 'sky' | 'indigo' }) => {
  const bg = color === 'indigo'
    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-200'
    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-200';

  return (
    <button
      id={id}
      type="submit"
      disabled={loading}
      className={`
        group w-full flex items-center justify-center gap-2.5
        py-3 rounded-xl font-bold text-white text-sm
        transition-all active:scale-[0.98] shadow-md
        disabled:opacity-60 disabled:cursor-not-allowed
        ${bg}
      `}
    >
      {loading
        ? <Loader2 size={18} className="animate-spin" />
        : <>
            <span>{label}</span>
            <ArrowLeft size={15} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </>
      }
    </button>
  );
};

// ---------------------------------------------------------------------------
// InfoBox — replaces amber/indigo boxes with consistent neutral style
// ---------------------------------------------------------------------------
const InfoBox = ({ children, variant = 'amber' }: { children: React.ReactNode; variant?: 'amber' | 'indigo' }) => {
  const cls = variant === 'indigo'
    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';

  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-[12px] font-semibold leading-relaxed ${cls}`}>
      <Lock size={13} className="mt-0.5 shrink-0 opacity-70" />
      <span>{children}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AgentPanel
// ---------------------------------------------------------------------------
const AgentPanel: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const { direction } = useLocale();

  const [mode, setMode] = useState<AgentFormMode>('signin');
  const [loading, setLoading] = useState(false);

  // Sign in
  const [siEmail, setSiEmail]       = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw]     = useState(false);

  // Sign up
  const [suName, setSuName]         = useState('');
  const [suEmail, setSuEmail]       = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm]   = useState('');
  const [suShowPw, setSuShowPw]     = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErrors = () => setErrors({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const errs: Record<string, string> = {};
    if (!siEmail) errs.siEmail = 'ایمیل الزامی است.';
    else { const r = validateEmail(siEmail); if (r) errs.siEmail = r; }
    if (!siPassword) errs.siPassword = 'رمز عبور الزامی است.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const err = await signIn(siEmail.trim(), siPassword, 'agent');
    setLoading(false);
    if (err) toast.error(err);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const errs: Record<string, string> = {};
    if (!suName.trim())  errs.suName = 'نام و نام خانوادگی الزامی است.';
    if (!suEmail)        errs.suEmail = 'ایمیل الزامی است.';
    else { const r = validateEmail(suEmail); if (r) errs.suEmail = r; }
    const pwErr = validatePassword(suPassword);
    if (pwErr) errs.suPassword = pwErr;
    if (suPassword !== suConfirm) errs.suConfirm = 'رمزهای عبور مطابقت ندارند.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const { error, needsVerification } = await signUp(suEmail.trim(), suPassword, suName.trim());
    setLoading(false);
    if (error) { toast.error(error); return; }
    if (needsVerification) setMode('signup_done');
    else { toast.success('حساب ساخته شد. منتظر تأیید مدیر بمانید.'); setMode('signin'); }
  };

  return (
    <div className="w-full bg-white rounded-[24px] border border-slate-200/80 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[460px] sm:min-h-[520px]" style={{ maxHeight: 'calc(100dvh - 32px)' }}>

      {/* Card header */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 shrink-0 border-b border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
            <UserCheck size={18} strokeWidth={2} className="text-sky-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-400 leading-none mb-1">کارشناس تماس</p>
            <p className="text-[16px] font-extrabold text-slate-900 leading-none">ورود / ایجاد حساب</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {mode !== 'signup_done' && (
        <div className="px-5 sm:px-8 pt-5 sm:pt-6 shrink-0">
          <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                id={`agent-tab-${m}`}
                onClick={() => { setMode(m); clearErrors(); }}
                className={`flex-1 py-2.5 rounded-lg text-[13.5px] font-bold transition-all ${
                  mode === m
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                {m === 'signin' ? 'ورود' : 'ایجاد حساب'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6">
        <AnimatePresence mode="wait">

          {/* Sign In */}
          {mode === 'signin' && (
            <motion.form
              key="agent-si"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}
              onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate
            >
              <Field label="ایمیل" id="asi-email" type="email" value={siEmail} onChange={setSiEmail}
                placeholder="example@novintech.ir" error={errors.siEmail} direction={direction}
                rightAddon={<Mail size={14} strokeWidth={2} className="text-slate-400" />} />
              <Field label="رمز عبور" id="asi-password" type={siShowPw ? 'text' : 'password'}
                value={siPassword} onChange={setSiPassword} placeholder="••••••••"
                error={errors.siPassword} direction={direction}
                rightAddon={<PwToggle show={siShowPw} onToggle={() => setSiShowPw(p => !p)} />} />
              <PrimaryButton loading={loading} label="ورود به پنل کارشناسی" id="asi-submit" color="sky" />
            </motion.form>
          )}

          {/* Sign Up */}
          {mode === 'signup' && (
            <motion.form
              key="agent-su"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}
              onSubmit={handleSignUp} className="flex flex-col gap-3.5" noValidate
            >
              <Field label="نام و نام خانوادگی" id="asu-name" type="text" value={suName} onChange={setSuName}
                placeholder="مثال: امیر حسین مسرور" error={errors.suName} direction={direction}
                rightAddon={<User size={14} strokeWidth={2} className="text-slate-400" />} />
              <Field label="ایمیل" id="asu-email" type="email" value={suEmail} onChange={setSuEmail}
                placeholder="example@novintech.ir" error={errors.suEmail} direction={direction}
                rightAddon={<Mail size={14} strokeWidth={2} className="text-slate-400" />} />
              <Field label="رمز عبور" id="asu-password" type={suShowPw ? 'text' : 'password'}
                value={suPassword} onChange={setSuPassword} placeholder="حداقل ۸ کاراکتر"
                error={errors.suPassword} direction={direction}
                rightAddon={<PwToggle show={suShowPw} onToggle={() => setSuShowPw(p => !p)} />} />
              <Field label="تکرار رمز عبور" id="asu-confirm" type={suShowPw ? 'text' : 'password'}
                value={suConfirm} onChange={setSuConfirm} placeholder="••••••••"
                error={errors.suConfirm} direction={direction} />
              <InfoBox variant="amber">
                حساب شما با نقش «کارشناس» ثبت می‌شود و باید توسط مدیر فعال شود.
              </InfoBox>
              <PrimaryButton loading={loading} label="ثبت درخواست" id="asu-submit" color="sky" />
            </motion.form>
          )}

          {/* Signup Done */}
          {mode === 'signup_done' && (
            <motion.div
              key="agent-done"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center gap-5 py-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={28} strokeWidth={2} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1.5">درخواست ثبت شد!</h2>
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-[280px]">
                  ایمیل تأیید به آدرس شما ارسال شد.<br />
                  پس از تأیید، <span className="font-bold text-amber-700">منتظر فعال‌سازی توسط مدیر</span> بمانید.
                </p>
              </div>
              <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
                <p className="text-[12px] text-slate-500 font-semibold leading-relaxed">
                  مدیر سیستم پس از بررسی، دسترسی شما را فعال خواهد کرد.
                </p>
              </div>
              <button
                id="agent-goto-signin"
                type="button"
                onClick={() => setMode('signin')}
                className="text-sm font-bold text-sky-600 hover:text-sky-500 transition-colors"
              >
                بازگشت به صفحه ورود
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ManagerPanel
// ---------------------------------------------------------------------------
const ManagerPanel: React.FC = () => {
  const { signIn } = useAuth();
  const { direction } = useLocale();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'ایمیل الزامی است.';
    else { const r = validateEmail(email); if (r) errs.email = r; }
    if (!password) errs.password = 'رمز عبور الزامی است.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const err = await signIn(email.trim(), password, 'manager');
    setLoading(false);
    if (err) toast.error(err);
  };

  return (
    <div className="w-full bg-white rounded-[24px] border border-indigo-100 shadow-2xl shadow-indigo-100/40 overflow-hidden flex flex-col min-h-[380px] sm:min-h-[400px]" style={{ maxHeight: 'calc(100dvh - 32px)' }}>
      {/* Card header */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 shrink-0 border-b border-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Shield size={18} strokeWidth={2} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-400 leading-none mb-1">مدیریت سیستم</p>
            <p className="text-[16px] font-extrabold text-slate-900 leading-none">ورود به پنل مدیریت</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6">
        <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
        <Field label="ایمیل مدیر" id="mgr-email" type="email" value={email} onChange={setEmail}
          placeholder="manager@novintech.ir" error={errors.email} direction={direction}
          rightAddon={<Mail size={14} strokeWidth={2} className="text-slate-400" />} />
        <Field label="رمز عبور" id="mgr-password" type={showPw ? 'text' : 'password'}
          value={password} onChange={setPassword} placeholder="••••••••"
          error={errors.password} direction={direction}
          rightAddon={<PwToggle show={showPw} onToggle={() => setShowPw(p => !p)} />} />
        <InfoBox variant="indigo">
          ثبت‌نام عمومی برای پنل مدیریت وجود ندارد. حساب‌های مدیر توسط تیم فنی ایجاد می‌شوند.
        </InfoBox>
          <PrimaryButton loading={loading} label="ورود به پنل مدیریت" id="mgr-submit" color="indigo" />
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AuthScreen — clean two-column layout with no problematic CSS
// ---------------------------------------------------------------------------
export const AuthScreen: React.FC = () => {
  const { setLoginMode } = useAuth();
  const { direction } = useLocale();
  const [panelMode, setPanelMode] = useState<LoginMode>('agent');

  const switchMode = (m: LoginMode) => {
    setPanelMode(m);
    setLoginMode(m);
  };

  const isManager = panelMode === 'manager';

  return (
    /*
     * Root: white base, no overflow-x, no global gradient blobs that bleed.
     * Grid background is pure SVG-safe CSS, no blur/blend.
     */
    <div
      className="relative flex w-full min-h-screen text-slate-900 overflow-x-hidden"
      dir={direction}
      style={{ backgroundColor: '#f8fafc' }}
    >

      {/* Grid background — pure CSS, no mix-blend, no blur blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(226, 232, 240, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Subtle top-right glow — single color, no emerald */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 z-0"
        style={{
          width: '420px',
          height: '340px',
          background: isManager
            ? 'radial-gradient(ellipse at 80% 10%, rgba(99,102,241,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 80% 10%, rgba(14,165,233,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Mode switch pill — top left (RTL: top right visually) */}
      <div className="absolute top-4 left-4 z-30">
        <button
          type="button"
          id="auth-mode-toggle"
          onClick={() => switchMode(isManager ? 'agent' : 'manager')}
          className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-full px-4 py-2 text-[13px] font-bold shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95"
        >
          {isManager
            ? <><UserCheck size={13} strokeWidth={2.5} className="text-sky-600" /><span>ورود کارشناس</span></>
            : <><Shield size={13} strokeWidth={2.5} className="text-indigo-600" /><span>ورود مدیریت</span></>
          }
        </button>
      </div>

      {/*
       * Two-column layout:
       * • Left (RTL: right) = branding — hidden on mobile, 5/12 on lg+
       * • Right (RTL: left) = form — full width on mobile, 7/12 on lg+
       */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row min-h-screen">

        {/* ── Branding column — hidden on mobile ─────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 flex-col justify-center px-12 xl:px-16 py-12">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col"
          >

            {/* Logo mark */}
            <div className="flex items-center gap-3 mb-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-sky-200"
                style={{ background: isManager ? '#4f46e5' : '#0284c7' }}
              >
                <span className="text-2xl font-extrabold text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  N
                </span>
              </div>
              <div>
                {/* Explicit text color — NO bg-clip-text, NO text-transparent */}
                <p className="text-xl font-extrabold text-slate-900 leading-tight">نوین‌تک</p>
                <p className="text-xs font-medium text-slate-400 tracking-widest">NOVIN TECH</p>
              </div>
            </div>

            {/* Hero headline — solid color, no gradient clip */}
            <h1 className="text-[38px] xl:text-[46px] font-extrabold text-slate-800 leading-[1.2] tracking-tight mb-5">
              سامانه هوشمند<br />مدیریت تماس
            </h1>

            <p className="text-base text-slate-600 font-medium leading-relaxed max-w-sm">
              هسته مرکزی نوین‌تک —&nbsp;
              <span className="font-bold text-slate-700">یکپارچگی و سرعت در پشتیبانی مشتریان</span>
            </p>

            {/* Status card */}
            <div className={`mt-10 flex items-center gap-4 bg-white rounded-2xl border p-5 max-w-[340px] transition-colors duration-300 ${isManager ? 'border-indigo-200' : 'border-slate-200'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isManager ? 'border-indigo-200 bg-indigo-50' : 'border-sky-200 bg-sky-50'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isManager ? 'bg-indigo-500' : 'bg-sky-500'}`}
                  style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              </div>
              <div>
                <p className="text-[14px] font-extrabold text-slate-800 leading-tight mb-0.5">
                  {isManager ? 'پنل مدیریت فعال' : 'سیستم عملیاتی آماده'}
                </p>
                <p className="text-[12px] text-slate-500 font-medium">اتصال ایمن به پایگاه داده</p>
              </div>
            </div>

          </motion.div>
        </div>

        {/* ── Form column ─────────────────────────────────────────── */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-16 lg:py-10">

          {/* Mobile logo — visible only on small screens */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 self-start">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-sky-200"
              style={{ background: isManager ? '#4f46e5' : '#0284c7' }}
            >
              <span className="text-base font-extrabold text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>N</span>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900">نوین‌تک</p>
              <p className="text-[11px] text-slate-400 font-medium tracking-widest">NOVIN TECH</p>
            </div>
          </div>

          <div className="w-full max-w-[460px] lg:max-w-[480px]">
            <AnimatePresence mode="wait">
              {panelMode === 'agent' ? (
                <motion.div
                  key="agent-panel"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
                >
                  <AgentPanel />
                </motion.div>
              ) : (
                <motion.div
                  key="mgr-panel"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
                >
                  <ManagerPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="mt-8 text-[11px] text-slate-400 font-medium text-center">
            نوین‌تک — سامانه هوشمند مدیریت تماس
          </p>
        </div>

      </div>
    </div>
  );
};

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
    <label htmlFor={id} className="text-[13.5px] font-bold text-stone-600 leading-none px-1">
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
          'w-full h-11 rounded-xl border px-4 text-sm font-medium text-stone-900',
          'bg-[#FAFAFA] placeholder:text-stone-400',
          'focus:outline-none focus:ring-2 transition-all',
          rightAddon ? 'pr-10' : '',
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
            : 'border-stone-200 hover:border-stone-300 focus:border-sky-500 focus:ring-sky-100',
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
    className="text-stone-400 hover:text-stone-600 transition-colors"
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
        py-3 rounded-xl font-semibold text-white text-sm
        transition-all active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed
        ${bg}
      `}
    >
      {loading
        ? <Loader2 size={18} className="animate-spin" />
        : <>
            <span>{label}</span>
            <ArrowLeft size={15} strokeWidth={2.5} className="group-hover:-transtone-x-0.5 transition-transform" />
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
    <div className="w-full bg-[#FAFAFA] rounded-[24px] border border-stone-300/60 overflow-hidden flex flex-col min-h-[480px]" style={{ maxHeight: 'calc(100vh - 48px)' }}>

      {/* Card header */}
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
            <UserCheck size={18} strokeWidth={2} className="text-sky-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-stone-400 leading-none mb-1">کارشناس تماس</p>
            <p className="text-[16px] font-bold text-stone-900 leading-none">ورود به حساب کاربری</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
          <Field label="ایمیل" id="asi-email" type="email" value={siEmail} onChange={setSiEmail}
            placeholder="example@novintech.ir" error={errors.siEmail} direction={direction}
            rightAddon={<Mail size={14} strokeWidth={2} className="text-stone-400" />} />
          <Field label="رمز عبور" id="asi-password" type={siShowPw ? 'text' : 'password'}
            value={siPassword} onChange={setSiPassword} placeholder="••••••••"
            error={errors.siPassword} direction={direction}
            rightAddon={<PwToggle show={siShowPw} onToggle={() => setSiShowPw(p => !p)} />} />
          <PrimaryButton loading={loading} label="ورود به پنل کارشناسی" id="asi-submit" color="sky" />
        </form>
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
    <div className="w-full bg-[#FAFAFA] rounded-[24px] border border-stone-300/60 overflow-hidden flex flex-col min-h-[480px]" style={{ maxHeight: 'calc(100vh - 48px)' }}>

      {/* Card header */}
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-stone-100 flex items-center justify-center">
            <Shield size={18} strokeWidth={2} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-stone-400 leading-none mb-1">مدیریت سیستم</p>
            <p className="text-[16px] font-bold text-stone-900 leading-none">ورود به پنل مدیریت</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <form onSubmit={handleSignIn} className="flex flex-col gap-4" noValidate>
        <Field label="ایمیل مدیر" id="mgr-email" type="email" value={email} onChange={setEmail}
          placeholder="manager@novintech.ir" error={errors.email} direction={direction}
          rightAddon={<Mail size={14} strokeWidth={2} className="text-stone-400" />} />
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
      className="relative flex w-full min-h-screen text-stone-900 overflow-x-hidden"
      dir={direction}
      style={{ backgroundColor: '#EFEDFA' }}
    >

      {/* Minimal Animated Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -30, 50, 0], y: [0, 30, -10, 0], scale: [1, 1.05, 0.9, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full"
          style={{ background: isManager ? 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)' }}
        />
      </div>



      {/* ── Form column (Centered) ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex flex-col justify-center items-center px-4 py-16 min-h-screen">

        {/* Creative Segmented Role Switcher */}
        <div className="mb-6 p-1.5 bg-stone-200/40 backdrop-blur-md rounded-2xl flex items-center gap-1.5 border border-stone-300/50">
          <button
            type="button"
            onClick={() => switchMode('agent')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
              !isManager ? 'bg-white text-sky-600 border border-stone-200' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50 border border-transparent'
            }`}
          >
            <UserCheck size={16} strokeWidth={2.5} />
            <span>کارشناس</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('manager')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
              isManager ? 'bg-white text-indigo-600 border border-stone-200' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50 border border-transparent'
            }`}
          >
            <Shield size={16} strokeWidth={2.5} />
            <span>مدیریت</span>
          </button>
        </div>

        <div className="w-full max-w-[400px] lg:max-w-[420px]">
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
          <p className="mt-8 text-[11px] text-stone-400 font-medium text-center">
            نوین‌تک — سامانه هوشمند مدیریت تماس
          </p>
        </div>
      </div>
  );
};

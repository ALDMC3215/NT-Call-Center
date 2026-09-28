/**
 * AuthScreen — Unified Full-Screen LetterGlitch Presentation Architecture
 *
 * Presentation Refactor:
 *  • Single-piece full-screen layout: Edge-to-edge LetterGlitch canvas background across the entire viewport.
 *  • Subtle centered dark vignette overlay for optimal contrast and readability.
 *  • Floating centered dark translucent glass card (dark glassmorphism).
 *  • Identical visual design for both Expert and Manager login pages.
 *  • Manager submit button now shares the exact same brand-green design as Expert login (no black override).
 *  • Complete preservation of existing form variables, validation, submit handlers, and Supabase auth calls.
 *  • Zero impact on Auth logic, Supabase backend, database, roles, or session management.
 */

import React, { useState } from 'react';
import { useAuth, LoginMode } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  UserCheck,
  Info,
} from 'lucide-react';
import { customToast as toast } from '../UI/toast';
import { AuthPageShell } from './AuthPageShell';
import { AuthFormField } from './AuthFormField';
import NTLogo from '../../NT Logo.svg';

const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'ایمیل معتبر وارد کنید.';

// ---------------------------------------------------------------------------
// Password Visibility Toggle Component
// ---------------------------------------------------------------------------
const PwToggle = ({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="text-stone-400 hover:text-stone-200 transition-colors p-1"
    tabIndex={-1}
    aria-label={show ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
  >
    {show ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
  </button>
);

// ---------------------------------------------------------------------------
// Unified Brand-Green Primary Submit Button (Zero Layout Shift)
// ---------------------------------------------------------------------------
const PrimarySubmitButton = ({
  loading,
  label,
  id,
}: {
  loading: boolean;
  label: string;
  id: string;
}) => {
  return (
    <button
      id={id}
      type="submit"
      disabled={loading}
      className="group relative w-full h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-[14px] text-white bg-[#006319] hover:bg-[#087c28] active:bg-[#005214] shadow-lg shadow-[#006319]/25 border border-emerald-400/25 transition-all duration-150 active:scale-[0.99] disabled:opacity-65 disabled:cursor-not-allowed select-none"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span>در حال ورود به سیستم...</span>
        </div>
      ) : (
        <>
          <span>{label}</span>
          <ArrowLeft
            size={16}
            strokeWidth={2.5}
            className="group-hover:-translate-x-1 transition-transform"
          />
        </>
      )}
    </button>
  );
};

// ---------------------------------------------------------------------------
// InfoBox Component (Manager note)
// ---------------------------------------------------------------------------
const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 text-[12px] font-medium text-emerald-300 leading-relaxed">
    <Info size={15} className="mt-0.5 shrink-0 text-emerald-400" />
    <span>{children}</span>
  </div>
);

// ---------------------------------------------------------------------------
// AgentPanel (صفحه ورود کارشناس)
// ---------------------------------------------------------------------------
const AgentPanel: React.FC = () => {
  const { signIn } = useAuth();
  const { direction } = useLocale();

  const [loading, setLoading] = useState(false);

  // Sign in state variables (100% preserved)
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErrors = () => setErrors({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    const errs: Record<string, string> = {};
    if (!siEmail) errs.siEmail = 'ایمیل الزامی است.';
    else {
      const r = validateEmail(siEmail);
      if (r) errs.siEmail = r;
    }
    if (!siPassword) errs.siPassword = 'رمز عبور الزامی است.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    const err = await signIn(siEmail.trim(), siPassword, 'agent');
    setLoading(false);
    if (err) toast.error(err);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Card Header */}
      <div className="flex flex-col gap-3 pb-5 border-b border-emerald-500/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-2 flex items-center justify-center shrink-0 shadow-inner">
            <img
              src={NTLogo}
              alt="نوین‌تک"
              className="w-full h-full object-contain filter invert brightness-0 contrast-200"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-extrabold text-white tracking-tight">
                نوین‌تک
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <UserCheck size={11} strokeWidth={2.5} />
                <span>کارشناس</span>
              </span>
            </div>
            <h1 className="text-[14.5px] font-bold text-stone-200 mt-0.5">
              ورود به پنل کارشناسی
            </h1>
          </div>
        </div>
        <p className="text-[12px] text-stone-400 font-medium leading-relaxed pr-0.5">
          برای مدیریت تماس‌ها و پیگیری مخاطبان وارد حساب خود شوید.
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSignIn} className="flex flex-col gap-5" noValidate>
        <AuthFormField
          label="ایمیل سازمانی"
          id="asi-email"
          type="email"
          value={siEmail}
          onChange={setSiEmail}
          placeholder="example@novintech.ir"
          error={errors.siEmail}
          direction={direction}
          autoComplete="username"
          disabled={loading}
          rightAddon={<Mail size={16} strokeWidth={2} className="text-stone-400" />}
        />

        <AuthFormField
          label="رمز عبور"
          id="asi-password"
          type={siShowPw ? 'text' : 'password'}
          value={siPassword}
          onChange={setSiPassword}
          placeholder="••••••••"
          error={errors.siPassword}
          direction={direction}
          autoComplete="current-password"
          disabled={loading}
          rightAddon={
            <PwToggle show={siShowPw} onToggle={() => setSiShowPw((p) => !p)} />
          }
        />

        <div className="pt-2">
          <PrimarySubmitButton
            loading={loading}
            label="ورود به پنل کارشناسی"
            id="asi-submit"
          />
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ManagerPanel (صفحه ورود مدیریت)
// ---------------------------------------------------------------------------
const ManagerPanel: React.FC = () => {
  const { signIn } = useAuth();
  const { direction } = useLocale();

  // Manager state variables (100% preserved)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'ایمیل الزامی است.';
    else {
      const r = validateEmail(email);
      if (r) errs.email = r;
    }
    if (!password) errs.password = 'رمز عبور الزامی است.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    const err = await signIn(email.trim(), password, 'manager');
    setLoading(false);
    if (err) toast.error(err);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Card Header */}
      <div className="flex flex-col gap-3 pb-5 border-b border-emerald-500/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-2 flex items-center justify-center shrink-0 shadow-inner">
            <img
              src={NTLogo}
              alt="نوین‌تک"
              className="w-full h-full object-contain filter invert brightness-0 contrast-200"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-extrabold text-white tracking-tight">
                نوین‌تک
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Shield size={11} strokeWidth={2.5} />
                <span>مدیریت</span>
              </span>
            </div>
            <h1 className="text-[14.5px] font-bold text-stone-200 mt-0.5">
              ورود به پنل مدیریت
            </h1>
          </div>
        </div>
        <p className="text-[12px] text-stone-400 font-medium leading-relaxed pr-0.5">
          برای دسترسی به ابزارهای مدیریتی و نظارت سیستم وارد شوید.
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSignIn} className="flex flex-col gap-5" noValidate>
        <AuthFormField
          label="ایمیل مدیر"
          id="mgr-email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="manager@novintech.ir"
          error={errors.email}
          direction={direction}
          autoComplete="username"
          disabled={loading}
          rightAddon={<Mail size={16} strokeWidth={2} className="text-stone-400" />}
        />

        <AuthFormField
          label="رمز عبور"
          id="mgr-password"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          error={errors.password}
          direction={direction}
          autoComplete="current-password"
          disabled={loading}
          rightAddon={
            <PwToggle show={showPw} onToggle={() => setShowPw((p) => !p)} />
          }
        />

        <InfoBox>
          ثبت‌نام عمومی برای پنل مدیریت وجود ندارد. حساب‌های مدیر توسط تیم فنی ایجاد و تأیید می‌شوند.
        </InfoBox>

        <div className="pt-1">
          <PrimarySubmitButton
            loading={loading}
            label="ورود به پنل مدیریت"
            id="mgr-submit"
          />
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main AuthScreen
// ---------------------------------------------------------------------------
export const AuthScreen: React.FC = () => {
  const { setLoginMode } = useAuth();

  // Support URL mode parameter if present, defaulting cleanly to 'agent'
  const [panelMode, setPanelMode] = useState<LoginMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode') || params.get('role');
      if (m === 'manager' || m === 'admin') return 'manager';
    }
    return 'agent';
  });

  const switchMode = (m: LoginMode) => {
    setPanelMode(m);
    setLoginMode(m);
  };

  return (
    <AuthPageShell role={panelMode} onRoleSwitch={switchMode}>
      <AnimatePresence mode="wait">
        {panelMode === 'agent' ? (
          <motion.div
            key="agent-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            <AgentPanel />
          </motion.div>
        ) : (
          <motion.div
            key="manager-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            <ManagerPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
};

import React from 'react';
import { LetterGlitch } from '../UI/LetterGlitch';
import { UserCheck, Shield } from 'lucide-react';

export interface AuthPageShellProps {
  role: 'agent' | 'manager';
  onRoleSwitch: (role: 'agent' | 'manager') => void;
  children: React.ReactNode;
}

export const AuthPageShell: React.FC<AuthPageShellProps> = ({
  role,
  onRoleSwitch,
  children,
}) => {
  const isManager = role === 'manager';

  return (
    <main
      className="relative w-full min-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 bg-[#000000] text-stone-100 overflow-x-hidden selection:bg-emerald-500/30"
      dir="rtl"
    >
      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. Full-screen LetterGlitch Background (Single instance, Edge-to-Edge) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none select-none z-0"
        aria-hidden="true"
      >
        <LetterGlitch
          glitchColors={['#006319', '#006319', '#000000']}
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          backgroundColor="#000000"
        />
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. Readability Overlay: Concentrated dark vignette behind card        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none z-[1]"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.48) 50%, rgba(0, 0, 0, 0.88) 100%)',
        }}
      />

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. Foreground Content: Floating Centered Dark Glass Card              */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[420px] my-auto flex flex-col items-center">
        {/* Unified Segmented Role Switcher */}
        <div
          className="mb-5 p-1 bg-stone-900/80 backdrop-blur-md rounded-2xl flex items-center gap-1 border border-emerald-500/20 shadow-lg shadow-black/60"
          role="tablist"
          aria-label="انتخاب نوع دسترسی"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isManager}
            onClick={() => onRoleSwitch('agent')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all ${
              !isManager
                ? 'bg-[#006319] text-white shadow-md shadow-[#006319]/30 border border-emerald-400/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <UserCheck size={15} strokeWidth={2.5} />
            <span>ورود کارشناس</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isManager}
            onClick={() => onRoleSwitch('manager')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all ${
              isManager
                ? 'bg-[#006319] text-white shadow-md shadow-[#006319]/30 border border-emerald-400/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Shield size={15} strokeWidth={2.5} />
            <span>ورود مدیریت</span>
          </button>
        </div>

        {/* Floating Dark Glass Card Container */}
        <section className="w-full bg-[#070e0a]/80 backdrop-blur-xl rounded-[24px] border border-emerald-500/20 shadow-2xl shadow-black/90 p-6 sm:p-8 flex flex-col gap-6">
          {children}
        </section>

        {/* Security & System Attribution */}
        <div className="mt-5 text-center">
          <p className="text-[11.5px] text-stone-400 font-medium tracking-wide">
            نوین‌تک — سامانه هوشمند مدیریت ارتباط با مخاطبان
          </p>
        </div>
      </div>
    </main>
  );
};

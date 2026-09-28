import React from 'react';
import { LetterGlitch } from '../UI/LetterGlitch';
import NTLogo from '../../NT Logo.svg';
import { Shield, UserCheck, CheckCircle2, Lock } from 'lucide-react';

export interface AuthVisualPanelProps {
  role: 'agent' | 'manager';
}

export const AuthVisualPanel: React.FC<AuthVisualPanelProps> = ({ role }) => {
  const isManager = role === 'manager';

  const glitchProps = isManager
    ? {
        glitchColors: ['#006319', '#0B3D1B', '#1F5130', '#111827', '#000000'],
        glitchSpeed: 90,
        backgroundColor: '#010302',
      }
    : {
        glitchColors: ['#006319', '#0A8F38', '#63B981', '#07140B', '#000000'],
        glitchSpeed: 75,
        backgroundColor: '#010503',
      };

  const roleBadgeText = isManager
    ? 'سامانه نظارت و راهبری مدیریت'
    : 'درگاه اختصاصی کارشناسان تماس';

  const roleDescription = isManager
    ? 'پایش یکپارچه عملیات، گزارش‌گیری پیشرفته و مدیریت سطوح دسترسی سازمانی'
    : 'دسترسی سریع، متمرکز و بهینه به چرخه تماس‌ها و پیگیری هدفمند مخاطبان';

  const featureItems = isManager
    ? [
        'نظارت زنده و بلادرنگ بر وضعیت تماس‌ها و شاخص‌های آماری',
        'مدیریت جامع کاربران، تأیید صلاحیت و پایش دسترسی‌ها',
        'گزارش‌گیری تحلیلی با قابلیت خروجی اکسل و داده‌های امن',
      ]
    : [
        'ثبت سریع و روان وضعیت مکالمات با رابط کاربری اختصاصی',
        'مدیریت هوشمند زمان‌بندی مشاوره‌ها و پیگیری‌های فعال',
        'تفکیک دقیق دوره‌های آموزشی و پرونده متقاضیان',
      ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none bg-stone-950 text-white">
      {/* 1. LetterGlitch Canvas Layer */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-0"
        aria-hidden="true"
        style={{ contain: 'layout paint', isolation: 'isolate' }}
      >
        <LetterGlitch
          glitchColors={glitchProps.glitchColors}
          glitchSpeed={glitchProps.glitchSpeed}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          backgroundColor={glitchProps.backgroundColor}
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}#@+/"
        />
      </div>

      {/* 2. Visual Overlay for RTL Contrast and Smooth Depth */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        aria-hidden="true"
        style={{
          background: isManager
            ? 'linear-gradient(135deg, rgba(3, 7, 18, 0.88) 0%, rgba(1, 5, 2, 0.72) 50%, rgba(2, 6, 23, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(1, 10, 4, 0.88) 0%, rgba(0, 0, 0, 0.7) 50%, rgba(1, 8, 3, 0.95) 100%)',
        }}
      />

      {/* Subtle border separating visual panel from form in split mode */}
      <div
        className="absolute top-0 bottom-0 left-0 w-px pointer-events-none z-[2] hidden lg:block bg-gradient-to-b from-transparent via-white/10 to-transparent"
        aria-hidden="true"
      />

      {/* 3. Visual Content - Header / Brand */}
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5 shadow-xl flex items-center justify-center group">
            <img
              src={NTLogo}
              alt="نوین‌تک"
              className="w-full h-full object-contain filter invert brightness-0 contrast-200"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[19px] font-extrabold tracking-tight text-white">
                نوین‌تک
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-stone-300">
                سیستم جامع
              </span>
            </div>
            <p className="text-[12px] font-medium text-stone-400 mt-0.5">
              سامانه هوشمند مدیریت ارتباط با مخاطبان
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/15 backdrop-blur-sm">
          {isManager ? (
            <Shield size={15} className="text-emerald-400 shrink-0" />
          ) : (
            <UserCheck size={15} className="text-emerald-400 shrink-0" />
          )}
          <span className="text-[12.5px] font-bold text-stone-200">
            {roleBadgeText}
          </span>
        </div>
      </div>

      {/* 4. Visual Content - Middle Highlight Statement */}
      <div className="relative z-10 my-auto py-8 flex flex-col gap-5 max-w-lg">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-normal">
          {isManager ? (
            <>
              کنترل یکپارچه، پایش لحظه‌ای و <br />
              <span className="text-emerald-400">راهبری هوشمند تماس‌ها</span>
            </>
          ) : (
            <>
              تمرکز کامل بر ارتباط مؤثر و <br />
              <span className="text-emerald-400">پیشبرد حرفه‌ای مکالمات</span>
            </>
          )}
        </h2>

        <p className="text-[13.5px] sm:text-[14px] text-stone-300 font-medium leading-relaxed">
          {roleDescription}
        </p>

        <ul className="flex flex-col gap-2.5 mt-2">
          {featureItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-[12.5px] text-stone-300 font-medium">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Visual Content - Footer Security Note */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400 font-medium">
        <div className="flex items-center gap-2">
          <Lock size={13} className="text-emerald-400" />
          <span>ارتباط امن رمزنگاری‌شده (SSL / 256-Bit)</span>
        </div>
        <span className="text-stone-500 font-semibold dir-ltr">v0.1.13</span>
      </div>
    </div>
  );
};

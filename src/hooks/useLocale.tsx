import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'fa' | 'en';

const VALUE_TRANSLATIONS: Record<string, string> = {
  "پاسخ داد": "Answered",
  "پاسخ نداد": "No answer",
  "در دسترس نیست": "Unavailable",
  "مشغول بود": "Busy",
  "دستگاه خاموش": "Device off",
  "بعداً تماس بگیرید": "Call back later",
  "نیازمند پیگیری": "Follow-up needed",
  "عدم تمایل قطعی": "Not interested",
  "ارسال شد": "Sent",
  "ارسال نشد": "Not sent",
  "عدم تمایل": "Not interested",
  "شماره ناموجود": "Invalid number",
  "طراحی وبسایت": "Web design",
  "برنامه نویسی": "Programming",
  "پایتون": "Python",
  "هوش مصنوعی": "Artificial intelligence",
  "اپلیکیشن نویسی": "App development",
  "طراحی UI/UX": "UI/UX design",
  "بله": "Yes",
  "خیر": "No",
  "هماهنگی بعدا": "Schedule later",
  "ثبت نام کرد": "Registered",
  "ثبت نام نکرد": "Not registered",
  "قصد دارد": "Intends to",
  "در آینده": "In the future",
  "احتمالا": "Probably",
  "قصد ندارد": "Does not intend to",
  "در حال بررسی": "Considering",
  "نامشخص": "Unknown",
  "پیگیری مجدد در هفته آینده": "Follow-up next week"
};

interface LocaleContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  isFa: boolean;
  direction: 'rtl' | 'ltr';
  tr: (fa: string, en: string) => string;
  valueLabel: (value: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fa');
  const isFa = true;

  const setLanguage = (next: Language) => {
    localStorage.setItem('novintech_language', next);
    setLanguageState(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = isFa ? 'rtl' : 'ltr';
    root.classList.toggle('lang-fa', isFa);
    root.classList.toggle('lang-en', !isFa);
  }, [language, isFa]);

  const value = useMemo<LocaleContextValue>(() => ({
    language,
    setLanguage,
    isFa,
    direction: isFa ? 'rtl' : 'ltr',
    tr: (fa, en) => isFa ? fa : en,
    valueLabel: value => isFa ? value : (VALUE_TRANSLATIONS[value] || value)
  }), [language, isFa]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
};

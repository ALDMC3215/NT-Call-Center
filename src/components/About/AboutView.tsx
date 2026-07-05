import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { BookOpen, CheckCircle2, Phone, Calendar, CheckSquare, Info, Shield, LayoutGrid, Clock, PhoneOff, Settings, ListTodo, Sun, Moon } from 'lucide-react';
import { SCHEDULE_DATA } from '../../data/schedule';

export const AboutView = () => {
  const { layoutMargin } = useAppContext();
  const { direction, tr } = useLocale();

  const rules = [
    'وظایف کارشناسان مطابق قرارداد مشخص بوده و زمان استراحت ۴۰ دقیقه می‌باشد که در صورت استفاده به پایان وقت کاری شما اضافه می‌شود.',
    'فضای اختصاص داده شده برای کارشناس، دو میز کار در لابی هست که فقط در صورت پر بودن می‌توانید از فضای کلاس ۵ استفاده نمایید.',
    'هیچ‌گونه جابه‌جایی و تغییر ساعت در دستیاری و کارشناسی مجاز نبوده و در صورت ایجاد مشکل برخورد خواهد شد.',
    'تمام هماهنگی‌های کارشناسان ۳ روز اول هفته با آقایان "اسماعیلی" و "شایقی فرد" و ۳ روز آخر هفته آقای "علی فرقانی" و خانم "کیمیا زارعی" می‌باشد؛ لذا از هرگونه ارتباط مستقیم جهت امور کارشناسی بپرهیزید.',
    'جهت استراحت و صرف غذا به هیچ عنوان از فضای کلاس‌ها استفاده نکنید، بلکه از اتاق استراحت و حیاط استفاده کنید.',
    'کارشناس مستقر اول هفته آقای امیر حسین مسرور و آخر هفته آقای پارسا رابعی نیا می‌باشند. کارشناسان جدید جهت آموزش به آنها مراجعه نمایند.',
    'لطفا پوشش مناسب، عفت کلام و آراستگی ظاهری را حفظ نمایید. در ضمن همیشه در دسترس باشید؛ اگر از موسسه با شما تماسی برقرار شد و پاسخگو نبودید به محض مطلع شدن تماس بگیرید.',
    'دستیاران و اساتید ۱۵ دقیقه قبل از شروع کلاس در مجموعه حضور داشته باشید.',
    'جهت تماس تلفنی فقط از خطوط VOIP استفاده کنید؛ در صورت قطع بودن، برای تماس مستقیم از خطوط شرکت کسب اجازه کنید.'
  ];

  return (
    <div className="w-full h-full pt-4 md:pt-6 pb-32 px-4 md:px-8 overflow-y-auto hide-scrollbar bg-[#f8f9fa]">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8" dir={direction}>

        {/* Compact Header */}
        <div className="w-full flex items-center gap-4 mb-2 opacity-0 animate-fade-in-up">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-sm border border-slate-200 shrink-0">
             <BookOpen size={28} className="text-cyan-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              {tr('راهنمای جامع پنل نوین تک', 'Novin Tech Panel Guide')}
            </h2>
            <p className="text-[14px] text-slate-500 font-medium">
              {tr('این صفحه به شما کمک می‌کند تا جریان کار سیستم، روند ثبت فعالیت‌ها و قوانین کاری را بهتر بشناسید.', 'This page helps you understand the system workflow, activity registration process, and workplace rules.')}
            </p>
          </div>
        </div>

        {/* Quick Start Workflow */}
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm opacity-0 animate-fade-in-up stagger-1">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckSquare className="text-emerald-500" size={18} />
            </div>
            شروع سریع (جریان کار)
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {[
              { title: 'بررسی شماره‌ها', icon: Phone },
              { title: 'ثبت نتیجه تماس', icon: CheckCircle2 },
              { title: 'تعیین زمان پیگیری', icon: Calendar },
              { title: 'تکمیل پیگیری‌ها', icon: ListTodo },
            ].map((step, i) => (
              <div key={i} className="flex-1 w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100 relative group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm font-black border border-slate-200 text-base shrink-0 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 text-[15px]">{step.title}</span>
                </div>
                {i < 3 && <div className="hidden md:block absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-slate-300 z-10"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Info Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-0 animate-fade-in-up stagger-2">

          {/* منطق ثبت تماس و فعالیت */}
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Info className="text-blue-500" size={18} />
              </div>
              منطق ثبت تماس و فعالیت
            </h3>
            <ul className="space-y-4 text-[14px] text-slate-700 font-medium leading-relaxed">
              <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>تغییر گزینه‌های فرم (مثل دوره‌ها، وضعیت، یادداشت) به تنهایی تماس محسوب <strong>نمی‌شود</strong>.</span></li>
              <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>فقط با کلیک روی دکمه <strong>«ثبت نتیجه»</strong> یک تلاش (Attempt) واقعی ثبت می‌شود.</span></li>
              <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>پس از ثبت نهایی، تماس در <strong>فعالیت روزانه</strong> قرار می‌گیرد.</span></li>
              <li className="flex gap-3 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>در آمار مدیران، هر ثبت نتیجه به عنوان یک تلاش جداگانه محاسبه می‌شود.</span></li>
            </ul>
          </div>

          {/* پیگیری‌ها چگونه کار می‌کنند؟ */}
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="text-amber-500" size={18} />
              </div>
              پیگیری‌ها چگونه کار می‌کنند؟
            </h3>
            <p className="text-[14px] text-slate-700 font-medium leading-relaxed mb-4">
              پیگیری‌ها برای شماره‌هایی است که هنوز نتیجه نهایی آن‌ها مشخص نیست. وضعیت‌های <strong>غیر قطعی</strong> در لیست باقی می‌مانند.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-[13px] text-amber-800 font-bold shadow-sm">
              نکته مهم: تغییر گزینه‌ها به‌تنهایی پیگیری را نمی‌بندد؛ ثبت نتیجه نهایی لازم است.
            </div>
            <p className="text-[14px] text-slate-700 font-medium leading-relaxed">
              ثبت وضعیت‌های قطعی مثل <span className="font-bold">«ثبت نام کرد»</span>، <span className="font-bold">«ثبت نام نکرد»</span> یا <span className="font-bold">«قصد ندارد»</span>، پیگیری را می‌بندد و آن را به بخش عملکرد شما اضافه می‌کند.
            </p>
          </div>
        </div>

        {/* بخش‌های اصلی پنل */}
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm opacity-0 animate-fade-in-up stagger-3">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <LayoutGrid className="text-indigo-500" size={18} />
            </div>
            بخش‌های اصلی پنل
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'لیست شماره', icon: Phone, desc: 'لیست اصلی مخاطبین برای تماس اولیه.' },
              { title: 'پیگیری ها', icon: ListTodo, desc: 'مخاطبینی که نیاز به تماس مجدد دارند.' },
              { title: 'دوره‌ها', icon: BookOpen, desc: 'مشاهده قیمت و جزئیات دوره‌های آموزشی.' },
              { title: 'فعالیت روزانه', icon: Calendar, desc: 'گزارش تماس‌ها و عملکردهای روز جاری.' },
              { title: 'لیست سیاه', icon: PhoneOff, desc: 'شماره‌های مسدود شده و غیرقابل تماس.' },
              { title: 'تنظیمات', icon: Settings, desc: 'ورود فایل، خروجی و ابزارهای داده.' }
            ].map((section, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100 rounded-xl group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shrink-0 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                  <section.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[15px]">{section.title}</h4>
                  <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">{section.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* داده‌ها و منطق برنامه */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm opacity-0 animate-fade-in-up stagger-4">
          <h3 className="text-[17px] font-bold text-slate-800 mb-6 flex items-center justify-start gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-blue-50 flex items-center justify-center">
              <Shield className="text-blue-500" size={20} strokeWidth={1.5} />
            </div>
            داده‌ها و منطق برنامه
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-slate-600 font-medium leading-[2.2] px-2">
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[14px] shrink-0"></div>
              <p>اطلاعات مخاطبین و تاریخچه تماس‌ها در سیستم ابری ذخیره می‌شوند و با <strong>رفرش کردن صفحه</strong> پاک نمی‌شوند.</p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[14px] shrink-0"></div>
              <p>هر کارشناس تنها لیست کارهای اختصاصی خود را می‌بیند.</p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[14px] shrink-0"></div>
              <p>مدیران از طریق داشبورد، آمار تماس‌ها و وضعیت کارشناسان را نظارت می‌کنند.</p>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-[14px] shrink-0"></div>
              <p>زمان‌بندی پیگیری‌ها در حال حاضر به صورت لایه موقت محلی روی مرورگر عمل می‌کند.</p>
            </li>
          </ul>
        </div>

        {/* قوانین و نکات کاری */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm opacity-0 animate-fade-in-up stagger-5">
          <h3 className="text-[17px] font-bold text-slate-800 mb-8 flex items-center justify-center gap-3">
            قوانین و نکات کاری
            <div className="w-10 h-10 rounded-[14px] bg-rose-50 flex items-center justify-center">
              <Info className="text-rose-500" size={20} strokeWidth={1.5} />
            </div>
          </h3>
          <div className="flex flex-col gap-4">
            {rules.map((rule, idx) => (
              <div key={idx} className="relative flex items-center justify-center min-h-[70px] p-4 bg-slate-50/60 hover:bg-slate-50 transition-colors border border-slate-100 rounded-[1.5rem]">
                <div className="absolute right-4 w-9 h-9 rounded-xl bg-rose-100/60 text-rose-500 flex items-center justify-center font-bold text-[14px] shadow-sm">
                  {idx + 1}
                </div>
                <p className="text-[14px] text-slate-600 font-medium text-center px-14 leading-[2.2]">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* برنامه شیفت کارشناسان */}
        <div className="bg-white/40 border border-slate-200/60 rounded-[2rem] p-6 md:p-8 shadow-sm opacity-0 animate-fade-in-up stagger-5 backdrop-blur-sm">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center shadow-md">
                  <Calendar className="text-white" size={24} />
                </div>
                برنامه شیفت کارشناسان
              </h3>
              <p className="text-[14px] text-slate-500 font-medium mr-[60px]">جدول حضور کارشناسان در شیفت‌های مختلف کاری</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2"><Sun size={16} className="text-amber-500"/><span className="text-[12px] font-bold text-slate-600">صبح (8:30 تا 14:30)</span></div>
               <div className="w-px h-5 bg-slate-200"></div>
               <div className="flex items-center gap-2"><Moon size={16} className="text-indigo-500"/><span className="text-[12px] font-bold text-slate-600">عصر (14:30 تا 21:00)</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {SCHEDULE_DATA.map((row, i) => (
              <div key={i} className="relative flex flex-col md:flex-row bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                
                {/* Unified top gradient line for the entire row */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-400 via-fuchsia-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Day Name Column */}
                <div className="md:w-[20%] p-4 md:p-6 flex items-center justify-center border-b md:border-b-0 border-slate-100 bg-slate-50/30 group-hover:bg-slate-50/60 transition-colors">
                  <span className="text-[17px] font-bold text-slate-700">{row.dayName}</span>
                </div>

                {/* Morning Shift */}
                <div className="md:w-[40%] p-5 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="flex flex-wrap gap-3 justify-center w-full">
                    {row.morning.map((name, idx) => (
                      <div key={idx} className="flex items-center bg-white border border-amber-300 px-4 py-2 rounded-full text-[14px] font-bold text-amber-600 cursor-default hover:bg-amber-50 hover:border-amber-400 transition-all shadow-[0_1px_2px_rgb(251,191,36,0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-2 shadow-sm"></div>
                        {name}
                      </div>
                    ))}
                    {row.morning.length === 0 && <span className="text-[14px] text-slate-400 font-medium py-2">بدون کارشناس</span>}
                  </div>
                </div>

                {/* Evening Shift */}
                <div className="md:w-[40%] p-5 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="flex flex-wrap gap-3 justify-center w-full">
                    {row.evening.map((name, idx) => (
                      <div key={idx} className="flex items-center bg-white border border-indigo-300 px-4 py-2 rounded-full text-[14px] font-bold text-indigo-600 cursor-default hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-[0_1px_2px_rgb(99,102,241,0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-2 shadow-sm"></div>
                        {name}
                      </div>
                    ))}
                    {row.evening.length === 0 && <span className="text-[14px] text-slate-400 font-medium py-2">بدون کارشناس</span>}
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                <span className="font-black text-[15px]">اول</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-400">کارشناس ثابت اول هفته</span>
                <span className="text-[14px] font-bold text-slate-700">امیرحسین مسرور</span>
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-100"></div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <span className="font-black text-[15px]">آخر</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-400">کارشناس ثابت آخر هفته</span>
                <span className="text-[14px] font-bold text-slate-700">پارسا رابعی نیا</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

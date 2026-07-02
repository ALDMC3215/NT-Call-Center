import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { BookOpen, CheckCircle2, Phone, Calendar, CheckSquare, Info, Shield, LayoutGrid, Clock, PhoneOff, Settings, ListTodo } from 'lucide-react';
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
    <div className="w-full h-full pt-6 pb-32 overflow-y-auto hide-scrollbar bg-slate-100" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      <div className="w-full flex flex-col gap-6 px-4 md:px-6 lg:px-8" dir={direction}>

        {/* Compact Header */}
        <div className="w-full flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-800 shadow-sm border border-slate-200 shrink-0">
             <BookOpen size={20} className="text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {tr('راهنمای جامع پنل نوین تک', 'Novin Tech Panel Guide')}
            </h2>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">
              {tr('این صفحه به شما کمک می‌کند تا جریان کار سیستم، روند ثبت فعالیت‌ها و قوانین کاری را بهتر بشناسید.', 'This page helps you understand the system workflow, activity registration process, and workplace rules.')}
            </p>
          </div>
        </div>

        {/* Quick Start Workflow */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckSquare className="text-emerald-500" size={16} />
            شروع سریع (جریان کار)
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-3">
            {[
              { title: 'بررسی شماره‌ها', icon: Phone },
              { title: 'ثبت نتیجه تماس', icon: CheckCircle2 },
              { title: 'تعیین زمان پیگیری', icon: Calendar },
              { title: 'تکمیل پیگیری‌ها', icon: ListTodo },
            ].map((step, i) => (
              <div key={i} className="flex-1 w-full flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-100 relative group">
                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-emerald-600 shadow-sm font-black border border-slate-200 text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 text-[14px]">{step.title}</span>
                </div>
                {i < 3 && <div className="hidden md:block absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-slate-200 z-10"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Info Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* منطق ثبت تماس و فعالیت */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Info className="text-blue-500" size={16} />
              منطق ثبت تماس و فعالیت
            </h3>
            <ul className="space-y-3 text-[13px] text-slate-700 font-medium leading-relaxed">
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><span>تغییر گزینه‌های فرم (مثل دوره‌ها، وضعیت، یادداشت) به تنهایی تماس محسوب <strong>نمی‌شود</strong>.</span></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><span>فقط با کلیک روی دکمه <strong>«ثبت نتیجه»</strong> یک تلاش (Attempt) واقعی ثبت می‌شود.</span></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><span>پس از ثبت نهایی، تماس در <strong>فعالیت امروز</strong> قرار می‌گیرد.</span></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><span>در آمار مدیران، هر ثبت نتیجه به عنوان یک تلاش جداگانه محاسبه می‌شود.</span></li>
            </ul>
          </div>

          {/* پیگیری‌ها چگونه کار می‌کنند؟ */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="text-amber-500" size={16} />
              پیگیری‌ها چگونه کار می‌کنند؟
            </h3>
            <p className="text-[13px] text-slate-700 font-medium leading-relaxed mb-3">
              پیگیری‌ها برای شماره‌هایی است که هنوز نتیجه نهایی آن‌ها مشخص نیست. وضعیت‌های <strong>غیر قطعی</strong> در لیست باقی می‌مانند.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3 text-[13px] text-amber-800 font-bold">
              نکته مهم: تغییر گزینه‌ها به‌تنهایی پیگیری را نمی‌بندد؛ ثبت نتیجه نهایی لازم است.
            </div>
            <p className="text-[13px] text-slate-700 font-medium leading-relaxed">
              ثبت وضعیت‌های قطعی مثل <span className="font-bold">«ثبت نام کرد»</span>، <span className="font-bold">«ثبت نام نکرد»</span> یا <span className="font-bold">«قصد ندارد»</span>، پیگیری را می‌بندد و آن را به بخش عملکرد شما اضافه می‌کند.
            </p>
          </div>
        </div>

        {/* بخش‌های اصلی پنل */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <LayoutGrid className="text-indigo-500" size={16} />
            بخش‌های اصلی پنل
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: 'شماره‌ها', icon: Phone, desc: 'لیست اصلی مخاطبین برای تماس اولیه.' },
              { title: 'پیگیری‌ها', icon: ListTodo, desc: 'مخاطبینی که نیاز به تماس مجدد دارند.' },
              { title: 'دوره‌ها', icon: BookOpen, desc: 'مشاهده قیمت و جزئیات دوره‌های آموزشی.' },
              { title: 'فعالیت امروز', icon: Calendar, desc: 'گزارش تماس‌ها و عملکردهای روز جاری.' },
              { title: 'لیست سیاه', icon: PhoneOff, desc: 'شماره‌های مسدود شده و غیرقابل تماس.' },
              { title: 'تنظیمات', icon: Settings, desc: 'ورود فایل، خروجی و ابزارهای داده.' }
            ].map((section, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-slate-50 border border-slate-100 rounded-md">
                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-indigo-500 shrink-0 shadow-sm border border-slate-100">
                  <section.icon size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[14px]">{section.title}</h4>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">{section.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* داده‌ها و منطق برنامه */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Shield className="text-blue-500" size={16} />
              داده‌ها و منطق برنامه
            </h3>
            <ul className="space-y-3 text-[13px] text-slate-700 font-medium leading-relaxed">
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><p>اطلاعات مخاطبین و تاریخچه تماس‌ها در سیستم ابری ذخیره می‌شوند و با <strong>رفرش کردن صفحه</strong> پاک نمی‌شوند.</p></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><p>هر کارشناس تنها لیست کارهای اختصاصی خود را می‌بیند.</p></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><p>مدیران از طریق داشبورد، آمار تماس‌ها و وضعیت کارشناسان را نظارت می‌کنند.</p></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div><p>زمان‌بندی پیگیری‌ها در حال حاضر به صورت لایه موقت محلی روی مرورگر عمل می‌کند.</p></li>
            </ul>
          </div>

          {/* قوانین و نکات کاری */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Info className="text-rose-500" size={16} />
              قوانین و نکات کاری
            </h3>
            <div className="flex flex-col gap-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-md">
                  <div className="w-5 h-5 rounded bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-[13px] text-slate-700 font-medium leading-relaxed pt-1">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* برنامه شیفت کارشناسان */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Calendar className="text-brand-500" size={16} />
              برنامه شیفت کارشناسان
            </h3>
          </div>

          <div className="w-full overflow-x-auto pb-4">
            <table className="w-full text-right text-[14px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-bold border-l border-slate-200 w-1/4">روزهای هفته</th>
                  <th className="py-3 px-4 font-bold border-l border-slate-200">
                    <span className="ml-2">شیفت صبح</span>
                    <span className="text-[11px] font-medium" dir="ltr">8:30 - 14:30</span>
                  </th>
                  <th className="py-3 px-4 font-bold">
                    <span className="ml-2">شیفت عصر</span>
                    <span className="text-[11px] font-medium" dir="ltr">14:30 - 21:00</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {SCHEDULE_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-extrabold text-[13px] bg-slate-50/50 border-l border-slate-200">
                      {row.dayName}
                    </td>
                    <td className="py-2.5 px-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {row.morning.map((name, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 px-2.5 py-1 rounded text-[12px] font-bold shadow-sm">{name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap gap-2">
                        {row.evening.map((name, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 px-2.5 py-1 rounded text-[12px] font-bold shadow-sm">{name}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

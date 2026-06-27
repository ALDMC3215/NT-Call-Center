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
    <div className="w-full h-full pt-4 pb-32 overflow-y-auto hide-scrollbar bg-slate-50" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      <div className="w-full flex flex-col max-w-5xl mx-auto" dir={direction}>

        {/* Compact Hero */}
        <div className="flex flex-col items-center w-full mb-10 mt-6 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-800 mb-5 shadow-sm border border-slate-200">
             <BookOpen size={32} className="text-cyan-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            {tr('راهنمای جامع پنل نوین تک', 'Novin Tech Panel Guide')}
          </h2>
          <p className="text-[15px] font-bold text-cyan-700 bg-cyan-50 px-4 py-1.5 rounded-full mb-4">
            {tr('راهنمای استفاده، منطق ثبت فعالیت‌ها و نکات کاری کارشناسان', 'Usage guide, activity logic, and expert rules')}
          </p>
          <p className="text-[14px] text-slate-600 max-w-2xl leading-relaxed">
            {tr('این صفحه به شما کمک می‌کند تا از سیستم به درستی استفاده کنید، جریان کار و منطق ثبت فعالیت‌های روزانه خود را بشناسید و از قوانین محیط کاری مطلع باشید.', 'This page helps you use the system correctly, understand your daily activity logic, and stay informed about workplace rules.')}
          </p>
        </div>

        {/* Quick Start Workflow */}
        <div className="mb-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 relative z-10 flex items-center gap-2">
            <CheckSquare className="text-emerald-500" size={20} />
            شروع سریع (جریان کار)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {[
              { title: 'شماره‌ها را بررسی کن', icon: Phone },
              { title: 'نتیجه تماس را ثبت کن', icon: CheckCircle2 },
              { title: 'برای پیگیری‌ها زمان مشخص کن', icon: Calendar },
              { title: 'پیگیری‌های باز را کامل کن', icon: ListTodo },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm font-black border border-slate-200">
                  {i + 1}
                </div>
                <span className="font-extrabold text-slate-700 text-[14px]">{step.title}</span>
                {i < 3 && <div className="hidden md:block absolute left-[-16px] top-1/2 -translate-y-1/2 w-8 h-[2px] bg-slate-200"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Info Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* منطق ثبت تماس و فعالیت */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="text-blue-500" size={20} />
              منطق ثبت تماس و فعالیت
            </h3>
            <ul className="space-y-3 text-[14px] text-slate-700 font-medium leading-relaxed">
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>تغییر گزینه‌های فرم (مثل دوره‌ها، وضعیت، یادداشت) به تنهایی تماس محسوب <strong>نمی‌شود</strong>.</span></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>فقط با کلیک روی دکمه <strong>«ثبت نتیجه»</strong> یک تلاش (Attempt) واقعی ثبت می‌شود.</span></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>پس از ثبت نهایی، تماس در <strong>فعالیت امروز</strong> قرار می‌گیرد.</span></li>
              <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span>در آمار مدیران، یک شماره تکراری فقط ۱ بار در روز محاسبه می‌شود، اما <strong>هر ثبت نتیجه</strong> به عنوان یک تلاش جداگانه برای عملکرد شما ثبت می‌گردد.</span></li>
            </ul>
          </div>

          {/* پیگیری‌ها چگونه کار می‌کنند؟ */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="text-amber-500" size={20} />
              پیگیری‌ها چگونه کار می‌کنند؟
            </h3>
            <p className="text-[14px] text-slate-700 font-medium leading-relaxed mb-4">
              پیگیری‌ها برای شماره‌هایی است که هنوز نتیجه نهایی آن‌ها مشخص نیست. وضعیت‌های <strong>غیر قطعی</strong> در لیست باقی می‌مانند.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[13px] text-amber-800 font-bold">
              نکته مهم: تغییر گزینه‌ها به‌تنهایی پیگیری را نمی‌بندد؛ ثبت نتیجه نهایی لازم است.
            </div>
            <p className="text-[14px] text-slate-700 font-medium leading-relaxed">
              ثبت وضعیت‌های قطعی مثل <span className="font-bold">«ثبت نام کرد»</span>، <span className="font-bold">«ثبت نام نکرد»</span> یا <span className="font-bold">«قصد ندارد»</span> به همراه «ثبت نتیجه»، پیگیری را می‌بندد و آن را به «فعالیت امروز» منتقل می‌کند.
            </p>
          </div>

        </div>

        {/* بخش‌های اصلی پنل */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <LayoutGrid className="text-indigo-500" size={20} />
            بخش‌های اصلی پنل
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: 'شماره‌ها', icon: Phone, desc: 'لیست اصلی مخاطبین برای تماس اولیه.' },
              { title: 'پیگیری‌ها', icon: ListTodo, desc: 'مخاطبینی که نیاز به تماس مجدد دارند.' },
              { title: 'دوره‌ها', icon: BookOpen, desc: 'مشاهده قیمت و جزئیات دوره‌های آموزشی.' },
              { title: 'فعالیت امروز', icon: Calendar, desc: 'گزارش تماس‌ها و عملکردهای روز جاری.' },
              { title: 'لیست سیاه', icon: PhoneOff, desc: 'شماره‌های مسدود شده و غیرقابل تماس.' },
              { title: 'تنظیمات', icon: Settings, desc: 'ورود فایل، خروجی و ابزارهای داده.' }
            ].map((section, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shrink-0 shadow-sm border border-slate-100">
                  <section.icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[14px]">{section.title}</h4>
                  <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">{section.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* داده‌ها و منطق برنامه */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
            <Shield className="text-blue-500" size={20} />
            داده‌ها و منطق برنامه
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></div>
              <p className="text-[14px] text-slate-700 font-medium leading-relaxed">اطلاعات مخاطبین و تاریخچه تماس‌ها در سیستم ابری ذخیره می‌شوند و با <strong>رفرش کردن صفحه</strong> پاک نمی‌شوند.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></div>
              <p className="text-[14px] text-slate-700 font-medium leading-relaxed">هر کارشناس تنها لیست کارهای اختصاصی خود را می‌بیند.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></div>
              <p className="text-[14px] text-slate-700 font-medium leading-relaxed">مدیران از طریق داشبورد، آمار تماس‌ها و وضعیت آنلاین بودن کارشناسان را نظارت می‌کنند.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></div>
              <p className="text-[14px] text-slate-700 font-medium leading-relaxed">زمان‌بندی پیگیری‌ها در حال حاضر به صورت لایه موقتِ محلی روی مرورگر کارشناس عمل می‌کند تا در به‌روزرسانی‌های بعدی به سیستم ابری متصل شود.</p>
            </div>
          </div>
        </div>

        {/* قوانین و نکات کاری */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-8">
          <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Info className="text-rose-500" size={20} />
            قوانین و نکات کاری
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 text-sm">
                  {idx + 1}
                </div>
                <p className="text-[14px] text-slate-700 font-medium leading-relaxed text-justify pt-0.5">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* برنامه شیفت کارشناسان */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-lg font-extrabold text-slate-800 mb-1 flex items-center gap-2">
              <Calendar className="text-brand-500" size={20} />
              برنامه شیفت کارشناسان
            </h3>
            <p className="text-[13px] text-slate-500 font-medium">برای هماهنگی حضور و پاسخگویی، برنامه شیفت‌ها را پیش از شروع کار بررسی کنید.</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[600px] text-center">
              <thead>
                <tr>
                  <th className="py-4 px-4 bg-slate-100 border-b border-slate-200 text-slate-700 w-1/4">
                    <span className="font-extrabold text-[15px]">روزهای هفته</span>
                  </th>
                  <th className="py-4 px-4 bg-slate-100 border-b border-slate-200 w-[37.5%] border-r border-slate-200">
                    <div className="font-extrabold text-slate-700 text-[15px] mb-1">شیفت صبح</div>
                    <div className="text-[12px] text-slate-500 font-bold" dir="ltr">8:30 - 14:30</div>
                  </th>
                  <th className="py-4 px-4 bg-slate-100 border-b border-slate-200 w-[37.5%] border-r border-slate-200">
                    <div className="font-extrabold text-slate-700 text-[15px] mb-1">شیفت عصر</div>
                    <div className="text-[12px] text-slate-500 font-bold" dir="ltr">14:30 - 21:00</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SCHEDULE_DATA.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-extrabold text-slate-800 text-[14px] bg-slate-50/30">
                      {row.dayName}
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        {row.morning.map((name, idx) => (
                          <span key={idx} className="text-slate-700 font-bold text-[14px] bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm min-w-[120px]">{name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100">
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        {row.evening.map((name, idx) => (
                          <span key={idx} className="text-slate-700 font-bold text-[14px] bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm min-w-[120px]">{name}</span>
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

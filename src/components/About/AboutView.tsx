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
              {tr('راهنمای سیستم', 'System Guide')}
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

        {/* Logic Blocks Grid */}
        <div className="grid grid-cols-1 gap-6 opacity-0 animate-fade-in-up stagger-2">

          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Info className="text-blue-500" size={18} />
              </div>
              قوانین جدید سیستم و نحوه انجام کار
            </h3>
            <div className="space-y-6 text-[14px] text-slate-700 font-medium leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">۱. جستجو و یافتن شماره‌ها</h4>
                <p>در لیست اصلی (شماره‌ها)، پیگیری‌ها و فعالیت‌ها می‌توانید با استفاده از <strong>جعبه جستجو (Search Box)</strong> بالای لیست، شماره مورد نظر خود را به سرعت پیدا کنید. این جستجو روی شماره تلفن‌ها انجام می‌شود.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">۲. روند ثبت نتیجه تماس</h4>
                <p>برای هر شماره، ابتدا باید <strong>نتیجه تماس</strong> (پاسخ داد، پاسخ نداد، اشغال، خاموش و غیره) را مشخص کنید.</p>
                <ul className="list-disc pr-5 mt-2 space-y-1 text-slate-600">
                  <li>اگر مخاطب <strong>پاسخ داد</strong>، باید مشخص کنید که <strong>مشاوره حضوری</strong> می‌خواهد یا خیر.</li>
                  <li>در صورت تمایل به مشاوره حضوری («بله»)، گزینه‌های انتخاب <strong>تاریخ</strong>، <strong>ساعت</strong> و تیک <strong>«در دفتر نوشته شد»</strong> برای شما نمایش داده می‌شود.</li>
                  <li>می‌توانید <strong>وضعیت ثبت‌نام</strong> مخاطب را نیز به طور دقیق مشخص کنید (ثبت‌نام کرد، قطعی نیست، قصد ندارد، ...).</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">۳. دکمه «ثبت نتیجه» (تیک سبز)</h4>
                <p>تغییر گزینه‌های فرم (مثل دوره‌ها، وضعیت، یادداشت) روی سیستم ذخیره می‌شود، اما تا زمانی که روی دکمه <strong>«ثبت نتیجه» (تیک سبز)</strong> کلیک نکنید، گزارش تماس شما (Attempt) ثبت نهایی <strong>نمی‌شود</strong>. پس از کلیک روی این دکمه:</p>
                <ul className="list-disc pr-5 mt-2 space-y-1 text-slate-600">
                  <li>شماره از «لیست شماره‌ها» خارج شده و به تب <strong>فعالیت</strong> (امروز) منتقل می‌شود.</li>
                  <li>در بخش فعالیت، شماره‌ها به صورت <strong>گروه‌بندی شده بر اساس روز</strong> نمایش داده می‌شوند تا نظم بهتری داشته باشند.</li>
                  <li>عملکرد شما برای مدیران در داشبورد ثبت می‌شود.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">۴. انتقال به پیگیری و بازگردانی</h4>
                <p>شماره‌هایی که نیاز به تماس مجدد دارند را با استفاده از دکمه نارنجی‌رنگ (آیکون تلفن) به بخش <strong>پیگیری‌ها</strong> منتقل کنید. اگر یک شماره را به اشتباه تماس گرفتید یا ثبت کردید، در بخش «فعالیت» یا «پیگیری‌ها» دکمه آبی‌رنگ <strong>بازگردانی (آیکون فلش چرخان)</strong> را بزنید تا شماره دوباره به «لیست شماره‌ها» برگردد.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">۵. حذف کامل شماره</h4>
                <p>در صورتی که نیاز است یک شماره برای همیشه و <strong>کاملا از کل سیستم</strong> (از همه لیست‌ها و فعالیت‌ها) پاک شود تا امکان ثبت مجدد آن فراهم باشد، می‌توانید از دکمه قرمزرنگ <strong>حذف کامل (آیکون سطل زباله)</strong> در ستون عملیات‌ها استفاده کنید. دقت کنید این عملیات غیرقابل بازگشت است.</p>
              </div>
            </div>
          </div>
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

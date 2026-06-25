import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { Clock, Users, Building, Shield, Coffee, HelpCircle, FileText, Info, Briefcase, MapPin, CheckCircle2, BookOpen, Calendar } from 'lucide-react';
import { SCHEDULE_DATA } from '../../data/schedule';

export const AboutView = () => {
  const { layoutMargin } = useAppContext();
  const { direction, tr } = useLocale();

  const guidelines = [
    { 
      icon: Clock, 
      title: tr('شیفت‌های کاری', 'Work Shifts'), 
      desc: tr('در راس زمان مقرر در مجموعه حضور داشته باشید و اثر انگشت خود را در دستگاه حضور و غیاب ثبت نموده به آقای جلیلیان مراجعه نمایید و در لحظه ورود و خروج حضور و غیاب خود را از دستگاه انجام دهید.', 'Be present on time and register attendance. Report to Mr. Jalilian on arrival and departure.')
    },
    { 
      icon: Briefcase, 
      title: tr('وظایف و استراحت', 'Duties & Breaks'), 
      desc: tr('وظایف کارشناسان مطابق قرارداد مشخص بوده و زمان استراحت ۴۰ دقیقه میباشد که در صورت استفاده به پایان وقت کاری شما اضافه میشود.', 'Duties are per contract. 40-min break allowed, added to the end of shift if used.')
    },
    { 
      icon: MapPin, 
      title: tr('فضای کاری', 'Workspace'), 
      desc: tr('فضای اختصاص داده شده برای کارشناس دو میز کار در لابی هست که فقط در صورت پر بودن میتوانید از فضای کلاس ۵ استفاده نمایید.', 'Assigned space is 2 desks in lobby. Use Class 5 only if lobby is full.')
    },
    { 
      icon: Users, 
      title: tr('انضباط محیطی', 'Environment Discipline'), 
      desc: tr('هیچ گونه جابه جایی و تغییر در چیدمان میزها و صندلی‌های مجموعه نباید اتفاق بیوفتد و لطفا هرگونه زباله رو به سطل‌های زباله در آبدارخانه منتقل کنید.', 'No rearranging furniture. Please put trash in pantry bins.')
    },
    { 
      icon: Coffee, 
      title: tr('آبدارخانه و پذیرایی', 'Pantry & Dining'), 
      desc: tr('شستن ظروف آبدارخانه فقط با ماشین ظرفشویی امکان‌پذیر است. لطفا هنگام استفاده از آبدارخانه، فضای ناهارخوری را تمیز نگه دارید و از باز گذاشتن در یخچال جدا خودداری نمایید.', 'Use dishwasher only. Keep dining area clean. Do not leave fridge open.')
    },
    { 
      icon: Building, 
      title: tr('تاسیسات', 'Facilities'), 
      desc: tr('تغییر دمای اسپلیت یا خاموش و روشن کردن آن، فقط و فقط با هماهنگی مدیر مجموعه امکان‌پذیر است.', 'AC temp changes/toggling requires management approval.')
    },
    { 
      icon: Shield, 
      title: tr('حریم خصوصی', 'Privacy'), 
      desc: tr('صحبت با صدای بلند و همهمه در فضای عمومی مجموعه اکیدا ممنوع می‌باشد.', 'Loud talking/noise in public areas is strictly forbidden.')
    },
    {
      icon: FileText,
      title: tr('استفاده از سیستم', 'System Usage'),
      desc: tr('این سیستم فقط جهت ثبت و پیگیری تماس‌های شرکت نوین تک طراحی شده است. هرگونه استفاده غیرمجاز پیگرد قانونی دارد.', 'System is exclusively for recording Novintech calls. Unauthorized use is prohibited.')
    }
  ];

  return (
    <div className="w-full h-full pt-4 pb-32 overflow-y-auto hide-scrollbar bg-slate-50" style={{ paddingLeft: `${layoutMargin}px`, paddingRight: `${layoutMargin}px` }}>
      <div className="w-full flex flex-col" dir={direction}>
        {/* Header */}
        <div className="flex flex-col items-center w-full mb-12 mt-6 text-center relative z-10">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-800 mb-6 shadow-sm border border-slate-200">
             <BookOpen size={40} className="text-cyan-600" />
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {tr('راهنمای سیستم', 'System Guide')}
          </h2>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            {tr('مرجع سریع دستورالعمل‌ها، وظایف و قوانین مجموعه', 'Quick reference for guidelines, duties, and rules')}
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 relative z-10 w-full max-w-6xl mx-auto">
          
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full blur-3xl pointer-events-none opacity-50"></div>
             
             <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-3 relative z-10">
               <Info className="text-cyan-500" />
               {tr('دستورالعمل‌ها و قوانین', 'Guidelines & Rules')}
             </h3>
             
             <p className="text-slate-600 font-medium leading-relaxed text-[15px] text-justify max-w-4xl relative z-10">
               {tr('این سیستم برای مدیریت هوشمندانه و سریع تماس‌های کاربران طراحی شده است. به عنوان اپراتور، شما وظیفه دارید تمامی تماس‌ها را در سیستم ثبت کرده و وضعیت هر یک را مشخص نمایید. از این صفحه می‌توانید به عنوان یک مرجع سریع برای یادآوری امکانات و قوانین استفاده کنید.', 'This system is designed for fast and smart management of user calls. As an operator, it is your responsibility to log all calls and specify their status. You can use this page as a quick reference to recall features and rules.')}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {guidelines.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow flex flex-col gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">{guide.title}</h4>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed text-justify">
                      {guide.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-sm mt-4">
             <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-8 flex items-center gap-3">
               <HelpCircle className="text-rose-500" />
               {tr('قوانین تکمیلی', 'Supplementary Rules')}
             </h3>
             <div className="flex flex-col gap-3">
               {[
                 'وظایف کارشناسان مطابق قرارداد مشخص بوده و زمان استراحت ۴۰ دقیقه میباشد که در صورت استفاده به پایان وقت کاری شما اضافه میشود.',
                 'فضای اختصاص داده شده برای کارشناس دو میز کار در لابی هست که فقط در صورت پر بودن میتوانید از فضای کلاس ۵ استفاده نمایید.',
                 'هیچ گونه جابه جایی و تغییر ساعت در دستیاری و کارشناسی مجاز نبوده و در صورت ایجاد مشکل برخورد خواهد شد.',
                 'تمام هماهنگی های کارشناسان ۳ روز اول هفته با آقایان "اسماعیلی" و "شایقی فرد" میباشد و ۳ روز آخر هفته آقای "علی فرقانی" و خانم "کیمیا زارعی" میباشد لذا از هرگونه ارتباط با استاد زارع جهت امور کارشناسی به شدت بپرهیزید و در صورت نیاز مدیر واحدتان انتقال دهنده خواهد بود.',
                 'جهت استراحت و صرف غذا به هیچ عنوان از فضای کلاس ها استفاده نکنید بلکه از اتاق استراحت و حیاط استفاده کنید.',
                 'کارشناس مستقر اول هفته آقای امیر حسین مسرور و آخر هفته آقای پارسا رابعی نیا میباشند کارشناسان جدید جهت آموزش و کسب تجربه به آنها مراجعه نمایند.',
                 'لطفا در مجموعه پوشش مناسب، عفت کلام و آراستگی ظاهری را حفظ نمایید. موسسه محل کار میباشد. در ضمن همیشه در دسترس باشید اگر از موسسه با شما تماسی برقرار شد و پاسخگو نبودید به محض مطلع شدن تماس بگیرید.',
                 'دستیاران و اساتید ۱۵ دقیقه قبل از شروع کلاس در مجموعه حضور داشته باشید.',
                 'تمام هماهنگی های اساتید ۳ روز اول هفته با آقایان "اسماعیلی" و "شایقی فرد" و ۳ روز آخر هفته آقای "علی فرقانی" و خانم "کیمیا زارعی" میباشد لذا از هرگونه ارتباط با استاد زارع به شدت بپرهیزید.',
                 'کارشناسان محترم جهت تماس تلفنی فقط از خطوط VOIP استفاده کنید در صورت قطع بودن، برای تماس مستقیم از خطوط شرکت از مدیر واحد کسب اجازه کنید.'
               ].map((rule, index) => (
                 <div key={index} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                   <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-110 transition-transform">
                     {index + 1}
                   </div>
                   <p className="text-slate-700 font-medium text-[15px] leading-relaxed pt-1 text-justify">
                     {rule}
                   </p>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white border border-slate-300 p-8 shadow-sm mt-4 overflow-hidden mb-12">
            <h3 className="text-2xl font-black text-black mb-4 text-center">
              {tr('برنامه کارشناسان (زرگری)', 'Operators Schedule (Zargari)')}
            </h3>
            
            <hr className="border-t border-black mb-8" />
            
            <div className="w-full">
              <table className="w-full min-w-[600px] border-collapse text-center border border-black">
                <thead>
                  <tr>
                    <th className="py-6 px-4 bg-slate-100 border border-black w-1/4">
                      <div className="font-black text-black text-lg">{tr('روزهای هفته', 'Days')}</div>
                    </th>
                    <th className="py-6 px-4 bg-slate-100 border border-black w-[37.5%]">
                      <div className="font-black text-black text-lg mb-2">{tr('شیفت صبح', 'Morning Shift')}</div>
                      <div className="text-sm text-black font-bold" dir="ltr">8:30 - 14:30</div>
                    </th>
                    <th className="py-6 px-4 bg-slate-100 border border-black w-[37.5%]">
                      <div className="font-black text-black text-lg mb-2">{tr('شیفت عصر', 'Evening Shift')}</div>
                      <div className="text-sm text-black font-bold" dir="ltr">14:30 - 21:00</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_DATA.map((row, i) => (
                    <tr key={i}>
                      <td className="py-6 px-4 bg-slate-100 border border-black font-black text-black text-lg">
                        {row.dayName}
                      </td>
                      <td className="py-6 px-4 border border-black bg-white">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          {row.morning.map((name, idx) => (
                            <span key={idx} className="text-black font-bold text-base">{name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-6 px-4 border border-black bg-white">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          {row.evening.map((name, idx) => (
                            <span key={idx} className="text-black font-bold text-base">{name}</span>
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
    </div>
  );
};

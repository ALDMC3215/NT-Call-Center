import React, { useState } from 'react';
import { Target, MessageCircle, Eye, Ear, Search, Shield, Zap, BookOpen, CheckCircle2, ArrowLeft, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../../hooks/useAppContext';

const techniques = [
  {
    id: 1,
    title: 'فروش از همان لحظه‌ای شروع میشود که مشتری «الو» میگوید.',
    content: 'در اولین تماس‌های فروش، هیچ‌کس با عذرخواهی یا مقدمه‌چینی وارد گفتگو نمی‌شود. فروشنده با لحنی محکم، آرام و مطمئن مکالمه را آغاز می‌کند و از همان چند ثانیه اول، تصویری از یک فرد حرفه‌ای در ذهن مشتری می‌سازد.',
    lesson: 'اولین ۵ تا ۱۰ ثانیه تماس تلفنی، مهم‌ترین بخش مذاکره است. مشتری در همین چند ثانیه تصمیم می‌گیرد به صحبت‌های شما گوش بدهد، شما را یک متخصص بداند یا یک فروشنده معمولی، و مکالمه را ادامه دهد یا به پایان برساند.',
    goldenPoint: 'مشتری قبل از اینکه محصول شما را بخرد، لحن، اعتمادبه‌نفس و شخصیت حرفه‌ای شما را می‌خرد.',
    icon: Ear
  },
  {
    id: 2,
    title: 'کسی که سؤال می‌پرسد، مذاکره را کنترل می‌کند.',
    content: 'کارشناسان حرفه‌ای به جای پرحرفی، با سؤال‌های هدفمند درباره اهداف و مسیر شغلی، مشتری را درگیر مکالمه می‌کنند. نمونه سؤال‌ها: «هدف اصلی شما از یادگیری برنامه‌نویسی چیه؟»، «آیا قبلا با ابزارهای هوش مصنوعی کار کردید؟»، «قصدتون ورود به بازار کاره یا مهاجرت؟»، «برای طراحی گرافیک به دنبال کار در شرکت‌ها هستید یا پروژه‌های شخصی؟»',
    lesson: 'مشتری بیشتر حرف می‌زند و درگیر گفتگو می‌شود، اطلاعات بیشتری از مشتری می‌گیرید، و کنترل مکالمه دست شما می‌ماند.',
    goldenPoint: 'سؤال‌های درست، مسیر ذهن مشتری را هدایت می‌کند و او را یک قدم به تصمیم نزدیک‌تر می‌سازد.',
    icon: Search
  },
  {
    id: 3,
    title: 'فروشنده‌های حرفه‌ای وارد دفاع نمی‌شوند.',
    content: 'وقتی مشتری مخالفت می‌کند، آنها سریع شروع به توضیح دادن نمی‌کنند. اول مقاومت ذهنی مشتری را می‌شکنند و بعد، پاسخ می‌دهند. مثال: مشتری می‌گوید «علاقه‌ای ندارم.» فروشنده حرفه‌ای می‌گوید: «کاملا درکتون می‌کنم، خیلی‌ها اولش همین احساس رو داشتن...»',
    lesson: 'قبل از دفاع، احساس یا موضوع مشتری را بپذیر. این کار مقاومت ذهنی او را کاهش می‌دهد و مسیر متقاعدسازی را باز می‌کند.',
    goldenPoint: 'اعتراض مشتری، پایان فروش نیست؛ فرصتی است برای هدایت درست مکالمه.',
    icon: Shield
  },
  {
    id: 4,
    title: 'سکوت، فرصت طلاست.',
    content: 'بعد از مطرح کردن پیشنهاد، فروشنده سکوت می‌کند و اجازه می‌دهد مشتری فکر کند و صحبت کند. فروشنده ضعیف سکوت را نمی‌تواند تحمل کند و سریع شروع به توضیح بیشتر می‌کند، اما فروشنده حرفه‌ای سکوت را مدیریت می‌کند و به مشتری زمان فکر کردن می‌دهد.',
    lesson: 'پس از ارائه پیشنهاد یا قیمت، سکوت کنید و اجازه دهید مشتری صحبت کند. هر کس بعد از شما بیشتر حرف بزند، معمولاً امتیاز بیشتری می‌دهد.',
    goldenPoint: 'سکوت، نه ضعف شماست، نه بی‌تفاوتی؛ سکوت، مدیریت حرفه‌ای مکالمه است.',
    icon: MessageCircle
  },
  {
    id: 5,
    title: 'محصول را نمی‌فروشند، تصویر آینده را می‌فروشند.',
    content: 'کارشناسان ما به جای توضیح صرف درباره سرفصل‌های دوره، روی آینده شغلی و درآمدی آن تمرکز می‌کنند. آنها نتیجه را می‌فروشند. فروش ویژگی یعنی: «این دوره شامل ۱۰۰ ساعت آموزش پایتون و طراحی است.» اما فروش نتیجه یعنی: «با گذراندن این دوره و دریافت مدرک معتبر دانشگاه شیراز، می‌توانید به عنوان یک متخصص، به‌راحتی جذب بازار کار شوید، به صورت فریلنسری درآمد کسب کنید و یا حتی برای مهاجرت کاری اقدام کنید.»',
    lesson: 'به جای توضیح ویژگی‌ها، به مشتری کمک کنید تصویر آینده از ثبت‌نام در دوره را ببیند. مشتری با آینده بهتر تصمیم می‌گیرد، نه با اطلاعات بیشتر.',
    goldenPoint: 'ذهن مشتری را به آینده ببرید؛ جایی که او به هدفش رسیده است.',
    icon: Eye
  },
  {
    id: 6,
    title: 'گوش دادن فعال، کلید اعتماد مشتری است.',
    content: 'فروشنده‌های موفق، بیشتر از اینکه حرف بزنند، گوش می‌دهند. آنها با دقت به حرف‌های مشتری گوش می‌کنند تا نیاز واقعی او را کشف کنند. با واکنش‌های کلامی کوتاه مثل «بله، متوجهم» نشان دهید گوش می‌دهید و سؤال‌های باز بپرسید.',
    lesson: 'مشتری احساس اهمیت می‌کند، اعتماد ایجاد می‌شود، و نیاز واقعی او کشف می‌شود.',
    goldenPoint: 'مشتری زمانی از شما پیشنهاد می‌پذیرد که احساس کند واقعاً او را درک کرده‌اید.',
    icon: Ear
  },
  {
    id: 7,
    title: 'مشتری به دلیل مزایا گوش می‌دهد، نه ویژگی‌ها.',
    content: 'فروشندگان موفق، به‌جای خواندن ویژگی‌های پیچیده، تمرکزشان را روی مزایایی می‌گذارند که مستقیماً زندگی مشتری را بهتر می‌کند. مثال: مزیت یعنی «با این سرمایه‌گذاری، می‌توانی در مدت کوتاه سود قابل توجهی بگیری و از تورم جلو بزنی.»',
    lesson: 'مشتری نمی‌خواهد بداند چه چیزی می‌فروشید؛ مشتری می‌خواهد بداند این موضوع چه تغییری در زندگی یا کسب‌وکار او ایجاد می‌کند.',
    goldenPoint: 'همیشه قبل از توضیح جزئیات، از خودت بپرس: «این برای مشتری من چه فایده‌ای دارد؟»',
    icon: Zap
  },
  {
    id: 8,
    title: 'هر تماس را با یک هدف مشخص شروع کنید.',
    content: 'فروشنده‌های موفق، قبل از هر تماس دقیقاً می‌دانند چه می‌خواهند به دست بیاورند. آنها بی‌هدف تماس نمی‌گیرند. هدف‌های رایج: معرفی محصول یا خدمت، بررسی نیاز یا چالش مشتری، دریافت قیمت رقیب، گرفتن وقت برای جلسه.',
    lesson: 'قبل از گرفتن گوشی، هدف تماس را مشخص کنید و مکالمه را در همان جهت هدایت کنید.',
    goldenPoint: 'فروشنده حرفه‌ای نمی‌پرسد: «ببینم چی میشه!» او می‌داند دقیقاً به دنبال چه نتیجه‌ای است.',
    icon: Target
  },
  {
    id: 9,
    title: 'از سکوت، به نفع خودتان استفاده کنید.',
    content: 'بعد از طرح سؤال یا ارائه پیشنهاد، سکوت می‌کنند و اجازه می‌دهند مشتری صحبت کند یا فکر کند. این سکوت، فشار مثبتی ایجاد می‌کند. چرا؟ چون نشان می‌دهد که به حرف‌های او گوش می‌دهید و کنترل مکالمه دست شما باقی می‌ماند.',
    lesson: 'بعد از هر سؤال یا پیشنهاد، سکوت کنید و اجازه دهید مشتری صحبت کند. این کار باعث می‌شود ارزش پیشنهاد شما در ذهنش بیشتر شود.',
    goldenPoint: 'سکوت، نشانه اعتمادبه‌نفس است؛ نه ضعف، یا ندانستن جواب.',
    icon: MessageCircle
  },
  {
    id: 10,
    title: 'با سؤال‌های هوشمندانه، نیاز واقعی را کشف کنید.',
    content: 'فروشنده‌های موفق، به‌جای صحبت‌کردن زیاد، سؤال‌های دقیق می‌پرسند تا مشتری خودش به مشکل و نیازش پی ببرد. سؤال خوب، فروختن را آسان می‌کند. نمونه: الان بزرگترین چالش شما در این زمینه چیست؟ اگر این مشکل حل شود، چه تأثیری برای شما دارد؟',
    lesson: 'بهتر است ۷۰٪ زمان تماس را صرف گوش دادن و سؤال پرسیدن کنید و فقط ۳۰٪ زمان را صرف صحبت کردن.',
    goldenPoint: 'مشتری وقتی احساس کند درک می‌شود، با شما همکاری می‌کند و راحت‌تر خرید می‌کند.',
    icon: Search
  },
  {
    id: 11,
    title: 'به جای «فروش»، راه‌حل ارائه دهید.',
    content: 'آنها فقط برای فروش تماس نمی‌گیرند. آنها مشکل مشتری را شناسایی می‌کنند و راه‌حل مناسب پیشنهاد می‌دهند. فرمول ارائه راه‌حل: شناسایی مشکل مشتری + ارائه راه‌حل مناسب + اثبات مزیت راه‌حل = ایجاد اعتماد و فروش.',
    lesson: 'مشتری‌ها راه‌حل می‌خرند، نه محصول. با تمرکز روی مشکل آنها و ارائه راه‌حل واقعی، اعتماد بسازید و فروش را قطعی کنید.',
    goldenPoint: 'بپرسید: «چه مشکلی شما را از هدفتان دور می‌کند؟» سپس خودتان راه‌حل را پیشنهاد دهید.',
    icon: Shield
  },
  {
    id: 12,
    title: 'در هر تماس، یک هدف مشخص داشته باشید.',
    content: 'فروشنده‌های موفق، قبل از تماس تصمیم می‌گیرند چه می‌خواهند به دست بیاورند؛ قرار جلسه، فروش یا دریافت اطلاعات. بدون هدف، تماس شما بی‌نتیجه خواهد بود.',
    lesson: 'قبل از هر تماس از خودتان بپرسید: من دقیقاً چه می‌خواهم؟ سپس تمام صحبت‌هایتان را در مسیر رسیدن به آن هدف هدایت کنید.',
    goldenPoint: 'بدون هدف مشخص، حتی بهترین صحبت‌ها به نتیجه نمی‌رسند.',
    icon: Target
  },
];

export const NegotiationView = ({ isModal, onClose }: { isModal?: boolean, onClose?: () => void }) => {
  const [activeId, setActiveId] = useState(1);
  const { setCurrentView } = useAppContext();

  const scrollToSection = (id: number) => {
    setActiveId(id);
    const element = document.getElementById(`technique-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-full h-full bg-[#F8FAFC] flex flex-col" dir="rtl">
      
      {/* Header */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          {isModal ? (
             <button
               onClick={onClose}
               className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
               title="بستن"
             >
               <X size={20} />
             </button>
          ) : (
            <button
              onClick={() => setCurrentView('home')}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              title="بازگشت به مرکز فرماندهی"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpen className="text-brand-600" size={24} />
              تکنیک‌های حرفه‌ای مذاکره
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              مجموعه‌ای از برترین تکنیک‌های فروش برای استفاده کارشناسان
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        
        {/* Sidebar Index (Desktop) */}
        <div className="hidden lg:flex w-[340px] flex-col bg-white h-full overflow-y-auto hide-scrollbar shrink-0 border-l border-slate-200">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Target size={18} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">فهرست تکنیک‌ها</h3>
            </div>
            
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute right-[21px] top-6 bottom-6 w-0.5 bg-slate-100 rounded-full z-0"></div>
              
              <div className="space-y-4 relative z-10">
                {techniques.map((tech) => {
                  const Icon = tech.icon;
                  const isActive = activeId === tech.id;
                  return (
                    <button
                      key={tech.id}
                      onClick={() => scrollToSection(tech.id)}
                      className={`w-full text-right transition-all duration-300 flex items-center gap-4 group ${
                        isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Circle icon marker */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-none transition-all duration-300 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-110' 
                          : 'bg-white text-slate-400 border border-slate-200 group-hover:border-slate-300 group-hover:text-slate-600 group-hover:scale-105'
                      }`}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      
                      {/* Title text */}
                      <div className="flex flex-col flex-1 min-w-0 pb-1">
                        <span className={`text-[10px] font-extrabold mb-1 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                          تکنیک {tech.id}
                        </span>
                        <span className={`text-[13px] font-bold transition-colors truncate block w-full ${
                          isActive ? 'text-slate-900' : 'text-slate-600'
                        }`}>
                          {tech.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#F8FAFC] p-4 sm:p-6 lg:p-10 relative scroll-smooth"
             onScroll={(e) => {
               // Simple scroll spy logic
               const container = e.currentTarget;
               const sections = techniques.map(t => document.getElementById(`technique-${t.id}`));
               const scrollPosition = container.scrollTop + container.clientHeight / 3;
               
               let currentActive = activeId;
               sections.forEach((section, index) => {
                 if (section && section.offsetTop <= scrollPosition) {
                   currentActive = techniques[index].id;
                 }
               });
               
               if (currentActive !== activeId) {
                 setActiveId(currentActive);
               }
             }}
        >
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            
            {/* Intro Alert */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6 text-blue-800 shadow-sm flex gap-4 items-start">
              <div className="flex-none p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Target size={24} />
              </div>
              <div>
                <h4 className="font-bold text-base mb-2">راهنمای مطالعه</h4>
                <p className="text-sm font-medium leading-loose opacity-90 text-justify">
                  این بخش برای ارتقای سطح کیفی مکالمات و مهارت‌های فروش شما تدوین شده است. هر یک از این تکنیک‌ها بر اساس رفتار فروشندگان موفق طراحی شده و مستقیماً روی نرخ تبدیل تماس‌های شما تأثیر مثبت می‌گذارد. پیشنهاد می‌کنیم هر روز یک تکنیک را انتخاب کرده و در تماس‌های خود تمرین کنید.
                </p>
              </div>
            </div>

            {/* Techniques List */}
            {techniques.map((tech) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={tech.id}
                  id={`technique-${tech.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300"
                >
                  <div className="p-6 sm:p-8">
                    
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-none border border-brand-100">
                        <Icon size={24} strokeWidth={2} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-md mb-2 inline-block">تکنیک شماره {tech.id}</span>
                        <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                          {tech.title}
                        </h2>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-slate-600 text-[15px] sm:text-base font-medium leading-[2.2] text-justify mb-8">
                      {tech.content}
                    </p>

                    {/* Lesson & Golden Point Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-slate-400/30"></div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-700 text-sm mb-3">
                          <CheckCircle2 size={18} className="text-slate-500" />
                          درس فروش
                        </h4>
                        <p className="text-slate-600 text-sm font-medium leading-loose text-justify">
                          {tech.lesson}
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                        <h4 className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-3">
                          <Zap size={18} className="text-amber-600 fill-amber-600/20" />
                          نکته طلایی
                        </h4>
                        <p className="text-amber-800 text-sm font-medium leading-loose text-justify">
                          {tech.goldenPoint}
                        </p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
};

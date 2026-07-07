import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { useAppContext } from '../../hooks/useAppContext';

const INTRO_SCRIPTS = [
  {
    id: 'script-1',
    title: 'نسخه ۱: مشاوره‌ای (کشف استعداد)',
    subtitle: 'تمرکز بر احترام، درک نیاز و ایجاد حس ارزشمندی در ۵ ثانیه اول',
    content: `سلام و احترام، وقت شما بخیر.
[نام کارشناس] هستم از دپارتمان تخصصی نوین‌تک. تماس من با شما صرفاً برای معرفی یک فرصت ارزشمند جهت ارتقاء شغلی و مهارتی است؛ البته اگر مایل باشید چند ثانیه وقتتون رو به من بدید.

ما در مجموعه نوین‌تک معتقدیم هر فردی استعداد خاص خودش رو در دنیای تکنولوژی داره. به همین دلیل، دوره‌های تخصصی کامپیوتر، برنامه‌نویسی و گرافیک ما صرفاً یک کلاس درس نیستند، بلکه یک مسیر شغلی و حرفه‌ای محسوب میشن.
[توضیحات کوتاه دوره مدنظر]

نکته‌ای که دوره‌های ما رو متمایز می‌کنه اینه که کلاس‌ها در محیط فاخر پردیس بین‌الملل دانشگاه شیراز برگزار میشه. در پایان هم یک گواهینامه معتبر و رسمی از مرکز آموزش‌های آزاد دانشگاه شیراز دریافت می‌کنید که اعتبار فوق‌العاده‌ای برای رزومه شما خواهد داشت.

هدف من در این تماس ثبت‌نام شما نیست؛ بلکه می‌خوام از شما دعوت کنم تا یک جلسه مشاوره حضوری کاملاً رایگان با اساتید ما داشته باشید تا فقط بررسی کنیم چه مسیری برای آینده شما بهترین بازدهی رو داره. موافقید لینک سایت و اطلاعات بیشتر رو براتون ارسال کنم تا سر فرصت بررسی بفرمایید؟`,
    icon: 'HeartHandshake',
    color: 'emerald'
  },
  {
    id: 'script-2',
    title: 'نسخه ۲: مستقیم و فرصت‌محور',
    subtitle: 'جذابیت بالا، ایجاد حس نیاز فوری و مناسب برای افراد پرمشغله',
    content: `سلام، وقتتون بخیر باشه.
من [نام کارشناس] هستم از دپارتمان برنامه‌نویسی و فناوری نوین‌تک. می‌دونم زمانتون ارزشمنده، پس در چند ثانیه یک فرصت ویژه رو خدمتتون معرفی می‌کنم.

ما در حال گزینش و ثبت‌نامِ دوره‌های تخصصی و بازارمحورِ کامپیوتر، گرافیک و شبکه هستیم. دوره‌هایی که خروجیشون، ورود مستقیم به بازار کاره.
[توضیحات کوتاه دوره مدنظر]

برای اینکه خیالتون از سطح کیفی راحت باشه، کلاس‌ها مستقیماً در فضای حرفه‌ای پردیس بین‌الملل دانشگاه شیراز برگزار میشه و مهم‌تر از همه، مدرک پایانی شما گواهینامه‌ای رسمی از مرکز آموزش‌های آزاد دانشگاه شیراز خواهد بود؛ یک تاییدیه قدرتمند برای رزومه شما!

پیشنهاد من اینه که قبل از هر تصمیمی، یک تایم کوتاه مشاوره رایگان با کارشناسان ارشد ما داشته باشید تا دقیقاً ببینیم این دوره‌ها چطور می‌تونه درآمد و جایگاه شغلی شما رو ارتقا بده. اجازه می‌دید اطلاعات تکمیلی و لینک سایت رو پیامک کنم تا خودتون بررسی کنید؟`,
    icon: 'Zap',
    color: 'amber'
  },
  {
    id: 'script-3',
    title: 'نسخه ۳: ارزش‌آفرین و رزومه‌ساز',
    subtitle: 'تمرکز بر اعتبار، آینده شغلی و وزنِ مدرک (مناسب برای مهاجرت و استخدام)',
    content: `عرض سلام و احترام. روزتون بخیر.
[نام کارشناس] هستم از مجموعه تخصصی نوین‌تک. تماس گرفتم باهاتون چون ما روی ارتقاء رزومه و آینده حرفه‌ایِ افراد سرمایه‌گذاری می‌کنیم.

حوزه فعالیت ما برگزاری دوره‌های سطح‌بالای کامپیوتر، برنامه‌نویسی و شبکه هست. 
[توضیحات کوتاه دوره مدنظر]

چیزی که این دوره‌ها رو به یک سرمایه‌گذاری ارزشمند تبدیل می‌کنه، اعتبار بی‌نظیر اونه. شما در محیط پردیس بین‌الملل دانشگاه شیراز آموزش می‌بینید و در نهایت، گواهینامه رسمی خودتون رو از مرکز آموزش‌های آزاد دانشگاه شیراز دریافت می‌کنید. این یعنی یک پشتوانه محکمِ دانشگاهی که چه برای استخدام در ایران و چه برای مهاجرت، اعتبار بسیار بالایی داره.

من می‌تونم یک وقت مشاوره رایگان با اساتید مجموعه براتون هماهنگ کنم تا به صورت اختصاصی نقشه راه موفقیت شما رو ترسیم کنند. مایل هستید که لینک وب‌سایت رو براتون پیامک کنم تا سرفصل‌ها رو دقیق‌تر ببینید؟`,
    icon: 'Briefcase',
    color: 'blue'
  },
  {
    id: 'script-4',
    title: 'نسخه ۴: صمیمی، پرانرژی و مدرن',
    subtitle: 'ایجاد کنجکاوی و حس ورود به یک کامیونیتی حرفه‌ای (ویژه جوانان)',
    content: `سلام! امیدوارم حالتون عالی باشه.
من [نام کارشناس] هستم از دپارتمان تکنولوژی نوین‌تک. تماس گرفتم تا در مورد یک فرصت جذاب برای ورود به دنیای حرفه‌ای‌هایِ تکنولوژی باهاتون صحبت کنم.

ما دوره‌های فوق‌العاده کاربردی در زمینه برنامه‌نویسی، گرافیک و شبکه داریم که دقیقاً برای نیاز امروزِ بازار کار طراحی شدن.
[توضیحات کوتاه دوره مدنظر]

خبر عالی اینه که محیط کلاس‌های ما توی پردیس بین‌الملل دانشگاه شیرازه و وقتی دوره‌تون تموم میشه، یه گواهینامه معتبر و رسمی از مرکز آموزش‌های آزاد دانشگاه شیراز می‌گیرید که حسابی رزومه‌تون رو سنگین می‌کنه و بهتون اعتبار میده.

اگر دنبال این هستید که مهارت‌های پول‌ساز یاد بگیرید، پیشنهاد می‌کنم یه جلسه مشاوره رایگان مهمون ما باشید تا اساتیدمون بهترین مسیر رو بهتون معرفی کنن. چطوره لینک سایتمون رو براتون بفرستم که یه نگاهی به دوره‌ها و فضای کاری ما بندازید؟`,
    icon: 'Smile',
    color: 'indigo'
  },
  {
    id: 'script-5',
    title: 'نسخه ۵: رسمی، فاخر و نخبگانی',
    subtitle: 'لحن بسیار محترمانه و وزین، القای حس پرستیژ (ویژه مدیران)',
    content: `عرض سلام و احترام فراوان خدمت شما.
[نام کارشناس] هستم از دپارتمان تخصصی و آموزشی نوین‌تک. افتخار دارم تا دقایقی کوتاه، فرصتی را جهت ارتقاء سطح تخصص و رزومه حرفه‌ای، خدمت شما معرفی کنم.

مجموعه نوین‌تک، مجری برگزاری دوره‌های نخبگانی و تخصصی در حوزه‌های برنامه‌نویسی، شبکه‌های کامپیوتری و طراحی گرافیک است.
[توضیحات کوتاه دوره مدنظر]

آنچه این دوره‌ها را در سطحی فاخر و متمایز قرار می‌دهد، برگزاری کلاس‌ها در فضای آکادمیک پردیس بین‌الملل دانشگاه شیراز است. همچنین در پایان دوره، گواهینامه‌ای کاملاً رسمی و معتبر از سوی مرکز آموزش‌های آزاد دانشگاه شیراز به شما اعطا خواهد شد که نشانی از تخصص و اعتبار بالای شما خواهد بود.

چنانچه مایل به گسترش مهارت‌های فردی و شغلی خود هستید، باعث افتخار است که یک جلسه مشاوره حضوری و رایگان با اساتید برجسته مجموعه برایتان تنظیم کنم. با اجازه شما، آدرس وب‌سایت و جزئیات تکمیلی را خدمتتان پیامک می‌نمایم تا در فرصت مناسب بررسی فرمایید.`,
    icon: 'UserCheck',
    color: 'slate'
  }
];

export const IntroTextView = ({ isModal, onClose }: { isModal?: boolean, onClose?: () => void }) => {
  const { direction } = useLocale();
  const { setCurrentView } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('script-1');

  const activeScript = INTRO_SCRIPTS.find(s => s.id === activeTab) || INTRO_SCRIPTS[0];
  const ActiveIcon = (Icons as any)[activeScript.icon] || Icons.FileText;

  // Color mapping helpers
  const getColorClasses = (colorName: string, isSelected: boolean) => {
    const maps: Record<string, { bg: string, text: string, border: string, selectedBg: string, selectedText: string }> = {
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', selectedBg: 'bg-emerald-600', selectedText: 'text-white' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', selectedBg: 'bg-amber-500', selectedText: 'text-white' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', selectedBg: 'bg-blue-600', selectedText: 'text-white' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', selectedBg: 'bg-indigo-600', selectedText: 'text-white' },
      slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', selectedBg: 'bg-slate-700', selectedText: 'text-white' },
    };
    const colors = maps[colorName] || maps.blue;
    return isSelected ? `${colors.selectedBg} ${colors.selectedText} shadow-md scale-[1.02]` : `${colors.bg} ${colors.text} ${colors.border} hover:bg-white`;
  };

  const getGradient = (colorName: string) => {
    const maps: Record<string, string> = {
      emerald: 'from-emerald-500 to-teal-400',
      amber: 'from-amber-500 to-orange-400',
      blue: 'from-blue-600 to-cyan-500',
      indigo: 'from-indigo-600 to-purple-500',
      slate: 'from-slate-700 to-slate-500',
    };
    return maps[colorName] || maps.blue;
  };

  return (
    <div className="flex flex-col h-full w-full relative pt-4 pb-4 px-4 md:px-8 bg-slate-50" dir={direction}>
      {/* Header */}
      <div className="flex-none bg-transparent mb-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm border border-rose-100">
             <Icons.MessageSquareQuote size={22} strokeWidth={2.5} />
           </div>
           <div>
             <h1 className="text-lg font-black text-slate-800">متن‌های معرفی و پرزنت</h1>
             <p className="text-xs text-slate-500 font-medium hidden sm:block">نسخه‌های مختلف برای شروع مکالمه با مشتری</p>
           </div>
        </div>
        {isModal ? (
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-500 flex items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
            title="بستن"
          >
            <Icons.X size={20} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentView('home')}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-500 flex items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
            title="بازگشت"
          >
            <Icons.ArrowLeft size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar relative z-10 pb-8 space-y-6">
        
        {/* Important Notice */}
        <div className="bg-red-50 border-r-4 border-red-500 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Icons.AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-800 font-bold text-sm mb-1">نکته طلایی و بسیار مهم!</h3>
              <p className="text-red-700 text-xs sm:text-sm leading-relaxed">
                در صورتی که مخاطب از شما پرسید: <strong>«آیا شما از طرف دانشگاه شیراز تماس می‌گیرید؟»</strong><br/>
                پاسخ شما باید دقیقاً به این صورت باشد: <span className="font-bold">«نوین‌تک مجری برگزاری دوره‌های آموزشی کامپیوتر و برنامه‌نویسی مرکز آموزش‌های آزاد دانشگاه شیراز هست.»</span>
                <br/><br/>
                <span className="bg-red-100 px-2 py-0.5 rounded text-red-900 font-bold">از به کارگیری نام دانشگاه شیراز به هر عنوانی غیر از «محل برگزاری کلاس‌ها» و «مرجع صدور گواهینامه» به شدت خودداری نمایید.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col gap-2">
          <h3 className="text-slate-700 font-bold text-sm mb-1 px-1">انتخاب نسخه متن:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {INTRO_SCRIPTS.map((script) => {
              const Icon = (Icons as any)[script.icon] || Icons.FileText;
              const isSelected = activeTab === script.id;
              return (
                <button
                  key={script.id}
                  onClick={() => setActiveTab(script.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-right transition-all duration-300 ${getColorClasses(script.color, isSelected)}`}
                >
                  <Icon size={20} className={`mb-2 ${isSelected ? 'text-white/90' : ''}`} strokeWidth={2} />
                  <span className="font-bold text-sm mb-1 leading-tight">{script.title}</span>
                  <span className={`text-[10px] leading-tight ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{script.subtitle}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Script Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className={`h-2 w-full bg-gradient-to-r ${getGradient(activeScript.color)}`}></div>
            <div className="p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className={`p-3 rounded-xl ${getColorClasses(activeScript.color, false).split(' ')[0]} ${getColorClasses(activeScript.color, false).split(' ')[1]}`}>
                  <ActiveIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{activeScript.title}</h2>
                  <p className="text-slate-500 text-sm mt-1">{activeScript.subtitle}</p>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none">
                {activeScript.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-slate-700 text-[15px] sm:text-base leading-relaxed md:leading-loose mb-4 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

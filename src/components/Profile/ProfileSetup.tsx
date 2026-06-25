import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { v4 as uuidv4 } from 'uuid';
import { customToast as toast } from '../UI/toast';
import { Calendar, User, ArrowLeft, Shield, Lock } from 'lucide-react';
import jalaali from 'jalaali-js';
import { useLocale } from '../../hooks/useLocale';
import { motion, AnimatePresence } from 'motion/react';
import { SCHEDULE_DATA } from '../../data/schedule';

const PERSIAN_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const ENGLISH_MONTHS = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];

const getTodayJalali = () => {
    const today = new Date();
    const jDate = jalaali.toJalaali(today);
    return {
        jy: Math.floor(jDate.jy),
        jm: String(jDate.jm).padStart(2, '0'),
        jd: String(jDate.jd).padStart(2, '0'),
    }
}

const getTodayDayId = () => {
  const day = new Date().getDay(); // 0 is Sunday
  const map: Record<number, string> = { 6: '1', 0: '2', 1: '3', 2: '4', 3: '5', 4: '6', 5: '1' };
  return map[day] || '1';
}

export const ProfileSetup = () => {
  const { profile, setProfile, setCurrentView } = useAppContext();
  const { isFa, direction, tr } = useLocale();
  const todayVal = getTodayJalali();
  
  const [selectedDay] = useState(todayVal.jd);
  const [selectedMonth] = useState(todayVal.jm);
  const [loginMode, setLoginMode] = useState<'expert' | 'admin'>('expert');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [selectedDayId, setSelectedDayId] = useState(getTodayDayId());
  const [selectedOperator, setSelectedOperator] = useState('');

  const currentSchedule = SCHEDULE_DATA.find(s => s.dayId === selectedDayId);
  const allOperators = currentSchedule ? [
    ...currentSchedule.morning.map(name => ({name, shift: 'Morning'})), 
    ...currentSchedule.evening.map(name => ({name, shift: 'Evening'}))
  ] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMode === 'admin') {
      if (!adminPassword) {
        toast.error(tr('لطفاً رمز عبور را وارد کنید', 'Please enter a password'));
        return;
      }
      if (adminPassword !== 'admin123') {
        toast.error(tr('رمز عبور نامعتبر است', 'Invalid password'));
        return;
      }
      setProfile({
        name: tr('مدیر سیستم', 'System Admin'),
        date: `1405/${selectedMonth}/${selectedDay}`,
        shift: 'Admin',
        branch: 'Admin',
        sessionId: profile?.sessionId || uuidv4(),
        role: 'admin'
      });
      setCurrentView('admin');
      toast.success(tr('به پنل مدیریت خوش آمدید', 'Welcome to the Admin panel'), { icon: '✓' });
      return;
    }

    if (!selectedOperator) {
      toast.error(tr('لطفاً کارشناس را انتخاب کنید', 'Please select an expert'));
      return;
    }
    
    const operatorData = allOperators.find(o => o.name === selectedOperator);
    const finalShift = operatorData?.shift || 'Morning';

    setProfile({
      name: selectedOperator,
      date: `1405/${selectedMonth}/${selectedDay}`,
      shift: finalShift as any, 
      branch: 'Zargari',
      sessionId: profile?.sessionId || uuidv4(),
      role: 'expert'
    });
    setCurrentView('dashboard');
    toast.success(tr('به پنل تماس نوین‌تک خوش آمدید', 'Welcome to the NovinTech call panel'), { icon: '✓' });
  };

  return (
    <div className="flex w-full min-h-[100vh] relative overflow-hidden text-slate-900" dir={direction}>
      {/* Luxurious Modern Background */}
      <div className="absolute inset-0 z-0 bg-slate-50 overflow-hidden">
        {/* Animated Background Mesh/Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-300/10 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/10 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-teal-200/10 blur-[100px] animate-[pulse_12s_ease-in-out_infinite]" />
        
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Action Button (Login Toggle) */}
      <div className={`absolute top-6 z-50 px-6 ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
        <button 
          type="button"
          onClick={() => setLoginMode(loginMode === 'expert' ? 'admin' : 'expert')}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-full px-5 py-2 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          {loginMode === 'expert' ? (
            <><Shield size={16} className="text-indigo-600" /> <span className="text-sm font-medium">{tr('ورود مدیریت', 'Admin Login')}</span></>
          ) : (
            <><User size={16} className="text-brand-600" /> <span className="text-sm font-medium">{tr('ورود کارشناس', 'Expert Login')}</span></>
          )}
        </button>
      </div>

      <motion.div layout className={`w-full h-full flex flex-col ${loginMode === 'expert' ? 'lg:flex-row' : 'lg:flex-row-reverse'} relative z-20 min-h-[100vh] max-w-[1600px] mx-auto`}>
        
        {/* Branding side */}
        <motion.div layout className="w-full lg:w-5/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-10">
          <motion.div 
            layout
            initial={{ opacity: 0, x: isFa ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`relative flex flex-col ${isFa ? 'text-right' : 'text-left'}`}
          >
            {/* Official Logo Area */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 ring-1 ring-white/50 overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
                <span className="text-3xl font-extrabold text-white tracking-tighter" style={{ fontFamily: 'system-ui' }}>N</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{tr('نوین‌تک', 'NovinTech')}</span>
                <span className="text-sm font-normal text-brand-600 tracking-widest">{tr('NOVIN TECH', 'NOVIN TECH')}</span>
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 tracking-tight mb-6 leading-[1.15]">
              {tr('سامانه هوشمند', 'Smart Call')}<br />{tr('مدیریت تماس', 'Management System')}
            </h1>
            
            <p className="text-slate-700 font-medium text-lg lg:text-xl leading-relaxed max-w-md">
              {tr('هسته مرکزی نوین‌تک', 'NovinTech Operations Hub')}<br />
              <span className="text-brand-600">{tr('یکپارچگی و سرعت در پشتیبانی مشتریان', 'Consistency and speed in customer support')}</span>
            </p>

            <div className="mt-12 flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 max-w-sm shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-base mb-1">{tr('سیستم عملیاتی آماده', 'System ready')}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {tr('اتصال ایمن به پایگاه داده مرکزی.', 'Secure connection to the central database.')}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Form side */}
        <motion.div layout className="w-full lg:w-7/12 p-6 md:p-10 lg:p-16 flex flex-col justify-center items-center lg:items-start relative z-10">
           <motion.div 
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="w-full max-w-[520px] rounded-[2rem] border border-slate-200 bg-white p-8 md:p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden"
           >
              {/* Decorative top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-70" />
              
               <div className="flex justify-between items-start mb-8">
                <div className={isFa ? 'text-right' : 'text-left'}>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    {loginMode === 'expert' ? tr('ورود به پنل کارشناس', 'Expert Login') : tr('ورود به پنل مدیریت', 'Admin Login')}
                  </h2>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 shadow-sm" dir="ltr">
                  <Calendar size={16} className="mb-1 text-brand-500" />
                  <span className="text-xs font-bold">{selectedDay} {(isFa ? PERSIAN_MONTHS : ENGLISH_MONTHS)[parseInt(selectedMonth)-1]}</span>
                </div>
              </div>

              <div className="relative w-full">
                 <AnimatePresence mode="wait">
                   {loginMode === 'expert' ? (
                     <motion.form 
                       key="expert-form"
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 20 }}
                       transition={{ duration: 0.3 }}
                       onSubmit={handleSubmit} 
                       className="space-y-8 w-full"
                     >
                     <div className="space-y-6">
                      
                       {/* Day Selection */}
                       <div className="space-y-2 group">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 px-1">
                             <Calendar size={16} className="text-slate-400" />
                             <span>{tr('انتخاب روز', 'Select Day')}</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                             {SCHEDULE_DATA.map(schedule => (
                               <button
                                 key={schedule.dayId}
                                 type="button"
                                 onClick={() => {
                                   setSelectedDayId(schedule.dayId);
                                   setSelectedOperator('');
                                 }}
                                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                   selectedDayId === schedule.dayId 
                                   ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20' 
                                   : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                 }`}
                               >
                                 {schedule.dayName}
                               </button>
                             ))}
                          </div>
                       </div>

                       {/* Operator Selection */}
                       <div className="space-y-2 group">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 px-1">
                             <User size={16} className="text-slate-400" />
                             <span>{tr('انتخاب کارشناس', 'Select Expert')}</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allOperators.map((operator, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedOperator(operator.name)}
                                className={`flex flex-col items-start p-3 rounded-xl border transition-all text-right ${
                                  selectedOperator === operator.name
                                  ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500 shadow-sm'
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <span className={`font-bold text-[14px] ${selectedOperator === operator.name ? 'text-brand-700' : 'text-slate-800'}`}>
                                  {operator.name}
                                </span>
                                <span className={`text-[11px] font-bold mt-1 px-2 py-0.5 rounded-md ${
                                  operator.shift === 'Morning' 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {operator.shift === 'Morning' ? tr('شیفت صبح', 'Morning Shift') : tr('شیفت عصر', 'Evening Shift')}
                                </span>
                              </button>
                            ))}
                            {allOperators.length === 0 && (
                              <div className="col-span-2 p-4 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                                {tr('کارشناسی برای این روز تعریف نشده است.', 'No experts defined for this day.')}
                              </div>
                            )}
                          </div>
                       </div>

                     </div>

                     <div className="pt-6 border-t border-slate-100">
                       <button
                         type="submit"
                         className="group relative w-full h-14 flex items-center justify-center gap-3 font-bold text-white rounded-2xl text-lg bg-brand-600 hover:bg-brand-500 transition-all duration-300 overflow-hidden shadow-lg shadow-brand-500/25 active:scale-[0.98]"
                       >
                           <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                           <span>{tr('ورود به پنل کارشناسی', 'Enter Expert Dashboard')}</span>
                           {isFa ? <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />}
                       </button>
                       <p className="text-center text-[11px] text-slate-400 font-bold mt-4 tracking-wide">
                         {tr('« اطلاعات شما به صورت امن ثبت خواهد شد »', 'Your data will be securely logged.')}
                       </p>
                     </div>
                   </motion.form>
                   ) : (
                     <motion.form 
                       key="admin-form"
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       transition={{ duration: 0.3 }}
                       onSubmit={handleSubmit} 
                       className="space-y-8 w-full flex flex-col"
                     >
                     <div className="space-y-6 flex-1 flex flex-col justify-center mb-8">
                       <div className="space-y-2 group">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 px-1 transition-colors group-focus-within:text-brand-500">
                             <Lock size={16} className="text-slate-400 group-focus-within:text-brand-500" />
                             <span>{tr('رمز عبور مدیر', 'Admin Password')}</span>
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full h-14 border border-slate-200 bg-slate-50 rounded-2xl px-4 text-center tracking-[0.3em] text-lg font-bold placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20 text-slate-900 transition-all shadow-sm"
                              dir="ltr"
                            />
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-center p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                          <Shield size={24} className="text-amber-500 mr-3 shrink-0" />
                          <p className="text-xs text-amber-800 font-bold leading-relaxed">
                            {tr('برای ورود به عنوان مدیر، رمز عبور پیش‌فرض admin123 را وارد کنید.', 'Enter admin123 to log in as admin.')}
                          </p>
                       </div>
                     </div>

                     <div className="pt-6 border-t border-slate-100">
                       <button
                         type="submit"
                         className="group relative w-full h-14 flex items-center justify-center gap-3 font-bold text-white rounded-2xl text-lg bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 overflow-hidden shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
                       >
                           <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                           <span>{tr('ورود به پنل مدیریت', 'Enter Admin Dashboard')}</span>
                           {isFa ? <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />}
                       </button>
                     </div>
                     </motion.form>
                   )}
                 </AnimatePresence>
              </div>
           </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

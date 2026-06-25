import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar, DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useLocale } from '../../hooks/useLocale';
import { CallRecord } from '../../types';
import { customToast as toast } from '../UI/toast';

const AnalogClock = ({ hour, minute, onChangeHour, onChangeMinute, mode, setMode }: any) => {
  const size = 260;
  const center = size / 2;
  const rOuter = 100;
  const rInner = 65;
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    angle += 90;
    if (angle < 0) angle += 360;

    if (mode === 'h') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      const dist = Math.sqrt(x*x + y*y);
      if (dist < (rInner + rOuter) / 2) {
         h = h === 12 ? 0 : h + 12;
      }
      onChangeHour(h);
    } else {
      let m = Math.round(angle / 30) * 5; /* Snap to 5 minute increments */
      if (m === 60) m = 0;
      onChangeMinute(m);
    }
  };

  const renderNumbers = () => {
    if (mode === 'h') {
      const items = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        // Outer (1 to 12)
        const hOuter = i === 0 ? 12 : i;
        const x1 = center + Math.cos(angle) * rOuter;
        const y1 = center + Math.sin(angle) * rOuter;
        items.push(
          <div key={`ho-${hOuter}`} 
            className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-[14px] font-normal transition-all z-10 pointer-events-none ${hour === hOuter ? 'bg-brand-500 text-white ' : 'text-secondary'}`}
            style={{ left: x1, top: y1 }}>
            {hOuter}
          </div>
        );
        // Inner (13 to 00)
        const hInner = i === 0 ? 0 : i + 12;
        const x2 = center + Math.cos(angle) * rInner;
        const y2 = center + Math.sin(angle) * rInner;
        items.push(
          <div key={`hi-${hInner}`}
            className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-[14px] font-normal transition-all z-10 pointer-events-none ${hour === hInner || (hour === 24 && hInner === 0) ? 'bg-brand-500 text-white ' : 'text-secondary'}`}
            style={{ left: x2, top: y2 }}>
            {hInner === 0 ? '۰۰' : hInner}
          </div>
        );
      }
      return items;
    } else {
      const items = [];
      for (let i = 0; i < 12; i++) {
        const m = i * 5;
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = center + Math.cos(angle) * rOuter;
        const y = center + Math.sin(angle) * rOuter;
        items.push(
          <div key={`m-${m}`}
            className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-[14px] font-normal transition-all z-10 pointer-events-none ${minute === m ? 'bg-brand-500 text-white ' : 'text-secondary'}`}
            style={{ left: x, top: y }}>
            {m === 0 ? '۰۰' : m.toString().padStart(2, '0')}
          </div>
        );
      }
      return items;
    }
  };

  const isInner = mode === 'h' && (hour === 0 || hour === 24 || hour > 12);
  const rHand = mode === 'h' ? (isInner ? rInner : rOuter) : rOuter;
  const angleHand = mode === 'h' 
    ? ((hour % 12) * 30 - 90) * (Math.PI / 180)
    : ((minute / 5) * 30 - 90) * (Math.PI / 180);

  const hX = center + Math.cos(angleHand) * rHand;
  const hY = center + Math.sin(angleHand) * rHand;

  return (
    <div 
      className="relative bg-surface-hover border border-border rounded-full select-none  cursor-pointer" 
      style={{ width: size, height: size, touchAction: 'none' }}
      onPointerDown={(e) => {
         e.currentTarget.setPointerCapture(e.pointerId);
         setIsDragging(true);
         handleDrag(e);
      }}
      onPointerMove={(e) => {
         if (isDragging) handleDrag(e);
      }}
      onPointerUp={(e) => {
         e.currentTarget.releasePointerCapture(e.pointerId);
         if (isDragging && mode === 'h') setMode('m');
         setIsDragging(false);
      }}
    >
      {/* Center dot */}
      <div className="absolute w-2 h-2 bg-brand-500 rounded-full z-20 " style={{ left: center - 4, top: center - 4 }} />
      {/* Line */}
      <svg className="absolute inset-0 pointer-events-none z-0" width={size} height={size}>
         <line x1={center} y1={center} x2={hX} y2={hY} stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-(0px 0px 4px rgba(0,0,0,0.1))' }} />
      </svg>
      {renderNumbers()}
    </div>
  )
}

export const AdvisoryModal = ({ call, isOpen, onClose, onSave }: { call: CallRecord | null, isOpen: boolean, onClose: () => void, onSave: (date: string, time: string) => void }) => {
  const { tr, direction } = useLocale();
  const [dateObj, setDateObj] = useState<DateObject | null>(null);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [mode, setMode] = useState<'h'|'m'>('h');

  React.useEffect(() => {
    if (isOpen && call) {
      if (call.advisoryDate) {
         setDateObj(new DateObject({ date: call.advisoryDate, format: "YYYY/MM/DD", calendar: persian, locale: persian_fa }));
      } else {
         setDateObj(null);
      }
      if (call.advisoryTime) {
         const [h, m] = call.advisoryTime.split(':').map(Number);
         setHour(h);
         setMinute(m);
      } else {
         setHour(12);
         setMinute(0);
      }
      setMode('h');
    }
  }, [isOpen, call]);

  if (!isOpen || !call) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" dir={direction}>
          <style>{`
            .calendar-custom-wrapper .rmdp-wrapper {
               border: none !important;
               box-shadow: none !important;
               background: transparent !important;
            }
            .calendar-custom-wrapper .rmdp-panel-body,
            .calendar-custom-wrapper .rmdp-header,
            .calendar-custom-wrapper .rmdp-week-day,
            .calendar-custom-wrapper .rmdp-day span {
               color: var(--color-text-primary) !important;
            }
            .calendar-custom-wrapper .rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden):hover span {
               background-color: var(--color-surface-hover) !important;
               color: var(--color-text-primary) !important;
            }
            .calendar-custom-wrapper .rmdp-day.rmdp-today span {
               background-color: var(--color-surface-hover) !important;
               color: var(--color-text-primary) !important;
               border: 1px solid var(--color-border);
            }
            .calendar-custom-wrapper .rmdp-day.rmdp-selected span:not(.highlight) {
               background-color: var(--color-brand-500) !important;
               color: white !important;
               box-shadow: 0 0 15px rgba(0, 0, 0, 0.1) !important;
            }
            .calendar-custom-wrapper .rmdp-header-values {
               color: var(--color-text-primary) !important;
               font-weight: bold;
               font-size: 0 !important; /* Hide text nodes like comma */
            }
            .calendar-custom-wrapper .rmdp-header-values span:first-child {
               font-size: 16px !important;
            }
            .calendar-custom-wrapper .rmdp-header-values span:nth-child(n+2) {
               display: none !important;
            }
            .calendar-custom-wrapper .rmdp-panel-body {
               min-height: 280px !important;
            }
            .calendar-custom-wrapper .rmdp-arrow-container:hover {
               background-color: var(--color-surface-hover) !important;
            }
            .calendar-custom-wrapper .rmdp-arrow {
               border: solid var(--color-text-muted);
               border-width: 0 2px 2px 0;
            }
          `}</style>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-surface-hover/40 " />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-3xl w-full max-w-4xl relative z-10 flex flex-col overflow-hidden border border-border shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface  ">
               <button onClick={onClose} className="text-secondary hover:text-secondary transition-colors">
                 <X size={20} />
               </button>
               <div className="flex items-center gap-3 text-secondary font-medium text-lg">
                  <span>{tr('تاریخ و ساعت مشاوره', 'Consultation Date & Time')}</span>
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
                     <CalendarIcon size={20} />
                  </div>
               </div>
            </div>

            {/* Body */}
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-transparent relative">
               {/* Removed ugly gradient */}
               {/* Time Section */}
               <div className="flex-1 flex flex-col min-h-[380px]">
                  <div className="flex justify-start items-center gap-2 mb-4 w-full" dir="rtl">
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                    <span className="font-medium text-secondary">{tr('انتخاب ساعت مشاوره', 'Select Time')}</span>
                  </div>
                  <div className="flex-1 bg-surface border border-border shadow-sm rounded-3xl p-6 flex flex-col items-center  relative z-10">
                     <div className="flex items-center gap-3 text-2xl font-medium mb-8 select-none" dir="ltr">
                        <span onClick={() => setMode('h')} className={`cursor-pointer transition-colors ${mode === 'h' ? 'text-brand-500' : 'text-secondary hover:text-secondary'}`}>
                           {hour.toString().padStart(2, '0')}
                        </span>
                        <span className="text-secondary pb-1">:</span>
                        <span onClick={() => setMode('m')} className={`cursor-pointer transition-colors ${mode === 'm' ? 'text-brand-500' : 'text-secondary hover:text-secondary'}`}>
                           {minute.toString().padStart(2, '0')}
                        </span>
                     </div>
                     <AnalogClock hour={hour} minute={minute} onChangeHour={setHour} onChangeMinute={setMinute} mode={mode} setMode={setMode} />
                  </div>
               </div>

               {/* Date Section */}
               <div className="flex-1 flex flex-col min-h-[380px]">
                  <div className="flex justify-start items-center gap-2 mb-4 w-full" dir="rtl">
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                    <span className="font-medium text-secondary">{tr('انتخاب تاریخ مشاوره', 'Select Date')}</span>
                  </div>
                  <div className="flex-1 bg-surface border border-border shadow-sm rounded-3xl p-6 flex flex-col items-center justify-start relative z-10 calendar-custom-wrapper min-h-[340px]">
                     <Calendar
                        calendar={persian}
                        locale={persian_fa}
                        value={dateObj}
                        onChange={(d: any) => setDateObj(d)}
                        shadow={false}
                     />
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-start gap-4 p-5 border-t border-border bg-surface  " dir="rtl">
               <button 
                 onClick={() => {
                   if (!dateObj) return toast.error(tr('ابتدا تاریخ را انتخاب کنید.', 'Please select a date first.'));
                   onSave(dateObj.format('YYYY/MM/DD'), `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                   onClose();
                 }}
                 className="bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl px-8 py-3 text-[14px] transition-colors"
               >
                 {tr('تایید و بستن', 'Confirm & Close')}
               </button>
               <button 
                 onClick={() => {
                   onSave('', '');
                   onClose();
                 }}
                 className="border border-border text-secondary hover:bg-surface-hover font-medium rounded-xl px-8 py-3 text-[14px] transition-colors"
               >
                 {tr('حذف زمان', 'Clear Time')}
               </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

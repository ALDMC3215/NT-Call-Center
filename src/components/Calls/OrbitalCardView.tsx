import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Link as LinkIcon, BookOpen, Users, CheckCircle2, ChevronRight, UserCircle2 } from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';
import { useLocale } from '../../hooks/useLocale';
import { CALL_STATUSES, REGISTRATION_STATUSES } from '../../constants';
import { CallRecord } from '../../types';
import { customToast as toast } from '../UI/toast';
import Select from '../UI/Select';
import GlowHover from '../UI/GlowHover';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const OrbitalCardView: React.FC<{ calls: CallRecord[] }> = ({ calls }) => {
  const { recordAttempt } = useAppContext();
  const { tr, valueLabel } = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const activeCall = calls[currentIndex] as CallRecord | undefined;

  const [draft, setDraft] = useState<Partial<CallRecord>>({
    fullName: '',
    callStatus: '',
    courses: [],
    advisory: '',
    registered: ''
  });

  useEffect(() => {
    if (activeCall) {
      setDraft({
        fullName: activeCall.fullName || '',
        callStatus: activeCall.callStatus || '',
        courses: activeCall.courses || [],
        advisory: activeCall.advisory || '',
        registered: activeCall.registered || ''
      });
    }
  }, [activeCall?.id]);

  if (!activeCall || currentIndex >= calls.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface  rounded-2xl border border-border">
        <span className="text-cyan-400 mb-4 opacity-50">
          <CheckCircle2 size={64} />
        </span>
        <h3 className="text-2xl font-extrabold text-secondary mb-3">{tr('صف اول خالی است', 'Queue is empty')}</h3>
      </div>
    );
  }

  const isAnswered = draft.callStatus === 'پاسخ داد';

  const nodes = [
    { id: 'callStatus', label: 'وضعیت تماس', icon: Phone },
    { id: 'courses', label: 'انتخاب دوره', icon: BookOpen },
    { id: 'advisory', label: 'مشاوره', icon: Users },
    { id: 'registered', label: 'ثبت نام', icon: CheckCircle2 },
  ] as const;

  const getOptionsForNode = (id: string) => {
    const rawOptions = (() => {
      switch (id) {
        case 'callStatus': return CALL_STATUSES;
        case 'courses': return ['برنامه نویسی', 'طراحی وبسایت', 'هوش مصنوعی', 'اپلیکیشن نویسی', 'طراحی UI/UX'];
        case 'advisory': return ['بله', 'خیر', 'هماهنگی بعدا'];
        case 'registered': return REGISTRATION_STATUSES;
        default: return [];
      }
    })();
    
    return rawOptions.map(opt => ({ label: valueLabel(opt), value: opt }));
  };

  const handleFieldChange = (field: keyof CallRecord, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (status: string) => {
    if (status !== 'پاسخ داد') {
      // Auto-submit and skip to next if not answered
      if (!activeCall) return;
      
      recordAttempt(activeCall.id, {
        fullName: draft.fullName,
        callStatus: status,
        courses: [],
        advisory: '',
        registered: '',
        advisoryDate: activeCall.advisoryDate,
        advisoryTime: activeCall.advisoryTime,
        notes: activeCall.notes || ''
      });

      toast.success(tr('وضعیت تماس ثبت شد و به شماره بعدی رفتیم.', 'Call recorded, moving to next.'));
      setCurrentIndex(prev => prev + 1);
    } else {
      setDraft(prev => ({ ...prev, callStatus: status }));
    }
  };

  const submit = () => {
    if (!activeCall) return;
    
    recordAttempt(activeCall.id, {
      fullName: draft.fullName,
      callStatus: draft.callStatus || '',
      courses: draft.courses || [],
      advisory: draft.advisory || '',
      registered: draft.registered || '',
      advisoryDate: activeCall.advisoryDate,
      advisoryTime: activeCall.advisoryTime,
      notes: activeCall.notes || ''
    });

    toast.success(tr('تماس با موفقیت ثبت شد!', 'Call recorded successfully!'));
    setCurrentIndex(prev => prev + 1);
  };

  // Generate cards for the stack (up to 4 visible)
  const visibleCards = calls.slice(currentIndex, currentIndex + 4);

  // Prepare GlowHover items
  const glowItems = nodes.map(node => {
    const isDisabled = node.id !== 'callStatus' && !isAnswered;
    const value = node.id === 'courses' ? (draft.courses?.[0] || '') : (draft[node.id as keyof CallRecord] as string || '');
    
    return {
      id: node.id,
      element: (
        <div className="w-full px-2" dir="rtl">
          <div className="flex items-center gap-2 mb-2 px-2">
            <node.icon size={16} className={`transition-colors ${isDisabled ? 'text-secondary' : 'text-cyan-400'}`} />
            <span className={`text-sm font-medium transition-colors ${isDisabled ? 'text-secondary' : 'text-secondary'}`}>
              {tr(node.label, node.id)}
            </span>
          </div>
          <Select 
            value={value}
            options={getOptionsForNode(node.id)}
            disabled={isDisabled}
            placeholder={tr('انتخاب کنید...', 'Select...')}
            onValueChange={(val) => {
              if (node.id === 'callStatus') handleStatusChange(val);
              else if (node.id === 'courses') handleFieldChange('courses', [val]);
              else handleFieldChange(node.id as keyof CallRecord, val);
            }}
          />
        </div>
      )
    };
  });

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden bg-surface  rounded-2xl border border-border  pt-16 pb-8">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* TOP SECTION: Stacked Cards */}
      <div className="relative w-full flex-1 flex justify-center mt-8">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((card, idx) => {
            const isTop = idx === 0;
            const blur = idx > 0 ? 2 : 0;
            const scale = clamp(1 - idx * 0.08, 0.8, 1);
            const y = clamp(idx * -25, -75, 0);
            const zIndex = 20 - idx;
            
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ 
                  opacity: 1, 
                  scale, 
                  y,
                  filter: `blur(${blur}px)`
                }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)', y: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.8 }}
                className={`absolute w-[420px] rounded-[2rem] border transition-all duration-300  ${isTop ? 'bg-surface-hover/90 border-cyan-500/40  pointer-events-auto' : 'bg-surface-hover/40 border-border pointer-events-none'}`}
                style={{ zIndex }}
              >
                <div className="p-8 flex flex-col items-center justify-center h-full min-h-[220px]">
                  <UserCircle2 size={48} className={`mb-4 transition-colors ${isTop ? 'text-cyan-400' : 'text-secondary'}`} />
                  
                  <span dir="ltr" className={`text-4xl font-extrabold tracking-widest drop- transition-colors ${isTop ? 'text-white' : 'text-secondary'}`}>
                    {card.phone}
                  </span>
                  
                  {isTop ? (
                    <div className="mt-6 w-full px-4 relative z-50">
                      <input 
                        type="text"
                        value={draft.fullName || ''}
                        onChange={e => handleFieldChange('fullName', e.target.value)}
                        placeholder={tr('نام و نام خانوادگی...', 'Full Name...')}
                        className="text-center w-full bg-surface-hover border-b border-cyan-500/30 hover:border-brand-500 focus:border-cyan-300 outline-none text-white font-medium pb-2 pt-2 text-sm transition-colors rounded-t-xl px-2"
                      />
                    </div>
                  ) : null}

                  {/* Advisory Date */}
                  {isTop && card.advisoryDate && (
                    <div className="mt-4 bg-surface-hover px-5 py-2 rounded-full border border-border flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-xs text-cyan-100 font-medium">
                        {tr('تاریخ مشاوره:', 'Advisory Date:')} {card.advisoryDate} {card.advisoryTime || ''}
                      </span>
                    </div>
                  )}
                  
                  <div className={`absolute top-6 right-6 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${isTop ? 'bg-cyan-900/50 text-cyan-100 border border-cyan-500/30' : 'bg-surface-hover text-secondary border border-border'}`}>
                    ردیف {(card.queueOrder ?? 0) + 1}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* MIDDLE SECTION: GlowHover Fields */}
      <div className="w-full max-w-5xl px-8 mb-12 relative z-40">
        <GlowHover 
          items={glowItems}
          className="flex justify-center gap-2 w-full"
          glowIntensity={0.15}
        />
      </div>

      {/* BOTTOM SECTION: Submit Button */}
      <div className="relative z-50 mt-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={submit}
          className={`relative overflow-hidden h-14 px-12 rounded-full font-extrabold text-[15px] transition-all flex items-center justify-center gap-3 
            ${!!(draft.callStatus || (draft.courses && draft.courses.length > 0) || draft.advisory || draft.registered)
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white  hover:'
              : 'bg-surface-hover/80 text-secondary cursor-not-allowed border border-border '
            }
          `}
        >
          {/* Shimmer Effect */}
          {!!(draft.callStatus || (draft.courses && draft.courses.length > 0) || draft.advisory || draft.registered) && (
            <motion.div 
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
            />
          )}
          
          <span className="relative z-10">{tr('ثبت تماس و بعدی', 'Submit & Next')}</span>
          <ChevronRight size={20} className="relative z-10" />
        </motion.button>
      </div>

    </div>
  );
};

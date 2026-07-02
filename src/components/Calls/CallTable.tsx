import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { Trash2, FileText, X, PhoneCall, Link as LinkIcon, Users, BookOpen, CheckCircle, CalendarClock, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Dices, ShieldBan } from 'lucide-react';
import { CALL_STATUSES, LINK_OPTIONS, ADV_OPTIONS, REGISTRATION_STATUSES, COURSES } from '../../constants';
import { CallRecord } from '../../types';
import { InlineJalaliCalendar } from '../Shared/InlineJalaliCalendar';
import { InlineAnalogTimePicker } from '../Shared/InlineAnalogTimePicker';
import { CustomSelect } from '../Shared/CustomSelect';
import { customToast as toast } from '../UI/toast';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { Z } from '../../constants/zIndex';

const GRID_LAYOUT = "grid grid-cols-[170px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_100px_100px] gap-4 items-center";

interface CallRowProps {
  call: CallRecord;
  index: number;
  updateCallAction: (c: CallRecord) => void;
  blockAction: (phone: string, id: string) => void;
}

const CallRow: React.FC<CallRowProps> = React.memo(({ call, index, updateCallAction, blockAction }) => {
  const [notes, setNotes] = useState(call.notes || '');
  const [advisoryDate, setAdvisoryDate] = useState(call.advisoryDate || '');
  const [advisoryTime, setAdvisoryTime] = useState(call.advisoryTime || '');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showConfirmClearNotes, setShowConfirmClearNotes] = useState(false);
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);

  const getFeatureColor = (value: string) => {
    if (!value) return 'border-border text-secondary bg-surface-hover hover:bg-slate-200';

    if (['پاسخ داد', 'بله', 'ثبت نام کرد', 'ارسال شد'].includes(value))
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';

    if (['پاسخ نداد', 'خیر', 'ثبت نام نکرد', 'ارسال نشد'].includes(value))
      return 'border-rose-500/30 bg-rose-500/10 text-rose-400';

    if (value === 'پاسخ نداد')
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    if (value === 'ناموجود')
      return 'border-rose-500/30 bg-rose-500/10 text-rose-400';

    if (['در دسترس نیست', 'هماهنگی بعدا', 'در حال بررسی'].includes(value))
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400';

    if (['عدم تمایل', 'قصد ندارد'].includes(value))
      return 'border-border bg-slate-200 text-secondary';

    return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
  };

  const handleUpdate = React.useCallback((field: keyof CallRecord, value: any) => {
    updateCallAction({ ...call, [field]: value });
  }, [call, updateCallAction]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (notes !== call.notes) {
        handleUpdate('notes', notes);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [notes, call.notes, handleUpdate]);

  const showAdvisoryCols = call.advisory === 'بله';

  return (
    <div className="group relative bg-transparent border-b border-border hover:bg-surface-hover py-4 px-4 z-10 transition-all duration-150 ease-out last:border-0 pointer-events-auto">
      <div className={`w-full ${GRID_LAYOUT}`}>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <div className="font-medium tracking-wider text-secondary text-[16px]" dir="ltr">
            {call.phone || '-'}
          </div>
        </div>

        {/* Status */}
        <div className="min-w-0">
          <CustomSelect
            value={call.callStatus || ''}
            onChange={(val) => handleUpdate('callStatus', val)}
            options={CALL_STATUSES.map(s => ({ value: s, label: s }))}
            placeholder="وضعیت تماس"
            variant="unstyled"
            customTrigger={
              <div
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-[12px] font-medium border ${getFeatureColor(call.callStatus || '')}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {!call.callStatus && <PhoneCall size={14} className="text-secondary" />}
                  <span className="truncate">{call.callStatus || 'وضعیت تماس'}</span>
                </div>
                <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-1" />
              </div>
            }
          />
        </div>

        {/* Link */}
        <div className="min-w-0">
          <CustomSelect
            value={call.linkSent || ''}
            onChange={(val) => handleUpdate('linkSent', val)}
            options={LINK_OPTIONS.map(s => ({ value: s, label: s }))}
            placeholder="ارسال لینک"
            variant="unstyled"
            customTrigger={
              <div
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-[12px] font-medium border ${getFeatureColor(call.linkSent || '')}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {!call.linkSent && <LinkIcon size={14} className="text-secondary" />}
                  <span className="truncate">{call.linkSent || 'وضعیت لینک'}</span>
                </div>
                <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-1" />
              </div>
            }
          />
        </div>

        {/* Course */}
        <div className="min-w-0">
          <CustomSelect
            value={call.courses?.[0] || ''}
            onChange={(val) => handleUpdate('courses', val ? [val] : [])}
            options={COURSES.map(s => ({ value: s, label: s }))}
            placeholder="پکیج"
            variant="unstyled"
            customTrigger={
              <div
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-[12px] font-medium border ${getFeatureColor(call.courses?.[0] || '')}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {!call.courses?.[0] && <BookOpen size={14} className="text-secondary" />}
                  <span className="truncate">{call.courses?.[0] || 'پکیج'}</span>
                </div>
                <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-1" />
              </div>
            }
          />
        </div>

        {/* Advisory */}
        <div className="min-w-0">
          <CustomSelect
            value={call.advisory || ''}
            onChange={(val) => {
              if (val !== 'بله') {
                  updateCallAction({
                    ...call,
                    advisory: val,
                    advisoryDate: '',
                    advisoryTime: ''
                  });
                  setAdvisoryDate('');
                  setAdvisoryTime('');
              } else {
                  handleUpdate('advisory', val);
              }
            }}
            options={ADV_OPTIONS.map(s => ({ value: s, label: s }))}
            placeholder="مشاوره"
            variant="unstyled"
            customTrigger={
              <div
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-[12px] font-medium border ${getFeatureColor(call.advisory || '')}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {!call.advisory && <Users size={14} className="text-secondary" />}
                  <span className="truncate">{call.advisory || 'بدون وضعیت'}</span>
                </div>
                <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-1" />
              </div>
            }
          />
        </div>

        {/* Registration */}
        <div className="min-w-0">
          <CustomSelect
            value={call.registered || ''}
            onChange={(val) => handleUpdate('registered', val)}
            options={REGISTRATION_STATUSES.map(s => ({ value: s, label: s }))}
            placeholder="وضعیت ثبت نام"
            variant="unstyled"
            customTrigger={
              <div
                className={`flex items-center justify-between w-full px-3 py-1.5 rounded-xl text-[12px] font-medium border ${getFeatureColor(call.registered || '')}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {!call.registered && <CheckCircle size={14} className="text-secondary" />}
                  <span className="truncate">{call.registered || 'نامشخص'}</span>
                </div>
                <ChevronDown size={14} className="text-secondary flex-shrink-0 ml-1" />
              </div>
            }
          />
        </div>

        {/* Date / Time */}
        <div className="flex justify-center text-center">
          {showAdvisoryCols ? (
            <>
              <button
                onClick={() => setIsDateTimeModalOpen(true)}
                className={`w-8 h-8 flex items-center justify-center rounded-xl ${advisoryDate || advisoryTime ? 'border border-brand-500/50 bg-brand-500/20 text-brand-700' : 'border border-border bg-surface-hover text-secondary hover:bg-slate-200 hover:text-secondary'}`}
                title="زمانبندی مشاوره"
              >
                <CalendarClock size={16} />
              </button>

              {isDateTimeModalOpen && (
                <Modal onClose={() => setIsDateTimeModalOpen(false)} maxWidth="max-w-5xl">
                  <div className="px-6 py-4 border-b border-border bg-surface  text-left">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-surface-hover text-secondary flex items-center justify-center border border-border">
                            <CalendarClock size={16} />
                          </div>
                          <h3 className="font-medium text-secondary text-lg">زمانبندی مشاوره</h3>
                      </div>
                      <button
                        onClick={() => setIsDateTimeModalOpen(false)}
                        className="text-secondary hover:text-secondary rounded-xl p-1"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="p-8 bg-surface-hover flex flex-col md:flex-row gap-8 text-left">
                      <div className="flex-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-surface-hover"></div>
                            انتخاب تاریخ
                        </label>
                        <div className="bg-surface  rounded-xl border border-border p-4 h-[320px] ">
                          <InlineJalaliCalendar
                            value={advisoryDate}
                            onChange={(val) => {
                                setAdvisoryDate(val);
                                handleUpdate('advisoryDate', val);
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="flex-1 md:max-w-[320px]">
                        <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-surface-hover"></div>
                            انتخاب زمان
                        </label>
                        <div className="bg-surface  rounded-xl border border-border p-4 h-[320px] flex items-center justify-center ">
                          <InlineAnalogTimePicker
                            value={advisoryTime}
                            onChange={(val) => {
                                setAdvisoryTime(val);
                                handleUpdate('advisoryTime', val);
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                  </div>
                  <div className="px-6 py-4 border-t border-border bg-surface  flex justify-end gap-3 rounded-xl-b-md">
                      <button
                        onClick={() => {
                            setAdvisoryDate('');
                            setAdvisoryTime('');
                            handleUpdate('advisoryDate', '');
                            handleUpdate('advisoryTime', '');
                        }}
                        className="px-6 py-2 bg-surface  border border-border text-secondary rounded-xl text-sm font-medium hover:bg-surface  /5"
                      >
                        پاک کردن
                      </button>
                      <button
                        onClick={() => setIsDateTimeModalOpen(false)}
                        className="px-6 py-2 bg-surface-hover text-slate-900 border border-slate-800 rounded-xl text-sm font-medium hover:bg-surface-hover"
                      >
                        تایید و بستن
                      </button>
                  </div>
                </Modal>
              )}
            </>
          ) : (
            <span className="text-secondary">-</span>
          )}
        </div>

        {/* Notes & Actions */}
        <div className="flex justify-center items-center gap-2 text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('آیا مایلید این شماره به لیست سیاه اضافه و همچنین از صف تماس‌ها پاک شود؟')) {
                  blockAction(call.phone, call.id);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-xl tooltip-left-edge bg-red-50/50 text-red-500 hover:bg-red-500 hover:text-slate-900 border border-red-100 transition-colors"
              data-tooltip-bottom="افزودن به لیست سیاه"
            >
              <ShieldBan size={15} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsNotesOpen(true)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl tooltip-left-edge ${notes ? 'border border-brand-500/50 bg-brand-500/20 text-brand-700' : 'border border-border bg-surface-hover text-secondary hover:bg-slate-200 hover:text-secondary'}`}
              data-tooltip-bottom="یادداشت"
            >
              <FileText size={16} />
            </button>

          {isNotesOpen && (
            <Modal onClose={() => setIsNotesOpen(false)} maxWidth="max-w-lg">
              <div className="px-6 py-4 border-b border-border bg-surface  ">
                <div className="flex justify-between items-center w-full">
                  <h3 className="font-medium text-secondary text-lg flex items-center gap-3 text-right">
                      <div className="w-8 h-8 rounded-xl bg-surface-hover border border-border text-secondary flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      یادداشت‌های تماس
                  </h3>
                  <button onClick={() => setIsNotesOpen(false)} className="text-secondary hover:text-secondary rounded-xl p-1">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 bg-surface-hover">
                  <textarea
                    autoFocus
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="جزئیات و یادداشت‌های مربوط به این تماس را وارد کنید..."
                    className="w-full min-h-[180px] p-4 bg-surface  border border-border rounded-xl focus:outline-none focus:border-slate-800 resize-y text-sm font-normal text-secondary placeholder-slate-400"
                  />
              </div>
              <div className="px-6 py-4 border-t border-border bg-surface  flex justify-between items-center rounded-xl-b-md">
                  <button
                    onClick={() => setShowConfirmClearNotes(true)}
                    className="flex items-center gap-1.5 px-4 py-2 text-secondary border border-border hover:bg-surface  /5 rounded-xl text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    حذف
                  </button>

                  <ConfirmDialog
                    isOpen={showConfirmClearNotes}
                    title="حذف یادداشت"
                    message="آیا از حذف این یادداشت اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
                    onConfirm={() => setNotes('')}
                    onCancel={() => setShowConfirmClearNotes(false)}
                  />
                <button
                  onClick={() => setIsNotesOpen(false)}
                  className="px-6 py-2 bg-surface-hover text-slate-900 rounded-xl text-sm font-medium hover:bg-surface-hover tracking-wide border border-slate-800"
                >
                  ذخیره
                </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  </div>
);
}, (prevProps, nextProps) => prevProps.call === nextProps.call);

CallRow.displayName = 'CallRow';

// Reusable Modal Wrapper (Flat, No Animation)
const Modal = ({ children, onClose, maxWidth = 'max-w-3xl' }: { children: React.ReactNode; onClose: () => void; maxWidth?: string }) => {
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-surface-hover overflow-hidden text-left p-4"
      style={{ zIndex: Z.MODAL_BACKDROP }}
      dir="ltr"
      onClick={onClose}
    >
      <div
        className={`bg-surface  rounded-xl border border-border w-full max-h-full overflow-y-auto ${maxWidth} flex flex-col relative`}
        style={{ zIndex: Z.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

interface SortableHeaderProps {
  label: string;
  sortKey: keyof CallRecord | null;
  sortConfig: { key: keyof CallRecord | null; direction: 'asc' | 'desc' | null };
  requestSort: (key: keyof CallRecord) => void;
  align?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = React.memo(({ label, sortKey, sortConfig, requestSort, align = "text-center" }) => {
  const isSorted = sortConfig.key === sortKey && sortConfig.direction !== null;
  const direction = sortConfig.key === sortKey ? sortConfig.direction : null;

  return (
    <div
      className={`font-sans text-[12px] font-medium tracking-wider uppercase px-2 group ${sortKey ? 'cursor-pointer hover:text-secondary text-secondary' : 'text-secondary'} text-center`}
      onClick={() => sortKey && requestSort(sortKey)}
    >
       <div className={`flex items-center gap-1.5 justify-center`}>
         <span className={`${isSorted ? 'text-secondary' : ''}`}>{label}</span>
         {sortKey && (
           <span className={`flex flex-col items-center justify-center ${isSorted ? 'text-secondary' : 'text-secondary group-hover:text-secondary'}`}>
             {direction === 'asc' ? <ArrowUp size={12} strokeWidth={3} /> : direction === 'desc' ? <ArrowDown size={12} strokeWidth={3} /> : <ArrowUpDown size={12} strokeWidth={2} />}
           </span>
         )}
       </div>
    </div>
  );
});

export const CallTable = () => {
  const { calls, bulkAddCalls, clearAllCalls, updateCall, deleteCall, addToBlacklist, blacklist, isBlacklisted } = useAppContext();
  const [sortConfig, setSortConfig] = useState<{ key: keyof CallRecord | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });
  const [isAddingCall, setIsAddingCall] = useState(false);
  const [newPhoneState, setNewPhoneState] = useState('');
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  const blockCallAction = React.useCallback((phone: string, id: string) => {
    addToBlacklist(phone);
    deleteCall(id);
    toast.success('شماره به لیست سیاه منتقل و از جدول حذف شد.');
  }, [addToBlacklist, deleteCall]);

  const sortedCalls = React.useMemo(() => {
    let sortableItems = [...calls];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key as keyof CallRecord;
        let aValue = String(a[key] || '');
        let bValue = String(b[key] || '');

        if (Array.isArray(a[key])) aValue = String((a[key] as any)[0] || '');
        if (Array.isArray(b[key])) bValue = String((b[key] as any)[0] || '');

        return aValue.localeCompare(bValue, 'en') * (sortConfig.direction === 'asc' ? 1 : -1);
      });
    }
    return sortableItems;
  }, [calls, sortConfig]);

  const requestSort = React.useCallback((key: keyof CallRecord) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key: direction ? key : null, direction });
  }, [sortConfig]);



  const handleGenerateTestData = () => {
    const newCalls = Array.from({ length: 45 }, () => {
      const callStatus = CALL_STATUSES[Math.floor(Math.random() * CALL_STATUSES.length)];
      const linkSent = LINK_OPTIONS[Math.floor(Math.random() * LINK_OPTIONS.length)];
      const advisory = ADV_OPTIONS[Math.floor(Math.random() * ADV_OPTIONS.length)];
      const registered = REGISTRATION_STATUSES[Math.floor(Math.random() * REGISTRATION_STATUSES.length)];
      const course = COURSES[Math.floor(Math.random() * COURSES.length)];

      const pastDays = Math.floor(Math.random() * 10);
      const hours = Math.floor(Math.random() * 10) + 8;

      return {
        phone: `09${Math.floor(Math.random() * 900000000 + 100000000)}`,
        callStatus: Math.random() > 0.1 ? callStatus : '',
        linkSent: Math.random() > 0.2 ? linkSent : '',
        courses: Math.random() > 0.3 ? [course] : [],
        advisory: Math.random() > 0.2 ? advisory : '',
        advisoryDate: advisory === 'بله' ? `1405/03/${(20 + pastDays).toString().padStart(2, '0')}` : '',
        advisoryTime: advisory === 'بله' ? `${hours.toString().padStart(2, '0')}:00` : '',
        registered: Math.random() > 0.3 ? registered : '',
        notes: Math.random() > 0.5 ? 'این یک یادداشت عملیاتی است که به صورت تستی ثبت شده است.' : ''
      };
    });

    bulkAddCalls(newCalls);
    toast.success('داده‌های تستی با موفقیت اضافه شد.');
  };

  const submitManualCall = () => {
    const cleanPhone = newPhoneState.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      toast.error('شماره تلفن نامعتبر است.');
      return;
    }
    if (isBlacklisted(cleanPhone)) {
      toast.error('خطا: این شماره در لیست سیاه قرار دارد و نمی‌تواند اضافه شود.');
      return;
    }
    const newCall = {
      phone: cleanPhone,
      callStatus: '',
      courses: [],
      advisory: '',
      advisoryDate: '',
      advisoryTime: '',
      registered: '',
      notes: ''
    };
    bulkAddCalls([newCall]);
    setNewPhoneState('');
    setIsAddingCall(false);
    toast.success('شماره جدید اضافه شد.');
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full relative">
      {/* Editorial Header Controls */}
      <div className="flex justify-between items-end mb-4 px-4 mt-2 shrink-0">
         <div className="flex items-center gap-2">
            {isAddingCall && (
              <div className="flex items-center gap-2 bg-surface  border border-border rounded-xl px-1 min-w-[200px] h-9">
                <button
                  onClick={() => setIsAddingCall(false)}
                  className="p-1 text-secondary hover:text-secondary rounded-xl"
                >
                  <X size={16} />
                </button>
                <input
                  autoFocus
                  type="text"
                  dir="ltr"
                  value={newPhoneState}
                  onChange={e => setNewPhoneState(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitManualCall()}
                  placeholder="0912..."
                  className="w-[120px] text-sm bg-transparent border-none outline-none text-center font-sans tracking-widest text-secondary placeholder-slate-400"
                />
                <button
                  onClick={submitManualCall}
                  className="px-3 py-1 text-xs font-medium text-white bg-brand-600 rounded-xl hover:bg-brand-500 ml-auto"
                >
                  ثبت
                </button>
              </div>
            )}

            {!isAddingCall && (
               <button
                 onClick={() => setIsAddingCall(true)}
                 className="flex justify-center items-center gap-2 px-4 h-9 text-[13px] font-medium text-white bg-slate-200 rounded-xl hover:bg-slate-300 transition-colors border border-border"
                 title="افزودن دستی شماره"
               >
                 <PhoneCall size={14} />
                 افزودن شماره
               </button>
            )}

            <button
              onClick={() => setShowConfirmClearAll(true)}
              disabled={calls.length === 0}
              className={`flex justify-center items-center px-4 h-9 rounded-xl border transition-colors font-medium text-[13px] ${
                 calls.length === 0 ? 'text-secondary border-border bg-transparent cursor-not-allowed' : 'text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20'
              }`}
              title="حذف همه"
            >
              <Trash2 size={14} className="ml-2" />
              حذف همه
            </button>

            <ConfirmDialog
              isOpen={showConfirmClearAll}
              title="حذف تمام تماس‌ها"
              message="آیا مطمئن هستید که می‌خواهید تمام شماره‌ها را از صف حذف کنید؟ این عملیات غیرقابل بازگشت است."
              onConfirm={() => {
                 clearAllCalls();
                 setShowConfirmClearAll(false);
                 toast.success('تمامی تماس‌ها حذف شدند.');
              }}
              onCancel={() => setShowConfirmClearAll(false)}
            />
         </div>

          <div className="flex items-center">
            <button
              onClick={handleGenerateTestData}
              className="flex justify-center items-center w-9 h-9 text-brand-700 border border-brand-500/30 bg-brand-500/10 rounded-xl hover:bg-brand-500/20 transition-colors"
              title="تولید داده تستی"
            >
              <Dices size={16} />
            </button>
         </div>
      </div>

      {/* Modern List Header */}
      {calls.length > 0 && (
        <>
          <div className={`w-full py-3 mb-4 mt-2 shrink-0 bg-surface  border-b border-border px-4 ${GRID_LAYOUT}`}>
              <SortableHeader label="شماره تماس" sortKey="phone" align="text-right" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="وضعیت تماس" sortKey="callStatus" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="ارسال لینک" sortKey="linkSent" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="پکیج" sortKey="courses" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="مشاوره" sortKey="advisory" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="وضعیت" sortKey="registered" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="زمانبندی" sortKey="advisoryDate" align="text-center" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="یادداشت" sortKey="notes" align="text-center" sortConfig={sortConfig} requestSort={requestSort} />
          </div>

          {/* scrollable List Body */}
          <div className="overflow-auto flex-1 hide-scrollbar pb-10" id="table-scroll-container">
              <div className="flex flex-col relative w-full border border-border rounded-xl overflow-hidden bg-surface   pointer-events-none">
                {sortedCalls.map((c, i) => (
                  <CallRow key={c.id} call={c} index={i} updateCallAction={updateCall} blockAction={blockCallAction} />
                ))}
              </div>
          </div>
        </>
      )}

      {calls.length === 0 && (
        <div className="overflow-auto flex-1 hide-scrollbar pb-10" id="table-scroll-container">
           <div className="flex flex-col relative w-full h-full">
              <div className="w-full h-full min-h-[300px] flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface  my-4 border border-dashed border-border rounded-xl w-full max-w-3xl mx-auto">
                <div className="mb-4">
                  <span className="text-secondary font-bold text-4xl tracking-tight block text-center leading-none font-sans">NovinTech</span>
                </div>
                <h4 className="text-secondary font-medium text-lg mb-2">Education Portal</h4>
                <p className="text-secondary text-sm max-w-[340px] leading-relaxed font-normal mb-6">
                  Welcome to NovinTech call management system. There is no data in the queue; to get started, add new calls manually or use an imported list.
                </p>
                <div className="flex justify-center mt-2 pointer-events-none">
                  {/* Provide a visual indicator, but actual insertion is in header */}
                  <PhoneCall size={32} strokeWidth={1} className="text-secondary" />
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

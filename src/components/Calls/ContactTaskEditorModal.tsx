import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Edit3 } from 'lucide-react';
import { ContactTask, ContactTaskType } from '../../types';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

interface ContactTaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ContactTask;
  onSubmit: (taskId: string, data: {
    taskType: ContactTaskType;
    scheduledDate: string;
    scheduledTime?: string;
    followupNote?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ContactTaskEditorModal: React.FC<ContactTaskEditorModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmit,
  isSubmitting
}) => {
  const [taskType, setTaskType] = useState<ContactTaskType>(task.task_type);
  const [date, setDate] = useState<string>(task.scheduled_date || '');
  const [time, setTime] = useState<string>(task.scheduled_time || '');
  const [note, setNote] = useState<string>(task.followup_note || '');

  useEffect(() => {
    if (isOpen) {
      setTaskType(task.task_type);
      setDate(task.scheduled_date || '');
      setTime(task.scheduled_time || '');
      setNote(task.followup_note || '');
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!date) {
      alert('لطفا تاریخ پیگیری را مشخص کنید.');
      return;
    }
    if (taskType === 'other_followup' && !note.trim()) {
      alert('برای سایر پیگیری‌ها درج یادداشت الزامی است.');
      return;
    }
    onSubmit(task.id, {
      taskType,
      scheduledDate: date,
      scheduledTime: time || undefined,
      followupNote: note || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col my-auto relative">
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">ویرایش پیگیری</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">نوع پیگیری</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTaskType('retry_call')}
                className={`py-2 px-2 text-sm rounded-lg border transition-colors ${taskType === 'retry_call' ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                تماس مجدد
              </button>
              <button
                onClick={() => setTaskType('consultation_reminder')}
                className={`py-2 px-2 text-sm rounded-lg border transition-colors ${taskType === 'consultation_reminder' ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                تماس مشاوره
              </button>
              <button
                onClick={() => setTaskType('other_followup')}
                className={`py-2 px-2 text-sm rounded-lg border transition-colors ${taskType === 'other_followup' ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                سایر
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <label className="block text-[13px] font-bold text-slate-700 mb-2">
                تاریخ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  containerClassName="w-full"
                  inputClass="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium px-11 text-[15px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                  placeholder="انتخاب تاریخ"
                  value={date}
                  onChange={(dateObj: any) => {
                    if (dateObj) {
                      const dateString = `${dateObj.year}-${String(dateObj.month.number).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
                      setDate(dateString);
                    } else {
                      setDate('');
                    }
                  }}
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-[13px] font-bold text-slate-700 mb-2">ساعت (اختیاری)</label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium pr-11 pl-3 text-[15px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                />
                <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              یادداشت {taskType === 'other_followup' && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={150}
                rows={2}
                placeholder={taskType === 'other_followup' ? 'دلیل پیگیری را بنویسید...' : 'یادداشت کوتاه (اختیاری)'}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <Edit3 className="absolute right-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
            <div className="text-left text-xs text-slate-400 mt-1">
              {note.length} / 150
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm shadow-blue-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

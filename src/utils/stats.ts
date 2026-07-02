import { CallRecord } from '../types';
import { isActiveFollowup } from './followups';

export function calculateStats(calls: CallRecord[]) {
  const total = calls.length;
  const interested = calls.filter(c => c.callStatus === 'علاقه مند').length;
  const notInterested = calls.filter(c => c.callStatus === 'عدم تمایل').length;
  const noAnswer = calls.filter(c => c.callStatus === 'پاسخ نداد').length;
  const followUp = calls.filter(isActiveFollowup).length;
  const inactive = calls.filter(c => c.callStatus === 'شماره ناموجود' || c.callStatus === 'دستگاه خاموش').length;
  const registered = calls.filter(c => c.registered === 'ثبت نام کرد').length;
  const advisorySet = calls.filter(c => c.advisory === 'بله').length;
  const successRate = total ? ((interested / total) * 100).toFixed(1) + '%' : '0%';

  return {
    total,
    interested,
    notInterested,
    noAnswer,
    followUp,
    inactive,
    registered,
    advisorySet,
    successRate
  };
}

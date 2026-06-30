import { CallRecord } from '../types';

/**
 * Returns true if the call record is an active follow-up based on business rules.
 */
export const isActiveFollowup = (c: CallRecord): boolean => {
  if (!c.attempts || c.attempts.length === 0) return false;
  const lastAttempt = c.attempts[c.attempts.length - 1];

  const reg = lastAttempt.registered;
  if (reg === 'ثبت نام کرد' || reg === 'ثبت نام نکرد' || reg === 'قصد ندارد') {
    return false;
  }

  const s = lastAttempt.callStatus;
  const adv = lastAttempt.advisory;
  return s === 'عدم تمایل' ||
         s === 'پاسخ نداد' ||
         s === 'نامشخص' ||
         s === 'پیگیری مجدد در هفته آینده' ||
         adv === 'بله' ||
         adv === 'خیر' ||
         adv === 'قصد دارد' ||
         adv === 'در آینده' ||
         adv === 'احتمالا';
};

/**
 * Filters the list to only active follow-ups.
 */
export const getActiveFollowups = (calls: CallRecord[]): CallRecord[] => {
  return calls.filter(isActiveFollowup);
};

/**
 * Builds a sanitized payload for exporting or sharing follow-up snapshots.
 */
export const buildFollowUpSnapshot = (calls: CallRecord[]) => {
  const followups = getActiveFollowups(calls);
  
  return followups.map(c => {
    const lastAttempt = c.attempts && c.attempts.length > 0 ? c.attempts[c.attempts.length - 1] : null;
    return {
      fullName: (c.fullName && c.fullName.trim() !== '') ? c.fullName : null,
      phone: c.phone || null,
      callStatus: c.callStatus || null,
      registered: c.registered || null,
      courses: Array.isArray(c.courses) && c.courses.length > 0 ? c.courses : [],
      advisory: c.advisory || null,
      advisoryDate: c.advisoryDate || null,
      advisoryTime: c.advisoryTime || null,
      nextFollowUpAt: c.nextFollowUpAt || null,
      notes: c.notes || null,
      latestAttemptAt: lastAttempt ? (lastAttempt.createdAt || null) : (c.createdAt || null)
    };
  });
};

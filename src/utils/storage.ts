import { CallRecord, Profile } from '../types';

const PROFILE_KEY = 'novintech_profile';

export const storage = {
  getCalls: (username: string): CallRecord[] => {
    if (!username) return [];
    // Migration from old version if needed
    const oldCalls = localStorage.getItem('novintech_calls');
    if (oldCalls) {
      localStorage.setItem(`novintech_calls_${username}`, oldCalls);
      localStorage.removeItem('novintech_calls');
    }
    const parsed: CallRecord[] = JSON.parse(localStorage.getItem(`novintech_calls_${username}`) || '[]');
    // داده‌های نسخه‌های قبلی بدون تاریخچه و ترتیب نیز قابل استفاده می‌مانند.
    return parsed.map((call, index) => {
      const legacyAttempt = call.callStatus ? [{
        id: `legacy-${call.id}`,
        createdAt: new Date(0).toISOString(),
        jalaliDateTime: call.createdAt,
        callStatus: call.callStatus,
        courses: call.courses || [],
        advisory: call.advisory || '',
        advisoryDate: call.advisoryDate || '',
        advisoryTime: call.advisoryTime || '',
        registered: call.registered || '',
        notes: call.notes || ''
      }] : [];
      return {
        ...call,
        queueOrder: call.queueOrder ?? index,
        attempts: Array.isArray(call.attempts) ? call.attempts : legacyAttempt
      };
    });
  },
  saveCalls: (username: string, data: CallRecord[]) => {
    if (!username) return;
    localStorage.setItem(`novintech_calls_${username}`, JSON.stringify(data));
  },
  getProfile: (): Profile | null => JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'),
  saveProfile: (p: Profile) => localStorage.setItem(PROFILE_KEY, JSON.stringify(p)),
  logout: () => localStorage.removeItem(PROFILE_KEY),
  getBlacklist: (): string[] => JSON.parse(localStorage.getItem('novintech_blacklist') || '[]'),
  saveBlacklist: (phones: string[]) => localStorage.setItem('novintech_blacklist', JSON.stringify(phones)),
  addToBlacklist: (phone: string) => {
    const list = storage.getBlacklist();
    if (!list.includes(phone)) {
      list.push(phone);
      storage.saveBlacklist(list);
    }
  },
  removeFromBlacklist: (phone: string) => {
    const list = storage.getBlacklist();
    storage.saveBlacklist(list.filter(p => p !== phone));
  },
  clearAll: (username: string) => { 
    if (username) localStorage.removeItem(`novintech_calls_${username}`); 
  },
  wipeAllData: () => {
    localStorage.clear();
  }
};

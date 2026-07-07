import { CallRecord, Profile, BlacklistEntry, BlacklistReason, TrashEntry } from '../types';

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
        advisory: call.advisory || '',
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
  getBlacklist: (): BlacklistEntry[] => {
    const data = JSON.parse(localStorage.getItem('novintech_blacklist') || '[]');
    return data.map((item: any) => {
      if (typeof item === 'string') {
        return { phone: item, reason: 'افزودن دستی' as BlacklistReason, createdAt: new Date().toISOString() };
      }
      return item;
    });
  },
  saveBlacklist: (entries: BlacklistEntry[]) => localStorage.setItem('novintech_blacklist', JSON.stringify(entries)),
  addToBlacklist: (phone: string, reason: BlacklistReason = 'افزودن دستی') => {
    const list = storage.getBlacklist();
    if (!list.some(entry => entry.phone === phone)) {
      list.push({ phone, reason, createdAt: new Date().toISOString() });
      storage.saveBlacklist(list);
    }
  },
  removeFromBlacklist: (phone: string) => {
    const list = storage.getBlacklist();
    storage.saveBlacklist(list.filter(entry => entry.phone !== phone));
  },
  isBlacklisted: (phone: string): boolean => {
    return storage.getBlacklist().some(entry => entry.phone === phone);
  },
  clearAll: (username: string) => { 
    if (username) localStorage.removeItem(`novintech_calls_${username}`); 
  },
  wipeAllData: () => {
    localStorage.clear();
  },
  getTrash: (): TrashEntry[] => {
    return JSON.parse(localStorage.getItem('novintech_trash') || '[]');
  },
  addToTrash: (entry: TrashEntry) => {
    const list = storage.getTrash();
    // Don't add if already there
    if (!list.some(e => e.id === entry.id)) {
      list.push(entry);
      localStorage.setItem('novintech_trash', JSON.stringify(list));
    }
  },
  removeFromTrash: (id: string) => {
    const list = storage.getTrash();
    localStorage.setItem('novintech_trash', JSON.stringify(list.filter(e => e.id !== id)));
  }
};

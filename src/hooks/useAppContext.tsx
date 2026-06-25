import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CallAttempt, CallRecord, Profile } from '../types';
import { storage } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { jalaliDateTimeToIso, nowJalali } from '../utils/jalali';

export type ViewType = 'dashboard' | 'profile' | 'settings' | 'stats' | 'admin' | 'blacklist' | 'reports' | 'experts' | 'managers' | 'about';

interface AppContextType {
  profile: Profile | null;
  calls: CallRecord[];
  blacklist: string[];
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  activeCallTab: 'cards' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses';
  setActiveCallTab: (tab: 'cards' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses') => void;
  setProfile: (p: Profile) => void;
  logout: () => void;
  addCall: (call: Omit<CallRecord, 'id' | 'createdAt'>) => void;
  updateCall: (call: CallRecord) => void;
  deleteCall: (id: string) => void;
  clearAllCalls: () => void;
  bulkAddCalls: (callsArray: Omit<CallRecord, 'id' | 'createdAt'>[]) => void;
  importData: (profile: Profile, calls: CallRecord[]) => void;
  wipeAllData: () => void;
  importedData: { profile: Profile; calls: CallRecord[] } | null;
  setImportedData: (data: { profile: Profile; calls: CallRecord[] } | null) => void;
  addToBlacklist: (phone: string) => void;
  removeFromBlacklist: (phone: string) => void;
  restoreBackup: (p: Profile, importedCalls: CallRecord[], importedBlacklist: string[]) => void;
  recordAttempt: (id: string, values: Pick<CallRecord, 'fullName' | 'callStatus' | 'courses' | 'advisory' | 'advisoryDate' | 'advisoryTime' | 'registered' | 'notes'>) => void;
  enableFluid: boolean;
  setEnableFluid: (val: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  layoutMargin: number;
  setLayoutMargin: (margin: number) => void;
  sparkColor: string;
  setSparkColor: (color: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<Profile | null>(() => storage.getProfile());
  const [calls, setCallsState] = useState<CallRecord[]>(() => {
    const p = storage.getProfile();
    return p ? storage.getCalls(p.name) : [];
  });
  const [blacklist, setBlacklistState] = useState<string[]>(() => storage.getBlacklist());
  const [importedData, setImportedData] = useState<{ profile: Profile; calls: CallRecord[] } | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [activeCallTab, setActiveCallTab] = useState<'cards' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses'>('queue');
  const [enableFluid, setEnableFluidState] = useState<boolean>(() => {
    const saved = localStorage.getItem('fluid_enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('app_accent_color') || '#2b52ff';
  });
  const [layoutMargin, setLayoutMarginState] = useState<number>(() => {
    const saved = localStorage.getItem('app_layout_margin');
    return saved ? parseInt(saved, 10) : 32;
  });
  const [sparkColor, setSparkColorState] = useState<string>(() => {
    return localStorage.getItem('app_spark_color') || '#2b52ff';
  });

  const setAccentColor = useCallback((color: string) => {
    localStorage.setItem('app_accent_color', color);
    setAccentColorState(color);
  }, []);

  const setLayoutMargin = useCallback((margin: number) => {
    localStorage.setItem('app_layout_margin', margin.toString());
    setLayoutMarginState(margin);
  }, []);

  const setSparkColor = useCallback((color: string) => {
    localStorage.setItem('app_spark_color', color);
    setSparkColorState(color);
  }, []);

  const setEnableFluid = useCallback((val: boolean) => {
    localStorage.setItem('fluid_enabled', JSON.stringify(val));
    setEnableFluidState(val);
  }, []);

  const setProfile = useCallback((p: Profile) => {
    storage.saveProfile(p);
    setProfileState(p);
    setCallsState(storage.getCalls(p.name));
  }, []);

  const logout = useCallback(() => {
    storage.logout();
    setProfileState(null);
    setCallsState([]);
    setCurrentView('dashboard');
  }, []);

  const addCall = useCallback((callDto: Omit<CallRecord, 'id' | 'createdAt'>) => {
    if (!profile) return;
    const newCall: CallRecord = {
      ...callDto,
      id: uuidv4(),
      createdAt: nowJalali()
    };
    setCallsState(prev => {
      const updated = [newCall, ...prev];
      storage.saveCalls(profile.name, updated);
      return updated;
    });
  }, [profile]);

  const updateCall = useCallback((updatedCall: CallRecord) => {
    if (!profile) return;
    setCallsState(prev => {
      const updated = prev.map(c => c.id === updatedCall.id ? updatedCall : c);
      storage.saveCalls(profile.name, updated);
      return updated;
    });
  }, [profile]);

  const deleteCall = useCallback((id: string) => {
    if (!profile) return;
    setCallsState(prev => {
      const updated = prev.filter(c => c.id !== id);
      storage.saveCalls(profile.name, updated);
      return updated;
    });
  }, [profile]);

  const clearAllCalls = useCallback(() => {
    if (!profile) return;
    storage.saveCalls(profile.name, []);
    setCallsState([]);
  }, [profile]);

  const bulkAddCalls = useCallback((callsArray: Omit<CallRecord, 'id' | 'createdAt'>[]) => {
    if (!profile) return;
    const startOrder = calls.reduce((max, call) => Math.max(max, call.queueOrder ?? -1), -1) + 1;
    const newCalls = callsArray.map((callDto, index) => ({
      ...callDto,
      id: uuidv4(),
      createdAt: nowJalali(),
      queueOrder: callDto.queueOrder ?? startOrder + index,
      attempts: callDto.attempts ?? []
    }));
    setCallsState(prev => {
      const updated = [...prev, ...newCalls];
      storage.saveCalls(profile.name, updated);
      return updated;
    });
  }, [profile, calls]);

  const recordAttempt = useCallback((id: string, values: Pick<CallRecord, 'fullName' | 'callStatus' | 'courses' | 'advisory' | 'advisoryDate' | 'advisoryTime' | 'registered' | 'notes'>) => {
    if (!profile) return;
    const needsFollowUp = ['پاسخ نداد', 'در دسترس نیست', 'مشغول بود', 'بعداً تماس بگیرید', 'نیازمند پیگیری'].includes(values.callStatus) || values.advisory === 'هماهنگی بعدا';
    const now = new Date();
    const scheduledAdvisory = values.advisory === 'بله' && values.advisoryDate && values.advisoryTime
      ? jalaliDateTimeToIso(values.advisoryDate, values.advisoryTime)
      : undefined;
    const attempt: CallAttempt = {
      id: uuidv4(),
      createdAt: now.toISOString(),
      jalaliDateTime: nowJalali(),
      ...values,
      courses: values.courses || []
    };
    setCallsState(prev => {
      const updated = prev.map(call => call.id === id ? {
        ...call,
        ...values,
        attempts: [...(call.attempts || []), attempt],
        nextFollowUpAt: scheduledAdvisory || (needsFollowUp ? new Date(now.getTime() + 60 * 60 * 1000).toISOString() : undefined)
      } : call);
      storage.saveCalls(profile.name, updated);
      return updated;
    });
  }, [profile]);

  const importData = useCallback((p: Profile, importedCalls: CallRecord[]) => {
    setImportedData({ profile: p, calls: importedCalls });
  }, []);

  const wipeAllData = useCallback(() => {
    storage.wipeAllData();
    setProfileState(null);
    setCallsState([]);
    setCurrentView('dashboard');
  }, []);

  const addToBlacklist = useCallback((phone: string) => {
    storage.addToBlacklist(phone);
    setBlacklistState(storage.getBlacklist());
  }, []);

  const removeFromBlacklist = useCallback((phone: string) => {
    storage.removeFromBlacklist(phone);
    setBlacklistState(storage.getBlacklist());
  }, []);

  const restoreBackup = useCallback((p: Profile, importedCalls: CallRecord[], importedBlacklist: string[]) => {
    storage.saveProfile(p);
    storage.saveCalls(p.name, importedCalls);
    storage.saveBlacklist(importedBlacklist);
    setProfileState(p);
    setCallsState(importedCalls);
    setBlacklistState(importedBlacklist);
    setCurrentView('dashboard');
  }, []);

  const contextValue = React.useMemo(() => ({
    profile, calls, blacklist, currentView, setCurrentView, activeCallTab, setActiveCallTab, setProfile, logout, addCall, updateCall, deleteCall, clearAllCalls, bulkAddCalls, importData, wipeAllData, importedData, setImportedData, addToBlacklist, removeFromBlacklist, restoreBackup, recordAttempt, enableFluid, setEnableFluid, accentColor, setAccentColor, layoutMargin, setLayoutMargin, sparkColor, setSparkColor
  }), [profile, calls, blacklist, currentView, setCurrentView, activeCallTab, setActiveCallTab, setProfile, logout, addCall, updateCall, deleteCall, clearAllCalls, bulkAddCalls, importData, wipeAllData, importedData, setImportedData, addToBlacklist, removeFromBlacklist, restoreBackup, recordAttempt, enableFluid, setEnableFluid, accentColor, setAccentColor, layoutMargin, setLayoutMargin, sparkColor, setSparkColor]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

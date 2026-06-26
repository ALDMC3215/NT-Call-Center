import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CallAttempt, CallRecord, Profile } from '../types';
import { storage } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { jalaliDateTimeToIso, nowJalali } from '../utils/jalali';
import { supabase } from '../lib/supabase';

let lastActivityTime = 0;
const reportMeaningfulActivity = (userId: string) => {
  const now = Date.now();
  if (now - lastActivityTime < 5000) return; // debounce 5s

  const sid = sessionStorage.getItem(`expert_session_${userId}`);
  if (!sid) return;

  lastActivityTime = now;
  (async () => {
    try {
      await supabase.rpc('record_activity', { p_session_id: sid });
    } catch (e) {}
  })();
};

export type ViewType = 'dashboard' | 'profile' | 'settings' | 'stats' | 'admin' | 'blacklist' | 'reports' | 'experts' | 'managers' | 'about';

interface AppContextType {
  profile: Profile | null;
  calls: CallRecord[];
  isLoadingCalls: boolean;
  callsError: string | null;
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
  const [calls, setCallsState] = useState<CallRecord[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [callsRefreshCounter, setCallsRefreshCounter] = useState(0);
  const [blacklist, setBlacklistState] = useState<string[]>(() => storage.getBlacklist());
  const [importedData, setImportedData] = useState<{ profile: Profile; calls: CallRecord[] } | null>(null);

  useEffect(() => {
    if (!profile) {
      setCallsState([]);
      return;
    }

    const updateFollowUpInStorage = (p: Profile, contactId: string, nextFollowUpAt: string | undefined) => {
      try {
        const key = `novintech_cloud_followups_${p.sessionId}`;
        const saved = localStorage.getItem(key);
        const map = saved ? JSON.parse(saved) : {};
        if (nextFollowUpAt) {
          map[contactId] = nextFollowUpAt;
        } else {
          delete map[contactId];
        }
        localStorage.setItem(key, JSON.stringify(map));
      } catch (e) {
        console.error("Error updating followups map", e);
      }
    };
    if (!profile) {
      setCallsState([]);
      return;
    }

    let isMounted = true;

    const fetchCalls = async () => {
      setIsLoadingCalls(true);
      setCallsError(null);
      try {
        const { data: contactsData, error: contactsError } = await supabase
          .from('expert_contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactsError) throw contactsError;

        const { data: attemptsData, error: attemptsError } = await supabase
          .from('call_attempts')
          .select('*')
          .order('created_at', { ascending: true });

        if (attemptsError) throw attemptsError;

        if (!isMounted) return;

        let followUpMap: Record<string, string> = {};
        if (profile) {
          try {
            const key = `novintech_cloud_followups_${profile.sessionId}`;
            const saved = localStorage.getItem(key);
            if (saved) followUpMap = JSON.parse(saved);
          } catch (e) {}
        }

        const formattedCalls: CallRecord[] = contactsData.map((c: any) => {
          const contactAttempts = attemptsData
            .filter((a: any) => a.contact_id === c.id)
            .map((a: any) => ({
              id: a.id,
              createdAt: a.created_at,
              jalaliDateTime: a.jalali_date_time || '',
              fullName: a.full_name || '',
              callStatus: a.call_status || '',
              courses: a.courses || [],
              advisory: a.advisory || '',
              advisoryDate: a.advisory_date || '',
              advisoryTime: a.advisory_time || '',
              registered: a.registered || '',
              notes: a.notes || ''
            }));

          return {
            id: c.id,
            phone: c.phone,
            fullName: c.full_name || '',
            callStatus: c.call_status || '',
            courses: c.courses || [],
            advisory: c.advisory || '',
            advisoryDate: c.advisory_date || '',
            advisoryTime: c.advisory_time || '',
            registered: c.registered || '',
            notes: c.notes || '',
            createdAt: c.created_at,
            queueOrder: c.queue_order,
            attempts: contactAttempts,
            nextFollowUpAt: followUpMap[c.id]
          };
        });

        if (profile) {
          try {
            const key = `novintech_cloud_followups_${profile.sessionId}`;
            const activeIds = new Set(contactsData.map((c: any) => c.id));
            let changed = false;
            for (const k in followUpMap) {
              if (!activeIds.has(k)) {
                delete followUpMap[k];
                changed = true;
              }
            }
            if (changed) {
              localStorage.setItem(key, JSON.stringify(followUpMap));
            }
          } catch (e) {}
        }

        setCallsState(formattedCalls);
      } catch (err: any) {
        console.error("Error fetching calls:", err);
        if (isMounted) setCallsError("خطا در بارگیری اطلاعات از سرور ابری.");
      } finally {
        if (isMounted) setIsLoadingCalls(false);
      }
    };

    fetchCalls();

    return () => { isMounted = false; };
  }, [profile, callsRefreshCounter]);

  const updateFollowUpInStorage = useCallback((p: Profile | null, contactId: string, nextFollowUpAt: string | undefined) => {
    if (!p) return;
    try {
      const key = `novintech_cloud_followups_${p.sessionId}`;
      const saved = localStorage.getItem(key);
      const map = saved ? JSON.parse(saved) : {};
      if (nextFollowUpAt) {
        map[contactId] = nextFollowUpAt;
      } else {
        delete map[contactId];
      }
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      console.error("Error updating followups map", e);
    }
  }, []);
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
  }, []);

  const logout = useCallback(() => {
    storage.logout();
    setProfileState(null);
    setCallsState([]);
    setCurrentView('dashboard');
  }, []);

  const addCall = useCallback(async (callDto: Omit<CallRecord, 'id' | 'createdAt'>) => {
    if (!profile) return;
    reportMeaningfulActivity(profile.sessionId);

    try {
      const { data: contactId, error } = await supabase.rpc('create_contact', {
        p_phone: callDto.phone,
        p_full_name: callDto.fullName || null,
        p_call_status: callDto.callStatus || null,
        p_courses: callDto.courses || [],
        p_advisory: callDto.advisory || null,
        p_advisory_date: callDto.advisoryDate || null,
        p_advisory_time: callDto.advisoryTime || null,
        p_registered: callDto.registered || null,
        p_notes: callDto.notes || null,
        p_queue_order: callDto.queueOrder || null
      });

      if (error) {
        console.error("Error creating contact:", error);
        return;
      }

      const newCall: CallRecord = {
        ...callDto,
        id: contactId,
        createdAt: new Date().toISOString(),
        attempts: []
      };
      setCallsState(prev => [newCall, ...prev]);
    } catch (err) {
      console.error(err);
    }
  }, [profile]);

  const updateCall = useCallback(async (updatedCall: CallRecord) => {
    if (!profile) return;
    reportMeaningfulActivity(profile.sessionId);

    setCallsState(prev => prev.map(c => c.id === updatedCall.id ? updatedCall : c));
    updateFollowUpInStorage(profile, updatedCall.id, updatedCall.nextFollowUpAt);

    try {
      const { error } = await supabase.rpc('update_contact', {
        p_id: updatedCall.id,
        p_full_name: updatedCall.fullName || null,
        p_call_status: updatedCall.callStatus || null,
        p_courses: updatedCall.courses || [],
        p_advisory: updatedCall.advisory || null,
        p_advisory_date: updatedCall.advisoryDate || null,
        p_advisory_time: updatedCall.advisoryTime || null,
        p_registered: updatedCall.registered || null,
        p_notes: updatedCall.notes || null,
        p_queue_order: updatedCall.queueOrder || null
      });

      if (error) console.error("Error updating contact:", error);
    } catch (err) {
      console.error(err);
    }
  }, [profile, updateFollowUpInStorage]);

  const deleteCall = useCallback(async (id: string) => {
    if (!profile) return;
    reportMeaningfulActivity(profile.sessionId);

    setCallsState(prev => prev.filter(c => c.id !== id));
    updateFollowUpInStorage(profile, id, undefined);

    try {
      const { error } = await supabase.rpc('delete_contact', { p_id: id });
      if (error) console.error("Error deleting contact:", error);
    } catch (err) {
      console.error(err);
    }
  }, [profile, updateFollowUpInStorage]);

  const clearAllCalls = useCallback(() => {
    // Only local clear (not supported by cloud directly without looping)
    if (!profile) return;
    setCallsState([]);
  }, [profile]);

  const bulkAddCalls = useCallback(async (callsArray: Omit<CallRecord, 'id' | 'createdAt'>[]) => {
    if (!profile) return;
    reportMeaningfulActivity(profile.sessionId);

    try {
      const startOrder = calls.reduce((max, call) => Math.max(max, call.queueOrder ?? -1), -1) + 1;
      const contactsToCreate = callsArray.map((callDto, index) => ({
        phone: callDto.phone,
        full_name: callDto.fullName || null,
        call_status: callDto.callStatus || null,
        courses: callDto.courses || [],
        advisory: callDto.advisory || null,
        advisory_date: callDto.advisoryDate || null,
        advisory_time: callDto.advisoryTime || null,
        registered: callDto.registered || null,
        notes: callDto.notes || null,
        queue_order: callDto.queueOrder ?? startOrder + index
      }));

      const { error } = await supabase.rpc('bulk_create_contacts', { p_contacts: contactsToCreate });

      if (error) {
        console.error("Error in bulk add:", error);
        return;
      }

      setCallsRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  }, [profile, calls]);

  const recordAttempt = useCallback(async (id: string, values: Pick<CallRecord, 'fullName' | 'callStatus' | 'courses' | 'advisory' | 'advisoryDate' | 'advisoryTime' | 'registered' | 'notes'>) => {
    if (!profile) return;
    reportMeaningfulActivity(profile.sessionId);

    const isTerminal = values.registered === 'ثبت نام کرد' || values.registered === 'ثبت نام نکرد' || values.registered === 'قصد ندارد';

    const now = new Date();
    const jalaliTime = nowJalali();
    const attemptId = uuidv4();

    const attempt: CallAttempt = {
      id: attemptId,
      createdAt: now.toISOString(),
      jalaliDateTime: jalaliTime,
      ...values,
      courses: values.courses || []
    };

    let newFollowUpAt: string | undefined = undefined;

    if (!isTerminal) {
      const needsFollowUp = ['پاسخ نداد', 'در دسترس نیست', 'مشغول بود', 'بعداً تماس بگیرید', 'نیازمند پیگیری'].includes(values.callStatus) || values.advisory === 'هماهنگی بعدا';
      const scheduledAdvisory = values.advisory === 'بله' && values.advisoryDate && values.advisoryTime
        ? jalaliDateTimeToIso(values.advisoryDate, values.advisoryTime)
        : undefined;
      newFollowUpAt = scheduledAdvisory || (needsFollowUp ? new Date(now.getTime() + 60 * 60 * 1000).toISOString() : undefined);
    }

    setCallsState(prev => prev.map(call => call.id === id ? {
      ...call,
      ...values,
      attempts: [...(call.attempts || []), attempt],
      nextFollowUpAt: newFollowUpAt
    } : call));

    updateFollowUpInStorage(profile, id, newFollowUpAt);

    try {
      const { error } = await supabase.rpc('create_call_attempt', {
        p_contact_id: id,
        p_jalali_date_time: jalaliTime,
        p_full_name: values.fullName || null,
        p_call_status: values.callStatus || null,
        p_courses: values.courses || [],
        p_advisory: values.advisory || null,
        p_advisory_date: values.advisoryDate || null,
        p_advisory_time: values.advisoryTime || null,
        p_registered: values.registered || null,
        p_notes: values.notes || null
      });

      if (error) console.error("Error creating attempt:", error);
    } catch (err) {
      console.error(err);
    }
  }, [profile, updateFollowUpInStorage]);

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
    if (profile) reportMeaningfulActivity(profile.sessionId);
    storage.addToBlacklist(phone);
    setBlacklistState(storage.getBlacklist());
  }, [profile]);

  const removeFromBlacklist = useCallback((phone: string) => {
    if (profile) reportMeaningfulActivity(profile.sessionId);
    storage.removeFromBlacklist(phone);
    setBlacklistState(storage.getBlacklist());
  }, [profile]);

  const restoreBackup = useCallback((p: Profile, importedCalls: CallRecord[], importedBlacklist: string[]) => {
    storage.saveProfile(p);
    storage.saveBlacklist(importedBlacklist);
    setProfileState(p);
    setBlacklistState(importedBlacklist);
    setCurrentView('dashboard');
    // Note: restoring cloud calls from backup file is not fully supported locally anymore
  }, []);

  const contextValue = React.useMemo(() => ({
    profile, calls, isLoadingCalls, callsError, blacklist, currentView, setCurrentView, activeCallTab, setActiveCallTab, setProfile, logout, addCall, updateCall, deleteCall, clearAllCalls, bulkAddCalls, importData, wipeAllData, importedData, setImportedData, addToBlacklist, removeFromBlacklist, restoreBackup, recordAttempt, enableFluid, setEnableFluid, accentColor, setAccentColor, layoutMargin, setLayoutMargin, sparkColor, setSparkColor
  }), [profile, calls, isLoadingCalls, callsError, blacklist, currentView, setCurrentView, activeCallTab, setActiveCallTab, setProfile, logout, addCall, updateCall, deleteCall, clearAllCalls, bulkAddCalls, importData, wipeAllData, importedData, setImportedData, addToBlacklist, removeFromBlacklist, restoreBackup, recordAttempt, enableFluid, setEnableFluid, accentColor, setAccentColor, layoutMargin, setLayoutMargin, sparkColor, setSparkColor]);

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

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  CallAttempt, CallRecord, Profile, BlacklistEntry, BlacklistReason,
  ContactTask, ContactTaskSummary, ContactTaskType, ContactTaskStatus,
  CreateContactTaskInput, RescheduleContactTaskInput,
  CreateContactTaskWithDetailsInput, UpdateContactTaskDetailsInput,
  RecordCallAttemptWithTaskInput, RecordCallAttemptWithTaskResult
} from '../types';
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

export type ViewType = 'home' | 'dashboard' | 'profile' | 'settings' | 'stats' | 'admin' | 'blacklist' | 'trash' | 'reports' | 'experts' | 'managers' | 'about' | 'negotiation' | 'schedule' | 'courses' | 'intro';
export type PopupViewType = 'negotiation' | 'schedule' | 'learning_paths' | 'stats' | 'courses' | 'intro' | null;
export type LayoutMode = 'default' | 'header-only' | 'cards-only';

interface AppContextType {
  profile: Profile | null;
  calls: CallRecord[];
  isLoadingCalls: boolean;
  hasInitialCallsLoaded: boolean;
  callsError: string | null;
  blacklist: BlacklistEntry[];
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  popupView: PopupViewType;
  setPopupView: (view: PopupViewType) => void;
  activeCallTab: 'cards' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses' | 'learning_paths' | 'schedule' | 'intro';
  setActiveCallTab: (tab: 'cards' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses' | 'learning_paths' | 'schedule' | 'intro') => void;
  setProfile: (p: Profile) => void;
  logout: () => void;
  addCall: (call: Omit<CallRecord, 'id' | 'createdAt'>) => void;
  updateCall: (call: CallRecord) => void;
  deleteCall: (id: string) => void;
  clearAllCalls: () => void;
  bulkAddCalls: (callsArray: Omit<CallRecord, 'id' | 'createdAt'>[]) => void;
  importData: (profile: Profile, calls: CallRecord[]) => void;
  importedData: { profile: Profile; calls: CallRecord[] } | null;
  setImportedData: (data: { profile: Profile; calls: CallRecord[] } | null) => void;
  addToBlacklist: (phone: string, reason?: BlacklistReason) => void;
  removeFromBlacklist: (phone: string) => void;
  isBlacklisted: (phone: string) => boolean;
  restoreBackup: (p: Profile, importedCalls: CallRecord[], importedBlacklist: BlacklistEntry[]) => void;
  setContactWorkList: (contactId: string, destination: 'none' | 'today' | 'followup') => Promise<boolean>;
  recordAttempt: (id: string, values: Pick<CallRecord, 'fullName' | 'callStatus' | 'advisory' | 'notes'>) => Promise<boolean>;
  enableFluid: boolean;
  setEnableFluid: (val: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  layoutMargin: number;
  setLayoutMargin: (margin: number) => void;
  sparkColor: string;
  setSparkColor: (color: string) => void;
  getMyContactTasks: (filters?: { scheduledDate?: string; status?: ContactTaskStatus; taskType?: ContactTaskType }) => Promise<ContactTask[]>;
  createContactTask: (input: CreateContactTaskInput) => Promise<ContactTask>;
  createContactTaskWithDetails: (input: CreateContactTaskWithDetailsInput) => Promise<ContactTask>;
  updateContactTaskDetails: (input: UpdateContactTaskDetailsInput) => Promise<ContactTask>;
  rescheduleContactTask: (input: RescheduleContactTaskInput) => Promise<ContactTask>;
  completeContactTask: (taskId: string) => Promise<ContactTask>;
  cancelContactTask: (taskId: string) => Promise<ContactTask>;
  getMyContactTaskSummary: (targetDate?: string) => Promise<ContactTaskSummary>;
  recordCallAttemptWithTask: (input: RecordCallAttemptWithTaskInput) => Promise<RecordCallAttemptWithTaskResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<Profile | null>(() => storage.getProfile());
  const [calls, setCallsState] = useState<CallRecord[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [hasInitialCallsLoaded, setHasInitialCallsLoaded] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [callsRefreshCounter, setCallsRefreshCounter] = useState(0);
  const [blacklist, setBlacklistState] = useState<BlacklistEntry[]>(() => storage.getBlacklist());
  const [importedData, setImportedData] = useState<{ profile: Profile; calls: CallRecord[] } | null>(null);
  
  useEffect(() => {
    if (!profile) {
      setCallsState([]);
      setHasInitialCallsLoaded(false);
      return;
    }

    if (!profile) {
      setCallsState([]);
      return;
    }

    let isMounted = true;

    const fetchCalls = async () => {
      if (!hasInitialCallsLoaded) setIsLoadingCalls(true);
      setCallsError(null);
      try {
        const { data: contactsData, error: contactsError } = await supabase
          .from('expert_contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .order('queue_order', { ascending: true, nullsFirst: false });

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
              advisory: a.advisory || '',
              notes: a.notes || ''
            }));

          return {
            id: c.id,
            phone: c.phone,
            fullName: c.full_name || '',
            callStatus: c.call_status || '',
            advisory: c.advisory || '',
            advisoryDate: c.advisory_date || null,
            advisoryTime: c.advisory_time || null,
            interestedCourse: c.courses && c.courses.length > 0 ? c.courses[0] : null,
            notes: c.notes || '',
            createdAt: c.created_at,
            queueOrder: c.queue_order,
            attempts: contactAttempts,
            nextFollowUpAt: followUpMap[c.id],
            isFollowUp: !!followUpMap[c.id] || c.work_list === 'followup',
            workList: c.work_list || 'none',
            workListDate: c.work_list_date || null,
            workListUpdatedAt: c.work_list_updated_at || null
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
        setHasInitialCallsLoaded(true);
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

  const updateFollowUpInStorage = useCallback((p: Profile | null, contactId: string, isFollowUp: boolean) => {
    if (!p) return;
    try {
      const key = `novintech_cloud_followups_${p.sessionId}`;
      const saved = localStorage.getItem(key);
      const map = saved ? JSON.parse(saved) : {};
      if (isFollowUp) {
        map[contactId] = 'true';
      } else {
        delete map[contactId];
      }
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      console.error("Error updating followups map", e);
    }
  }, []);
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      if (view && ['home', 'dashboard', 'profile', 'settings', 'stats', 'admin', 'blacklist', 'reports', 'experts', 'managers', 'about', 'negotiation', 'schedule'].includes(view)) {
        return view as ViewType;
      }
    }
    return 'home';
  });
  const [popupView, setPopupView] = useState<PopupViewType>(null);
  const [activeCallTab, setActiveCallTab] = useState<'cards' | 'queue' | 'today' | 'followup' | 'stats' | 'blacklist' | 'courses' | 'learning_paths' | 'schedule' | 'intro'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['cards', 'queue', 'today', 'followup', 'stats', 'blacklist', 'courses'].includes(tab)) {
        return tab as any;
      }
    }
    return 'queue';
  });
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
    setCurrentView('home');
  }, []);

  const addCall = useCallback(async (callDto: Omit<CallRecord, 'id' | 'createdAt'>) => {
    if (!profile) return;
    reportMeaningfulActivity(profile.sessionId);

    try {
      const { data: contactId, error } = await supabase.rpc('create_contact', {
        p_phone: callDto.phone,
        p_full_name: callDto.fullName || null,
        p_call_status: callDto.callStatus || null,
        p_courses: callDto.interestedCourse ? [callDto.interestedCourse] : null,
        p_advisory: callDto.advisory || null,
        p_advisory_date: callDto.advisoryDate || null,
        p_advisory_time: callDto.advisoryTime || null,
        p_registered: null,
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
    updateFollowUpInStorage(profile, updatedCall.id, !!updatedCall.isFollowUp);

    try {
      const { error } = await supabase.rpc('update_contact', {
        p_id: updatedCall.id,
        p_full_name: updatedCall.fullName || null,
        p_call_status: updatedCall.callStatus || null,
        p_courses: updatedCall.interestedCourse ? [updatedCall.interestedCourse] : null,
        p_advisory: updatedCall.advisory || null,
        p_advisory_date: updatedCall.advisoryDate || null,
        p_advisory_time: updatedCall.advisoryTime || null,
        p_registered: null,
        p_notes: updatedCall.notes || null,
        p_queue_order: updatedCall.queueOrder || null
      });

      if (error) console.error("Error updating contact:", error);
    } catch (err) {
      console.error(err);
    }
  }, [profile, updateFollowUpInStorage]);

  const deleteCall = useCallback(async (id: string): Promise<boolean> => {
    if (!profile) return false;
    reportMeaningfulActivity(profile.sessionId);

    try {
      const { error } = await supabase.rpc('delete_contact', { p_id: id });
      if (error) {
        console.error("Error deleting contact:", error);
        return false;
      }
      setCallsState(prev => prev.filter(c => c.id !== id));
      updateFollowUpInStorage(profile, id, undefined);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [profile, updateFollowUpInStorage]);

  // Global Blacklist Cross-check
  useEffect(() => {
    if (!profile || calls.length === 0 || blacklist.length === 0) return;
    
    // Find calls that are in the blacklist but not yet marked
    const newlyBlacklisted = calls.filter(c => !c.isBlacklisted && blacklist.some(b => b.phone === c.phone));
    
    if (newlyBlacklisted.length > 0) {
      setCallsState(prev => prev.map(c => blacklist.some(b => b.phone === c.phone) ? { ...c, isBlacklisted: true } : c));
      console.log(`Global check: Marked ${newlyBlacklisted.length} numbers as blacklisted.`);
    }
  }, [profile, calls, blacklist]);

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
        advisory: callDto.advisory || null,
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

  const setContactWorkList = useCallback(async (contactId: string, destination: 'none' | 'today' | 'followup'): Promise<boolean> => {
    if (!profile) return false;
    reportMeaningfulActivity(profile.sessionId);

    try {
      const { error } = await supabase.rpc('set_contact_work_list', {
        p_contact_id: contactId,
        p_work_list: destination
      });

      if (error) {
        console.error('Error in setContactWorkList:', error);
        return false;
      }

      setCallsRefreshCounter(prev => prev + 1);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [profile]);

  const recordAttempt = useCallback(async (id: string, values: Pick<CallRecord, 'fullName' | 'callStatus' | 'advisory' | 'notes' | 'advisoryDate' | 'advisoryTime' | 'interestedCourse'>): Promise<boolean> => {
    if (!profile) return false;
    reportMeaningfulActivity(profile.sessionId);
    const s = values.callStatus;

    let needsFollowUp = false;

    const now = new Date();
    const jalaliTime = nowJalali();
    const attemptId = uuidv4();

    const attempt: CallAttempt = {
      id: attemptId,
      createdAt: now.toISOString(),
      jalaliDateTime: jalaliTime,
      ...values
    };

    let newFollowUpAt: string | undefined = undefined;

    if (needsFollowUp) {
      newFollowUpAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    }

    try {
      const { error } = await supabase.rpc('create_call_attempt', {
        p_contact_id: id,
        p_jalali_date_time: jalaliTime,
        p_full_name: values.fullName || null,
        p_call_status: values.callStatus || null,
        p_courses: values.interestedCourse ? [values.interestedCourse] : null,
        p_advisory: values.advisory || null,
        p_advisory_date: values.advisoryDate || null,
        p_advisory_time: values.advisoryTime || null,
        p_registered: null,
        p_notes: values.notes || null
      });

      if (error) {
        console.error("Error creating attempt:", error);
        return false;
      }

      setCallsState(prev => prev.map(call => call.id === id ? {
        ...call,
        ...values,
        attempts: [...(call.attempts || []), attempt],
        nextFollowUpAt: newFollowUpAt
      } : call));

      updateFollowUpInStorage(profile, id, newFollowUpAt);
      return true;

    } catch (err) {
      console.error(err);
      return false;
    }
  }, [profile, updateFollowUpInStorage]);

  const importData = useCallback((p: Profile, importedCalls: CallRecord[]) => {
    setImportedData({ profile: p, calls: importedCalls });
  }, []);

  const wipeAllData = useCallback(() => {
    storage.wipeAllData();
    setProfileState(null);
    setCallsState([]);
    setCurrentView('home');
  }, []);

  const addToBlacklist = useCallback((phone: string, reason: BlacklistReason = 'افزودن دستی') => {
    if (profile) reportMeaningfulActivity(profile.sessionId);
    storage.addToBlacklist(phone, reason);
    setBlacklistState(storage.getBlacklist());
  }, [profile]);

  const removeFromBlacklist = useCallback((phone: string) => {
    if (profile) reportMeaningfulActivity(profile.sessionId);
    storage.removeFromBlacklist(phone);
    setBlacklistState(storage.getBlacklist());
  }, [profile]);

  const isBlacklisted = useCallback((phone: string) => {
    return blacklist.some(b => b.phone === phone);
  }, [blacklist]);

  const restoreBackup = useCallback((p: Profile, importedCalls: CallRecord[], importedBlacklist: BlacklistEntry[]) => {
    storage.saveProfile(p);
    storage.saveBlacklist(importedBlacklist);
    setProfileState(p);
    setBlacklistState(importedBlacklist);
    setCurrentView('home');
    // Note: restoring cloud calls from backup file is not fully supported locally anymore
  }, []);

  const getMyContactTasks = useCallback(async (filters?: { scheduledDate?: string; status?: ContactTaskStatus; taskType?: ContactTaskType }): Promise<ContactTask[]> => {
    if (!profile) return [];

    let query = supabase.from('contact_tasks').select('*');

    if (filters?.scheduledDate) {
      query = query.eq('scheduled_date', filters.scheduledDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.taskType) {
      query = query.eq('task_type', filters.taskType);
    }

    query = query
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }

    return data as ContactTask[];
  }, [profile]);

  const createContactTask = useCallback(async (input: CreateContactTaskInput): Promise<ContactTask> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('create_contact_task', {
      p_contact_id: input.contactId,
      p_task_type: input.taskType,
      p_scheduled_date: input.scheduledDate,
      p_scheduled_time: input.scheduledTime || null,
      p_source_attempt_id: input.sourceAttemptId || null
    }).single();

    if (error) {
      console.error("Error creating contact task:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    return data as unknown as ContactTask;
  }, [profile]);

  const recordCallAttemptWithTask = useCallback(async (input: RecordCallAttemptWithTaskInput): Promise<RecordCallAttemptWithTaskResult> => {
    if (!profile) throw new Error("Not authenticated");
    reportMeaningfulActivity(profile.sessionId);
    
    const jalaliTime = nowJalali();

    const { data, error } = await supabase.rpc('record_call_attempt_with_task', {
      p_contact_id: input.contactId,
      p_jalali_date_time: jalaliTime,
      p_full_name: input.fullName || null,
      p_call_status: input.callStatus || null,
      p_advisory: input.advisory || null,
      p_notes: input.notes || null,
      p_task_type: input.taskType,
      p_scheduled_date: input.scheduledDate || null,
      p_scheduled_time: input.scheduledTime || null,
      p_followup_note: input.followupNote || null
    });

    if (error) {
      console.error("record_call_attempt_with_task failed", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    const result = data as unknown as RecordCallAttemptWithTaskResult;

    setCallsState(prev => prev.map(call => call.id === input.contactId ? {
      ...call,
      fullName: input.fullName || call.fullName,
      callStatus: input.callStatus || call.callStatus,
      advisory: input.advisory || call.advisory,
      notes: input.notes || call.notes,
      attempts: [...(call.attempts || []), result.attempt],
    } : call));

    return result;
  }, [profile]);

  const createContactTaskWithDetails = useCallback(async (input: CreateContactTaskWithDetailsInput): Promise<ContactTask> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('create_contact_task_with_details', {
      p_contact_id: input.contactId,
      p_task_type: input.taskType,
      p_scheduled_date: input.scheduledDate,
      p_scheduled_time: input.scheduledTime || null,
      p_source_attempt_id: input.sourceAttemptId || null,
      p_followup_note: input.followupNote || null
    }).single();

    if (error) {
      console.error("Error creating contact task with details:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    return data as unknown as ContactTask;
  }, [profile]);

  const updateContactTaskDetails = useCallback(async (input: UpdateContactTaskDetailsInput): Promise<ContactTask> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('update_contact_task_details', {
      p_task_id: input.taskId,
      p_task_type: input.taskType,
      p_scheduled_date: input.scheduledDate,
      p_scheduled_time: input.scheduledTime || null,
      p_followup_note: input.followupNote || null
    }).single();

    if (error) {
      console.error("Error updating contact task details:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    return data as unknown as ContactTask;
  }, [profile]);

  const rescheduleContactTask = useCallback(async (input: RescheduleContactTaskInput): Promise<ContactTask> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('reschedule_contact_task', {
      p_task_id: input.taskId,
      p_new_date: input.newDate,
      p_new_time: input.newTime || null
    }).single();

    if (error) {
      console.error("Error rescheduling contact task:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    return data as unknown as ContactTask;
  }, [profile]);

  const completeContactTask = useCallback(async (taskId: string): Promise<ContactTask> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('complete_contact_task', {
      p_task_id: taskId
    }).single();

    if (error) {
      console.error("Error completing contact task:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    return data as unknown as ContactTask;
  }, [profile]);

  const cancelContactTask = useCallback(async (taskId: string): Promise<ContactTask> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('cancel_contact_task', {
      p_task_id: taskId
    }).single();

    if (error) {
      console.error("Error cancelling contact task:", error);
      throw error;
    }
    if (!data) throw new Error("No data returned");

    return data as unknown as ContactTask;
  }, [profile]);

  const getMyContactTaskSummary = useCallback(async (targetDate?: string): Promise<ContactTaskSummary> => {
    if (!profile) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc('get_my_contact_task_summary', {
      p_target_date: targetDate || null
    });

    if (error) {
      console.error("Error fetching task summary:", error);
      throw error;
    }

    return data as unknown as ContactTaskSummary;
  }, [profile]);
  const contextValue = React.useMemo(() => ({
    profile, calls, isLoadingCalls, callsError, blacklist, currentView, setCurrentView, popupView, setPopupView, activeCallTab, setActiveCallTab, setProfile, logout, addCall, updateCall, deleteCall, clearAllCalls, bulkAddCalls, importData, wipeAllData, importedData, setImportedData, addToBlacklist, removeFromBlacklist, isBlacklisted, restoreBackup, setContactWorkList, recordAttempt, enableFluid, setEnableFluid, accentColor, setAccentColor, layoutMargin, setLayoutMargin, sparkColor, setSparkColor,
    getMyContactTasks, createContactTask, createContactTaskWithDetails, updateContactTaskDetails, rescheduleContactTask, completeContactTask, cancelContactTask, getMyContactTaskSummary, recordCallAttemptWithTask
  }), [profile, calls, isLoadingCalls, callsError, blacklist, currentView, setCurrentView, popupView, setPopupView, activeCallTab, setActiveCallTab, setProfile, logout, addCall, updateCall, deleteCall, clearAllCalls, bulkAddCalls, importData, wipeAllData, importedData, setImportedData, addToBlacklist, removeFromBlacklist, isBlacklisted, restoreBackup, setContactWorkList, recordAttempt, enableFluid, setEnableFluid, accentColor, setAccentColor, layoutMargin, setLayoutMargin, sparkColor, setSparkColor, getMyContactTasks, createContactTask, createContactTaskWithDetails, updateContactTaskDetails, rescheduleContactTask, completeContactTask, cancelContactTask, getMyContactTaskSummary, recordCallAttemptWithTask]);

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

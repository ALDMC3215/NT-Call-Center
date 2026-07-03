export type DutyGroup = 'early_week' | 'late_week';

export interface SupabaseProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'agent' | 'admin';
  account_status: 'pending' | 'active' | 'disabled';
  duty_group: DutyGroup | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Local app profile — kept as-is; all 40+ files depend on this shape.
// useAuth maps SupabaseProfile → Profile on login.
// ---------------------------------------------------------------------------
export interface Profile {
  name: string;
  date: string;
  shift: string;
  branch: 'پردیس' | 'زرگری' | 'Admin';
  sessionId: string;
  role?: 'expert' | 'admin';
}

export interface CallRecord {
  id: string;
  phone: string;
  fullName?: string;
  callStatus: string;
  courses: string[];
  advisory: string;
  advisoryDate?: string;
  advisoryTime?: string;
  registered: string;
  notes: string;
  createdAt: string;
  /** ترتیب ورود شماره از فایل اکسل یا ورود دستی */
  queueOrder?: number;
  /** تاریخچه تغییرناپذیر تمام تماس‌ها و پیگیری‌ها */
  attempts?: CallAttempt[];
  /** زمان میلادی پیگیری بعدی؛ برای مقایسه دقیق با ساعت سیستم */
  nextFollowUpAt?: string;
  /** Manual work list properties */
  workList?: 'none' | 'today' | 'followup';
  workListDate?: string | null;
  workListUpdatedAt?: string | null;
}

export interface CallAttempt {
  id: string;
  createdAt: string;
  jalaliDateTime: string;
  fullName?: string;
  callStatus: string;
  courses: string[];
  advisory: string;
  advisoryDate?: string;
  advisoryTime?: string;
  registered: string;
  notes: string;
}

export interface ExportSummary {
    total: number;
    interested: number;
    notInterested: number;
    noAnswer: number;
    followUp: number;
    inactive: number;
    registered: number;
    successRate: string;
}

export interface ExportData {
  exportVersion: string;
  exportedAt: string;
  profile: Profile;
  summary: ExportSummary;
  calls: CallRecord[];
}

export type BlacklistReason = 'افزودن دستی' | 'ناموجود بودن شماره';

export interface BlacklistEntry {
  phone: string;
  reason: BlacklistReason;
  createdAt: string;
}

export type LegacyContactTaskType = 'daily_activity' | 'retry_call' | 'consultation_reminder';
export type ContactTaskType = LegacyContactTaskType | 'other_followup';
export type ContactTaskStatus = 'pending' | 'completed' | 'cancelled';

export interface ContactTask {
  id: string;
  contact_id: string;
  expert_id: string;
  source_attempt_id: string | null;
  task_type: ContactTaskType;
  scheduled_date: string;
  scheduled_time: string | null;
  followup_note: string | null;
  status: ContactTaskStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface ContactTaskSummary {
  target_date: string;
  daily_activity: number;
  retry_call: number;
  consultation_reminder: number;
  overdue: number;
}

export interface CreateContactTaskInput {
  contactId: string;
  taskType: LegacyContactTaskType;
  scheduledDate: string;
  scheduledTime?: string | null;
  sourceAttemptId?: string | null;
}

export interface RescheduleContactTaskInput {
  taskId: string;
  newDate: string;
  newTime?: string | null;
}

export interface CreateContactTaskWithDetailsInput {
  contactId: string;
  taskType: ContactTaskType;
  scheduledDate: string;
  scheduledTime?: string | null;
  sourceAttemptId?: string | null;
  followupNote?: string | null;
}

export interface UpdateContactTaskDetailsInput {
  taskId: string;
  taskType: ContactTaskType;
  scheduledDate: string;
  scheduledTime?: string | null;
  followupNote?: string | null;
}

export interface RecordCallAttemptWithTaskInput {
  contactId: string;
  fullName?: string | null;
  callStatus?: string | null;
  courses?: string[];
  advisory?: string | null;
  advisoryDate?: string | null;
  advisoryTime?: string | null;
  registered?: string | null;
  notes?: string | null;
  taskType: ContactTaskType;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  followupNote?: string | null;
}

export interface RecordCallAttemptWithTaskResult {
  attempt: CallAttempt;
  task: ContactTask;
}

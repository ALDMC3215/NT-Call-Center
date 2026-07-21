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
  advisory: string;
  advisoryDate?: string | null;
  advisoryTime?: string | null;
  interestedCourse?: string | null;
  registered?: string | null;
  consultationConfirmed?: boolean;
  notes: string;
  createdAt: string;
  /** ترتیب ورود شماره از فایل اکسل یا ورود دستی */
  queueOrder?: number;
  /** تاریخچه تغییرناپذیر تمام تماس‌ها و پیگیری‌ها */
  attempts?: CallAttempt[];
  /** زمان میلادی پیگیری بعدی؛ (منسوخ شده، در آینده حذف می‌شود) */
  nextFollowUpAt?: string;
  /** وضعیت پیگیری مجدد به صورت سوئیچ روشن/خاموش */
  isFollowUp?: boolean;
  /** تاریخ اضافه‌شدن به لیست پیگیری */
  followUpAddedAt?: string | null;
  isBlacklisted?: boolean;
  /** Manual work list properties */
  workList?: 'none' | 'today';
  workListDate?: string | null;
  workListUpdatedAt?: string | null;
}

export interface CallAttempt {
  id: string;
  createdAt: string;
  jalaliDateTime: string;
  fullName?: string;
  callStatus: string;
  advisory?: string;
  advisoryDate?: string | null;
  advisoryTime?: string | null;
  interestedCourse?: string | null;
  registered?: string | null;
  consultationConfirmed?: boolean;
  notes?: string;
  attemptSource?: 'result_submit' | 'manual_attempt' | 'followup_attempt' | 'task_result_submit' | 'system';
  manualReason?: string | null;
  sourceTaskId?: string | null;
  metadata?: Record<string, any>;
}

export interface ExportSummary {
    total: number;
    interested: number;
    notInterested: number;
    noAnswer: number;
    followUp: number;
    inactive: number;
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
  advisory?: string | null;
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

export interface TrashEntry extends CallRecord { deletedAt: string; deletedBy: string; }

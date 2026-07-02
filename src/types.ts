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

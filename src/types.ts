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

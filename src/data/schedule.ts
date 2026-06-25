export interface DailySchedule {
  dayId: string;
  dayName: string;
  morning: string[];
  evening: string[];
}

export const SCHEDULE_DATA: DailySchedule[] = [
  { dayId: '1', dayName: 'شنبه', morning: ['هلیا جوانمردی'], evening: ['امیر حسین مسرور'] },
  { dayId: '2', dayName: 'یکشنبه', morning: ['سانیا زارع', 'امیر حسین مسرور'], evening: ['ثنا کشاورز'] },
  { dayId: '3', dayName: 'دوشنبه', morning: ['احمد رضا شیبانی', 'ماهان فروزنده'], evening: ['امیر حسین مسرور'] },
  { dayId: '4', dayName: 'سه شنبه', morning: ['رضا غفاری', 'پارسا رابعی نیا'], evening: ['سروش زمردی'] },
  { dayId: '5', dayName: 'چهارشنبه', morning: ['سالار سرشوق', 'پارسا رابعی نیا'], evening: ['هیربد نقشبندی'] },
  { dayId: '6', dayName: 'پنج شنبه', morning: ['هاجر باقرزاده', 'پارسا رابعی نیا'], evening: ['امیر ارسلان صالحی'] },
];

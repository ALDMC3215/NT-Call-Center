import jalaali from 'jalaali-js';

// تبدیل Date به شمسی
export function toJalali(date: Date | string | number = new Date()) {
  const d = new Date(date);
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`;
}

// تاریخ و ساعت کامل شمسی
export function nowJalali() {
  const now = new Date();
  const time = now.toTimeString().slice(0, 5);
  return `${toJalali(now)} ${time}`;
}

// بررسی اینکه تاریخ امروز است
export function isToday(jalaliDate: string) {
  return jalaliDate === toJalali();
}

export function jalaliDateTimeToIso(date: string, time: string) {
  const [jy, jm, jd] = date.split('/').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (![jy, jm, jd, hour, minute].every(Number.isFinite)) return undefined;
  const gregorian = jalaali.toGregorian(jy, jm, jd);
  return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd, hour, minute).toISOString();
}

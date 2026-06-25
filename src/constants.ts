import { COURSE_CATEGORIES } from './data/courses';

export const CALL_STATUSES = ['پاسخ داد', 'پاسخ نداد', 'در دسترس نیست', 'مشغول بود', 'بعداً تماس بگیرید', 'نیازمند پیگیری', 'عدم تمایل قطعی'];
export const LINK_OPTIONS  = ['ارسال شد', 'ارسال نشد', 'عدم تمایل'];

// Flatten all course titles into a single array for dropdowns
export const COURSES = COURSE_CATEGORIES.flatMap(category => 
  category.subcategories.flatMap(sub => 
    sub.courses.map(course => course.title)
  )
);
export const ADV_OPTIONS   = ['بله', 'خیر', 'هماهنگی بعدا'];
export const REG_OPTIONS   = ['ثبت نام کرد', 'ثبت نام نکرد', 'در حال بررسی'];

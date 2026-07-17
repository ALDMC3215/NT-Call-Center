import { COURSE_CATEGORIES } from './data/courses';

export const CALL_STATUSES = ['پیگیری', 'عدم تمایل'];
export const LINK_OPTIONS  = ['ارسال شد', 'ارسال نشد', 'عدم تمایل'];

// Flatten all course titles into a single array for dropdowns
export const COURSES = COURSE_CATEGORIES.flatMap(category => 
  category.subcategories.flatMap(sub => 
    sub.courses.map(course => course.title)
  )
);
export const ADV_OPTIONS   = ['بله', 'خیر', 'هماهنگی بعدا'];
export const REGISTRATION_STATUSES = ['ثبت نام کرد', 'قصد ثبت نام دارد', 'ثبت نام نکرد'] as const;

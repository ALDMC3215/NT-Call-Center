import { COURSE_CATEGORIES } from './data/courses';

export const CALL_STATUSES = ['پیگیری', 'عدم تمایل', 'جواب نداد'];
export const LINK_OPTIONS  = ['ارسال شد', 'ارسال نشد', 'عدم تمایل'];

// Flatten all course titles into a single array for dropdowns
export const COURSES = COURSE_CATEGORIES.flatMap(category => 
  category.subcategories.flatMap(sub => 
    sub.courses.map(course => course.title)
  )
);
export const ADV_OPTIONS   = ['حضوری', 'تلفنی', 'عدم تمایل'];
export const REGISTRATION_STATUSES = ['ثبت نام کرد', 'مردد', 'ثبت نام نکرد'] as const;

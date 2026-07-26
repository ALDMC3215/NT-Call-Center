import { COURSE_CATEGORIES } from './data/courses';

export const CALL_STATUSES = ['پاسخ داد', 'پاسخ نداد', 'عدم تمایل', 'علاقه مند', 'مشاوره حضوری'];

// Flatten all course titles into a single array for dropdowns
export const COURSES = COURSE_CATEGORIES.flatMap(category => 
  category.subcategories.flatMap(sub => 
    sub.courses.map(course => course.title)
  )
);

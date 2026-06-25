const fs = require('fs');

// We will read the file manually and parse it because it's a TS file
const tsContent = fs.readFileSync('./src/data/courses.ts', 'utf-8');

// The file exports COURSE_CATEGORIES
// Let's use ts-node to require it
require('ts-node').register({ transpileOnly: true });
const { COURSE_CATEGORIES } = require('./src/data/courses.ts');

const allCourses = COURSE_CATEGORIES.flatMap(c => c.subcategories.flatMap(s => s.courses));

const newCategories = [
  { id: 'cat-mindmap-1', title: 'مهارت های پایه کامپیوتر', iconName: 'Monitor' },
  { id: 'cat-mindmap-2', title: 'برنامه نویسی بک اند', iconName: 'TerminalSquare' },
  { id: 'cat-mindmap-3', title: 'هوش مصنوعی', iconName: 'Brain' },
  { id: 'cat-mindmap-4', title: 'کودک و نوجوان', iconName: 'Gamepad2' },
  { id: 'cat-mindmap-5', title: 'بازی سازی', iconName: 'Ghost' },
  { id: 'cat-mindmap-6', title: 'طراحی سایت', iconName: 'Globe' },
  { id: 'cat-mindmap-7', title: 'گرافیک', iconName: 'Palette' },
  { id: 'cat-mindmap-8', title: 'معماری', iconName: 'Building' },
  { id: 'cat-mindmap-9', title: 'حسابداری', iconName: 'Calculator' },
  { id: 'cat-mindmap-10', title: 'شبکه', iconName: 'Network' },
];

const mappedCourses = {
  'cat-mindmap-1': [],
  'cat-mindmap-2': [],
  'cat-mindmap-3': [],
  'cat-mindmap-4': [],
  'cat-mindmap-5': [],
  'cat-mindmap-6': [],
  'cat-mindmap-7': [],
  'cat-mindmap-8': [],
  'cat-mindmap-9': [],
  'cat-mindmap-10': [],
};

const titleToCat = {
  'پردازش تصویر و بینایی ماشین': 'cat-mindmap-3',
  'یادگیری عمیق و شبکه عصبی کانولوشن': 'cat-mindmap-3',
  'علم داده و یادگیری ماشین': 'cat-mindmap-3',
  'هوش مصنوعی و تحلیل داده در بازار های مالی': 'cat-mindmap-3',
  'ابزار های هوش مصنوعی و پرامپت نویسی': 'cat-mindmap-3',
  'هوش تجاری با microsoft power BI': 'cat-mindmap-3',
  'شبکه های عصبی بازگشتی': 'cat-mindmap-3',

  'ربات نویسی تلگرام با پایتون': 'cat-mindmap-2',
  'برنامه نویسی موبایل جامع': 'cat-mindmap-2', // Or base? Let's put in backend or general programming
  'اپلیکیشن نویسی پیشرفته موبایل': 'cat-mindmap-2',
  'دوره پایتون جامع': 'cat-mindmap-2',
  'مبانی کامپیوتر ++c': 'cat-mindmap-1', // Basic computer or backend? Put in basic or backend. 'مبانی کامپیوتر ++c' -> 'برنامه نویسی بک اند'
  'پایگاه داده SQLite3': 'cat-mindmap-2',
  'مبانی برنامه نویسی #c': 'cat-mindmap-2',
  'آموزش Git  و  GitHub': 'cat-mindmap-2',
  'Django-DRF': 'cat-mindmap-2', // Django is backend
  'پایتون CS50': 'cat-mindmap-2', // CS50 python -> backend

  'وردپرس جامع': 'cat-mindmap-6',
  'آموزش جامع بک اند سایت با php': 'cat-mindmap-6', // Web design (backend site)
  'مهندسی بک اند | Node.js، Express، TypeScript و NestJS': 'cat-mindmap-6', // Web backend
  'پک فرانت اند جامع': 'cat-mindmap-6',
  'مهندسی فرانت‌اند – React & Next.js': 'cat-mindmap-6',

  'فتوشاپ جامع مهندسی کامپیوتر': 'cat-mindmap-7',
  'طراحی رابط کاربری ui/ux': 'cat-mindmap-7',

  'زبان مهارتی نوجوان': 'cat-mindmap-4', // Kids & teens
  'زبان تخصصی کامپیوتر ویژه نوجوانان': 'cat-mindmap-4',
  'زبان تخصصی کامپیوتر ویژه بزرگسالان': 'cat-mindmap-1', // Adults -> maybe 'مهارت های پایه کامپیوتر'

  'حسابداری مقدماتی': 'cat-mindmap-9',
  'آموزش نرم افزار سپیدار و کاربرد اکسل در حسابداری (مقدماتی)': 'cat-mindmap-9',
  'آموزش کاربردی اکسل در حسابداری': 'cat-mindmap-9',

  'مهندسی شبکه و زیرساخت‌های سازمانی لینوکس (LPIC-2)': 'cat-mindmap-10',
  'هک و امنیت شبکه': 'cat-mindmap-10',
  '+Network': 'cat-mindmap-10',
  'اصول مدیریت سیستم‌عامل لینوکس (LPIC-1)': 'cat-mindmap-10',

  'پایتون نوجوان (مقدماتی)': 'cat-mindmap-4',
  'پایتون نوجوان (پیشرفته)': 'cat-mindmap-4',
  'اسکرچ پیشرفته': 'cat-mindmap-4',
  'اسکرچ مقدماتی': 'cat-mindmap-4',

  'ICDL': 'cat-mindmap-1',
  'تایپ ده انگشتی': 'cat-mindmap-1',
  'مبانی کامپیوتر': 'cat-mindmap-1'
};

allCourses.forEach(c => {
  let catId = titleToCat[c.title];
  if (catId) {
    mappedCourses[catId].push(c);
  } else {
    // default to backend if unknown
    if (c.title.includes('c++')) catId = 'cat-mindmap-2';
    else catId = 'cat-mindmap-1';
    mappedCourses[catId].push(c);
  }
});

const newCourseCategories = newCategories.map(cat => ({
  id: cat.id,
  title: cat.title,
  iconName: cat.iconName,
  subcategories: [
    {
      id: `sub-${cat.id}`,
      title: cat.title,
      courses: mappedCourses[cat.id] || []
    }
  ]
}));

const fileOutput = `export interface CourseItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  url?: string;
  price?: string;
  fullDescription?: string;
  sections?: {title: string, items: string[]}[];
  schedules?: string[];
  metadata?: string[];
}

export interface CourseCategory {
  id: string;
  title: string;
  iconName: string;
  subcategories: {
    id: string;
    title: string;
    courses: CourseItem[];
  }[];
}

export const COURSE_CATEGORIES: CourseCategory[] = ${JSON.stringify(newCourseCategories, null, 2)};
`;

fs.writeFileSync('./src/data/courses.ts', fileOutput);
console.log("Updated courses.ts");

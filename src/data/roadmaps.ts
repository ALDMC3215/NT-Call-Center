import { NodeDef, EdgeDef } from '../components/Shared/RoadmapCanvas';

export const AI_NODES: NodeDef[] = [
  { id: 'root', title: 'برنامه‌نویسی هوش مصنوعی', x: 400, y: 80, isRoot: true },
  { id: 'n1', title: 'پایتون جامع', step: 1, x: 400, y: 190 },
  { id: 'n2', title: 'جاوا', step: 2, x: 400, y: 290 },
  { id: 'n3', title: 'دیتابیس', step: 3, x: 400, y: 390 },
  { id: 'n4', title: 'دیتاآنالیز', step: 4, x: 400, y: 490 },
  { id: 'n5', title: 'یادگیری عمیق', step: 5, x: 400, y: 590 },
  { id: 'n6', title: 'بینایی ماشین', step: 6, x: 400, y: 690 },
  { id: 'n7', title: 'شبکه بازگشتی', step: 7, x: 400, y: 790 },
];

export const AI_EDGES: EdgeDef[] = [
  { from: 'root', to: 'n1' },
  { from: 'n1', to: 'n2' },
  { from: 'n2', to: 'n3' },
  { from: 'n3', to: 'n4' },
  { from: 'n4', to: 'n5' },
  { from: 'n5', to: 'n6' },
  { from: 'n6', to: 'n7' },
];

export const NETWORK_NODES: NodeDef[] = [
  { id: 'root', title: 'شبکه و امنیت', x: 400, y: 80, isRoot: true },
  { id: 'netplus', title: 'نتورک پلاس', step: 1, x: 400, y: 230 },
  { id: 'py', title: 'پایتون جامع', step: 'پ', x: 160, y: 230 },
  { id: 'lpic1', title: 'Linux LPIC-1', step: 'پ', x: 640, y: 170 },
  { id: 'lpic2', title: 'Linux LPIC-2', step: 'پ', x: 640, y: 290 },
  { id: 'hack', title: 'هک و امنیت شبکه', step: 2, x: 400, y: 400 },
];

export const NETWORK_EDGES: EdgeDef[] = [
  { from: 'root', to: 'netplus' },
  { from: 'netplus', to: 'hack' },
  { from: 'py', to: 'hack' },
  { from: 'lpic1', to: 'lpic2' },
  { from: 'lpic2', to: 'hack' },
];

export const KIDS_NODES: NodeDef[] = [
  { id: 'root', title: 'کودک و نوجوان', x: 400, y: 80, isRoot: true },
  
  // 6 to 8 years
  { id: 'scratch', title: 'اسکرچ (۶ تا ۸ سال)', step: 1, x: 220, y: 200 },
  { id: 'game_basic', title: 'بازی‌سازی مقدماتی', step: 2, x: 220, y: 320 },

  // 8 to 16 years
  { id: 'py_teen', title: 'پایتون نوجوان (۸ تا ۱۶ سال)', step: 1, x: 580, y: 200 },
  { id: 'oop', title: 'شی‌گرایی', step: 2, x: 580, y: 320 },
  { id: 'game_dev', title: 'بازی‌سازی', step: 3, x: 580, y: 440 },
];

export const KIDS_EDGES: EdgeDef[] = [
  { from: 'root', to: 'scratch' },
  { from: 'scratch', to: 'game_basic' },
  { from: 'root', to: 'py_teen' },
  { from: 'py_teen', to: 'oop' },
  { from: 'oop', to: 'game_dev' },
];

export const BOT_NODES: NodeDef[] = [
  { id: 'root', title: 'مبانی برنامه‌نویسی و ربات', x: 400, y: 80, isRoot: true },
  
  // Private
  { id: 'cpp_csharp', title: 'C++ / C# (خصوصی)', step: 'ویژه', x: 150, y: 200 },
  
  // Bot Path
  { id: 'py', title: 'پایتون جامع', step: 'پ', x: 550, y: 200 },
  { id: 'java', title: 'جاوا', step: 'پ', x: 700, y: 320 },
  { id: 'data', title: 'دیتا آنالیز', step: 'تحلیل', x: 400, y: 320 },
  { id: 'dl', title: 'یادگیری عمیق', step: 'مالی', x: 400, y: 440 },
  { id: 'bot', title: 'ربات تلگرام', step: 1, x: 550, y: 560 },
];

export const BOT_EDGES: EdgeDef[] = [
  { from: 'root', to: 'cpp_csharp' },
  { from: 'root', to: 'py' },
  { from: 'py', to: 'java' },
  { from: 'java', to: 'bot' },
  
  // Data analysis path for simple data bot
  { from: 'py', to: 'data' },
  { from: 'data', to: 'bot' }, // simple data bot
  
  // Deep learning path for finance bot
  { from: 'data', to: 'dl' },
  { from: 'dl', to: 'bot' },
];

export const API_NODES: NodeDef[] = [
  { id: 'root', title: 'API نویسی و بک‌اند', x: 400, y: 80, isRoot: true },
  { id: 'py', title: 'پایتون جامع', step: 1, x: 400, y: 200 },
  { id: 'db', title: 'دیتابیس', step: 2, x: 400, y: 320 },
  { id: 'django', title: 'Django & DRF', step: 3, x: 400, y: 440 },
];

export const API_EDGES: EdgeDef[] = [
  { from: 'root', to: 'py' },
  { from: 'py', to: 'db' },
  { from: 'db', to: 'django' },
];

export const MOBILE_NODES: NodeDef[] = [
  { id: 'root', title: 'برنامه‌نویسی موبایل', x: 400, y: 80, isRoot: true },
  { id: 'py', title: 'پایتون جامع', step: 'پ', x: 400, y: 200 },
  { id: 'java', title: 'جاوا', step: 'پ', x: 400, y: 320 },
  { id: 'mobile', title: 'برنامه‌نویسی موبایل جامع', step: 1, x: 400, y: 440 },
  { id: 'advanced', title: 'اپلیکیشن پیشرفته', step: 2, x: 400, y: 560 },
];

export const MOBILE_EDGES: EdgeDef[] = [
  { from: 'root', to: 'py' },
  { from: 'py', to: 'java' },
  { from: 'java', to: 'mobile' },
  { from: 'mobile', to: 'advanced' },
];

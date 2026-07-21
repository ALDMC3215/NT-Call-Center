export type Node = { id: string, type?: string, data: any, position?: any };
export type Edge = { id: string, source: string, target: string, type?: string, animated?: boolean, style?: any };

// Common colors matching the screenshot
const COLORS = {
  root: '#c7c2ff', // Light purple
  level1: '#c4d7f5', // Light blue
  level2: '#b8e3d6', // Light teal
  level3: '#b1f0c2', // Light green
};

// Initial nodes mapped from the screenshot
export const initialNodes: Node[] = [
  // ROOT
  { id: 'root', type: 'mindmap', data: { label: 'مسیرهای یادگیری نوین تک', level: 0, color: COLORS.root }, position: { x: 0, y: 0 } },
  { id: 'icdl', type: 'mindmap', data: { label: 'ICDL (به شرط بلد نبودن کار با کامپیوتر)', level: 0, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  
  // LEVEL 1
  { id: 'cat-ai', type: 'mindmap', data: { label: 'هوش مصنوعی', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-network', type: 'mindmap', data: { label: 'شبکه و امنیت', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-kids', type: 'mindmap', data: { label: 'کودک و نوجوان', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-robotics', type: 'mindmap', data: { label: 'مبانی و ربات نویسی', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-api', type: 'mindmap', data: { label: 'نویسی API', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-mobile', type: 'mindmap', data: { label: 'برنامه نویسی موبایل', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-web', type: 'mindmap', data: { label: 'طراحی وبسایت', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },
  { id: 'cat-graphics', type: 'mindmap', data: { label: 'گرافیک و طراحی', level: 1, color: COLORS.level1 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - AI
  { id: 'ai-python', type: 'mindmap', data: { label: 'پایتون', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'ai-java', type: 'mindmap', data: { label: 'جاوا', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'ai-db', type: 'mindmap', data: { label: 'دیتابیس', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'ai-data', type: 'mindmap', data: { label: 'دیتا آنالیز', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'ai-deep', type: 'mindmap', data: { label: 'یادگیری عمیق', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'ai-vision', type: 'mindmap', data: { label: 'بینایی ماشین', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'ai-rnn', type: 'mindmap', data: { label: 'شبکه بازگشتی', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - Network
  { id: 'net-plus', type: 'mindmap', data: { label: 'نتورک پلاس', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'net-hack', type: 'mindmap', data: { label: 'هک و امنیت', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  
  // LEVEL 3 - Hack
  { id: 'hack-py', type: 'mindmap', data: { label: 'پایتون', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'hack-l1', type: 'mindmap', data: { label: 'Linux lpic-1', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'hack-l2', type: 'mindmap', data: { label: 'Linux Lpic-2', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - Kids
  { id: 'kids-scratch', type: 'mindmap', data: { label: 'اسکرچ (۶ تا ۸ سال)', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'kids-python', type: 'mindmap', data: { label: 'پایتون نوجوان', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'kids-game', type: 'mindmap', data: { label: 'بازی سازی', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'kids-oop', type: 'mindmap', data: { label: 'شئ گرایی', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - Robotics
  { id: 'rob-cpp', type: 'mindmap', data: { label: '(خصوصی) C# و C++', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'rob-tel', type: 'mindmap', data: { label: 'ربات نویسی تلگرام', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },

  // LEVEL 3 - Telegram Bot
  { id: 'tel-py', type: 'mindmap', data: { label: 'شروع با پایتون', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'tel-java', type: 'mindmap', data: { label: 'مبانی جاوا', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'tel-ml', type: 'mindmap', data: { label: 'تحلیل مالی (دیپ لرنینگ)', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'tel-data', type: 'mindmap', data: { label: 'دیتاک ساده (دیتا آنالیز)', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - API
  { id: 'api-py', type: 'mindmap', data: { label: 'پایتون', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'api-db', type: 'mindmap', data: { label: 'دیتابیس', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'api-django', type: 'mindmap', data: { label: 'Django DRF', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - Mobile
  { id: 'mob-full', type: 'mindmap', data: { label: 'موبایل جامع', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'mob-app', type: 'mindmap', data: { label: 'اپلیکیشن نویسی', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - Web Design
  { id: 'web-front', type: 'mindmap', data: { label: 'با کدنویسی (فرانت اند)', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'web-wp', type: 'mindmap', data: { label: 'بدون کدنویسی (وردپرس)', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },

  // LEVEL 3 - Web Frontend
  { id: 'front-html', type: 'mindmap', data: { label: 'HTML / CSS', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'front-js', type: 'mindmap', data: { label: 'JS / Bootstrap', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  
  // LEVEL 3 - Web WP
  { id: 'wp-adults', type: 'mindmap', data: { label: 'وردپرس بزرگسالان', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },
  { id: 'wp-kids', type: 'mindmap', data: { label: 'وردپرس نوجوانان', level: 3, color: COLORS.level3 }, position: { x: 0, y: 0 } },

  // LEVEL 2 - Graphics
  { id: 'gfx-uiux', type: 'mindmap', data: { label: 'طراحی رابط کاربری UI/UX', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
  { id: 'gfx-ps', type: 'mindmap', data: { label: 'فتوشاپ جامع (مکمل)', level: 2, color: COLORS.level2 }, position: { x: 0, y: 0 } },
];

export const initialEdges: Edge[] = [
  // Root -> ICDL
  { id: 'e-root-icdl', source: 'root', target: 'icdl', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // ICDL -> Level 1
  { id: 'e-icdl-ai', source: 'icdl', target: 'cat-ai', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-network', source: 'icdl', target: 'cat-network', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-kids', source: 'icdl', target: 'cat-kids', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-robotics', source: 'icdl', target: 'cat-robotics', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-api', source: 'icdl', target: 'cat-api', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-mobile', source: 'icdl', target: 'cat-mobile', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-web', source: 'icdl', target: 'cat-web', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-icdl-graphics', source: 'icdl', target: 'cat-graphics', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // AI -> Level 2
  { id: 'e-ai-python', source: 'cat-ai', target: 'ai-python', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-ai-java', source: 'cat-ai', target: 'ai-java', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-ai-db', source: 'cat-ai', target: 'ai-db', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-ai-data', source: 'cat-ai', target: 'ai-data', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-ai-deep', source: 'cat-ai', target: 'ai-deep', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-ai-vision', source: 'cat-ai', target: 'ai-vision', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-ai-rnn', source: 'cat-ai', target: 'ai-rnn', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Network -> Level 2
  { id: 'e-net-plus', source: 'cat-network', target: 'net-plus', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-net-hack', source: 'cat-network', target: 'net-hack', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Hack -> Level 3
  { id: 'e-hack-py', source: 'net-hack', target: 'hack-py', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-hack-l1', source: 'net-hack', target: 'hack-l1', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-hack-l2', source: 'net-hack', target: 'hack-l2', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Kids -> Level 2
  { id: 'e-kids-scratch', source: 'cat-kids', target: 'kids-scratch', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-kids-python', source: 'cat-kids', target: 'kids-python', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-kids-game', source: 'cat-kids', target: 'kids-game', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-kids-oop', source: 'cat-kids', target: 'kids-oop', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Robotics -> Level 2
  { id: 'e-rob-cpp', source: 'cat-robotics', target: 'rob-cpp', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-rob-tel', source: 'cat-robotics', target: 'rob-tel', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Robotics -> Level 3
  { id: 'e-tel-py', source: 'rob-tel', target: 'tel-py', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-tel-java', source: 'rob-tel', target: 'tel-java', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-tel-ml', source: 'rob-tel', target: 'tel-ml', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-tel-data', source: 'rob-tel', target: 'tel-data', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // API -> Level 2
  { id: 'e-api-py', source: 'cat-api', target: 'api-py', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-api-db', source: 'cat-api', target: 'api-db', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-api-django', source: 'cat-api', target: 'api-django', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Mobile -> Level 2
  { id: 'e-mob-full', source: 'cat-mobile', target: 'mob-full', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-mob-app', source: 'cat-mobile', target: 'mob-app', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Web Design -> Level 2
  { id: 'e-web-front', source: 'cat-web', target: 'web-front', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-web-wp', source: 'cat-web', target: 'web-wp', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Web Frontend -> Level 3
  { id: 'e-front-html', source: 'web-front', target: 'front-html', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-front-js', source: 'web-front', target: 'front-js', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  
  // Web WP -> Level 3
  { id: 'e-wp-adults', source: 'web-wp', target: 'wp-adults', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-wp-kids', source: 'web-wp', target: 'wp-kids', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },

  // Graphics -> Level 2
  { id: 'e-gfx-uiux', source: 'cat-graphics', target: 'gfx-uiux', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
  { id: 'e-gfx-ps', source: 'cat-graphics', target: 'gfx-ps', type: 'default', animated: true, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
];

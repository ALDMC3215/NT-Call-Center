import json

urls = [
    "https://itech-co.ir/product/icdl/",
    "https://itech-co.ir/product/github/",
    "https://itech-co.ir/product/linkdin/",
    "https://itech-co.ir/product/articlefor-vision/",
    "https://itech-co.ir/product/python/",
    "https://itech-co.ir/product/python-cs50/",
    "https://itech-co.ir/product/android-java/",
    "https://itech-co.ir/product/android-advance/",
    "https://itech-co.ir/product/machine-learning-data-analysis/",
    "https://itech-co.ir/product/deep-learning/",
    "https://itech-co.ir/product/vision/",
    "https://itech-co.ir/product/rnn/",
    "https://itech-co.ir/product/powerbi/",
    "https://itech-co.ir/product/chatgpt/",
    "https://itech-co.ir/product/django-drf/",
    "https://itech-co.ir/product/sqlite3/",
    "https://itech-co.ir/product/scratch/",
    "https://itech-co.ir/product/python-kids/",
    "https://itech-co.ir/product/game-junior/",
    "https://itech-co.ir/product/oop-kids/",
    "https://itech-co.ir/product/cpp/",
    "https://itech-co.ir/product/c-sharp/",
    "https://itech-co.ir/product/finance-ai/",
    "https://itech-co.ir/product/bot-tel/",
    "https://itech-co.ir/product/front-end/",
    "https://itech-co.ir/product/frontend-master/",
    "https://itech-co.ir/product/backend-course-nodejs-nestjs/",
    "https://itech-co.ir/product/php/",
    "https://itech-co.ir/product/wp-ecommerce/",
    "https://itech-co.ir/product/ui-ux/",
    "https://itech-co.ir/product/photoshop/",
    "https://itech-co.ir/product/comprehensive-matrix/",
    "https://itech-co.ir/product/dore-zaban-maharati-nojavan/",
    "https://itech-co.ir/product/it-english-course-for-teens/",
    "https://itech-co.ir/product/english-for-it/",
    "https://itech-co.ir/product/excel-in-accounting/",
    "https://itech-co.ir/product/%d8%ad%d8%b3%d8%a7%d8%a8%d8%af%d8%a7%d8%b1%db%8c-%d9%85%d9%82%d8%af%d9%85%d8%a7%d8%aa%db%8c/",
    "https://itech-co.ir/product/sepidar/",
    "https://itech-co.ir/product/network/",
    "https://itech-co.ir/product/linux-lpic-1-course/",
    "https://itech-co.ir/product/lpic-2-linux-network-infrastructure-course/",
    "https://itech-co.ir/product/cyber-security/"
]

# Create a mapping for slugs to nice titles and categories
mappings = {
    "icdl": {"title": "ICDL جامع", "cat": "مهارت‌های پایه"},
    "github": {"title": "گیت و گیت هاب (Git & Github)", "cat": "برنامه‌نویسی"},
    "linkdin": {"title": "لینکدین برای برنامه نویسان", "cat": "مهارت‌های پایه"},
    "articlefor-vision": {"title": "مقاله نویسی", "cat": "مهارت‌های پایه"},
    "python": {"title": "پایتون جامع (Python)", "cat": "برنامه‌نویسی"},
    "python-cs50": {"title": "پایتون CS50", "cat": "برنامه‌نویسی"},
    "android-java": {"title": "اندروید با جاوا", "cat": "برنامه‌نویسی"},
    "android-advance": {"title": "اندروید پیشرفته", "cat": "برنامه‌نویسی"},
    "machine-learning-data-analysis": {"title": "ماشین لرنینگ و تحلیل داده", "cat": "هوش مصنوعی"},
    "deep-learning": {"title": "یادگیری عمیق (Deep Learning)", "cat": "هوش مصنوعی"},
    "vision": {"title": "بینایی ماشین (Computer Vision)", "cat": "هوش مصنوعی"},
    "rnn": {"title": "شبکه‌های عصبی بازگشتی (RNN)", "cat": "هوش مصنوعی"},
    "powerbi": {"title": "پاور بی آی (Power BI)", "cat": "هوش مصنوعی"},
    "chatgpt": {"title": "کاربرد ChatGPT", "cat": "هوش مصنوعی"},
    "django-drf": {"title": "جنگو و DRF", "cat": "برنامه‌نویسی"},
    "sqlite3": {"title": "پایگاه داده SQLite3", "cat": "برنامه‌نویسی"},
    "scratch": {"title": "اسکرچ (Scratch)", "cat": "کودک و نوجوان"},
    "python-kids": {"title": "پایتون ویژه کودکان", "cat": "کودک و نوجوان"},
    "game-junior": {"title": "بازی‌سازی کودکان", "cat": "کودک و نوجوان"},
    "oop-kids": {"title": "شی‌گرایی ویژه کودکان", "cat": "کودک و نوجوان"},
    "cpp": {"title": "زبان C++", "cat": "برنامه‌نویسی"},
    "c-sharp": {"title": "زبان C#", "cat": "برنامه‌نویسی"},
    "finance-ai": {"title": "هوش مصنوعی در بازارهای مالی", "cat": "هوش مصنوعی"},
    "bot-tel": {"title": "ساخت ربات تلگرام", "cat": "برنامه‌نویسی"},
    "front-end": {"title": "فرانت‌اند (مقدماتی)", "cat": "طراحی سایت"},
    "frontend-master": {"title": "فرانت‌اند (پیشرفته)", "cat": "طراحی سایت"},
    "backend-course-nodejs-nestjs": {"title": "بک‌اند (Node.js & NestJS)", "cat": "طراحی سایت"},
    "php": {"title": "زبان PHP", "cat": "طراحی سایت"},
    "wp-ecommerce": {"title": "فروشگاه‌ساز وردپرس", "cat": "طراحی سایت"},
    "ui-ux": {"title": "طراحی رابط کاربری (UI/UX)", "cat": "گرافیک"},
    "photoshop": {"title": "فتوشاپ (Photoshop)", "cat": "گرافیک"},
    "comprehensive-matrix": {"title": "ماتریس جامع", "cat": "سایر"},
    "dore-zaban-maharati-nojavan": {"title": "زبان مهارتی نوجوان", "cat": "کودک و نوجوان"},
    "it-english-course-for-teens": {"title": "زبان IT نوجوان", "cat": "کودک و نوجوان"},
    "english-for-it": {"title": "زبان انگلیسی ویژه IT", "cat": "مهارت‌های پایه"},
    "excel-in-accounting": {"title": "اکسل در حسابداری", "cat": "حسابداری"},
    "%d8%ad%d8%b3%d8%a7%d8%a8%d8%af%d8%a7%d8%b1%db%8c-%d9%85%d9%82%d8%af%d9%85%d8%a7%d8%aa%db%8c": {"title": "حسابداری مقدماتی", "cat": "حسابداری"},
    "sepidar": {"title": "نرم‌افزار سپیدار", "cat": "حسابداری"},
    "network": {"title": "شبکه +Network", "cat": "شبکه"},
    "linux-lpic-1-course": {"title": "لینوکس LPIC-1", "cat": "شبکه"},
    "lpic-2-linux-network-infrastructure-course": {"title": "لینوکس LPIC-2", "cat": "شبکه"},
    "cyber-security": {"title": "امنیت و سایبری", "cat": "شبکه"}
}

categories = {}

for i, u in enumerate(set(urls)):
    if not u.endswith('/'):
        u += '/'
    # Extract slug
    parts = u.strip('/').split('/')
    slug = parts[-1]
    
    info = mappings.get(slug, {"title": slug.replace('-', ' ').title(), "cat": "سایر"})
    cat = info['cat']
    
    if cat not in categories:
        categories[cat] = []
        
    categories[cat].append({
        "id": f"course-{i}",
        "title": info['title'],
        "description": "برای مشاهده جزئیات دوره، لطفاً اطلاعات را به‌روزرسانی کنید.",
        "iconName": "Monitor",
        "url": u
    })

# Write to courses.ts
with open('src/data/courses.ts', 'w', encoding='utf-8') as out:
    out.write("export interface CourseItem {\n  id: string;\n  title: string;\n  description: string;\n  iconName: string;\n  url?: string;\n  price?: string;\n  fullDescription?: string;\n  sections?: {title: string, items: string[]}[];\n  schedules?: string[];\n}\n\nexport interface CourseCategory {\n  id: string;\n  title: string;\n  iconName: string;\n  subcategories: {\n    id: string;\n    title: string;\n    courses: CourseItem[];\n  }[];\n}\n\n")
    
    out.write("export const COURSE_CATEGORIES: CourseCategory[] = [\n")

    for i, (cat_name, items) in enumerate(categories.items()):
        out.write("  {\n")
        out.write(f"    id: 'cat-{i}',\n")
        out.write(f"    title: {json.dumps(cat_name, ensure_ascii=False)},\n")
        out.write("    iconName: 'Book',\n")
        out.write("    subcategories: [\n")
        out.write("      {\n")
        out.write(f"        id: 'subcat-{i}',\n")
        out.write(f"        title: {json.dumps(cat_name, ensure_ascii=False)},\n")
        out.write("        courses: [\n")
        for item in items:
            out.write("          {\n")
            out.write(f"            id: {json.dumps(item['id'])},\n")
            out.write(f"            title: {json.dumps(item['title'], ensure_ascii=False)},\n")
            out.write(f"            description: {json.dumps(item['description'], ensure_ascii=False)},\n")
            out.write(f"            iconName: {json.dumps(item['iconName'])},\n")
            out.write(f"            url: {json.dumps(item['url'])}\n")
            out.write("          },\n")
        out.write("        ]\n")
        out.write("      }\n")
        out.write("    ]\n")
        out.write("  },\n")

    out.write("];\n")

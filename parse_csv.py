import csv
import json
import re

courses_data = []

with open('Products.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Check if the row has the required fields
        if not row.get('نام') or row.get('نام') == 'نام':
            continue
            
        title = (row.get('نام') or '').strip()
        short_desc = (row.get('توضیح کوتاه') or '').strip()
        full_desc = (row.get('توضیحات') or '').strip()
        
        categories_str = row.get('دسته‌ها') or ''
        categories = categories_str.split(',')
        price = row.get('متا: _wc_deposit_amount') or ''
        
        # Clean HTML from description
        desc = re.sub(r'<[^>]+>', '', short_desc or full_desc)
        desc = desc.replace('\n', ' ').strip()
        
        main_category = 'سایر'
        for cat in categories:
            cat = cat.strip()
            if cat and cat != 'همه' and cat != 'default':
                main_category = cat
                break
                
        courses_data.append({
            'title': title,
            'description': desc[:100] + ('...' if len(desc) > 100 else ''),
            'category': main_category,
            'id': f"course-{len(courses_data)}"
        })

with open('src/data/courses.ts', 'w', encoding='utf-8') as out:
    out.write("import { CourseCategory, CourseItem } from './types';\n\n")
    out.write("export const COURSE_CATEGORIES: CourseCategory[] = [\n")
    
    grouped = {}
    for c in courses_data:
        cat = c['category']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(c)

    for i, (cat, items) in enumerate(grouped.items()):
        out.write("  {\n")
        out.write(f"    id: 'cat-{i}',\n")
        out.write(f"    title: {json.dumps(cat, ensure_ascii=False)},\n")
        out.write("    iconName: 'Book',\n")
        out.write("    subcategories: [\n")
        out.write("      {\n")
        out.write(f"        id: 'subcat-{i}',\n")
        out.write(f"        title: 'دوره‌های ' + {json.dumps(cat, ensure_ascii=False)},\n")
        out.write("        courses: [\n")
        for item in items:
            out.write("          {\n")
            out.write(f"            id: {json.dumps(item['id'])},\n")
            out.write(f"            title: {json.dumps(item['title'], ensure_ascii=False)},\n")
            out.write(f"            description: {json.dumps(item['description'], ensure_ascii=False)},\n")
            out.write("            iconName: 'Monitor'\n")
            out.write("          },\n")
        out.write("        ]\n")
        out.write("      }\n")
        out.write("    ]\n")
        out.write("  },\n")

    out.write("];\n")

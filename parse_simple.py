import json

lines = open('Products.csv', 'r', encoding='utf-8-sig').readlines()

courses_data = []

# List of known categories we want to map to
known_categories = [
    "برنامه نویسی بک اند", "برنامه نویسی", "هوش مصنوعی", "گرافیک", "معماری", "شبکه", "حسابداری", "کودک و نوجوان", "دیپلم کامپیوتر"
]

for line in lines[1:]:
    if not line.strip():
        continue
    parts = line.split(',')
    if len(parts) > 3:
        name = parts[2]
        
        # We can find the categories by searching for known category names in the line
        cat_found = 'سایر'
        for kcat in known_categories:
            if kcat in line:
                cat_found = kcat
                break
                
        # Description can be extracted roughly
        # It's after the 4th comma until we hit a known category or metadata like 'default'
        desc_start = line.find(',,', line.find(name))
        if desc_start != -1:
            desc_start += 2
        else:
            desc_start = line.find(',', line.find(name) + len(name)) + 1
            
        desc = line[desc_start:desc_start+200]
        # Clean HTML tags
        import re
        desc = re.sub(r'<[^>]+>', '', desc).replace('\\n', ' ').strip()
        
        courses_data.append({
            'id': f"course-{len(courses_data)}",
            'title': name,
            'description': desc[:100] + "...",
            'category': cat_found
        })

with open('src/data/courses.ts', 'w', encoding='utf-8') as out:
    out.write("import { CourseCategory, CourseItem } from './types';\n\n")
    out.write("export const COURSE_CATEGORIES: CourseCategory[] = [\n")
    # Group by category
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

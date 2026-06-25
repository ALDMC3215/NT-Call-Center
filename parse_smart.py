import re
import json

courses = []
current_course = None

with open('Products.csv', 'r', encoding='utf-8-sig') as f:
    for line in f:
        # A valid new course line starts with "کد ندارد," or a number followed by ","
        if line.startswith('کد ندارد,') or re.match(r'^\d+,', line):
            if current_course:
                courses.append(current_course)
            
            # This is a new course
            parts = line.split(',')
            # parts[0]: id, parts[1]: type, parts[2]: title
            title = parts[2].strip()
            
            # The description starts from parts[4]. It might contain commas.
            # We just join the rest for now, and we'll extract category by searching
            rest_of_line = ','.join(parts[4:])
            
            current_course = {
                'title': title,
                'raw_desc': rest_of_line
            }
        elif current_course:
            # Continuation of the previous course's description
            current_course['raw_desc'] += '\n' + line

if current_course:
    courses.append(current_course)

known_categories = [
    "برنامه نویسی بک اند", "برنامه نویسی", "هوش مصنوعی", "گرافیک", "معماری", "شبکه", "حسابداری", "کودک و نوجوان", "دیپلم کامپیوتر"
]

# Now process the courses
final_courses = []
for i, c in enumerate(courses):
    raw_desc = c['raw_desc']
    
    # Try to find category
    cat_found = 'سایر'
    for kcat in known_categories:
        if kcat in raw_desc:
            cat_found = kcat
            break
            
    # Clean up description
    # Remove HTML tags
    clean_desc = re.sub(r'<[^>]+>', '', raw_desc)
    clean_desc = clean_desc.replace('\n', ' ').replace('\r', ' ').strip()
    
    # Description usually ends when we hit metadata like "default", "no-teacher", "فارسی"
    # But let's just take the first 150 chars
    short_desc = clean_desc[:150] + ('...' if len(clean_desc) > 150 else '')
    
    final_courses.append({
        'id': f"course-{i}",
        'title': c['title'],
        'description': short_desc,
        'category': cat_found
    })

# Write to courses.ts
with open('src/data/courses.ts', 'w', encoding='utf-8') as out:
    out.write("import { CourseCategory, CourseItem } from './types';\n\n")
    out.write("export const COURSE_CATEGORIES: CourseCategory[] = [\n")
    
    grouped = {}
    for c in final_courses:
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

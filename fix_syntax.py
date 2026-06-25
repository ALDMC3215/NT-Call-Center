import re
with open('src/data/courses.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'fullDescription:\s*\n\s*sections: (\[.*?\]),\"(.*?)\",', r'fullDescription: "\2",\n            sections: \1,', content)

with open('src/data/courses.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Syntax fixed")

import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find any shadow- class, including shadow-sm, shadow-[color], shadow-slate-200/50, etc.
    # Note: this might leave extra spaces, which is fine in class names.
    new_content = re.sub(r'\bshadow(-[a-zA-Z0-9/.-]+)?\b', '', content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    src_dir = os.path.join(os.getcwd(), 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()

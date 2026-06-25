import os
import re
from pathlib import Path

# Mapping of hardcoded light theme classes to our new semantic variables
replacements = {
    # Backgrounds
    r'\bbg-white\b': 'bg-surface',
    r'\bbg-\[\#fffcfb\]\b': 'bg-base',
    r'\bbg-\[\#fbf8f4\]\b': 'bg-surface',
    r'\bbg-slate-50\b': 'bg-surface-hover',
    r'\bbg-gray-50\b': 'bg-surface-hover',
    r'\bbg-slate-100\b': 'bg-surface-hover',
    r'\bhover:bg-slate-50\b': 'hover:bg-surface-hover',
    r'\bhover:bg-gray-50\b': 'hover:bg-surface-hover',
    r'\bhover:bg-slate-100\b': 'hover:bg-surface-hover',
    r'\bbg-\[\#F0E3D2\]\b': 'bg-surface-hover',
    r'\bg-neutral-50\b': 'bg-surface-hover',

    # Text Colors
    r'\btext-slate-800\b': 'text-primary',
    r'\btext-slate-700\b': 'text-primary',
    r'\btext-\[\#4e6077\]\b': 'text-primary',
    r'\btext-\[\#7089a9\]\b': 'text-secondary',
    r'\btext-slate-600\b': 'text-secondary',
    r'\btext-gray-600\b': 'text-secondary',
    r'\btext-gray-500\b': 'text-muted',
    r'\btext-slate-500\b': 'text-muted',
    r'\btext-\[\#D6BFB1\]\b': 'text-secondary',

    # Borders
    r'\bborder-slate-200\b': 'border-border',
    r'\bborder-gray-200\b': 'border-border',
    r'\bborder-slate-300\b': 'border-border',
    r'\bborder-\[\#7089a9\]/20\b': 'border-border',
    r'\bborder-\[\#7089a9\]/10\b': 'border-border',
    r'\bborder-\[\#D6BFB1\]\b': 'border-border',
    
    # Specific edge cases seen
    r'\bhover:border-\[\#4e6077\]\b': 'hover:border-primary',
    r'\bhover:text-\[\#4e6077\]\b': 'hover:text-primary',
    r'\bhover:text-\[\#fffcfb\]\b': 'hover:text-bg-base',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    src_dir = Path('./src')
    modified_count = 0
    for tsx_file in src_dir.rglob('*.tsx'):
        if process_file(tsx_file):
            print(f"Modified: {tsx_file}")
            modified_count += 1
            
    print(f"Total files modified: {modified_count}")

if __name__ == '__main__':
    main()

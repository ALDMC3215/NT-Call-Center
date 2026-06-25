import csv
import json

with open('Products.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    headers = next(reader)
    
with open('headers.json', 'w', encoding='utf-8') as out:
    json.dump(headers, out, ensure_ascii=False, indent=2)

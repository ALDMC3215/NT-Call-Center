from bs4 import BeautifulSoup
import traceback

try:
    soup = BeautifulSoup(open('test_icdl.html', encoding='utf-8'), 'html.parser')
    keywords = ['نوع دوره', 'پیش نیاز', 'تاریخ شروع', 'زبان', 'ساعت', 'گواهی']
    
    with open('meta2.txt', 'w', encoding='utf-8') as f:
        for el in soup.find_all(['li', 'div', 'p', 'span', 'ul']):
            text = el.get_text(strip=True)
            if any(k in text for k in keywords) and len(text) < 100:
                f.write(f"[{el.name}] class='{el.get('class', [])}' => {text}\n")
except Exception as e:
    with open('meta2.txt', 'w', encoding='utf-8') as f:
        f.write(traceback.format_exc())

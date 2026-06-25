const fs = require('fs');

const content = fs.readFileSync('Products.csv', 'utf-8');

// A simple CSV parser to get headers and some rows
let rows = [];
let currentRow = [];
let currentCell = '';
let inQuotes = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (inQuotes) {
    if (char === '"' && content[i+1] === '"') {
      currentCell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = false;
    } else {
      currentCell += char;
    }
  } else {
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentCell);
      currentCell = '';
    } else if (char === '\n' || char === '\r') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      if (char === '\r' && content[i+1] === '\n') {
        i++;
      }
    } else {
      currentCell += char;
    }
  }
}
if (currentCell || currentRow.length > 0) {
  currentRow.push(currentCell);
  rows.push(currentRow);
}

const headers = rows[0];
const categoryIndex = headers.indexOf('دسته‌ها');
const nameIndex = headers.indexOf('نام');

const categories = new Set();
rows.slice(1).forEach(row => {
  if (row[categoryIndex]) {
    row[categoryIndex].split(',').forEach(c => categories.add(c.trim()));
  }
});

console.log("Headers:", headers.slice(0, 10));
console.log("Categories:", Array.from(categories));

import fs from 'fs';
import path from 'path';

const mappings = {
  'bg-[#060D09]': 'bg-gray-50',
  'bg-[#0F1F16]': 'bg-white',
  'bg-[#080E0B]': 'bg-gray-50',
  'bg-[#080F0B]': 'bg-gray-50',
  'bg-[#0A1510]': 'bg-gray-50',
  'bg-[#0a1510]': 'bg-gray-50',
  'bg-[#0C1610]': 'bg-gray-50',
  'bg-[#0E1A13]': 'bg-white',
  'bg-[#132019]': 'bg-gray-100',
  'bg-[#162B1E]': 'bg-gray-100',
  
  // Extra dark overlays
  'bg-[#060D09]/80': 'bg-gray-900/40',
  'bg-[#060D09]/90': 'bg-gray-900/50',
  'bg-[#080F0B]/80': 'bg-gray-900/40',

  // Borders
  'border-[#1E3328]': 'border-gray-200',
  'border-[#1F3329]': 'border-gray-200',
  'border-[#2C5040]': 'border-gray-300',
  'border-[#2A4A38]': 'border-gray-300',

  // Texts
  'text-[#EDE8DF]': 'text-gray-800',
  'text-[#F0EDE6]': 'text-gray-800',
  'text-[#white]': 'text-white', // keeping text-white for buttons
  'text-[#7A9688]': 'text-gray-600',
  'text-[#8A9E92]': 'text-gray-600',
  'text-[#3D5C4A]': 'text-gray-500',
  'text-[#4A6358]': 'text-gray-500',
  'placeholder-[#3D5C4A]': 'placeholder-gray-400',
  'placeholder-[#4A6358]': 'placeholder-gray-400',

  // Danger colors
  'bg-[#2B0D0D]': 'bg-red-50',
  'bg-[#3D0A0A]': 'bg-red-50',
  'bg-[#3D1414]': 'bg-red-100',
  'bg-[#2E0A0A]': 'bg-red-50',
  'border-[#5C1A1A]': 'border-red-200',
  'border-[#6B1B1B]': 'border-red-200',

  // Accents mapping to Imperial Green and Gold
  'text-[#3DBA76]': 'text-[#1B6B42]',
  'text-[#4ADE80]': 'text-[#1B6B42]',
  'bg-[#0D2B1A]': 'bg-[#E8F3ED]', // light green background
  'border-[#1A5C3A]': 'border-[#1B6B42]',
};

// Also remove glows: shadow-[0_0_8px_rgba(61,186,118,0.5)] -> ''
// and shadow-[0_0_*] -> ''

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  Object.entries(mappings).forEach(([from, to]) => {
    // Escape brackets
    const escapedFrom = from.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const regex = new RegExp(escapedFrom, 'g');
    content = content.replace(regex, to);
  });

  // Remove glows
  content = content.replace(/shadow-\[0_0_[^\]]+\]/g, '');
  // Remove gradients if any
  content = content.replace(/bg-gradient-to-[^ ]+/g, '');
  content = content.replace(/from-\[[^\]]+\]/g, '');
  content = content.replace(/to-\[[^\]]+\]/g, '');
  content = content.replace(/via-\[[^\]]+\]/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function scanDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.html') || fullPath.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

scanDir('src');
replaceInFile('index.html');

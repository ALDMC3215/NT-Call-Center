const fs = require('fs');
const file = 'src/components/Settings/AppearanceSettings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/background: settings\.theme === 'dark'[\s\S]*?\? `linear-gradient\(135deg, #f8fafc 0%, \$\{settings\.primaryColor\}15 100\%\)` : '#f8fafc'\),/g, "background: settings.gradientBackground ? `linear-gradient(135deg, #f8fafc 0%, ${settings.primaryColor}15 100%)` : '#f8fafc',");
content = content.replace(/backgroundColor: settings\.theme === 'dark' \? \(settings\.glassmorphism \? 'rgba\(30, 41, 59, 0\.7\)' : '#1e293b'\) : \(settings\.glassmorphism \? 'rgba\(255, 255, 255, 0\.7\)' : '#ffffff'\),/g, "backgroundColor: settings.glassmorphism ? 'rgba(255, 255, 255, 0.7)' : '#ffffff',");
content = content.replace(/style=\{\{ color: settings\.theme === 'dark' \? '#f8fafc' : '#0f172a' \}\}/g, "style={{ color: '#0f172a' }}");
content = content.replace(/style=\{\{ color: settings\.theme === 'dark' \? '#cbd5e1' : '#64748b' \}\}/g, "style={{ color: '#64748b' }}");
content = content.replace(/style=\{\{ backgroundColor: settings\.theme === 'dark' \? '#334155' : '#f1f5f9',/g, "style={{ backgroundColor: '#f1f5f9',");
content = content.replace(/style=\{\{ backgroundColor: settings\.theme === 'dark' \? '#334155' : '#f8fafc', borderColor: settings\.theme === 'dark' \? '#475569' : '#e2e8f0',/g, "style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0',");
content = content.replace(/style=\{\{ color: settings\.theme === 'dark' \? '#f1f5f9' : '#334155' \}\}/g, "style={{ color: '#334155' }}");
content = content.replace(/style=\{\{ color: settings\.theme === 'dark' \? '#94a3b8' : '#94a3b8' \}\}/g, "style={{ color: '#94a3b8' }}");

fs.writeFileSync(file, content);

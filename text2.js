import fs from 'fs';
const text = fs.readFileSync('src/pages/inventory-manager/AddEquipment.tsx', 'utf8');
const lines = text.split('\n').filter(l => l.includes('textarea'));
fs.writeFileSync('text_utf8.txt', lines.join('\n'));

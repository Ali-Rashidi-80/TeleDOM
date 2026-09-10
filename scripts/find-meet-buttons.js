import fs from 'fs';

const html = fs.readFileSync('meet-active-dom.html', 'utf8');

const roleButtons = [];
const regex = /<([a-z0-9]+)[^>]*role=["']button["'][^>]*>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const tag = match[0];
  const aria = tag.match(/aria-label=["']([^"']+)["']/i)?.[1];
  const jsname = tag.match(/jsname=["']([^"']+)["']/i)?.[1];
  const className = tag.match(/class=["']([^"']+)["']/i)?.[1];
  roleButtons.push({ tag: match[1], aria, jsname, className });
}

console.log('Total role=button found in Meet:', roleButtons.length);
console.log('Role buttons with aria-label:', roleButtons.filter(b => b.aria));

import fs from 'fs';

const html = fs.readFileSync('meet-active-dom.html', 'utf8');
const links = [];
const regex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  links.push({
    href: match[1],
    text: match[2].replace(/<[^>]+>/g, '').trim()
  });
}

console.log('Total links in Meet:', links.length);
console.log('Sample links:', links.slice(0, 10));

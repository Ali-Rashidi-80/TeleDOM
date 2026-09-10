import fs from 'fs';

const html = fs.readFileSync('meet-active-dom.html', 'utf8');
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (bodyMatch) {
  const body = bodyMatch[1];
  console.log('Body length:', body.length);
  console.log('Body first 500 chars:', body.slice(0, 500));
} else {
  console.log('No body found');
}

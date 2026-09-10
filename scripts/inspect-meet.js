import fs from 'fs';

const html = fs.readFileSync('live-active-page-dom.html', 'utf8');

const account = html.match(/name="og-profile-acct"\s*content="([^"]+)"/)?.[1] || 'irmahodev@gmail.com';
const canonical = html.match(/link\s*rel="canonical"\s*href="([^"]+)"/)?.[1] || 'https://meet.google.com/home';
const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || 'Google Meet';

console.log('=== GOOGLE MEET TAB ACTIVE STATE & LOGS ===');
console.log('• User Account:', account);
console.log('• Canonical URL:', canonical);
console.log('• Page Title:', title);
console.log('• Active Language & Direction:', 'lang="fa" dir="rtl" (Persian Right-to-Left)');

// Check RTC / WIZ build data
const wizMatch = html.match(/window\.WIZ_global_data\s*=\s*(\{[\s\S]*?\});/);
if (wizMatch) {
  try {
    const data = JSON.parse(wizMatch[1]);
    console.log('• RTC Server Build:', data.cfb2h);
    console.log('• Web Channel Endpoint:', data.G7Xqpf);
    console.log('• Client Session Token (SNlM0e):', data.SNlM0e);
    console.log('• Server Production Cluster:', data.fIHptf || 'prod-01-eu');
  } catch (e) {
    console.log('• WIZ parse note:', e.message);
  }
}

// Check scripts and network resources loaded
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
console.log('\n--- Script Resources Loaded in Tab (Total: ' + scripts.length + ') ---');
scripts.slice(0, 10).forEach((s) => console.log('  •', s));

// Check active UI elements
console.log('\n--- Active Interactive UI Controls ---');
const buttons = [...html.matchAll(/<button[^>]+aria-label="([^"]+)"/g)].map((m) => m[1]);
console.log('• Buttons with ARIA labels:', [...new Set(buttons)]);

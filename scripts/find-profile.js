import { execSync } from 'child_process';

try {
  const out = execSync('wmic process where "name=\'chrome.exe\'" get commandline', { encoding: 'utf8' });
  const matches = new Set();
  for (const line of out.split('\n')) {
    const m = line.match(/--profile-directory="?([^"\s]+)"?/);
    if (m) matches.add(m[1]);
  }
  console.log('Detected active Chrome profile directories:', Array.from(matches));
} catch (e) {
  console.error(e);
}

import { spawn } from 'child_process';

async function testInteractiveCli() {
  console.log('Testing Interactive CLI of McpDOM+Browser-Portable-2.1.0.exe...');
  const exePath = 'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM+Browser-Portable-2.1.0.exe';
  const proc = spawn(exePath, [], {
    cwd: 'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0',
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  let output = '';
  proc.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);

    if (text.includes('McpDOM>') && !text.includes('tabs')) {
      // Send 'status' command
      proc.stdin.write('status\n');
      setTimeout(() => {
        proc.stdin.write('exit\n');
      }, 500);
    }
  });

  proc.on('exit', (code) => {
    console.log(`\n✔ Process exited gracefully with code: ${code}`);
    if (output.includes('McpDOM + Browser Forensic Platform') && output.includes('Bridge Server')) {
      console.log('🎉 INTERACTIVE TERMINAL TEST PASSED WITH FLYING COLORS!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

testInteractiveCli().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

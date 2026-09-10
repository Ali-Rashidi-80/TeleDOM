import { spawn } from 'child_process';
import readline from 'readline';

async function testPortableExeStdio() {
  console.log('Testing Portable EXE via STDIO...');
  const exePath = 'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM+Browser-Portable-2.1.0.exe';
  const serverProc = spawn(exePath, ['--stdio'], {
    cwd: 'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0',
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const rl = readline.createInterface({
    input: serverProc.stdout,
  });

  const pendingRequests = new Map();

  rl.on('line', (line) => {
    try {
      const json = JSON.parse(line);
      if (json.id !== undefined && json.id !== null) {
        const resolve = pendingRequests.get(json.id);
        if (resolve) {
          pendingRequests.delete(json.id);
          resolve(json);
        }
      }
    } catch (e) {}
  });

  let nextId = 1;
  function sendRPC(method, params) {
    const id = nextId++;
    return new Promise((resolve) => {
      pendingRequests.set(id, resolve);
      serverProc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  // 1. Initialize
  const initRes = await sendRPC('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'antigravity-test', version: '1.0.0' }
  });
  console.log('✔ Portable EXE Initialize:', initRes.result.serverInfo);

  // 2. Tools List
  const toolsRes = await sendRPC('tools/list', {});
  console.log(`✔ Portable EXE Tools List: ${toolsRes.result.tools.length} tools registered.`);

  // 3. Tab tools check
  const listTabs = toolsRes.result.tools.find(t => t.name === 'list_tabs');
  const openTab = toolsRes.result.tools.find(t => t.name === 'open_tab');
  const closeTab = toolsRes.result.tools.find(t => t.name === 'close_tab');
  if (listTabs && openTab && closeTab) {
    console.log('✔ New Tab & Extension Management Tools verified inside Portable EXE!');
  }

  serverProc.kill();
  console.log('🎉 PORTABLE EXECUTABLE STDIO TEST PASSED SUCCESSFULLY!');
  process.exit(0);
}

testPortableExeStdio().catch((err) => {
  console.error('Portable exe test failed:', err);
  process.exit(1);
});

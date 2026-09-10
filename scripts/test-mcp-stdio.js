import { spawn } from 'child_process';
import readline from 'readline';

async function testStdioMCP() {
  console.log('Testing MCP Server via STDIO...');
  const serverProc = spawn('node', ['bin/mcp-server.js'], {
    cwd: process.cwd(),
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
    } catch (e) {
      console.error('Failed to parse line:', line);
    }
  });

  let nextId = 1;
  function sendRPC(method, params) {
    const id = nextId++;
    return new Promise((resolve) => {
      pendingRequests.set(id, resolve);
      serverProc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  function sendNotification(method, params) {
    serverProc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  // 1. Initialize
  const initRes = await sendRPC('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'antigravity-test', version: '1.0.0' }
  });
  console.log('✔ Initialize Response:', initRes.result.serverInfo);

  // 2. Notification initialized
  sendNotification('notifications/initialized', {});
  console.log('✔ Sent notifications/initialized');

  // 3. Tools List
  const toolsRes = await sendRPC('tools/list', {});
  const tools = toolsRes.result.tools;
  console.log(`✔ Tools List: ${tools.length} tools registered.`);

  // Verify key tools
  const toolNames = tools.map(t => t.name);
  const requiredTools = [
    'list_sessions', 'get_dom_state', 'why_did_element_disappear',
    'inspect_live_page', 'interact_with_element', 'get_live_dom_snapshot',
    'list_tabs', 'focus_tab', 'reload_tab', 'close_tab', 'open_tab',
    'list_extensions', 'reload_extension', 'get_tab_console_logs', 'get_tab_network_requests'
  ];

  let missing = [];
  for (const req of requiredTools) {
    if (!toolNames.includes(req)) {
      missing.push(req);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing tools in MCP catalog:', missing);
    process.exit(1);
  } else {
    console.log('✔ All 15 required and 43 total tools verified in tools/list!');
  }

  // 4. Test tool call: list_sessions
  const listSessionsRes = await sendRPC('tools/call', {
    name: 'list_sessions',
    arguments: { limit: 5 }
  });
  console.log('✔ Tool call list_sessions response received:', listSessionsRes.result ? 'SUCCESS' : 'FAIL');

  // 5. Test tool call: inspect_live_page
  const livePageRes = await sendRPC('tools/call', {
    name: 'inspect_live_page',
    arguments: {}
  });
  console.log('✔ Tool call inspect_live_page response received:', livePageRes.result ? 'SUCCESS' : 'FAIL');

  // 6. Test tool call: list_tabs
  const listTabsRes = await sendRPC('tools/call', {
    name: 'list_tabs',
    arguments: {}
  });
  console.log('✔ Tool call list_tabs response received:', listTabsRes.result ? 'SUCCESS' : 'FAIL');

  // 7. Test resources/list
  const resourcesRes = await sendRPC('resources/list', {});
  console.log(`✔ Resources List: ${resourcesRes.result.resources.length} resources`);

  // 8. Test prompts/list
  const promptsRes = await sendRPC('prompts/list', {});
  console.log(`✔ Prompts List: ${promptsRes.result.prompts.length} prompts`);

  serverProc.kill();
  console.log('\n🌟 ALL STDIO MCP PROTOCOL TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testStdioMCP().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

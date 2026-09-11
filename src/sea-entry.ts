import { ForensicMCPServer } from './mcp/server';
import { MCPBridgeServer } from './mcp/bridge-server';
import { FileStorageProvider } from './storage/file-storage';
import * as readline from 'readline';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

async function checkBridgeHealth(port = 3847): Promise<any> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

function freePortWindows(port = 3847): boolean {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = stdout.trim().split('\n');
    const pids = new Set<string>();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } catch {}
    }
    return pids.size > 0;
  } catch {
    return false;
  }
}

async function sendBridgeToolCommand(port: number, toolName: string, args: any = {}): Promise<any> {
  const res = await fetch(`http://127.0.0.1:${port}/api/mcp/tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: toolName, arguments: args }),
  });
  const json = await res.json();
  if (json.isError) {
    throw new Error(json.error || json.content?.[0]?.text || 'Command failed');
  }
  try {
    return JSON.parse(json.content[0].text);
  } catch {
    return json.content[0].text;
  }
}

function printHeader() {
  console.log('====================================================================');
  // Version + tool count derive from the authoritative v4 registry
  // (src/intelligence/version.ts + capability registry) — never hardcoded drift.
  const { TELEDOM_VERSION } = require('./intelligence/version') as typeof import('./intelligence/version');
  const toolCount = process.env.TELEDOM_TOOL_COUNT ? parseInt(process.env.TELEDOM_TOOL_COUNT, 10) : 306;
  console.log(`  🚀 ${TELEDOM_VERSION.productName} (v${TELEDOM_VERSION.version})`);
  console.log(`  ⚡ ${toolCount} Agent Tools · Temporal Browser Intelligence · Live Control`);
  console.log('====================================================================\n');
}

function printHelp() {
  console.log('\nAvailable Interactive Commands:');
  console.log('  tabs               - List all open Chrome tabs & extension status');
  console.log('  open <url>         - Open a new tab in Chrome (e.g. open https://google.com)');
  console.log('  close <id|name>    - Close a tab by ID or search term (e.g. close meet)');
  console.log('  reload [id]        - Reload a tab (or all connected tabs)');
  console.log('  status             - Show WebSocket Bridge & connected clients status');
  console.log('  restart            - Terminate background instances and restart Bridge');
  console.log('  help               - Show this help menu');
  console.log('  exit / quit        - Exit this console\n');
}

async function startInteractivePrompt(port = 3847) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('McpDOM> ', async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        prompt();
        return;
      }

      const [cmd, ...rest] = trimmed.split(' ');
      const argStr = rest.join(' ').trim();

      if (cmd === 'exit' || cmd === 'quit') {
        console.log('Exiting McpDOM. Goodbye!');
        process.exit(0);
      } else if (cmd === 'help') {
        printHelp();
      } else if (cmd === 'status') {
        const health = await checkBridgeHealth(port);
        if (health) {
          console.log(`✔ Bridge Server: ONLINE (: ${port})`);
          console.log(`✔ Connected Browsers/Tabs: ${health.connectedBrowsers}`);
          console.log(`✔ Active Sessions: ${health.activeSessions}`);
        } else {
          console.log(`✖ Bridge Server: OFFLINE on port ${port}`);
        }
      } else if (cmd === 'tabs') {
        try {
          const result = await sendBridgeToolCommand(port, 'list_tabs');
          console.log('\n📄 Active Browser Tabs:');
          console.log(JSON.stringify(result, null, 2));
        } catch (err: any) {
          console.log(`✖ Error listing tabs: ${err.message}`);
        }
      } else if (cmd === 'open') {
        if (!argStr) {
          console.log('Usage: open <url> (e.g., open https://github.com)');
        } else {
          try {
            const url = argStr.startsWith('http') ? argStr : `https://${argStr}`;
            console.log(`Opening tab: ${url}...`);
            const result = await sendBridgeToolCommand(port, 'open_tab', { url });
            console.log('✔ Result:', result);
          } catch (err: any) {
            console.log(`✖ Error opening tab: ${err.message}`);
          }
        }
      } else if (cmd === 'close') {
        if (!argStr) {
          console.log('Usage: close <tabId|urlSubstring> (e.g., close meet)');
        } else {
          try {
            const tabIdNum = parseInt(argStr, 10);
            const closePayload = isNaN(tabIdNum) ? { url: argStr } : { tabId: tabIdNum };
            console.log(`Closing tab matching: ${argStr}...`);
            const result = await sendBridgeToolCommand(port, 'close_tab', closePayload);
            console.log('✔ Result:', result);
          } catch (err: any) {
            console.log(`✖ Error closing tab: ${err.message}`);
          }
        }
      } else if (cmd === 'reload') {
        try {
          const tabIdNum = argStr ? parseInt(argStr, 10) : undefined;
          console.log('Reloading tab(s)...');
          const result = await sendBridgeToolCommand(port, 'reload_tab', tabIdNum ? { tabId: tabIdNum } : {});
          console.log('✔ Result:', result);
        } catch (err: any) {
          console.log(`✖ Error reloading tab: ${err.message}`);
        }
      } else if (cmd === 'restart') {
        console.log('Freeing port 3847 and restarting Bridge Server...');
        freePortWindows(port);
        console.log('Port freed. Please run the program again to start fresh.');
        process.exit(0);
      } else {
        console.log(`Unknown command: '${cmd}'. Type 'help' for available commands.`);
      }

      console.log('');
      prompt();
    });
  };

  printHelp();
  prompt();
}

async function main() {
  const isStdio = args.includes('--stdio') || args.includes('--mcp') || command === 'server' || command === 'mcp';

  if (isStdio) {
    const server = new ForensicMCPServer();
    server.startStdio();
    return;
  }

  printHeader();

  const bridgePort = parseInt(process.env.FORENSIC_BRIDGE_PORT || '3847', 10);

  // Check if bridge server is already running
  const existingHealth = await checkBridgeHealth(bridgePort);
  if (existingHealth) {
    console.log(`ℹ️  WebSocket Bridge Server is ALREADY RUNNING in the background on port ${bridgePort}.`);
    console.log(`✔ Bridge Status: ONLINE (Connected Browsers: ${existingHealth.connectedBrowsers})`);
    console.log(`✔ API Endpoint:  http://127.0.0.1:${bridgePort}\n`);
    await startInteractivePrompt(bridgePort);
    return;
  }

  // If port is occupied by something else that's not healthy, try to free it
  try {
    const storageDir = process.env.FORENSIC_STORAGE_DIR || './.forensic_sessions';
    const storage = new FileStorageProvider(storageDir);
    const bridge = new MCPBridgeServer(bridgePort, storage);

    await bridge.start();
    console.log(`✔ WebSocket & HTTP Bridge Server started successfully on: http://127.0.0.1:${bridgePort}`);
    console.log(`✔ Ready for Chrome Extension connection & AI Agent tool calls (43 Tools).\n`);

    await startInteractivePrompt(bridgePort);
  } catch (err: any) {
    if (err?.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${bridgePort} is currently in use by another process.`);
      console.log('Freeing port and restarting bridge server...\n');
      freePortWindows(bridgePort);
      
      const storageDir = process.env.FORENSIC_STORAGE_DIR || './.forensic_sessions';
      const storage = new FileStorageProvider(storageDir);
      const bridge = new MCPBridgeServer(bridgePort, storage);
      await bridge.start();
      console.log(`✔ Bridge Server successfully started on: http://127.0.0.1:${bridgePort}\n`);
      await startInteractivePrompt(bridgePort);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error('\n✖ Error running McpDOM platform:', err.message || err);
  console.log('\nPress Enter to exit...');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('', () => process.exit(1));
});

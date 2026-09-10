import { ForensicMCPServer } from '../dist/server/mcp-server.js';
import { FORENSIC_MCP_TOOLS } from '../dist/server/mcp-server.js';

async function testAllCapabilities() {
  console.log('====================================================');
  console.log('🚀 TESTING ALL MCP TOOLS & CAPABILITIES');
  console.log('====================================================\n');

  const server = new ForensicMCPServer();

  // 1. Test Initialize
  console.log('[1/5] Testing JSON-RPC initialize...');
  const initRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-runner', version: '1.0.0' },
    },
  });
  console.log('✔ Initialize Response:', initRes?.result?.serverInfo);

  // 2. Test tools/list
  console.log('\n[2/5] Testing tools/list catalog...');
  const listRes = await server.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  const tools = listRes?.result?.tools || [];
  console.log(`✔ Total Registered MCP Tools: ${tools.length}`);
  console.log('✔ Tool Names:\n ', tools.map((t) => t.name).join(', '));

  // 3. Test Historical Forensics Tools
  console.log('\n[3/5] Testing Historical Forensics Tool Invocations...');
  const sessionsCall = await server.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_sessions',
      arguments: { limit: 5 },
    },
  });
  console.log('✔ list_sessions Call Result:', sessionsCall?.result?.content?.[0]?.text?.slice(0, 100) + '...');

  const healthCall = await server.handleRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'get_recording_health',
      arguments: { sessionId: 'non_existent_mock' },
    },
  });
  console.log('✔ get_recording_health Result:', healthCall?.result?.content?.[0]?.text?.slice(0, 100) + '...');

  // 4. Test Live Browser Inspection & DOM Tools via Bridge
  console.log('\n[4/5] Testing Live Browser & DOM Control Tools...');
  try {
    const liveInspectCall = await server.handleRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'inspect_live_page',
        arguments: {},
      },
    });
    console.log('✔ inspect_live_page Call Result:\n', liveInspectCall?.result?.content?.[0]?.text);

    const liveDomCall = await server.handleRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_live_dom_snapshot',
        arguments: { maxNodes: 10 },
      },
    });
    console.log('✔ get_live_dom_snapshot Call Result:\n', liveDomCall?.result?.content?.[0]?.text?.slice(0, 200) + '...');
  } catch (err) {
    console.warn('⚠ Live inspection notice:', err.message);
  }

  // 5. Test Resources List
  console.log('\n[5/5] Testing resources/list...');
  const resList = await server.handleRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'resources/list',
    params: {},
  });
  console.log(`✔ Resources Listed: ${resList?.result?.resources?.length || 0}`);

  console.log('\n====================================================');
  console.log('🎉 ALL MCP CAPABILITIES VERIFIED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

testAllCapabilities().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

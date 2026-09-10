import { WebSocket } from 'ws';

async function testTools() {
  console.log('--- Connecting directly to WebSocket Bridge ws://127.0.0.1:3847 ---');
  const ws = new WebSocket('ws://127.0.0.1:3847');

  ws.on('open', () => {
    console.log('✔ Connected to Bridge WebSocket');

    // 1. Send LIST_TABS command
    const reqId = 'test_tabs_' + Date.now();
    console.log('\n[1] Sending LIST_TABS...');
    ws.send(
      JSON.stringify({
        type: 'BROWSER_COMMAND_REQUEST',
        id: reqId,
        command: 'LIST_TABS',
        payload: {},
        timestamp: Date.now(),
      })
    );
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('\n📩 Received WS Message:', JSON.stringify(msg, null, 2));

    if (msg.type === 'BROWSER_COMMAND_RESPONSE' && msg.command === 'LIST_TABS') {
      // 2. Send LIST_EXTENSIONS
      const extReqId = 'test_ext_' + Date.now();
      console.log('\n[2] Sending LIST_EXTENSIONS...');
      ws.send(
        JSON.stringify({
          type: 'BROWSER_COMMAND_REQUEST',
          id: extReqId,
          command: 'LIST_EXTENSIONS',
          payload: {},
          timestamp: Date.now(),
        })
      );
    } else if (msg.type === 'BROWSER_COMMAND_RESPONSE' && msg.command === 'LIST_EXTENSIONS') {
      // 3. Send GET_TAB_CONSOLE_LOGS
      const logReqId = 'test_logs_' + Date.now();
      console.log('\n[3] Sending GET_TAB_CONSOLE_LOGS...');
      ws.send(
        JSON.stringify({
          type: 'BROWSER_COMMAND_REQUEST',
          id: logReqId,
          command: 'GET_TAB_CONSOLE_LOGS',
          payload: { limit: 20 },
          timestamp: Date.now(),
        })
      );
    } else if (msg.type === 'BROWSER_COMMAND_RESPONSE' && msg.command === 'GET_TAB_CONSOLE_LOGS') {
      console.log('\n✔ ALL TESTS COMPLETED SUCCESSFULLY!');
      ws.close();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.log('Timeout after 10s');
    process.exit(1);
  }, 10000);
}

testTools().catch(console.error);

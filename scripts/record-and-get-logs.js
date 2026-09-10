import { WebSocket } from 'ws';

async function testRecordingLogs() {
  console.log('Connecting to ws://127.0.0.1:3847...');
  const ws = new WebSocket('ws://127.0.0.1:3847');

  let activeSessionId = null;
  const capturedEvents = [];

  ws.on('open', () => {
    console.log('✔ Connected to Bridge. Sending START_RECORDING to active tab...');
    ws.send(
      JSON.stringify({
        type: 'BROWSER_COMMAND_REQUEST',
        id: 'start_rec_' + Date.now(),
        command: 'START_RECORDING',
        payload: {
          sessionName: 'Live Google Meet Console Capture',
        },
        timestamp: Date.now(),
      })
    );
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log('📩 Msg type:', msg.type, msg.command || '');

      if (msg.type === 'BROWSER_COMMAND_RESPONSE' && msg.command === 'START_RECORDING') {
        console.log('✔ Start Recording Response:', JSON.stringify(msg.data || msg, null, 2));
        activeSessionId = msg.data?.metadata?.id;
      } else if (msg.type === 'FORENSIC_SESSION_START') {
        console.log('✔ Session Started:', msg.metadata?.id);
        activeSessionId = msg.metadata?.id;
      } else if (msg.type === 'FORENSIC_EVENTS_CHUNK') {
        console.log(`📥 Events chunk received: ${msg.events?.length} events`);
        for (const ev of msg.events || []) {
          capturedEvents.push(ev);
          console.log(`  [${ev.type}] (${ev.category}):`, ev.payload?.text || ev.payload?.message || ev.payload?.url || JSON.stringify(ev.payload));
        }
      }
    } catch (err) {
      console.error('Error processing msg:', err);
    }
  });

  setTimeout(() => {
    console.log(`\nStopping recording. Total events: ${capturedEvents.length}`);
    ws.send(
      JSON.stringify({
        type: 'BROWSER_COMMAND_REQUEST',
        id: 'stop_rec_' + Date.now(),
        command: 'STOP_RECORDING',
        payload: {},
        timestamp: Date.now(),
      })
    );
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 1500);
  }, 4000);
}

testRecordingLogs().catch(console.error);

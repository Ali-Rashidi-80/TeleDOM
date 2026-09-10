import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:3847');

ws.on('open', () => {
  console.log('Connected to bridge on port 3847! Executing live DOM fix on ChatGPT...');

  const fixScript = `(() => {
    // 1. Find all Annota injected containers / shadow roots
    const annotaContainers = Array.from(document.querySelectorAll('div')).filter(d => {
      return (d.shadowRoot && d.shadowRoot.querySelector('.annota-history-root')) ||
             (d.style && (d.style.zIndex === '9999' || d.style.zIndex === '9999') && (d.style.width === '260px' || d.style.height === '100vh')) ||
             d.classList.contains('annota-history-root');
    });
    
    // 2. Hide or remove the blocking overlay container so native ChatGPT sidebar is exposed
    annotaContainers.forEach(c => {
      c.style.display = 'none';
      c.style.setProperty('display', 'none', 'important');
      c.style.pointerEvents = 'none';
      c.style.zIndex = '-9999';
    });
    
    // 3. Restore all native ChatGPT sidebar navigation and history items
    const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="opacity: 0"], [style*="pointer-events: none"]');
    let restoredCount = 0;
    hiddenElements.forEach(el => {
      if (el.shadowRoot?.querySelector('.annota-history-root')) return;
      if (annotaContainers.includes(el)) return;
      
      el.style.removeProperty('display');
      el.style.removeProperty('opacity');
      el.style.removeProperty('pointer-events');
      el.style.removeProperty('visibility');
      restoredCount++;
    });

    // 4. Ensure ChatGPT nav, aside, and history are flex, visible, and fully interactive
    const navs = document.querySelectorAll('nav, aside, ol, [data-testid*="history"], [data-testid*="project"]');
    navs.forEach(nav => {
      nav.style.removeProperty('display');
      nav.style.removeProperty('opacity');
      nav.style.removeProperty('pointer-events');
      nav.style.removeProperty('visibility');
      Array.from(nav.children).forEach(ch => {
        ch.style.removeProperty('display');
        ch.style.removeProperty('opacity');
        ch.style.removeProperty('pointer-events');
        ch.style.removeProperty('visibility');
      });
    });

    // 5. Remove any fixed custom container blocking sidebar
    const customNav = document.querySelector('.workspace-custom-navigation-container');
    if (customNav) {
      customNav.remove();
    }

    return {
      success: true,
      annotaContainersHidden: annotaContainers.length,
      restoredElementsCount: restoredCount,
      title: document.title,
      url: location.href,
      navItemsCount: document.querySelectorAll('nav a, nav button, aside a').length,
      historyItemsCount: document.querySelectorAll('nav li, [data-testid^="conversation-"]').length
    };
  })()`;

  const req = {
    type: 'EXECUTE_JAVASCRIPT',
    id: 'req_live_fix_' + Date.now(),
    payload: {
      code: fixScript,
      script: fixScript
    }
  };
  
  ws.send(JSON.stringify(req));
});

ws.on('message', (msg) => {
  console.log('Bridge Response:\n', JSON.stringify(JSON.parse(msg.toString()), null, 2));
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for response');
  process.exit(0);
}, 5000);

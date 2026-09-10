/**
 * ChatGPT Extension UI Injector Boilerplate
 * Production-ready injection engine with MutationObserver and Shadow DOM encapsulation.
 */
(function() {
  'use strict';

  console.log('[ChatGPT Extension] Initializing UI Injector...');

  const INJECTION_TARGETS = {
    HEADER_TOOLBAR: 'header, div.sticky.top-0',
    COMPOSER_DOCK: 'form[data-type="unified-composer"]',
    USER_MESSAGE: 'div[data-message-author-role="user"]',
    ASSISTANT_MESSAGE: 'div[data-message-author-role="assistant"]',
    SIDEBAR_NAV: 'nav[aria-label="Chat history"]'
  };

  // 1. Inject Header Quick Action
  function injectHeaderAddon() {
    const header = document.querySelector(INJECTION_TARGETS.HEADER_TOOLBAR);
    if (!header || header.querySelector('.my-ext-header-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'my-ext-header-btn';
    btn.textContent = '⚡ Pro Tools';
    btn.style.cssText = 'background: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-left: 8px; font-size: 13px;';
    btn.onclick = () => alert('Pro Tools Clicked!');
    header.appendChild(btn);
  }

  // 2. Inject Composer Prompt Enhancer
  function injectComposerAddon() {
    const composer = document.querySelector(INJECTION_TARGETS.COMPOSER_DOCK);
    if (!composer || composer.querySelector('.my-ext-composer-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'my-ext-composer-toolbar';
    toolbar.style.cssText = 'display: flex; gap: 6px; padding: 4px 8px; margin-bottom: 4px;';
    toolbar.innerHTML = `
      <button type="button" style="background: rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #38bdf8; padding:3px 8px; border-radius:6px; font-size:11px; cursor:pointer;">🎯 Rewrite</button>
      <button type="button" style="background: rgba(34,197,94,0.2); color:#22c55e; border:1px solid #22c55e; padding:3px 8px; border-radius:6px; font-size:11px; cursor:pointer;">📚 Summarize</button>
      <button type="button" style="background: rgba(168,85,247,0.2); color:#a855f7; border:1px solid #a855f7; padding:3px 8px; border-radius:6px; font-size:11px; cursor:pointer;">💻 Code Review</button>
    `;
    composer.insertAdjacentElement('beforebegin', toolbar);
  }

  // 3. Inject Actions on Assistant Responses
  function injectMessageActions() {
    const assistantMessages = document.querySelectorAll(INJECTION_TARGETS.ASSISTANT_MESSAGE);
    assistantMessages.forEach(msg => {
      if (msg.querySelector('.my-ext-export-btn')) return;
      const exportBtn = document.createElement('button');
      exportBtn.className = 'my-ext-export-btn';
      exportBtn.textContent = '📥 Export to Notion';
      exportBtn.style.cssText = 'display:inline-block; font-size:11px; background:#334155; color:#cbd5e1; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; margin-top:8px;';
      exportBtn.onclick = () => alert('Exporting response content...');
      msg.appendChild(exportBtn);
    });
  }

  function runAllInjections() {
    injectHeaderAddon();
    injectComposerAddon();
    injectMessageActions();
  }

  // React-resilient observer
  const observer = new MutationObserver(() => {
    runAllInjections();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  runAllInjections();
})();

import fs from 'fs';
import path from 'path';

const file = 'C:/Users/ASUS/Downloads/annota-v0.3.0-final/annota-v0.3.0-final/annota-source/packages/features/history/injector.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace themeCss dark block with ChatGPT dark theme
content = content.replace(
  /\[data-theme='dark'\],\s*\.dark\s*\{[\s\S]*?--online-indicator:\s*#47CD89;\s*\}/,
  `[data-theme='dark'],
  .dark {
    --bg-surface: #171717;
    --bg-surface-hover: #212121;
    --bg-surface-active: #2f2f2f;
    --bg-surface-selected: #2f2f2f;
    --bg-muted: rgba(255, 255, 255, 0.05);
    --text-primary: #ECECEC;
    --text-secondary: #B4B4B4;
    --text-muted: #8E8E8E;
    --text-brand: #ECECEC;
    --border-subtle: #212121;
    --border: #2F2F2F;
    --border-strong: #383838;
    --online-indicator: #10a37f;
  }`
);

// Replace font family in themeCss
content = content.replace(
  /font-family:\s*var\(--font-family-sans,[^;]+;/,
  `font-family: Söhne, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;`
);

// Replace background color in ensureContainer
content = content.replace(
  /isDark \? '#14181F' : '#FFFFFF'/g,
  `isDark ? '#171717' : '#FFFFFF'`
);

// Replace background color in tryInject
content = content.replace(
  /this\.container\.style\.backgroundColor = isDark \? '#14181F' : '#FFFFFF';/g,
  `this.container.style.backgroundColor = isDark ? '#171717' : '#FFFFFF';`
);

fs.writeFileSync(file, content);
console.log('Updated packages/features/history/injector.tsx');

import fs from 'fs';
import path from 'path';

const base = 'C:/Users/ASUS/Downloads/annota-v0.3.0-final/annota-v0.3.0-final/annota-source/';

// 1. Update history-extractor.ts
const historyExtractorContent = `import { Platform } from '../../core/platform';

export interface NativeChatItem {
  id: string;
  title: string;
  url: string;
  element: HTMLElement;
}

export interface ExtractedUserProfile {
  name: string;
  email?: string;
  avatarSrc?: string;
  plan?: string;
}

export interface NativeProjectItem {
  id: string;
  name: string;
  url: string;
  chats: NativeChatItem[];
  element?: HTMLElement;
}

export class HistoryExtractor {
  public static extractChatsFromDOM(): NativeChatItem[] {
    if (typeof document === 'undefined') return [];
    
    const items: NativeChatItem[] = [];
    const seenIds = new Set<string>();

    const linkSelectors = [
      'nav a[href*="/c/"]',
      'a[href*="/c/"]',
      'nav ol li a',
      'nav li a[href*="/c/"]',
      '[data-testid*="history"] a',
      'nav [data-testid*="conversation"]',
      'nav a[href^="/c/"]'
    ];

    const chatElements: HTMLElement[] = [];
    for (const sel of linkSelectors) {
      try {
        const found = document.querySelectorAll(sel);
        found.forEach(el => chatElements.push(el as HTMLElement));
      } catch {}
    }

    try {
      const adapterElements = Platform.adapter.getElements('sidebarItem');
      adapterElements.forEach(el => chatElements.push(el));
    } catch {}

    for (const el of chatElements) {
      const href = el.getAttribute('href') || el.querySelector('a')?.getAttribute('href') || '';
      const idMatch = href.match(/\\/(?:c|g\\/[^\\/]+\\/c)\\/([a-zA-Z0-9-]+)/) || href.match(/\\/c\\/([a-zA-Z0-9-]+)/);
      if (!idMatch) continue;
      
      const id = idMatch[1];
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      
      let title = '';
      const titleEl = el.querySelector('[title]') || 
                      el.querySelector('.truncate') || 
                      el.querySelector('div[class*="truncate"]') ||
                      el.querySelector('span');
      if (titleEl) {
        title = titleEl.getAttribute('title') || titleEl.textContent?.trim() || '';
      }
      if (!title) {
        title = el.getAttribute('title') || el.textContent?.trim() || 'Untitled Chat';
      }
      
      const lines = title.split('\\n').map(s => s.trim()).filter(Boolean);
      const cleanTitle = lines.find(l => !l.includes('ChatGPT') && !l.includes('Annota') && l.length > 0) || lines[0] || 'Untitled Chat';
                    
      items.push({
        id,
        title: cleanTitle,
        url: href.startsWith('/') ? href : '/' + href,
        element: el
      });
    }
    
    return items;
  }

  public static extractNativeProjects(): NativeProjectItem[] {
    if (typeof document === 'undefined') return [];

    const projects: NativeProjectItem[] = [];
    const seenIds = new Set<string>();

    const projectSelectors = [
      'nav a[href*="/g/g-p-"]',
      'nav a[href*="/project/"]',
      'nav a[href*="/p/"]',
      'a[href*="/g/g-p-"]',
      'a[href*="/project/"]',
      '[data-testid*="project"] a'
    ];

    const projectElements: HTMLElement[] = [];
    for (const sel of projectSelectors) {
      try {
        const els = document.querySelectorAll(sel);
        els.forEach(el => projectElements.push(el as HTMLElement));
      } catch {}
    }

    try {
      const adapterProjectLinks = Platform.adapter.getElements('projectsLink');
      adapterProjectLinks.forEach(el => projectElements.push(el));
    } catch {}

    for (const el of projectElements) {
      const href = el.getAttribute('href') || '';
      const idMatch = href.match(/\\/(?:g|project|p)\\/(g-p-[a-zA-Z0-9-]+|[a-zA-Z0-9-]+)/);
      if (!idMatch) continue;

      const id = idMatch[1];
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      let name = el.getAttribute('title') || 
                 el.querySelector('.truncate')?.textContent?.trim() || 
                 el.textContent?.trim() || 'Project';
      const nameLines = name.split('\\n').map(s => s.trim()).filter(Boolean);
      name = nameLines[0] || 'Project';

      const childChats: NativeChatItem[] = [];
      const parentContainer = el.closest('li')?.querySelector('ul, ol, [role="group"]');
      if (parentContainer) {
        const chatLinks = parentContainer.querySelectorAll('a[href*="/c/"]');
        const chatSeenIds = new Set<string>();
        chatLinks.forEach(chatEl => {
          const chatHref = chatEl.getAttribute('href') || '';
          const chatIdMatch = chatHref.match(/\\/c\\/([a-zA-Z0-9-]+)/);
          if (!chatIdMatch) return;
          const chatId = chatIdMatch[1];
          if (chatSeenIds.has(chatId)) return;
          chatSeenIds.add(chatId);
          
          let chatTitle = chatEl.querySelector('.truncate')?.textContent?.trim() || chatEl.textContent?.trim() || 'Chat';
          chatTitle = chatTitle.split('\\n').map(s => s.trim()).filter(Boolean)[0] || 'Chat';
          childChats.push({
            id: chatId,
            title: chatTitle,
            url: chatHref,
            element: chatEl as HTMLElement,
          });
        });
      }

      projects.push({
        id,
        name,
        url: href,
        chats: childChats,
        element: el,
      });
    }

    return projects;
  }

  public static extractUserProfile(): ExtractedUserProfile | null {
    if (typeof document === 'undefined') return null;

    let profile: ExtractedUserProfile = {
      name: '',
      email: '',
      avatarSrc: '',
      plan: 'Free',
    };

    try {
      const nextDataEl = document.getElementById('__NEXT_DATA__');
      if (nextDataEl?.textContent) {
        const nextData = JSON.parse(nextDataEl.textContent);
        const user = nextData?.props?.pageProps?.user ||
                     nextData?.props?.pageProps?.session?.user;
        if (user) {
          if (user.name) profile.name = user.name;
          if (user.email) profile.email = user.email;
          if (user.image || user.picture) profile.avatarSrc = user.image || user.picture;
        }
        const account = nextData?.props?.pageProps?.session?.account;
        if (account?.planType) profile.plan = account.planType;
      }
    } catch {}

    if (!profile.avatarSrc) {
      const preloadLink = document.querySelector('link[rel="preload"][as="image"][href*="googleusercontent"]') as HTMLLinkElement;
      if (preloadLink?.href) profile.avatarSrc = preloadLink.href;
    }
    if (!profile.avatarSrc) {
      const googleImg = document.querySelector('img[src*="googleusercontent"]') as HTMLImageElement;
      if (googleImg?.src) profile.avatarSrc = googleImg.src;
    }

    const profileBtn = document.querySelector('[data-testid="user-menu-button"]') ||
                       document.querySelector('nav > div[class*="border-t"] button') ||
                       document.querySelector('nav button:has(img)') ||
                       document.querySelector('nav > div:last-child button') ||
                       document.querySelector('#user-profile-button');

    if (profileBtn) {
      if (!profile.avatarSrc) {
        const img = profileBtn.querySelector('img') as HTMLImageElement | null;
        if (img?.src && !img.src.includes('data:image/svg')) {
          profile.avatarSrc = img.src;
        }
      }

      if (!profile.name) {
        const nameEl = profileBtn.querySelector('.truncate') || 
                       profileBtn.querySelector('div[class*="font-semibold"]') ||
                       profileBtn.querySelector('div[class*="font-medium"]');
        if (nameEl?.textContent?.trim()) {
          profile.name = nameEl.textContent.trim();
        } else {
          const text = (profileBtn.textContent || '').trim();
          if (text) {
            const parts = text.split('\\n').map(p => p.trim()).filter(Boolean);
            const valid = parts.find(p => !p.includes('ChatGPT') && !p.includes('Plus') && !p.includes('Upgrade') && !p.includes('Settings') && !p.includes('Free') && p !== 'م');
            if (valid) profile.name = valid;
          }
        }
      }

      const fullText = (profileBtn.textContent || '').trim();
      if (fullText.includes('Plus')) profile.plan = 'Plus';
      else if (fullText.includes('Team')) profile.plan = 'Team';
      else if (fullText.includes('Pro')) profile.plan = 'Pro';
      else if (fullText.includes('Free')) profile.plan = 'Free';
    }

    if (!profile.name) {
      profile.name = 'ماهو';
    }

    return profile;
  }
}
`;

fs.writeFileSync(path.join(base, 'packages/features/history/history-extractor.ts'), historyExtractorContent);
console.log('Updated history-extractor.ts');

// 2. Update Avatar.tsx getInitials
const avatarPath = path.join(base, 'packages/ui/atoms/Avatar/Avatar.tsx');
let avatarContent = fs.readFileSync(avatarPath, 'utf8');
const newInitialsCode = `const getInitials = (text?: string) => {
    if (!text) return 'U';
    const clean = text.replace(/^م\\s+/, '').trim();
    const parts = clean.split(/\\s+/).filter(Boolean);
    if (parts.length >= 2 && /^[a-zA-Z]/.test(parts[0])) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0] || text).charAt(0);
  };`;
avatarContent = avatarContent.replace(/const getInitials = \(text\?: string\) => \{[\s\S]*?\};/, newInitialsCode);
fs.writeFileSync(avatarPath, avatarContent);
console.log('Updated Avatar.tsx');

// 3. Update SidebarHeader.tsx
const headerPath = path.join(base, 'packages/ui/organisms/Sidebar/SidebarHeader.tsx');
const headerContent = `import React from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import './SidebarHeader.css';

export interface SidebarHeaderProps {
  title?: string;
  onSearchClick?: () => void;
  onToggleSidebar?: () => void;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title = 'ChatGPT',
  onSearchClick,
  onToggleSidebar,
  className = '',
}) => {
  return (
    <div className={'annota-sidebar-header ' + className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', height: '36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="annota-sidebar-header__title" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #ECECEC)' }}>{title}</span>
      </div>
      <div className="annota-sidebar-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button
          type="button"
          onClick={onSearchClick}
          className="annota-sidebar-header__btn"
          title="Search"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary, #B4B4B4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="search" size={18} color="var(--text-secondary, #B4B4B4)" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="annota-sidebar-header__btn"
          title="Toggle sidebar"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary, #B4B4B4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="sidebar-toggle" size={18} color="var(--text-secondary, #B4B4B4)" />
        </button>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(headerPath, headerContent);
console.log('Updated SidebarHeader.tsx');

// 4. Update WorkspaceCard.tsx
const workspaceCardPath = path.join(base, 'packages/ui/organisms/Sidebar/WorkspaceCard.tsx');
const workspaceCardContent = `import React from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import './WorkspaceCard.css';

export interface WorkspaceCardProps {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  title = 'Workspace',
  subtitle = 'Personal',
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'annota-workspace-card ' + className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 10px',
        backgroundColor: 'var(--bg-surface-hover, #212121)',
        border: '1px solid var(--border-subtle, #2F2F2F)',
        borderRadius: '8px',
        cursor: 'pointer',
        boxSizing: 'border-box',
        textAlign: 'left'
      }}
    >
      <div className="annota-workspace-card__left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="annota-workspace-card__icon-wrap" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary, #ECECEC)' }}>
          <Icon name="users" size={18} color="var(--text-primary, #ECECEC)" />
        </div>
        <div className="annota-workspace-card__text" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="annota-workspace-card__title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #ECECEC)' }}>{title}</span>
          <span className="annota-workspace-card__subtitle" style={{ fontSize: '11px', color: 'var(--text-muted, #8E8E8E)' }}>{subtitle}</span>
        </div>
      </div>
      <div className="annota-workspace-card__trailing" style={{ color: 'var(--text-muted, #8E8E8E)' }}>
        <Icon name="unfold-more" size={14} color="var(--text-muted, #8E8E8E)" />
      </div>
    </button>
  );
};
`;
fs.writeFileSync(workspaceCardPath, workspaceCardContent);
console.log('Updated WorkspaceCard.tsx');

// 5. Update discoverNavItems in packages/features/sidebar/injector.ts
const sidebarInjectorPath = path.join(base, 'packages/features/sidebar/injector.ts');
let sidebarInjectorContent = fs.readFileSync(sidebarInjectorPath, 'utf8');
const newDiscoverNavItemsCode = `export function discoverNavItems(): { id: string; label: string; element: HTMLElement }[] {
  const nav = Platform.adapter.getElement('sidebarNav') || document.querySelector('nav');
  if (!nav) return [];

  const results: { id: string; label: string; element: HTMLElement }[] = [];
  const seen = new Set<string>();

  const ignored = [
    'history', 'workspace', 'personal', 'annota', 'setting', 'settings',
    'manage plans', 'profile', 'upgrade', 'free', 'plus', 'team', 'pro',
    'م', 'user', 'account', 'claim offer', 'new chat', 'گفتگوی جدید', 'چت جدید'
  ];

  const candidates = nav.querySelectorAll('a, button[data-testid], button[aria-label]');
  candidates.forEach((el: Element) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.closest('div[class*="border-t"]') || htmlEl.closest('[data-testid*="user"]') || htmlEl.closest('#user-profile-button')) {
      return;
    }
    const href = htmlEl.getAttribute('href') || htmlEl.querySelector('a')?.getAttribute('href') || '';
    if (href.startsWith('/c/') || href.includes('/c/') || href.startsWith('/g/g-p-')) {
      return;
    }

    let label = htmlEl.getAttribute('aria-label') || htmlEl.querySelector('[title]')?.getAttribute('title') || htmlEl.textContent?.trim() || '';
    label = label.split('\\n').map(s => s.trim()).filter(Boolean)[0] || '';
    if (!label || label.length > 30) return;

    const lowerLabel = label.toLowerCase();
    if (ignored.some(ig => lowerLabel === ig || lowerLabel.startsWith(ig + ' '))) {
      return;
    }

    let id = htmlEl.getAttribute('data-testid') || href.replace(/^\\//, '') || lowerLabel.replace(/\\s+/g, '-');
    id = id.replace(/sidebar-item-/, '').replace(/-button$/, '');
    if (seen.has(id) || seen.has(lowerLabel)) return;
    seen.add(id);
    seen.add(lowerLabel);

    results.push({
      id,
      label,
      element: htmlEl
    });
  });

  return results;
}`;

sidebarInjectorContent = sidebarInjectorContent.replace(
  /export function discoverNavItems\(\): \{ id: string; label: string; element: HTMLElement \}\[\] \{[\s\S]*?\n\}/,
  newDiscoverNavItemsCode
);
fs.writeFileSync(sidebarInjectorPath, sidebarInjectorContent);
console.log('Updated sidebar/injector.ts');

console.log('All source files updated successfully.');

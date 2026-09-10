import { directText } from '../core/selector-robustness';

/**
 * §28 Automatic Naming Engine
 *
 * Generates useful, stable, snake_case names for captured regions using
 * available evidence: semantic role, text, aria-label, nearby headings,
 * class names, DOM context, element type and spatial position.
 *
 * Example outcome: a div containing "sidebar navigation" becomes
 * `sidebar_navigation` — never `element_12345`.
 *
 * The generated identity is ALWAYS preserved (autoName), even when the user
 * overrides the display name.
 */

export interface NamingEvidence {
  name: string;
  evidence: string[];
}

export interface NamingMeta {
  tagName: string;
  role?: string;
  text: string;
  ariaLabel?: string;
  stableClass?: string;
  position?: string | null;
  nearbyHeading?: string | null;
}

const POSITION_HINTS = (el: Element): string | null => {
  try {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const w = (el.ownerDocument?.defaultView?.innerWidth || 1920);
    if (rect.y < w * 0.15) return 'top';
    if (rect.y > w * 1.5) return 'bottom';
    if (rect.x < w * 0.2) return 'left';
    if (rect.x + rect.width > w * 0.8) return 'right';
    return 'center';
  } catch {
    return null;
  }
};

const ROLE_SYNONYMS: Record<string, string> = {
  navigation: 'navigation',
  banner: 'header',
  contentinfo: 'footer',
  complementary: 'sidebar',
  main: 'main',
  form: 'form',
  search: 'search',
  region: 'section',
  dialog: 'modal',
  alertdialog: 'modal',
  table: 'table',
  list: 'list',
  combobox: 'dropdown',
  button: 'button',
  link: 'link',
  textbox: 'input',
  checkbox: 'checkbox',
  radio: 'radio',
  img: 'image',
  article: 'article',
};

const TAG_SYNONYMS: Record<string, string> = {
  nav: 'navigation',
  header: 'header',
  footer: 'footer',
  aside: 'sidebar',
  main: 'main',
  section: 'section',
  article: 'article',
  form: 'form',
  table: 'table',
  ul: 'list',
  ol: 'list',
  figure: 'figure',
  dialog: 'modal',
  button: 'button',
  input: 'input',
  select: 'dropdown',
  textarea: 'textarea',
  canvas: 'canvas',
  video: 'video',
  img: 'image',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
};

export function toSnakeCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
    .slice(0, 48)
    .replace(/_$/, '');
}

export class NamingEngine {
  /**
   * Generate an automatic name for a live element.
   */
  public generate(element: Element): NamingEvidence {
    return this.generateFromMeta({
      tagName: element.tagName.toLowerCase(),
      role: element.getAttribute('role') || undefined,
      text: directText(element).trim(),
      ariaLabel: element.getAttribute('aria-label') || undefined,
      stableClass: Array.from(element.classList || []).find(
        (c) => /^[a-z][a-z0-9-]{2,}$/i.test(c) && !GENERIC_CLASSES.has(c)
      ),
      position: POSITION_HINTS(element),
      nearbyHeading: this.nearbyHeading(element),
    });
  }

  /**
   * Generate a name from serialized evidence (used when the live element is
   * not available to the naming call site).
   */
  public generateFromMeta(meta: NamingMeta): NamingEvidence {
    const evidence: string[] = [];
    const parts: string[] = [];

    const role = meta.role || implicitRoleName(meta.tagName);
    if (role) {
      const roleWord = ROLE_SYNONYMS[role] || role;
      parts.push(roleWord);
      evidence.push(`role=${role}`);
    } else {
      const tagWord = TAG_SYNONYMS[meta.tagName] || meta.tagName;
      parts.push(tagWord);
      evidence.push(`tag=${meta.tagName}`);
    }

    if (meta.ariaLabel) {
      parts.unshift(toSnakeCase(meta.ariaLabel));
      evidence.push(`aria-label="${meta.ariaLabel.slice(0, 30)}"`);
    }

    if (meta.text && meta.text.length <= 40) {
      const textWord = toSnakeCase(meta.text.split(/\s+/).slice(0, 3).join(' '));
      if (textWord && textWord.length >= 2) {
        parts.push(textWord);
        evidence.push(`text="${meta.text.slice(0, 30)}"`);
      }
    }

    if (meta.nearbyHeading) {
      const headingWord = toSnakeCase(meta.nearbyHeading.split(/\s+/).slice(0, 3).join(' '));
      if (headingWord && !parts.includes(headingWord)) {
        parts.push(headingWord);
        evidence.push(`nearby-heading="${meta.nearbyHeading.slice(0, 30)}"`);
      }
    }

    if (meta.stableClass && parts.length < 3) {
      parts.push(toSnakeCase(meta.stableClass));
      evidence.push(`class=${meta.stableClass}`);
    }

    if (meta.tagName === 'input') {
      // input-type refinement handled by role above when present
      if (!parts.some((p) => p.includes('input'))) {
        parts.push('input');
        evidence.push('tag=input');
      }
    }

    if (parts.join('_').length < 12 && meta.position) {
      parts.push(meta.position);
      evidence.push(`position=${meta.position}`);
    }

    let name = toSnakeCase(parts.join('_')) || 'unnamed_region';
    if (/^\d/.test(name)) name = `el_${name}`;

    return { name, evidence };
  }

  private nearbyHeading(element: Element): string | null {
    let parent: Element | null = element.parentElement;
    for (let depth = 0; parent && depth < 4; depth++) {
      const heading = parent.querySelector('h1, h2, h3, h4, [role="heading"]');
      if (heading) return directText(heading).trim().slice(0, 40) || null;
      parent = parent.parentElement;
    }
    let sibling: Element | null = element.previousElementSibling;
    for (let i = 0; sibling && i < 4; i++) {
      if (/^H[1-4]$/.test(sibling.tagName)) {
        const text = directText(sibling).trim();
        if (text) return text.slice(0, 40);
      }
      sibling = sibling.previousElementSibling;
    }
    return null;
  }
}

const GENERIC_CLASSES = new Set([
  'active', 'open', 'visible', 'hidden', 'selected', 'disabled', 'container',
  'wrapper', 'root', 'item', 'col', 'row', 'flex', 'box', 'main', 'div',
  'span', 'block',
]);

function implicitRoleName(tag: string): string | null {
  switch (tag) {
    case 'nav': return 'navigation';
    case 'header': return 'banner';
    case 'footer': return 'contentinfo';
    case 'aside': return 'complementary';
    case 'main': return 'main';
    case 'form': return 'form';
    case 'table': return 'table';
    case 'button': return 'button';
    case 'a': return 'link';
    case 'input': return 'textbox';
    case 'select': return 'combobox';
    case 'textarea': return 'textbox';
    case 'img': return 'img';
    default: return null;
  }
}

/**
 * Deduplicate a list of generated names by appending _2, _3, …
 */
export function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}_${count + 1}`;
  });
}

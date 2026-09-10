import { PageBlueprint, ReconstructionSpec, RegionRelationshipGraph } from '../types/project';
import { RECONSTRUCTION_SPEC_VERSION, PROJECT_SCHEMA_VERSION, PAGE_SCHEMA_VERSION } from '../types/project';
import { directText } from '../core/selector-robustness';
import { stableHash } from '../core/dom-fingerprint';

/**
 * §31 Page Reconstruction Specification + §64 Page Blueprint Generation
 *
 * The canonical machine-readable formats enabling ANOTHER AI agent to
 * reconstruct or modify pages from MCPDOM-captured knowledge.
 */

interface RegionForSpec {
  regionId: string;
  name: string;
  tag: string;
  role?: string;
  selector: string;
  selectorCandidates: Array<{ selector: string; strategy: string; confidence: number; unique: boolean; reasons?: string[] }>;
  domFile: string;
  contextDomFile: string;
  relevantStyles: Record<string, string>;
  userComment?: string;
  intendedChange?: string;
  verification?: string[];
  interactive: boolean;
  ownText: string;
}

export class PageBlueprintGenerator {
  /**
   * §64 — generate a page blueprint from the live document + captured regions.
   */
  public generate(doc: Document, pageId: string, regions: Array<{ regionId: string; name: string; selector: string; tag: string; role?: string; element?: Element }>): PageBlueprint {
    const win = doc.defaultView;

    // Major sections — landmarks first, then large structural containers
    const sections: PageBlueprint['majorSections'] = [];
    const landmarkSelector = 'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], section, article';
    for (const el of Array.from(doc.querySelectorAll(landmarkSelector)).slice(0, 30)) {
      const rect = (el as Element).getBoundingClientRect();
      // Zero-size sections (JSDOM simulation, or hidden) are still architecturally
      // meaningful — include them with a visible flag instead of dropping them.
      const visible = !(rect.width === 0 && rect.height === 0);
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || landmarkRole(tag);
      const region = regions.find((r) => r.selector && sameElementish(r.selector, el));
      sections.push({
        name: region?.name || `${role || tag}_${sections.length + 1}`,
        tag,
        selector: bestSelectorOf(el as Element),
        role: role || tag,
        regionId: region?.regionId,
        bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        childrenSummary: `${el.children.length} children (${Array.from(el.children).slice(0, 5).map((c) => c.tagName.toLowerCase()).join(', ')})`,
        visible,
      });
    }

    // Key interactive elements (bounded, scored by visibility)
    const interactiveSelector = 'a[href], button, input, select, textarea, [role="button"], [onclick]';
    const keyInteractive: PageBlueprint['keyInteractiveElements'] = [];
    for (const el of Array.from(doc.querySelectorAll(interactiveSelector)).slice(0, 120)) {
      const info = el as Element;
      if (info.getAttribute('type') === 'hidden') continue;
      const text = directText(info).slice(0, 30) || info.getAttribute('aria-label')?.slice(0, 30) || info.getAttribute('placeholder')?.slice(0, 30) || '';
      if (!text) continue;
      const section = sections.find((s) => s.selector && info.closest(s.selector));
      keyInteractive.push({
        selector: bestSelectorOf(info),
        role: info.getAttribute('role') || info.tagName.toLowerCase(),
        text,
        section: section?.name || 'unassigned',
      });
    }

    // Repeated components — group children of containers by structural signature
    const repeated: PageBlueprint['repeatedComponents'] = [];
    for (const container of Array.from(doc.querySelectorAll('ul, ol, [class*="list"], [class*="grid"], [class*="cards"], [class*="items"], main, section')).slice(0, 40)) {
      const children = Array.from((container as Element).children);
      if (children.length < 3) continue;
      const signature = (el: Element) => `${el.tagName.toLowerCase()}|${Array.from(el.children).map((c) => c.tagName.toLowerCase()).sort().join('.')}|${el.className?.toString().slice(0, 40)}`;
      const groups = new Map<string, Element[]>();
      for (const child of children) {
        const sig = signature(child);
        groups.set(sig, [...(groups.get(sig) || []), child]);
      }
      for (const [sig, group] of groups) {
        if (group.length >= 3) {
          repeated.push({
            pattern: sig.slice(0, 80),
            occurrences: group.length,
            sampleSelector: bestSelectorOf(group[0]),
            containerSelector: bestSelectorOf(container as Element),
          });
        }
      }
    }

    const layoutRelationships: string[] = [];
    const bodyCS = win?.getComputedStyle ? win.getComputedStyle(doc.body) : null;
    if (bodyCS) {
      if (bodyCS.display === 'flex' || bodyCS.display.includes('grid')) {
        layoutRelationships.push(`body uses ${bodyCS.display}`);
      }
    }
    const mainSection = sections.find((s) => s.role === 'main' || s.tag === 'main');
    const asideSection = sections.find((s) => s.role === 'complementary' || s.tag === 'aside');
    if (mainSection && asideSection) {
      layoutRelationships.push(`content+sidebar layout: main at x=${mainSection.bounds.x}, sidebar at x=${asideSection.bounds.x} (${asideSection.bounds.x < mainSection.bounds.x ? 'left' : 'right'} sidebar)`);
    }
    if (sections.length) {
      layoutRelationships.push(`${sections.length} major sections stacked in document order`);
    }

    const hierarchy = {
      node: 'page',
      label: doc.title || 'page',
      children: sections.map((s) => ({ node: s.selector, label: s.name, children: [] })),
    };

    return {
      schemaVersion: PAGE_SCHEMA_VERSION,
      pageId,
      generatedAt: Date.now(),
      majorSections: sections.slice(0, 20),
      hierarchy,
      keyInteractiveElements: keyInteractive.slice(0, 60),
      repeatedComponents: repeated.slice(0, 15),
      layoutRelationships,
      semanticRegions: Array.from(new Set(sections.map((s) => s.role))),
    };
  }
}

export class ReconstructionSpecGenerator {
  /**
   * §31 — build the canonical reconstruction spec.
   */
  public generate(input: {
    pageId: string;
    projectId: string;
    url: string;
    title: string;
    capturedAt: number;
    viewport: { width: number; height: number; devicePixelRatio: number };
    domSnapshotFile: string;
    domLength: number;
    hierarchy: RegionRelationshipGraph;
    regions: RegionForSpec[];
  }): ReconstructionSpec {
    const { regions } = input;
    return {
      schemaVersion: RECONSTRUCTION_SPEC_VERSION,
      pageId: input.pageId,
      projectId: input.projectId,
      generatedAt: Date.now(),
      metadata: {
        url: input.url,
        title: input.title,
        capturedAt: input.capturedAt,
        tool: 'MCPDOM Browser',
      },
      viewport: input.viewport,
      structure: {
        domSnapshotFile: input.domSnapshotFile,
        domHash: stableHash(`${input.url}|${input.domLength}`),
        nodeCount: input.domLength,
      },
      regions: regions.map((r) => ({
        regionId: r.regionId,
        name: r.name,
        selector: r.selector,
        selectorCandidates: r.selectorCandidates.map((c) => ({ ...c, reasons: c.reasons || [] })),
        domFile: r.domFile,
        reconstructionRole: r.role || r.tag,
      })),
      hierarchy: input.hierarchy,
      semanticRoles: regions.map((r) => ({ regionId: r.regionId, role: r.role || r.tag })),
      visualConstraints: regions.flatMap((r) =>
        Object.entries(r.relevantStyles).slice(0, 5).map(([k, v]) => ({ regionId: r.regionId, constraint: k, value: String(v).slice(0, 60) }))
      ),
      interactions: regions.map((r) => ({
        regionId: r.regionId,
        interactive: r.interactive,
        action: r.interactive ? interactiveActionFor(r.tag, r.role) : 'none',
      })),
      selectors: regions.map((r) => ({
        regionId: r.regionId,
        primary: r.selector,
        fallbacks: r.selectorCandidates.filter((c) => c.selector !== r.selector).slice(0, 4).map((c) => c.selector),
      })),
      content: regions.map((r) => ({ regionId: r.regionId, text: r.ownText.slice(0, 200) })),
      styles: regions.map((r) => ({ regionId: r.regionId, relevantStyles: r.relevantStyles })),
      annotations: regions.map((r) => ({ regionId: r.regionId, userComment: r.userComment, intendedChange: r.intendedChange })),
      expectedModifications: regions.filter((r) => r.intendedChange).map((r) => ({ regionId: r.regionId, statement: r.intendedChange! })),
      verificationRules: regions.filter((r) => r.verification?.length).map((r) => ({ regionId: r.regionId, conditions: r.verification! })),
      migration: {
        fromVersion: RECONSTRUCTION_SPEC_VERSION,
        notes: 'Initial schema. Future breaking changes MUST bump schemaVersion and provide a migration entry here.',
      },
    };
  }
}

function landmarkRole(tag: string): string | undefined {
  const map: Record<string, string> = {
    header: 'banner', nav: 'navigation', main: 'main', aside: 'complementary',
    footer: 'contentinfo', section: 'region', article: 'article', form: 'form',
  };
  return map[tag];
}

function interactiveActionFor(tag: string, role?: string): string {
  const r = (role || '').toLowerCase();
  if (r === 'button' || tag === 'button') return 'click';
  if (r === 'link' || tag === 'a') return 'navigate';
  if (tag === 'input' || tag === 'textarea') return 'type';
  if (tag === 'select') return 'select-option';
  if (r === 'checkbox') return 'toggle';
  if (r === 'radio') return 'select';
  return 'click';
}

function bestSelectorOf(el: Element): string {
  try {
    const id = el.getAttribute('id');
    if (id && /^[a-zA-Z][\w-]*$/.test(id)) return `#${id}`;
    const testid = el.getAttribute('data-testid');
    if (testid) return `${el.tagName.toLowerCase()}[data-testid="${testid}"]`;
    const tag = el.tagName.toLowerCase();
    const cls = Array.from(el.classList || [])[0];
    if (cls) return `${tag}.${cls}`;
    return tag;
  } catch {
    return el.tagName.toLowerCase();
  }
}

function sameElementish(selector: string, el: Element): boolean {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
}

export const BLUEPRINT_SCHEMA_VERSION = PROJECT_SCHEMA_VERSION;

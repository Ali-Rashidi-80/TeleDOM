/**
 * TeleDOM v12+ Semantics — Semantic DOM + Component Intelligence.
 *
 * Raw DOM is noisy for agents. This layer converts raw structure into a
 * semantic model (role, purpose, ownership, stability), infers component
 * boundaries (React/Vue/Svelte/custom element/microfrontend/iframe), and
 * tracks component lifecycles as first-class temporal entities.
 */

import { computeHash } from '../kernel/integrity';

export interface SemanticElement {
  /** Semantic identity (survives class churn). */
  semanticId: string;
  role: string;
  purpose: string;
  text: string;
  state: 'enabled' | 'disabled' | 'loading' | 'invalid' | 'hidden' | 'unknown';
  ownership: string | null;
  stability: number;
  visibility: 'visible' | 'occluded' | 'clipped' | 'hidden' | 'detached';
  interactive: boolean;
  selectorCandidates: string[];
  accessibility: { role?: string; name?: string; label?: string; focusable?: boolean };
}

export interface ComponentBoundary {
  componentId: string;
  name: string;
  framework: 'react' | 'vue' | 'svelte' | 'custom-element' | 'web-component' | 'microfrontend' | 'iframe' | 'unknown';
  rootSelector: string;
  depth: number;
  childElements: number;
  evidence: string[];
  confidence: number;
}

export interface ComponentLifecycleEvent {
  componentId: string;
  phase: 'mount' | 'update' | 'remount' | 'unmount';
  at: number;
  evidence: string[];
}

interface RawElementInput {
  tag: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  text?: string;
  parentId?: string;
  depth?: number;
  interactive?: boolean;
  visible?: boolean;
}

const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'option', 'form', 'summary', 'details']);
const ROLE_BY_TAG: Record<string, string> = {
  button: 'submit-action', a: 'navigation-link', input: 'data-entry', select: 'choice',
  textarea: 'data-entry', form: 'input-group', table: 'data-table', nav: 'navigation-region',
  header: 'page-header', footer: 'page-footer', main: 'main-region', aside: 'complementary',
  img: 'media', video: 'media', canvas: 'graphics', dialog: 'modal', label: 'field-label',
};

export class SemanticEngine {
  /**
   * Build the semantic model of a raw DOM fragment. Stability is computed
   * from how many stable signals (role tag, id, text, accessible name)
   * anchor the element.
   */
  semanticDom(elements: RawElementInput[]): SemanticElement[] {
    return elements.map((el) => {
      const role = this.roleOf(el);
      const stableSignals = [
        Boolean(el.id),
        Boolean(el.text && el.text.trim().length > 0),
        INTERACTIVE_TAGS.has(el.tag),
        Boolean(el.attributes?.['aria-label']),
        Boolean(el.attributes?.['data-testid'] || el.attributes?.['data-test']),
      ].filter(Boolean).length;
      const stability = Math.min(0.97, 0.45 + stableSignals * 0.11);
      const state = this.stateOf(el);
      return {
        semanticId: `sem:${computeHash({ tag: el.tag, id: el.id, text: el.text, role }).slice(0, 12)}`,
        role,
        purpose: this.purposeOf(el, role),
        text: (el.text ?? '').trim().slice(0, 120),
        state,
        ownership: el.parentId ? `component@${el.parentId}` : null,
        stability,
        visibility: el.visible === false ? 'hidden' : 'visible',
        interactive: el.interactive ?? INTERACTIVE_TAGS.has(el.tag),
        selectorCandidates: this.selectorsFor(el),
        accessibility: {
          role: el.attributes?.['role'] || (ROLE_BY_TAG[el.tag] ? undefined : el.attributes?.['role']),
          name: el.attributes?.['aria-label'] || el.attributes?.['name'],
          label: el.attributes?.['aria-labelledby'],
          focusable: el.interactive ?? INTERACTIVE_TAGS.has(el.tag),
        },
      };
    });
  }

  private roleOf(el: RawElementInput): string {
    if (el.attributes?.['role']) return el.attributes['role'];
    if (el.attributes?.['data-testid']) return `test-target(${el.attributes['data-testid']})`;
    return ROLE_BY_TAG[el.tag] ?? `${el.tag}-region`;
  }

  private purposeOf(el: RawElementInput, role: string): string {
    const text = (el.text ?? '').trim().toLowerCase();
    if (role === 'submit-action') return text ? `action:${text}` : 'submit-action';
    if (role === 'navigation-link') return text ? `navigate:${text}` : 'navigation';
    if (role === 'data-entry') return `input:${el.attributes?.['type'] ?? 'text'}`;
    return `${el.tag}:${role}`;
  }

  private stateOf(el: RawElementInput): SemanticElement['state'] {
    const attrs = el.attributes ?? {};
    if (attrs['aria-disabled'] === 'true' || attrs['disabled'] !== undefined) return 'disabled';
    if (attrs['aria-busy'] === 'true' || attrs['data-loading'] === 'true') return 'loading';
    if (attrs['aria-invalid'] === 'true') return 'invalid';
    if (el.visible === false || attrs['aria-hidden'] === 'true') return 'hidden';
    return 'enabled';
  }

  private selectorsFor(el: RawElementInput): string[] {
    const candidates: string[] = [];
    if (el.id) candidates.push(`#${el.id}`);
    if (el.attributes?.['data-testid']) candidates.push(`[data-testid="${el.attributes['data-testid']}"]`);
    if (el.attributes?.['aria-label']) candidates.push(`${el.tag}[aria-label="${el.attributes['aria-label']}"]`);
    if (el.classes?.length) candidates.push(`${el.tag}.${el.classes.slice(0, 2).join('.')}`);
    candidates.push(el.tag);
    return candidates;
  }

  /**
   * Infer component boundaries from raw structure. Framework detection is
   * evidence-driven (attribute fingerprints), never guessed blindly.
   */
  componentMap(elements: RawElementInput[]): ComponentBoundary[] {
    const components: ComponentBoundary[] = [];
    for (const el of elements) {
      const framework = this.frameworkOf(el);
      if (!framework) continue;
      const name = this.componentName(el, framework);
      const evidence = this.frameworkEvidence(el, framework);
      const childCount = elements.filter((c) => c.parentId === (el.id ?? el.tag)).length;
      components.push({
        componentId: `comp:${computeHash({ name, framework, root: el.id ?? el.tag }).slice(0, 12)}`,
        name,
        framework,
        rootSelector: el.id ? `#${el.id}` : el.tag,
        depth: el.depth ?? 0,
        childElements: childCount,
        evidence,
        confidence: evidence.length >= 2 ? 0.85 : 0.6,
      });
    }
    return components;
  }

  private frameworkOf(el: RawElementInput): ComponentBoundary['framework'] | null {
    const attrs = el.attributes ?? {};
    if (attrs['data-reactroot'] !== undefined || attrs['data-reactid'] !== undefined) return 'react';
    if (attrs['data-v-'] !== undefined) return 'vue';
    if (attrs['data-svelte-h'] !== undefined || el.classes?.some((c) => c.startsWith('svelte-'))) return 'svelte';
    if (el.tag.includes('-') && !attrs['data-testid']) return 'custom-element';
    if (el.tag === 'iframe') return 'iframe';
    return null;
  }

  private componentName(el: RawElementInput, framework: string): string {
    const attrs = el.attributes ?? {};
    const candidates = [
      attrs['data-component'], attrs['data-testid'], attrs['aria-label'], el.id,
      el.classes?.[0],
    ].filter(Boolean) as string[];
    const base = candidates[0] ?? el.tag;
    return `${framework}:${base}`;
  }

  private frameworkEvidence(el: RawElementInput, framework: string): string[] {
    const evidence: string[] = [`framework-fingerprint:${framework}`];
    if (el.attributes?.['data-component']) evidence.push('explicit data-component attribute');
    if (el.id) evidence.push(`root id #${el.id}`);
    return evidence;
  }

  /**
   * Derive component lifecycle events from DOM events: mount (first insert),
   * update (attribute/text change), remount (insert after an unmount),
   * unmount (removal).
   */
  lifecycleFromEvents(
    componentRootSelector: string,
    domEvents: { type: string; selectorPath?: string; at: number; sequence: number; targetSelector?: string }[],
  ): ComponentLifecycleEvent[] {
    const relevant = domEvents
      .filter((e) => (e.targetSelector ?? e.selectorPath ?? '').includes(componentRootSelector))
      .sort((a, b) => a.sequence - b.sequence);
    const out: ComponentLifecycleEvent[] = [];
    let mounted = false;
    let everMounted = false;
    let mountSeq = -1;
    for (const ev of relevant) {
      if (ev.type === 'node-added' || ev.type === 'mut_add') {
        if (!mounted) {
          if (everMounted) {
            out.push({ componentId: componentRootSelector, phase: 'remount', at: ev.at, evidence: [`event:${ev.sequence}`, 'previous mount existed'] });
          } else {
            out.push({ componentId: componentRootSelector, phase: 'mount', at: ev.at, evidence: [`event:${ev.sequence}`] });
          }
          mounted = true;
          everMounted = true;
          mountSeq = ev.sequence;
        } else if (ev.sequence - mountSeq > 2) {
          out.push({ componentId: componentRootSelector, phase: 'remount', at: ev.at, evidence: [`event:${ev.sequence}`, 'previous mount existed'] });
          mountSeq = ev.sequence;
        }
      } else if (ev.type === 'node-removed' || ev.type === 'mut_rem') {
        if (mounted) {
          mounted = false;
          out.push({ componentId: componentRootSelector, phase: 'unmount', at: ev.at, evidence: [`event:${ev.sequence}`] });
        }
      } else if (ev.type === 'attribute-changed' || ev.type === 'mut_attr' || ev.type === 'mut_txt') {
        out.push({ componentId: componentRootSelector, phase: 'update', at: ev.at, evidence: [`event:${ev.sequence}`] });
      }
    }
    return out;
  }
}

---
name: dom-targeting
description: Build resilient multi-strategy TARGET objects (ranked selector candidates, fingerprints, confidence) for elements you intend to store, share, or act on.
version: 1.0.0
---

# Skill: DOM Targeting

## PURPOSE
Produce the canonical `TARGET` object for an element so that later lookups survive re-renders, framework churn and navigation. Targeting is the contract between inspection and action: every interaction, mutation, region annotation and reconstruction spec consumes TARGETs.

## WHEN TO USE
- Before storing an element reference anywhere (project region, spec, recording, handoff to another agent).
- When a raw CSS selector keeps breaking across page states.
- After `search_dom` / element-picker selection, to convert a one-off hit into a durable identity.
- Before destructive actions, to know the confidence and volatility you are standing on.
- Building multi-step automation where one broken reference mid-flow would waste the whole run — target first, then act.
- Handing an element to another agent or session: a raw selector is a guess, a TARGET is evidence.

## PREREQUISITES
- MCP server running; live page reachable via the extension or the Node simulation context (JSDOM fixture, results marked `simulated: true`).
- A way to reference the element: selector, xpath, nodeId, `selectedElementRef` (from the picker) or coordinates.

## WORKFLOW
1. `generate_element_target {target|selector}` — resolve the element and build the TARGET: `targetId`, `tag`, `role`, `selector`, `selectorCandidates[]`, `xpath`, `domPath`, `textFingerprint`, `attributeFingerprint`, `structuralFingerprint`, `attributes`, `confidence` in [0,1], `bounds`, `resolvedFrom`.
2. Inspect `selectorCandidates` — ranked by confidence, each with `strategy`, `unique`, `reasons`:
   - `id` (1.0) → `semantic-attribute` e.g. data-testid/aria/name (0.92) → `class` from stable classes (0.72) → `attribute-fingerprint` combos (0.68) → `text-derived-xpath` (0.6) → `structural-path` nth-of-type (0.55).
3. Read overall `confidence`: 60% best-selector confidence + up to 0.3 for low fingerprint volatility (+0.15 medium) + 0.1 if a unique ≥0.9 candidate exists.
4. Cross-check volatility with `get_element_fingerprint` — `volatilityRisk` low/medium/high with `volatilityReasons` (hashed utility classes, dynamic text, custom elements, no stable identity attribute are the usual suspects).
5. Persist the TARGET snapshot (region annotation or your own store); keep `structuralFingerprint`, `stableAttributes`, text and parentSelector — they are the raw material for `recover_selector`.
6. Resolution is deterministic: `selector` → `xpath` → `nodeId` (registry) → `coordinates`; a multi-match selector is disambiguated to the first visible match and reported as `resolvedFrom: "selector+disambiguated"`.

## TOOLS
`generate_element_target`, `get_element_fingerprint`, `search_dom`, `inspect_live_element`, `get_element_ancestry`, `recover_selector`

## EXAMPLES
```
tools/call generate_element_target { "selector": "button[data-testid='submit']" }
tools/call generate_element_target { "target": { "xpath": "//button[contains(text(), 'Sign in')]" } }
tools/call get_element_fingerprint { "selector": "#checkout-cta" }
```

## FAILURE MODES
- **TARGET_NOT_FOUND** — no strategy resolved: element removed, re-rendered mid-flight, inside a closed shadow root, or in a cross-origin frame. Check with `inspect_live_page` that the page you think is loaded is loaded.
- **TARGET_INVALID** — selector throws at parse time (typo, unescaped characters).
- **TARGET_INVALID_XPATH** — xpath engine rejected the expression.
- **Low confidence (<0.5)** — element is volatility-heavy (CSS-module hashes, generated ids); do not treat a structural-path candidate as durable.
- **Multi-match selector auto-disambiguation** — several matches resolved to the first visible one; fine for a one-off click, dangerous for stored references — tighten the selector instead.

## VALIDATION
- `confidence` ≥ 0.7 with a `unique: true` candidate is a durable TARGET; below 0.6 expect churn and plan for recovery.
- `selectorCandidates` should contain ≥ 3 distinct strategies for anything you intend to reuse.
- `resolvedFrom` tells you which strategy actually resolved — if it fell through to `coordinates`, the selector/xpath are already stale.
- Volatility `high` with reasons like "all classes are framework-generated" is a predictor: plan the recovery workflow now, before the next re-render.
- `bounds` in the TARGET should match `inspect_live_element` bounds — a mismatch means the page re-rendered between the two calls.

## RECOVERY
- If `generate_element_target` fails, re-find the element with `search_dom` and retry with the found selector.
- If a previously built TARGET stops resolving, switch to the selector-recovery skill (`recover_selector` + snapshot).
- Never invent a selector you have not resolved — re-target, don't guess.

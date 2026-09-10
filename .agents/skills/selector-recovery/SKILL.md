---
name: selector-recovery
description: Diagnose and safely recover failed element selectors using fingerprint matching, with hard confidence gates (0.62 threshold, 0.15 margin) that refuse to act on ambiguous matches.
version: 1.0.0
---

# Skill: Selector Recovery

## PURPOSE
Repair broken element references without ever silently acting on a wrong element. The recovery engine matches the previous target's fingerprint evidence against the live DOM, scores candidates, and only resolves above safety gates — otherwise it refuses and hands you diagnostics.

## WHEN TO USE
- A selector that worked before now returns TARGET_NOT_FOUND (re-render, framework update, navigation, A/B variant).
- A recorded command, region annotation or reconstruction spec fails to resolve on replay.
- Before retrying an interaction that failed for targeting reasons.
- A regression replay fails at the same step repeatedly — the recorded selector no longer matches the evolved page.

## PREREQUISITES
- The failing selector.
- The previous target snapshot evidence: `tag`, `text`, `classes`, `stableAttributes`, `fingerprintHash`, `parentSelector`, `childCount` — from `generate_element_target`, a region annotation, or your earlier inspection.
- Live page still loaded (same or re-rendered version) in extension or Node simulation context.

## WORKFLOW
1. `diagnose_selector_failure {selector}` — establish WHY it fails before touching anything:
   - `valid` (syntax), `matches` (0 = gone, >1 = ambiguous), `parseError`, `closestWorkingSelectors` (relaxed forms that still match: drop the last compound, keep only the last part, strip `:nth-of-type()`/volatile classes), and human-readable `diagnosis` steps.
2. If the selector merely matches multiple elements, tighten it yourself — recovery is not needed.
3. `recover_selector {selector, snapshot}` — the mandated fingerprint-matching workflow:
   - verifies the failure (if the selector matches again, it returns `recovered: true, strategy: "original-selector", confidence: 1.0` — the earlier failure was a transient navigation/render race);
   - collects candidates (bounded tag sweep ≤400, stable-class sweep, `[name="…"]`, `parentSelector > tag`);
   - scores each: text 0.30, attributes 0.20, classes 0.20, tag 0.15, childCount 0.05, fingerprint hash 0.10; candidates below 0.35 are dropped;
   - top-5 alternatives are returned with fresh selectors and confidences.
4. Check the safety gates before acting: recovery only succeeds when the best score is ≥ **0.62** AND leads the runner-up by ≥ **0.15** margin. Below either gate the outcome is `recovered: false, strategy: "recovery-refused"` — by design, not a bug.
5. If recovered: verify `matchedElementInfo` (tag/id/text/classes) matches your intent, then use `resolvedSelector` for the next action; re-run `generate_element_target` to refresh the stored snapshot.
6. If refused: read `alternatives` + `diagnostics` (per-component scores and the margin are printed), pick manually, or re-inspect the page and capture a fresh target.

## TOOLS
`diagnose_selector_failure`, `recover_selector`, `generate_element_target`, `search_dom`, `inspect_live_element`, `get_element_fingerprint`

## EXAMPLES
```
tools/call diagnose_selector_failure { "selector": "div.css-1x2y3z > button" }
tools/call recover_selector { "selector": "#old-submit", "snapshot": { "tag": "button", "text": "Sign in", "classes": ["btn", "btn-primary"], "stableAttributes": { "data-testid": "login-submit" }, "parentSelector": "form.login", "childCount": 2 } }
```

## FAILURE MODES
- **recovery-refused (score < 0.62 or margin < 0.15)** — best match is not confident enough or too close to a competing element (e.g. repeated list items). The engine refuses to avoid acting on the wrong element; inspect `alternatives` yourself.
- **No candidates above 0.35** — the region was likely removed or the page structure changed fundamentally; re-inspect and capture a new target.
- **Syntax error diagnostics** — the selector never parsed; fix the string, recovery scoring is irrelevant.
- **Recovery on a re-rendered twin** — text/classes match but semantics changed; always sanity-check `matchedElementInfo` before destructive actions.

## VALIDATION
- `recovered: true` outcomes carry `confidence`, `strategy: "fingerprint-recovery"`, `resolvedSelector` and `matchedElementInfo` — all four must be present and consistent.
- `recovered: true, confidence: 1.0, strategy: "original-selector"` means the failure was transient — suspect a navigation race, not a DOM change.
- Refusals include the best-candidate score and margin in `diagnostics`; use them to decide between manual picking and re-targeting.
- Verify each relaxation in `closestWorkingSelectors` really matches the intended element before adopting it as the new selector.

## RECOVERY
- No safe recovery possible: fall back to `search_dom` on distinctive text, rebuild with `generate_element_target`, and update the stored snapshot/annotation.
- Repeated refusals across a page mean systematic churn — recapture the whole project region set rather than patching selectors one by one.
- Never lower the gates by retrying until it "happens" to pass — a pass at the same evidence is noise, not confidence.

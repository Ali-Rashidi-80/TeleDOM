---
name: page-annotation
description: Select elements visually (Ctrl+Shift+Click / picker) and capture them as region annotations that strictly separate OBSERVED facts, USER intent, INTENDED CHANGE and VERIFICATION conditions with explainable quality grades.
version: 1.0.0
---

# Skill: Page Annotation

## PURPOSE
Turn "this thing here" into durable, machine-readable knowledge. A region annotation captures the element's real evidence (DOM, selectors, fingerprint, styles), the human's request, the intended change and the success conditions — as strictly separated fields that are never conflated, then grades how well the region is understood.

## WHEN TO USE
- A user points at an element ("make this collapsible", "this button is broken") and you need evidence + intent captured together.
- Building the region set of a page project before generating specs or handing off to another agent.
- Selecting elements visually is faster than deriving selectors (picker or Ctrl+Shift+Click).

## PREREQUISITES
- A project to capture into: `create_page_project` first (PROJECT_NOT_FOUND otherwise).
- For visual selection: Chrome extension connected and the target page in the active tab.
- For direct capture: a selector/target that resolves on the live page.

## WORKFLOW
1. Optional visual selection: `start_element_picker {tabId, highlightColor}` → status PICKER_ACTIVE (crosshair + hover highlight); the user clicks an element, or uses the always-on **Ctrl+Shift+Click** shortcut anywhere.
2. `get_selected_element {}` — returns `{selected: true, element}` with the picked element's data, or an explicit "No element has been selected yet" message. Feed the resulting selector/ref into capture.
3. `capture_page_region {projectName, target|selector, ...}` or its annotation-first alias `annotate_element` — capture into the project. Provide:
   - USER fields: `name` (display override; the auto-name is preserved separately), `description`, `comment`, `tags`, `behavioralNotes`, `visualNotes`;
   - `intendedChange` — what the user wants changed;
   - `verification` — success conditions (array);
   - `screenshot: true` to also capture a region screenshot.
4. The capture engine resolves the element, records LOCAL DOM + RELEVANT CONTEXT DOM (boundary: ascends to a meaningful container), ranked selector candidates, fingerprint, styles, dimensions and position; redaction runs BEFORE anything touches disk.
5. Read the returned annotation: `observed` (never hand-editable facts), `user`, `intendedChange`, `verification`, `analysis.qualityScore`.
6. Quality is explainable — components with weights: selector-stability 0.3 (unique selector? confidence?), semantic-confidence 0.2 (fingerprint volatility), structural-completeness 0.15 (HTML snapshot + context), visual-completeness 0.15 (screenshot), annotation-completeness 0.2 (description/intended change/verification). Grades: A ≥ 0.85, B ≥ 0.65, C ≥ 0.45, else D.
7. `update_region_annotation {projectName, regionId, ...}` — edit USER fields only (intendedChange/verification included); observed facts are immutable; quality is recomputed.
8. `stop_element_picker {tabId}` when visual selection is done. Audit with `list_region_annotations`, `get_region_annotation`.

## TOOLS
`start_element_picker`, `stop_element_picker`, `get_selected_element`, `capture_page_region`, `annotate_element`, `list_region_annotations`, `get_region_annotation`, `update_region_annotation`, `delete_region_annotation`, `create_page_project`

## EXAMPLES
```
tools/call start_element_picker { "highlightColor": "#0ea5e9" }
tools/call get_selected_element {}
tools/call capture_page_region { "projectName": "checkout-redesign", "selector": "button[data-testid='pay-now']", "comment": "make this collapsible on mobile", "intendedChange": "Collapse the payment summary behind a toggle below 768px", "verification": ["Payment summary is hidden below 768px", "Toggle reveals full summary", "Desktop layout unchanged"], "screenshot": true }
tools/call update_region_annotation { "projectName": "checkout-redesign", "regionId": "region_m1x9_2", "verification": ["Summary hidden below 768px", "Toggle works with keyboard"] }
```

## FAILURE MODES
- **PROJECT_NOT_FOUND** — capturing into a project that does not exist; run `create_page_project` first.
- **"No element has been selected yet"** — no Ctrl+Shift+Click happened and the picker has no selection; guide the user or pass an explicit selector.
- **TARGET_NOT_FOUND during capture** — the element re-rendered between selection and capture; recover the selector or re-pick.
- **Low quality grade (C/D)** — usually missing unique selector (volatility), no screenshot, or no intendedChange/verification; fix the cheap parts (annotation + screenshot) first.
- **Picker clicks select the wrong node** — the click landed on an overlay/child; re-pick, or take the parent via `inspect_live_element` ancestry and capture by selector.

## VALIDATION
- Every annotation returns observed/user/intendedChange/verification as separate objects — if intent ended up inside `user.comment` only, capture the `intendedChange` field properly next time.
- `analysis.qualityScore.components` each carry `evidence` text; weak dimensions (<0.5) are listed in `notes`.
- Auto-names are snake_case and evidence-based (e.g. `sidebar_navigation`), preserved in `observed.autoName` even when the user renames.

## RECOVERY
- Miss-captured region: `delete_region_annotation` and re-capture (observed facts cannot be edited by design).
- Stale selector on an existing region: use selector-recovery against the region's stored snapshot, then capture a fresh region rather than hand-editing the old one.
- Redaction removed something you needed: adjust with `set_redaction_rules` (custom rules/exclusions) — but never disable built-in secret rules.

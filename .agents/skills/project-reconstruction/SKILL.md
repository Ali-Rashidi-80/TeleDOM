---
name: project-reconstruction
description: Generate and consume the canonical page reconstruction spec, page blueprint and region relationship graph — versioned, machine-readable formats that let another agent rebuild or modify a captured page.
version: 1.0.0
---

# Skill: Project Reconstruction

## PURPOSE
Convert a captured project (regions, DOM, annotations) into the two canonical outputs agents reason from: the page blueprint (architecture: sections, hierarchy, interactive inventory, repeated components, layout relationships) and the reconstruction spec (selectors with fallbacks, constraints, expected modifications, verification rules — with a versioned schema).

## WHEN TO USE
- Handing page knowledge to an agent that must rebuild, restyle or modify the page from captured evidence.
- Deriving what to build/modify from the region set instead of re-inspecting the live page.
- Understanding page architecture quickly (major sections, semantic regions, repeated patterns).
- Validating that a modification satisfies the captured verification conditions.

## PREREQUISITES
- An existing project with captured regions (project-capture + page-annotation skills).
- For the blueprint and relationship graph derived from live containment: the source page reachable (extension or Node simulation).

## WORKFLOW
1. `get_page_blueprint {projectName?}` — architectural map:
   - `majorSections` — landmarks (header/nav/main/aside/footer/section/article + ARIA roles) with bounds, children summary and a `visible` flag (zero-size sections in JSDOM simulation are included with `visible: false`, not dropped);
   - `hierarchy` tree; `keyInteractiveElements` (bounded, text/aria/placeholder-scored, each mapped to its section);
   - `repeatedComponents` — structural signatures grouped from list/grid/cards containers with occurrence counts and sample/container selectors;
   - `layoutRelationships` (e.g. "content+sidebar layout: sidebar at x=… (left sidebar)", flex/grid body) and `semanticRegions`.
   With `projectName` it persists to `metadata/blueprint.json`.
2. `get_region_relationship_graph {projectName}` — nodes (page + regions) and edges (`contains`, `sibling-of`, `ancestor-of`, `overlaps`) derived from live DOM containment when elements resolve.
3. `generate_reconstruction_spec {projectName}` — writes and returns `metadata/reconstruction-spec.json`:
   - `metadata` / `viewport` / `structure` (domSnapshotFile, domHash, nodeCount);
   - `regions` with `selectorCandidates` and `reconstructionRole`;
   - `hierarchy`, `semanticRoles`, `visualConstraints` (top relevant styles per region), `interactions` (click/type/select-option/navigate/toggle), `selectors` (primary + up to 4 fallbacks), `content`, `styles`, `annotations` (userComment, intendedChange);
   - `expectedModifications` — one entry per region that has an intended change;
   - `verificationRules` — one entry per region that has verification conditions;
   - `migration` — schema evolution slot.
4. Consume as another agent, in this order:
   - resolve each region via `selectors.primary`, falling back through `fallbacks` in order (deterministic resolution);
   - read `expectedModifications` as the work items and `verificationRules` as the acceptance tests — turn each condition into an executable check (wait_for_condition / inspect / compare_page_states);
   - respect `visualConstraints` and `reconstructionRole` when generating markup; use `domFile`/`contextDomFile` for exact original structure;
   - re-verify with the original project: rebuild, then run the verification matrix.
5. Respect schema versioning: read `schemaVersion` before interpreting; breaking changes MUST bump it and add a `migration` entry — if the version is newer than you understand, stop and check the migration notes rather than guessing fields.

## TOOLS
`generate_reconstruction_spec`, `get_page_blueprint`, `get_region_relationship_graph`, `get_project`, `list_region_annotations`, `get_region_annotation`, `export_agent_package`, `import_project`

## EXAMPLES
```
tools/call get_page_blueprint { "projectName": "checkout-redesign" }
tools/call get_region_relationship_graph { "projectName": "checkout-redesign" }
tools/call generate_reconstruction_spec { "projectName": "checkout-redesign" }
tools/call get_region_annotation { "projectName": "checkout-redesign", "regionId": "region_m1x9_2" }
```

## FAILURE MODES
- **PROJECT_NOT_FOUND** — spec/blueprint/graph against a missing project; `list_projects` first.
- **Empty or thin blueprint** — no regions captured and a page with few landmarks; capture more regions or inspect via `analyze_dom` to understand what the generator had to work with.
- **Graph edges missing beyond page→region contains** — region elements did not resolve against the live DOM (page changed since capture or selectors stale); run selector-recovery or re-capture.
- **Unversioned interpretation** — consuming a spec whose `schemaVersion` you did not check; future versions may add/rename sections with migration notes.
- **Interaction rows say "none"** — the region tag/role is not interactive; do not invent interactions the evidence does not support.

## VALIDATION
- The spec file exists at `metadata/reconstruction-spec.json` and `schemaVersion` is present; every region id in the spec exists in `regions/`.
- Every selector primary actually appears in its region's `selectorCandidates`; fallbacks are distinct from the primary.
- `expectedModifications` count must equal the number of regions with `intendedChange`; same for `verificationRules` vs verification conditions.

## RECOVERY
- Stale selectors in a spec: re-verify each region on the live page; if resolution fails, use `recover_selector` with the region's stored snapshot and regenerate the spec — never hand-edit observed selector fields.
- Page redesigned since capture: re-capture the project from scratch; diffing old spec vs new capture exposes what moved.
- Consuming agent on a newer schema: read `migration.notes`, adapt, and prefer regenerating the spec with the current tools over parsing unknown fields.

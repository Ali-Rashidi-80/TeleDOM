---
name: project-capture
description: Create portable page-analysis project folders (project.json, page.json, regions/, dom/, screenshots/, commands/, diffs/, metadata/, instructions/) with cleaned DOM snapshots, evidence-based auto-naming, and agent handoff packaging.
version: 1.0.0
---

# Skill: Project Capture

## PURPOSE
Persist everything known about a page into a portable, plain-file folder that survives the browser session and can be consumed by any agent. The DOM snapshot is captured CLEANED — MCPDOM-injected artifacts excluded, secrets redacted before anything touches disk.

## WHEN TO USE
- Starting multi-region analysis work that must outlive the current tab/session.
- Packaging page knowledge for another agent or another machine (`export_agent_package`).
- Rebuilding knowledge after a page redesign (compare old project vs new capture).

## PREREQUISITES
- MCP server running with Node filesystem access (projects live under `.mcpdom_projects/`).
- Live page reachable (extension) or the Node simulation fixture for metadata defaults; `simulated: true` page data is used for url/title/viewport defaults when no browser is connected.
- A unique project name (names are sanitized to lowercase kebab: `Checkout Redesign` → `checkout-redesign`).

## WORKFLOW
1. `create_page_project {name, description?, url?, title?}` — creates `.mcpdom_projects/<name>/` with the standard layout:
   - `project.json` — manifest (schemaVersion, projectId, pages, regionCount, commandRecordingCount, timestamps, toolVersion)
   - `page.json` — page manifest: url, title, capturedAt, viewport, domSnapshotFile, region list, browserState
   - `regions/` — region annotation JSON files
   - `screenshots/` — region screenshots (PNG/JPEG)
   - `dom/` — cleaned DOM snapshots: `page_<pageId>.html` plus per-region `<regionId>.html` and `<regionId>_context.html`
   - `commands/` — command recordings (replayable)
   - `diffs/` — DOM diff artifacts
   - `metadata/` — `blueprint.json`, `reconstruction-spec.json`
   - `instructions/` — agent-facing README with the reading order and semantics guarantee
   - url/title/viewport default from the live page when omitted.
2. Capture regions into the project (page-annotation skill: `capture_page_region` / `annotate_element`); each capture updates `page.json` and `project.json` (regionCount, updatedAt).
3. Let the naming engine work: regions get stable snake_case auto-names from role/text/aria-label/nearby headings/position evidence (`sidebar_navigation`, never `element_12345`); user display names are stored alongside, `autoName` is always preserved.
4. Record workflows into the project: `record_commands_start` / `record_commands_stop` (recordings persist into `commands/`).
5. Enrich: `get_page_blueprint {projectName}` (metadata/blueprint.json) and `generate_reconstruction_spec {projectName}` (metadata/reconstruction-spec.json) — see the project-reconstruction skill.
6. `list_projects {}` / `get_project {projectName}` — audit manifests, page and all region annotations.
7. `export_agent_package {projectName, outputDir?}` — self-contained handoff package (default `./mcpdom_agent_packages/<name>/`): README.md, PROJECT.md, agent-instructions.md, project.json, pages/, regions/, snapshots/, diffs/, commands/, assets/, schemas/, verification/ — fully separating OBSERVED FACTS / USER REQUESTS / EXPECTED CHANGES / VERIFICATION CONDITIONS.
8. On the receiving side: `import_project {projectDir}` restores manifest, page, regions, diffs and command recordings into working storage.

## TOOLS
`create_page_project`, `list_projects`, `get_project`, `delete_project`, `capture_page_region`, `annotate_element`, `get_page_blueprint`, `generate_reconstruction_spec`, `export_agent_package`, `import_project`, `record_commands_start`, `record_commands_stop`

## EXAMPLES
```
tools/call create_page_project { "name": "checkout-redesign", "description": "Regions and intended changes for the checkout page" }
tools/call capture_page_region { "projectName": "checkout-redesign", "selector": "form.payment", "intendedChange": "Two-column layout on desktop", "screenshot": true }
tools/call get_project { "projectName": "checkout-redesign" }
tools/call export_agent_package { "projectName": "checkout-redesign" }
tools/call import_project { "projectDir": "./mcpdom_agent_packages/checkout-redesign" }
```

## FAILURE MODES
- **PROJECT_EXISTS** — a project with that sanitized name already exists; choose another name or capture regions into the existing project.
- **PROJECT_NOT_FOUND** — region/spec/graph operations against a missing or misspelled name; `list_projects` to confirm the sanitized form.
- **Captured DOM looks "wrong"** — injected extension UI is excluded by design and secrets are redacted; this is the clean contract, not data loss. Raw DOM is available via `get_live_dom_snapshot` if truly needed (handle secrets yourself).
- **delete_project** — irreversible file removal; export a package first if the knowledge must survive.
- **Corrupt manifest in listing** — corrupt project folders are skipped without crashing the listing; fix or delete them.

## VALIDATION
- `get_project` returns manifest + page + all regions in one payload; regionCount in `project.json` must equal `page.regions.length`.
- Region files exist under `regions/`, their DOM under `dom/` with matching ids; screenshots under `screenshots/` reference real bytes.
- The package's README/agent-instructions document the reading order: `project.json` → `metadata/blueprint.json` → `regions/*.json` → `metadata/reconstruction-spec.json`.

## RECOVERY
- Wrong project name/sanitization surprise: `list_projects` shows the actual folder names; names map to `[a-z0-9-_]` kebab, max 60 chars.
- Partial capture interrupted: the manifests update per region, so re-capture the missing regions — the project is always in a consistent state.
- Package import on another machine: `import_project` then verify with `get_project` before replaying anything.

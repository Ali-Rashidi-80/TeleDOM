import { MCPToolDefinition } from '../types/mcp-types';

/**
 * MCPDOM v3 Platform Evolution — MCP tool definitions.
 *
 * These tools extend the original FORENSIC_MCP_TOOLS (all 47 preserved).
 * Each definition carries rich descriptions including purpose, required
 * context, side effects and failure conditions, satisfying the Agent Tool
 * Discovery contract (§44): an agent should never have to guess which tool
 * to use.
 */

export const MCPDOM_V3_TOOLS: MCPToolDefinition[] = [
  // ==================================================================
  // Targeting & forensics
  // ==================================================================
  {
    name: 'generate_element_target',
    description:
      'Build the canonical multi-strategy TARGET object for an element: ranked selector candidates with confidence, xpath, DOM path, text/attribute/structural fingerprints and bounds. Use before storing or acting on elements to maximize targeting resilience. Input: target (selector/xpath/selectedElementRef). Output: TARGET with confidence in [0,1]. Fails with TARGET_NOT_FOUND when no strategy resolves.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier (selector, xpath, nodeId, or selectedElementRef)' },
        selector: { type: 'string', description: 'Shorthand: CSS selector for the target element' },
      },
    },
  },
  {
    name: 'recover_selector',
    description:
      'Recover a failed element selector via fingerprint matching: inspects the previous target snapshot, searches candidate matches, scores them, and attempts SAFE recovery (refuses below 0.62 confidence or ambiguous matches). Input: selector + snapshot (tag, text, classes, stableAttributes, fingerprintHash, parentSelector). Output: RecoveryOutcome with alternatives and diagnostics. Side effect: none (read-only diagnosis).',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'The failing CSS selector' },
        snapshot: { type: 'object', description: 'Previous target snapshot evidence (from generate_element_target or a region annotation)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'diagnose_selector_failure',
    description:
      'Diagnose WHY a selector fails: syntax validity, match count, relaxation attempts that work, and human-readable diagnosis. Complements recover_selector (which attempts to fix). Input: selector. Output: validity, matches, closest working selectors, diagnosis steps.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'The selector to diagnose' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'get_element_ancestry',
    description:
      'Analyze element ancestry: ancestors chain (tag, selector, role, text, child index, sibling count, distance), nearby siblings (before/after with distance), and descendant summary (count, max depth, tags, interactive descendants). Input: target/selector.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
      },
    },
  },
  {
    name: 'get_element_fingerprint',
    description:
      'Compute the structural DOM fingerprint of an element: stable hash, tag hierarchy, stable attributes, meaningful text, class list, role, dimensions, ancestor/descendant patterns, plus a volatility risk assessment with reasons. Use for cross-navigation element identity. Input: target/selector.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
      },
    },
  },
  {
    name: 'get_element_relationships',
    description:
      'Build the element relationship graph: self, parents (up to 4 levels), children and siblings as nodes with edges (parent-of, contains, sibling-of). Use to understand page region architecture around a target. Input: target/selector.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
      },
    },
  },
  {
    name: 'get_element_accessibility',
    description:
      'Extract accessibility metadata: explicit/implicit role, accessible name with sources, description, value, states, heading level, focusability, tabIndex, all aria-* attributes, and detected a11y issues. Input: target/selector.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
      },
    },
  },
  {
    name: 'get_computed_style',
    description:
      'Extract computed CSS style properties for an element. Input: target/selector + optional properties list (defaults to a layout-relevant set). Output: property→value map. Fails with STYLE_UNAVAILABLE when getComputedStyle is not exposed (rare).',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
        properties: { type: 'array', items: { type: 'string' }, description: 'CSS property names to extract' },
      },
    },
  },
  {
    name: 'search_dom',
    description:
      'Search the DOM by text, tag and attribute patterns with scored results (selector, role, text, visibility, bounds). The fastest way to find elements without knowing selectors. Input: query (required), optional tag, attr, attrValue, limit. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search text (matched against text, tags and attributes)' },
        tag: { type: 'string', description: 'Restrict to tag name' },
        attr: { type: 'string', description: 'Require this attribute name' },
        attrValue: { type: 'string', description: 'Attribute value substring filter' },
        limit: { type: 'number', description: 'Max results (default 50, max 200)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'analyze_dom',
    description:
      'Run a named DOM analyzer: analyze_forms, extract_links, analyze_media, get_css_variables, analyze_fonts, extract_color_palette, detect_zindex_conflicts, detect_layout_issues, census_interactive_elements, detect_semantic_elements, scan_accessibility_issues, detect_dead_click_targets, inventory_animations, map_frame_tree, inventory_shadow_roots, inspect_page_storage, get_performance_metrics, extract_seo_metadata, extract_structured_data, extract_tables, extract_lists, analyze_page_content, inventory_ctas, detect_focus_traps, infer_responsive_breakpoints, get_selection_state. Input: analyzer (required) + analyzer-specific options. Output: structured analysis with count, items, warnings.',
    inputSchema: {
      type: 'object',
      properties: {
        analyzer: { type: 'string', description: 'Analyzer name (see tool description for the full list)' },
        query: { type: 'string', description: 'Optional search query (search_dom)' },
        limit: { type: 'number', description: 'Optional result cap' },
      },
      required: ['analyzer'],
    },
  },
  {
    name: 'get_page_blueprint',
    description:
      'Generate a page blueprint: major sections with bounds and roles, hierarchy tree, key interactive elements, repeated components (patterns with occurrence counts), layout relationships and semantic regions. The architectural map for page understanding. Input: projectName (optional — generated in the live DOM otherwise). Output: PageBlueprint.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Optional project name to persist the blueprint' },
      },
    },
  },

  // ==================================================================
  // Interaction
  // ==================================================================
  {
    name: 'click_element',
    description:
      'Production-grade click with explicit mode: normal (synthetic pointer event sequence), double, right, or human-like (movement trajectory + click delay from the active interaction profile). Records which mode was actually used. Input: target/selector, mode, waitForStabilization. Output: InteractionResult with before/after state and measured effects.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
        mode: { type: 'string', enum: ['normal', 'double', 'right', 'programmatic', 'human-like'], description: 'Click mode (default normal). Never silently falls back — the used mode is reported.' },
        waitForStabilization: { type: 'boolean', description: 'Wait for DOM stabilization after the click' },
      },
    },
  },
  {
    name: 'type_text',
    description:
      'Robust typing into inputs, textareas and contenteditable with mode: append, replace (clear then type) or clear. Framework-sensitive: dispatches keydown/keypress/input/change per character. Input: target/selector, text, mode. Output: InteractionResult; resulting value visible in afterState.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
        text: { type: 'string', description: 'Text to type' },
        mode: { type: 'string', enum: ['append', 'replace', 'clear'], description: 'Typing mode (default append)' },
        waitForStabilization: { type: 'boolean' },
      },
    },
  },
  {
    name: 'hover_element',
    description: 'Hover an element: pointerenter/mouseenter/mouseover/mousemove event sequence. Input: target/selector. Output: InteractionResult.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object' },
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'focus_element',
    description: 'Focus an element (native focus() + focus event). Input: target/selector. Output: InteractionResult.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object' },
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'blur_element',
    description: 'Blur (defocus) an element (native blur() + blur event). Input: target/selector. Output: InteractionResult.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object' },
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'press_keyboard_shortcut',
    description:
      'Press a key or keyboard shortcut on an element (or the active element): keydown+keyup per key with modifier flags. Input: keys (e.g. ["Control","Shift","P"] or "Control+Shift+P"), optional target. Output: events fired and target selector.',
    inputSchema: {
      type: 'object',
      properties: {
        keys: { type: 'string', description: 'Shortcut, e.g. "Control+Shift+P" or "Enter"' },
        keyList: { type: 'array', items: { type: 'string' }, description: 'Alternative: keys as array' },
        target: { type: 'object', description: 'Optional target specifier; defaults to activeElement' },
      },
      required: ['keys'],
    },
  },
  {
    name: 'scroll_to_element',
    description: 'Scroll an element into view (block: center). Input: target/selector. Output: before/after scroll positions and target selector.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object' },
        selector: { type: 'string' },
        behavior: { type: 'string', enum: ['auto', 'smooth'], description: 'Scroll behavior (default auto)' },
      },
    },
  },
  {
    name: 'scroll_page',
    description: 'Scroll the page by a distance: x/y pixel offsets. Input: x, y. Output: before/after scroll positions.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Horizontal pixel delta' },
        y: { type: 'number', description: 'Vertical pixel delta' },
      },
    },
  },
  {
    name: 'drag_and_drop',
    description:
      'Drag and drop: HTML5 drag events (dragstart/dragenter/dragover/drop/dragend) plus pointer events between source and target (or by pixel offsets). Input: source (target specifier), optional target specifier or offsets. Output: events fired, final position, whether HTML5 DnD was used.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'object', description: 'Source element target specifier' },
        target: { type: 'object', description: 'Drop target specifier (or use offsets)' },
        offsets: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, description: 'Pixel offsets when no drop target' },
      },
      required: ['source'],
    },
  },
  {
    name: 'set_input_checked',
    description:
      'Check/uncheck a checkbox or select a radio (peer radios with the same name are deselected). Dispatches input + change events. Input: target/selector, checked (default true). Output: checkedBefore/checkedAfter and events fired.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object' },
        selector: { type: 'string' },
        checked: { type: 'boolean', description: 'Desired state (default true)' },
      },
    },
  },
  {
    name: 'select_option',
    description: 'Select an option in a dropdown: sets value and dispatches change. Input: target/selector, value. Output: InteractionResult.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object' },
        selector: { type: 'string' },
        value: { type: 'string', description: 'Option value to select' },
      },
      required: ['value'],
    },
  },
  {
    name: 'wait_for_condition',
    description:
      'Wait for a meaningful condition instead of arbitrary sleeps: dom_stable, selector_present, selector_visible, selector_absent, text_present, url_contains, element_count, readiness_state. Input: kind + condition params, timeoutMs (default 5000, max 30000), pollIntervalMs. Output: satisfied, waitedMs, detail. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['dom_stable', 'selector_present', 'selector_visible', 'selector_absent', 'text_present', 'url_contains', 'element_count', 'readiness_state'], description: 'Condition kind' },
        selector: { type: 'string', description: 'Selector for selector_* and element_count conditions' },
        text: { type: 'string', description: 'Text for text_present / url_contains' },
        count: { type: 'number', description: 'Expected count for element_count' },
        state: { type: 'string', description: 'Expected readyState (default complete)' },
        timeoutMs: { type: 'number', description: 'Timeout (default 5000ms)' },
        pollIntervalMs: { type: 'number', description: 'Poll interval (default 100ms)' },
      },
      required: ['kind'],
    },
  },
  {
    name: 'wait_for_dom_stable',
    description: 'Convenience wrapper for wait_for_condition {kind: dom_stable}: polls until two consecutive DOM length observations match. Input: timeoutMs. Output: satisfied + waitedMs.',
    inputSchema: {
      type: 'object',
      properties: {
        timeoutMs: { type: 'number', description: 'Timeout (default 5000ms)' },
      },
    },
  },
  {
    name: 'set_interaction_profile',
    description:
      'Set the human-interaction profile for subsequent interactions: DETERMINISTIC (zero delay), BALANCED (small natural delays), HUMAN_LIKE (realistic cadence, trajectories, hesitation) or CUSTOM (user timing parameters, seed). The seed makes HUMAN_LIKE reproducible. Input: profile, optional custom timings + seed. Output: active profile report.',
    inputSchema: {
      type: 'object',
      properties: {
        profile: { type: 'string', enum: ['DETERMINISTIC', 'BALANCED', 'HUMAN_LIKE', 'CUSTOM'], description: 'Profile name' },
        seed: { type: 'number', description: 'PRNG seed for reproducible human-like timing' },
        custom: { type: 'object', description: 'CUSTOM profile overrides: moveDelayMs, clickDelayMs, typeDelayMs, keyDelayMs {min,max}, hesitationProbability, trajectorySteps' },
      },
      required: ['profile'],
    },
  },
  {
    name: 'get_interaction_profile',
    description: 'Inspect the active interaction profile and the timing of the last action (requested mode, actual mode, per-phase timings, total duration). Output: InteractionProfileReport.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'preview_command',
    description:
      'Dry-run preview of a DOM mutation: valid flag, expected change description, affected node count and warnings — WITHOUT applying anything. Input: operation + target + params (same as mutate_dom). Output: MutationPreview. Side effect: none (guaranteed).',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'Mutation operation (see mutate_dom)' },
        target: { type: 'object', description: 'Element target specifier' },
        attribute: { type: 'string' },
        value: { type: 'string' },
        classes: { type: 'array', items: { type: 'string' } },
        text: { type: 'string' },
        replacement: { type: 'string' },
        html: { type: 'string' },
        newElementHtml: { type: 'string' },
        parent: { type: 'object' },
        position: { type: 'string', enum: ['before', 'after', 'prepend', 'append'] },
      },
      required: ['operation', 'target'],
    },
  },

  // ==================================================================
  // Viewport / responsive testing
  // ==================================================================
  {
    name: 'resize_viewport',
    description:
      'Resize the viewport (width/height in pixels or a named preset). ALWAYS reversible: the original size is recorded on first use. Captures before/after page digests. Input: width+height, or preset (desktop-hd, tablet-ipad, mobile-iphone-12, …). Output: ViewportResizeResult with previous/original dimensions.',
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Target width (200–7680)' },
        height: { type: 'number', description: 'Target height (200–4320)' },
        preset: { type: 'string', description: 'Named preset (overrides width/height)' },
      },
    },
  },
  {
    name: 'reset_viewport',
    description:
      'Restore the original viewport size recorded before the first resize (guaranteed RESET_VIEWPORT semantics). Also clears the active preset/device. Input: none. Output: ViewportResizeResult with restored dimensions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_viewport_state',
    description: 'Inspect the viewport: current width/height/dpr/scroll plus the recorded original and whether it is currently modified. Input: none.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'run_responsive_test',
    description:
      'Run a multi-viewport responsive workflow: applies each size, records DOM length/interactive count/horizontal overflow per step, compares steps, then RESTORES the original viewport (unless restore:false). Input: sizes array (or defaults 1440x900, 1024x768, 768x1024, 375x667), restore. Output: ResponsiveTestResult with comparisons.',
    inputSchema: {
      type: 'object',
      properties: {
        sizes: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, width: { type: 'number' }, height: { type: 'number' } } }, description: 'Custom viewport sequence' },
        restore: { type: 'boolean', description: 'Restore original viewport afterwards (default true)' },
      },
    },
  },
  {
    name: 'emulate_device',
    description:
      'Emulate a device profile: viewport + devicePixelRatio + touch metadata + reported UA (UA override applied only in a real browser session; honestly reported otherwise). Input: device (iphone-13, ipad-air, pixel-7, galaxy-s23, macbook-pro-16, windows-desktop). Output: resize result + profile + userAgentNote.',
    inputSchema: {
      type: 'object',
      properties: {
        device: { type: 'string', description: 'Device profile name' },
      },
      required: ['device'],
    },
  },

  // ==================================================================
  // JavaScript execution
  // ==================================================================
  {
    name: 'execute_javascript',
    description:
      'Execute JavaScript with explicit outcome states: EXECUTED_SUCCESSFULLY, EXECUTED_WITH_ERROR, TIMED_OUT, SERIALIZATION_FAILED, BLOCKED_BY_CONTEXT, NOT_CONNECTED. Captures console output, duration, and DOM-change indication (length before/after). The code may use `return value;`. Input: code, timeoutMs (default 5000, max 30000), world (ISOLATED default). Output: JSExecutionResult. Side effect: arbitrary code execution in the page context.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript source (async/await supported; use `return`)' },
        timeoutMs: { type: 'number', description: 'Timeout (default 5000ms)' },
        world: { type: 'string', enum: ['ISOLATED', 'MAIN'], description: 'Execution world (ISOLATED default)' },
      },
      required: ['code'],
    },
  },
  {
    name: 'execute_js_and_capture_changes',
    description:
      'Composite: execute JavaScript AND capture the DOM state before/after with a structural diff summary + page-state snapshots. Same input as execute_javascript. Output: JSExecutionResult + before/after PageStateSnapshot + comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript source' },
        timeoutMs: { type: 'number' },
        world: { type: 'string', enum: ['ISOLATED', 'MAIN'] },
      },
      required: ['code'],
    },
  },

  // ==================================================================
  // DOM mutation engine
  // ==================================================================
  {
    name: 'mutate_dom',
    description:
      'Apply a first-class DOM mutation with full observability (BEFORE → ACTION → AFTER → DIFF) and a guaranteed undo record. Operations: set_attribute, remove_attribute, set_text, replace_text, set_inner_html, set_outer_html, add_class, remove_class, replace_class, set_style, remove_style, add_element, remove_element, replace_element, move_element, wrap_element, unwrap_element, clone_subtree. Input: operation, target, plus operation-specific params. Output: DOMMutationResult. Side effect: modifies live DOM (undoable).',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['set_attribute', 'remove_attribute', 'set_text', 'replace_text', 'set_inner_html', 'set_outer_html', 'add_class', 'remove_class', 'replace_class', 'set_style', 'remove_style', 'add_element', 'remove_element', 'replace_element', 'move_element', 'wrap_element', 'unwrap_element', 'clone_subtree'],
          description: 'Mutation operation',
        },
        target: { type: 'object', description: 'Element target specifier' },
        attribute: { type: 'string', description: 'Attribute name (set/remove_attribute)' },
        value: { type: 'string', description: 'Attribute value or replacement class (replace_class)' },
        text: { type: 'string', description: 'Text content (set_text) or search pattern (replace_text)' },
        replacement: { type: 'string', description: 'Replacement text (replace_text)' },
        classes: { type: 'array', items: { type: 'string' }, description: 'Class names (add/remove/replace_class) or style props (remove_style)' },
        style: { type: 'object', description: 'Style property map (set_style)' },
        html: { type: 'string', description: 'HTML content (set_inner_html)' },
        newElementHtml: { type: 'string', description: 'HTML for new/replacement/wrapper element' },
        parent: { type: 'object', description: 'Parent target (move_element, add_element)' },
        position: { type: 'string', enum: ['before', 'after', 'prepend', 'append'], description: 'Insertion position (add_element/move_element)' },
        copyAttributes: { type: 'boolean', description: 'clone_subtree: copy attributes (ids never duplicated)' },
      },
      required: ['operation', 'target'],
    },
  },
  {
    name: 'mutate_dom_transaction',
    description:
      'Transactional DOM mutation: mode=begin opens a transaction, subsequent mutate_dom calls join it, mode=commit verifies and commits (all-or-nothing), mode=rollback reverts every step in reverse order. Input: mode, optional reason (rollback). Output: transaction status with per-step results. Side effect: none for begin; commits/rolls back DOM changes.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['begin', 'commit', 'rollback'], description: 'Transaction phase' },
        reason: { type: 'string', description: 'Rollback reason (recorded)' },
      },
      required: ['mode'],
    },
  },
  {
    name: 'undo_dom_mutation',
    description: 'Undo the last DOM mutation (or the last mutation of the open transaction) using its immutable inverse record. Input: none. Output: success + undone mutation id. Idempotent-safe: reports "nothing to undo" when the stack is empty.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'redo_dom_mutation',
    description: 'Redo the last undone DOM mutation (forward patch re-applied only when safe). Input: none. Output: success + redone mutation id.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_mutation_history',
    description: 'Inspect the DOM mutation history: entries (operation, target, summary, undo/redo flags), undo depth, redo depth, open transaction id. Input: limit (default 100). Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max entries (default 100)' },
      },
    },
  },
  {
    name: 'preview_dom_mutation',
    description:
      'Dry-run a mutation: validates the target, describes the expected change, counts affected nodes and warns about destructive operations — WITHOUT modifying anything. Input: identical to mutate_dom. Output: MutationPreview. Side effect: none (guaranteed).',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'Mutation operation' },
        target: { type: 'object', description: 'Element target specifier' },
        attribute: { type: 'string' },
        value: { type: 'string' },
        classes: { type: 'array', items: { type: 'string' } },
        text: { type: 'string' },
        replacement: { type: 'string' },
        html: { type: 'string' },
        newElementHtml: { type: 'string' },
        parent: { type: 'object' },
        position: { type: 'string', enum: ['before', 'after', 'prepend', 'append'] },
      },
      required: ['operation', 'target'],
    },
  },
  {
    name: 'clone_dom_subtree',
    description: 'Clone a DOM subtree (deep clone appended to a parent or the original parent; ids are never duplicated). Input: target, optional parent, copyAttributes. Output: DOMMutationResult (undoable). Side effect: adds cloned nodes.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'object', description: 'Element to clone' },
        parent: { type: 'object', description: 'Optional append target (defaults to original parent)' },
        copyAttributes: { type: 'boolean', description: 'Copy attributes except id (default true)' },
      },
      required: ['target'],
    },
  },

  // ==================================================================
  // Command sequences & recording
  // ==================================================================
  {
    name: 'execute_command_sequence',
    description:
      'Execute a command sequence with per-command records (id, timestamp, target, args, status, result, duration, error): sequential execution, conditional continuation (condition.previousStepSucceeded), explicit stop-on-error (default) or per-step continueOnError. Input: steps array + stopOnError. Output: CommandSequenceResult. Side effects: those of the executed tools.',
    inputSchema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              commandId: { type: 'string' },
              tool: { type: 'string', description: 'MCP tool name' },
              args: { type: 'object', description: 'Tool arguments' },
              stopOnError: { type: 'boolean' },
              continueOnError: { type: 'boolean' },
              condition: { type: 'object', properties: { previousStepSucceeded: { type: 'boolean' } } },
            },
            required: ['tool'],
          },
          description: 'Ordered command steps',
        },
        stopOnError: { type: 'boolean', description: 'Default stop-on-error policy (default true)' },
      },
      required: ['steps'],
    },
  },
  {
    name: 'record_commands_start',
    description: 'Start recording subsequent tool invocations into a named command recording. Input: name, description, tags. Output: active recording metadata. Side effect: recording mode ON (adds latency-free capture to every tool call).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Recording name' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name'],
    },
  },
  {
    name: 'record_commands_stop',
    description: 'Stop the active command recording and persist it to storage (.mcpdom_recordings). Input: none (uses active recording). Output: the finished CommandRecording.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_command_recordings',
    description: 'List saved command recordings with metadata (id, name, command count, timestamps, tags). Input: none. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_command_recording',
    description: 'Load one command recording in full (all commands with args and outcomes). Input: recordingId. Output: CommandRecording. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        recordingId: { type: 'string', description: 'Recording identifier' },
      },
      required: ['recordingId'],
    },
  },
  {
    name: 'replay_command_recording',
    description:
      'Replay a saved command recording: executes each recorded tool call in order with deterministic arguments. Input: recordingId, stopOnError (default true). Output: CommandSequenceResult. Side effects: those of the recorded commands — review get_command_recording first.',
    inputSchema: {
      type: 'object',
      properties: {
        recordingId: { type: 'string' },
        stopOnError: { type: 'boolean', description: 'Stop on first failure (default true)' },
      },
      required: ['recordingId'],
    },
  },
  {
    name: 'export_command_recording',
    description: 'Export a command recording as portable JSON (with schema version) for another agent or session. Input: recordingId, outputPath (optional). Output: the exported JSON + save info.',
    inputSchema: {
      type: 'object',
      properties: {
        recordingId: { type: 'string' },
        outputPath: { type: 'string', description: 'Optional file path to write the JSON' },
      },
      required: ['recordingId'],
    },
  },
  {
    name: 'import_command_recording',
    description: 'Import a command recording from JSON (previously exported). Input: recordingJson. Output: imported recording metadata. Side effect: writes to recordings storage.',
    inputSchema: {
      type: 'object',
      properties: {
        recordingJson: { type: 'string', description: 'Serialized CommandRecording JSON' },
      },
      required: ['recordingJson'],
    },
  },
  {
    name: 'delete_command_recording',
    description: 'Delete a saved command recording. Input: recordingId. Side effect: removes stored data (irreversible).',
    inputSchema: {
      type: 'object',
      properties: {
        recordingId: { type: 'string' },
      },
      required: ['recordingId'],
    },
  },

  // ==================================================================
  // Browser session, timeline & page states
  // ==================================================================
  {
    name: 'get_browser_session',
    description:
      'Inspect the coherent browser session model: tabs with stable session identities, active tab, viewport state, extension state, snapshot count, command count, mutation history count, timeline event count, bound project id. Input: none. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_action_timeline',
    description:
      'Query the chronological action timeline (TAB_OPENED, CLICKED, DOM_MUTATED, SNAPSHOT_CREATED, ERROR_OCCURRED, …) with optional filters (kind, sinceTimestamp, limit). The platform observability layer. Input: optional filters. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', description: 'Filter by event kind' },
        sinceTimestamp: { type: 'number', description: 'Only events at/after this epoch ms' },
        limit: { type: 'number', description: 'Max events (default 200)' },
      },
    },
  },
  {
    name: 'get_operation_trace',
    description:
      'Trace a single operation by its operationId: tool, start/end, duration, status, correlated timeline events, related error. Input: operationId (or latest). Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        operationId: { type: 'string', description: 'Operation id to trace (omit for recent list)' },
        limit: { type: 'number', description: 'Recent operations limit when no id (default 20)' },
      },
    },
  },
  {
    name: 'capture_page_state',
    description:
      'Capture a page state snapshot (comparison anchor): url, title, viewport, dom length + hash, interactive count, extension state, pending mutations, annotation count. Input: none. Output: PageStateSnapshot (also recorded in the session).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'compare_page_states',
    description:
      'Compare two page state snapshots ("what changed after this command?"): field-level diffs, DOM size delta, summary. Input: snapshotIdA + snapshotIdB (omit both to compare the two most recent snapshots). Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        snapshotIdA: { type: 'string', description: 'First snapshot id (default: second-most-recent)' },
        snapshotIdB: { type: 'string', description: 'Second snapshot id (default: most-recent)' },
      },
    },
  },
  {
    name: 'list_page_states',
    description: 'List captured page state snapshots (ids, timestamps, urls, dom sizes). Input: none. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ==================================================================
  // Projects & knowledge system
  // ==================================================================
  {
    name: 'create_page_project',
    description:
      'Create a portable page-analysis project folder (project.json, page.json, regions/, screenshots/, dom/, commands/, diffs/, metadata/, instructions/). The DOM snapshot is captured CLEANED: MCPDOM-injected artifacts excluded, secrets redacted. Input: name, description, url/title/viewport metadata (defaults from the live page). Output: ProjectManifest. Side effect: creates files under .mcpdom_projects/<name>/.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name (folder name)' },
        description: { type: 'string' },
        url: { type: 'string', description: 'Page URL (default: live page URL)' },
        title: { type: 'string', description: 'Page title (default: live page title)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_projects',
    description: 'List page-analysis projects with manifests (names, page counts, region counts, timestamps). Input: none. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_project',
    description: 'Load a project in full: manifest, page manifest, and all region annotations. Input: projectName. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'capture_page_region',
    description:
      'Capture a page region into a project: resolves the element, captures LOCAL DOM + RELEVANT CONTEXT DOM (meaningful boundary), ranked selector candidates, fingerprint, styles, dimensions, auto-generated name and (optionally) a screenshot. Input: projectName, target/selector, user annotation fields (name, description, comment, tags), intendedChange, verification, screenshot. Output: RegionAnnotation (OBSERVED/USER/INTENDED/VERIFICATION separated). Side effect: writes region files.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Target project name' },
        target: { type: 'object', description: 'Element target specifier' },
        selector: { type: 'string', description: 'Shorthand: CSS selector' },
        name: { type: 'string', description: 'User override name (auto name preserved)' },
        description: { type: 'string', description: 'User description' },
        comment: { type: 'string', description: 'User comment, e.g. "make this collapsible"' },
        tags: { type: 'array', items: { type: 'string' } },
        behavioralNotes: { type: 'string' },
        visualNotes: { type: 'string' },
        intendedChange: { type: 'string', description: 'What the user wants changed' },
        verification: { type: 'array', items: { type: 'string' }, description: 'Success conditions' },
        screenshot: { type: 'boolean', description: 'Capture a region screenshot (default false)' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'annotate_element',
    description:
      'Annotate a live element and capture it into a project (alias of capture_page_region with annotation semantics front and center): OBSERVED element data, USER comment/name/tags, INTENDED CHANGE and VERIFICATION CONDITIONS are stored as strictly separate fields. Input: identical to capture_page_region.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        target: { type: 'object' },
        selector: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        comment: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        behavioralNotes: { type: 'string' },
        visualNotes: { type: 'string' },
        intendedChange: { type: 'string' },
        verification: { type: 'array', items: { type: 'string' } },
        screenshot: { type: 'boolean' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'list_region_annotations',
    description: 'List region annotations in a project (names, selectors, quality grades, intended changes). Input: projectName. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'get_region_annotation',
    description: 'Load one region annotation in full (observed facts, user fields, intended change, verification, quality score). Input: projectName, regionId. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        regionId: { type: 'string' },
      },
      required: ['projectName', 'regionId'],
    },
  },
  {
    name: 'update_region_annotation',
    description: 'Update the USER fields of a region annotation (name, description, comment, tags, notes, intendedChange, verification). Observed facts are never editable. Quality is recomputed. Input: projectName, regionId, updates. Side effect: rewrites the region file.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        regionId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        comment: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        behavioralNotes: { type: 'string' },
        visualNotes: { type: 'string' },
        intendedChange: { type: 'string' },
        verification: { type: 'array', items: { type: 'string' } },
      },
      required: ['projectName', 'regionId'],
    },
  },
  {
    name: 'delete_region_annotation',
    description: 'Delete a region annotation from a project. Input: projectName, regionId. Side effect: removes the region file and updates manifests.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        regionId: { type: 'string' },
      },
      required: ['projectName', 'regionId'],
    },
  },
  {
    name: 'get_region_relationship_graph',
    description:
      'Build the region relationship graph for a project: nodes (page + regions) and edges (contains, sibling-of, ancestor-of, overlaps) derived from live DOM containment. Input: projectName. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'generate_reconstruction_spec',
    description:
      'Generate (and persist) the canonical page reconstruction specification for a project: metadata, viewport, structure, regions with selector candidates, hierarchy, semantic roles, visual constraints, interactions, selectors with fallbacks, content, styles, annotations, expected modifications and verification rules — with a versioned schema. Input: projectName. Side effect: writes metadata/reconstruction-spec.json.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'export_agent_package',
    description:
      'Export a self-contained Agent handoff package for another AI agent: README.md, PROJECT.md, agent-instructions.md, project.json, pages/, regions/, snapshots/, diffs/, commands/, assets/, schemas/, verification/. The package fully separates OBSERVED FACTS / USER REQUESTS / EXPECTED CHANGES / VERIFICATION CONDITIONS. Input: projectName, outputDir (default ./mcpdom_agent_packages/<name>). Side effect: writes the package directory.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        outputDir: { type: 'string', description: 'Output directory (default ./mcpdom_agent_packages/<name>)' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'delete_project',
    description: 'Delete a project folder permanently. Input: projectName. Side effect: irreversible file removal.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'import_project',
    description: 'Import a project previously exported via export_agent_package or a project folder copy: restores manifest, page, regions, diffs and command recordings into working storage. Input: projectDir. Side effect: copies files into .mcpdom_projects.',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: { type: 'string', description: 'Path to the exported project folder' },
      },
      required: ['projectDir'],
    },
  },

  // ==================================================================
  // Security & capture hygiene
  // ==================================================================
  {
    name: 'get_redaction_rules',
    description: 'Inspect the capture redaction configuration: all rules (key patterns, value patterns, attribute patterns) with enabled flags, and capture exclusions. Input: none. Side effect: none.',
    inputSchema: {
      type: 'object', properties: {} },
  },
  {
    name: 'set_redaction_rules',
    description:
      'Configure capture redaction: enable/disable existing rules, add custom key/value/attribute patterns, or add capture exclusions (selectors never captured). Built-in rules can be disabled but never removed. Input: enable/disable ruleIds, addRule {kind, pattern, description}, addExclusion {selector, reason}. Side effect: changes capture behavior for all subsequent captures.',
    inputSchema: {
      type: 'object',
      properties: {
        enable: { type: 'array', items: { type: 'string' }, description: 'Rule ids to enable' },
        disable: { type: 'array', items: { type: 'string' }, description: 'Rule ids to disable' },
        addRule: { type: 'object', properties: { kind: { type: 'string' }, pattern: { type: 'string' }, description: { type: 'string' } }, description: 'Add a custom redaction rule' },
        addExclusion: { type: 'object', properties: { selector: { type: 'string' }, reason: { type: 'string' } }, description: 'Add a capture exclusion selector' },
      },
    },
  },

  // ==================================================================
  // Tool discovery (§44)
  // ==================================================================
  {
    name: 'get_tool_catalog',
    description:
      'Return the full MCP tool catalog with per-tool metadata: purpose, required context, accepted input, output, side effects, failure conditions, recovery strategy, and tool group. The meta-tool an agent calls FIRST to decide which tools to use. Input: optional group filter. Side effect: none.',
    inputSchema: {
      type: 'object',
      properties: {
        group: { type: 'string', description: 'Optional group filter (see get_tool_groups)' },
      },
    },
  },
  {
    name: 'get_tool_groups',
    description: 'List discoverable tool groups (inspection, targeting, interaction, viewport, javascript, mutation, sequences, session, projects, security, discovery) with descriptions and member tool names. Input: none. Side effect: none.',
    inputSchema: {
      type: 'object', properties: {} },
  },
];

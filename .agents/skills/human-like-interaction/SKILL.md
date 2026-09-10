---
name: human-like-interaction
description: Control interaction cadence with four named profiles (DETERMINISTIC/BALANCED/HUMAN_LIKE/CUSTOM) backed by a seeded PRNG, so human-like behavior is reproducible, inspectable and configurable.
version: 1.0.0
---

# Skill: Human-Like Interaction

## PURPOSE
Make automation cadence explicit and reproducible. The timing engine is a deterministic seeded PRNG (Mulberry32) plus a timing model — never untraceable random delays. Every profile, drawn delay and action timing is inspectable, satisfying the Human Mode Safety contract: traceable, configurable, deterministic by default.

## WHEN TO USE
- Interacting with rate-limited or bot-detection-sensitive UIs where machine-instant events trigger guards.
- Reproducing an interaction bug that only appears with real user timing (hesitation, slow typing).
- Making recorded demos/replays feel human.
- The opposite: pinning DETERMINISTIC to guarantee identical timings across replay and regression runs.
- Comparing two automation runs byte-for-byte in a report — the seed makes timing a controlled variable.

## PREREQUISITES
- MCP server running; interactions dispatch in the extension or Node simulation context.
- Default profile is DETERMINISTIC (zero delay) — legacy behavior is preserved until you opt in.

## WORKFLOW
1. `set_interaction_profile {profile}` — choose the mode for all subsequent interactions:
   - `DETERMINISTIC` — zero delays everywhere, one trajectory step; fully reproducible.
   - `BALANCED` — small natural delays (move 30–80ms, click 40–120ms, type 20–60ms, key 30–90ms), hesitation 0.08, 3 trajectory steps, seed 1337. Routine automation against rate-limited UIs.
   - `HUMAN_LIKE` — realistic cadence (move 90–260ms, click 120–420ms, type 60–180ms, key 70–220ms), hesitation 0.22 with 300–900ms pauses, 8-step curved trajectories, seed 4242.
2. For exact control use `CUSTOM` with `custom` overrides: `moveDelayMs`, `clickDelayMs`, `typeDelayMs`, `keyDelayMs` ({min,max}), `hesitationProbability`, `trajectorySteps` — unspecified fields fall back to BALANCED values.
3. Pass `seed` (here or with any profile) to make every drawn delay reproducible: identical seed + identical action order ⇒ identical timings.
4. Drive interactions normally (browser-interaction skill) — `click_element {mode: "human-like"}` consumes the active profile; typing draws per-character delays; pointer moves follow slightly-curved smoothstep-eased waypoints, never teleporting.
5. `get_interaction_profile {}` — audit: `activeProfile`, full effective `profile` (all timing ranges), `availableProfiles`, and `lastActionTiming` (action, `requestedMode` vs `actualMode`, per-phase `timings[]`, `totalDurationMs`).
6. Compare runs: same seed ⇒ same `timings` arrays; different seed ⇒ new draw from the same distribution. A profile switch resets the RNG to that profile's seed.

## TOOLS
`set_interaction_profile`, `get_interaction_profile`, `click_element`, `type_text`, `press_keyboard_shortcut`, `hover_element`, `drag_and_drop`

## EXAMPLES
```
tools/call set_interaction_profile { "profile": "HUMAN_LIKE" }
tools/call set_interaction_profile { "profile": "HUMAN_LIKE", "seed": 90210 }
tools/call set_interaction_profile { "profile": "CUSTOM", "custom": { "clickDelayMs": { "min": 150, "max": 300 }, "typeDelayMs": { "min": 40, "max": 90 }, "hesitationProbability": 0.1, "trajectorySteps": 5 } }
tools/call click_element { "selector": "#buy-now", "mode": "human-like" }
tools/call get_interaction_profile {}
```

## FAILURE MODES
- **Unknown profile name** — the engine throws listing the four valid names; check spelling/case (names are uppercase).
- **Timings look random across runs** — you did not pin a `seed`, or you switched profiles (which resets to that profile's default seed).
- **Tests slowed down** — HUMAN_LIKE adds up to ~420ms per click and per-character typing delays; use DETERMINISTIC or BALANCED in regression contexts.
- **"Human-like didn't run"** — `click_element` mode defaults to `normal`; the profile only shapes timing when the action honors it (mode `human-like` or CUSTOM/HUMAN_LIKE active). Check `lastActionTiming.actualMode`.

## VALIDATION
- `get_interaction_profile` returns the effective profile with concrete min/max ranges — not just the name.
- `lastActionTiming` must show `requestedMode`, `actualMode`, a `timings` array (one entry per phase) and `totalDurationMs` consistent with the sum.
- Reproducibility check: re-run the same action with the same seed; `timings` should match exactly.

## RECOVERY
- Unwanted cadence: `set_interaction_profile { "profile": "DETERMINISTIC" }` restores zero-delay behavior immediately.
- Skewed distribution after long sessions: re-set the profile (or re-send the seed) to reset the PRNG state.
- If a site still flags automation, remember the platform does not spoof fingerprints/UA here — combine with `emulate_device` and honest reporting of what is and is not applied.

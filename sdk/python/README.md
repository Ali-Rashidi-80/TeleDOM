# TeleDOM Python SDK

**Level 2 — Bot → SDK → Browser Runtime.** Semantic browser programming over
the same runtime the MCP surface uses. Pure stdlib, zero dependencies.

> TeleDOM تصمیم‌گیرنده نیست؛ TeleDOM توان‌دهنده است.
> Agent مغز است. TeleDOM دست، چشم، حافظه و جعبه‌ابزار مرورگر است.

## Install

```bash
# from the repository root
cd sdk/python
pip install .          # or: export PYTHONPATH=$PWD
```

Requires Node.js ≥ 20 (the SDK spawns `bin/mcp-server.js` automatically).

## The 30-second tour

```python
from teldom import Browser, Workflow, TargetMemory

with Browser() as browser:                    # spawns + connects TeleDOM
    browser.navigate("https://example.com")   # ANY site — no API required
    browser.inspect()                         # observe the page
    hits = browser.query("Comments")          # find elements by text
    target = browser.find(selector="#reply")  # canonical TARGET + confidence
    browser.click(target["result"]["selector"] if isinstance(target, dict) else "#reply")
    browser.type("#reply", "hello")
    browser.verify("#sent")
```

## Agent-owned workflows (teach once, reuse forever)

```python
wf = Workflow("extension_smoke_test", description="Regression test for my extension")
wf.input("cta", "primary CTA selector", default="#primary-action-btn")
wf.step("verify", "td_target_check", args={"selector": "{{inputs.cta}}"})
wf.step("click",  "td_action_click",  args={"selector": "{{inputs.cta}}"})
wf.step("assert", "td_execute_script", args={"code": 'return !!document.querySelector("#done");'})
wf.save("1.0.0")

run = wf.run()                 # ONE MCP call executes the whole robot
print(run["run"]["status"])    # SUCCESS
print(run["run"]["metrics"])   # toolCalls / domScans / duration / tokensSaved

wf.replay(run["runId"])        # deterministic re-execution of the record
```

TeleDOM **stores and executes** workflows dumbly (policy gates, deterministic
records, replay). **You** own the design, the edits, the versioning and the
repairs — TeleDOM never interprets them.

## Target memory (no DOM re-analysis every run)

```python
mem = TargetMemory()
mem.save("example.com", "comments_tab", css='[data-testid="comments"]',
         identity={"role": "tab", "accessibleName": "Comments"}, confidence=0.95)

target = mem.get("example.com", "comments_tab")["target"]
browser.verify(target["locators"]["css"])     # cheap check, no full scan
# UI changed? repair path:
#   browser.find(text="Comments") → describe() → mem.save(new locator)
```

## Execution policy (capability ≠ authorization)

```python
wf = Workflow("publish_posts", policy={
    "allowedTools": ["td_*"],          # tool patterns
    "deniedTools":  ["*delete*"],
    "requireApprovalFor": ["td_action_type"],  # human-in-the-loop
    "allowedDomains": ["example.com"],
    "maxSteps": 50, "maxRuntimeMs": 120000,
})
run = wf.run()   # BLOCKED + pendingApprovals (TeleDOM never auto-approves)
run = wf.run(approved_steps=["publish"])  # after the human said yes
```

## Full tool surface (all 350 tools)

```python
browser.tool("td_cause_trace", {"sessionId": "s1"})   # any MCP tool
```

## Tests

```bash
python3 sdk/python/test_sdk.py                   # 17 checks
python3 sdk/python/examples/extension_smoke_test.py   # the golden demo
```

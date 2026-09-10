import * as http from "http";
import { WebSocket, WebSocketServer } from "ws";
import * as fs from "fs";
import fs__default from "fs";
import * as path from "path";
import path__default from "path";
import * as readline from "readline";
class SessionSerializer {
  static exportBundle(metadata, initialSnapshot, events, checkpoints, annotations = []) {
    return {
      schemaVersion: "2.0.0",
      exportedAt: Date.now(),
      metadata: { ...metadata },
      initialSnapshot: { ...initialSnapshot },
      events: [...events].sort((a, b) => a.sequence - b.sequence),
      checkpoints: [...checkpoints].sort((a, b) => a.sequence - b.sequence),
      annotations: [...annotations]
    };
  }
  static exportToJson(bundle, pretty = false) {
    return JSON.stringify(bundle, null, pretty ? 2 : void 0);
  }
  static importFromJson(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      throw new Error(`Failed to parse JSON recording: ${err.message}`);
    }
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid recording format: root must be an object");
    }
    if (!parsed.metadata || !parsed.metadata.id) {
      throw new Error("Invalid recording format: missing session metadata");
    }
    if (!parsed.initialSnapshot || !parsed.initialSnapshot.nodes) {
      throw new Error("Invalid recording format: missing initial DOM snapshot");
    }
    if (!Array.isArray(parsed.events)) {
      parsed.events = [];
    }
    if (!Array.isArray(parsed.checkpoints)) {
      parsed.checkpoints = [];
    }
    if (!Array.isArray(parsed.annotations)) {
      parsed.annotations = [];
    }
    return parsed;
  }
  static validateIntegrity(bundle) {
    const errors = [];
    const warnings = [];
    const missingSequences = [];
    const corruptNodeReferences = [];
    const metadata = bundle.metadata;
    const events = bundle.events || [];
    const checkpoints = bundle.checkpoints || [];
    const initialSnapshot = bundle.initialSnapshot;
    if (!metadata || !metadata.id) {
      errors.push("Missing session metadata or session ID");
    }
    const hasInitialSnapshot = !!initialSnapshot && !!initialSnapshot.nodes;
    if (!hasInitialSnapshot) {
      errors.push("Initial baseline snapshot is missing");
    }
    let isMonotonic = true;
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      if (typeof evt.sequence !== "number" || evt.sequence <= 0) {
        errors.push(`Event at index ${i} has invalid sequence: ${evt.sequence}`);
        isMonotonic = false;
      }
      if (i > 0 && evt.sequence <= events[i - 1].sequence) {
        errors.push(`Non-increasing sequence at index ${i}: prev=${events[i - 1].sequence}, curr=${evt.sequence}`);
        isMonotonic = false;
      }
    }
    if (hasInitialSnapshot) {
      for (const [idStr, node] of Object.entries(initialSnapshot.nodes)) {
        if (node.children) {
          for (const childId of node.children) {
            if (!initialSnapshot.nodes[childId]) {
              corruptNodeReferences.push(childId);
              warnings.push(`Initial snapshot node ${idStr} references non-existent child ID ${childId}`);
            }
          }
        }
      }
    }
    return {
      isValid: errors.length === 0,
      sessionId: metadata?.id || "unknown",
      schemaVersion: bundle.schemaVersion || "unknown",
      totalEvents: events.length,
      totalCheckpoints: checkpoints.length,
      isSequenceMonotonic: isMonotonic,
      missingSequences,
      corruptNodeReferences,
      hasInitialSnapshot,
      errors,
      warnings
    };
  }
}
class FileStorageProvider {
  baseDir;
  constructor(baseDir = "./.forensic_sessions") {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }
  getSessionDir(sessionId) {
    const dir = path.join(this.baseDir, sessionId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
  async saveSession(metadata) {
    const dir = this.getSessionDir(metadata.id);
    const metaPath = path.join(dir, "metadata.json");
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
  }
  async getSession(sessionId) {
    const dir = path.join(this.baseDir, sessionId);
    const metaPath = path.join(dir, "metadata.json");
    if (!fs.existsSync(metaPath)) return null;
    try {
      const data = fs.readFileSync(metaPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  async listSessions() {
    if (!fs.existsSync(this.baseDir)) return [];
    const entries = fs.readdirSync(this.baseDir, { withFileTypes: true });
    const sessions = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metaPath = path.join(this.baseDir, entry.name, "metadata.json");
        if (fs.existsSync(metaPath)) {
          try {
            const data = fs.readFileSync(metaPath, "utf-8");
            sessions.push(JSON.parse(data));
          } catch {
          }
        }
      }
    }
    return sessions.sort((a, b) => b.startTime - a.startTime);
  }
  async deleteSession(sessionId) {
    const dir = path.join(this.baseDir, sessionId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      return true;
    }
    return false;
  }
  async appendEvents(sessionId, events) {
    if (events.length === 0) return;
    const dir = this.getSessionDir(sessionId);
    const eventsPath = path.join(dir, "events.jsonl");
    const lines = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
    fs.appendFileSync(eventsPath, lines, "utf-8");
  }
  async getEvents(sessionId, filter) {
    const dir = path.join(this.baseDir, sessionId);
    const eventsPath = path.join(dir, "events.jsonl");
    if (!fs.existsSync(eventsPath)) return [];
    const fileStream = fs.createReadStream(eventsPath, { encoding: "utf-8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    const results = [];
    let matchedCount = 0;
    const offset = typeof filter?.offset === "number" ? filter.offset : 0;
    const limit = typeof filter?.limit === "number" ? filter.limit : Infinity;
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let e;
      try {
        e = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (filter) {
        if (filter.category && e.category !== filter.category) continue;
        if (filter.type && e.type !== filter.type) continue;
        if (typeof filter.fromTimestamp === "number" && e.timestamp < filter.fromTimestamp) continue;
        if (typeof filter.toTimestamp === "number" && e.timestamp > filter.toTimestamp) continue;
        if (typeof filter.fromSequence === "number" && e.sequence < filter.fromSequence) continue;
        if (typeof filter.toSequence === "number" && e.sequence > filter.toSequence) continue;
        if (typeof filter.targetNodeId === "number" && e.targetNodeId !== filter.targetNodeId) continue;
        if (filter.targetSelector && e.targetSelector && !e.targetSelector.includes(filter.targetSelector)) continue;
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          const strPayload = JSON.stringify(e.payload || {}).toLowerCase();
          if (!strPayload.includes(query) && !e.type.toLowerCase().includes(query)) {
            continue;
          }
        }
      }
      matchedCount++;
      if (matchedCount <= offset) {
        continue;
      }
      results.push(e);
      if (results.length >= limit) {
        rl.close();
        fileStream.destroy();
        break;
      }
    }
    return results;
  }
  async getEventCount(sessionId) {
    const dir = path.join(this.baseDir, sessionId);
    const eventsPath = path.join(dir, "events.jsonl");
    if (!fs.existsSync(eventsPath)) return 0;
    const fileStream = fs.createReadStream(eventsPath, { encoding: "utf-8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    let count = 0;
    for await (const line of rl) {
      if (line.trim()) count++;
    }
    return count;
  }
  async saveCheckpoint(checkpoint) {
    const dir = this.getSessionDir(checkpoint.sessionId);
    const chkDir = path.join(dir, "checkpoints");
    if (!fs.existsSync(chkDir)) fs.mkdirSync(chkDir, { recursive: true });
    const file = path.join(chkDir, `${checkpoint.checkpointId}.json`);
    fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2), "utf-8");
  }
  async getCheckpoints(sessionId) {
    const dir = path.join(this.baseDir, sessionId, "checkpoints");
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    const checkpoints = [];
    for (const f of files) {
      try {
        const data = fs.readFileSync(path.join(dir, f), "utf-8");
        checkpoints.push(JSON.parse(data));
      } catch {
      }
    }
    return checkpoints.sort((a, b) => a.sequence - b.sequence);
  }
  async saveInitialSnapshot(sessionId, snapshot) {
    const dir = this.getSessionDir(sessionId);
    const file = path.join(dir, "initial_snapshot.json");
    fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), "utf-8");
  }
  async getInitialSnapshot(sessionId) {
    const dir = path.join(this.baseDir, sessionId);
    const file = path.join(dir, "initial_snapshot.json");
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return null;
    }
  }
  async addAnnotation(annotation) {
    const dir = this.getSessionDir(annotation.sessionId);
    const annPath = path.join(dir, "annotations.json");
    let list = [];
    if (fs.existsSync(annPath)) {
      try {
        list = JSON.parse(fs.readFileSync(annPath, "utf-8"));
      } catch {
        list = [];
      }
    }
    list.push(annotation);
    fs.writeFileSync(annPath, JSON.stringify(list, null, 2), "utf-8");
  }
  async getAnnotations(sessionId) {
    const dir = path.join(this.baseDir, sessionId);
    const annPath = path.join(dir, "annotations.json");
    if (!fs.existsSync(annPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(annPath, "utf-8"));
    } catch {
      return [];
    }
  }
}
class CheckpointManager {
  checkpoints = [];
  constructor(initialCheckpoints = []) {
    this.checkpoints = [...initialCheckpoints].sort((a, b) => a.sequence - b.sequence);
  }
  addCheckpoint(checkpoint) {
    this.checkpoints.push(checkpoint);
    this.checkpoints.sort((a, b) => a.sequence - b.sequence);
  }
  getCheckpoints() {
    return this.checkpoints;
  }
  getCheckpointCount() {
    return this.checkpoints.length;
  }
  getCheckpoint(checkpointId) {
    return this.checkpoints.find((c) => c.checkpointId === checkpointId);
  }
  findNearestCheckpoint(target) {
    if (this.checkpoints.length === 0) return null;
    if (typeof target.sequence === "number") {
      const targetSeq = target.sequence;
      let best = this.checkpoints[0];
      for (let i = 0; i < this.checkpoints.length; i++) {
        const cp = this.checkpoints[i];
        if (cp.sequence <= targetSeq) {
          best = cp;
        } else {
          break;
        }
      }
      return best;
    }
    if (typeof target.timestamp === "number") {
      const targetTime = target.timestamp;
      let best = this.checkpoints[0];
      for (let i = 0; i < this.checkpoints.length; i++) {
        const cp = this.checkpoints[i];
        if (cp.timestamp <= targetTime) {
          best = cp;
        } else {
          break;
        }
      }
      return best;
    }
    return this.checkpoints[0] || null;
  }
  clear() {
    this.checkpoints = [];
  }
}
var VirtualDOMNodeType = /* @__PURE__ */ ((VirtualDOMNodeType2) => {
  VirtualDOMNodeType2[VirtualDOMNodeType2["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["ATTRIBUTE_NODE"] = 2] = "ATTRIBUTE_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["TEXT_NODE"] = 3] = "TEXT_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["CDATA_SECTION_NODE"] = 4] = "CDATA_SECTION_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["PROCESSING_INSTRUCTION_NODE"] = 7] = "PROCESSING_INSTRUCTION_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["COMMENT_NODE"] = 8] = "COMMENT_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["DOCUMENT_TYPE_NODE"] = 10] = "DOCUMENT_TYPE_NODE";
  VirtualDOMNodeType2[VirtualDOMNodeType2["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
  return VirtualDOMNodeType2;
})(VirtualDOMNodeType || {});
class VirtualTreeBuilder {
  nodes = {};
  rootId;
  constructor(initialNodes = {}, rootId = 1) {
    this.rootId = rootId;
    this.loadFromNodes(initialNodes);
  }
  getRootId() {
    return this.rootId;
  }
  setRootId(rootId) {
    this.rootId = rootId;
  }
  getNodes() {
    return this.nodes;
  }
  getNode(id) {
    return this.nodes[id];
  }
  hasNode(id) {
    return !!this.nodes[id];
  }
  loadFromNodes(sourceNodes) {
    this.nodes = {};
    for (const [key, node] of Object.entries(sourceNodes)) {
      const id = Number(key);
      this.nodes[id] = {
        ...node,
        attributes: node.attributes ? { ...node.attributes } : {},
        children: node.children ? [...node.children] : [],
        computedStyles: node.computedStyles ? { ...node.computedStyles } : void 0,
        boundingClientRect: node.boundingClientRect ? { ...node.boundingClientRect } : void 0
      };
    }
  }
  clone() {
    const cloned = new VirtualTreeBuilder({}, this.rootId);
    cloned.loadFromNodes(this.nodes);
    return cloned;
  }
  applyAdd(payload) {
    const node = payload.node;
    if (!node) return;
    this.addNodeRecursive(node);
    const parentId = payload.parentId;
    if (parentId && this.nodes[parentId]) {
      const parent = this.nodes[parentId];
      if (!parent.children) parent.children = [];
      node.parentId = parentId;
      const existingIdx = parent.children.indexOf(node.id);
      if (existingIdx !== -1) {
        parent.children.splice(existingIdx, 1);
      }
      if (payload.previousSiblingId && this.nodes[payload.previousSiblingId]) {
        const prevIdx = parent.children.indexOf(payload.previousSiblingId);
        if (prevIdx !== -1) {
          parent.children.splice(prevIdx + 1, 0, node.id);
          return;
        }
      }
      if (payload.nextSiblingId && this.nodes[payload.nextSiblingId]) {
        const nextIdx = parent.children.indexOf(payload.nextSiblingId);
        if (nextIdx !== -1) {
          parent.children.splice(nextIdx, 0, node.id);
          return;
        }
      }
      if (typeof payload.index === "number" && payload.index >= 0 && payload.index <= parent.children.length) {
        parent.children.splice(payload.index, 0, node.id);
      } else {
        parent.children.push(node.id);
      }
    }
  }
  applyRemove(payload) {
    const nodeId = payload.nodeId;
    const node = this.nodes[nodeId];
    if (!node) return;
    const parentId = payload.parentId || node.parentId;
    if (parentId && this.nodes[parentId]) {
      const parent = this.nodes[parentId];
      if (parent.children) {
        const idx = parent.children.indexOf(nodeId);
        if (idx !== -1) {
          parent.children.splice(idx, 1);
        }
      }
    }
    this.markSubtreeDetached(nodeId);
    node.parentId = null;
  }
  markSubtreeDetached(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return;
    node.isDetached = true;
    if (node.children && node.children.length > 0) {
      for (const childId of node.children) {
        this.markSubtreeDetached(childId);
      }
    }
  }
  applyMove(payload) {
    const node = this.nodes[payload.nodeId];
    if (!node) return;
    const oldParentId = payload.oldParentId || node.parentId;
    if (oldParentId && this.nodes[oldParentId]) {
      const oldParent = this.nodes[oldParentId];
      if (oldParent.children) {
        const idx = oldParent.children.indexOf(payload.nodeId);
        if (idx !== -1) {
          oldParent.children.splice(idx, 1);
        }
      }
    }
    const newParentId = payload.newParentId;
    if (newParentId && this.nodes[newParentId]) {
      const newParent = this.nodes[newParentId];
      if (!newParent.children) newParent.children = [];
      node.parentId = newParentId;
      node.isDetached = false;
      if (typeof payload.newIndex === "number" && payload.newIndex >= 0 && payload.newIndex <= newParent.children.length) {
        newParent.children.splice(payload.newIndex, 0, payload.nodeId);
      } else {
        newParent.children.push(payload.nodeId);
      }
    }
  }
  applyAttrChange(payload) {
    const node = this.nodes[payload.nodeId];
    if (!node) return;
    if (!node.attributes) {
      node.attributes = {};
    }
    if (payload.newValue === null) {
      delete node.attributes[payload.attributeName];
    } else {
      node.attributes[payload.attributeName] = payload.newValue;
    }
    if (payload.attributeName.toLowerCase() === "class") {
      const classVal = payload.newValue || "";
      if (/\b(hidden|hide|d-none|invisible|sr-only|collapsed)\b/i.test(classVal)) {
        node.isHidden = true;
      }
    } else if (payload.attributeName.toLowerCase() === "style") {
      const styleVal = payload.newValue || "";
      if (/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/i.test(styleVal)) {
        node.isHidden = true;
      }
    }
  }
  applyTextChange(payload) {
    const node = this.nodes[payload.nodeId];
    if (!node) return;
    node.textContent = payload.newText;
  }
  addNodeRecursive(node) {
    this.nodes[node.id] = {
      ...node,
      attributes: node.attributes ? { ...node.attributes } : {},
      children: node.children ? [...node.children] : [],
      isDetached: false
    };
  }
  toHTML(nodeId = this.rootId, indent = 0) {
    const node = this.nodes[nodeId];
    if (!node) return "";
    const spacing = "  ".repeat(indent);
    if (node.nodeType === VirtualDOMNodeType.DOCUMENT_NODE) {
      return (node.children || []).map((c) => this.toHTML(c, indent)).join("\n");
    }
    if (node.nodeType === VirtualDOMNodeType.DOCUMENT_TYPE_NODE) {
      return `<!DOCTYPE ${node.tagName || "html"}>`;
    }
    if (node.isShadowRoot || node.nodeType === VirtualDOMNodeType.DOCUMENT_FRAGMENT_NODE) {
      const mode = node.shadowMode || "open";
      const inner = (node.children || []).map((c) => this.toHTML(c, indent + 1)).join("\n");
      return `${spacing}<template shadowrootmode="${mode}">
${inner}
${spacing}</template>`;
    }
    if (node.nodeType === VirtualDOMNodeType.TEXT_NODE) {
      return node.textContent || "";
    }
    if (node.nodeType === VirtualDOMNodeType.COMMENT_NODE) {
      return `${spacing}<!-- ${node.textContent || ""} -->`;
    }
    if (node.nodeType === VirtualDOMNodeType.ELEMENT_NODE) {
      const tag = node.tagName || "div";
      const attrs = Object.entries(node.attributes || {}).map(([k, v]) => `${k}="${this.escapeHtmlAttr(v)}"`).join(" ");
      const attrStr = attrs.length > 0 ? ` ${attrs}` : "";
      const isSelfClosing = ["img", "br", "hr", "input", "meta", "link"].includes(tag);
      if (isSelfClosing) {
        return `${spacing}<${tag}${attrStr} />`;
      }
      const children = node.children || [];
      if (children.length === 0) {
        if (node.textContent) {
          return `${spacing}<${tag}${attrStr}>${this.escapeHtmlText(node.textContent)}</${tag}>`;
        }
        return `${spacing}<${tag}${attrStr}></${tag}>`;
      }
      if (children.length === 1 && this.nodes[children[0]]?.nodeType === VirtualDOMNodeType.TEXT_NODE) {
        const text = this.nodes[children[0]].textContent || "";
        return `${spacing}<${tag}${attrStr}>${this.escapeHtmlText(text)}</${tag}>`;
      }
      const inner = children.map((c) => this.toHTML(c, indent + 1)).join("\n");
      return `${spacing}<${tag}${attrStr}>
${inner}
${spacing}</${tag}>`;
    }
    return "";
  }
  escapeHtmlAttr(str) {
    return str.replace(/"/g, "&quot;");
  }
  escapeHtmlText(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
class StateReconstructor {
  checkpointManager;
  events = [];
  cache = /* @__PURE__ */ new Map();
  maxCacheSize = 50;
  constructor(checkpoints = [], events = []) {
    this.checkpointManager = new CheckpointManager(checkpoints);
    this.events = [...events].sort((a, b) => a.sequence - b.sequence);
  }
  setCheckpoints(checkpoints) {
    this.checkpointManager = new CheckpointManager(checkpoints);
    this.cache.clear();
  }
  setEvents(events) {
    this.events = [...events].sort((a, b) => a.sequence - b.sequence);
    this.cache.clear();
  }
  addEvent(event) {
    this.events.push(event);
    this.cache.clear();
  }
  addCheckpoint(checkpoint) {
    this.checkpointManager.addCheckpoint(checkpoint);
    this.cache.clear();
  }
  getStateAt(target) {
    let targetSequence = target.sequence;
    let targetTimestamp = target.timestamp;
    if (target.eventId) {
      const foundEvt = this.events.find((e) => e.id === target.eventId);
      if (foundEvt) {
        targetSequence = foundEvt.sequence;
        targetTimestamp = foundEvt.timestamp;
      }
    }
    if (typeof targetSequence !== "number" && typeof targetTimestamp === "number") {
      const eventsBefore = this.events.filter((e) => e.timestamp <= targetTimestamp);
      targetSequence = eventsBefore.length > 0 ? eventsBefore[eventsBefore.length - 1].sequence : 0;
    }
    const effectiveSequence = targetSequence || 0;
    if (this.cache.has(effectiveSequence)) {
      return this.cache.get(effectiveSequence);
    }
    const checkpoint = this.checkpointManager.findNearestCheckpoint({ sequence: effectiveSequence });
    if (!checkpoint) {
      return {
        snapshotId: "snap_empty",
        sessionId: "",
        timestamp: 0,
        sequence: 0,
        rootId: 1,
        nodes: {
          1: { id: 1, nodeType: 9, tagName: "#document", children: [], parentId: null }
        },
        title: "",
        url: "",
        origin: "",
        viewport: { width: 1920, height: 1080, scrollX: 0, scrollY: 0, devicePixelRatio: 1 },
        totalNodeCount: 1
      };
    }
    const treeBuilder = new VirtualTreeBuilder(checkpoint.snapshot.nodes, checkpoint.snapshot.rootId);
    const deltaEvents = this.events.filter(
      (e) => e.sequence > checkpoint.sequence && e.sequence <= effectiveSequence
    );
    let currentUrl = checkpoint.snapshot.url;
    let currentTitle = checkpoint.snapshot.title;
    for (let i = 0; i < deltaEvents.length; i++) {
      const evt = deltaEvents[i];
      switch (evt.type) {
        case "DOM_MUTATION_ADD":
          treeBuilder.applyAdd(evt.payload);
          break;
        case "DOM_MUTATION_REMOVE":
          treeBuilder.applyRemove(evt.payload);
          break;
        case "DOM_MUTATION_MOVE":
          treeBuilder.applyMove(evt.payload);
          break;
        case "DOM_MUTATION_ATTR":
          treeBuilder.applyAttrChange(evt.payload);
          break;
        case "DOM_MUTATION_TEXT":
          treeBuilder.applyTextChange(evt.payload);
          break;
        case "NAV_PUSH_STATE":
        case "NAV_REPLACE_STATE":
        case "NAV_POPSTATE":
        case "NAV_HASHCHANGE":
          if (evt.payload.url) currentUrl = evt.payload.url;
          if (evt.payload.title) currentTitle = evt.payload.title;
          break;
      }
    }
    const reconstructedNodes = treeBuilder.getNodes();
    const activeNodesCount = Object.values(reconstructedNodes).filter((n) => !n.isDetached).length;
    const resultSnapshot = {
      snapshotId: `recon_${effectiveSequence}_${Date.now()}`,
      sessionId: checkpoint.sessionId,
      timestamp: targetTimestamp ?? checkpoint.timestamp,
      sequence: effectiveSequence,
      rootId: treeBuilder.getRootId(),
      nodes: reconstructedNodes,
      title: currentTitle,
      url: currentUrl,
      origin: checkpoint.snapshot.origin,
      viewport: { ...checkpoint.snapshot.viewport },
      doctype: checkpoint.snapshot.doctype,
      totalNodeCount: activeNodesCount
    };
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) this.cache.delete(firstKey);
    }
    this.cache.set(effectiveSequence, resultSnapshot);
    return resultSnapshot;
  }
  getStateAround(timestamp, windowMs = 200) {
    const tBefore = Math.max(0, timestamp - windowMs);
    const tAfter = timestamp + windowMs;
    return {
      stateBefore: this.getStateAt({ timestamp: tBefore }),
      stateTarget: this.getStateAt({ timestamp }),
      stateAfter: this.getStateAt({ timestamp: tAfter })
    };
  }
}
class VirtualQueryEngine {
  static matches(node, selector) {
    if (!node || node.nodeType !== VirtualDOMNodeType.ELEMENT_NODE) {
      return false;
    }
    const trimmed = selector.trim();
    if (!trimmed) return false;
    if (trimmed.includes(",")) {
      return trimmed.split(",").some((s) => this.matchesSimple(node, s.trim()));
    }
    return this.matchesCompound(node, trimmed);
  }
  static querySelector(selector, rootId, nodes) {
    const all = this.querySelectorAll(selector, rootId, nodes, 1);
    return all.length > 0 ? all[0] : null;
  }
  static querySelectorAll(selector, rootId, nodes, limit = Infinity) {
    const results = [];
    const root = nodes[rootId];
    if (!root) return results;
    const queue = [...root.children || []];
    const visited = /* @__PURE__ */ new Set();
    while (queue.length > 0 && results.length < limit) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const currentNode = nodes[currentId];
      if (!currentNode || currentNode.isDetached) continue;
      if (currentNode.nodeType === VirtualDOMNodeType.ELEMENT_NODE) {
        if (this.matches(currentNode, selector)) {
          results.push(currentNode);
          if (results.length >= limit) break;
        }
      }
      if (currentNode.children && currentNode.children.length > 0) {
        queue.push(...currentNode.children);
      }
    }
    return results;
  }
  static getElementById(id, nodes) {
    for (const node of Object.values(nodes)) {
      if (node.nodeType === VirtualDOMNodeType.ELEMENT_NODE && !node.isDetached && node.attributes && node.attributes["id"] === id && this.isNodeConnected(node, nodes)) {
        return node;
      }
    }
    return null;
  }
  static isNodeConnected(node, nodes) {
    if (node.isDetached) return false;
    let curr = node;
    const visited = /* @__PURE__ */ new Set();
    while (curr && curr.parentId) {
      if (visited.has(curr.id)) return false;
      visited.add(curr.id);
      const parent = nodes[curr.parentId];
      if (!parent || parent.isDetached) return false;
      curr = parent;
    }
    return true;
  }
  static computeSelector(node, nodes) {
    if (!node) return "";
    if (node.nodeType !== VirtualDOMNodeType.ELEMENT_NODE) {
      return node.tagName || `#node-${node.id}`;
    }
    if (node.attributes?.["id"]) {
      return `#${node.attributes["id"]}`;
    }
    const tagName = node.tagName || "div";
    const classes = (node.attributes?.["class"] || "").split(/\s+/).filter((c) => c && !c.startsWith("ng-")).slice(0, 2);
    const classStr = classes.length > 0 ? "." + classes.join(".") : "";
    if (node.parentId && nodes[node.parentId]) {
      const parent = nodes[node.parentId];
      const siblings = (parent.children || []).map((cId) => nodes[cId]).filter((c) => c && c.nodeType === VirtualDOMNodeType.ELEMENT_NODE && c.tagName === tagName);
      if (siblings.length > 1) {
        const index = siblings.findIndex((s) => s.id === node.id) + 1;
        return `${tagName}${classStr}:nth-of-type(${index})`;
      }
    }
    return `${tagName}${classStr}`;
  }
  static matchesCompound(node, selector) {
    return this.matchesSimple(node, selector);
  }
  static matchesSimple(node, selector) {
    const tagName = node.tagName?.toLowerCase() || "";
    if (selector === "*") return true;
    if (selector.startsWith("#")) {
      const targetId = selector.substring(1);
      return node.attributes?.["id"] === targetId;
    }
    if (selector.startsWith(".")) {
      const targetClass = selector.substring(1);
      const classes = (node.attributes?.["class"] || "").split(/\s+/);
      return classes.includes(targetClass);
    }
    if (selector.startsWith("[") && selector.endsWith("]")) {
      const inner = selector.substring(1, selector.length - 1);
      if (inner.includes("=")) {
        const [attrName, rawVal] = inner.split("=");
        const expectedVal = rawVal.replace(/^["']|["']$/g, "");
        return node.attributes?.[attrName.trim()] === expectedVal;
      }
      return !!node.attributes?.[inner.trim()];
    }
    const tagMatch = selector.match(/^([a-zA-Z0-9_-]+)(.*)$/);
    if (tagMatch) {
      const expectedTag = tagMatch[1].toLowerCase();
      const rest = tagMatch[2];
      if (expectedTag !== tagName && expectedTag !== "*") {
        return false;
      }
      if (!rest) return true;
      if (rest.startsWith("#")) {
        return node.attributes?.["id"] === rest.substring(1);
      }
      if (rest.startsWith(".")) {
        const classes = (node.attributes?.["class"] || "").split(/\s+/);
        return classes.includes(rest.substring(1));
      }
      if (rest.startsWith("[")) {
        return this.matchesSimple(node, rest);
      }
    }
    return false;
  }
}
class DOMDiffEngine {
  static diff(s1, s2) {
    const addedNodes = [];
    const removedNodes = [];
    const movedNodes = [];
    const changedAttributes = [];
    const changedClasses = [];
    const changedStyles = [];
    const changedText = [];
    const nodes1 = s1.nodes;
    const nodes2 = s2.nodes;
    const ids1 = new Set(
      Object.values(nodes1).filter((n) => !n.isDetached).map((n) => n.id)
    );
    const ids2 = new Set(
      Object.values(nodes2).filter((n) => !n.isDetached).map((n) => n.id)
    );
    for (const id of ids2) {
      if (!ids1.has(id)) {
        const node2 = nodes2[id];
        if (node2) {
          const selector = VirtualQueryEngine.computeSelector(node2, nodes2);
          addedNodes.push({
            id,
            tagName: node2.tagName,
            parentId: node2.parentId,
            attributes: node2.attributes,
            textContent: node2.textContent,
            selector,
            htmlSnippet: this.renderNodeSnippet(node2),
            node: node2
          });
        }
      }
    }
    for (const id of ids1) {
      if (!ids2.has(id)) {
        const node1 = nodes1[id];
        if (node1) {
          const selector = VirtualQueryEngine.computeSelector(node1, nodes1);
          removedNodes.push({
            id,
            tagName: node1.tagName,
            lastKnownParentId: node1.parentId,
            selector,
            attributes: node1.attributes,
            textContent: node1.textContent
          });
        }
      }
    }
    for (const id of ids1) {
      if (!ids2.has(id)) continue;
      const node1 = nodes1[id];
      const node2 = nodes2[id];
      if (!node1 || !node2) continue;
      const selector = VirtualQueryEngine.computeSelector(node2, nodes2);
      if (node1.parentId !== node2.parentId) {
        const p1 = node1.parentId ? nodes1[node1.parentId] : null;
        const p2 = node2.parentId ? nodes2[node2.parentId] : null;
        const oldIndex = p1 && p1.children ? p1.children.indexOf(id) : -1;
        const newIndex = p2 && p2.children ? p2.children.indexOf(id) : -1;
        movedNodes.push({
          id,
          tagName: node2.tagName,
          oldParentId: node1.parentId,
          newParentId: node2.parentId,
          oldIndex,
          newIndex,
          selector
        });
      }
      if (node1.nodeType === VirtualDOMNodeType.TEXT_NODE) {
        if ((node1.textContent || "") !== (node2.textContent || "")) {
          const parentNode = node2.parentId ? nodes2[node2.parentId] : void 0;
          changedText.push({
            nodeId: id,
            parentId: node2.parentId,
            parentSelector: parentNode ? VirtualQueryEngine.computeSelector(parentNode, nodes2) : void 0,
            oldText: node1.textContent || "",
            newText: node2.textContent || ""
          });
        }
      }
      if (node1.nodeType === VirtualDOMNodeType.ELEMENT_NODE) {
        const attrs1 = node1.attributes || {};
        const attrs2 = node2.attributes || {};
        const allAttrNames = /* @__PURE__ */ new Set([...Object.keys(attrs1), ...Object.keys(attrs2)]);
        for (const attrName of allAttrNames) {
          const val1 = attrs1[attrName] ?? null;
          const val2 = attrs2[attrName] ?? null;
          if (val1 !== val2) {
            changedAttributes.push({
              nodeId: id,
              tagName: node2.tagName,
              attributeName: attrName,
              oldValue: val1,
              newValue: val2,
              selector
            });
            if (attrName.toLowerCase() === "class") {
              const classes1 = (val1 || "").split(/\s+/).filter(Boolean);
              const classes2 = (val2 || "").split(/\s+/).filter(Boolean);
              const addedClasses = classes2.filter((c) => !classes1.includes(c));
              const removedClasses = classes1.filter((c) => !classes2.includes(c));
              if (addedClasses.length > 0 || removedClasses.length > 0) {
                changedClasses.push({
                  nodeId: id,
                  tagName: node2.tagName,
                  addedClasses,
                  removedClasses,
                  oldClassString: val1 || "",
                  newClassString: val2 || "",
                  selector
                });
              }
            }
            if (attrName.toLowerCase() === "style") {
              this.diffInlineStyles(id, node2.tagName, val1, val2, selector, changedStyles);
            }
          }
        }
      }
    }
    const hasStructuralChanges = addedNodes.length > 0 || removedNodes.length > 0 || movedNodes.length > 0;
    const hasVisibilityChanges = changedClasses.some(
      (c) => [...c.addedClasses, ...c.removedClasses].some(
        (cls) => /\b(hidden|hide|d-none|invisible|visible|show)\b/i.test(cls)
      )
    ) || changedStyles.some(
      (s) => ["display", "visibility", "opacity"].includes(s.propertyName.toLowerCase())
    );
    const totalChanges = addedNodes.length + removedNodes.length + movedNodes.length + changedAttributes.length + changedText.length;
    const summary = {
      addedNodesCount: addedNodes.length,
      removedNodesCount: removedNodes.length,
      movedNodesCount: movedNodes.length,
      attributeChangesCount: changedAttributes.length,
      classChangesCount: changedClasses.length,
      styleChangesCount: changedStyles.length,
      textChangesCount: changedText.length,
      totalChanges,
      hasStructuralChanges,
      hasVisibilityChanges
    };
    return {
      t1: {
        timestamp: s1.timestamp,
        sequence: s1.sequence,
        eventId: s1.snapshotId,
        nodeCount: s1.totalNodeCount
      },
      t2: {
        timestamp: s2.timestamp,
        sequence: s2.sequence,
        eventId: s2.snapshotId,
        nodeCount: s2.totalNodeCount
      },
      addedNodes,
      removedNodes,
      movedNodes,
      changedAttributes,
      changedClasses,
      changedStyles,
      changedText,
      summary
    };
  }
  static diffInlineStyles(nodeId, tagName, style1, style2, selector, acc) {
    const parse = (s) => {
      const res = {};
      if (!s) return res;
      s.split(";").forEach((part) => {
        const [k, v] = part.split(":");
        if (k && v) res[k.trim().toLowerCase()] = v.trim();
      });
      return res;
    };
    const p1 = parse(style1);
    const p2 = parse(style2);
    const props = /* @__PURE__ */ new Set([...Object.keys(p1), ...Object.keys(p2)]);
    for (const prop of props) {
      const v1 = p1[prop] ?? null;
      const v2 = p2[prop] ?? null;
      if (v1 !== v2) {
        acc.push({
          nodeId,
          tagName,
          propertyName: prop,
          oldValue: v1,
          newValue: v2,
          selector
        });
      }
    }
  }
  static renderNodeSnippet(node) {
    if (node.nodeType === VirtualDOMNodeType.TEXT_NODE) {
      return `"${node.textContent || ""}"`;
    }
    const tag = node.tagName || "element";
    const attrs = Object.entries(node.attributes || {}).slice(0, 3).map(([k, v]) => `${k}="${v}"`).join(" ");
    const attrStr = attrs ? ` ${attrs}` : "";
    return `<${tag}${attrStr}>`;
  }
}
class DiffFormatter {
  static formatMarkdown(diff) {
    const lines = [];
    lines.push(`### DOM Structural Diff: T1 (${diff.t1.timestamp.toFixed(1)}ms) → T2 (${diff.t2.timestamp.toFixed(1)}ms)`);
    lines.push(`- **Summary**: Total Changes: ${diff.summary.totalChanges} (Added: ${diff.summary.addedNodesCount}, Removed: ${diff.summary.removedNodesCount}, Moved: ${diff.summary.movedNodesCount}, Attr Changes: ${diff.summary.attributeChangesCount}, Class Changes: ${diff.summary.classChangesCount}, Text Changes: ${diff.summary.textChangesCount})`);
    lines.push(`- **Structural Shift**: ${diff.summary.hasStructuralChanges ? "YES" : "NO"}`);
    lines.push(`- **Visibility Impact**: ${diff.summary.hasVisibilityChanges ? "YES" : "NO"}`);
    lines.push("");
    if (diff.addedNodes.length > 0) {
      lines.push("#### ➕ Added Nodes");
      for (const node of diff.addedNodes) {
        lines.push(`- **[ID: ${node.id}]** \`${node.selector}\` — ${node.htmlSnippet}`);
      }
      lines.push("");
    }
    if (diff.removedNodes.length > 0) {
      lines.push("#### ➖ Removed Nodes");
      for (const node of diff.removedNodes) {
        lines.push(`- **[ID: ${node.id}]** \`${node.selector}\` (Parent ID: ${node.lastKnownParentId ?? "none"})`);
      }
      lines.push("");
    }
    if (diff.movedNodes.length > 0) {
      lines.push("#### 🔄 Moved / Reparented Nodes");
      for (const node of diff.movedNodes) {
        lines.push(`- **[ID: ${node.id}]** \`${node.selector}\`: Parent ${node.oldParentId} (idx: ${node.oldIndex}) → Parent ${node.newParentId} (idx: ${node.newIndex})`);
      }
      lines.push("");
    }
    if (diff.changedClasses.length > 0) {
      lines.push("#### 🏷️ Class Modifications");
      for (const cl of diff.changedClasses) {
        const added = cl.addedClasses.length > 0 ? ` +[${cl.addedClasses.join(", ")}]` : "";
        const removed = cl.removedClasses.length > 0 ? ` -[${cl.removedClasses.join(", ")}]` : "";
        lines.push(`- **[ID: ${cl.nodeId}]** \`${cl.selector}\`:${added}${removed}`);
      }
      lines.push("");
    }
    if (diff.changedStyles.length > 0) {
      lines.push("#### 🎨 Style Modifications");
      for (const st of diff.changedStyles) {
        lines.push(`- **[ID: ${st.nodeId}]** \`${st.selector}\`: \`${st.propertyName}\`: "${st.oldValue ?? ""}" → "${st.newValue ?? ""}"`);
      }
      lines.push("");
    }
    if (diff.changedAttributes.length > 0) {
      lines.push("#### 📝 Attribute Modifications");
      for (const at of diff.changedAttributes) {
        if (at.attributeName.toLowerCase() !== "class" && at.attributeName.toLowerCase() !== "style") {
          lines.push(`- **[ID: ${at.nodeId}]** \`${at.selector}\`: \`${at.attributeName}\`: "${at.oldValue ?? ""}" → "${at.newValue ?? ""}"`);
        }
      }
      lines.push("");
    }
    if (diff.changedText.length > 0) {
      lines.push("#### 🔤 Text Modifications");
      for (const tx of diff.changedText) {
        lines.push(`- **[ID: ${tx.nodeId}]** (Parent: \`${tx.parentSelector ?? ""}\`): "${tx.oldText}" → "${tx.newText}"`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
}
class LifecycleTracer {
  static traceElement(target, events, initialSnapshot) {
    const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
    let targetId = target.nodeId;
    let tagName = "unknown";
    let selectorHint = target.selector || "";
    let initialAttrs = {};
    let createdAt = 0;
    let createdSequence = 0;
    let createdEventId = "init";
    if (!targetId && target.selector && initialSnapshot) {
      const match = VirtualQueryEngine.querySelector(target.selector, initialSnapshot.rootId, initialSnapshot.nodes);
      if (match) {
        targetId = match.id;
        tagName = match.tagName || "element";
        initialAttrs = { ...match.attributes || {} };
        selectorHint = target.selector;
      }
    }
    if (!targetId && target.selector) {
      for (const evt of sortedEvents) {
        if (evt.type === "DOM_MUTATION_ADD") {
          const payload = evt.payload;
          if (payload.node && VirtualQueryEngine.matches(payload.node, target.selector)) {
            targetId = payload.node.id;
            tagName = payload.node.tagName || "element";
            initialAttrs = { ...payload.node.attributes || {} };
            createdAt = evt.timestamp;
            createdSequence = evt.sequence;
            createdEventId = evt.id;
            break;
          }
        }
      }
    }
    if (!targetId) {
      return null;
    }
    const entries = [];
    let isCurrentlyAlive = true;
    let removedAt = null;
    let removedSequence = null;
    let removedEventId = void 0;
    let mutationCount = 0;
    if (initialSnapshot && initialSnapshot.nodes[targetId]) {
      const node = initialSnapshot.nodes[targetId];
      tagName = node.tagName || tagName;
      initialAttrs = { ...node.attributes || {} };
      if (!selectorHint) {
        selectorHint = VirtualQueryEngine.computeSelector(node, initialSnapshot.nodes);
      }
      entries.push({
        timestamp: initialSnapshot.timestamp,
        sequence: initialSnapshot.sequence,
        wallClockTime: Date.now(),
        stage: "CREATED",
        eventId: initialSnapshot.snapshotId,
        eventType: "DOM_SNAPSHOT",
        description: `Element <${tagName}> existed in initial baseline snapshot [ID: ${targetId}]`,
        details: { initialParentId: node.parentId, attributes: initialAttrs },
        nodeSnapshot: node
      });
    }
    const parentMap = /* @__PURE__ */ new Map();
    if (initialSnapshot) {
      for (const [idStr, node] of Object.entries(initialSnapshot.nodes)) {
        parentMap.set(Number(idStr), node.parentId ?? null);
      }
    }
    const isAncestor = (ancestorId, childId) => {
      let curr = parentMap.get(childId);
      const visited = /* @__PURE__ */ new Set();
      while (curr && !visited.has(curr)) {
        if (curr === ancestorId) return true;
        visited.add(curr);
        curr = parentMap.get(curr);
      }
      return false;
    };
    for (const evt of sortedEvents) {
      const ts = evt.timestamp;
      const seq = evt.sequence;
      const wall = evt.wallClockTime;
      if (evt.type === "DOM_MUTATION_ADD") {
        const payload = evt.payload;
        if (payload.node?.id) {
          parentMap.set(payload.node.id, payload.parentId ?? null);
        }
        if (payload.node?.id === targetId) {
          isCurrentlyAlive = true;
          tagName = payload.node.tagName || tagName;
          createdAt = ts;
          createdSequence = seq;
          createdEventId = evt.id;
          initialAttrs = { ...payload.node.attributes || {} };
          entries.push({
            timestamp: ts,
            sequence: seq,
            wallClockTime: wall,
            stage: "ATTACHED_TO_DOM",
            eventId: evt.id,
            eventType: evt.type,
            description: `Element <${tagName}> added to DOM under parent ID ${payload.parentId}`,
            details: { parentId: payload.parentId, index: payload.index },
            nodeSnapshot: payload.node
          });
        }
      }
      if (evt.type === "DOM_MUTATION_REMOVE") {
        const payload = evt.payload;
        if (payload.nodeId === targetId) {
          isCurrentlyAlive = false;
          removedAt = ts;
          removedSequence = seq;
          removedEventId = evt.id;
          entries.push({
            timestamp: ts,
            sequence: seq,
            wallClockTime: wall,
            stage: "REMOVED_FROM_DOM",
            eventId: evt.id,
            eventType: evt.type,
            description: `Element <${tagName}> explicitly removed from parent ID ${payload.parentId}`,
            details: { parentId: payload.parentId, removedIndex: payload.index }
          });
        } else if (isAncestor(payload.nodeId, targetId)) {
          isCurrentlyAlive = false;
          removedAt = ts;
          removedSequence = seq;
          removedEventId = evt.id;
          entries.push({
            timestamp: ts,
            sequence: seq,
            wallClockTime: wall,
            stage: "PARENT_SUBTREE_REPLACED",
            eventId: evt.id,
            eventType: evt.type,
            description: `Ancestor element [ID: ${payload.nodeId}] was removed, causing target element [ID: ${targetId}] to detach from DOM`,
            details: { removedAncestorId: payload.nodeId, parentId: payload.parentId }
          });
        }
      }
      if (evt.type === "DOM_MUTATION_MOVE") {
        const payload = evt.payload;
        if (payload.nodeId) {
          parentMap.set(payload.nodeId, payload.newParentId ?? null);
        }
        if (payload.nodeId === targetId) {
          mutationCount++;
          entries.push({
            timestamp: ts,
            sequence: seq,
            wallClockTime: wall,
            stage: "REPARENTED",
            eventId: evt.id,
            eventType: evt.type,
            description: `Element reparented from parent ${payload.oldParentId} to ${payload.newParentId}`,
            details: { oldParentId: payload.oldParentId, newParentId: payload.newParentId }
          });
        }
      }
      if (evt.type === "DOM_MUTATION_ATTR") {
        const payload = evt.payload;
        if (payload.nodeId === targetId) {
          mutationCount++;
          const attr = payload.attributeName.toLowerCase();
          let stage = "ATTRIBUTE_MODIFIED";
          if (attr === "class") stage = "CLASS_MODIFIED";
          if (attr === "style") stage = "STYLE_MODIFIED";
          entries.push({
            timestamp: ts,
            sequence: seq,
            wallClockTime: wall,
            stage,
            eventId: evt.id,
            eventType: evt.type,
            description: `Attribute '${payload.attributeName}' changed from '${payload.oldValue ?? ""}' to '${payload.newValue ?? ""}'`,
            details: {
              attributeName: payload.attributeName,
              oldValue: payload.oldValue,
              newValue: payload.newValue
            }
          });
        }
      }
      if (evt.type === "DOM_MUTATION_TEXT") {
        const payload = evt.payload;
        if (payload.nodeId === targetId) {
          mutationCount++;
          entries.push({
            timestamp: ts,
            sequence: seq,
            wallClockTime: wall,
            stage: "TEXT_MODIFIED",
            eventId: evt.id,
            eventType: evt.type,
            description: `Text content changed: "${payload.oldText}" → "${payload.newText}"`,
            details: { oldText: payload.oldText, newText: payload.newText }
          });
        }
      }
    }
    const criticalTime = removedAt ?? createdAt;
    const windowMs = 500;
    const correlatedDiagnostics = sortedEvents.filter(
      (e) => (e.category === "ERROR" || e.category === "CONSOLE") && Math.abs(e.timestamp - criticalTime) <= windowMs
    );
    const correlatedNetwork = sortedEvents.filter(
      (e) => e.category === "NETWORK" && Math.abs(e.timestamp - criticalTime) <= windowMs
    );
    const lastEventTime = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].timestamp : createdAt;
    const lifespanMs = Math.max(0, (removedAt ?? lastEventTime) - createdAt);
    return {
      targetNodeId: targetId,
      tagName,
      selectorHint,
      initialAttributes: initialAttrs,
      createdAt,
      createdSequence,
      createdEventId,
      removedAt,
      removedSequence,
      removedEventId,
      isCurrentlyAlive,
      lifespanMs: Math.round(lifespanMs * 100) / 100,
      mutationCount,
      entries,
      correlatedDiagnostics,
      correlatedNetwork
    };
  }
}
class DisappearingElementAnalyzer {
  static analyze(targetQuery, events, initialSnapshot) {
    const targetObj = typeof targetQuery === "number" ? { nodeId: targetQuery } : { selector: targetQuery };
    const trace = LifecycleTracer.traceElement(targetObj, events, initialSnapshot);
    if (!trace) {
      return {
        targetQuery,
        found: false,
        disappearanceMechanism: "UNKNOWN",
        likelyRootCause: "Target element could not be found in recording baseline or event stream",
        confidenceScore: 0,
        detailedExplanation: `No element matching "${targetQuery}" was ever created, recorded in the initial DOM snapshot, or observed in mutation events.`,
        evidentiaryTrail: [],
        precedingEvents: [],
        followingEvents: [],
        correlatedErrors: [],
        correlatedNetworkCalls: [],
        alternativeHypotheses: [
          {
            hypothesis: "Element was injected into an unmonitored isolated iframe or ShadowRoot closed mode",
            likelihood: 40,
            evidenceFor: ["Element query yielded zero matches in monitored document"],
            evidenceAgainst: ["Iframes/ShadowRoots were accessible in this session"]
          },
          {
            hypothesis: "Selector typo or timing mismatch",
            likelihood: 60,
            evidenceFor: ["Target selector did not match any recorded tag or class"],
            evidenceAgainst: []
          }
        ]
      };
    }
    const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
    const evidentiaryTrail = [];
    const alternativeHypotheses = [];
    let mechanism = "UNKNOWN";
    let likelyRootCause = "Unknown disappearance mechanism";
    let confidenceScore = 50;
    let detailedExplanation = "";
    let disappearedAt = trace.removedAt ?? void 0;
    const removalEntry = trace.entries.find((e) => e.stage === "REMOVED_FROM_DOM");
    const parentSubtreeEntry = trace.entries.find((e) => e.stage === "PARENT_SUBTREE_REPLACED");
    const classHiddenEntry = trace.entries.find(
      (e) => e.stage === "CLASS_MODIFIED" && /\b(hidden|hide|d-none|invisible|collapsed)\b/i.test(String(e.details.newValue || ""))
    );
    const styleHiddenEntry = trace.entries.find(
      (e) => e.stage === "STYLE_MODIFIED" && /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/i.test(String(e.details.newValue || ""))
    );
    if (removalEntry) {
      mechanism = "DIRECT_NODE_REMOVAL";
      disappearedAt = removalEntry.timestamp;
      likelyRootCause = `Element [ID: ${trace.targetNodeId}] <${trace.tagName}> was directly removed from its parent [ID: ${removalEntry.details.parentId}] via DOM removeChild/replaceChild`;
      confidenceScore = 95;
      evidentiaryTrail.push({
        timestamp: removalEntry.timestamp,
        sequence: removalEntry.sequence,
        eventId: removalEntry.eventId,
        eventType: removalEntry.eventType,
        evidenceType: "DIRECT",
        description: `Direct DOM removal mutation: element detached from parent ID ${removalEntry.details.parentId}`,
        confidenceContribution: 50
      });
    } else if (parentSubtreeEntry) {
      mechanism = "PARENT_SUBTREE_REPLACED";
      disappearedAt = parentSubtreeEntry.timestamp;
      likelyRootCause = `Host framework (e.g. React/Vue re-render) destroyed and replaced Ancestor container [ID: ${parentSubtreeEntry.details.removedAncestorId}], causing injected element to be unmounted`;
      confidenceScore = 92;
      evidentiaryTrail.push({
        timestamp: parentSubtreeEntry.timestamp,
        sequence: parentSubtreeEntry.sequence,
        eventId: parentSubtreeEntry.eventId,
        eventType: parentSubtreeEntry.eventType,
        evidenceType: "DIRECT",
        description: `Ancestor container [ID: ${parentSubtreeEntry.details.removedAncestorId}] was removed, wiping out all child subtrees`,
        confidenceContribution: 50
      });
    } else if (styleHiddenEntry) {
      mechanism = "STYLE_DISPLAY_NONE";
      disappearedAt = styleHiddenEntry.timestamp;
      likelyRootCause = `Element was visually hidden by an inline style modification: "${styleHiddenEntry.details.newValue}"`;
      confidenceScore = 88;
      evidentiaryTrail.push({
        timestamp: styleHiddenEntry.timestamp,
        sequence: styleHiddenEntry.sequence,
        eventId: styleHiddenEntry.eventId,
        eventType: styleHiddenEntry.eventType,
        evidenceType: "DIRECT",
        description: `Inline style changed to "${styleHiddenEntry.details.newValue}"`,
        confidenceContribution: 45
      });
    } else if (classHiddenEntry) {
      mechanism = "CLASS_TRIGGERED_HIDDEN";
      disappearedAt = classHiddenEntry.timestamp;
      likelyRootCause = `Element was visually hidden because its CSS class list was modified to include "${classHiddenEntry.details.newValue}"`;
      confidenceScore = 85;
      evidentiaryTrail.push({
        timestamp: classHiddenEntry.timestamp,
        sequence: classHiddenEntry.sequence,
        eventId: classHiddenEntry.eventId,
        eventType: classHiddenEntry.eventType,
        evidenceType: "DIRECT",
        description: `Class list changed from "${classHiddenEntry.details.oldValue ?? ""}" to "${classHiddenEntry.details.newValue ?? ""}"`,
        confidenceContribution: 45
      });
    } else if (trace.isCurrentlyAlive) {
      mechanism = "UNKNOWN";
      likelyRootCause = `Element [ID: ${trace.targetNodeId}] is currently alive and attached to the DOM tree (no unmount mutation detected)`;
      confidenceScore = 70;
      detailedExplanation = `The element exists in the current DOM state. If it is not visible on screen, it may be clipped by viewport boundaries, z-index stacking context, or 0x0 pixel dimensions.`;
    }
    const criticalTime = disappearedAt ?? trace.createdAt;
    const windowMs = 500;
    const precedingEvents = sortedEvents.filter(
      (e) => e.timestamp >= criticalTime - windowMs && e.timestamp < criticalTime
    );
    const followingEvents = sortedEvents.filter(
      (e) => e.timestamp > criticalTime && e.timestamp <= criticalTime + windowMs
    );
    const correlatedErrors = precedingEvents.filter((e) => e.category === "ERROR");
    if (correlatedErrors.length > 0) {
      const err = correlatedErrors[0];
      const errMsg = err.payload?.message || "Unknown runtime error";
      evidentiaryTrail.push({
        timestamp: err.timestamp,
        sequence: err.sequence,
        eventId: err.id,
        eventType: err.type,
        evidenceType: "PRECEDING",
        description: `Runtime error occurred ${(criticalTime - err.timestamp).toFixed(1)}ms before disappearance: "${errMsg}"`,
        confidenceContribution: 20,
        rawEvent: err
      });
      likelyRootCause += ` (preceded by runtime error: "${errMsg}")`;
    }
    const correlatedNetworkCalls = precedingEvents.filter(
      (e) => e.type === "NETWORK_RESPONSE_COMPLETE" || e.type === "NETWORK_REQUEST_FAILED"
    );
    if (correlatedNetworkCalls.length > 0) {
      const net = correlatedNetworkCalls[0];
      const netUrl = net.payload?.url || "network request";
      evidentiaryTrail.push({
        timestamp: net.timestamp,
        sequence: net.sequence,
        eventId: net.id,
        eventType: net.type,
        evidenceType: "PRECEDING",
        description: `Network response completed ${(criticalTime - net.timestamp).toFixed(1)}ms before disappearance: ${netUrl}`,
        confidenceContribution: 15,
        rawEvent: net
      });
    }
    const navEvents = precedingEvents.filter((e) => e.category === "NAVIGATION");
    if (navEvents.length > 0) {
      const nav = navEvents[0];
      evidentiaryTrail.push({
        timestamp: nav.timestamp,
        sequence: nav.sequence,
        eventId: nav.id,
        eventType: nav.type,
        evidenceType: "PRECEDING",
        description: `Navigation event (${nav.payload?.navigationType}) occurred ${(criticalTime - nav.timestamp).toFixed(1)}ms before disappearance`,
        confidenceContribution: 25,
        rawEvent: nav
      });
      likelyRootCause += ` following SPA navigation to "${nav.payload?.url}"`;
    }
    if (!detailedExplanation) {
      detailedExplanation = [
        `Element <${trace.tagName}> (Logical ID: ${trace.targetNodeId}, selector: "${trace.selectorHint}") was created at ${trace.createdAt.toFixed(1)}ms.`,
        `It remained alive in the DOM for ${trace.lifespanMs.toFixed(1)}ms and experienced ${trace.mutationCount} mutations.`,
        `At timestamp ${criticalTime.toFixed(1)}ms, it disappeared via [${mechanism}].`,
        `Diagnosis: ${likelyRootCause}.`
      ].join(" ");
    }
    if (mechanism === "PARENT_SUBTREE_REPLACED") {
      alternativeHypotheses.push({
        hypothesis: "Direct cleanup called by extension code",
        likelihood: 25,
        evidenceFor: ["Element was unmounted shortly after creation"],
        evidenceAgainst: ["Ancestor container mutation was recorded from host page context"]
      });
      alternativeHypotheses.push({
        hypothesis: "Host single-page app route change destroyed component tree",
        likelihood: 35,
        evidenceFor: navEvents.length > 0 ? ["Preceding navigation event recorded"] : [],
        evidenceAgainst: navEvents.length === 0 ? ["No navigation events occurred in temporal window"] : []
      });
    } else if (mechanism === "DIRECT_NODE_REMOVAL") {
      alternativeHypotheses.push({
        hypothesis: "Third-party script or ad-blocker removed the injected node",
        likelihood: 30,
        evidenceFor: ["Direct node removal occurred without ancestor replacement"],
        evidenceAgainst: ["No ad-blocker signatures or extension error logs observed"]
      });
    }
    return {
      targetQuery,
      targetNodeId: trace.targetNodeId,
      found: true,
      tagName: trace.tagName,
      selectorHint: trace.selectorHint,
      createdAt: trace.createdAt,
      firstVisibleAt: trace.createdAt,
      lastKnownGoodStateAt: Math.max(0, criticalTime - 1),
      disappearedAt,
      lifespanMs: trace.lifespanMs,
      disappearanceMechanism: mechanism,
      likelyRootCause,
      confidenceScore: Math.min(99, confidenceScore),
      detailedExplanation,
      evidentiaryTrail,
      precedingEvents,
      followingEvents,
      correlatedErrors,
      correlatedNetworkCalls,
      alternativeHypotheses
    };
  }
}
const DEFAULT_PRIVACY_CONFIG = {
  maskAllInputs: false,
  maskInputTypes: ["password", "hidden", "tel", "email"],
  maskSelectors: ["[data-private]", ".private-data", ".sensitive", '[data-testid="sensitive"]'],
  blockSelectors: [".recording-blocked", "[data-recording-ignore]"],
  redactHeaders: ["authorization", "cookie", "set-cookie", "x-api-key", "proxy-authorization", "token"],
  redactQueryParams: ["token", "key", "auth", "secret", "password", "access_token", "apiKey", "bearer"],
  maxTextLength: 1e5
};
class PrivacyEngine {
  config;
  constructor(config = {}) {
    this.config = { ...DEFAULT_PRIVACY_CONFIG, ...config };
  }
  shouldBlockNode(element) {
    if (!element || !element.matches) return false;
    for (const selector of this.config.blockSelectors) {
      try {
        if (element.matches(selector) || element.closest(selector)) {
          return true;
        }
      } catch {
      }
    }
    return false;
  }
  shouldMaskText(element) {
    if (!element || !element.matches) return false;
    for (const selector of this.config.maskSelectors) {
      try {
        if (element.matches(selector) || element.closest(selector)) {
          return true;
        }
      } catch {
      }
    }
    return false;
  }
  maskValue(value, inputType, elementName) {
    if (!value) return value;
    if (this.config.maskAllInputs) {
      return "*".repeat(Math.min(value.length, 12));
    }
    if (inputType && this.config.maskInputTypes.includes(inputType.toLowerCase())) {
      return "••••••••";
    }
    if (elementName && /(password|token|secret|cvv|credit|auth|ssn)/i.test(elementName)) {
      return "••••••••";
    }
    return value;
  }
  sanitizeText(text, isMasked = false) {
    if (!text) return text;
    if (isMasked) {
      return text.replace(/[^\s\n\r\t]/g, "*");
    }
    if (text.length > this.config.maxTextLength) {
      return text.substring(0, this.config.maxTextLength) + "... [TRUNCATED]";
    }
    return text;
  }
  sanitizeHeaders(headers) {
    if (!headers) return void 0;
    const sanitized = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (this.config.redactHeaders.some((h) => lowerKey.includes(h))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  sanitizeUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      for (const param of this.config.redactQueryParams) {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, "[REDACTED]");
        }
      }
      return url.toString();
    } catch {
      return rawUrl;
    }
  }
}
class LiveDOMInspector {
  static privacyEngine = new PrivacyEngine();
  /**
   * Inspect high-level state of the active browser page/document
   */
  static inspectPage(doc = document) {
    const win = doc.defaultView || (typeof window !== "undefined" ? window : {});
    const activeEl = doc.activeElement;
    return {
      url: win.location?.href || doc.location?.href || "",
      title: doc.title || "",
      origin: win.location?.origin || "",
      viewport: {
        width: win.innerWidth || doc.documentElement?.clientWidth || 1920,
        height: win.innerHeight || doc.documentElement?.clientHeight || 1080,
        scrollX: win.scrollX || win.pageXOffset || doc.documentElement?.scrollLeft || 0,
        scrollY: win.scrollY || win.pageYOffset || doc.documentElement?.scrollTop || 0,
        devicePixelRatio: win.devicePixelRatio || 1
      },
      documentDimensions: {
        width: Math.max(doc.body?.scrollWidth || 0, doc.documentElement?.scrollWidth || 0),
        height: Math.max(doc.body?.scrollHeight || 0, doc.documentElement?.scrollHeight || 0)
      },
      activeElement: activeEl ? {
        tag: activeEl.tagName?.toLowerCase() || "",
        selector: this.computeBestSelector(activeEl),
        text: activeEl.textContent?.slice(0, 100).trim()
      } : void 0,
      focusedElement: typeof doc.hasFocus === "function" && doc.hasFocus() && activeEl ? {
        tag: activeEl.tagName?.toLowerCase() || "",
        selector: this.computeBestSelector(activeEl)
      } : void 0,
      visibilityState: doc.visibilityState || "visible",
      readyState: doc.readyState || "complete",
      framesCount: doc.querySelectorAll ? doc.querySelectorAll("iframe, frame").length : 0
    };
  }
  /**
   * Deeply inspect a live DOM element with complete metadata, geometry, styles, and context
   */
  static inspectElement(element, registry) {
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || (typeof window !== "undefined" ? window : {});
    const htmlEl = element;
    const tag = element.tagName ? element.tagName.toLowerCase() : "element";
    const classList = this.extractClasses(element);
    const { bestSelector, candidates } = this.generateSelectorCandidates(element);
    const attributes = {};
    const ariaAttributes = {};
    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr) {
          attributes[attr.name] = attr.value;
          if (attr.name.startsWith("aria-")) {
            ariaAttributes[attr.name] = attr.value;
          }
        }
      }
    }
    const role = element.getAttribute("role") || this.inferImplicitRole(element);
    const isMasked = this.privacyEngine.shouldMaskText(element);
    const rawText = element.textContent || "";
    const text = this.privacyEngine.sanitizeText(rawText, isMasked);
    const normalizedText = text.replace(/\s+/g, " ").trim();
    let value = void 0;
    const inputEl = element;
    if (typeof inputEl.value === "string") {
      value = this.privacyEngine.maskValue(inputEl.value, inputEl.type, inputEl.name);
    }
    const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    const bounds = {
      x: rect.x ?? rect.left ?? 0,
      y: rect.y ?? rect.top ?? 0,
      width: rect.width ?? 0,
      height: rect.height ?? 0,
      top: rect.top ?? 0,
      right: rect.right ?? 0,
      bottom: rect.bottom ?? 0,
      left: rect.left ?? 0
    };
    const computed = win.getComputedStyle ? win.getComputedStyle(element) : null;
    const display = computed?.display || "block";
    const visibility = computed?.visibility || "visible";
    const opacity = computed ? parseFloat(computed.opacity) || 1 : 1;
    const pointerEvents = computed?.pointerEvents || "auto";
    const zIndex = computed?.zIndex || "auto";
    const vpWidth = win.innerWidth || doc.documentElement?.clientWidth || 1920;
    const vpHeight = win.innerHeight || doc.documentElement?.clientHeight || 1080;
    const hasLayout = bounds.width > 0 || bounds.height > 0 || bounds.right > 0 || bounds.bottom > 0;
    const isInViewport = !hasLayout || bounds.right > 0 && bounds.bottom > 0 && bounds.left < vpWidth && bounds.top < vpHeight;
    const isClipped = hasLayout && (bounds.right <= 0 || bounds.bottom <= 0 || bounds.left >= vpWidth || bounds.top >= vpHeight);
    const isVisible = !isClipped && display !== "none" && visibility !== "hidden" && opacity > 0 && isInViewport;
    const state = {
      disabled: htmlEl.disabled ?? element.hasAttribute("disabled"),
      readOnly: htmlEl.readOnly ?? element.hasAttribute("readonly"),
      checked: htmlEl.checked,
      selected: htmlEl.selected,
      focused: doc.activeElement === element,
      isShadowHost: !!element.shadowRoot,
      hasShadowRoot: !!element.shadowRoot
    };
    const parentChain = [];
    let curr = element.parentElement;
    while (curr && curr.tagName && curr.tagName.toLowerCase() !== "html") {
      parentChain.push(this.computeBestSelector(curr));
      curr = curr.parentElement;
    }
    const childrenSummary = {
      count: element.children ? element.children.length : 0,
      tags: element.children ? Array.from(element.children).slice(0, 10).map((c) => c.tagName.toLowerCase()) : []
    };
    let forensics = void 0;
    if (registry) {
      const logicalId = registry.getId(element);
      forensics = {
        logicalNodeId: logicalId ?? null,
        creationSequence: null,
        lastMutationSequence: null,
        eventCount: 0,
        isRecorded: logicalId !== null && logicalId !== void 0
      };
    }
    return {
      tag,
      id: element.id || void 0,
      classes: classList,
      role: role || void 0,
      ariaAttributes: Object.keys(ariaAttributes).length > 0 ? ariaAttributes : void 0,
      text: text.slice(0, 200),
      normalizedText: normalizedText.slice(0, 200),
      value,
      type: inputEl.type || void 0,
      selector: bestSelector,
      bestSelector,
      selectorCandidates: candidates,
      bounds,
      visibility: {
        isVisible,
        display,
        visibility,
        opacity,
        pointerEvents,
        isClipped,
        isInViewport,
        zIndex
      },
      computedStyle: computed ? {
        display,
        visibility,
        opacity: String(opacity),
        position: computed.position,
        zIndex: String(zIndex),
        pointerEvents,
        overflow: computed.overflow,
        boxSizing: computed.boxSizing,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize
      } : {},
      attributes,
      state,
      context: {
        parentChain,
        parentSelector: parentChain[0] || void 0,
        childrenSummary,
        containingBlock: computed?.position === "fixed" ? "viewport" : parentChain[0] || void 0,
        iframe: null,
        shadowRoot: element.shadowRoot ? "open" : null
      },
      forensics
    };
  }
  /**
   * Inspect detailed visual and occlusion state
   */
  static inspectVisualState(element) {
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || (typeof window !== "undefined" ? window : {});
    const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    const computed = win.getComputedStyle ? win.getComputedStyle(element) : null;
    const vpWidth = win.innerWidth || doc.documentElement?.clientWidth || 1920;
    const vpHeight = win.innerHeight || doc.documentElement?.clientHeight || 1080;
    const scrollX = win.scrollX || win.pageXOffset || 0;
    const scrollY = win.scrollY || win.pageYOffset || 0;
    const dpr = win.devicePixelRatio || 1;
    const display = computed?.display || "block";
    const visibility = computed?.visibility || "visible";
    const opacity = computed ? parseFloat(computed.opacity) || 1 : 1;
    const isInViewport = rect.right > 0 && rect.bottom > 0 && rect.left < vpWidth && rect.top < vpHeight;
    const isZeroDimension = rect.width === 0 || rect.height === 0;
    const isOffscreen = rect.right <= 0 || rect.bottom <= 0 || rect.left >= vpWidth || rect.top >= vpHeight;
    let occludedBy = null;
    if (doc.elementFromPoint && isInViewport && !isZeroDimension && display !== "none") {
      const centerX = Math.max(0, Math.min(vpWidth - 1, rect.left + rect.width / 2));
      const centerY = Math.max(0, Math.min(vpHeight - 1, rect.top + rect.height / 2));
      try {
        const topEl = doc.elementFromPoint(centerX, centerY);
        if (topEl && topEl !== element && !element.contains(topEl) && !topEl.contains(element)) {
          occludedBy = this.computeBestSelector(topEl);
        }
      } catch {
      }
    }
    return {
      selector: this.computeBestSelector(element),
      bounds: {
        x: rect.x ?? rect.left ?? 0,
        y: rect.y ?? rect.top ?? 0,
        width: rect.width ?? 0,
        height: rect.height ?? 0,
        top: rect.top ?? 0,
        right: rect.right ?? 0,
        bottom: rect.bottom ?? 0,
        left: rect.left ?? 0
      },
      viewport: {
        scrollX,
        scrollY,
        width: vpWidth,
        height: vpHeight,
        devicePixelRatio: dpr
      },
      layout: {
        display,
        position: computed?.position || "static",
        zIndex: computed?.zIndex || "auto",
        opacity,
        visibility,
        overflow: computed?.overflow || "visible",
        boxSizing: computed?.boxSizing || "content-box",
        pointerEvents: computed?.pointerEvents || "auto"
      },
      occlusion: {
        isInViewport,
        isClipped: isZeroDimension || isOffscreen,
        isZeroDimension,
        isTransparent: opacity === 0,
        isDisplayNone: display === "none",
        isVisibilityHidden: visibility === "hidden",
        isOffscreen,
        occludedBy
      },
      computedStyleSummary: computed ? {
        display,
        position: computed.position,
        zIndex: computed.zIndex,
        opacity: String(opacity),
        visibility,
        pointerEvents: computed.pointerEvents
      } : {}
    };
  }
  /**
   * Helper: Generate a ranked list of selector candidates and the best one
   */
  static generateSelectorCandidates(element) {
    const doc = element.ownerDocument || document;
    const tag = element.tagName ? element.tagName.toLowerCase() : "element";
    const candidates = [];
    if (element.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(element.id)) {
      const idSel = `#${element.id}`;
      try {
        if (doc.querySelectorAll && doc.querySelectorAll(idSel).length === 1) {
          candidates.push(idSel);
        }
      } catch {
        candidates.push(idSel);
      }
    }
    const testAttrs = ["data-testid", "data-test", "data-id", "data-qa", "data-cy", "aria-label", "name"];
    for (const attr of testAttrs) {
      const val = element.getAttribute(attr);
      if (val && /^[a-zA-Z0-9_-]+$/.test(val)) {
        const attrSel = `${tag}[${attr}="${val}"]`;
        try {
          if (doc.querySelectorAll && doc.querySelectorAll(attrSel).length === 1) {
            candidates.push(attrSel);
          }
        } catch {
          candidates.push(attrSel);
        }
      }
    }
    const classes = this.extractClasses(element).filter(
      (c) => /^[a-zA-Z0-9_-]+$/.test(c) && !c.startsWith("ng-") && !c.startsWith("_ng")
    );
    if (classes.length > 0) {
      const classSel = `${tag}.${classes.slice(0, 3).join(".")}`;
      try {
        if (doc.querySelectorAll && doc.querySelectorAll(classSel).length === 1) {
          candidates.push(classSel);
        }
      } catch {
        candidates.push(classSel);
      }
    }
    if (element.parentElement && element.parentElement.children) {
      const siblings = Array.from(element.parentElement.children).filter(
        (s) => s.tagName && s.tagName.toLowerCase() === tag
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(element) + 1;
        if (idx > 0) {
          const parentSel = this.computeBestSelector(element.parentElement);
          candidates.push(`${parentSel} > ${tag}:nth-of-type(${idx})`);
        }
      }
    }
    const basicSel = classes.length > 0 ? `${tag}.${classes[0]}` : tag;
    candidates.push(basicSel);
    const bestSelector = candidates[0] || tag;
    return { bestSelector, candidates };
  }
  static computeBestSelector(element) {
    return this.generateSelectorCandidates(element).bestSelector;
  }
  static extractClasses(element) {
    if (element.classList && typeof element.classList.forEach === "function") {
      return Array.from(element.classList);
    }
    if (typeof element.className === "string") {
      return element.className.split(/\s+/).filter(Boolean);
    }
    if (element.className && typeof element.className.baseVal === "string") {
      return element.className.baseVal.split(/\s+/).filter(Boolean);
    }
    return [];
  }
  static inferImplicitRole(element) {
    const tag = element.tagName ? element.tagName.toLowerCase() : "";
    switch (tag) {
      case "a":
        return element.hasAttribute("href") ? "link" : void 0;
      case "button":
        return "button";
      case "input": {
        const type = element.type || "text";
        if (type === "button" || type === "submit" || type === "reset") return "button";
        if (type === "checkbox") return "checkbox";
        if (type === "radio") return "radio";
        return "textbox";
      }
      case "select":
        return "combobox";
      case "textarea":
        return "textbox";
      case "nav":
        return "navigation";
      case "header":
        return "banner";
      case "footer":
        return "contentinfo";
      case "main":
        return "main";
      case "article":
        return "article";
      case "section":
        return "region";
      default:
        return void 0;
    }
  }
}
class ElementInteractionEngine {
  registry;
  lastSelectedElementRef;
  /** Optional timing hook injected by the HumanInteractionController. Default: no delay (DETERMINISTIC). */
  timingHook = null;
  /** Optional trajectory observer for reporting mouse movement. */
  lastTrajectory = [];
  constructor(registry) {
    this.registry = registry;
  }
  setLastSelectedElement(element) {
    this.lastSelectedElementRef = element;
  }
  /**
   * Install a timing hook (e.g. HumanInteractionController). Passing null
   * restores pure DETERMINISTIC behavior — the legacy default.
   */
  setTimingHook(hook) {
    this.timingHook = hook;
  }
  getLastTrajectory() {
    return this.lastTrajectory;
  }
  async timing(phase) {
    if (this.timingHook) {
      await this.timingHook(phase);
    }
  }
  /**
   * Deterministically resolve target element from target specifier
   */
  resolveTarget(targetSpec, doc = document) {
    if (targetSpec.selectedElementRef && this.lastSelectedElementRef) {
      if (doc.contains(this.lastSelectedElementRef)) {
        return this.lastSelectedElementRef;
      }
    }
    if (typeof targetSpec.nodeId === "number" && this.registry) {
      const node = this.registry.getNode(targetSpec.nodeId);
      if (node && node.nodeType === 1 && doc.contains(node)) {
        return node;
      }
    }
    if (targetSpec.selector) {
      try {
        const matches = doc.querySelectorAll(targetSpec.selector);
        if (matches.length > 1) {
          for (let i = 0; i < matches.length; i++) {
            const el = matches[i];
            const info = LiveDOMInspector.inspectElement(el);
            if (info.visibility.isVisible) {
              return el;
            }
          }
          return matches[0];
        } else if (matches.length === 1) {
          return matches[0];
        }
      } catch (err) {
        throw new Error(`Invalid CSS selector "${targetSpec.selector}": ${err.message}`);
      }
    }
    if (targetSpec.xpath && doc.evaluate) {
      try {
        const result = doc.evaluate(
          targetSpec.xpath,
          doc,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        if (result.singleNodeValue && result.singleNodeValue.nodeType === 1) {
          return result.singleNodeValue;
        }
      } catch (err) {
        throw new Error(`Invalid XPath "${targetSpec.xpath}": ${err.message}`);
      }
    }
    if (targetSpec.coordinates && doc.elementFromPoint) {
      const { x, y } = targetSpec.coordinates;
      const el = doc.elementFromPoint(x, y);
      if (el) return el;
    }
    throw new Error(
      `Target element could not be resolved from specifier: ${JSON.stringify(targetSpec)}`
    );
  }
  /**
   * Execute an interaction on a live element and measure its immediate before/after effects
   */
  async interact(payload, doc = document) {
    const startTime = Date.now();
    const targetElement = this.resolveTarget(payload.target, doc);
    const beforeState = LiveDOMInspector.inspectElement(targetElement, this.registry);
    let mutationCount = 0;
    const runtimeErrors = [];
    const w = typeof window !== "undefined" ? window : void 0;
    const consoleBaseline = w?.__FORENSIC_CONSOLE_BUFFER__ ? w.__FORENSIC_CONSOLE_BUFFER__.length : 0;
    const networkBaseline = w?.__FORENSIC_NETWORK_BUFFER__ ? w.__FORENSIC_NETWORK_BUFFER__.length : 0;
    const observer = new MutationObserver((mutations) => {
      mutationCount += mutations.length;
    });
    try {
      observer.observe(doc.body || doc.documentElement, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
      });
    } catch {
    }
    const errorHandler = (evt) => {
      runtimeErrors.push(evt.message || "Runtime Error");
    };
    if (typeof window !== "undefined") {
      window.addEventListener("error", errorHandler);
    }
    try {
      await this.dispatchAction(targetElement, payload);
    } finally {
      if (typeof window !== "undefined") {
        window.removeEventListener("error", errorHandler);
      }
    }
    let stabilized = true;
    if (payload.options?.waitForStabilization) {
      const timeoutMs = payload.options.stabilizationTimeoutMs || 300;
      await new Promise((resolve) => setTimeout(resolve, Math.min(2e3, timeoutMs)));
    }
    observer.disconnect();
    let afterState = void 0;
    if (doc.contains(targetElement)) {
      afterState = LiveDOMInspector.inspectElement(targetElement, this.registry);
    }
    const durationMs = Date.now() - startTime;
    const consoleErrors = w?.__FORENSIC_CONSOLE_BUFFER__ ? w.__FORENSIC_CONSOLE_BUFFER__.slice(consoleBaseline).filter((l) => l?.level === "error").length : 0;
    const networkRequests = w?.__FORENSIC_NETWORK_BUFFER__ ? w.__FORENSIC_NETWORK_BUFFER__.slice(networkBaseline).length : 0;
    return {
      success: true,
      action: payload.action,
      target: afterState || beforeState,
      beforeState,
      afterState,
      effects: {
        domMutations: mutationCount,
        consoleErrors,
        networkRequests,
        runtimeErrors
      },
      durationMs,
      stabilized
    };
  }
  /**
   * Dispatch action-specific native and synthetic events
   */
  async dispatchAction(element, payload) {
    const htmlEl = element;
    switch (payload.action) {
      case "click": {
        this.scrollIntoViewIfNeeded(element);
        await this.timing("move");
        await this.timing("click");
        this.dispatchMouseEvent(element, "pointerdown");
        this.dispatchMouseEvent(element, "mousedown");
        if (typeof htmlEl.focus === "function") htmlEl.focus();
        this.dispatchMouseEvent(element, "pointerup");
        this.dispatchMouseEvent(element, "mouseup");
        if (typeof htmlEl.click === "function") {
          htmlEl.click();
        } else {
          this.dispatchMouseEvent(element, "click");
        }
        break;
      }
      case "double_click": {
        this.scrollIntoViewIfNeeded(element);
        await this.timing("click");
        this.dispatchMouseEvent(element, "click");
        await this.timing("click");
        this.dispatchMouseEvent(element, "click");
        this.dispatchMouseEvent(element, "dblclick");
        break;
      }
      case "right_click": {
        this.scrollIntoViewIfNeeded(element);
        await this.timing("click");
        this.dispatchMouseEvent(element, "pointerdown", { button: 2 });
        this.dispatchMouseEvent(element, "mousedown", { button: 2 });
        this.dispatchMouseEvent(element, "contextmenu", { button: 2 });
        break;
      }
      case "hover": {
        await this.timing("move");
        this.dispatchMouseEvent(element, "pointerenter");
        this.dispatchMouseEvent(element, "mouseenter");
        this.dispatchMouseEvent(element, "mouseover");
        await this.timing("move");
        this.dispatchMouseEvent(element, "mousemove");
        break;
      }
      case "focus": {
        if (typeof htmlEl.focus === "function") {
          htmlEl.focus();
        }
        element.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
        break;
      }
      case "blur": {
        if (typeof htmlEl.blur === "function") {
          htmlEl.blur();
        }
        element.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
        break;
      }
      case "type": {
        const text = payload.text || "";
        const inputEl = element;
        const win = element.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
        if (typeof htmlEl.focus === "function") htmlEl.focus();
        for (const char of text) {
          await this.timing("type");
          const createKeyEvt = (evtType) => {
            try {
              const KeyCtor = win?.KeyboardEvent || (typeof KeyboardEvent !== "undefined" ? KeyboardEvent : null);
              if (KeyCtor) return new KeyCtor(evtType, { key: char, bubbles: true });
            } catch {
            }
            const FallbackCtor = win?.CustomEvent || win?.Event || CustomEvent;
            return new FallbackCtor(evtType, { bubbles: true, cancelable: true });
          };
          const createInputEvt = (evtType, opts) => {
            try {
              const InputCtor = win?.InputEvent || (typeof InputEvent !== "undefined" ? InputEvent : null);
              if (InputCtor) return new InputCtor(evtType, opts);
            } catch {
            }
            const FallbackCtor = win?.CustomEvent || win?.Event || CustomEvent;
            return new FallbackCtor(evtType, { bubbles: true, cancelable: true });
          };
          element.dispatchEvent(createKeyEvt("keydown"));
          element.dispatchEvent(createKeyEvt("keypress"));
          if ("value" in inputEl) {
            inputEl.value = (inputEl.value || "") + char;
          }
          element.dispatchEvent(createInputEvt("input", { data: char, inputType: "insertText", bubbles: true }));
          element.dispatchEvent(createKeyEvt("keyup"));
        }
        const ChangeCtor = win?.Event || Event;
        element.dispatchEvent(new ChangeCtor("change", { bubbles: true }));
        break;
      }
      case "clear": {
        const inputEl = element;
        const win = element.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
        if ("value" in inputEl) {
          inputEl.value = "";
          const createInputEvt = (evtType, opts) => {
            try {
              const InputCtor = win?.InputEvent || (typeof InputEvent !== "undefined" ? InputEvent : null);
              if (InputCtor) return new InputCtor(evtType, opts);
            } catch {
            }
            const FallbackCtor = win?.CustomEvent || win?.Event || CustomEvent;
            return new FallbackCtor(evtType, { bubbles: true, cancelable: true });
          };
          element.dispatchEvent(createInputEvt("input", { inputType: "deleteContentBackward", bubbles: true }));
          const ChangeCtor = win?.Event || Event;
          element.dispatchEvent(new ChangeCtor("change", { bubbles: true }));
        }
        break;
      }
      case "press_key": {
        const key = payload.key || "Enter";
        const win = element.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
        const createKeyEvt = (evtType) => {
          try {
            const KeyCtor = win?.KeyboardEvent || (typeof KeyboardEvent !== "undefined" ? KeyboardEvent : null);
            if (KeyCtor) return new KeyCtor(evtType, { key, bubbles: true });
          } catch {
          }
          const FallbackCtor = win?.CustomEvent || win?.Event || CustomEvent;
          return new FallbackCtor(evtType, { bubbles: true, cancelable: true });
        };
        element.dispatchEvent(createKeyEvt("keydown"));
        element.dispatchEvent(createKeyEvt("keypress"));
        element.dispatchEvent(createKeyEvt("keyup"));
        break;
      }
      case "select_option": {
        const selectEl = element;
        if (selectEl.tagName?.toLowerCase() === "select" && payload.optionValue) {
          selectEl.value = payload.optionValue;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
        break;
      }
      case "scroll_into_view": {
        this.scrollIntoViewIfNeeded(element, true);
        break;
      }
      case "scroll": {
        const dx = payload.scrollDelta?.x || 0;
        const dy = payload.scrollDelta?.y || 0;
        if (typeof element.scrollBy === "function") {
          element.scrollBy(dx, dy);
        }
        break;
      }
      default:
        throw new Error(`Unsupported interaction action: ${payload.action}`);
    }
  }
  scrollIntoViewIfNeeded(element, force = false) {
    if (typeof element.scrollIntoView === "function") {
      try {
        element.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
      } catch {
        element.scrollIntoView(force);
      }
    }
  }
  dispatchMouseEvent(element, type, options = {}) {
    const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    const event = new MouseEvent(type, {
      bubbles: options.bubbles !== void 0 ? options.bubbles : true,
      cancelable: options.cancelable !== void 0 ? options.cancelable : true,
      clientX,
      clientY,
      button: options.button || 0,
      buttons: options.button === 2 ? 2 : 1
    });
    element.dispatchEvent(event);
  }
}
class SequenceCounter {
  currentSequence = 0;
  sessionStartTime;
  sessionStartWallClock;
  constructor() {
    this.sessionStartTime = typeof performance !== "undefined" ? performance.now() : 0;
    this.sessionStartWallClock = Date.now();
  }
  nextSequence() {
    this.currentSequence += 1;
    return this.currentSequence;
  }
  getSequence() {
    return this.currentSequence;
  }
  getRelativeTimestamp() {
    if (typeof performance !== "undefined") {
      return Math.round((performance.now() - this.sessionStartTime) * 100) / 100;
    }
    return Date.now() - this.sessionStartWallClock;
  }
  getWallClock() {
    return Date.now();
  }
  generateEventId(prefix = "evt") {
    const seq = this.nextSequence();
    const rand = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${seq}_${rand}`;
  }
  reset() {
    this.currentSequence = 0;
    this.sessionStartTime = typeof performance !== "undefined" ? performance.now() : 0;
    this.sessionStartWallClock = Date.now();
  }
}
class ElementObserver {
  activeObservation = null;
  registry;
  sequenceCounter;
  constructor(registry) {
    this.registry = registry;
    this.sequenceCounter = new SequenceCounter();
  }
  isObserving() {
    return this.activeObservation !== null;
  }
  /**
   * Start focused observation on a specific element
   */
  startObservation(targetElement, doc = document) {
    if (this.activeObservation) {
      this.stopObservation(doc);
    }
    const observationId = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const startTime = Date.now();
    const initialState = LiveDOMInspector.inspectElement(targetElement, this.registry);
    const targetSelector = initialState.bestSelector;
    const events = [];
    const initialNodeId = this.registry ? this.registry.getOrCreateId(targetElement, 0) : 100;
    events.push({
      id: `evt_init_${observationId}`,
      sessionId: observationId,
      timestamp: 0,
      sequence: 1,
      wallClockTime: startTime,
      type: "DOM_MUTATION_ADD",
      category: "DOM",
      source: "BROWSER_RUNTIME",
      targetNodeId: initialNodeId,
      targetSelector,
      payload: {
        node: {
          id: initialNodeId,
          nodeType: 1,
          tagName: initialState.tag,
          attributes: initialState.attributes,
          textContent: initialState.text,
          children: [],
          parentId: null
        },
        parentId: null,
        index: 0
      }
    });
    const observer = new MutationObserver((mutations) => {
      const relTime = Date.now() - startTime;
      for (const mut of mutations) {
        if (mut.type === "childList") {
          for (let i = 0; i < mut.removedNodes.length; i++) {
            const removed = mut.removedNodes[i];
            if (removed && removed.nodeType === 1) {
              const remEl = removed;
              const remNodeId = this.registry ? this.registry.getId(remEl) || void 0 : void 0;
              const parentNodeId = mut.target && mut.target.nodeType === 1 && this.registry ? this.registry.getId(mut.target) || void 0 : void 0;
              events.push({
                id: `evt_rem_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                sessionId: observationId,
                timestamp: relTime,
                sequence: this.sequenceCounter.nextSequence(),
                wallClockTime: Date.now(),
                type: "DOM_MUTATION_REMOVE",
                category: "DOM",
                source: "PAGE",
                targetNodeId: remNodeId,
                targetSelector: LiveDOMInspector.computeBestSelector(remEl),
                payload: {
                  nodeId: remNodeId || 0,
                  parentId: parentNodeId || null,
                  index: i,
                  removedSubtreeNodeCount: 1
                }
              });
            }
          }
          for (let i = 0; i < mut.addedNodes.length; i++) {
            const added = mut.addedNodes[i];
            if (added && added.nodeType === 1) {
              const addEl = added;
              const addNodeId = this.registry ? this.registry.getOrCreateId(addEl, relTime) : void 0;
              events.push({
                id: `evt_add_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                sessionId: observationId,
                timestamp: relTime,
                sequence: this.sequenceCounter.nextSequence(),
                wallClockTime: Date.now(),
                type: "DOM_MUTATION_ADD",
                category: "DOM",
                source: "PAGE",
                targetNodeId: addNodeId,
                targetSelector: LiveDOMInspector.computeBestSelector(addEl),
                payload: {
                  node: {
                    id: addNodeId || 0,
                    nodeType: 1,
                    tagName: addEl.tagName.toLowerCase(),
                    attributes: {},
                    children: [],
                    parentId: null
                  },
                  parentId: null,
                  index: i
                }
              });
            }
          }
        } else if (mut.type === "attributes" && mut.target && mut.target.nodeType === 1) {
          const targetEl = mut.target;
          const attrNodeId = this.registry ? this.registry.getId(targetEl) || void 0 : void 0;
          const attrName = mut.attributeName || "class";
          events.push({
            id: `evt_attr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            sessionId: observationId,
            timestamp: relTime,
            sequence: this.sequenceCounter.nextSequence(),
            wallClockTime: Date.now(),
            type: "DOM_MUTATION_ATTR",
            category: "DOM",
            source: "PAGE",
            targetNodeId: attrNodeId,
            targetSelector: LiveDOMInspector.computeBestSelector(targetEl),
            payload: {
              nodeId: attrNodeId || 0,
              attributeName: attrName,
              oldValue: mut.oldValue || "",
              newValue: targetEl.getAttribute(attrName) || ""
            }
          });
        }
      }
    });
    try {
      observer.observe(doc.body || doc.documentElement, {
        childList: true,
        attributes: true,
        attributeOldValue: true,
        subtree: true
      });
    } catch {
    }
    this.activeObservation = {
      observationId,
      targetElement,
      targetSelector,
      startTime,
      initialState,
      observer,
      events,
      screenshots: []
    };
    return { observationId, initialState };
  }
  recordExternalEvent(event) {
    if (this.activeObservation) {
      this.activeObservation.events.push(event);
    }
  }
  recordScreenshot(screenshot) {
    if (this.activeObservation) {
      this.activeObservation.screenshots.push(screenshot);
    }
  }
  /**
   * Stop focused observation and assemble correlation bundle
   */
  stopObservation(doc = document) {
    if (!this.activeObservation) {
      throw new Error("No active element observation in progress");
    }
    const {
      observationId,
      targetElement,
      targetSelector,
      startTime,
      initialState,
      observer,
      events,
      screenshots
    } = this.activeObservation;
    observer.disconnect();
    this.activeObservation = null;
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const isStillAttached = doc.contains(targetElement);
    let finalState = null;
    let disappeared = false;
    let disappearanceReason = void 0;
    if (isStillAttached) {
      finalState = LiveDOMInspector.inspectElement(targetElement, this.registry);
      if (finalState.visibility.display === "none" || finalState.visibility.visibility === "hidden" || finalState.visibility.opacity === 0) {
        disappeared = true;
        disappearanceReason = `Element remains attached but is visually obscured (display: ${finalState.visibility.display}, opacity: ${finalState.visibility.opacity})`;
      }
    } else {
      disappeared = true;
      disappearanceReason = "Element was unmounted/removed from the live DOM tree";
    }
    let correlationReport = void 0;
    if (disappeared && events.length > 0) {
      correlationReport = DisappearingElementAnalyzer.analyze(targetSelector, events);
    }
    return {
      observationId,
      targetSelector,
      targetNodeId: initialState.forensics?.logicalNodeId || void 0,
      startTime,
      endTime,
      durationMs,
      initialState,
      finalState,
      disappeared,
      disappearanceReason,
      mutations: events.filter((e) => e.category === "DOM"),
      diagnostics: events.filter((e) => e.category === "ERROR" || e.category === "CONSOLE"),
      networkEvents: events.filter((e) => e.category === "NETWORK"),
      screenshots,
      correlationReport
    };
  }
}
class ElementPicker {
  isExplicitModeActive = false;
  isGlobalShortcutActive = false;
  highlighterEl = null;
  badgeEl = null;
  lastSelectedElement = null;
  options = {};
  onMouseMoveBound;
  onClickBound;
  onKeyDownBound;
  onGlobalClickBound;
  constructor(options = {}) {
    this.options = options;
    this.onMouseMoveBound = this.handleMouseMove.bind(this);
    this.onClickBound = this.handleClick.bind(this);
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onGlobalClickBound = this.handleGlobalCtrlShiftClick.bind(this);
    this.initGlobalShortcutListener();
  }
  /**
   * Always-on listener for Ctrl + Shift + Click anywhere in the document
   */
  initGlobalShortcutListener() {
    if (typeof window === "undefined" || this.isGlobalShortcutActive) return;
    window.addEventListener("click", this.onGlobalClickBound, true);
    this.isGlobalShortcutActive = true;
  }
  /**
   * Start explicit interactive visual element picker mode (with crosshair and hover highlight)
   */
  startPicker(options) {
    if (typeof document === "undefined") return;
    if (options) {
      this.options = { ...this.options, ...options };
    }
    if (this.isExplicitModeActive) return;
    this.isExplicitModeActive = true;
    this.ensureHighlighter();
    if (document.body) {
      document.body.style.cursor = "crosshair";
    }
    window.addEventListener("mousemove", this.onMouseMoveBound, true);
    window.addEventListener("click", this.onClickBound, true);
    window.addEventListener("keydown", this.onKeyDownBound, true);
  }
  /**
   * Stop explicit picker mode and restore normal cursor & DOM state
   */
  stopPicker() {
    if (!this.isExplicitModeActive) return;
    this.isExplicitModeActive = false;
    if (typeof document !== "undefined" && document.body) {
      document.body.style.cursor = "default";
    }
    this.removeHighlighter();
    if (typeof window !== "undefined") {
      window.removeEventListener("mousemove", this.onMouseMoveBound, true);
      window.removeEventListener("click", this.onClickBound, true);
      window.removeEventListener("keydown", this.onKeyDownBound, true);
    }
  }
  /**
   * Retrieve the last element selected via Ctrl+Shift+Click or Picker mode
   */
  getLastSelectedElement() {
    return this.lastSelectedElement;
  }
  /**
   * Set or override the selected element programmatically (supports Element or pre-serialized LiveElementInfo)
   */
  setSelectedElement(element) {
    let info;
    if ("tag" in element && "bestSelector" in element && typeof element.getAttribute !== "function") {
      info = element;
    } else {
      info = LiveDOMInspector.inspectElement(element, this.options.nodeRegistry);
      this.flashSelection(element);
    }
    this.lastSelectedElement = info;
    if (this.options.onSelected) {
      this.options.onSelected(info);
    }
    return info;
  }
  /**
   * Global shortcut handler: Ctrl + Shift + Click
   */
  handleGlobalCtrlShiftClick(e) {
    if (!e.ctrlKey || !e.shiftKey) return;
    const target = e.target;
    if (!target || this.isExtensionOwned(target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const info = this.setSelectedElement(target);
    this.notifyExtension(info);
  }
  /**
   * Explicit mode mouse move handler (updates highlighter bounds)
   */
  handleMouseMove(e) {
    if (!this.isExplicitModeActive) return;
    const target = e.target;
    if (!target || this.isExtensionOwned(target)) {
      this.hideHighlighter();
      return;
    }
    this.updateHighlighter(target);
  }
  /**
   * Explicit mode click handler (selects target and terminates picker)
   */
  handleClick(e) {
    if (!this.isExplicitModeActive) return;
    const target = e.target;
    if (!target || this.isExtensionOwned(target)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const info = this.setSelectedElement(target);
    this.notifyExtension(info);
    this.stopPicker();
  }
  /**
   * Explicit mode keydown handler (Escape cancels picker)
   */
  handleKeyDown(e) {
    if (e.key === "Escape" && this.isExplicitModeActive) {
      e.preventDefault();
      this.stopPicker();
      if (this.options.onCanceled) {
        this.options.onCanceled();
      }
    }
  }
  /**
   * Check if element belongs to extension UI
   */
  isExtensionOwned(element) {
    if (element.id === "forensic-recorder-floating-host" || element.id === "forensic-inspect-highlighter") {
      return true;
    }
    if (element.closest("#forensic-recorder-floating-host") || element.closest("#forensic-inspect-highlighter")) {
      return true;
    }
    if (element.hasAttribute("data-forensic-internal") || element.closest("[data-forensic-internal]")) {
      return true;
    }
    return false;
  }
  /**
   * Create highlighter elements in DOM
   */
  ensureHighlighter() {
    if (typeof document === "undefined" || this.highlighterEl) return;
    const color = this.options.highlightColor || "#0ea5e9";
    const overlay = document.createElement("div");
    overlay.id = "forensic-inspect-highlighter";
    overlay.setAttribute("data-forensic-internal", "true");
    overlay.style.position = "fixed";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "2147483640";
    overlay.style.border = `2px solid ${color}`;
    overlay.style.background = "rgba(14, 165, 233, 0.18)";
    overlay.style.borderRadius = "3px";
    overlay.style.boxShadow = `0 0 12px ${color}88`;
    overlay.style.transition = "all 0.05s ease-out";
    overlay.style.display = "none";
    const badge = document.createElement("div");
    badge.setAttribute("data-forensic-internal", "true");
    badge.style.position = "absolute";
    badge.style.bottom = "100%";
    badge.style.left = "0";
    badge.style.transform = "translateY(-4px)";
    badge.style.background = "#0f172a";
    badge.style.color = "#38bdf8";
    badge.style.fontSize = "11px";
    badge.style.fontFamily = "monospace";
    badge.style.fontWeight = "bold";
    badge.style.padding = "2px 6px";
    badge.style.borderRadius = "3px";
    badge.style.boxShadow = "0 2px 6px rgba(0,0,0,0.5)";
    badge.style.whiteSpace = "nowrap";
    badge.style.pointerEvents = "none";
    overlay.appendChild(badge);
    document.body.appendChild(overlay);
    this.highlighterEl = overlay;
    this.badgeEl = badge;
  }
  updateHighlighter(target) {
    this.ensureHighlighter();
    if (!this.highlighterEl || !this.badgeEl) return;
    const rect = target.getBoundingClientRect();
    this.highlighterEl.style.display = "block";
    this.highlighterEl.style.left = `${rect.left}px`;
    this.highlighterEl.style.top = `${rect.top}px`;
    this.highlighterEl.style.width = `${Math.max(1, rect.width)}px`;
    this.highlighterEl.style.height = `${Math.max(1, rect.height)}px`;
    const tag = target.tagName.toLowerCase();
    const id = target.id ? `#${target.id}` : "";
    const cls = target.className && typeof target.className === "string" ? "." + target.className.split(/\s+/)[0] : "";
    const dims = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
    this.badgeEl.textContent = `<${tag}${id}${cls}> [${dims}]`;
  }
  hideHighlighter() {
    if (this.highlighterEl) {
      this.highlighterEl.style.display = "none";
    }
  }
  removeHighlighter() {
    if (this.highlighterEl && this.highlighterEl.parentElement) {
      this.highlighterEl.remove();
    }
    this.highlighterEl = null;
    this.badgeEl = null;
  }
  /**
   * Flash green outline when selection succeeds
   */
  flashSelection(element) {
    if (typeof document === "undefined" || !element.getBoundingClientRect) return;
    const rect = element.getBoundingClientRect();
    const flash = document.createElement("div");
    flash.setAttribute("data-forensic-internal", "true");
    flash.style.position = "fixed";
    flash.style.left = `${rect.left}px`;
    flash.style.top = `${rect.top}px`;
    flash.style.width = `${Math.max(1, rect.width)}px`;
    flash.style.height = `${Math.max(1, rect.height)}px`;
    flash.style.border = "2px solid #22c55e";
    flash.style.background = "rgba(34, 197, 94, 0.25)";
    flash.style.zIndex = "2147483645";
    flash.style.pointerEvents = "none";
    flash.style.transition = "opacity 0.6s ease-out";
    document.body.appendChild(flash);
    setTimeout(() => {
      flash.style.opacity = "0";
      setTimeout(() => flash.remove(), 600);
    }, 400);
  }
  /**
   * Notify extension background & bridge of new element selection
   */
  notifyExtension(info) {
    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: "ELEMENT_SELECTED",
          elementInfo: info,
          timestamp: Date.now()
        });
      }
    } catch {
    }
  }
  destroy() {
    this.stopPicker();
    if (typeof window !== "undefined") {
      window.removeEventListener("click", this.onGlobalClickBound, true);
    }
    this.isGlobalShortcutActive = false;
  }
}
class NodeRegistry {
  nextId = 1;
  nodeToIdMap = /* @__PURE__ */ new WeakMap();
  idToNodeMap = /* @__PURE__ */ new Map();
  identities = /* @__PURE__ */ new Map();
  parentHistory = /* @__PURE__ */ new Map();
  getOrCreateId(node, timestamp = 0) {
    if (this.nodeToIdMap.has(node)) {
      return this.nodeToIdMap.get(node);
    }
    const id = this.nextId++;
    this.nodeToIdMap.set(node, id);
    this.idToNodeMap.set(id, node);
    const isElement = node.nodeType === VirtualDOMNodeType.ELEMENT_NODE || node.nodeType === 1;
    const element = isElement ? node : null;
    const tagName = element && element.tagName ? element.tagName.toLowerCase() : void 0;
    const isCustomElement = tagName ? tagName.includes("-") : false;
    const identity = {
      id,
      nodeType: node.nodeType,
      tagName,
      createdAt: timestamp,
      initialSelectorHint: element ? this.computeSelector(element) : void 0,
      isCustomElement
    };
    this.identities.set(id, identity);
    return id;
  }
  getId(node) {
    return this.nodeToIdMap.get(node);
  }
  getNode(id) {
    return this.idToNodeMap.get(id);
  }
  getIdentity(id) {
    return this.identities.get(id);
  }
  recordParent(nodeId, parentId) {
    if (!parentId) return;
    const history = this.parentHistory.get(nodeId) || [];
    if (history[history.length - 1] !== parentId) {
      history.push(parentId);
      this.parentHistory.set(nodeId, history);
    }
  }
  getParentHistory(nodeId) {
    return this.parentHistory.get(nodeId) || [];
  }
  computeSelector(element) {
    try {
      const rawId = typeof element.id === "string" ? element.id : element.getAttribute ? element.getAttribute("id") : "";
      if (rawId && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(rawId)) {
        return `#${rawId}`;
      }
      const tagName = element.tagName ? element.tagName.toLowerCase() : "element";
      if (tagName === "body" || tagName === "html" || tagName === "head") {
        return tagName;
      }
      let classListArray = [];
      if (element.classList && typeof element.classList.forEach === "function") {
        classListArray = Array.from(element.classList);
      } else if (typeof element.className === "string") {
        classListArray = element.className.split(/\s+/);
      } else if (element.className && typeof element.className.baseVal === "string") {
        classListArray = element.className.baseVal.split(/\s+/);
      }
      let classSelector = "";
      if (classListArray.length > 0) {
        const validClasses = classListArray.filter((c) => typeof c === "string" && /^[a-zA-Z0-9_-]+$/.test(c) && !c.startsWith("ng-") && !c.startsWith("_ng")).slice(0, 3);
        if (validClasses.length > 0) {
          classSelector = "." + validClasses.join(".");
        }
      }
      if (element.parentElement && element.parentElement.children) {
        const siblings = Array.from(element.parentElement.children).filter(
          (s) => s.tagName && s.tagName.toLowerCase() === tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(element) + 1;
          if (index > 0) {
            return `${tagName}${classSelector}:nth-of-type(${index})`;
          }
        }
      }
      return `${tagName}${classSelector}`;
    } catch {
      return element.tagName ? element.tagName.toLowerCase() : "element";
    }
  }
  computeFullSelectorPath(element) {
    const path2 = [];
    let current = element;
    while (current && current.tagName && current.tagName.toLowerCase() !== "html") {
      const selector = this.computeSelector(current);
      path2.unshift(selector);
      if (current.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(current.id)) {
        break;
      }
      current = current.parentElement;
    }
    return path2.join(" > ");
  }
  removeNode(id) {
    const node = this.idToNodeMap.get(id);
    if (node) {
      this.idToNodeMap.delete(id);
    }
  }
  reset() {
    this.nextId = 1;
    this.nodeToIdMap = /* @__PURE__ */ new WeakMap();
    this.idToNodeMap.clear();
    this.identities.clear();
    this.parentHistory.clear();
  }
}
class SnapshotEngine {
  registry;
  privacy;
  sequenceCounter;
  constructor(registry, privacy, sequenceCounter) {
    this.registry = registry;
    this.privacy = privacy;
    this.sequenceCounter = sequenceCounter;
  }
  captureSnapshot(doc = document, sessionId = "") {
    const timestamp = this.sequenceCounter.getRelativeTimestamp();
    const sequence = this.sequenceCounter.nextSequence();
    const nodes = {};
    const rootElement = doc.documentElement || doc.body;
    const rootId = this.registry.getOrCreateId(doc, timestamp);
    nodes[rootId] = {
      id: rootId,
      nodeType: VirtualDOMNodeType.DOCUMENT_NODE,
      tagName: "#document",
      children: [],
      parentId: null
    };
    if (doc.doctype) {
      const doctypeId = this.registry.getOrCreateId(doc.doctype, timestamp);
      nodes[doctypeId] = {
        id: doctypeId,
        nodeType: VirtualDOMNodeType.DOCUMENT_TYPE_NODE,
        tagName: doc.doctype.name || "html",
        parentId: rootId
      };
      nodes[rootId].children.push(doctypeId);
    }
    if (rootElement) {
      const docElementId = this.serializeNode(rootElement, rootId, nodes, timestamp);
      if (docElementId) {
        nodes[rootId].children.push(docElementId);
      }
    }
    const viewport = this.getViewportInfo();
    return {
      snapshotId: `snap_${sequence}_${Date.now()}`,
      sessionId,
      timestamp,
      sequence,
      rootId,
      nodes,
      title: doc.title || "",
      url: typeof window !== "undefined" ? window.location.href : "",
      origin: typeof window !== "undefined" ? window.location.origin : "",
      viewport,
      doctype: doc.doctype ? doc.doctype.name : void 0,
      totalNodeCount: Object.keys(nodes).length
    };
  }
  serializeNode(node, parentId, nodesAcc, timestamp) {
    if (!node) return null;
    if (node.nodeType === Node.ELEMENT_NODE && this.privacy.shouldBlockNode(node)) {
      return null;
    }
    const id = this.registry.getOrCreateId(node, timestamp);
    this.registry.recordParent(id, parentId);
    const vNode = {
      id,
      nodeType: node.nodeType,
      parentId
    };
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node;
      vNode.tagName = element.tagName.toLowerCase();
      vNode.isCustomElement = vNode.tagName.includes("-");
      vNode.namespaceURI = element.namespaceURI;
      const attributes = {};
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          let val = attr.value;
          if (attr.name.toLowerCase() === "value" && element.tagName.toLowerCase() === "input") {
            const inputType = element.getAttribute("type") || "text";
            val = this.privacy.maskValue(val, inputType, element.getAttribute("name") || void 0);
          }
          attributes[attr.name] = val;
        }
      }
      if (element.tagName.toLowerCase() === "input") {
        const input = element;
        const inputType = input.type || "text";
        attributes["value"] = this.privacy.maskValue(input.value, inputType, input.name);
        if (input.checked) {
          attributes["checked"] = "true";
        }
      } else if (element.tagName.toLowerCase() === "textarea") {
        const textarea = element;
        vNode.textContent = this.privacy.maskValue(textarea.value, "textarea", textarea.name);
      } else if (element.tagName.toLowerCase() === "select") {
        const select = element;
        attributes["value"] = select.value;
      }
      vNode.attributes = attributes;
      this.enrichElementMetrics(element, vNode);
      if (element.shadowRoot) {
        vNode.isShadowHost = true;
        const shadowId = this.registry.getOrCreateId(element.shadowRoot, timestamp);
        const shadowVNode = {
          id: shadowId,
          nodeType: VirtualDOMNodeType.DOCUMENT_FRAGMENT_NODE,
          isShadowRoot: true,
          shadowMode: element.shadowRoot.mode,
          parentId: id,
          children: []
        };
        nodesAcc[shadowId] = shadowVNode;
        for (let i = 0; i < element.shadowRoot.childNodes.length; i++) {
          const childNode = element.shadowRoot.childNodes[i];
          const childId = this.serializeNode(childNode, shadowId, nodesAcc, timestamp);
          if (childId) {
            shadowVNode.children.push(childId);
          }
        }
      }
      vNode.children = [];
      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        const childId = this.serializeNode(childNode, id, nodesAcc, timestamp);
        if (childId) {
          vNode.children.push(childId);
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const parentElement = node.parentElement;
      const isMasked = parentElement ? this.privacy.shouldMaskText(parentElement) : false;
      vNode.textContent = this.privacy.sanitizeText(node.textContent || "", isMasked);
    } else if (node.nodeType === Node.COMMENT_NODE) {
      vNode.textContent = node.textContent || "";
    }
    nodesAcc[id] = vNode;
    return id;
  }
  enrichElementMetrics(element, vNode) {
    try {
      if (typeof window !== "undefined" && window.getComputedStyle) {
        const style = window.getComputedStyle(element);
        const isDisplayNone = style.display === "none";
        const isVisibilityHidden = style.visibility === "hidden" || style.visibility === "collapse";
        const isOpacityZero = parseFloat(style.opacity || "1") === 0;
        vNode.isHidden = isDisplayNone || isVisibilityHidden || isOpacityZero;
        if (element.getBoundingClientRect) {
          const rect = element.getBoundingClientRect();
          vNode.boundingClientRect = {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            bottom: Math.round(rect.bottom),
            right: Math.round(rect.right)
          };
        }
      }
    } catch {
    }
  }
  getViewportInfo() {
    if (typeof window === "undefined") {
      return { width: 1920, height: 1080, scrollX: 0, scrollY: 0, devicePixelRatio: 1 };
    }
    return {
      width: window.innerWidth || document.documentElement?.clientWidth || 1920,
      height: window.innerHeight || document.documentElement?.clientHeight || 1080,
      scrollX: window.scrollX || window.pageXOffset || 0,
      scrollY: window.scrollY || window.pageYOffset || 0,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }
}
class PNGBuilder {
  static crcTable = null;
  static getCrcTable() {
    if (this.crcTable) return this.crcTable;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    this.crcTable = table;
    return table;
  }
  static crc32(buf, offset = 0, length = buf.length) {
    const table = this.getCrcTable();
    let crc = 4294967295;
    for (let i = offset; i < offset + length; i++) {
      crc = crc >>> 8 ^ table[(crc ^ buf[i]) & 255];
    }
    return (crc ^ 4294967295) >>> 0;
  }
  static adler32(buf) {
    let s1 = 1;
    let s2 = 0;
    for (let i = 0; i < buf.length; i++) {
      s1 = (s1 + buf[i]) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    return (s2 << 16 | s1) >>> 0;
  }
  /**
   * Generates a raw PNG binary Buffer/Uint8Array
   */
  static createPNG(opts) {
    const width = Math.max(1, Math.min(1920, Math.floor(opts.width)));
    const height = Math.max(1, Math.min(1080, Math.floor(opts.height)));
    const bg = opts.backgroundColor || [15, 23, 42, 255];
    const headerBg = opts.headerColor || [56, 189, 248, 255];
    const border = opts.borderColor || [99, 102, 241, 255];
    const scanlineLength = 1 + width * 4;
    const rawData = new Uint8Array(scanlineLength * height);
    const headerHeight = Math.min(30, Math.floor(height * 0.2));
    for (let y = 0; y < height; y++) {
      const rowOffset = y * scanlineLength;
      rawData[rowOffset] = 0;
      for (let x = 0; x < width; x++) {
        const pxOffset = rowOffset + 1 + x * 4;
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          rawData[pxOffset] = border[0];
          rawData[pxOffset + 1] = border[1];
          rawData[pxOffset + 2] = border[2];
          rawData[pxOffset + 3] = border[3];
        } else if (y < headerHeight) {
          rawData[pxOffset] = headerBg[0];
          rawData[pxOffset + 1] = headerBg[1];
          rawData[pxOffset + 2] = headerBg[2];
          rawData[pxOffset + 3] = headerBg[3];
        } else {
          rawData[pxOffset] = bg[0];
          rawData[pxOffset + 1] = bg[1];
          rawData[pxOffset + 2] = bg[2];
          rawData[pxOffset + 3] = bg[3];
        }
      }
    }
    const deflated = this.deflateUncompressed(rawData);
    const totalSize = 8 + 25 + (12 + deflated.length) + 12;
    const png = new Uint8Array(totalSize);
    let p = 0;
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < signature.length; i++) png[p++] = signature[i];
    const ihdrData = new Uint8Array(13);
    const ihdrView = new DataView(ihdrData.buffer);
    ihdrView.setUint32(0, width, false);
    ihdrView.setUint32(4, height, false);
    ihdrData[8] = 8;
    ihdrData[9] = 6;
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    p = this.writeChunk(png, p, "IHDR", ihdrData);
    p = this.writeChunk(png, p, "IDAT", deflated);
    p = this.writeChunk(png, p, "IEND", new Uint8Array(0));
    return png;
  }
  /**
   * Generates a valid Base64 data:image/png;base64,... URL
   */
  static createDataUrl(opts) {
    const pngBytes = this.createPNG(opts);
    let binary = "";
    const len = pngBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(pngBytes[i]);
    }
    if (typeof btoa !== "undefined") {
      return `data:image/png;base64,${btoa(binary)}`;
    }
    if (typeof Buffer !== "undefined") {
      return `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`;
    }
    return `data:image/png;base64,${btoa(binary)}`;
  }
  static deflateUncompressed(data) {
    const blocks = [];
    const maxBlockSize = 65535;
    let offset = 0;
    while (offset < data.length) {
      const remaining = data.length - offset;
      const blockSize = Math.min(remaining, maxBlockSize);
      const isFinal = offset + blockSize >= data.length;
      const block = new Uint8Array(5 + blockSize);
      block[0] = isFinal ? 1 : 0;
      block[1] = blockSize & 255;
      block[2] = blockSize >>> 8 & 255;
      const nlen = ~blockSize & 65535;
      block[3] = nlen & 255;
      block[4] = nlen >>> 8 & 255;
      block.set(data.subarray(offset, offset + blockSize), 5);
      blocks.push(block);
      offset += blockSize;
    }
    const totalDeflated = blocks.reduce((sum, b) => sum + b.length, 0) + 2 + 4;
    const result = new Uint8Array(totalDeflated);
    let p = 0;
    result[p++] = 120;
    result[p++] = 1;
    for (const b of blocks) {
      result.set(b, p);
      p += b.length;
    }
    const adler = this.adler32(data);
    result[p++] = adler >>> 24 & 255;
    result[p++] = adler >>> 16 & 255;
    result[p++] = adler >>> 8 & 255;
    result[p++] = adler & 255;
    return result;
  }
  static writeChunk(target, offset, typeStr, data) {
    const len = data.length;
    const view = new DataView(target.buffer, target.byteOffset, target.byteLength);
    view.setUint32(offset, len, false);
    offset += 4;
    const chunkTypeAndData = new Uint8Array(4 + len);
    for (let i = 0; i < 4; i++) {
      const code = typeStr.charCodeAt(i);
      target[offset + i] = code;
      chunkTypeAndData[i] = code;
    }
    offset += 4;
    if (len > 0) {
      target.set(data, offset);
      chunkTypeAndData.set(data, 4);
      offset += len;
    }
    const crc = this.crc32(chunkTypeAndData);
    view.setUint32(offset, crc, false);
    offset += 4;
    return offset;
  }
}
const MUTATION_HISTORY_CAP = 500;
class DOMMutationEngine {
  constructor(doc, registry) {
    this.doc = doc;
    this.registry = registry;
  }
  history = [];
  undoStack = [];
  redoStack = [];
  counter = 0;
  transaction = null;
  // ------------------------------------------------------------------
  // Single mutation (public entry)
  // ------------------------------------------------------------------
  mutate(payload) {
    const mutationId = `mut_${Date.now().toString(36)}_${++this.counter}`;
    const start = Date.now();
    let element;
    try {
      element = this.resolveTarget(payload.target);
    } catch (err) {
      return this.failure(mutationId, payload, null, err.message, Date.now() - start);
    }
    const before = this.snapshotState(element);
    let after = null;
    let diff = null;
    let error;
    let success = true;
    try {
      const undo = this.applyOperation(mutationId, payload, element);
      if (undo) {
        if (this.transaction) {
          this.transaction.undoRecords.push(undo);
        } else {
          this.undoStack.push(undo);
          this.redoStack = [];
        }
      }
      const stillAttached = element.isConnected !== void 0 ? element.isConnected : this.doc.contains(element);
      const finalElement = stillAttached ? element : this.doc.querySelector(before.selector) || element;
      after = this.snapshotState(finalElement);
      diff = this.quickDiff(before, after, element);
    } catch (err) {
      success = false;
      error = err.message;
      after = null;
    }
    const result = {
      mutationId,
      operation: payload.operation,
      success,
      before,
      after,
      diff,
      affectedSelector: success ? before.selector : null,
      durationMs: Date.now() - start,
      error,
      undoable: success && (this.transaction ? this.transaction.undoRecords.length > 0 : this.undoStack.length > 0)
    };
    if (this.transaction) {
      this.transaction.steps.push({
        stepId: `step_${this.transaction.steps.length + 1}`,
        mutation: result
      });
    }
    this.pushHistory({
      mutationId,
      transactionId: this.transaction?.id,
      timestamp: Date.now(),
      operation: payload.operation,
      targetSelector: before.selector,
      success,
      summary: `${payload.operation} on ${before.selector}${diff ? ` (+${diff.added}/-${diff.removed}/~${diff.changed})` : ""}`,
      undoApplied: false,
      redoApplied: false
    });
    return result;
  }
  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------
  beginTransaction() {
    if (this.transaction) {
      throw new Error(`TRANSACTION_ALREADY_OPEN: ${this.transaction.id} — commit or rollback first.`);
    }
    this.transaction = {
      id: `tx_${Date.now().toString(36)}_${++this.counter}`,
      steps: [],
      undoRecords: []
    };
    return this.transaction.id;
  }
  commitTransaction(verify) {
    if (!this.transaction) {
      throw new Error("NO_OPEN_TRANSACTION: begin a transaction before committing.");
    }
    const tx = this.transaction;
    const start = Date.now();
    let verifyPassed = true;
    let error;
    if (verify) {
      try {
        const outcome = verify({ id: tx.id, steps: tx.steps });
        verifyPassed = outcome !== false;
        if (!verifyPassed) error = "VERIFY_FAILED: caller verification rejected the transaction state.";
      } catch (err) {
        verifyPassed = false;
        error = `VERIFY_ERROR: ${err.message}`;
      }
    }
    if (!verifyPassed) {
      return this.rollbackInternal(tx, error || "VERIFY_FAILED", start);
    }
    this.undoStack.push(...tx.undoRecords);
    if (this.undoStack.length > MUTATION_HISTORY_CAP) {
      this.undoStack.splice(0, this.undoStack.length - MUTATION_HISTORY_CAP);
    }
    this.redoStack = [];
    const summary = this.summaryOf(tx);
    this.transaction = null;
    return {
      transactionId: tx.id,
      committed: true,
      rolledBack: false,
      steps: tx.steps,
      durationMs: Date.now() - start,
      finalStateSummary: summary
    };
  }
  rollbackTransaction(reason) {
    if (!this.transaction) {
      throw new Error("NO_OPEN_TRANSACTION: begin a transaction before rolling back.");
    }
    const tx = this.transaction;
    return this.rollbackInternal(tx, reason || "ROLLBACK_REQUESTED", Date.now());
  }
  rollbackInternal(tx, reason, start) {
    for (const record of [...tx.undoRecords].reverse()) {
      try {
        this.applyUndo(record);
      } catch {
      }
    }
    const summary = this.summaryOf(tx);
    this.transaction = null;
    return {
      transactionId: tx.id,
      committed: false,
      rolledBack: true,
      steps: tx.steps,
      error: reason,
      durationMs: Date.now() - start,
      finalStateSummary: summary
    };
  }
  // ------------------------------------------------------------------
  // Undo / Redo
  // ------------------------------------------------------------------
  undo() {
    const source = this.transaction ? this.transaction.undoRecords : this.undoStack;
    const record = source.pop();
    if (!record) {
      return { success: false, message: "Nothing to undo — the mutation history is empty." };
    }
    try {
      this.applyUndo(record);
    } catch (err) {
      source.push(record);
      return { success: false, mutationId: record.mutationId, message: `UNDO_FAILED: ${err.message}` };
    }
    this.redoStack.push(record);
    this.markHistory(record.mutationId, "undo");
    return { success: true, mutationId: record.mutationId, message: `Undid ${record.operation} on ${record.targetSelector}.` };
  }
  redo() {
    const record = this.redoStack.pop();
    if (!record) {
      return { success: false, message: "Nothing to redo — no undone mutation is pending." };
    }
    try {
      const el = this.resolveTarget({ selector: record.targetSelector });
      const payload = { operation: record.operation, target: { selector: record.targetSelector } };
      const reapplied = this.reapplyRecord(record, el, payload);
      if (!reapplied) {
        this.redoStack.push(record);
        return { success: false, mutationId: record.mutationId, message: "REDO_FAILED: target state diverged — cannot safely reapply." };
      }
      (this.transaction ? this.transaction.undoRecords : this.undoStack).push(record);
      this.markHistory(record.mutationId, "redo");
      return { success: true, mutationId: record.mutationId, message: `Redid ${record.operation} on ${record.targetSelector}.` };
    } catch (err) {
      this.redoStack.push(record);
      return { success: false, mutationId: record.mutationId, message: `REDO_FAILED: ${err.message}` };
    }
  }
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }
  getUndoDepth() {
    return this.transaction ? this.transaction.undoRecords.length : this.undoStack.length;
  }
  getRedoDepth() {
    return this.redoStack.length;
  }
  getOpenTransactionId() {
    return this.transaction?.id || null;
  }
  // ------------------------------------------------------------------
  // Preview (§82 dry-run)
  // ------------------------------------------------------------------
  preview(payload) {
    try {
      const element = this.resolveTarget(payload.target);
      const warnings = [];
      let affectedNodes = 1;
      if (payload.operation === "set_inner_html" || payload.operation === "set_outer_html") {
        warnings.push("HTML replacement can destroy descendant node identity — captured regions targeting children may become stale.");
        affectedNodes = element.querySelectorAll("*").length + 1;
      }
      if (payload.operation === "remove_element" || payload.operation === "unwrap_element") {
        warnings.push("Removal is destructive; the undo record preserves the full serialized subtree.");
        affectedNodes = element.querySelectorAll("*").length + 1;
      }
      if (payload.operation === "move_element" && !payload.parent) {
        warnings.push("No parent target supplied — move requires payload.parent.");
      }
      if (payload.operation === "wrap_element" && !payload.newElementHtml) {
        warnings.push("No wrapper HTML supplied — a neutral <div> wrapper will be generated.");
      }
      const expectedChange = describeExpectedChange(payload, element);
      return {
        valid: warnings.filter((w) => w.includes("requires") || w.includes("No parent")).length === 0,
        operation: payload.operation,
        target: { selector: this.snapshotState(element).selector, tag: element.tagName.toLowerCase() },
        expectedChange,
        affectedNodes,
        warnings
      };
    } catch (err) {
      return {
        valid: false,
        operation: payload.operation,
        target: { selector: String(payload.target?.selector || ""), tag: "" },
        expectedChange: "—",
        affectedNodes: 0,
        warnings: [],
        error: err.message
      };
    }
  }
  // ------------------------------------------------------------------
  // Internals — operation application with undo capture
  // ------------------------------------------------------------------
  applyOperation(mutationId, payload, element) {
    const targetSelector = this.snapshotState(element).selector;
    const op = payload.operation;
    switch (op) {
      case "set_attribute": {
        if (!payload.attribute) throw new Error("ATTRIBUTE_REQUIRED: payload.attribute is missing.");
        const previous = element.getAttribute(payload.attribute);
        element.setAttribute(payload.attribute, payload.value ?? "");
        return this.undoFor(mutationId, op, targetSelector, {
          kind: previous === null ? "remove-attribute" : "restore-attribute",
          attribute: payload.attribute,
          value: previous
        });
      }
      case "remove_attribute": {
        if (!payload.attribute) throw new Error("ATTRIBUTE_REQUIRED: payload.attribute is missing.");
        const previous = element.getAttribute(payload.attribute);
        if (previous === null) throw new Error(`ATTRIBUTE_NOT_PRESENT: "${payload.attribute}" is not set on ${targetSelector}.`);
        element.removeAttribute(payload.attribute);
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-attribute", attribute: payload.attribute, value: previous });
      }
      case "set_text": {
        const previous = element.textContent || "";
        element.textContent = payload.text ?? "";
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-text", text: previous });
      }
      case "replace_text": {
        if (!payload.text || !payload.replacement) throw new Error("TEXT_PATTERNS_REQUIRED: payload.text (search) and payload.replacement are required.");
        const previous = element.textContent || "";
        element.textContent = previous.split(payload.text).join(payload.replacement);
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-text", text: previous });
      }
      case "set_inner_html": {
        const previous = element.innerHTML;
        element.innerHTML = payload.html ?? "";
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-outer-html", outerHtml: element.outerHTML.replace(payload.html ?? "", previous) || void 0, text: previous, attribute: "__inner" });
      }
      case "set_outer_html": {
        const previous = element.outerHTML;
        const parent = element.parentElement;
        if (!parent) throw new Error("ORPHAN_ELEMENT: element has no parent — cannot replace outer HTML.");
        const marker = this.doc.createComment(`mcpdom_undo_${mutationId}`);
        element.replaceWith(marker);
        const holder = this.doc.createElement("template");
        holder.innerHTML = payload.html ?? "";
        const replacement = holder.content.firstElementChild;
        if (replacement) {
          marker.replaceWith(replacement);
        } else {
          marker.replaceWith(this.doc.createTextNode(payload.html ?? ""));
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: "reinsert-node", outerHtml: previous, parentSelector: this.snapshotState(parent).selector, nextSiblingSelector: this.siblingSelector(replacement || element) });
      }
      case "add_class": {
        const previous = Array.from(element.classList);
        for (const c of payload.classes || []) element.classList.add(c);
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-classes", classes: previous });
      }
      case "remove_class": {
        const previous = Array.from(element.classList);
        for (const c of payload.classes || []) element.classList.remove(c);
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-classes", classes: previous });
      }
      case "replace_class": {
        const previous = Array.from(element.classList);
        for (const c of payload.classes || []) element.classList.remove(c);
        if (payload.value) element.classList.add(payload.value);
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-classes", classes: previous });
      }
      case "set_style": {
        const win = this.doc.defaultView;
        if (!win?.getComputedStyle) throw new Error("STYLE_UNAVAILABLE: computed style API is unavailable in this context.");
        const previous = {};
        for (const prop of Object.keys(payload.style || {})) {
          previous[prop] = win.getComputedStyle(element).getPropertyValue(prop);
          element.style.setProperty(prop, payload.style[prop]);
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-style", style: previous });
      }
      case "remove_style": {
        const previous = {};
        for (const prop of payload.classes || []) {
          previous[prop] = element.style.getPropertyValue(prop);
          element.style.removeProperty(prop);
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: "restore-style", style: previous });
      }
      case "add_element": {
        const parentEl = payload.parent ? this.resolveTarget(payload.parent) : element;
        const holder = this.doc.createElement("template");
        holder.innerHTML = payload.newElementHtml ?? "<div></div>";
        const newNode = holder.content.firstElementChild;
        if (!newNode) throw new Error("INVALID_HTML: payload.newElementHtml does not produce an element.");
        switch (payload.position || "append") {
          case "before":
            element.before(newNode);
            break;
          case "after":
            element.after(newNode);
            break;
          case "prepend":
            parentEl.prepend(newNode);
            break;
          default:
            parentEl.appendChild(newNode);
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: "remove-node", attribute: this.snapshotState(newNode).selector });
      }
      case "remove_element": {
        const outerHtml = element.outerHTML;
        const parent = element.parentElement;
        const nextSibling = element.nextElementSibling;
        element.remove();
        return this.undoFor(mutationId, op, targetSelector, {
          kind: "reinsert-node",
          outerHtml,
          parentSelector: parent ? this.snapshotState(parent).selector : void 0,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null
        });
      }
      case "replace_element": {
        const outerHtml = element.outerHTML;
        const parent = element.parentElement;
        const holder = this.doc.createElement("template");
        holder.innerHTML = payload.newElementHtml ?? "<div></div>";
        const replacement = holder.content.firstElementChild;
        if (!replacement) throw new Error("INVALID_HTML: payload.newElementHtml does not produce an element.");
        const nextSibling = element.nextElementSibling;
        element.replaceWith(replacement);
        return this.undoFor(mutationId, op, targetSelector, {
          kind: "reinsert-node",
          outerHtml,
          parentSelector: parent ? this.snapshotState(parent).selector : void 0,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null
        });
      }
      case "move_element": {
        if (!payload.parent) throw new Error("PARENT_REQUIRED: payload.parent is required for move_element.");
        const parentEl = this.resolveTarget(payload.parent);
        const outerHtml = element.outerHTML;
        const oldParent = element.parentElement;
        const oldNext = element.nextElementSibling;
        const newNext = payload.position === "before" || payload.position === "prepend" ? parentEl.firstElementChild : null;
        parentEl[payload.position === "prepend" ? "prepend" : "appendChild"](element);
        return this.undoFor(mutationId, op, targetSelector, {
          kind: "restore-position",
          parentSelector: oldParent ? this.snapshotState(oldParent).selector : void 0,
          nextSiblingSelector: oldNext ? this.snapshotState(oldNext).selector : newNext ? this.snapshotState(newNext).selector : null,
          outerHtml
        });
      }
      case "wrap_element": {
        const holder = this.doc.createElement("template");
        holder.innerHTML = payload.newElementHtml || '<div class="mcpdom-wrapper"></div>';
        const wrapper = holder.content.firstElementChild;
        if (!wrapper) throw new Error("INVALID_HTML: wrapper template produced no element.");
        const parent = element.parentElement;
        const nextSibling = element.nextElementSibling;
        element.replaceWith(wrapper);
        wrapper.appendChild(element);
        return this.undoFor(mutationId, op, targetSelector, {
          kind: "restore-position",
          parentSelector: parent ? this.snapshotState(parent).selector : void 0,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null
        });
      }
      case "unwrap_element": {
        const outerHtml = element.outerHTML;
        const parent = element.parentElement;
        if (!parent) throw new Error("ORPHAN_ELEMENT: cannot unwrap a root-level element.");
        const nextSibling = element.nextElementSibling;
        const children = Array.from(element.children);
        for (const child of children) {
          parent.insertBefore(child, element);
        }
        element.remove();
        return this.undoFor(mutationId, op, targetSelector, {
          kind: "reinsert-node",
          outerHtml,
          parentSelector: this.snapshotState(parent).selector,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null
        });
      }
      case "clone_subtree": {
        const parentEl = payload.parent ? this.resolveTarget(payload.parent) : element.parentElement || element;
        const clone = element.cloneNode(true);
        if (payload.copyAttributes !== false) {
          for (const attr of Array.from(clone.attributes)) {
            if (attr.name === "id") clone.removeAttribute("id");
          }
        }
        parentEl.appendChild?.(clone);
        return this.undoFor(mutationId, op, targetSelector, { kind: "remove-node", attribute: this.snapshotState(clone).selector });
      }
      default:
        throw new Error(`UNKNOWN_OPERATION: ${op} is not a supported DOM mutation.`);
    }
  }
  applyUndo(record) {
    const inv = record.inverse;
    switch (inv.kind) {
      case "restore-outer-html": {
        const el = this.resolveTarget({ selector: record.targetSelector });
        if (inv.outerHtml !== void 0) {
          const holder = this.doc.createElement("template");
          holder.innerHTML = inv.outerHtml;
          const restored = holder.content.firstElementChild;
          if (restored) el.replaceWith(restored);
        } else if (inv.attribute === "__inner") {
          el.innerHTML = inv.text || "";
        }
        break;
      }
      case "reinsert-node": {
        const parent = inv.parentSelector ? this.resolveTarget({ selector: inv.parentSelector }) : this.doc.body;
        const holder = this.doc.createElement("template");
        holder.innerHTML = inv.outerHtml || "";
        const restored = holder.content.firstElementChild;
        if (!restored) throw new Error("UNDO_CORRUPT: serialized subtree could not be restored.");
        const anchor = inv.nextSiblingSelector ? this.safeResolve(inv.nextSiblingSelector) : null;
        parent.insertBefore(restored, anchor);
        break;
      }
      case "remove-node": {
        const el = this.safeResolve(inv.attribute || record.targetSelector);
        if (el) el.remove();
        break;
      }
      case "restore-attribute": {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.setAttribute(inv.attribute, inv.value ?? "");
        break;
      }
      case "remove-attribute": {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.removeAttribute(inv.attribute);
        break;
      }
      case "restore-text": {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.textContent = inv.text || "";
        break;
      }
      case "restore-classes": {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.removeAttribute("class");
        for (const c of inv.classes || []) el.classList.add(c);
        break;
      }
      case "restore-style": {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.style.removeProperty("all");
        for (const [prop, value] of Object.entries(inv.style || {})) {
          el.style.setProperty(prop, value);
        }
        break;
      }
      case "restore-position": {
        const holder = this.doc.createElement("template");
        holder.innerHTML = inv.outerHtml || "";
        const restored = holder.content.firstElementChild;
        if (!restored) throw new Error("UNDO_CORRUPT: serialized subtree could not be restored.");
        const current = this.safeResolve(record.targetSelector);
        if (current) current.remove();
        const parent = inv.parentSelector ? this.safeResolve(inv.parentSelector) : this.doc.body;
        const anchor = inv.nextSiblingSelector ? this.safeResolve(inv.nextSiblingSelector) : null;
        (parent || this.doc.body).insertBefore(restored, anchor);
        break;
      }
    }
  }
  reapplyRecord(record, element, payload) {
    const inv = record.inverse;
    switch (record.operation) {
      case "set_attribute": {
        if (inv.kind === "restore-attribute" || inv.kind === "remove-attribute") {
          if (payload.value !== void 0) {
            element.setAttribute(payload.attribute || inv.attribute || "", payload.value);
            return true;
          }
        }
        return false;
      }
      case "add_class": {
        for (const c of payload.classes || []) element.classList.add(c);
        return (payload.classes?.length || 0) > 0;
      }
      case "remove_class": {
        for (const c of payload.classes || inv.classes || []) element.classList.remove(c);
        return true;
      }
      case "set_text": {
        if (payload.text !== void 0) {
          element.textContent = payload.text;
          return true;
        }
        return false;
      }
      case "set_inner_html": {
        if (payload.html !== void 0) {
          element.innerHTML = payload.html;
          return true;
        }
        return false;
      }
      default: {
        return false;
      }
    }
  }
  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  resolveTarget(target) {
    if (!target) throw new Error("TARGET_REQUIRED: mutation requires a target.");
    if (typeof target === "string") target = { selector: target };
    if (target.selector) {
      try {
        const found = this.doc.querySelectorAll(target.selector);
        if (found.length === 1) return found[0];
        if (found.length > 1) {
          const visible = Array.from(found).find((el) => {
            try {
              return LiveDOMInspector.inspectElement(el).visibility.isVisible;
            } catch {
              return false;
            }
          });
          return visible || found[0];
        }
      } catch (err) {
        throw new Error(`TARGET_INVALID: ${err.message}`);
      }
      throw new Error(`TARGET_NOT_FOUND: selector "${target.selector}" matches no element.`);
    }
    if (target.xpath) {
      try {
        const x = this.doc.evaluate(target.xpath, this.doc, null, 9, null);
        const el = x.singleNodeValue;
        if (el) return el;
      } catch (err) {
        throw new Error(`TARGET_INVALID_XPATH: ${err.message}`);
      }
      throw new Error(`TARGET_NOT_FOUND: xpath matches no element.`);
    }
    if (typeof target.nodeId === "number" && this.registry) {
      const node = this.registry.getNode(target.nodeId);
      if (node && node.nodeType === 1 && this.doc.contains(node)) return node;
      throw new Error("TARGET_STALE: logical node id no longer resolves to an attached element.");
    }
    throw new Error("TARGET_INVALID: target has neither selector, xpath nor nodeId.");
  }
  safeResolve(selector) {
    try {
      return this.doc.querySelector(selector);
    } catch {
      return null;
    }
  }
  snapshotState(element) {
    const info = LiveDOMInspector.inspectElement(element, this.registry);
    const outerHtml = element.outerHTML.length > 2e4 ? element.outerHTML.slice(0, 2e4) + "…[truncated]" : element.outerHTML;
    return {
      selector: info.bestSelector,
      outerHtml,
      attributes: this.attrsOf(element)
    };
  }
  attrsOf(element) {
    const out = {};
    for (const attr of Array.from(element.attributes)) {
      out[attr.name] = attr.value.length > 300 ? attr.value.slice(0, 300) + "…" : attr.value;
    }
    return out;
  }
  quickDiff(before, after, element) {
    if (!after) return null;
    let added = 0;
    let removed = 0;
    let changed = 0;
    const beforeKeys = new Set(Object.keys(before.attributes));
    const afterKeys = new Set(Object.keys(after.attributes || {}));
    for (const k of beforeKeys) if (!afterKeys.has(k)) removed++;
    for (const k of afterKeys) {
      if (!beforeKeys.has(k)) added++;
      else if (before.attributes[k] !== after.attributes[k]) changed++;
    }
    if (before.outerHtml !== after.outerHtml && added + removed + changed === 0) changed++;
    const descendantCount = element.querySelectorAll ? element.querySelectorAll("*").length : 0;
    return {
      added,
      removed,
      changed,
      summary: `attributes +${added}/-${removed}/~${changed}; subtree nodes: ${descendantCount}`
    };
  }
  undoFor(mutationId, operation, targetSelector, inverse) {
    return { mutationId, operation, targetSelector, inverse };
  }
  siblingSelector(element) {
    try {
      return this.snapshotState(element).selector;
    } catch {
      return null;
    }
  }
  pushHistory(entry) {
    this.history.push(entry);
    if (this.history.length > MUTATION_HISTORY_CAP) {
      this.history.splice(0, this.history.length - MUTATION_HISTORY_CAP);
    }
  }
  markHistory(mutationId, kind) {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].mutationId === mutationId) {
        if (kind === "undo") this.history[i].undoApplied = true;
        else this.history[i].redoApplied = true;
        return;
      }
    }
  }
  summaryOf(tx) {
    const domLength = this.doc.documentElement?.outerHTML.length || 0;
    const succeeded = tx.steps.filter((s) => s.mutation.success).length;
    return {
      domLength,
      diffSummary: `${succeeded}/${tx.steps.length} mutations applied`
    };
  }
  failure(mutationId, payload, before, message, durationMs) {
    return {
      mutationId,
      operation: payload.operation,
      success: false,
      before: before || { selector: String(payload.target?.selector || "?"), outerHtml: "", attributes: {} },
      after: null,
      diff: null,
      affectedSelector: null,
      durationMs,
      error: message,
      undoable: false
    };
  }
}
function describeExpectedChange(payload, element) {
  switch (payload.operation) {
    case "set_attribute":
      return `attribute "${payload.attribute}" will be set to "${(payload.value ?? "").slice(0, 40)}"`;
    case "remove_attribute":
      return `attribute "${payload.attribute}" will be removed`;
    case "set_text":
      return `text content will be replaced (${(payload.text || "").length} chars)`;
    case "replace_text":
      return `every occurrence of "${payload.text}" will become "${payload.replacement}"`;
    case "set_inner_html":
      return `inner HTML will be replaced (${(payload.html || "").length} chars)`;
    case "set_outer_html":
      return `element (and subtree) will be replaced with provided HTML`;
    case "add_class":
      return `classes ${(payload.classes || []).join(", ")} will be added`;
    case "remove_class":
      return `classes ${(payload.classes || []).join(", ")} will be removed`;
    case "replace_class":
      return `classes ${(payload.classes || []).join(", ")} will be replaced with "${payload.value}"`;
    case "set_style":
      return `inline styles ${Object.keys(payload.style || {}).join(", ")} will be set`;
    case "remove_style":
      return `inline styles ${(payload.classes || []).join(", ")} will be removed`;
    case "add_element":
      return `a new element will be inserted ${payload.position || "append"} the target`;
    case "remove_element":
      return `the element and its subtree will be removed`;
    case "replace_element":
      return `the element will be replaced with new HTML`;
    case "move_element":
      return `the element will be moved into the specified parent`;
    case "wrap_element":
      return `the element will be wrapped in a new container`;
    case "unwrap_element":
      return `children will be lifted out and the wrapper removed`;
    case "clone_subtree":
      return `a deep clone of the subtree will be appended`;
    default:
      return "unknown operation";
  }
}
class JSExecutionEngine {
  executionCounter = 0;
  /**
   * Execute code in the context of the given document.
   * The code string is wrapped in an async IIFE with `return` support:
   *   agents may write `return document.title;`
   */
  async execute(doc, code, options = {}) {
    const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 5e3, 100), 3e4);
    const executionId = `js_${Date.now().toString(36)}_${++this.executionCounter}`;
    const win = doc.defaultView;
    if (!win) {
      return this.result(executionId, "BLOCKED_BY_CONTEXT", 0, code, [], {
        name: "NoWindow",
        message: "The document has no associated window — execution context unavailable."
      });
    }
    const domLengthBefore = doc.documentElement ? doc.documentElement.outerHTML.length : 0;
    const consoleEntries = [];
    const restoreConsole = this.hookConsole(win, consoleEntries);
    let status = "EXECUTED_SUCCESSFULLY";
    let resultValue;
    let error;
    let domLengthAfter = domLengthBefore;
    let timedOut = false;
    const startTime = Date.now();
    try {
      const runner = this.buildRunner(win, code);
      const timeoutPromise = new Promise((_, reject) => {
        const t = setTimeout(() => {
          timedOut = true;
          reject(new Error(`Script timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        t?.unref?.();
      });
      resultValue = await Promise.race([runner, timeoutPromise]);
    } catch (err) {
      if (timedOut) {
        status = "TIMED_OUT";
      } else {
        status = "EXECUTED_WITH_ERROR";
      }
      error = {
        name: err?.name || "Error",
        message: err?.message || String(err),
        stack: err?.stack ? String(err.stack).slice(0, 2e3) : void 0
      };
    }
    const durationMs = Date.now() - startTime;
    domLengthAfter = doc.documentElement ? doc.documentElement.outerHTML.length : 0;
    restoreConsole();
    const serialized = this.serialize(resultValue);
    if (status === "EXECUTED_SUCCESSFULLY" && serialized.serializationFailed) {
      status = "SERIALIZATION_FAILED";
      error = { name: "SerializationError", message: serialized.message || "Result could not be serialized." };
    }
    return {
      status,
      executionId,
      durationMs,
      result: status === "EXECUTED_SUCCESSFULLY" ? serialized.text : void 0,
      error,
      consoleOutput: consoleEntries.slice(0, 100),
      domChanged: domLengthBefore !== domLengthAfter,
      domLengthBefore,
      domLengthAfter,
      world: options.world || "ISOLATED",
      timeoutMs,
      codePreview: code.length > 300 ? code.slice(0, 300) + "…" : code
    };
  }
  buildRunner(win, code) {
    const wrapped = `(async function() {
${code}
})()`;
    const w = win;
    if (typeof w.eval !== "function") {
      return Promise.reject(new Error("BLOCKED_BY_CONTEXT: window.eval is unavailable in this context."));
    }
    try {
      const fn = w.eval(wrapped);
      if (fn && typeof fn.then === "function") return fn;
      return Promise.resolve(fn);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  hookConsole(win, entries) {
    const levels = ["log", "warn", "error", "info", "debug"];
    const originals = {};
    const w = win;
    const MAX = 100;
    for (const level of levels) {
      const original = w.console?.[level];
      if (typeof original !== "function") continue;
      originals[level] = original;
      try {
        w.console[level] = (...args) => {
          if (entries.length < MAX) {
            entries.push({ level, text: args.map(safeStringify).join(" ").slice(0, 300) });
          }
          try {
            original.apply(w.console, args);
          } catch {
          }
        };
      } catch {
      }
    }
    return () => {
      for (const level of levels) {
        if (originals[level]) {
          try {
            w.console[level] = originals[level];
          } catch {
          }
        }
      }
    };
  }
  serialize(value) {
    if (value === void 0) return { text: "undefined" };
    if (value === null) return { text: "null" };
    try {
      if (typeof value === "string") return { text: value.slice(0, 5e3) };
      const json = JSON.stringify(value, replacer, 1);
      if (json === void 0) return { serializationFailed: true, message: "JSON.stringify returned undefined (circular or non-serializable structure)." };
      return { text: json.length > 5e4 ? json.slice(0, 5e4) + "…[truncated]" : json };
    } catch (err) {
      return { serializationFailed: true, message: err?.message || "Serialization failed." };
    }
  }
  result(executionId, status, durationMs, code, consoleOutput, error) {
    return {
      status,
      executionId,
      durationMs,
      error,
      consoleOutput,
      domChanged: false,
      domLengthBefore: 0,
      domLengthAfter: 0,
      world: "ISOLATED",
      timeoutMs: 5e3,
      codePreview: code.length > 300 ? code.slice(0, 300) + "…" : code
    };
  }
}
function replacer(key, value) {
  if (value && typeof value === "object" && value.nodeType === 1) {
    const el = value;
    return {
      __element: true,
      tag: el.tagName.toLowerCase(),
      id: el.getAttribute("id") || void 0,
      selector: el.tagName.toLowerCase() + (el.getAttribute("id") ? `#${el.getAttribute("id")}` : ""),
      text: (el.textContent || "").trim().slice(0, 60)
    };
  }
  if (typeof value === "function") {
    return { __function: true, name: value.name || "anonymous" };
  }
  if (value && value.nodeType === 9) return { __document: true, url: value.location?.href };
  return value;
}
function safeStringify(v) {
  try {
    if (typeof v === "string") return v;
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    const s = JSON.stringify(v, replacer);
    return s === void 0 ? String(v) : s;
  } catch {
    return String(v);
  }
}
const VIEWPORT_PRESETS = {
  // Desktop
  "desktop-full-hd": { width: 1920, height: 1080, category: "desktop" },
  "desktop-hd": { width: 1366, height: 768, category: "desktop" },
  "desktop-laptop": { width: 1440, height: 900, category: "desktop" },
  "desktop-xga": { width: 1280, height: 1024, category: "desktop" },
  "desktop-1024": { width: 1024, height: 768, category: "desktop" },
  // Tablet
  "tablet-ipad": { width: 768, height: 1024, category: "tablet" },
  "tablet-ipad-pro": { width: 1024, height: 1366, category: "tablet" },
  "tablet-portrait": { width: 768, height: 1024, category: "tablet" },
  "tablet-landscape": { width: 1024, height: 768, category: "tablet" },
  // Mobile
  "mobile-iphone-se": { width: 375, height: 667, category: "mobile" },
  "mobile-iphone-12": { width: 390, height: 844, category: "mobile" },
  "mobile-iphone-14-pro-max": { width: 430, height: 932, category: "mobile" },
  "mobile-pixel-7": { width: 412, height: 915, category: "mobile" },
  "mobile-galaxy-s8": { width: 360, height: 740, category: "mobile" },
  "mobile-small": { width: 320, height: 568, category: "mobile" },
  // Common test sizes
  "test-a4": { width: 800, height: 600, category: "test" },
  "test-square": { width: 512, height: 512, category: "test" }
};
const DEVICE_EMULATION_PROFILES = {
  "iphone-13": { width: 390, height: 844, devicePixelRatio: 3, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", touch: true, category: "mobile" },
  "ipad-air": { width: 820, height: 1180, devicePixelRatio: 2, userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", touch: true, category: "tablet" },
  "pixel-7": { width: 412, height: 915, devicePixelRatio: 2.625, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36", touch: true, category: "mobile" },
  "galaxy-s23": { width: 384, height: 800, devicePixelRatio: 3, userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36", touch: true, category: "mobile" },
  "macbook-pro-16": { width: 1728, height: 1080, devicePixelRatio: 2, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", touch: false, category: "desktop" },
  "windows-desktop": { width: 1920, height: 1080, devicePixelRatio: 1, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", touch: false, category: "desktop" }
};
class ViewportController {
  constructor(doc) {
    this.doc = doc;
  }
  original = null;
  modified = false;
  activePreset = null;
  activeDevice = null;
  /**
   * Current viewport state (with original-tracking info).
   */
  state() {
    const win = this.doc.defaultView;
    return {
      width: win?.innerWidth || 0,
      height: win?.innerHeight || 0,
      devicePixelRatio: win?.devicePixelRatio || 1,
      scrollX: win?.scrollX || 0,
      scrollY: win?.scrollY || 0,
      original: this.original,
      isModified: this.modified
    };
  }
  /**
   * Resize the viewport. Records the original dimensions exactly once so the
   * operation is always reversible. Returns before/after page-state deltas.
   */
  resize(width, height, preset) {
    const win = this.doc.defaultView;
    const previous = {
      width: win?.innerWidth || 0,
      height: win?.innerHeight || 0
    };
    const beforeState = this.pageDigest();
    if (!this.original) {
      this.original = { ...previous };
    }
    const applied = this.applySize(width, height);
    this.modified = true;
    this.activePreset = preset || this.activePreset;
    const afterState = this.pageDigest();
    return {
      success: true,
      applied: { width: applied.width, height: applied.height },
      previous,
      original: { ...this.original },
      preset: preset || void 0,
      beforeState,
      afterState,
      reversible: true,
      mode: this.isSimulation() ? "simulation" : "browser-window"
    };
  }
  /**
   * Apply a named preset.
   */
  applyPreset(preset) {
    const p = VIEWPORT_PRESETS[preset];
    if (!p) {
      throw new Error(`UNKNOWN_PRESET: "${preset}". Available: ${Object.keys(VIEWPORT_PRESETS).join(", ")}`);
    }
    return this.resize(p.width, p.height, preset);
  }
  /**
   * Emulate a device profile (viewport + dpr + UA metadata report).
   * In simulation mode the UA string cannot really change — the report
   * documents this honestly instead of faking it.
   */
  emulateDevice(device) {
    const profile = DEVICE_EMULATION_PROFILES[device];
    if (!profile) {
      throw new Error(`UNKNOWN_DEVICE: "${device}". Available: ${Object.keys(DEVICE_EMULATION_PROFILES).join(", ")}`);
    }
    const resize = this.resize(profile.width, profile.height, `device:${device}`);
    this.activeDevice = device;
    const win = this.doc.defaultView;
    if (win && this.isSimulation() && win.devicePixelRatio !== void 0) {
      win.devicePixelRatio = profile.devicePixelRatio;
    }
    return {
      device,
      resize,
      profile: {
        width: profile.width,
        height: profile.height,
        devicePixelRatio: profile.devicePixelRatio,
        touch: profile.touch,
        category: profile.category
      },
      userAgentNote: this.isSimulation() ? "User-Agent override requires the Chrome DevTools Protocol (real browser session); in this context the viewport, dpr and touch metadata are applied and the UA is reported but not enforced." : "User-Agent and touch behaviors are applied by the browser emulation layer.",
      userAgentApplied: !this.isSimulation()
    };
  }
  /**
   * §17 — guaranteed restore of the original viewport.
   */
  reset() {
    const current = {
      width: this.doc.defaultView?.innerWidth || 0,
      height: this.doc.defaultView?.innerHeight || 0
    };
    const original = this.original ? { ...this.original } : { ...current };
    if (this.original) {
      this.applySize(this.original.width, this.original.height);
    }
    this.modified = false;
    this.activePreset = null;
    this.activeDevice = null;
    return {
      success: true,
      applied: { width: original.width, height: original.height },
      previous: current,
      original: { ...original },
      reversible: true,
      mode: this.isSimulation() ? "simulation" : "browser-window"
    };
  }
  /**
   * §38 — run a multi-viewport responsive workflow and ALWAYS restore.
   */
  runResponsiveTest(sizes, options = { restore: true }) {
    const restore = options.restore !== false;
    const originalViewport = this.original ? { ...this.original } : { width: this.doc.defaultView?.innerWidth || 0, height: this.doc.defaultView?.innerHeight || 0 };
    if (!this.original) this.original = { ...originalViewport };
    const steps = sizes.map((size) => {
      this.applySize(size.width, size.height);
      this.modified = true;
      const digest = this.pageDigest();
      return {
        label: size.label,
        width: size.width,
        height: size.height,
        domLength: digest.domLength,
        interactiveCount: digest.interactiveCount,
        horizontalOverflow: this.hasHorizontalOverflow(),
        screenshotId: void 0
      };
    });
    const comparisons = steps.slice(1).map((step, i) => ({
      from: steps[i].label,
      to: step.label,
      domLengthDelta: step.domLength - steps[i].domLength,
      interactiveDelta: step.interactiveCount - steps[i].interactiveCount
    }));
    let finalViewport = { width: steps[steps.length - 1]?.width || 0, height: steps[steps.length - 1]?.height || 0 };
    let restored = false;
    if (restore) {
      this.applySize(originalViewport.width, originalViewport.height);
      this.modified = false;
      finalViewport = { ...originalViewport };
      restored = true;
    }
    return {
      success: true,
      originalViewport,
      steps,
      restored,
      finalViewport,
      comparisons
    };
  }
  getActivePreset() {
    return this.activePreset;
  }
  getActiveDevice() {
    return this.activeDevice;
  }
  // ------------------------------------------------------------------
  applySize(width, height) {
    const w = Math.max(200, Math.min(7680, Math.round(width)));
    const h = Math.max(200, Math.min(4320, Math.round(height)));
    const win = this.doc.defaultView;
    if (win) {
      if (typeof win.innerWidth === "number") win.innerWidth = w;
      if (typeof win.innerHeight === "number") win.innerHeight = h;
      if (typeof win.outerWidth === "number") win.outerWidth = w;
      if (typeof win.outerHeight === "number") win.outerHeight = h;
    }
    return { width: w, height: h };
  }
  pageDigest() {
    const interactive = this.doc.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [onclick]').length;
    return {
      url: this.doc.defaultView?.location?.href || this.doc.location?.href || "",
      domLength: this.doc.documentElement?.outerHTML.length || 0,
      interactiveCount: interactive
    };
  }
  hasHorizontalOverflow() {
    const docEl = this.doc.documentElement;
    const body = this.doc.body;
    const win = this.doc.defaultView;
    if (!win || !docEl) return false;
    const scrollWidth = Math.max(docEl.scrollWidth || 0, body?.scrollWidth || 0);
    return scrollWidth > (win.innerWidth || docEl.clientWidth || 0) + 1;
  }
  isSimulation() {
    return typeof globalThis.__FORENSIC_SIMULATION__ !== "undefined";
  }
}
const VOLATILE_CLASS_PATTERNS = [
  /^css-/,
  /^jsx-/,
  /^sc-[A-Za-z]/,
  /^emotion/,
  /^chakra-/,
  /^mantine-/i,
  /^_ng[a-z]/,
  /^ng-/i,
  /^v-/,
  // hashed utility garbage: letters+digits mix (must contain a digit so real
  // words like "navigation" or "container" are never flagged)
  /^(?=.*\d)[a-z0-9]{6,12}$/i,
  /^data-v-/
];
const STABLE_ATTRIBUTE_NAMES = [
  "id",
  "name",
  "data-testid",
  "data-test",
  "data-id",
  "data-qa",
  "data-cy",
  "data-component",
  "data-role",
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "role",
  "type",
  "href",
  "for",
  "title",
  "alt",
  "rel",
  "placeholder"
];
function stableHash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
function isVolatileClass(className) {
  return VOLATILE_CLASS_PATTERNS.some((p) => p.test(className));
}
function isStableAttribute(name) {
  return STABLE_ATTRIBUTE_NAMES.includes(name);
}
function isVolatileText(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const digitRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;
  if (digitRatio > 0.5) return true;
  if (/^\d+[.,:\-/ ]+\d+/.test(trimmed)) return true;
  if (/\b\d{10,}\b/.test(trimmed)) return true;
  return false;
}
function meaningfulText(element, limit = 80) {
  const own = Array.from(element.childNodes).filter((n) => n.nodeType === 3).map((n) => (n.textContent || "").trim()).join(" ").replace(/\s+/g, " ");
  return own.slice(0, limit);
}
function tagChain(element, depth) {
  const chain = [];
  let cur = element;
  while (cur && chain.length < depth) {
    chain.unshift(cur.tagName.toLowerCase());
    cur = cur.parentElement;
  }
  return chain;
}
class DOMFingerprintEngine {
  /**
   * Build a fingerprint for an element.
   */
  fingerprint(element) {
    const win = element.ownerDocument?.defaultView;
    const stableAttributes = {};
    for (const attr of Array.from(element.attributes)) {
      if (isStableAttribute(attr.name) && attr.value && attr.value.length < 200) {
        stableAttributes[attr.name] = attr.value;
      }
    }
    const allClasses = Array.from(element.classList || []);
    const stableClasses = allClasses.filter((c) => !isVolatileClass(c));
    const text = meaningfulText(element);
    const rect = element.getBoundingClientRect();
    const dimensions = {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
    const ancestors = tagChain(element, 4);
    const ancestorPattern = ancestors.join(">");
    const childTags = Array.from(element.children || []).slice(0, 8).map((c) => c.tagName.toLowerCase());
    const descendantPattern = childTags.join("|");
    const role = element.getAttribute("role") || (win?.getComputedStyle ? void 0 : void 0) || implicitRole(element);
    const hash = stableHash(
      JSON.stringify({
        t: element.tagName.toLowerCase(),
        a: stableAttributes,
        c: stableClasses.slice(0, 4),
        r: role || null,
        anc: ancestorPattern,
        desc: descendantPattern,
        txt: isVolatileText(text) ? null : text.slice(0, 40),
        d: dimensions
      })
    );
    const volatilityReasons = [];
    let volatility = "low";
    if (!stableAttributes["id"] && !stableAttributes["data-testid"] && !stableAttributes["name"]) {
      volatility = "medium";
      volatilityReasons.push("no stable identity attribute");
    }
    if (allClasses.length > 0 && stableClasses.length === 0) {
      volatility = volatilityReasons.length ? "high" : "medium";
      volatilityReasons.push("all classes are framework-generated");
    }
    if (isVolatileText(text)) {
      volatilityReasons.push("text appears dynamic");
      if (volatility === "low") volatility = "medium";
    }
    if (element.tagName.toLowerCase().includes("-")) {
      volatilityReasons.push("custom element (web component)");
      if (volatility === "low") volatility = "medium";
    }
    return {
      fingerprintId: `fp_${hash}`,
      hash,
      tagHierarchy: ancestors,
      stableAttributes,
      meaningfulText: text,
      classes: stableClasses,
      role: role || void 0,
      dimensions,
      ancestorPattern,
      descendantPattern,
      volatilityRisk: volatility,
      volatilityReasons
    };
  }
  /**
   * Compare two fingerprints and produce a similarity score in [0, 1].
   * Explainable component weighting — never fabricates precision.
   */
  compare(a, b) {
    const components = [];
    const tagScore = a.tagHierarchy[0] === b.tagHierarchy[0] ? 1 : 0;
    components.push({ name: "tag", score: tagScore, weight: 0.15 });
    const ancOverlap = overlap(a.ancestorPattern.split(">"), b.ancestorPattern.split(">"));
    components.push({ name: "ancestorPattern", score: ancOverlap, weight: 0.2 });
    const attrScore = attrOverlap(a.stableAttributes, b.stableAttributes);
    components.push({ name: "stableAttributes", score: attrScore, weight: 0.25 });
    const classScore = overlap(a.classes, b.classes);
    components.push({ name: "classes", score: classScore, weight: 0.1 });
    const roleScore = (a.role || "") === (b.role || "") && !!a.role ? 1 : 0;
    components.push({ name: "role", score: roleScore, weight: 0.1 });
    const textScore = a.meaningfulText === b.meaningfulText && a.meaningfulText ? 1 : 0;
    components.push({ name: "text", score: textScore, weight: 0.1 });
    const dimScore = dimensionSimilarity(a.dimensions, b.dimensions);
    components.push({ name: "dimensions", score: dimScore, weight: 0.1 });
    const total = components.reduce((sum, c) => sum + c.score * c.weight, 0);
    return { score: Math.round(total * 1e3) / 1e3, components };
  }
}
function implicitRole(element) {
  const tag = element.tagName.toLowerCase();
  switch (tag) {
    case "a":
      return element.getAttribute("href") ? "link" : void 0;
    case "button":
      return "button";
    case "nav":
      return "navigation";
    case "header":
      return "banner";
    case "footer":
      return "contentinfo";
    case "main":
      return "main";
    case "aside":
      return "complementary";
    case "article":
      return "article";
    case "form":
      return "form";
    case "input": {
      const type = element.getAttribute("type") || "text";
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "button" || type === "submit") return "button";
      return "textbox";
    }
    case "select":
      return "combobox";
    case "textarea":
      return "textbox";
    case "img":
      return "img";
    case "table":
      return "table";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "listitem";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    default:
      return void 0;
  }
}
function overlap(a, b) {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x)).length;
  return shared / Math.max(a.length, b.length);
}
function attrOverlap(a, b) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (!keysA.length && !keysB.length) return 0.5;
  if (!keysA.length || !keysB.length) return 0;
  let shared = 0;
  let compared = 0;
  for (const k of keysA) {
    if (k in b) {
      compared++;
      if (a[k] === b[k]) shared++;
    }
  }
  if (compared === 0) return 0;
  return shared / Math.max(keysA.length, keysB.length);
}
function dimensionSimilarity(a, b) {
  if (a.width === 0 && a.height === 0 && b.width === 0 && b.height === 0) return 0.5;
  const wSim = similarNumber(a.width, b.width);
  const hSim = similarNumber(a.height, b.height);
  return (wSim + hSim) / 2;
}
function similarNumber(a, b) {
  if (a === b) return 1;
  if (a === 0 || b === 0) return 0;
  const ratio = Math.min(a, b) / Math.max(a, b);
  return ratio > 0.9 ? 1 : ratio > 0.7 ? 0.5 : 0;
}
const SEMANTIC_ATTRS = [
  "data-testid",
  "data-test",
  "data-id",
  "data-qa",
  "data-cy",
  "data-component",
  "data-role",
  "aria-label",
  "name",
  "id"
];
const VALID_ID = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const VALID_ATTR_VALUE = /^[a-zA-Z0-9_ .:-]+$/;
class SelectorRobustnessEngine {
  doc;
  constructor(doc) {
    this.doc = doc;
  }
  /**
   * Generate the full ranked candidate list for an element.
   */
  generateCandidates(element) {
    const candidates = [];
    const tag = element.tagName.toLowerCase();
    const id = element.getAttribute("id");
    if (id && VALID_ID.test(id)) {
      const selector = `#${cssEscape(id)}`;
      candidates.push(this.evaluate(element, selector, "id", 1, ["unique stable id"]));
    }
    for (const attr of SEMANTIC_ATTRS) {
      if (attr === "id") continue;
      const value = element.getAttribute(attr);
      if (value && VALID_ATTR_VALUE.test(value) && value.length < 100) {
        const selector = `${tag}[${attr}="${escapeAttr(value)}"]`;
        candidates.push(
          this.evaluate(element, selector, "semantic-attribute", 0.92, [`semantic attribute ${attr}`])
        );
      }
    }
    const stableClasses = Array.from(element.classList || []).filter((c) => !isVolatileClass(c));
    if (stableClasses.length) {
      const classSelector = `${tag}.${stableClasses.slice(0, 3).map(cssEscape).join(".")}`;
      candidates.push(
        this.evaluate(element, classSelector, "class", 0.72, stableClasses.length ? ["stable class names"] : [])
      );
    }
    const structural = this.buildStructuralPath(element);
    if (structural) {
      candidates.push(
        this.evaluate(element, structural, "structural-path", 0.55, ["position-based structural path"])
      );
    }
    const ownText = directText(element);
    if (ownText && ownText.length >= 2 && ownText.length <= 60 && !isVolatileText(ownText)) {
      const selector = `${tag}:nth-of-type(1)`;
      const xpath = this.buildTextXPath(element, ownText);
      if (xpath) {
        candidates.push({
          selector,
          strategy: "text-derived-xpath",
          confidence: 0.6,
          unique: this.isXPathUnique(xpath),
          reasons: [`matches text "${ownText.slice(0, 30)}"`]
        });
        candidates[candidates.length - 1].xpath = xpath;
      }
    }
    const fingerprintSelector = this.buildAttributeFingerprintSelector(element);
    if (fingerprintSelector) {
      candidates.push(
        this.evaluate(element, fingerprintSelector, "attribute-fingerprint", 0.68, ["combination of stable attributes"])
      );
    }
    const seen = /* @__PURE__ */ new Map();
    for (const c of candidates) {
      const key = c.strategy === "text-derived-xpath" ? `xpath:${c.xpath}` : c.selector;
      const existing = seen.get(key);
      if (!existing || c.confidence > existing.confidence) {
        seen.set(key, c);
      }
    }
    return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
  }
  /**
   * Best selector = highest-confidence unique candidate, else first candidate.
   */
  bestSelector(element) {
    const candidates = this.generateCandidates(element);
    const best = candidates.find((c) => c.unique && c.confidence >= 0.7) || candidates[0];
    return {
      selector: best?.selector || element.tagName.toLowerCase(),
      strategy: best?.strategy || "tag",
      confidence: best?.confidence || 0.3
    };
  }
  /**
   * XPath for an element (absolute-ish, using ids where available).
   */
  buildXPath(element) {
    const segments = [];
    let cur = element;
    while (cur && cur !== this.doc.documentElement) {
      const id = cur.getAttribute("id");
      if (id && VALID_ID.test(id)) {
        segments.unshift(`*[@id="${escapeAttr(id)}"]`);
        break;
      }
      const parent = cur.parentElement;
      if (!parent) {
        segments.unshift(cur.tagName.toLowerCase());
        break;
      }
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
      const idx = sameTag.indexOf(cur) + 1;
      segments.unshift(`${cur.tagName.toLowerCase()}[${idx}]`);
      cur = parent;
    }
    if (cur === this.doc.documentElement && (!segments.length || !segments[0].includes("@id"))) {
      segments.unshift("html");
    }
    return "//" + segments.join("/");
  }
  buildTextXPath(element, text) {
    try {
      const tag = element.tagName.toLowerCase();
      const escaped = escapeXPathText(text);
      return `//${tag}[normalize-space(text())=${escaped}]`;
    } catch {
      return null;
    }
  }
  buildStructuralPath(element, maxDepth = 4) {
    const parts = [];
    let cur = element;
    while (cur && parts.length < maxDepth) {
      const parent = cur.parentElement;
      const tag = cur.tagName.toLowerCase();
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
      if (sameTag.length > 1) {
        const idx = sameTag.indexOf(cur) + 1;
        parts.unshift(`${tag}:nth-of-type(${idx})`);
      } else {
        parts.unshift(tag);
      }
      cur = parent;
      if (cur === this.doc.body) {
        parts.unshift("body");
        break;
      }
      if (cur === this.doc.documentElement) break;
    }
    const selector = parts.join(" > ");
    if (!selector.includes("body")) return "body > " + selector;
    return selector;
  }
  buildAttributeFingerprintSelector(element) {
    const tag = element.tagName.toLowerCase();
    const parts = [];
    const type = element.getAttribute("type");
    if (type) parts.push(`type="${escapeAttr(type)}"`);
    const href = element.getAttribute("href");
    if (href && href.length < 80 && !href.startsWith("javascript:")) parts.push(`href^="${escapeAttr(href.slice(0, 40))}"`);
    const placeholder = element.getAttribute("placeholder");
    if (placeholder && placeholder.length < 60) parts.push(`placeholder="${escapeAttr(placeholder)}"`);
    if (parts.length >= 2) {
      return `${tag}[${parts.join("][")}]`;
    }
    return null;
  }
  evaluate(element, selector, strategy, baseConfidence, reasons) {
    let unique = false;
    let matches = 0;
    try {
      const found = this.doc.querySelectorAll(selector);
      matches = found.length;
      unique = found.length === 1 && found[0] === element;
    } catch {
      return { selector, strategy, confidence: 0, unique: false, reasons: ["invalid selector syntax"] };
    }
    let confidence = baseConfidence;
    if (matches === 0) {
      confidence = 0;
      reasons.push("selector matched nothing (invalid candidate)");
    } else if (matches === 1 && unique) {
      reasons.push("matches exactly this element");
    } else {
      confidence = confidence * 0.4;
      reasons.push(`matches ${matches} elements — ambiguous`);
    }
    return {
      selector,
      strategy,
      confidence: Math.round(confidence * 100) / 100,
      unique,
      reasons
    };
  }
  isXPathUnique(xpath) {
    try {
      const result = this.doc.evaluate(
        `count(${xpath})`,
        this.doc,
        null,
        4,
        null
      );
      return result.numberValue === 1;
    } catch {
      return false;
    }
  }
}
function directText(element) {
  return Array.from(element.childNodes).filter((n) => n.nodeType === 3).map((n) => (n.textContent || "").trim()).join(" ").replace(/\s+/g, " ");
}
function cssEscape(value) {
  return value.replace(/([^a-zA-Z0-9_\u00A0-\uFFFF-])/g, "\\$1");
}
function escapeAttr(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function escapeXPathText(text) {
  if (text.includes("'")) {
    if (text.includes('"')) {
      return `concat(${text.split("'").map((part) => `'${part}'`).join(`, "'", `)})`;
    }
    return `"${text}"`;
  }
  return `'${text}'`;
}
class ElementTargetingEngine {
  constructor(doc, registry) {
    this.doc = doc;
    this.registry = registry;
  }
  fingerprintEngine = new DOMFingerprintEngine();
  counter = 0;
  buildTarget(element, resolvedFrom = "selector") {
    const selectorEngine = new SelectorRobustnessEngine(this.doc);
    const candidates = selectorEngine.generateCandidates(element);
    const best = selectorEngine.bestSelector(element);
    const fingerprint = this.fingerprintEngine.fingerprint(element);
    const info = LiveDOMInspector.inspectElement(element, this.registry);
    const rect = element.getBoundingClientRect();
    let confidence = best.confidence * 0.6;
    if (fingerprint.volatilityRisk === "low") confidence += 0.3;
    else if (fingerprint.volatilityRisk === "medium") confidence += 0.15;
    const uniqueCandidate = candidates.find((c) => c.unique && c.confidence >= 0.9);
    if (uniqueCandidate) confidence += 0.1;
    confidence = Math.max(0.05, Math.min(1, confidence));
    this.counter++;
    return {
      targetId: `tgt_${Date.now().toString(36)}_${this.counter}`,
      tag: element.tagName.toLowerCase(),
      role: info.role || fingerprint.role,
      selector: best.selector,
      selectorCandidates: candidates,
      xpath: selectorEngine.buildXPath(element),
      domPath: (info.context?.parentChain || []).concat(best.selector).join(" > "),
      textFingerprint: fingerprint.meaningfulText,
      attributeFingerprint: JSON.stringify(fingerprint.stableAttributes),
      structuralFingerprint: fingerprint.hash,
      attributes: info.attributes || {},
      confidence: Math.round(confidence * 100) / 100,
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      resolvedFrom
    };
  }
  /**
   * Resolve a target spec to a live element using the platform's
   * deterministic resolution order, then build the TARGET representation.
   */
  resolveAndBuild(spec) {
    let element = null;
    let resolvedFrom = "unknown";
    if (typeof spec === "string") {
      spec = { selector: spec };
    }
    const s = spec;
    if (s.selectedElementRef) {
      resolvedFrom = "selectedElementRef";
    }
    if (!element && s.selector) {
      try {
        const found = this.doc.querySelectorAll(s.selector);
        if (found.length === 0) return { error: `TARGET_NOT_FOUND: selector "${s.selector}" matches no element` };
        if (found.length > 1) {
          element = firstVisible(found, this.doc) || found[0];
          resolvedFrom += "+disambiguated";
        } else {
          element = found[0];
          resolvedFrom = "selector";
        }
      } catch (err) {
        return { error: `TARGET_INVALID: ${err.message}` };
      }
    }
    if (!element && s.xpath) {
      try {
        const x = this.doc.evaluate(s.xpath, this.doc, null, 9, null);
        element = x.singleNodeValue;
        resolvedFrom = "xpath";
      } catch (err) {
        return { error: `TARGET_INVALID_XPATH: ${err.message}` };
      }
    }
    if (!element && typeof s.nodeId === "number" && this.registry) {
      const n = this.registry.getNode(s.nodeId);
      if (n && n.nodeType === 1 && this.doc.contains(n)) {
        element = n;
        resolvedFrom = "nodeId";
      }
    }
    if (!element && s.coordinates) {
      element = this.doc.elementFromPoint(s.coordinates.x, s.coordinates.y);
      resolvedFrom = "coordinates";
    }
    if (!element) return { error: "TARGET_NOT_FOUND: no usable resolution strategy succeeded" };
    return { element, target: this.buildTarget(element, resolvedFrom) };
  }
}
function firstVisible(nodes, doc) {
  for (const n of Array.from(nodes)) {
    const el = n;
    try {
      const vis = LiveDOMInspector.inspectElement(el).visibility;
      if (vis.isVisible) return el;
    } catch {
    }
  }
  return null;
}
class SelectorRecoveryEngine {
  constructor(doc) {
    this.doc = doc;
  }
  fingerprintEngine = new DOMFingerprintEngine();
  /**
   * Attempt recovery of a failed selector against the live document.
   */
  recover(failedSelector, snapshot) {
    const diagnostics = [];
    const alternatives = [];
    let live = null;
    try {
      live = this.doc.querySelectorAll(failedSelector);
    } catch (err) {
      diagnostics.push(`selector syntax error: ${err.message}`);
    }
    if (live && live.length > 0) {
      diagnostics.push("selector still matches — no recovery needed");
      const el = live[0];
      return {
        recovered: true,
        confidence: 1,
        strategy: "original-selector",
        resolvedSelector: failedSelector,
        matchedElementInfo: describe(el),
        alternatives: [],
        diagnostics,
        recommendation: "Original selector works; the earlier failure was transient (likely a navigation or render race)."
      };
    }
    diagnostics.push("selector no longer matches any element");
    const candidates = this.collectCandidates(snapshot, diagnostics);
    const scored = candidates.map((el) => ({ element: el, score: this.scoreMatch(el, snapshot) })).filter((c) => c.score.score > 0.35).sort((a, b) => b.score.score - a.score.score);
    for (const c of scored.slice(0, 5)) {
      const sel = new SelectorRobustnessEngine(this.doc).bestSelector(c.element);
      alternatives.push({ selector: sel.selector, confidence: Math.round(c.score.score * 100) / 100, strategy: "recovery-match" });
    }
    if (!scored.length) {
      return {
        recovered: false,
        confidence: 0,
        strategy: "none",
        alternatives,
        diagnostics,
        recommendation: "No sufficiently similar element exists. The region may have been removed, or the page structure changed fundamentally. Re-inspect the page and capture a new target."
      };
    }
    const best = scored[0];
    const margin = scored.length > 1 ? best.score.score - scored[1].score.score : 1;
    diagnostics.push(`best candidate score: ${best.score.score.toFixed(3)} (margin ${margin.toFixed(3)})`);
    for (const comp of best.score.components) {
      if (comp.score > 0) diagnostics.push(`  - ${comp.name}: ${(comp.score * 100).toFixed(0)}%`);
    }
    const SAFE_THRESHOLD = 0.62;
    const SAFE_MARGIN = 0.15;
    if (best.score.score < SAFE_THRESHOLD || scored.length > 1 && margin < SAFE_MARGIN) {
      return {
        recovered: false,
        confidence: Math.round(best.score.score * 100) / 100,
        strategy: "recovery-refused",
        resolvedSelector: alternatives[0]?.selector,
        alternatives,
        diagnostics,
        recommendation: "Recovery refused: best match is not confident enough or too close to a competing element. Inspect alternatives manually before acting — refusing to avoid acting on a wrong element."
      };
    }
    const recoveredSelector = new SelectorRobustnessEngine(this.doc).bestSelector(best.element).selector;
    return {
      recovered: true,
      confidence: Math.round(best.score.score * 100) / 100,
      strategy: "fingerprint-recovery",
      resolvedSelector: recoveredSelector,
      matchedElementInfo: describe(best.element),
      alternatives,
      diagnostics,
      recommendation: `Recovered target with ${(best.score.score * 100).toFixed(0)}% confidence. Verify the resolved selector before destructive actions.`
    };
  }
  collectCandidates(snapshot, diagnostics) {
    const pool = /* @__PURE__ */ new Set();
    const byTag = this.doc.querySelectorAll(snapshot.tag);
    let seen = 0;
    for (const el of Array.from(byTag)) {
      pool.add(el);
      if (++seen >= 400) break;
    }
    if (snapshot.classes?.length) {
      const stable = snapshot.classes.filter((c) => !isVolatileClass(c));
      for (const cls of stable.slice(0, 2)) {
        try {
          for (const el of Array.from(this.doc.querySelectorAll(`.${cls}`)).slice(0, 100)) {
            pool.add(el);
          }
        } catch {
        }
      }
    }
    if (snapshot.stableAttributes?.name) {
      try {
        for (const el of Array.from(this.doc.querySelectorAll(`[name="${snapshot.stableAttributes.name}"]`))) {
          pool.add(el);
        }
      } catch {
      }
    }
    if (snapshot.parentSelector) {
      try {
        for (const el of Array.from(this.doc.querySelectorAll(`${snapshot.parentSelector} > ${snapshot.tag}`)).slice(0, 100)) {
          pool.add(el);
        }
      } catch {
      }
    }
    diagnostics.push(`collected ${pool.size} candidate elements for scoring`);
    return Array.from(pool);
  }
  scoreMatch(element, snapshot) {
    const components = [];
    const tagMatch = element.tagName.toLowerCase() === snapshot.tag.toLowerCase() ? 1 : 0;
    components.push({ name: "tag", score: tagMatch, weight: 0.15 });
    const snapText = (snapshot.text || "").trim().slice(0, 40);
    const elDirect = directText(element).slice(0, 40);
    const elSubtree = (element.textContent || "").trim().slice(0, 40);
    let textScore = 0;
    if (snapText) {
      const directScore = elDirect ? elDirect === snapText ? 1 : partialTextScore(snapText, elDirect) : 0;
      const subtreeScore = elSubtree ? elSubtree === snapText ? 1 : partialTextScore(snapText, elSubtree) : 0;
      textScore = Math.max(directScore, subtreeScore);
    }
    components.push({ name: "text", score: textScore, weight: 0.3 });
    const snapClasses = new Set((snapshot.classes || []).filter((c) => !isVolatileClass(c)));
    const elClasses = Array.from(element.classList || []);
    const classScore = snapClasses.size ? elClasses.filter((c) => snapClasses.has(c)).length / snapClasses.size : 0.5;
    components.push({ name: "classes", score: classScore, weight: 0.2 });
    const snapAttrs = snapshot.stableAttributes || {};
    const attrKeys = Object.keys(snapAttrs);
    let attrScore = 0.5;
    if (attrKeys.length) {
      let matched = 0;
      for (const k of attrKeys) {
        if (element.getAttribute(k) === snapAttrs[k]) matched++;
      }
      attrScore = matched / attrKeys.length;
    }
    components.push({ name: "attributes", score: attrScore, weight: 0.2 });
    const childScore = snapshot.childCount !== void 0 ? element.children.length === snapshot.childCount ? 1 : partialTextScore(String(snapshot.childCount), String(element.children.length)) : 0.5;
    components.push({ name: "childCount", score: childScore, weight: 0.05 });
    if (snapshot.fingerprintHash) {
      const fp = {
        fingerprintId: "snapshot",
        hash: snapshot.fingerprintHash,
        tagHierarchy: [snapshot.tag],
        stableAttributes: snapAttrs,
        meaningfulText: snapText,
        classes: snapshot.classes || [],
        dimensions: { width: 0, height: 0 },
        ancestorPattern: "",
        descendantPattern: "",
        volatilityRisk: "medium",
        volatilityReasons: []
      };
      const live = this.fingerprintEngine.fingerprint(element);
      const cmp = this.fingerprintEngine.compare(fp, live);
      components.push({ name: "fingerprint", score: cmp.score, weight: 0.1 });
    }
    const total = components.reduce((sum, c) => sum + c.score * c.weight, 0);
    return { score: Math.max(0, Math.min(1, total)), components };
  }
  /**
   * Diagnose why a selector fails (capability 45 — failed-selector diagnostics).
   */
  diagnose(selector) {
    const diagnosis = [];
    let valid = true;
    let matches = 0;
    let parseError;
    let relaxed = [];
    try {
      matches = this.doc.querySelectorAll(selector).length;
    } catch (err) {
      valid = false;
      parseError = err.message;
      diagnosis.push("Selector is syntactically invalid CSS.");
    }
    if (valid && matches === 0) {
      diagnosis.push("Selector parses but matches nothing — element may be removed, re-rendered, or inside a shadow root.");
      relaxed = this.relaxSelector(selector);
      for (const r of relaxed) {
        try {
          if (this.doc.querySelectorAll(r).length > 0) {
            diagnosis.push(`Relaxed form "${r}" matches — the over-specific part of the selector is stale.`);
            break;
          }
        } catch {
        }
      }
    }
    if (valid && matches > 1) {
      diagnosis.push(`Selector matches ${matches} elements — it is ambiguous; use a more specific form or index.`);
    }
    return {
      selector,
      valid,
      matches,
      parseError,
      closestWorkingSelectors: relaxed.filter((r) => {
        try {
          return this.doc.querySelectorAll(r).length > 0;
        } catch {
          return false;
        }
      }),
      diagnosis
    };
  }
  relaxSelector(selector) {
    const relaxed = [];
    const parts = selector.split(/[ >]+/).filter(Boolean);
    if (parts.length > 1) {
      relaxed.push(parts.slice(0, -1).join(" "));
      relaxed.push(parts[parts.length - 1]);
    }
    const stripped = selector.replace(/:nth-of-type\(\d+\)/g, "").replace(/\.[^. >#:[]+/g, (m, off, str) => str[off - 1] === "\\" ? m : "");
    if (stripped !== selector && stripped.trim()) relaxed.push(stripped.trim());
    return relaxed;
  }
}
function partialTextScore(a, b) {
  if (!a || !b) return 0;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  const wa = new Set(na.split(/\s+/));
  const wb = new Set(nb.split(/\s+/));
  const shared = Array.from(wa).filter((w) => wb.has(w)).length;
  return shared / Math.max(wa.size, wb.size);
}
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function describe(el) {
  return {
    tag: el.tagName.toLowerCase(),
    id: el.getAttribute("id") || void 0,
    text: directText(el).slice(0, 60),
    classes: Array.from(el.classList || [])
  };
}
const selectorRecovery = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SelectorRecoveryEngine
}, Symbol.toStringTag, { value: "Module" }));
class SeededRandom {
  state;
  constructor(seed) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 2654435769;
  }
  next() {
    this.state = this.state + 1831565813 >>> 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(min, max) {
    return min + this.next() * (max - min);
  }
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }
  chance(probability) {
    return this.next() < probability;
  }
}
const DEFAULT_PROFILES = {
  DETERMINISTIC: {
    name: "DETERMINISTIC",
    description: "Zero-delay programmatic execution. Fully reproducible; identical to the legacy engine behavior.",
    moveDelayMs: { min: 0, max: 0 },
    clickDelayMs: { min: 0, max: 0 },
    typeDelayMs: { min: 0, max: 0 },
    keyDelayMs: { min: 0, max: 0 },
    hesitationProbability: 0,
    trajectorySteps: 1
  },
  BALANCED: {
    name: "BALANCED",
    description: "Small natural delays; fast but not machine-like. Suitable for routine automation against rate-limited UIs.",
    moveDelayMs: { min: 30, max: 80 },
    clickDelayMs: { min: 40, max: 120 },
    typeDelayMs: { min: 20, max: 60 },
    keyDelayMs: { min: 30, max: 90 },
    hesitationProbability: 0.08,
    trajectorySteps: 3,
    seed: 1337
  },
  HUMAN_LIKE: {
    name: "HUMAN_LIKE",
    description: "Realistic cadence with key-by-key typing variance, movement trajectories, and occasional hesitation pauses.",
    moveDelayMs: { min: 90, max: 260 },
    clickDelayMs: { min: 120, max: 420 },
    typeDelayMs: { min: 60, max: 180 },
    keyDelayMs: { min: 70, max: 220 },
    hesitationProbability: 0.22,
    trajectorySteps: 8,
    seed: 4242
  },
  CUSTOM: {
    name: "CUSTOM",
    description: "User-supplied timing parameters. Falls back to BALANCED values for unspecified fields.",
    moveDelayMs: { min: 30, max: 80 },
    clickDelayMs: { min: 40, max: 120 },
    typeDelayMs: { min: 20, max: 60 },
    keyDelayMs: { min: 30, max: 90 },
    hesitationProbability: 0.05,
    trajectorySteps: 3
  }
};
class HumanInteractionController {
  activeProfile = "DETERMINISTIC";
  customProfile = { ...DEFAULT_PROFILES.CUSTOM };
  rng;
  lastActionTiming;
  constructor(seed) {
    this.rng = new SeededRandom(seed ?? 1);
  }
  getProfile() {
    if (this.activeProfile === "CUSTOM") return { ...this.customProfile };
    return { ...DEFAULT_PROFILES[this.activeProfile] };
  }
  getActiveProfileName() {
    return this.activeProfile;
  }
  setActiveProfile(name, overrides) {
    if (!DEFAULT_PROFILES[name]) {
      throw new Error(`Unknown interaction profile: ${name}. Available: ${Object.keys(DEFAULT_PROFILES).join(", ")}`);
    }
    if (name === "CUSTOM" && overrides) {
      this.customProfile = {
        ...DEFAULT_PROFILES.CUSTOM,
        ...overrides,
        name: "CUSTOM"
      };
    }
    this.activeProfile = name;
    this.resetSeed();
    return this.getProfile();
  }
  setSeed(seed) {
    this.rng = new SeededRandom(seed);
  }
  resetSeed() {
    const profile = this.getProfile();
    this.rng = new SeededRandom(profile.seed ?? 1);
  }
  /**
   * Draw a delay for a specific action phase. Records the drawn value for
   * the inspectable timing report (Human Mode Safety).
   */
  delay(phase) {
    const profile = this.getProfile();
    let ms;
    switch (phase) {
      case "move":
        ms = this.rng.range(profile.moveDelayMs.min, profile.moveDelayMs.max);
        break;
      case "click":
        ms = this.rng.range(profile.clickDelayMs.min, profile.clickDelayMs.max);
        break;
      case "type":
        ms = this.rng.range(profile.typeDelayMs.min, profile.typeDelayMs.max);
        break;
      case "key":
        ms = this.rng.range(profile.keyDelayMs.min, profile.keyDelayMs.max);
        break;
      case "hesitation":
        ms = this.chance() ? this.rng.range(300, 900) : 0;
        break;
    }
    return Math.round(ms);
  }
  /**
   * Whether a hesitation pause should occur this action.
   */
  shouldHesitate() {
    return this.rng.chance(this.getProfile().hesitationProbability);
  }
  /**
   * Generate a pointer movement trajectory between two points.
   * Returns interpolated waypoints (count from the active profile).
   * The path is a slightly-curved interpolation — never teleporting,
   * never wildly overshooting.
   */
  trajectory(from, to) {
    const profile = this.getProfile();
    const steps = Math.max(1, profile.trajectorySteps);
    const waypoints = [];
    const arcX = (this.rng.next() - 0.5) * Math.abs(to.x - from.x) * 0.15;
    const arcY = (this.rng.next() - 0.5) * Math.abs(to.y - from.y) * 0.15;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const eased = t * t * (3 - 2 * t);
      waypoints.push({
        x: Math.round(from.x + (to.x - from.x) * eased + arcX * Math.sin(Math.PI * t)),
        y: Math.round(from.y + (to.y - from.y) * eased + arcY * Math.sin(Math.PI * t)),
        step: i
      });
    }
    return waypoints;
  }
  recordTiming(action, requestedMode, timings, totalDurationMs) {
    this.lastActionTiming = {
      action,
      requestedMode,
      actualMode: this.activeProfile,
      timings,
      totalDurationMs
    };
  }
  report() {
    return {
      activeProfile: this.activeProfile,
      profile: this.getProfile(),
      availableProfiles: Object.keys(DEFAULT_PROFILES),
      lastActionTiming: this.lastActionTiming
    };
  }
  /**
   * Sleep helper bounded to keep fast tests fast — respects vitest timeouts
   * while still producing realistic cadence in live usage.
   */
  static async sleep(ms) {
    if (ms <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  chance() {
    return this.rng.next() < 0.5;
  }
}
const DEFAULT_REDACTION_RULES = [
  { ruleId: "red_key_password", kind: "key-pattern", pattern: "password|passwd|pwd", description: "Keys containing password/passwd/pwd", enabled: true, userAdded: false },
  { ruleId: "red_key_token", kind: "key-pattern", pattern: "token|jwt|bearer|auth|session.?id|secret|api.?key|client.?secret", description: "Keys containing token/jwt/auth/session-id/secret/api-key", enabled: true, userAdded: false },
  { ruleId: "red_key_credential", kind: "key-pattern", pattern: "credential|login|user.?pass|otp|2fa|mfa|verification", description: "Keys containing credential/login/otp/2fa/verification", enabled: true, userAdded: false },
  { ruleId: "red_key_payment", kind: "key-pattern", pattern: "card|payment|billing|iban|cvv|cvc|pan", description: "Keys containing card/payment/billing/iban/cvv", enabled: true, userAdded: false },
  { ruleId: "red_key_personal", kind: "key-pattern", pattern: "ssn|social.?security|national.?id|passport|tax.?id", description: "Keys containing personal identifier patterns", enabled: true, userAdded: false },
  { ruleId: "red_val_jwt", kind: "value-pattern", pattern: "eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+", description: "JWT-shaped tokens", enabled: true, userAdded: false },
  { ruleId: "red_val_bearer", kind: "value-pattern", pattern: "bearer\\s+[A-Za-z0-9._-]+", description: "Bearer tokens", enabled: true, userAdded: false },
  { ruleId: "red_val_long_hex", kind: "value-pattern", pattern: "\\b[a-f0-9]{32,}\\b", description: "32+ char hex strings (session/API ids)", enabled: true, userAdded: false },
  { ruleId: "red_val_sk", kind: "value-pattern", pattern: "\\b(sk|pk|rk)_[A-Za-z0-9_]{20,}\\b", description: "Stripe-style secret keys (sk_live_…)", enabled: true, userAdded: false },
  { ruleId: "red_attr_input_password", kind: "attribute-name", pattern: "value", description: "value attributes on password inputs handled by PrivacyEngine maskValue", enabled: true, userAdded: false },
  { ruleId: "red_attr_secret", kind: "attribute-name", pattern: "data-secret|data-token|data-api-key|secret|access.?token", description: "Secret-carrying attributes", enabled: true, userAdded: false }
];
const DEFAULT_CAPTURE_EXCLUSIONS = [
  { exclusionId: "excl_mcpdom_overlay", selector: "[data-mcpdom-internal], [data-forensic-internal], #forensic-recorder-floating-host, #forensic-inspect-highlighter", reason: "MCPDOM-injected UI must never contaminate captured DOM (§68 clean capture)", userAdded: false },
  { exclusionId: "excl_mcpdom_ids", selector: '[id^="forensic-"], [id^="mcpdom-"]', reason: "MCPDOM-namespaced nodes", userAdded: false }
];
const REDACTED = "[REDACTED]";
class RedactionEngine {
  config;
  base = new PrivacyEngine();
  compiledKeyPatterns = [];
  compiledValuePatterns = [];
  compiledAttrPatterns = [];
  constructor(config) {
    this.config = {
      rules: [...DEFAULT_REDACTION_RULES],
      exclusions: [...DEFAULT_CAPTURE_EXCLUSIONS],
      stubMode: true,
      ...config
    };
    this.recompile();
  }
  recompile() {
    this.compiledKeyPatterns = [];
    this.compiledValuePatterns = [];
    this.compiledAttrPatterns = [];
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;
      const flags = "i";
      try {
        switch (rule.kind) {
          case "key-pattern":
            this.compiledKeyPatterns.push(new RegExp(rule.pattern, flags));
            break;
          case "value-pattern":
            this.compiledValuePatterns.push(new RegExp(rule.pattern, "i"));
            break;
          case "attribute-name":
            this.compiledAttrPatterns.push(new RegExp(`^(${rule.pattern})$`, "i"));
            break;
        }
      } catch {
      }
    }
  }
  // --- Rule management ---------------------------------------------------
  getRules() {
    return [...this.config.rules];
  }
  setRuleEnabled(ruleId, enabled) {
    const rule = this.config.rules.find((r) => r.ruleId === ruleId);
    if (!rule) return false;
    rule.enabled = enabled;
    this.recompile();
    return true;
  }
  addRule(rule) {
    const ruleId = `red_custom_${this.config.rules.length + 1}_${Date.now().toString(36)}`;
    const full = { ...rule, ruleId, userAdded: true };
    this.config.rules.push(full);
    this.recompile();
    return full;
  }
  removeRule(ruleId) {
    const idx = this.config.rules.findIndex((r) => r.ruleId === ruleId);
    if (idx < 0 || !this.config.rules[idx].userAdded) return false;
    this.config.rules.splice(idx, 1);
    this.recompile();
    return true;
  }
  getExclusions() {
    return [...this.config.exclusions];
  }
  addExclusion(selector, reason) {
    const exclusionId = `excl_custom_${this.config.exclusions.length + 1}_${Date.now().toString(36)}`;
    const exclusion = { exclusionId, selector, reason, userAdded: true };
    this.config.exclusions.push(exclusion);
    return exclusion;
  }
  removeExclusion(exclusionId) {
    const idx = this.config.exclusions.findIndex((e) => e.exclusionId === exclusionId);
    if (idx < 0 || !this.config.exclusions[idx].userAdded) return false;
    this.config.exclusions.splice(idx, 1);
    return true;
  }
  // --- Redaction ---------------------------------------------------------
  /** Should a storage key / field name be treated as sensitive? */
  isSensitiveKey(key) {
    return this.compiledKeyPatterns.some((re) => re.test(key));
  }
  /** Redact a value if it matches token-like patterns. */
  redactValue(value) {
    let out = value;
    for (const re of this.compiledValuePatterns) {
      if (re.test(out)) {
        out = out.replace(new RegExp(re.source, "gi"), REDACTED);
      }
    }
    return out;
  }
  /** Redact a value bound to a key (key-based + value-based rules). */
  redactByKeyValue(key, value) {
    if (this.isSensitiveKey(key)) {
      return this.config.stubMode ? REDACTED : value;
    }
    return this.redactValue(value);
  }
  /** Should an attribute be excluded/redacted from capture? */
  isSensitiveAttribute(attrName) {
    return this.compiledAttrPatterns.some((re) => re.test(attrName));
  }
  /**
   * Filter a serialized attribute record with redaction applied.
   */
  redactAttributes(attrs) {
    const out = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (this.isSensitiveAttribute(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = this.redactValue(v);
      }
    }
    return out;
  }
  /**
   * §68 clean capture — strip MCPDOM-injected + excluded elements from a
   * cloned DOM subtree before it is persisted anywhere.
   */
  cleanSubtree(root) {
    const clone = root.cloneNode(true);
    for (const exclusion of this.config.exclusions) {
      let doomed = null;
      try {
        doomed = clone.querySelectorAll(exclusion.selector);
      } catch {
        continue;
      }
      for (const el of Array.from(doomed)) {
        el.remove();
      }
      try {
        if (clone.matches(exclusion.selector)) {
          return this.doclessEmptyStub(clone);
        }
      } catch {
      }
    }
    return clone;
  }
  isExcluded(element) {
    for (const exclusion of this.config.exclusions) {
      try {
        if (element.matches(exclusion.selector) || element.closest(exclusion.selector)) {
          return true;
        }
      } catch {
      }
    }
    return false;
  }
  doclessEmptyStub(clone) {
    clone.innerHTML = "";
    clone.setAttribute("data-mcpdom-excluded", "true");
    return clone;
  }
  toJSON() {
    return {
      rules: this.getRules(),
      exclusions: this.getExclusions(),
      stubMode: this.config.stubMode
    };
  }
  static fromJSON(json) {
    return new RedactionEngine({
      rules: Array.isArray(json?.rules) ? json.rules : void 0,
      exclusions: Array.isArray(json?.exclusions) ? json.exclusions : void 0,
      stubMode: typeof json?.stubMode === "boolean" ? json.stubMode : void 0
    });
  }
}
const INTERACTIVE_SELECTOR = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [onclick], [tabindex]';
function truncate(items, limit) {
  return { items: items.slice(0, limit), truncated: items.length > limit };
}
function base(analyzer, summary, count, items, warnings, truncated) {
  return { analyzer, summary, count, items, warnings, truncated };
}
function selectorOf(el) {
  try {
    return LiveDOMInspector.inspectElement(el).bestSelector;
  } catch {
    return el.tagName.toLowerCase();
  }
}
const analyzeForms = (doc) => {
  const forms = Array.from(doc.querySelectorAll("form"));
  const items = forms.map((form) => {
    const fields = Array.from(form.querySelectorAll("input, select, textarea")).map((f) => ({
      tag: f.tagName.toLowerCase(),
      type: f.getAttribute("type") || (f.tagName.toLowerCase() === "textarea" ? "textarea" : f.tagName.toLowerCase() === "select" ? "select" : "text"),
      name: f.getAttribute("name") || void 0,
      id: f.getAttribute("id") || void 0,
      required: f.hasAttribute("required"),
      pattern: f.getAttribute("pattern") || void 0,
      maxLength: f.getAttribute("maxlength") || void 0,
      placeholder: f.getAttribute("placeholder") || void 0,
      ariaLabel: f.getAttribute("aria-label") || void 0,
      autocomplete: f.getAttribute("autocomplete") || void 0,
      hasLabel: Boolean(f.getAttribute("id") && doc.querySelector(`label[for="${f.getAttribute("id")}"]`)) || Boolean(f.closest("label")),
      defaultValue: f.value !== void 0 && (f.getAttribute("type") || "text") !== "password" ? String(f.value).slice(0, 40) : void 0
    }));
    return {
      selector: selectorOf(form),
      action: form.getAttribute("action") || void 0,
      method: (form.getAttribute("method") || "GET").toUpperCase(),
      id: form.getAttribute("id") || void 0,
      fieldCount: fields.length,
      submitButton: form.querySelector('button[type="submit"], input[type="submit"]') ? selectorOf(form.querySelector('button[type="submit"], input[type="submit"]')) : void 0,
      validationAttributes: fields.filter((f) => f.required || f.pattern).length,
      fields
    };
  });
  const t = truncate(items, 50);
  return base("analyze_forms", `${forms.length} form(s) with ${items.reduce((s, f) => s + f.fieldCount, 0)} total fields`, forms.length, t.items, [], t.truncated);
};
const analyzeLinks = (doc) => {
  const links = Array.from(doc.querySelectorAll("a[href]"));
  const items = links.map((a) => ({
    href: a.getAttribute("href") || "",
    text: directText(a).slice(0, 60),
    selector: selectorOf(a),
    rel: a.getAttribute("rel") || void 0,
    target: a.getAttribute("target") || void 0,
    download: a.hasAttribute("download"),
    external: /^https?:\/\//i.test(a.getAttribute("href") || "") && !sameOrigin(a.getAttribute("href") || "", doc),
    anchorOnly: (a.getAttribute("href") || "").startsWith("#")
  }));
  const t = truncate(items, 200);
  return base(
    "extract_links",
    `${links.length} link(s): ${items.filter((l) => l.external).length} external, ${items.filter((l) => l.anchorOnly).length} anchors`,
    links.length,
    t.items,
    [],
    t.truncated
  );
};
function sameOrigin(href, doc) {
  try {
    return new URL(href, doc.defaultView?.location?.href || "http://localhost").origin === (doc.defaultView?.location?.origin || "");
  } catch {
    return false;
  }
}
const analyzeMedia = (doc) => {
  const images = Array.from(doc.querySelectorAll("img"));
  const videos = Array.from(doc.querySelectorAll("video"));
  const audios = Array.from(doc.querySelectorAll("audio"));
  const canvases = Array.from(doc.querySelectorAll("canvas"));
  const warnings = [];
  const items = [
    ...images.map((img) => ({
      kind: "img",
      selector: selectorOf(img),
      src: (img.getAttribute("src") || "").slice(0, 150),
      alt: img.getAttribute("alt"),
      width: img.getAttribute("width") || void 0,
      height: img.getAttribute("height") || void 0,
      naturalWidth: img.naturalWidth || void 0,
      naturalHeight: img.naturalHeight || void 0,
      lazy: img.getAttribute("loading") === "lazy",
      missingAlt: !img.hasAttribute("alt")
    })),
    ...videos.map((v) => ({
      kind: "video",
      selector: selectorOf(v),
      src: (v.getAttribute("src") || v.querySelector("source")?.getAttribute("src") || "").slice(0, 150),
      controls: v.hasAttribute("controls"),
      autoplay: v.hasAttribute("autoplay"),
      muted: v.hasAttribute("muted"),
      poster: v.getAttribute("poster") || void 0
    })),
    ...audios.map((a) => ({
      kind: "audio",
      selector: selectorOf(a),
      src: (a.getAttribute("src") || a.querySelector("source")?.getAttribute("src") || "").slice(0, 150),
      controls: a.hasAttribute("controls")
    })),
    ...canvases.map((c) => ({
      kind: "canvas",
      selector: selectorOf(c),
      width: c.width,
      height: c.height
    }))
  ];
  const missingAlt = items.filter((i) => i.missingAlt).length;
  if (missingAlt) warnings.push(`${missingAlt} image(s) missing alt text (accessibility risk).`);
  const t = truncate(items, 200);
  return base("analyze_media", `${images.length} images, ${videos.length} videos, ${audios.length} audios, ${canvases.length} canvases`, items.length, t.items, warnings, t.truncated);
};
const analyzeCSSVariables = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const variables = {};
  if (win?.getComputedStyle) {
    const styles = win.getComputedStyle(doc.documentElement);
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      if (prop.startsWith("--")) {
        variables[prop] = styles.getPropertyValue(prop).trim().slice(0, 100);
      }
    }
  } else {
    warnings.push("getComputedStyle unavailable — CSS variables not resolvable in this context.");
    for (const styleEl of Array.from(doc.querySelectorAll("style"))) {
      const text = styleEl.textContent || "";
      const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;}]+)/g;
      let m;
      while (m = re.exec(text)) {
        variables[m[1]] = m[2].trim().slice(0, 100);
      }
    }
  }
  const entries = Object.entries(variables).map(([name, value]) => ({ name, value }));
  return base("get_css_variables", `${entries.length} CSS custom properties found`, entries.length, entries, warnings, false);
};
const analyzeFonts = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const fonts = /* @__PURE__ */ new Map();
  if (win?.getComputedStyle) {
    for (const el of Array.from(doc.querySelectorAll("body, body *")).slice(0, 800)) {
      const cs = win.getComputedStyle(el);
      const family = cs.fontFamily || "";
      const size = cs.fontSize || "";
      const key = `${family.split(",")[0].replace(/["']/g, "").trim()} @ ${size}`;
      fonts.set(key, (fonts.get(key) || 0) + 1);
    }
  } else {
    warnings.push("getComputedStyle unavailable — font usage analysis requires rendered styles.");
  }
  const items = Array.from(fonts.entries()).map(([font, usage]) => ({ font, usage })).sort((a, b) => b.usage - a.usage);
  return base("analyze_fonts", `${items.length} distinct font/size combinations`, items.length, items, warnings, false);
};
const extractColorPalette = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const colors = /* @__PURE__ */ new Map();
  if (win?.getComputedStyle) {
    for (const el of Array.from(doc.querySelectorAll("body, body *")).slice(0, 800)) {
      const cs = win.getComputedStyle(el);
      for (const prop of ["color", "background-color", "border-top-color"]) {
        const val = cs.getPropertyValue(prop);
        if (val && val !== "rgba(0, 0, 0, 0)") {
          colors.set(val, (colors.get(val) || 0) + 1);
        }
      }
    }
  } else {
    for (const el of Array.from(doc.querySelectorAll("[style]")).slice(0, 300)) {
      const s = el.getAttribute("style") || "";
      const re = /(color)\s*:\s*([^;]+)/gi;
      let m;
      while (m = re.exec(s)) colors.set(m[2].trim(), (colors.get(m[2].trim()) || 0) + 1);
    }
    warnings.push("getComputedStyle unavailable — palette from inline styles only.");
  }
  const items = Array.from(colors.entries()).map(([color, usage]) => ({ color, usage })).sort((a, b) => b.usage - a.usage).slice(0, 40);
  return base("extract_color_palette", `${colors.size} distinct colors in use`, colors.size, items, warnings, false);
};
const detectZIndexConflicts = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const items = [];
  if (!win?.getComputedStyle) {
    warnings.push("getComputedStyle unavailable — z-index analysis requires rendered styles.");
    return base("detect_zindex_conflicts", "unavailable", 0, [], warnings, false);
  }
  const zElements = [];
  for (const el of Array.from(doc.querySelectorAll("body *")).slice(0, 1e3)) {
    const cs = win.getComputedStyle(el);
    const z = cs.zIndex;
    if (z && z !== "auto" && parseInt(z, 10) > 0) {
      zElements.push({
        selector: selectorOf(el),
        z: parseInt(z, 10),
        position: cs.position,
        stacking: cs.position === "fixed" || cs.position === "sticky" || cs.opacity !== "1" || cs.transform !== "none" ? "creates-stacking-context" : "plain"
      });
    }
  }
  for (let i = 0; i < zElements.length; i++) {
    for (let j = i + 1; j < zElements.length; j++) {
      if (zElements[i].z === zElements[j].z) {
        items.push({
          zIndex: zElements[i].z,
          elements: [zElements[i].selector, zElements[j].selector],
          note: "same z-index — DOM order decides paint order; verify overlay intent."
        });
      }
    }
    if (zElements[i].z > 1e5) {
      items.push({ zIndex: zElements[i].z, elements: [zElements[i].selector], note: "extremely high z-index — competes with platform overlays (MCPDOM uses 2147483640+)." });
    }
  }
  return base("detect_zindex_conflicts", `${zElements.length} z-indexed elements, ${items.length} potential conflict(s)`, items.length, truncate(items, 40).items, warnings, items.length > 40);
};
const detectLayoutIssues = (doc) => {
  const win = doc.defaultView;
  const items = [];
  const docEl = doc.documentElement;
  const body = doc.body;
  const scrollW = Math.max(docEl?.scrollWidth || 0, body?.scrollWidth || 0);
  const clientW = win?.innerWidth || docEl?.clientWidth || 0;
  const horizontalOverflow = scrollW > clientW + 1;
  if (horizontalOverflow) {
    items.push({ issue: "horizontal-overflow", detail: `document scrollWidth ${scrollW} exceeds viewport ${clientW}` });
    if (win?.getComputedStyle) {
      for (const el of Array.from(doc.querySelectorAll("body *")).slice(0, 600)) {
        const rect = el.getBoundingClientRect();
        if (rect.right > clientW + 2 && rect.width > 100) {
          items.push({ issue: "element-exceeds-viewport", selector: selectorOf(el), right: Math.round(rect.right), width: Math.round(rect.width) });
          if (items.length > 15) break;
        }
      }
    }
  }
  let deadInteractive = 0;
  for (const el of Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR)).slice(0, 500)) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) deadInteractive++;
  }
  if (deadInteractive) items.push({ issue: "zero-size-interactive-elements", count: deadInteractive });
  return base("detect_layout_issues", horizontalOverflow ? `HORIZONTAL OVERFLOW: page is ${scrollW - clientW}px wider than viewport` : "No horizontal overflow detected", items.length, items, [], false);
};
const censusInteractiveElements = (doc) => {
  const els = Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR));
  const byRole = /* @__PURE__ */ new Map();
  const items = els.slice(0, 300).map((el) => {
    const info = safeInspect(el);
    const roleKey = info.role || el.tagName.toLowerCase();
    byRole.set(roleKey, (byRole.get(roleKey) || 0) + 1);
    return {
      selector: info.bestSelector,
      tag: info.tag,
      role: info.role,
      text: info.text.slice(0, 40),
      visible: info.visibility.isVisible,
      disabled: el.disabled || el.hasAttribute("disabled"),
      inViewport: info.visibility.isInViewport
    };
  });
  return base(
    "census_interactive_elements",
    `${els.length} interactive elements: ${Array.from(byRole.entries()).map(([k, v]) => `${k}×${v}`).join(", ") || "none"}`,
    els.length,
    items,
    [],
    els.length > 300
  );
};
function safeInspect(el) {
  try {
    return LiveDOMInspector.inspectElement(el);
  } catch {
    return {
      tag: el.tagName.toLowerCase(),
      role: void 0,
      text: "",
      bestSelector: el.tagName.toLowerCase(),
      bounds: { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 },
      visibility: { isVisible: false, isInViewport: false }
    };
  }
}
const detectSemanticElements = (doc) => {
  const semanticTags = ["header", "nav", "main", "aside", "footer", "article", "section", "figure", "figcaption", "mark", "time", "address", "details", "summary", "dialog"];
  const items = [];
  for (const tag of semanticTags) {
    const found = Array.from(doc.querySelectorAll(tag));
    if (found.length) {
      for (const el of found.slice(0, 20)) {
        items.push({
          tag,
          selector: selectorOf(el),
          role: el.getAttribute("role") || implicitLandmark(tag),
          text: directText(el).slice(0, 50),
          childCount: el.children.length
        });
      }
    }
  }
  const landmarks = items.filter((i) => ["banner", "navigation", "main", "complementary", "contentinfo"].includes(i.role));
  const warnings = [];
  if (!items.find((i) => i.tag === "main")) warnings.push("No <main> element — page lacks a primary landmark.");
  if (doc.querySelectorAll("header").length > 1) warnings.push("Multiple <header> elements outside sections — ambiguous banner landmark.");
  return base("detect_semantic_elements", `${items.length} semantic elements, ${landmarks.length} landmarks`, items.length, truncate(items, 100).items, warnings, items.length > 100);
};
function implicitLandmark(tag) {
  const map = {
    header: "banner",
    nav: "navigation",
    main: "main",
    aside: "complementary",
    footer: "contentinfo",
    article: "article",
    section: "region",
    form: "form"
  };
  return map[tag];
}
const scanAccessibilityIssues = (doc) => {
  const issues = [];
  for (const img of Array.from(doc.querySelectorAll("img")).slice(0, 200)) {
    if (!img.hasAttribute("alt")) {
      issues.push({ rule: "img-alt", severity: "error", selector: selectorOf(img), message: "Image is missing the alt attribute." });
    }
  }
  for (const input of Array.from(doc.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button])")).slice(0, 200)) {
    const id = input.getAttribute("id");
    const hasLabel = id && doc.querySelector(`label[for="${id}"]`) || input.closest("label") || input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
    if (!hasLabel) {
      issues.push({ rule: "input-label", severity: "error", selector: selectorOf(input), message: "Form input has no associated label, aria-label or aria-labelledby." });
    }
  }
  for (const el of Array.from(doc.querySelectorAll('button, a[href], [role="button"]')).slice(0, 300)) {
    const text = directText(el).trim();
    const aria = el.getAttribute("aria-label");
    if (!text && !aria) {
      issues.push({ rule: "accessible-name", severity: "error", selector: selectorOf(el), message: "Interactive element has no accessible name (no text, no aria-label).", hint: el.querySelector("img[alt]") ? "Contains an image — consider alt text or aria-label." : void 0 });
    }
  }
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).slice(0, 100);
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    if (lastLevel && level > lastLevel + 1) {
      issues.push({ rule: "heading-order", severity: "warning", selector: selectorOf(h), message: `Heading level jumps from h${lastLevel} to h${level}.` });
    }
    lastLevel = level;
  }
  if (!doc.documentElement?.getAttribute("lang")) {
    issues.push({ rule: "html-lang", severity: "warning", selector: "html", message: "The <html> element has no lang attribute." });
  }
  const errors = issues.filter((i) => i.severity === "error").length;
  return base("scan_accessibility_issues", `${issues.length} issue(s): ${errors} errors, ${issues.length - errors} warnings`, issues.length, truncate(issues, 100).items, [], issues.length > 100);
};
const detectDeadClickTargets = (doc) => {
  const win = doc.defaultView;
  const items = [];
  for (const el of Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR)).slice(0, 500)) {
    const rect = el.getBoundingClientRect();
    const cs = win?.getComputedStyle ? win.getComputedStyle(el) : null;
    const zeroSize = rect.width === 0 || rect.height === 0;
    const pointerBlocked = cs ? cs.pointerEvents === "none" : false;
    const hidden = cs ? cs.display === "none" || cs.visibility === "hidden" : false;
    const ariaHidden = el.getAttribute("aria-hidden") === "true";
    if (zeroSize || pointerBlocked || hidden || ariaHidden) {
      items.push({
        selector: selectorOf(el),
        tag: el.tagName.toLowerCase(),
        text: directText(el).slice(0, 30),
        reasons: [zeroSize && "zero-size", pointerBlocked && "pointer-events:none", hidden && `hidden (${cs ? cs.display : "?"}/${cs ? cs.visibility : "?"})`, ariaHidden && "aria-hidden"].filter(Boolean)
      });
    }
  }
  return base("detect_dead_click_targets", `${items.length} unreachable interactive element(s)`, items.length, truncate(items, 80).items, [], items.length > 80);
};
const inventoryAnimations = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const items = [];
  if (!win?.getComputedStyle) {
    warnings.push("getComputedStyle unavailable — animation inventory requires rendered styles.");
    return base("inventory_animations", "unavailable", 0, [], warnings, false);
  }
  for (const el of Array.from(doc.querySelectorAll("body *")).slice(0, 800)) {
    const cs = win.getComputedStyle(el);
    const animation = cs.animationName !== "none" ? `${cs.animationName} ${cs.animationDuration}` : null;
    const transition = cs.transitionProperty !== "none" && cs.transitionProperty !== "all" ? `${cs.transitionProperty} ${cs.transitionDuration}` : cs.transitionProperty === "all" ? `all ${cs.transitionDuration}` : null;
    if (animation || transition) {
      items.push({
        selector: selectorOf(el),
        animation,
        transition,
        transitionTiming: cs.transitionTimingFunction || void 0
      });
    }
  }
  const infinite = items.filter((i) => i.animation && i.animation.includes("infinite"));
  if (infinite.length > 5) warnings.push(`${infinite.length} infinitely looping animations — may indicate decorative spinners or a stuck loading state.`);
  return base("inventory_animations", `${items.length} animated/transitioning elements`, items.length, truncate(items, 80).items, warnings, items.length > 80);
};
const mapFrameTree = (doc) => {
  const items = [];
  const walk = (d, path2, depth) => {
    const frames = Array.from(d.querySelectorAll("iframe, frame"));
    for (const frame of frames) {
      const src = frame.getAttribute("src") || "(no src)";
      let accessible = false;
      let childCount = null;
      try {
        const contentDoc = frame.contentDocument;
        if (contentDoc) {
          accessible = true;
          childCount = contentDoc.querySelectorAll("*").length;
          if (depth < 3) walk(contentDoc, `${path2} > ${frame.tagName.toLowerCase()}[${src.slice(0, 50)}]`, depth + 1);
        }
      } catch {
        accessible = false;
      }
      items.push({
        path: `${path2} > ${frame.tagName.toLowerCase()}`,
        selector: selectorOf(frame),
        src: src.slice(0, 120),
        title: frame.getAttribute("title") || void 0,
        name: frame.getAttribute("name") || void 0,
        sandbox: frame.getAttribute("sandbox") || void 0,
        accessible,
        childCount,
        limitation: accessible ? void 0 : "Same-origin policy blocks contentDocument access (cross-origin frame)."
      });
    }
  };
  walk(doc, "document", 0);
  const inaccessible = items.filter((i) => !i.accessible).length;
  return base("map_frame_tree", `${items.length} frame(s), ${inaccessible} inaccessible (cross-origin)`, items.length, items, [], false);
};
const inventoryShadowRoots = (doc) => {
  const items = [];
  const walk = (root, path2, depth) => {
    const children = root instanceof ShadowRoot ? Array.from(root.querySelectorAll("*")) : Array.from(root.querySelectorAll("*"));
    for (const el of children) {
      if (el.shadowRoot) {
        const sr = el.shadowRoot;
        const srPath = `${path2} > ${el.tagName.toLowerCase()}::shadowRoot(${sr.mode})`;
        items.push({
          path: srPath.slice(0, 200),
          hostSelector: selectorOf(el),
          hostTag: el.tagName.toLowerCase(),
          mode: sr.mode,
          childCount: sr.querySelectorAll("*").length,
          styles: sr.querySelectorAll("style").length
        });
        if (depth < 4) walk(sr, srPath, depth + 1);
      }
    }
  };
  walk(doc.documentElement, "document", 0);
  return base("inventory_shadow_roots", `${items.length} open shadow root(s) found`, items.length, items, [], false);
};
const inspectPageStorage = (doc) => {
  const win = doc.defaultView;
  const privacy = new RedactionEngine();
  const warnings = [];
  const items = [];
  if (!win?.localStorage || !win?.sessionStorage) {
    return base("inspect_page_storage", "Web Storage API unavailable in this context", 0, [], ["localStorage/sessionStorage are not accessible here (JSDOM limitation or sandboxed iframe)."], false);
  }
  try {
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      const rawValue = String(win.localStorage.getItem(key) || "");
      items.push({
        store: "localStorage",
        key: String(key).slice(0, 80),
        value: privacy.redactByKeyValue(String(key), rawValue).slice(0, 120),
        size: rawValue.length
      });
    }
  } catch (err) {
    warnings.push(`localStorage read failed: ${err.message}`);
  }
  try {
    for (let i = 0; i < win.sessionStorage.length; i++) {
      const key = win.sessionStorage.key(i);
      const rawValue = String(win.sessionStorage.getItem(key) || "");
      items.push({
        store: "sessionStorage",
        key: String(key).slice(0, 80),
        value: privacy.redactByKeyValue(String(key), rawValue).slice(0, 120),
        size: rawValue.length
      });
    }
  } catch (err) {
    warnings.push(`sessionStorage read failed: ${err.message}`);
  }
  const totalBytes = items.reduce((s, i) => s + (i.size || 0), 0);
  return base("inspect_page_storage", `${items.length} storage entries (~${totalBytes} bytes), sensitive keys redacted`, items.length, truncate(items, 100).items, warnings, items.length > 100);
};
const getPerformanceMetrics = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const perf = win?.performance;
  if (!perf?.timing && !perf?.getEntriesByType) {
    return base("get_performance_metrics", "Performance API unavailable", 0, [], ["window.performance is not exposed in this context."], false);
  }
  const items = [];
  try {
    const nav = perf.getEntriesByType?.("navigation")?.[0];
    if (nav) {
      items.push({ metric: "navigation-timing", domContentLoaded: Math.round(nav.domContentLoadedEventEnd), loadComplete: Math.round(nav.loadEventEnd), domInteractive: Math.round(nav.domInteractive), type: nav.type, redirectCount: nav.redirectCount, sizeTransfer: nav.transferSize });
    } else if (perf.timing) {
      const t = perf.timing;
      items.push({ metric: "navigation-timing-legacy", domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart, loadComplete: t.loadEventEnd - t.navigationStart, domInteractive: t.domInteractive - t.navigationStart });
    }
    const paints = perf.getEntriesByType?.("paint") || [];
    for (const p of paints) {
      items.push({ metric: p.name, startTime: Math.round(p.startTime) });
    }
    const resources = perf.getEntriesByType?.("resource") || [];
    if (resources.length) {
      const totalDuration = resources.reduce((s, r) => s + r.duration, 0);
      const slowest = [...resources].sort((a, b) => b.duration - a.duration).slice(0, 5).map((r) => ({ url: String(r.name).slice(0, 100), duration: Math.round(r.duration) }));
      items.push({ metric: "resource-summary", count: resources.length, totalDuration: Math.round(totalDuration), slowest });
    }
    if (perf.memory) {
      items.push({ metric: "memory", usedJSHeapMB: Math.round(perf.memory.usedJSHeapSize / 1048576 * 10) / 10, totalJSHeapMB: Math.round(perf.memory.totalJSHeapSize / 1048576 * 10) / 10 });
    }
  } catch (err) {
    warnings.push(`performance read failed: ${err.message}`);
  }
  return base("get_performance_metrics", `${items.length} metric group(s)`, items.length, items, warnings, false);
};
const extractSEOMetadata = (doc) => {
  const meta = (name) => doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || void 0;
  const metaProperty = (prop) => doc.querySelector(`meta[property="${prop}"]`)?.getAttribute("content") || void 0;
  const items = [
    { field: "title", value: doc.title || void 0 },
    { field: "description", value: meta("description") },
    { field: "canonical", value: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") },
    { field: "robots", value: meta("robots") },
    { field: "viewport", value: meta("viewport") },
    { field: "charset", value: doc.querySelector("meta[charset]")?.getAttribute("charset") },
    { field: "og:title", value: metaProperty("og:title") },
    { field: "og:description", value: metaProperty("og:description") },
    { field: "og:image", value: metaProperty("og:image") },
    { field: "og:url", value: metaProperty("og:url") },
    { field: "twitter:card", value: meta("twitter:card") },
    { field: "language", value: doc.documentElement?.getAttribute("lang") }
  ];
  const headingCount = doc.querySelectorAll("h1").length;
  const warnings = [];
  if (headingCount === 0) warnings.push("No h1 — page lacks a primary heading.");
  if (headingCount > 1) warnings.push(`Multiple h1 elements (${headingCount}).`);
  if (!meta("description")) warnings.push("No meta description.");
  items.push({ field: "h1Count", value: headingCount });
  return base("extract_seo_metadata", `SEO metadata extracted; ${warnings.length} warning(s)`, items.length, items, warnings, false);
};
const extractStructuredData = (doc) => {
  const items = [];
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const parsed = JSON.parse(script.textContent || "{}");
      items.push({ format: "JSON-LD", type: parsed["@type"] || (Array.isArray(parsed) ? "array" : "unknown"), data: parsed });
    } catch (err) {
      items.push({ format: "JSON-LD", type: "invalid-json", error: err.message });
    }
  }
  for (const el of Array.from(doc.querySelectorAll("[itemscope]")).slice(0, 30)) {
    const itemType = el.getAttribute("itemtype") || "unknown";
    const props = {};
    for (const prop of Array.from(el.querySelectorAll("[itemprop]"))) {
      const name = prop.getAttribute("itemprop") || "";
      const content = prop.getAttribute("content") || prop.getAttribute("href") || prop.textContent?.trim() || "";
      props[name] = content.slice(0, 100);
    }
    items.push({ format: "microdata", type: itemType.split("/").pop() || itemType, data: props });
  }
  return base("extract_structured_data", `${items.length} structured data block(s)`, items.length, items, [], false);
};
const extractTables = (doc) => {
  const tables = Array.from(doc.querySelectorAll("table"));
  const items = tables.slice(0, 30).map((table) => {
    const headers = Array.from(table.querySelectorAll("thead th, tr:first-child th")).map((th) => th.textContent?.trim() || "");
    const bodyRows = Array.from(table.querySelectorAll("tbody tr, tr")).filter((tr) => !tr.querySelector("th")).slice(0, 50);
    const rows = bodyRows.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent || "").trim().slice(0, 60)));
    const caption = table.querySelector("caption")?.textContent?.trim();
    return {
      selector: selectorOf(table),
      caption,
      columnCount: headers.length || (rows[0]?.length || 0),
      rowCount: bodyRows.length,
      headers,
      rows
    };
  });
  return base("extract_tables", `${tables.length} table(s)`, tables.length, items, [], tables.length > 30);
};
const extractLists = (doc) => {
  const lists = Array.from(doc.querySelectorAll("ul, ol"));
  const items = lists.slice(0, 60).map((list) => {
    const children = Array.from(list.querySelectorAll(":scope > li")).slice(0, 40);
    return {
      selector: selectorOf(list),
      kind: list.tagName.toLowerCase(),
      ordered: list.tagName.toLowerCase() === "ol",
      itemCount: children.length,
      items: children.map((li) => directText(li).slice(0, 60)),
      nested: list.querySelectorAll("ul, ol").length
    };
  });
  return base("extract_lists", `${lists.length} list(s)`, lists.length, items, [], lists.length > 60);
};
const analyzePageContent = (doc) => {
  const body = doc.body;
  const text = body?.innerText || body?.textContent || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((h) => ({
    level: parseInt(h.tagName[1], 10),
    text: directText(h).slice(0, 80)
  }));
  const paragraphs = doc.querySelectorAll("p").length;
  const avgParagraphLength = paragraphs ? Math.round(words / paragraphs) : 0;
  const readingTimeMinutes = Math.round(words / 220 * 10) / 10;
  const items = [
    { metric: "wordCount", value: words },
    { metric: "paragraphCount", value: paragraphs },
    { metric: "avgParagraphWords", value: avgParagraphLength },
    { metric: "estimatedReadingMinutes", value: readingTimeMinutes },
    { metric: "headingCount", value: headings.length },
    { metric: "imageCount", value: doc.querySelectorAll("img").length },
    { metric: "linkDensity", value: Math.round(doc.querySelectorAll("a[href]").length / Math.max(1, words) * 1e3) / 1e3 },
    { metric: "headings", value: headings.slice(0, 50) }
  ];
  return base("analyze_page_content", `${words} words, ${paragraphs} paragraphs, ~${readingTimeMinutes} min read`, items.length, items, [], false);
};
const searchDOM = (doc, options) => {
  const query = String(options?.query || "").trim();
  if (!query) {
    return base("search_dom", "No query supplied", 0, [], ["Provide a text query; optionally tag/attr filters."], false);
  }
  const q = query.toLowerCase();
  const matches = [];
  const maxResults = Math.min(options?.limit || 50, 200);
  const elements = Array.from(doc.querySelectorAll("*"));
  for (const el of elements) {
    if (matches.length >= maxResults) break;
    if (options?.tag && el.tagName.toLowerCase() !== String(options.tag).toLowerCase()) continue;
    const text = directText(el);
    const attrs = Array.from(el.attributes);
    let score = 0;
    let reason = "";
    if (el.tagName.toLowerCase().includes(q)) {
      score += 0.2;
      reason = "tag match";
    }
    if (text.toLowerCase().includes(q) && text.length < 200) {
      score += 0.6;
      reason = "text match";
    }
    for (const a of attrs) {
      if (a.name.toLowerCase().includes(q) || a.value.length < 100 && a.value.toLowerCase().includes(q)) {
        score += 0.4;
        reason = `attribute ${a.name} match`;
        break;
      }
    }
    if (options?.attr) {
      const attrName = String(options.attr).toLowerCase();
      const attrVal = options.attrValue ? String(options.attrValue).toLowerCase() : null;
      const found = attrs.find((a) => a.name.toLowerCase() === attrName && (!attrVal || a.value.toLowerCase().includes(attrVal)));
      if (found) score += 0.5;
      else continue;
    }
    if (score > 0) {
      const info = safeInspect(el);
      matches.push({
        selector: info.bestSelector,
        tag: info.tag,
        role: info.role,
        text: info.text.slice(0, 60),
        score: Math.round(score * 100) / 100,
        reason,
        visible: info.visibility.isVisible,
        bounds: { x: Math.round(info.bounds.x), y: Math.round(info.bounds.y), w: Math.round(info.bounds.width), h: Math.round(info.bounds.height) }
      });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return base("search_dom", `${matches.length} element(s) match "${query}"`, matches.length, matches, [], matches.length >= maxResults);
};
const inventoryCTAs = (doc) => {
  const items = [];
  for (const el of Array.from(doc.querySelectorAll('button, a[class*="btn"], a[class*="button"], input[type="submit"], [role="button"]')).slice(0, 100)) {
    const info = safeInspect(el);
    items.push({
      selector: info.bestSelector,
      tag: info.tag,
      text: info.text.slice(0, 50),
      styleHint: el.getAttribute("class")?.slice(0, 60),
      primary: /primary|cta|submit|main/i.test(el.getAttribute("class") || "") || el.type === "submit",
      visible: info.visibility.isVisible
    });
  }
  return base("inventory_ctas", `${items.length} call-to-action element(s)`, items.length, items, [], false);
};
const detectFocusTraps = (doc) => {
  const items = [];
  for (const el of Array.from(doc.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog[open], .modal, [class*="modal"]')).slice(0, 30)) {
    const focusables = el.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    items.push({
      selector: selectorOf(el),
      kind: el.getAttribute("role") || el.tagName.toLowerCase(),
      ariaModal: el.getAttribute("aria-modal"),
      focusableCount: focusables.length,
      firstFocusable: focusables[0] ? selectorOf(focusables[0]) : void 0,
      note: focusables.length === 0 ? "Modal container has NO focusable elements — keyboard users are trapped." : void 0
    });
  }
  const tabbables = doc.querySelectorAll("[tabindex]>0");
  for (const el of Array.from(tabbables).slice(0, 20)) {
    items.push({ selector: selectorOf(el), kind: "positive-tabindex", note: `tabindex=${el.tabIndex} breaks natural tab order.` });
  }
  return base("detect_focus_traps", `${items.length} focus-management issue(s)/container(s)`, items.length, items, [], false);
};
const inferResponsiveBreakpoints = (doc) => {
  const win = doc.defaultView;
  const warnings = [];
  const breakpoints = /* @__PURE__ */ new Set();
  for (const style of Array.from(doc.querySelectorAll("style"))) {
    const text = style.textContent || "";
    const re = /@media[^{]*?\(\s*(?:min|max)-width\s*:\s*(\d+)(?:\.\d+)?px/g;
    let m;
    while (m = re.exec(text)) breakpoints.add(parseInt(m[1], 10));
  }
  for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).slice(0, 10)) {
    const href = link.getAttribute("href") || "";
    if (/^\d+px$/.test(href) || href.includes("width=")) {
      const match = href.match(/width=(\d+)/);
      if (match) breakpoints.add(parseInt(match[1], 10));
    }
  }
  for (const img of Array.from(doc.querySelectorAll("img[srcset], source[srcset]")).slice(0, 50)) {
    const srcset = img.getAttribute("srcset") || "";
    for (const m of srcset.matchAll(/(\d+)w/g)) {
      breakpoints.add(parseInt(m[1], 10));
    }
  }
  if (!win?.matchMedia) warnings.push("matchMedia unavailable — live breakpoint probing skipped.");
  const sorted = Array.from(breakpoints).sort((a, b) => a - b);
  const items = sorted.map((px) => ({ breakpoint: px, note: px <= 768 ? "mobile-class" : px <= 1024 ? "tablet-class" : "desktop-class" }));
  const current = win?.innerWidth;
  if (current) {
    const active = sorted.filter((px) => px <= current);
    items.unshift({ breakpoint: `current viewport: ${current}px`, note: active.length ? `below breakpoints: ${active.join(", ")}` : "no declared breakpoint below current width" });
  }
  return base("infer_responsive_breakpoints", `${sorted.length} breakpoint(s) inferred from CSS/srcset`, items.length, items, warnings, false);
};
const getSelectionState = (doc) => {
  const win = doc.defaultView;
  const selection = win?.getSelection?.();
  const active = doc.activeElement;
  const items = [
    {
      hasSelection: Boolean(selection?.toString()),
      selectedText: selection?.toString().slice(0, 200) || "",
      selectionRanges: selection?.rangeCount || 0,
      activeElement: active ? { tag: active.tagName.toLowerCase(), selector: selectorOf(active), editable: active.isContentEditable || ["INPUT", "TEXTAREA"].includes(active.tagName) } : null
    }
  ];
  return base("get_selection_state", selection?.toString() ? `Selection: "${selection.toString().slice(0, 40)}…"` : "No text selection", 1, items, [], false);
};
const DOM_ANALYZERS = {
  analyze_forms: analyzeForms,
  extract_links: analyzeLinks,
  analyze_media: analyzeMedia,
  get_css_variables: analyzeCSSVariables,
  analyze_fonts: analyzeFonts,
  extract_color_palette: extractColorPalette,
  detect_zindex_conflicts: detectZIndexConflicts,
  detect_layout_issues: detectLayoutIssues,
  census_interactive_elements: censusInteractiveElements,
  detect_semantic_elements: detectSemanticElements,
  scan_accessibility_issues: scanAccessibilityIssues,
  detect_dead_click_targets: detectDeadClickTargets,
  inventory_animations: inventoryAnimations,
  map_frame_tree: mapFrameTree,
  inventory_shadow_roots: inventoryShadowRoots,
  inspect_page_storage: inspectPageStorage,
  get_performance_metrics: getPerformanceMetrics,
  extract_seo_metadata: extractSEOMetadata,
  extract_structured_data: extractStructuredData,
  extract_tables: extractTables,
  extract_lists: extractLists,
  analyze_page_content: analyzePageContent,
  search_dom: searchDOM,
  inventory_ctas: inventoryCTAs,
  detect_focus_traps: detectFocusTraps,
  infer_responsive_breakpoints: inferResponsiveBreakpoints,
  get_selection_state: getSelectionState
};
function runAnalyzer(name, doc, options) {
  const fn = DOM_ANALYZERS[name];
  if (!fn) {
    return {
      analyzer: name,
      summary: `Unknown analyzer "${name}". Available: ${Object.keys(DOM_ANALYZERS).join(", ")}`,
      count: 0,
      items: [],
      warnings: [],
      truncated: false
    };
  }
  return fn(doc, options);
}
const DEFAULT_CAP = 2e3;
class ActionTimeline {
  events = [];
  cap;
  counter = 0;
  constructor(cap = DEFAULT_CAP) {
    this.cap = Math.max(10, cap);
  }
  record(kind, detail, options = {}) {
    this.counter++;
    const event = {
      eventId: `evt_${Date.now().toString(36)}_${this.counter}`,
      timestamp: Date.now(),
      kind,
      operationId: options.operationId,
      sessionId: options.sessionId,
      detail,
      data: options.data
    };
    this.events.push(event);
    if (this.events.length > this.cap) {
      this.events.splice(0, this.events.length - this.cap);
    }
    return event;
  }
  query(filter) {
    let out = this.events;
    if (filter.kind) out = out.filter((e) => e.kind === filter.kind);
    if (filter.operationId) out = out.filter((e) => e.operationId === filter.operationId);
    if (filter.sinceTimestamp) out = out.filter((e) => e.timestamp >= filter.sinceTimestamp);
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 200;
    return out.slice(-limit);
  }
  size() {
    return this.events.length;
  }
  toJSON() {
    return [...this.events];
  }
}
class OperationRegistry {
  counter = 0;
  operations = /* @__PURE__ */ new Map();
  begin(tool) {
    this.counter++;
    const operationId = `op_${Date.now().toString(36)}_${this.counter}`;
    this.operations.set(operationId, {
      operationId,
      tool,
      startedAt: Date.now(),
      status: "RUNNING",
      timelineEventIds: []
    });
    return operationId;
  }
  end(operationId, status, error) {
    const op = this.operations.get(operationId);
    if (!op) return;
    op.endedAt = Date.now();
    op.status = status;
    op.relatedError = error;
  }
  attachEvent(operationId, eventId) {
    const op = this.operations.get(operationId);
    if (op) op.timelineEventIds.push(eventId);
  }
  trace(operationId) {
    const op = this.operations.get(operationId);
    if (!op) return null;
    return {
      ...op,
      durationMs: op.endedAt ? op.endedAt - op.startedAt : void 0
    };
  }
  recent(limit = 100) {
    return Array.from(this.operations.values()).slice(-limit).map((op) => ({
      ...op,
      durationMs: op.endedAt ? op.endedAt - op.startedAt : void 0
    }));
  }
}
const SNAPSHOT_CAP = 100;
class BrowserSessionModel {
  sessionId;
  timeline = new ActionTimeline();
  operations = new OperationRegistry();
  tabs = /* @__PURE__ */ new Map();
  activeTabId = null;
  startedAt = Date.now();
  snapshots = [];
  commandHistory = [];
  annotationCount = 0;
  projectId;
  tabCounter = 0;
  commandCounter = 0;
  constructor(sessionId) {
    this.sessionId = sessionId || `sess_${Date.now().toString(36)}`;
  }
  // --- Tabs -------------------------------------------------------------
  registerTab(browserTabId, url, title) {
    const existing = browserTabId !== void 0 ? Array.from(this.tabs.values()).find((t) => t.browserTabId === browserTabId) : void 0;
    if (existing) {
      existing.lastSeenAt = Date.now();
      existing.status = "OPEN";
      existing.url = url || existing.url;
      existing.title = title || existing.title;
      return existing;
    }
    this.tabCounter++;
    const sessionTabId = `stab_${this.tabCounter}_${Date.now().toString(36)}`;
    const identity = {
      sessionTabId,
      browserTabId,
      url,
      title,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      status: "OPEN"
    };
    this.tabs.set(sessionTabId, identity);
    this.timeline.record("TAB_OPENED", `tab ${sessionTabId} registered (${url || "no url"})`, { sessionId: this.sessionId });
    return identity;
  }
  closeTab(sessionTabId) {
    const tab = this.tabs.get(sessionTabId);
    if (!tab) return false;
    tab.status = "CLOSED";
    tab.lastSeenAt = Date.now();
    this.timeline.record("TAB_CLOSED", `tab ${sessionTabId} closed`, { sessionId: this.sessionId });
    return true;
  }
  switchTab(sessionTabId) {
    const tab = this.tabs.get(sessionTabId);
    if (!tab || tab.status === "CLOSED") return false;
    this.activeTabId = sessionTabId;
    this.timeline.record("TAB_SWITCHED", `active tab → ${sessionTabId}`, { sessionId: this.sessionId });
    return true;
  }
  getTabs() {
    return Array.from(this.tabs.values());
  }
  getActiveTab() {
    if (this.activeTabId) {
      const t = this.tabs.get(this.activeTabId);
      if (t && t.status === "OPEN") return t;
    }
    return Array.from(this.tabs.values()).find((t) => t.status === "OPEN") || null;
  }
  /**
   * Stale-reference protection (§16/§53): mark tabs as STALE when the
   * underlying browser reference is suspected dead (e.g. bridge reconnect).
   */
  markAllStale() {
    let count = 0;
    for (const tab of this.tabs.values()) {
      if (tab.status === "OPEN") {
        tab.status = "STALE";
        count++;
      }
    }
    return count;
  }
  // --- Snapshots (§39) --------------------------------------------------
  captureSnapshot(doc, extensionEnabled, pendingMutations) {
    const win = doc.defaultView;
    const html = doc.documentElement?.outerHTML || "";
    const interactive = doc.querySelectorAll('a[href], button, input, select, textarea, [role="button"]').length;
    const snapshot = {
      snapshotId: `snap_${Date.now().toString(36)}_${this.snapshots.length + 1}`,
      timestamp: Date.now(),
      url: win?.location?.href || doc.location?.href || "",
      title: doc.title || "",
      viewport: {
        width: win?.innerWidth || 0,
        height: win?.innerHeight || 0,
        scrollX: win?.scrollX || 0,
        scrollY: win?.scrollY || 0,
        devicePixelRatio: win?.devicePixelRatio || 1
      },
      domLength: html.length,
      domHash: stableHash(html),
      interactiveCount: interactive,
      selectedRegions: [],
      extensionEnabled,
      pendingMutations,
      annotationCount: this.annotationCount
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > SNAPSHOT_CAP) this.snapshots.splice(0, this.snapshots.length - SNAPSHOT_CAP);
    this.timeline.record("SNAPSHOT_CREATED", `snapshot ${snapshot.snapshotId} (dom ${snapshot.domLength}b)`, { sessionId: this.sessionId });
    return snapshot;
  }
  getSnapshot(snapshotId) {
    if (!snapshotId) return this.snapshots[this.snapshots.length - 1] || null;
    return this.snapshots.find((s) => s.snapshotId === snapshotId) || null;
  }
  listSnapshots() {
    return this.snapshots.map((s) => ({
      snapshotId: s.snapshotId,
      timestamp: s.timestamp,
      url: s.url,
      title: s.title,
      domLength: s.domLength,
      domHash: s.domHash
    }));
  }
  compareSnapshots(a, b) {
    const fields = ["url", "title", "domLength", "domHash", "interactiveCount", "extensionEnabled", "annotationCount"];
    const changes = [];
    for (const f of fields) {
      if (a[f] !== b[f]) {
        changes.push({ field: f, before: a[f], after: b[f] });
      }
    }
    if (a.viewport.width !== b.viewport.width || a.viewport.height !== b.viewport.height) {
      changes.push({ field: "viewport", before: `${a.viewport.width}x${a.viewport.height}`, after: `${b.viewport.width}x${b.viewport.height}` });
    }
    const delta = b.domLength - a.domLength;
    return {
      identical: changes.length === 0,
      changes,
      domDelta: { beforeLength: a.domLength, afterLength: b.domLength, delta },
      summary: changes.length === 0 ? "States are identical." : `${changes.length} field(s) changed; DOM size ${delta >= 0 ? "+" : ""}${delta} bytes.`
    };
  }
  // --- Commands ---------------------------------------------------------
  recordCommand(tool, args, outcome, durationMs, error) {
    this.commandCounter++;
    const commandId = `cmd_${this.commandCounter}_${Date.now().toString(36)}`;
    this.commandHistory.push({
      commandId,
      tool,
      args,
      outcome,
      timestamp: Date.now(),
      durationMs,
      error
    });
    this.timeline.record("COMMAND_EXECUTED", `${tool} → ${outcome}${error ? ` (${error})` : ""}`, { sessionId: this.sessionId, data: { commandId } });
    return commandId;
  }
  getCommandHistory(limit = 100) {
    return this.commandHistory.slice(-limit);
  }
  // --- Misc -------------------------------------------------------------
  noteAnnotations(count) {
    this.annotationCount = count;
  }
  bindProject(projectId) {
    this.projectId = projectId;
  }
  getProjectId() {
    return this.projectId;
  }
  summary(doc, viewport, extensionEnabled, mutationHistory) {
    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt,
      url: doc.defaultView?.location?.href || doc.location?.href || "",
      title: doc.title || "",
      tabs: this.getTabs(),
      activeTabId: this.activeTabId,
      viewport: { width: viewport.width, height: viewport.height, isModified: viewport.isModified },
      extensionEnabled,
      snapshotCount: this.snapshots.length,
      commandCount: this.commandHistory.length,
      annotationCount: this.annotationCount,
      mutationHistoryCount: mutationHistory.length,
      timelineEventCount: this.timeline.size(),
      projectId: this.projectId
    };
  }
}
const POSITION_HINTS = (el) => {
  try {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const w = el.ownerDocument?.defaultView?.innerWidth || 1920;
    if (rect.y < w * 0.15) return "top";
    if (rect.y > w * 1.5) return "bottom";
    if (rect.x < w * 0.2) return "left";
    if (rect.x + rect.width > w * 0.8) return "right";
    return "center";
  } catch {
    return null;
  }
};
const ROLE_SYNONYMS = {
  navigation: "navigation",
  banner: "header",
  contentinfo: "footer",
  complementary: "sidebar",
  main: "main",
  form: "form",
  search: "search",
  region: "section",
  dialog: "modal",
  alertdialog: "modal",
  table: "table",
  list: "list",
  combobox: "dropdown",
  button: "button",
  link: "link",
  textbox: "input",
  checkbox: "checkbox",
  radio: "radio",
  img: "image",
  article: "article"
};
const TAG_SYNONYMS = {
  nav: "navigation",
  header: "header",
  footer: "footer",
  aside: "sidebar",
  main: "main",
  section: "section",
  article: "article",
  form: "form",
  table: "table",
  ul: "list",
  ol: "list",
  figure: "figure",
  dialog: "modal",
  button: "button",
  input: "input",
  select: "dropdown",
  textarea: "textarea",
  canvas: "canvas",
  video: "video",
  img: "image",
  h1: "heading",
  h2: "heading",
  h3: "heading"
};
function toSnakeCase(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_{2,}/g, "_").slice(0, 48).replace(/_$/, "");
}
class NamingEngine {
  /**
   * Generate an automatic name for a live element.
   */
  generate(element) {
    return this.generateFromMeta({
      tagName: element.tagName.toLowerCase(),
      role: element.getAttribute("role") || void 0,
      text: directText(element).trim(),
      ariaLabel: element.getAttribute("aria-label") || void 0,
      stableClass: Array.from(element.classList || []).find(
        (c) => /^[a-z][a-z0-9-]{2,}$/i.test(c) && !GENERIC_CLASSES.has(c)
      ),
      position: POSITION_HINTS(element),
      nearbyHeading: this.nearbyHeading(element)
    });
  }
  /**
   * Generate a name from serialized evidence (used when the live element is
   * not available to the naming call site).
   */
  generateFromMeta(meta) {
    const evidence = [];
    const parts = [];
    const role = meta.role || implicitRoleName(meta.tagName);
    if (role) {
      const roleWord = ROLE_SYNONYMS[role] || role;
      parts.push(roleWord);
      evidence.push(`role=${role}`);
    } else {
      const tagWord = TAG_SYNONYMS[meta.tagName] || meta.tagName;
      parts.push(tagWord);
      evidence.push(`tag=${meta.tagName}`);
    }
    if (meta.ariaLabel) {
      parts.unshift(toSnakeCase(meta.ariaLabel));
      evidence.push(`aria-label="${meta.ariaLabel.slice(0, 30)}"`);
    }
    if (meta.text && meta.text.length <= 40) {
      const textWord = toSnakeCase(meta.text.split(/\s+/).slice(0, 3).join(" "));
      if (textWord && textWord.length >= 2) {
        parts.push(textWord);
        evidence.push(`text="${meta.text.slice(0, 30)}"`);
      }
    }
    if (meta.nearbyHeading) {
      const headingWord = toSnakeCase(meta.nearbyHeading.split(/\s+/).slice(0, 3).join(" "));
      if (headingWord && !parts.includes(headingWord)) {
        parts.push(headingWord);
        evidence.push(`nearby-heading="${meta.nearbyHeading.slice(0, 30)}"`);
      }
    }
    if (meta.stableClass && parts.length < 3) {
      parts.push(toSnakeCase(meta.stableClass));
      evidence.push(`class=${meta.stableClass}`);
    }
    if (meta.tagName === "input") {
      if (!parts.some((p) => p.includes("input"))) {
        parts.push("input");
        evidence.push("tag=input");
      }
    }
    if (parts.join("_").length < 12 && meta.position) {
      parts.push(meta.position);
      evidence.push(`position=${meta.position}`);
    }
    let name = toSnakeCase(parts.join("_")) || "unnamed_region";
    if (/^\d/.test(name)) name = `el_${name}`;
    return { name, evidence };
  }
  nearbyHeading(element) {
    let parent = element.parentElement;
    for (let depth = 0; parent && depth < 4; depth++) {
      const heading = parent.querySelector('h1, h2, h3, h4, [role="heading"]');
      if (heading) return directText(heading).trim().slice(0, 40) || null;
      parent = parent.parentElement;
    }
    let sibling = element.previousElementSibling;
    for (let i = 0; sibling && i < 4; i++) {
      if (/^H[1-4]$/.test(sibling.tagName)) {
        const text = directText(sibling).trim();
        if (text) return text.slice(0, 40);
      }
      sibling = sibling.previousElementSibling;
    }
    return null;
  }
}
const GENERIC_CLASSES = /* @__PURE__ */ new Set([
  "active",
  "open",
  "visible",
  "hidden",
  "selected",
  "disabled",
  "container",
  "wrapper",
  "root",
  "item",
  "col",
  "row",
  "flex",
  "box",
  "main",
  "div",
  "span",
  "block"
]);
function implicitRoleName(tag) {
  switch (tag) {
    case "nav":
      return "navigation";
    case "header":
      return "banner";
    case "footer":
      return "contentinfo";
    case "aside":
      return "complementary";
    case "main":
      return "main";
    case "form":
      return "form";
    case "table":
      return "table";
    case "button":
      return "button";
    case "a":
      return "link";
    case "input":
      return "textbox";
    case "select":
      return "combobox";
    case "textarea":
      return "textbox";
    case "img":
      return "img";
    default:
      return null;
  }
}
const STYLE_PROPS = ["display", "position", "flex-direction", "grid-template-columns", "width", "height", "background-color", "color", "font-size", "border-radius", "overflow"];
class RegionCaptureEngine {
  naming = new NamingEngine();
  /**
   * Capture region DOM + context DOM with a meaningful boundary.
   *
   * Boundary strategy: ascend until we find a container that contributes
   * layout context (has an id/landmark role OR ≥2 relevant style properties
   * OR is a structural sectioning element), capped at 3 levels and at
   * <body>. Siblings of the region within that container are included as
   * context. This balances usefulness against export bloat.
   */
  capture(element) {
    const doc = element.ownerDocument;
    const selectorEngine = new SelectorRobustnessEngine(doc);
    const fingerprintEngine = new DOMFingerprintEngine();
    const candidates = selectorEngine.generateCandidates(element);
    const best = selectorEngine.bestSelector(element);
    const fingerprint = fingerprintEngine.fingerprint(element);
    let contextRoot = element;
    let levels = 0;
    let strategy = "self";
    for (let i = 0; i < 3; i++) {
      const parent2 = contextRoot.parentElement;
      if (!parent2 || parent2 === doc.body || parent2 === doc.documentElement) break;
      if (this.isMeaningfulContainer(parent2)) {
        contextRoot = parent2;
        levels = i + 1;
        strategy = "meaningful-ancestor";
        break;
      }
      contextRoot = parent2;
      levels = i + 1;
    }
    if (contextRoot === element) {
      const parent2 = element.parentElement;
      if (parent2 && parent2 !== doc.body && element.querySelectorAll("*").length < 4) {
        contextRoot = parent2;
        levels = 1;
        strategy = "direct-parent-fallback";
      }
    }
    const regionHtml = this.boundedHtml(element, 6e4);
    const contextHtml = this.boundedHtml(contextRoot, 12e4);
    LiveDOMInspector.inspectElement(element);
    const rect = element.getBoundingClientRect();
    const win = doc.defaultView;
    const relevantStyles = {};
    if (win?.getComputedStyle) {
      const cs = win.getComputedStyle(element);
      for (const prop of STYLE_PROPS) {
        const v = cs.getPropertyValue(prop);
        if (v && v !== "none" && v !== "auto") relevantStyles[prop] = v;
      }
    }
    const parent = element.parentElement;
    return {
      regionHtml,
      contextHtml,
      boundary: {
        strategy,
        ancestorLevels: levels,
        note: levels === 0 ? "Region captured standalone (no meaningful ancestor within 3 levels)." : `Context includes ${levels} ancestor level(s) up to a meaningful container.`
      },
      selectorCandidates: candidates,
      bestSelector: best.selector,
      xpath: selectorEngine.buildXPath(element),
      fingerprintHash: fingerprint.hash,
      dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
      position: { x: Math.round(rect.x), y: Math.round(rect.y) },
      relevantStyles,
      parentInfo: parent ? {
        tag: parent.tagName.toLowerCase(),
        selector: bestSelectorOf$1(parent),
        text: directText(parent).slice(0, 60)
      } : void 0,
      childrenCount: element.children.length,
      childTags: Array.from(element.children).slice(0, 12).map((c) => c.tagName.toLowerCase()),
      nameHint: this.naming.generate(element),
      fingerprintVolatility: fingerprint.volatilityRisk,
      volatilityReasons: fingerprint.volatilityReasons
    };
  }
  isMeaningfulContainer(el) {
    const tag = el.tagName.toLowerCase();
    if (["section", "article", "aside", "main", "nav", "header", "footer", "form"].includes(tag)) return true;
    if (el.hasAttribute("id") || el.hasAttribute("data-testid") || el.getAttribute("role")) return true;
    if (el.children.length > 1 && el.querySelector(":scope > *:nth-child(3)")) return true;
    const cs = el.getAttribute("style") || "";
    if (cs.includes("grid") || cs.includes("flex")) return true;
    return false;
  }
  boundedHtml(el, max) {
    const html = el.outerHTML;
    if (html.length <= max) return html;
    return html.slice(0, max) + `
<!-- [MCPDOM: truncated at ${max} bytes; full node count: ${el.querySelectorAll("*").length}] -->`;
  }
}
function bestSelectorOf$1(el) {
  try {
    return new SelectorRobustnessEngine(el.ownerDocument).bestSelector(el).selector;
  } catch {
    return el.tagName.toLowerCase();
  }
}
class RegionQualityScorer {
  score(input) {
    const components = [];
    const bestUnique = input.selectorCandidates.find((c) => c.unique);
    const bestConfidence = input.selectorCandidates[0]?.confidence || 0;
    const stability = Math.min(1, (bestUnique ? 0.6 : 0.2) + bestConfidence * 0.4);
    components.push({
      dimension: "selector-stability",
      score: stability,
      weight: 0.3,
      evidence: bestUnique ? `unique selector via ${bestUnique.strategy} (confidence ${bestUnique.confidence})` : `best candidate confidence ${bestConfidence || "n/a"} — no unique selector`
    });
    const fpScore = input.fingerprintVolatility === "low" ? 1 : input.fingerprintVolatility === "medium" ? 0.55 : 0.25;
    components.push({
      dimension: "semantic-confidence",
      score: fpScore,
      weight: 0.2,
      evidence: `fingerprint volatility ${input.fingerprintVolatility}${input.volatilityReasons.length ? ` (${input.volatilityReasons.join("; ")})` : ""}`
    });
    const structural = (input.hasHtmlSnapshot ? 0.6 : 0) + (input.hasContext ? 0.4 : 0);
    components.push({ dimension: "structural-completeness", score: structural, weight: 0.15, evidence: `html snapshot: ${input.hasHtmlSnapshot}; context DOM: ${input.hasContext}` });
    const visual = input.hasScreenshot ? 1 : 0.2;
    components.push({ dimension: "visual-completeness", score: visual, weight: 0.15, evidence: input.hasScreenshot ? "region screenshot captured" : "no screenshot — visual verification impossible" });
    const annotation = (input.userAnnotationFilled ? 0.5 : 0) + (input.hasIntendedChange ? 0.3 : 0) + (input.hasVerification ? 0.2 : 0);
    components.push({
      dimension: "annotation-completeness",
      score: annotation,
      weight: 0.2,
      evidence: `user annotation: ${input.userAnnotationFilled}; intended change: ${input.hasIntendedChange}; verification: ${input.hasVerification}`
    });
    const overall = Math.round(components.reduce((s, c) => s + c.score * c.weight, 0) * 100) / 100;
    const grade = overall >= 0.85 ? "A" : overall >= 0.65 ? "B" : overall >= 0.45 ? "C" : "D";
    const notes = [];
    for (const c of components) {
      if (c.score < 0.5) notes.push(`${c.dimension} is weak: ${c.evidence}`);
    }
    return { overall, components, grade, notes };
  }
}
class RegionRelationshipGraphBuilder {
  build(pageId, regions) {
    const nodes = [
      { id: `page:${pageId}`, name: "page", tag: "document", selector: "document", depth: 0, relationship: "page" }
    ];
    const edges = [];
    for (const r of regions) {
      nodes.push({ id: r.regionId, name: r.name, tag: r.tag, role: r.role, selector: r.selector, depth: 1, relationship: "region" });
      edges.push({ from: `page:${pageId}`, to: r.regionId, relation: "contains" });
    }
    for (let i = 0; i < regions.length; i++) {
      for (let j = 0; j < regions.length; j++) {
        if (i === j) continue;
        const a = regions[i].element;
        const b = regions[j].element;
        if (a && b && a.contains && b.contains) {
          if (a.contains(b)) {
            edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: "contains" });
          } else if (b.contains(a)) {
            edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: "ancestor-of" });
          } else if (a.parentElement && a.parentElement === b.parentElement) {
            edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: "sibling-of" });
          } else {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const overlaps = !(ra.right < rb.left || rb.right < ra.left || ra.bottom < rb.top || rb.bottom < ra.top);
            if (overlaps) {
              edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: "overlaps" });
            }
          }
        }
      }
    }
    const seen = /* @__PURE__ */ new Set();
    const uniqueEdges = edges.filter((e) => {
      const key = `${e.from}|${e.to}|${e.relation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { pageId, nodes, edges: uniqueEdges };
  }
}
class LiveBrowserController {
  nodeRegistry;
  snapshotEngine;
  picker;
  interactionEngine;
  observer;
  // === MCPDOM v3 platform engines (lazily keyed per document) ===
  mutationEngines = /* @__PURE__ */ new WeakMap();
  viewportControllers = /* @__PURE__ */ new WeakMap();
  targetingEngines = /* @__PURE__ */ new WeakMap();
  jsEngine = new JSExecutionEngine();
  fingerprintEngine = new DOMFingerprintEngine();
  humanInteraction = new HumanInteractionController();
  session = new BrowserSessionModel();
  simulationTabs = [];
  simulationTabCounter = 0;
  simulationExtensions = [
    { id: "forensic-recorder@mcpdom", name: "Browser Forensic Recorder (MCPDOM)", version: "3.0.0", description: "The MCPDOM platform extension itself", enabled: true, installType: "development", isApp: false }
  ];
  regionCapture = new RegionCaptureEngine();
  constructor(nodeRegistry) {
    this.nodeRegistry = nodeRegistry || new NodeRegistry();
    const privacy = new PrivacyEngine();
    const sequenceCounter = new SequenceCounter();
    this.snapshotEngine = new SnapshotEngine(this.nodeRegistry, privacy, sequenceCounter);
    this.picker = new ElementPicker({ nodeRegistry: this.nodeRegistry });
    this.interactionEngine = new ElementInteractionEngine(this.nodeRegistry);
    this.observer = new ElementObserver(this.nodeRegistry);
    this.picker.initGlobalShortcutListener();
    this.interactionEngine.setTimingHook(async (phase) => {
      const ms = this.humanInteraction.delay(phase);
      if (ms > 0) {
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
    });
  }
  getMutationEngine(doc) {
    let engine = this.mutationEngines.get(doc);
    if (!engine) {
      engine = new DOMMutationEngine(doc, this.nodeRegistry);
      this.mutationEngines.set(doc, engine);
    }
    return engine;
  }
  getViewportController(doc) {
    let controller = this.viewportControllers.get(doc);
    if (!controller) {
      controller = new ViewportController(doc);
      this.viewportControllers.set(doc, controller);
    }
    return controller;
  }
  getTargetingEngine(doc) {
    let engine = this.targetingEngines.get(doc);
    if (!engine) {
      engine = new ElementTargetingEngine(doc, this.nodeRegistry);
      this.targetingEngines.set(doc, engine);
    }
    return engine;
  }
  isSimulation() {
    return typeof globalThis.__FORENSIC_SIMULATION__ !== "undefined" || typeof globalThis.chrome === "undefined";
  }
  getPicker() {
    return this.picker;
  }
  getInteractionEngine() {
    return this.interactionEngine;
  }
  getObserver() {
    return this.observer;
  }
  getNodeRegistry() {
    return this.nodeRegistry;
  }
  /**
   * Universal Dispatcher for all Live Browser Commands
   */
  async handleCommand(request, doc = typeof document !== "undefined" ? document : {}) {
    const startTime = Date.now();
    const { id, command, payload } = request;
    try {
      switch (command) {
        // 1. Page-Level Inspection
        case "LIVE_PAGE_INSPECT": {
          const pageInfo = LiveDOMInspector.inspectPage(doc);
          return this.success(id, command, pageInfo, startTime);
        }
        // 2. Element-Level Inspection
        case "LIVE_ELEMENT_INSPECT": {
          const target = this.resolveTarget(payload, doc);
          const elementInfo = LiveDOMInspector.inspectElement(target, this.nodeRegistry);
          return this.success(id, command, elementInfo, startTime);
        }
        // 3. Get Selected Element (Ctrl+Shift+Click)
        case "GET_SELECTED_ELEMENT": {
          const selected = this.picker.getLastSelectedElement();
          return this.success(id, command, selected, startTime);
        }
        // 4. Element Picker Controls
        case "ELEMENT_PICKER_START": {
          this.picker.startPicker();
          return this.success(id, command, { pickerActive: true }, startTime);
        }
        case "ELEMENT_PICKER_STOP": {
          this.picker.stopPicker();
          return this.success(id, command, { pickerActive: false }, startTime);
        }
        // 5. Element Interaction
        case "LIVE_ELEMENT_INTERACT": {
          const interactionPayload = payload;
          const result = await this.interactionEngine.interact(interactionPayload, doc);
          return this.success(id, command, result, startTime);
        }
        // 6. Element Observation
        case "ELEMENT_OBSERVATION_START": {
          const target = this.resolveTarget(payload, doc);
          const obsInfo = this.observer.startObservation(target, doc);
          return this.success(id, command, obsInfo, startTime);
        }
        case "ELEMENT_OBSERVATION_STOP": {
          const bundle = this.observer.stopObservation(doc);
          return this.success(id, command, bundle, startTime);
        }
        // 7. Live DOM Snapshot
        case "LIVE_DOM_SNAPSHOT": {
          const format = payload?.format || "html";
          if (format === "html") {
            const html = doc.documentElement?.outerHTML || "";
            return this.success(id, command, { html }, startTime);
          }
          const snapshot = this.snapshotEngine.captureSnapshot(doc, "live_session");
          return this.success(id, command, snapshot, startTime);
        }
        // 8. Live DOM Subtree
        case "LIVE_DOM_SUBTREE": {
          const target = this.resolveTarget(payload, doc);
          const html = target.outerHTML || "";
          const info = LiveDOMInspector.inspectElement(target, this.nodeRegistry);
          return this.success(id, command, { html, element: info }, startTime);
        }
        // 9. Element Visual & Occlusion State
        case "GET_ELEMENT_VISUAL_STATE": {
          const target = this.resolveTarget(payload, doc);
          const visualState = LiveDOMInspector.inspectVisualState(target);
          return this.success(id, command, visualState, startTime);
        }
        // 10. Live Screenshots
        case "LIVE_PAGE_SCREENSHOT":
        case "LIVE_ELEMENT_SCREENSHOT": {
          const screenshot = await this.handleScreenshotCapture(command, payload, doc);
          return this.success(id, command, screenshot, startTime);
        }
        // 11. Tab Console Logs
        case "GET_TAB_CONSOLE_LOGS": {
          const { level, searchQuery, limit = 100, clearAfterRead } = payload || {};
          let logs = typeof window !== "undefined" && window.__FORENSIC_CONSOLE_BUFFER__ || [];
          if (level && level !== "all") {
            logs = logs.filter((l) => l.level === level);
          }
          if (searchQuery) {
            const q = String(searchQuery).toLowerCase();
            logs = logs.filter((l) => l.text?.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q));
          }
          if (limit > 0) {
            logs = logs.slice(-limit);
          }
          if (clearAfterRead && typeof window !== "undefined" && window.__FORENSIC_CONSOLE_BUFFER__) {
            window.__FORENSIC_CONSOLE_BUFFER__.length = 0;
          }
          return this.success(
            id,
            command,
            {
              url: typeof window !== "undefined" ? window.location.href : "",
              title: doc.title || "",
              totalCaptured: typeof window !== "undefined" && window.__FORENSIC_CONSOLE_BUFFER__?.length || logs.length,
              returnedCount: logs.length,
              logs
            },
            startTime
          );
        }
        // 12. Tab Network Requests
        case "GET_TAB_NETWORK_REQUESTS": {
          const { method, searchQuery, status, onlyErrors, limit = 100, clearAfterRead } = payload || {};
          let reqs = typeof window !== "undefined" && window.__FORENSIC_NETWORK_BUFFER__ || [];
          if (method) {
            reqs = reqs.filter((r) => r.method?.toUpperCase() === String(method).toUpperCase());
          }
          if (status) {
            reqs = reqs.filter((r) => r.status === Number(status));
          }
          if (onlyErrors) {
            reqs = reqs.filter((r) => r.error || r.status && r.status >= 400);
          }
          if (searchQuery) {
            const q = String(searchQuery).toLowerCase();
            reqs = reqs.filter((r) => r.url?.toLowerCase().includes(q));
          }
          if (limit > 0) {
            reqs = reqs.slice(-limit);
          }
          if (clearAfterRead && typeof window !== "undefined" && window.__FORENSIC_NETWORK_BUFFER__) {
            window.__FORENSIC_NETWORK_BUFFER__.length = 0;
          }
          return this.success(
            id,
            command,
            {
              url: typeof window !== "undefined" ? window.location.href : "",
              title: doc.title || "",
              totalCaptured: typeof window !== "undefined" && window.__FORENSIC_NETWORK_BUFFER__?.length || reqs.length,
              returnedCount: reqs.length,
              requests: reqs
            },
            startTime
          );
        }
        case "CLOSE_TAB": {
          if (typeof globalThis.chrome !== "undefined" && globalThis.chrome.runtime?.sendMessage) {
            const res = await new Promise((resolve) => {
              globalThis.chrome.runtime.sendMessage({ type: "BROWSER_COMMAND_REQUEST", id, command, payload }, (r) => resolve(r));
            });
            if (res) return res;
          }
          if (this.isSimulation()) {
            return this.simulationCloseTab(payload, doc, id, command, startTime);
          }
          if (typeof window !== "undefined") {
            setTimeout(() => window.close(), 100);
            return this.success(id, command, { closed: true, url: window.location.href, title: doc.title }, startTime);
          }
          return this.success(id, command, { closed: true }, startTime);
        }
        case "RELOAD_TAB": {
          if (typeof globalThis.chrome !== "undefined" && globalThis.chrome.runtime?.sendMessage) {
            const res = await new Promise((resolve) => {
              globalThis.chrome.runtime.sendMessage({ type: "BROWSER_COMMAND_REQUEST", id, command, payload }, (r) => resolve(r));
            });
            if (res) return res;
          }
          if (this.isSimulation()) {
            const mode = payload?.mode || "soft";
            this.session.timeline.record("NAVIGATED", `tab reloaded (${mode} mode)`);
            return this.success(
              id,
              command,
              {
                reloaded: true,
                mode,
                simulated: true,
                url: doc.defaultView?.location?.href || "",
                title: doc.title,
                note: "Node simulation context: DOM fixture retained; no real navigation occurs."
              },
              startTime
            );
          }
          if (typeof window !== "undefined") {
            setTimeout(() => window.location.reload(), 100);
            return this.success(id, command, { reloaded: true, url: window.location.href, title: doc.title }, startTime);
          }
          return this.success(id, command, { reloaded: true }, startTime);
        }
        case "OPEN_TAB":
        case "LIST_TABS":
        case "FOCUS_TAB":
        case "LIST_EXTENSIONS":
        case "RELOAD_EXTENSION":
        case "SET_EXTENSION_ENABLED":
        case "TOGGLE_EXTENSION": {
          if (this.isSimulation()) {
            return this.handleSimulationBackgroundCommand(id, command, payload, doc, startTime);
          }
          if (typeof globalThis.chrome !== "undefined" && globalThis.chrome.runtime?.sendMessage) {
            const res = await new Promise((resolve) => {
              globalThis.chrome.runtime.sendMessage({ type: "BROWSER_COMMAND_REQUEST", id, command, payload }, (r) => resolve(r));
            });
            if (res) return res;
          }
          return this.error(id, command, "BACKGROUND_EXECUTION_FAILED", `Command ${command} requires Chrome extension runtime`, startTime);
        }
        // ==================================================================
        // MCPDOM v3 PLATFORM EVOLUTION COMMANDS
        // ==================================================================
        // --- Viewport control (§17/§38) ---
        case "RESIZE_VIEWPORT": {
          const vc = this.getViewportController(doc);
          let result;
          if (payload?.preset) {
            result = vc.applyPreset(payload.preset);
          } else {
            const width = Number(payload?.width) || 1280;
            const height = Number(payload?.height) || 800;
            result = vc.resize(width, height);
          }
          this.session.timeline.record("RESIZED", `viewport → ${result.applied.width}x${result.applied.height}`);
          return this.success(id, command, result, startTime);
        }
        case "RESET_VIEWPORT": {
          const vc = this.getViewportController(doc);
          const result = vc.reset();
          this.session.timeline.record("RESIZED", `viewport restored to ${result.applied.width}x${result.applied.height}`);
          return this.success(id, command, result, startTime);
        }
        case "GET_VIEWPORT_STATE": {
          const vc = this.getViewportController(doc);
          return this.success(id, command, vc.state(), startTime);
        }
        case "RUN_RESPONSIVE_TEST": {
          const vc = this.getViewportController(doc);
          const sizes = payload?.sizes || defaultSizesInternal();
          const result = vc.runResponsiveTest(sizes, { restore: payload?.restore !== false });
          return this.success(id, command, result, startTime);
        }
        case "EMULATE_DEVICE": {
          const vc = this.getViewportController(doc);
          const result = vc.emulateDevice(payload?.device || "pixel-7");
          return this.success(id, command, result, startTime);
        }
        // --- JavaScript execution (§18) ---
        case "EXECUTE_JS":
        case "EXECUTE_JS_AND_CAPTURE_CHANGES": {
          const code = String(payload?.code || "");
          if (!code.trim()) {
            return this.error(id, command, "SCRIPT_EMPTY", "payload.code is required.", startTime);
          }
          const result = await this.jsEngine.execute(doc, code, {
            timeoutMs: payload?.timeoutMs,
            world: payload?.world === "MAIN" ? "MAIN" : "ISOLATED"
          });
          this.session.timeline.record("SCRIPT_EXECUTED", `${result.status} (${result.durationMs}ms)`);
          return this.success(id, command, result, startTime);
        }
        // --- DOM mutation engine (§19/§20/§47/§48) ---
        case "DOM_MUTATE": {
          const engine = this.getMutationEngine(doc);
          const result = engine.mutate(payload);
          this.session.timeline.record("DOM_MUTATED", `${result.operation} on ${result.before.selector} → ${result.success ? "OK" : result.error}`);
          return this.success(id, command, result, startTime);
        }
        case "DOM_MUTATE_TRANSACTION": {
          const engine = this.getMutationEngine(doc);
          const mode = payload?.mode || "begin";
          try {
            if (mode === "begin") {
              const transactionId = engine.beginTransaction();
              return this.success(id, command, { transactionId, mode, open: true }, startTime);
            }
            if (mode === "commit") {
              const result = engine.commitTransaction();
              this.session.timeline.record("DOM_MUTATED", `transaction ${result.transactionId} committed (${result.steps.length} steps)`);
              return this.success(id, command, { ...result, mode }, startTime);
            }
            if (mode === "rollback") {
              const result = engine.rollbackTransaction(payload?.reason);
              this.session.timeline.record("MUTATION_UNDONE", `transaction ${result.transactionId} rolled back`);
              return this.success(id, command, { ...result, mode }, startTime);
            }
            return this.error(id, command, "INVALID_MODE", `mode must be begin|commit|rollback, got "${mode}"`, startTime);
          } catch (err) {
            return this.error(id, command, "DOM_MUTATION_FAILED", err.message, startTime);
          }
        }
        case "UNDO_DOM_MUTATION": {
          const engine = this.getMutationEngine(doc);
          const result = engine.undo();
          if (result.success) this.session.timeline.record("MUTATION_UNDONE", result.message);
          return this.success(id, command, result, startTime);
        }
        case "REDO_DOM_MUTATION": {
          const engine = this.getMutationEngine(doc);
          const result = engine.redo();
          if (result.success) this.session.timeline.record("MUTATION_REDONE", result.message);
          return this.success(id, command, result, startTime);
        }
        case "GET_MUTATION_HISTORY": {
          const engine = this.getMutationEngine(doc);
          return this.success(
            id,
            command,
            {
              entries: engine.getHistory(payload?.limit || 100),
              undoDepth: engine.getUndoDepth(),
              redoDepth: engine.getRedoDepth(),
              openTransactionId: engine.getOpenTransactionId()
            },
            startTime
          );
        }
        case "PREVIEW_DOM_MUTATION": {
          const engine = this.getMutationEngine(doc);
          const preview = engine.preview(payload);
          return this.success(id, command, preview, startTime);
        }
        // --- Element targeting & forensics (§12/§13/§34/§35) ---
        case "GENERATE_ELEMENT_TARGET": {
          const targeting = this.getTargetingEngine(doc);
          const outcome = targeting.resolveAndBuild(payload?.target || payload?.selector || "");
          if ("error" in outcome) {
            return this.error(id, command, "TARGET_NOT_FOUND", outcome.error, startTime);
          }
          return this.success(id, command, outcome.target, startTime);
        }
        case "RECOVER_SELECTOR": {
          const recovery = new SelectorRecoveryEngine(doc);
          const snapshot = payload?.snapshot || {};
          const outcome = recovery.recover(payload?.selector || "", snapshot);
          return this.success(id, command, outcome, startTime);
        }
        case "GET_ELEMENT_ANCESTRY": {
          const target = this.resolveTarget(payload, doc);
          return this.success(id, command, buildAncestry(target, doc), startTime);
        }
        case "GET_ELEMENT_FINGERPRINT": {
          const target = this.resolveTarget(payload, doc);
          const fp = this.fingerprintEngine.fingerprint(target);
          return this.success(id, command, fp, startTime);
        }
        case "GET_ELEMENT_RELATIONSHIPS": {
          const target = this.resolveTarget(payload, doc);
          return this.success(id, command, buildRelationships(target, doc), startTime);
        }
        case "GET_ELEMENT_ACCESSIBILITY": {
          const target = this.resolveTarget(payload, doc);
          return this.success(id, command, buildAccessibility(target), startTime);
        }
        case "GET_COMPUTED_STYLE": {
          const target = this.resolveTarget(payload, doc);
          const win = doc.defaultView;
          if (!win?.getComputedStyle) {
            return this.error(id, command, "STYLE_UNAVAILABLE", "getComputedStyle is unavailable in this context.", startTime);
          }
          const cs = win.getComputedStyle(target);
          const props = Array.isArray(payload?.properties) && payload.properties.length ? payload.properties : ["display", "position", "color", "background-color", "font-size", "font-family", "width", "height", "margin", "padding", "border", "z-index", "opacity", "visibility", "overflow", "flex-direction", "grid-template-columns"];
          const styles = {};
          for (const p of props) {
            styles[p] = cs.getPropertyValue(p);
          }
          return this.success(id, command, { selector: LiveDOMInspector.inspectElement(target, this.nodeRegistry).bestSelector, styles }, startTime);
        }
        case "ANALYZE_DOM": {
          const analyzer = String(payload?.analyzer || "");
          if (!analyzer) {
            return this.error(id, command, "ANALYZER_REQUIRED", 'payload.analyzer is required (e.g. "analyze_forms").', startTime);
          }
          const result = runAnalyzer(analyzer, doc, payload);
          if (result.count === 0 && result.warnings.length === 0 && result.items.length === 0 && result.summary.startsWith("Unknown analyzer")) {
            return this.error(id, command, "UNKNOWN_ANALYZER", result.summary, startTime);
          }
          return this.success(id, command, result, startTime);
        }
        // --- Extended interactions (capabilities 11-20) ---
        case "DRAG_ELEMENT": {
          const source = this.resolveTarget(payload?.source, doc);
          const targetEl = payload?.target ? this.resolveTarget(payload?.target, doc) : null;
          const result = await this.performDrag(source, targetEl, payload?.offsets, doc);
          return this.success(id, command, result, startTime);
        }
        case "SET_INPUT_CHECKED": {
          const target = this.resolveTarget(payload, doc);
          const input = target;
          if (input.type !== "checkbox" && input.type !== "radio") {
            return this.error(id, command, "INPUT_TYPE_UNSUPPORTED", `Target input type "${input.type}" is not checkbox/radio.`, startTime);
          }
          const checkedBefore = input.checked;
          input.checked = payload?.checked !== false;
          const events = [];
          for (const evt of ["input", "change"]) {
            try {
              input.dispatchEvent(new doc.defaultView.Event(evt, { bubbles: true }));
              events.push(evt);
            } catch {
            }
          }
          if (input.type === "radio" && input.name) {
            for (const peer of Array.from(doc.querySelectorAll(`input[type=radio][name="${input.name}"]`))) {
              if (peer !== input) peer.checked = false;
            }
          }
          return this.success(id, command, { success: true, selector: LiveDOMInspector.inspectElement(input, this.nodeRegistry).bestSelector, inputType: input.type, checkedBefore, checkedAfter: input.checked, eventsFired: events }, startTime);
        }
        case "PRESS_KEYBOARD_SHORTCUT": {
          const keys = Array.isArray(payload?.keys) ? payload.keys : String(payload?.keys || "Enter").split("+");
          const focusTarget = payload?.target ? this.resolveTarget(payload?.target, doc) : doc.activeElement || doc.body;
          if (typeof focusTarget.focus === "function") focusTarget.focus();
          const events = [];
          const win = doc.defaultView;
          for (const key of keys) {
            for (const evtType of ["keydown", "keyup"]) {
              try {
                focusTarget.dispatchEvent(
                  new (win?.KeyboardEvent || KeyboardEvent)(evtType, {
                    key: key.trim(),
                    bubbles: true,
                    cancelable: true,
                    ctrlKey: keys.some((k) => /^(ctrl|control|cmd|meta)$/i.test(k)) && key !== keys.find((k) => /^(ctrl|control|cmd|meta)$/i.test(k)),
                    shiftKey: keys.some((k) => /^shift$/i.test(k)) && key !== "Shift",
                    altKey: keys.some((k) => /^alt$/i.test(k)) && key !== "Alt"
                  })
                );
                events.push(`${evtType}:${key}`);
              } catch {
              }
            }
          }
          return this.success(id, command, { success: true, keys, targetSelector: LiveDOMInspector.inspectElement(focusTarget, this.nodeRegistry).bestSelector, eventsFired: events }, startTime);
        }
        case "SCROLL_PAGE": {
          const win = doc.defaultView;
          if (!win) {
            return this.error(id, command, "NO_WINDOW", "No window available for scrolling.", startTime);
          }
          const before = { x: win.scrollX || 0, y: win.scrollY || 0 };
          let targetSelector;
          if (payload?.target || payload?.selector) {
            const target = this.resolveTarget(payload?.target || payload?.selector, doc);
            target.scrollIntoView?.({ behavior: payload?.behavior || "auto", block: "center" });
            targetSelector = LiveDOMInspector.inspectElement(target, this.nodeRegistry).bestSelector;
          } else {
            win.scrollBy(Number(payload?.x) || 0, Number(payload?.y) || 0);
          }
          const after = { x: win.scrollX || 0, y: win.scrollY || 0 };
          return this.success(id, command, { success: true, scrollBefore: before, scrollAfter: after, requested: { x: Number(payload?.x) || 0, y: Number(payload?.y) || 0 }, targetSelector }, startTime);
        }
        case "WAIT_FOR_CONDITION": {
          const result = await this.waitForCondition(doc, payload || {}, startTime, id, command);
          return result;
        }
        // --- Page state snapshots (§39/§40) ---
        case "GET_PAGE_STATE":
        case "CAPTURE_PAGE_STATE": {
          const snapshot = this.session.captureSnapshot(doc, true, this.getMutationEngine(doc).getUndoDepth());
          return this.success(id, command, snapshot, startTime);
        }
        // --- Region capture (browser side of §33) ---
        case "CAPTURE_REGION": {
          const target = this.resolveTarget(payload?.target || payload?.selector, doc);
          const data = this.regionCapture.capture(target);
          return this.success(id, command, data, startTime);
        }
        // --- Simulation tab state (for the session model) ---
        case "GET_SIMULATION_TAB_STATE": {
          if (!this.isSimulation()) {
            return this.error(id, command, "NOT_SIMULATION", "Simulation tab state is only available in the Node simulation context.", startTime);
          }
          return this.success(id, command, { simulated: true, tabs: this.simulationTabs, sessionSummary: this.session.getTabs() }, startTime);
        }
        default:
          return this.error(id, command, "UNKNOWN_COMMAND", `Unsupported command '${command}'`, startTime);
      }
    } catch (err) {
      return this.error(id, command, "COMMAND_EXECUTION_FAILED", err.message, startTime, err.details);
    }
  }
  resolveTarget(targetSpec, doc) {
    if (!targetSpec) {
      throw new Error("Target specifier must be provided");
    }
    if (typeof targetSpec === "string") {
      return this.interactionEngine.resolveTarget({ selector: targetSpec }, doc);
    }
    if (typeof targetSpec === "number") {
      return this.interactionEngine.resolveTarget({ nodeId: targetSpec }, doc);
    }
    return this.interactionEngine.resolveTarget(targetSpec, doc);
  }
  // ==================================================================
  // MCPDOM v3 helper implementations
  // ==================================================================
  async performDrag(source, target, offsets, doc) {
    const win = doc.defaultView;
    const eventsFired = [];
    const fire = (el, type, opts = {}) => {
      try {
        const MouseCtor = win?.MouseEvent || (typeof MouseEvent !== "undefined" ? MouseEvent : null);
        if (MouseCtor) {
          el.dispatchEvent(new MouseCtor(type, { bubbles: true, cancelable: true, ...opts }));
          eventsFired.push(type);
        }
      } catch {
      }
    };
    const sourceRect = source.getBoundingClientRect();
    const startX = sourceRect.x + sourceRect.width / 2;
    const startY = sourceRect.y + sourceRect.height / 2;
    let endX = startX + (offsets?.x || 0);
    let endY = startY + (offsets?.y || 0);
    if (target) {
      const tr = target.getBoundingClientRect();
      endX = tr.x + tr.width / 2;
      endY = tr.y + tr.height / 2;
    }
    fire(source, "pointerdown", { button: 1, clientX: startX, clientY: startY });
    fire(source, "mousedown", { button: 1, clientX: startX, clientY: startY });
    fire(source, "dragstart", { clientX: startX, clientY: startY });
    if (target) {
      fire(target, "dragenter", { clientX: endX, clientY: endY });
      fire(target, "dragover", { clientX: endX, clientY: endY });
      fire(target, "drop", { clientX: endX, clientY: endY });
    }
    fire(source, "dragend", { clientX: endX, clientY: endY });
    fire(source, "pointerup", { button: 1, clientX: endX, clientY: endY });
    fire(source, "mouseup", { button: 1, clientX: endX, clientY: endY });
    return {
      success: eventsFired.length > 0,
      sourceSelector: LiveDOMInspector.inspectElement(source, this.nodeRegistry).bestSelector,
      targetSelector: target ? LiveDOMInspector.inspectElement(target, this.nodeRegistry).bestSelector : "(offset drop)",
      eventsFired,
      finalPosition: { x: Math.round(endX), y: Math.round(endY) },
      html5DndUsed: eventsFired.includes("dragstart")
    };
  }
  async waitForCondition(doc, payload, startTime, id, command) {
    const kind = payload.kind || "dom_stable";
    const timeoutMs = Math.min(Math.max(Number(payload.timeoutMs) || 5e3, 100), 3e4);
    const pollIntervalMs = Math.min(Math.max(Number(payload.pollIntervalMs) || 100, 20), 1e3);
    const start = Date.now();
    const check = () => {
      switch (kind) {
        case "dom_stable": {
          const length = doc.documentElement?.outerHTML.length || 0;
          return {
            satisfied: true,
            // first observation is the baseline; stability = no change across polls handled below
            detail: `dom length ${length}`
          };
        }
        case "selector_present": {
          const found = payload.selector ? doc.querySelectorAll(payload.selector).length : 0;
          return { satisfied: found > 0, detail: `"${payload.selector}" matches ${found} element(s)` };
        }
        case "selector_visible": {
          if (!payload.selector) return { satisfied: false, detail: "no selector supplied" };
          const el = doc.querySelector(payload.selector);
          if (!el) return { satisfied: false, detail: `"${payload.selector}" not present` };
          try {
            const vis = LiveDOMInspector.inspectElement(el).visibility.isVisible;
            return { satisfied: vis, detail: `visibility=${vis}` };
          } catch {
            return { satisfied: false, detail: "inspection failed" };
          }
        }
        case "selector_absent": {
          const found = payload.selector ? doc.querySelectorAll(payload.selector).length : 0;
          return { satisfied: found === 0, detail: `"${payload.selector}" matches ${found} element(s)` };
        }
        case "text_present": {
          const text = doc.body?.innerText || doc.body?.textContent || "";
          const has = payload.text ? text.includes(String(payload.text)) : false;
          return { satisfied: has, detail: `text "${String(payload.text).slice(0, 30)}" ${has ? "found" : "not found"}` };
        }
        case "url_contains": {
          const url = doc.defaultView?.location?.href || "";
          return { satisfied: payload.text ? url.includes(String(payload.text)) : false, detail: url };
        }
        case "element_count": {
          const found = payload.selector ? doc.querySelectorAll(payload.selector).length : 0;
          const expected = Number(payload.count) || 0;
          return { satisfied: found === expected, detail: `${found}/${expected} elements` };
        }
        case "readiness_state": {
          return { satisfied: doc.readyState === (payload.state || "complete"), detail: `readyState=${doc.readyState}` };
        }
        default:
          return { satisfied: false, detail: `unknown condition kind "${kind}"` };
      }
    };
    if (kind === "dom_stable") {
      let lastLength = doc.documentElement?.outerHTML.length || 0;
      let stable = false;
      let polls = 0;
      while (Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        const length = doc.documentElement?.outerHTML.length || 0;
        polls++;
        if (length === lastLength) {
          stable = true;
          break;
        }
        lastLength = length;
      }
      const waitedMs2 = Date.now() - start;
      if (stable) this.session.timeline.record("WAIT_SATISFIED", `dom_stable after ${waitedMs2}ms (${polls} polls)`);
      return this.success(id, command, { satisfied: stable, condition: kind, waitedMs: waitedMs2, timeoutMs, detail: `dom length ${lastLength}, ${polls} polls` }, startTime);
    }
    let outcome = check();
    while (!outcome.satisfied && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      outcome = check();
    }
    const waitedMs = Date.now() - start;
    if (outcome.satisfied) this.session.timeline.record("WAIT_SATISFIED", `${kind} after ${waitedMs}ms`);
    return this.success(id, command, { satisfied: outcome.satisfied, condition: kind, waitedMs, timeoutMs, detail: outcome.detail }, startTime);
  }
  simulationCloseTab(payload, doc, id, command, startTime) {
    const tabId = Number(payload?.tabId);
    const idx = Number.isFinite(tabId) ? this.simulationTabs.findIndex((t) => t.browserTabId === tabId) : this.simulationTabs.findIndex((t) => t.active);
    if (idx < 0) {
      return this.error(id, command, "TAB_NOT_FOUND", `No simulated tab matches tabId=${tabId}`, startTime);
    }
    const closed = this.simulationTabs.splice(idx, 1)[0];
    this.session.closeTab(closed.sessionTabId);
    if (closed.active && this.simulationTabs.length) {
      this.simulationTabs[0].active = true;
      this.session.switchTab(this.simulationTabs[0].sessionTabId);
    }
    return this.success(
      id,
      command,
      { closed: true, closedTab: { id: closed.browserTabId, url: closed.url, title: closed.title }, simulated: true, remaining: this.simulationTabs.length },
      startTime
    );
  }
  handleSimulationBackgroundCommand(id, command, payload, doc, startTime) {
    const ensureInitialTab = () => {
      if (!this.simulationTabs.length) {
        this.simulationTabCounter++;
        const tab = {
          sessionTabId: `stab_${this.simulationTabCounter}`,
          browserTabId: this.simulationTabCounter,
          url: doc.defaultView?.location?.href || "about:blank",
          title: doc.title || "Simulated Tab",
          active: true,
          createdAt: Date.now()
        };
        this.simulationTabs.push(tab);
        this.session.registerTab(tab.browserTabId, tab.url, tab.title);
        this.session.switchTab(tab.sessionTabId);
      }
    };
    switch (command) {
      case "LIST_TABS": {
        ensureInitialTab();
        return this.success(
          id,
          command,
          {
            simulated: true,
            environment: "node-simulation",
            tabs: this.simulationTabs.map((t, i) => ({
              id: t.browserTabId,
              index: i,
              windowId: 1,
              title: t.title,
              url: t.url,
              active: t.active,
              status: "complete",
              pinned: false,
              audited: false
            })),
            note: "Deterministic simulated tab state — a real browser tab list requires the Chrome extension connection."
          },
          startTime
        );
      }
      case "OPEN_TAB": {
        const url = String(payload?.url || "about:blank");
        this.simulationTabCounter++;
        const tab = {
          sessionTabId: `stab_${this.simulationTabCounter}`,
          browserTabId: this.simulationTabCounter,
          url,
          title: payload?.title || `Simulated Tab ${this.simulationTabCounter}`,
          active: true,
          createdAt: Date.now()
        };
        this.simulationTabs.forEach((t) => t.active = false);
        this.simulationTabs.push(tab);
        const registered = this.session.registerTab(tab.browserTabId, url, tab.title);
        this.session.switchTab(registered.sessionTabId);
        this.session.timeline.record("TAB_OPENED", `simulation tab ${tab.browserTabId} → ${url}`);
        return this.success(id, command, { opened: true, tabId: tab.browserTabId, url, simulated: true, totalTabs: this.simulationTabs.length }, startTime);
      }
      case "FOCUS_TAB": {
        ensureInitialTab();
        const tabId = Number(payload?.tabId);
        const tab = this.simulationTabs.find((t) => t.browserTabId === tabId) || this.simulationTabs[0];
        if (!tab) {
          return this.error(id, command, "TAB_NOT_FOUND", `No simulated tab with tabId=${tabId}`, startTime);
        }
        this.simulationTabs.forEach((t) => t.active = false);
        tab.active = true;
        this.session.switchTab(tab.sessionTabId);
        this.session.timeline.record("TAB_SWITCHED", `simulation tab ${tab.browserTabId} focused`);
        return this.success(id, command, { focused: true, tabId: tab.browserTabId, url: tab.url, simulated: true }, startTime);
      }
      case "LIST_EXTENSIONS": {
        return this.success(
          id,
          command,
          {
            simulated: true,
            extensions: this.simulationExtensions.map((e) => ({ ...e, permissions: ["activeTab", "scripting", "storage", "tabs", "management"] })),
            note: "Deterministic simulated extension state."
          },
          startTime
        );
      }
      case "SET_EXTENSION_ENABLED": {
        const extensionId = String(payload?.extensionId || "");
        const ext = this.simulationExtensions.find((e) => e.id === extensionId || e.name.toLowerCase().includes(extensionId.toLowerCase()));
        if (!ext) {
          return this.error(id, command, "EXTENSION_NOT_FOUND", `No simulated extension matches "${extensionId}". Known: ${this.simulationExtensions.map((e) => e.id).join(", ")}`, startTime);
        }
        ext.enabled = Boolean(payload?.enabled);
        this.session.timeline.record("EXTENSION_STATE_CHANGED", `${ext.id} → ${ext.enabled ? "enabled" : "disabled"}`);
        return this.success(id, command, { extensionId: ext.id, enabled: ext.enabled, simulated: true }, startTime);
      }
      case "TOGGLE_EXTENSION": {
        const extensionId = String(payload?.extensionId || "");
        const ext = this.simulationExtensions.find((e) => e.id === extensionId || e.name.toLowerCase().includes(extensionId.toLowerCase()));
        if (!ext) {
          return this.error(id, command, "EXTENSION_NOT_FOUND", `No simulated extension matches "${extensionId}".`, startTime);
        }
        ext.enabled = !ext.enabled;
        this.session.timeline.record("EXTENSION_STATE_CHANGED", `${ext.id} → ${ext.enabled ? "enabled" : "disabled"}`);
        return this.success(id, command, { extensionId: ext.id, enabled: ext.enabled, simulated: true }, startTime);
      }
      case "RELOAD_EXTENSION": {
        const extensionId = String(payload?.extensionId || this.simulationExtensions[0].id);
        const ext = this.simulationExtensions.find((e) => e.id === extensionId || e.name.toLowerCase().includes(extensionId.toLowerCase()));
        if (!ext) {
          return this.error(id, command, "EXTENSION_NOT_FOUND", `No simulated extension matches "${extensionId}".`, startTime);
        }
        return this.success(id, command, { reloaded: true, extensionId: ext.id, simulated: true, note: "Simulated reload: extension state preserved." }, startTime);
      }
      default:
        return this.error(id, command, "UNKNOWN_COMMAND", `Unhandled simulation command '${command}'`, startTime);
    }
  }
  async handleScreenshotCapture(command, payload, doc) {
    const win = doc.defaultView || (typeof window !== "undefined" ? window : {});
    const timestamp = Date.now();
    const screenshotId = `scr_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;
    const dpr = win.devicePixelRatio || 1;
    const viewport = {
      width: win.innerWidth || doc.documentElement?.clientWidth || 1920,
      height: win.innerHeight || doc.documentElement?.clientHeight || 1080,
      scrollX: win.scrollX || win.pageXOffset || 0,
      scrollY: win.scrollY || win.pageYOffset || 0,
      devicePixelRatio: dpr
    };
    let targetSelector = void 0;
    let targetNodeId = void 0;
    let targetBounds = void 0;
    let captureDimensions = { width: viewport.width, height: viewport.height };
    if (command === "LIVE_ELEMENT_SCREENSHOT") {
      const target = this.resolveTarget(payload, doc);
      const info = LiveDOMInspector.inspectElement(target, this.nodeRegistry);
      targetSelector = info.bestSelector;
      targetNodeId = info.forensics?.logicalNodeId || void 0;
      targetBounds = {
        x: info.bounds.x,
        y: info.bounds.y,
        width: info.bounds.width,
        height: info.bounds.height
      };
      captureDimensions = {
        width: Math.max(1, Math.round(info.bounds.width * dpr)),
        height: Math.max(1, Math.round(info.bounds.height * dpr))
      };
    }
    let dataUrl = payload?.dataUrl || "";
    if (command === "LIVE_ELEMENT_SCREENSHOT" && dataUrl && targetBounds && typeof Image !== "undefined") {
      try {
        const cropped = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            try {
              const cropCanvas = doc.createElement("canvas");
              const sx = Math.max(0, Math.floor(targetBounds.x * dpr));
              const sy = Math.max(0, Math.floor(targetBounds.y * dpr));
              const sw = Math.max(1, Math.floor(targetBounds.width * dpr));
              const sh = Math.max(1, Math.floor(targetBounds.height * dpr));
              cropCanvas.width = sw;
              cropCanvas.height = sh;
              const ctx = cropCanvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                resolve(cropCanvas.toDataURL("image/png"));
                return;
              }
            } catch {
            }
            resolve(dataUrl);
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
        if (cropped) {
          dataUrl = cropped;
        }
      } catch {
      }
    }
    if (!dataUrl) {
      const width = command === "LIVE_ELEMENT_SCREENSHOT" ? Math.max(120, captureDimensions.width || 320) : Math.max(800, viewport.width || 1280);
      const height = command === "LIVE_ELEMENT_SCREENSHOT" ? Math.max(60, captureDimensions.height || 180) : Math.max(600, viewport.height || 800);
      dataUrl = PNGBuilder.createDataUrl({
        width,
        height,
        backgroundColor: command === "LIVE_ELEMENT_SCREENSHOT" ? [30, 41, 59, 255] : [15, 23, 42, 255],
        headerColor: [56, 189, 248, 255],
        borderColor: [99, 102, 241, 255],
        label: targetSelector || (command === "LIVE_ELEMENT_SCREENSHOT" ? "Element Screenshot" : "Page Screenshot")
      });
    }
    return {
      screenshotId,
      timestamp,
      url: win.location?.href || doc.location?.href || "",
      viewport,
      targetSelector,
      targetNodeId,
      targetBounds,
      dataUrl,
      imageFormat: "png",
      dimensions: captureDimensions,
      captureType: command === "LIVE_ELEMENT_SCREENSHOT" ? "ELEMENT" : "FULL_PAGE"
    };
  }
  success(id, command, data, startTime) {
    return {
      id,
      command,
      success: true,
      data,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime
    };
  }
  error(id, command, code, message, startTime, details) {
    return {
      id,
      command,
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
      durationMs: Date.now() - startTime
    };
  }
}
function buildAncestry(element, doc) {
  const ancestors = [];
  let cur = element.parentElement;
  let distance = 1;
  while (cur && distance <= 10) {
    const parent = cur.parentElement;
    const sameTag = parent ? Array.from(parent.children).filter((c) => c.tagName === cur.tagName) : [];
    ancestors.push({
      tag: cur.tagName.toLowerCase(),
      selector: quickSelector(cur),
      role: cur.getAttribute("role") || void 0,
      text: directTextOf(cur).slice(0, 40),
      childIndex: sameTag.length ? sameTag.indexOf(cur) + 1 : 1,
      siblingCount: parent ? Array.from(parent.children).length : 0,
      distance
    });
    cur = cur.parentElement;
    distance++;
  }
  const parentForSiblings = element.parentElement;
  const siblings = [];
  if (parentForSiblings) {
    const all = Array.from(parentForSiblings.children);
    const myIndex = all.indexOf(element);
    for (let i = myIndex - 1; i >= 0 && i >= myIndex - 5; i--) {
      siblings.push({ tag: all[i].tagName.toLowerCase(), selector: quickSelector(all[i]), role: all[i].getAttribute("role") || void 0, text: directTextOf(all[i]).slice(0, 30), position: "before", distance: myIndex - i });
    }
    for (let i = myIndex + 1; i < all.length && i <= myIndex + 5; i++) {
      siblings.push({ tag: all[i].tagName.toLowerCase(), selector: quickSelector(all[i]), role: all[i].getAttribute("role") || void 0, text: directTextOf(all[i]).slice(0, 30), position: "after", distance: i - myIndex });
    }
  }
  let maxDepth = 0;
  const tags = [];
  const interactive = [];
  const walk = (el, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    for (const child of Array.from(el.children)) {
      tags.push(child.tagName.toLowerCase());
      if (child.matches('a[href], button, input, select, textarea, [role="button"], [onclick]')) {
        interactive.push(quickSelector(child));
      }
      if (depth < 6) walk(child, depth + 1);
    }
  };
  walk(element, 1);
  return {
    selector: quickSelector(element),
    ancestors,
    siblings,
    descendants: {
      count: element.querySelectorAll("*").length,
      maxDepth,
      tags: Array.from(new Set(tags)).slice(0, 30),
      interactive: interactive.slice(0, 30)
    }
  };
}
function buildRelationships(element, doc) {
  const nodes = [
    { id: "self", selector: quickSelector(element), tag: element.tagName.toLowerCase(), role: element.getAttribute("role") || void 0, label: directTextOf(element).slice(0, 30) || element.tagName.toLowerCase(), relationship: "self", depth: 0 }
  ];
  const edges = [];
  let cur = element.parentElement;
  let depth = 1;
  while (cur && depth <= 4) {
    const id = `ancestor_${depth}`;
    nodes.push({ id, selector: quickSelector(cur), tag: cur.tagName.toLowerCase(), role: cur.getAttribute("role") || void 0, label: directTextOf(cur).slice(0, 30) || cur.tagName.toLowerCase(), relationship: "parent", depth });
    edges.push({ from: id, to: depth === 1 ? "self" : `ancestor_${depth - 1}`, relation: "parent-of" });
    cur = cur.parentElement;
    depth++;
  }
  for (const child of Array.from(element.children).slice(0, 12)) {
    const id = `child_${nodes.length}`;
    nodes.push({ id, selector: quickSelector(child), tag: child.tagName.toLowerCase(), role: child.getAttribute("role") || void 0, label: directTextOf(child).slice(0, 30) || child.tagName.toLowerCase(), relationship: "child", depth: 1 });
    edges.push({ from: "self", to: id, relation: "contains" });
  }
  const parent = element.parentElement;
  if (parent) {
    for (const sib of Array.from(parent.children).slice(0, 12)) {
      if (sib === element) continue;
      const id = `sibling_${nodes.length}`;
      nodes.push({ id, selector: quickSelector(sib), tag: sib.tagName.toLowerCase(), role: sib.getAttribute("role") || void 0, label: directTextOf(sib).slice(0, 30) || sib.tagName.toLowerCase(), relationship: "sibling", depth: 1 });
      edges.push({ from: "self", to: id, relation: "sibling-of" });
    }
  }
  return { rootSelector: quickSelector(element), nodes, edges };
}
function buildAccessibility(element) {
  const ariaAttrs = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name.startsWith("aria-")) ariaAttrs[attr.name] = attr.value;
  }
  const ownText = directTextOf(element).trim();
  const ariaLabel = element.getAttribute("aria-label");
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  let labelledByText;
  if (ariaLabelledBy) {
    const refs = ariaLabelledBy.split(/\s+/).map((id) => element.ownerDocument?.getElementById(id)?.textContent?.trim()).filter(Boolean);
    labelledByText = refs.join(" ").slice(0, 60) || void 0;
  }
  const title = element.getAttribute("title");
  const tag = element.tagName.toLowerCase();
  const nameSources = [];
  let name = "";
  if (ariaLabel) {
    name = ariaLabel;
    nameSources.push("aria-label");
  } else if (labelledByText) {
    name = labelledByText;
    nameSources.push("aria-labelledby");
  } else if (ownText) {
    name = ownText.slice(0, 60);
    nameSources.push("text content");
  } else if (title) {
    name = title;
    nameSources.push("title");
  }
  const states = [];
  if (element.disabled || element.hasAttribute("disabled")) states.push("disabled");
  if (element.checked) states.push("checked");
  const sel = element;
  if (sel.tagName === "SELECT" && typeof sel.selectedOptions !== "undefined" && sel.selectedOptions.length > 0) states.push("selected");
  if (element.getAttribute("aria-expanded")) states.push(`expanded=${element.getAttribute("aria-expanded")}`);
  if (element.getAttribute("aria-pressed")) states.push(`pressed=${element.getAttribute("aria-pressed")}`);
  if (element.getAttribute("aria-hidden") === "true") states.push("hidden");
  if (element.hasAttribute("required")) states.push("required");
  if (element.readOnly) states.push("readonly");
  const focusable = ["a[href]", "button", "input", "select", "textarea", "[tabindex]"].some((s) => {
    try {
      return element.matches(s);
    } catch {
      return false;
    }
  });
  const issues = [];
  if (!name && focusable) issues.push("Focusable element has no accessible name.");
  if (tag === "img" && !element.hasAttribute("alt")) issues.push("Image has no alt attribute.");
  const headingMatch = /^h([1-6])$/.exec(tag);
  if (headingMatch && !ownText) issues.push(`Heading h${headingMatch[1]} is empty.`);
  return {
    selector: quickSelector(element),
    role: element.getAttribute("role") || void 0,
    implicitRole: implicitA11yRole(element),
    name,
    nameSources,
    description: element.getAttribute("aria-describedby") || void 0,
    value: element.value !== void 0 && (element.getAttribute("type") || "text") !== "password" ? String(element.value).slice(0, 40) : void 0,
    states,
    level: headingMatch ? parseInt(headingMatch[1], 10) : void 0,
    focusable,
    tabIndex: element.tabIndex,
    ariaAttributes: ariaAttrs,
    issues
  };
}
function implicitA11yRole(element) {
  const tag = element.tagName.toLowerCase();
  switch (tag) {
    case "a":
      return element.getAttribute("href") ? "link" : void 0;
    case "button":
      return "button";
    case "nav":
      return "navigation";
    case "header":
      return "banner";
    case "footer":
      return "contentinfo";
    case "main":
      return "main";
    case "aside":
      return "complementary";
    case "article":
      return "article";
    case "form":
      return "form";
    case "input": {
      const type = element.getAttribute("type") || "text";
      const map = { checkbox: "checkbox", radio: "radio", button: "button", submit: "button", reset: "button", range: "slider", search: "searchbox", email: "textbox", text: "textbox", password: "textbox", tel: "textbox", url: "textbox", number: "spinbutton" };
      return map[type] || "textbox";
    }
    case "select":
      return element.hasAttribute("multiple") ? "listbox" : "combobox";
    case "textarea":
      return "textbox";
    case "img":
      return "img";
    case "table":
      return "table";
    case "ul":
    case "ol":
      return "list";
    case "li":
      return "listitem";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "heading";
    case "dialog":
      return "dialog";
    default:
      return void 0;
  }
}
function quickSelector(el) {
  const id = el.getAttribute("id");
  if (id && /^[a-zA-Z][\w-]*$/.test(id)) return `#${id}`;
  const testid = el.getAttribute("data-testid");
  if (testid) return `${el.tagName.toLowerCase()}[data-testid="${testid}"]`;
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList || []).slice(0, 2);
  if (classes.length) return `${tag}.${classes.join(".")}`;
  return tag;
}
function directTextOf(el) {
  return Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => (n.textContent || "").trim()).join(" ").replace(/\s+/g, " ");
}
function defaultSizesInternal() {
  return [
    { label: "desktop-1440x900", width: 1440, height: 900 },
    { label: "laptop-1024x768", width: 1024, height: 768 },
    { label: "tablet-768x1024", width: 768, height: 1024 },
    { label: "mobile-375x667", width: 375, height: 667 }
  ];
}
class LiveToolsHandler {
  localController;
  bridgeClient;
  constructor(localController, bridgeClient) {
    this.localController = localController || new LiveBrowserController();
    this.bridgeClient = bridgeClient;
  }
  setBridgeClient(client) {
    this.bridgeClient = client;
  }
  getLocalController() {
    return this.localController;
  }
  async handleToolCall(name, args) {
    try {
      switch (name) {
        case "list_tabs":
          return await this.handleListTabs(args);
        case "focus_tab":
          return await this.handleFocusTab(args);
        case "reload_tab":
          return await this.handleReloadTab(args);
        case "close_tab":
          return await this.handleCloseTab(args);
        case "open_tab":
          return await this.handleOpenTab(args);
        case "list_extensions":
          return await this.handleListExtensions(args);
        case "reload_extension":
          return await this.handleReloadExtension(args);
        case "set_extension_enabled":
          return await this.handleSetExtensionEnabled(args);
        case "toggle_extension":
          return await this.handleToggleExtension(args);
        case "execute_pipeline":
          return await this.handleExecutePipeline(args);
        case "compare_extension_states":
          return await this.handleCompareExtensionStates(args);
        case "get_tab_console_logs":
          return await this.handleGetTabConsoleLogs(args);
        case "get_tab_network_requests":
          return await this.handleGetTabNetworkRequests(args);
        case "inspect_live_page":
          return await this.handleInspectLivePage(args);
        case "inspect_live_element":
          return await this.handleInspectLiveElement(args);
        case "get_selected_element":
          return await this.handleGetSelectedElement(args);
        case "start_element_picker":
          return await this.handleStartElementPicker(args);
        case "stop_element_picker":
          return await this.handleStopElementPicker(args);
        case "capture_page_screenshot":
          return await this.handleCapturePageScreenshot(args);
        case "capture_element_screenshot":
          return await this.handleCaptureElementScreenshot(args);
        case "interact_with_element":
          return await this.handleInteractWithElement(args);
        case "start_element_observation":
          return await this.handleStartElementObservation(args);
        case "stop_element_observation":
          return await this.handleStopElementObservation(args);
        case "get_live_dom_snapshot":
          return await this.handleGetLiveDOMSnapshot(args);
        case "get_live_dom_subtree":
          return await this.handleGetLiveDOMSubtree(args);
        case "get_element_visual_state":
          return await this.handleGetElementVisualState(args);
        default:
          return {
            isError: true,
            content: [{ type: "text", text: `Unknown live tool: ${name}` }]
          };
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Live tool execution error in '${name}': ${err.message}` }]
      };
    }
  }
  saveToFile(filePath, data) {
    const resolvedPath = path__default.resolve(filePath);
    const dir = path__default.dirname(resolvedPath);
    if (!fs__default.existsSync(dir)) {
      fs__default.mkdirSync(dir, { recursive: true });
    }
    fs__default.writeFileSync(resolvedPath, data);
    const stats = fs__default.statSync(resolvedPath);
    return {
      saved: true,
      outputPath: resolvedPath.replace(/\\/g, "/"),
      sizeBytes: stats.size
    };
  }
  async dispatch(command, payload) {
    if (this.bridgeClient) {
      try {
        return await this.bridgeClient.sendCommand(command, payload);
      } catch (bridgeErr) {
        const doc2 = typeof document !== "undefined" ? document : void 0;
        const req2 = {
          id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          command,
          timestamp: Date.now(),
          payload
        };
        const res2 = await this.localController.handleCommand(req2, doc2);
        if (res2.success) {
          return res2.data;
        }
        const localCode = res2.error?.code || "LOCAL_COMMAND_FAILED";
        const localMessage = res2.error?.message || "unknown local error";
        const combined = new Error(
          `${bridgeErr.message} | local fallback also failed: [${localCode}] ${localMessage}`
        );
        combined.code = localCode;
        combined.bridgeError = bridgeErr.message;
        throw combined;
      }
    }
    const doc = typeof document !== "undefined" ? document : void 0;
    const req = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      command,
      timestamp: Date.now(),
      payload
    };
    const res = await this.localController.handleCommand(req, doc);
    if (!res.success) {
      throw new Error(res.error?.message || "Browser command failed");
    }
    return res.data;
  }
  // 1. inspect_live_page
  async handleInspectLivePage(args) {
    const data = await this.dispatch("LIVE_PAGE_INSPECT", args);
    if (args.outputPath) {
      const saveInfo = this.saveToFile(args.outputPath, JSON.stringify(data, null, 2));
      return {
        content: [{ type: "text", text: JSON.stringify({ ...saveInfo, ...data }, null, 2) }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 2. inspect_live_element
  async handleInspectLiveElement(args) {
    const target = this.extractTarget(args);
    const data = await this.dispatch("LIVE_ELEMENT_INSPECT", target);
    if (args.outputPath) {
      const saveInfo = this.saveToFile(args.outputPath, JSON.stringify(data, null, 2));
      return {
        content: [{ type: "text", text: JSON.stringify({ ...saveInfo, ...data }, null, 2) }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 3. get_selected_element
  async handleGetSelectedElement(_args) {
    let data = this.localController.getPicker().getLastSelectedElement();
    if (!data) {
      try {
        data = await this.dispatch("GET_SELECTED_ELEMENT");
      } catch {
      }
    }
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                selected: false,
                message: "No element has been selected yet. Use Ctrl + Shift + Click in the browser or call start_element_picker."
              },
              null,
              2
            )
          }
        ]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ selected: true, element: data }, null, 2) }]
    };
  }
  // 4. start_element_picker
  async handleStartElementPicker(args) {
    const data = await this.dispatch("ELEMENT_PICKER_START", args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "PICKER_ACTIVE",
              message: "Visual element picker activated in the browser. Click any element or hold Ctrl+Shift and click.",
              details: data
            },
            null,
            2
          )
        }
      ]
    };
  }
  // 5. stop_element_picker
  async handleStopElementPicker(args) {
    const data = await this.dispatch("ELEMENT_PICKER_STOP", args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "PICKER_INACTIVE",
              message: "Visual element picker stopped.",
              details: data
            },
            null,
            2
          )
        }
      ]
    };
  }
  // 6. capture_page_screenshot
  async handleCapturePageScreenshot(args) {
    const data = await this.dispatch("LIVE_PAGE_SCREENSHOT", args);
    if (args.outputPath && data?.dataUrl) {
      try {
        const parts = data.dataUrl.split(",");
        const base64Data = parts.length > 1 ? parts[1] : parts[0];
        const buffer = Buffer.from(base64Data, "base64");
        const saveInfo = this.saveToFile(args.outputPath, buffer);
        const { dataUrl, ...rest } = data;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...saveInfo,
                  ...rest,
                  message: `Screenshot successfully captured and saved to ${saveInfo.outputPath}`
                },
                null,
                2
              )
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to save screenshot to ${args.outputPath}: ${err.message}` }]
        };
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 7. capture_element_screenshot
  async handleCaptureElementScreenshot(args) {
    const target = this.extractTarget(args);
    const data = await this.dispatch("LIVE_ELEMENT_SCREENSHOT", target);
    if (args.outputPath && data?.dataUrl) {
      try {
        const parts = data.dataUrl.split(",");
        const base64Data = parts.length > 1 ? parts[1] : parts[0];
        const buffer = Buffer.from(base64Data, "base64");
        const saveInfo = this.saveToFile(args.outputPath, buffer);
        const { dataUrl, ...rest } = data;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...saveInfo,
                  ...rest,
                  message: `Element screenshot saved to ${saveInfo.outputPath}`
                },
                null,
                2
              )
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to save element screenshot: ${err.message}` }]
        };
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 8. interact_with_element
  async handleInteractWithElement(args) {
    const target = this.extractTarget(args);
    const action = args.action || "click";
    const payload = {
      action,
      target,
      text: args.text,
      key: args.key,
      optionValue: args.optionValue,
      scrollDelta: args.scrollDelta,
      options: {
        waitForStabilization: args.waitForStabilization !== false,
        stabilizationTimeoutMs: args.stabilizationTimeoutMs || 300,
        captureScreenshots: args.captureScreenshots || false
      }
    };
    const data = await this.dispatch("LIVE_ELEMENT_INTERACT", payload);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 9. start_element_observation
  async handleStartElementObservation(args) {
    const target = this.extractTarget(args);
    const data = await this.dispatch("ELEMENT_OBSERVATION_START", target);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "OBSERVATION_ACTIVE",
              message: "Focused observation started around target element.",
              initialState: data.initialState,
              observationId: data.observationId
            },
            null,
            2
          )
        }
      ]
    };
  }
  // 10. stop_element_observation
  async handleStopElementObservation(args) {
    const data = await this.dispatch("ELEMENT_OBSERVATION_STOP", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 11. get_live_dom_snapshot
  async handleGetLiveDOMSnapshot(args) {
    const data = await this.dispatch("LIVE_DOM_SNAPSHOT", args);
    const htmlContent = typeof data?.html === "string" ? data.html : typeof data === "string" ? data : JSON.stringify(data, null, 2);
    if (args.outputPath) {
      try {
        const saveInfo = this.saveToFile(args.outputPath, htmlContent);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...saveInfo,
                  url: data?.url,
                  title: data?.title,
                  nodeCount: data?.nodeCount,
                  message: `Live DOM snapshot saved to ${saveInfo.outputPath}`
                },
                null,
                2
              )
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to save DOM snapshot to ${args.outputPath}: ${err.message}` }]
        };
      }
    }
    if (typeof data?.html === "string") {
      return { content: [{ type: "text", text: data.html }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
  // 12. get_live_dom_subtree
  async handleGetLiveDOMSubtree(args) {
    const target = this.extractTarget(args);
    const data = await this.dispatch("LIVE_DOM_SUBTREE", target);
    const htmlContent = typeof data?.html === "string" ? data.html : typeof data === "string" ? data : JSON.stringify(data, null, 2);
    if (args.outputPath) {
      try {
        const saveInfo = this.saveToFile(args.outputPath, htmlContent);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...saveInfo,
                  selector: data?.selector,
                  targetNodeId: data?.targetNodeId,
                  message: `Live DOM subtree saved to ${saveInfo.outputPath}`
                },
                null,
                2
              )
            }
          ]
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to save DOM subtree to ${args.outputPath}: ${err.message}` }]
        };
      }
    }
    if (typeof data?.html === "string") {
      return { content: [{ type: "text", text: data.html }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
  // 13. get_element_visual_state
  async handleGetElementVisualState(args) {
    const target = this.extractTarget(args);
    const data = await this.dispatch("GET_ELEMENT_VISUAL_STATE", target);
    if (args.outputPath) {
      const saveInfo = this.saveToFile(args.outputPath, JSON.stringify(data, null, 2));
      return {
        content: [{ type: "text", text: JSON.stringify({ ...saveInfo, ...data }, null, 2) }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 14. list_tabs
  async handleListTabs(args) {
    const data = await this.dispatch("LIST_TABS", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 15. focus_tab
  async handleFocusTab(args) {
    const data = await this.dispatch("FOCUS_TAB", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 16. reload_tab
  async handleReloadTab(args) {
    const data = await this.dispatch("RELOAD_TAB", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 16b. close_tab
  async handleCloseTab(args) {
    const data = await this.dispatch("CLOSE_TAB", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 16c. open_tab
  async handleOpenTab(args) {
    const data = await this.dispatch("OPEN_TAB", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 17. list_extensions
  async handleListExtensions(args) {
    const data = await this.dispatch("LIST_EXTENSIONS", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 18. reload_extension
  async handleReloadExtension(args) {
    const data = await this.dispatch("RELOAD_EXTENSION", args);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 18b. set_extension_enabled
  async handleSetExtensionEnabled(args) {
    const extId = args.extensionId;
    const enabled = Boolean(args.enabled);
    if (!extId) {
      return { isError: true, content: [{ type: "text", text: "extensionId is required" }] };
    }
    const data = await this.dispatch("SET_EXTENSION_ENABLED", { extensionId: extId, enabled });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 18c. toggle_extension
  async handleToggleExtension(args) {
    const extId = args.extensionId;
    if (!extId) {
      return { isError: true, content: [{ type: "text", text: "extensionId is required" }] };
    }
    const data = await this.dispatch("TOGGLE_EXTENSION", { extensionId: extId });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 18d. execute_pipeline
  async handleExecutePipeline(args) {
    const steps = Array.isArray(args.steps) ? args.steps : [];
    if (steps.length === 0) {
      return { isError: true, content: [{ type: "text", text: 'Pipeline must contain at least one step in "steps" array.' }] };
    }
    const startTime = Date.now();
    const results = [];
    let pipelineSuccess = true;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      const action = step.action;
      const params = step.params || {};
      const stopOnError = step.stopOnError !== false;
      try {
        if (action === "wait" || action === "sleep" || action === "delay") {
          const durationMs = Number(params.durationMs || params.delayMs || params.timeoutMs || 1e3);
          await new Promise((resolve) => setTimeout(resolve, durationMs));
          results.push({
            stepIndex: i,
            id: step.id,
            action,
            success: true,
            durationMs: Date.now() - stepStartTime,
            result: { waitedMs: durationMs }
          });
        } else {
          const toolRes = await this.handleToolCall(action, params);
          const durationMs = Date.now() - stepStartTime;
          let parsedResult = null;
          try {
            const firstItem = toolRes.content?.[0];
            if (firstItem && typeof firstItem.text === "string") {
              parsedResult = JSON.parse(firstItem.text);
            }
          } catch {
            const firstItem = toolRes.content?.[0];
            parsedResult = firstItem?.text;
          }
          const isErr = !!toolRes.isError;
          results.push({
            stepIndex: i,
            id: step.id,
            action,
            success: !isErr,
            durationMs,
            result: parsedResult,
            error: isErr ? typeof parsedResult === "string" ? parsedResult : JSON.stringify(parsedResult) : void 0
          });
          if (isErr && stopOnError) {
            pipelineSuccess = false;
            break;
          }
        }
      } catch (stepErr) {
        pipelineSuccess = false;
        results.push({
          stepIndex: i,
          id: step.id,
          action,
          success: false,
          durationMs: Date.now() - stepStartTime,
          error: stepErr.message || String(stepErr)
        });
        if (stopOnError) {
          break;
        }
      }
    }
    const finalSummary = {
      pipelineSuccess,
      totalSteps: steps.length,
      executedSteps: results.length,
      durationMs: Date.now() - startTime,
      steps: results
    };
    if (args.outputPath) {
      try {
        const saveInfo = this.saveToFile(args.outputPath, JSON.stringify(finalSummary, null, 2));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ...saveInfo, ...finalSummary }, null, 2)
            }
          ]
        };
      } catch {
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(finalSummary, null, 2) }]
    };
  }
  // 18e. compare_extension_states
  async handleCompareExtensionStates(args) {
    const extId = args.extensionId;
    if (!extId) {
      return { isError: true, content: [{ type: "text", text: "extensionId is required for compare_extension_states" }] };
    }
    const tabId = args.tabId;
    const waitMs = Number(args.waitDurationMs || 2500);
    const cleanDomPath = args.cleanDomPath;
    const injectedDomPath = args.injectedDomPath;
    const cleanScreenshotPath = args.cleanScreenshotPath;
    const injectedScreenshotPath = args.injectedScreenshotPath;
    const diffOutputPath = args.diffOutputPath;
    await this.dispatch("SET_EXTENSION_ENABLED", { extensionId: extId, enabled: false });
    await this.dispatch("RELOAD_TAB", { tabId, bypassCache: true });
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const cleanDomRes = await this.dispatch("LIVE_DOM_SNAPSHOT", { tabId });
    const cleanHtml = typeof cleanDomRes?.html === "string" ? cleanDomRes.html : JSON.stringify(cleanDomRes);
    if (cleanDomPath) {
      this.saveToFile(cleanDomPath, cleanHtml);
    }
    if (cleanScreenshotPath) {
      const cleanShotRes = await this.dispatch("LIVE_PAGE_SCREENSHOT", { tabId });
      if (cleanShotRes?.dataUrl) {
        const parts = cleanShotRes.dataUrl.split(",");
        const buf = Buffer.from(parts.length > 1 ? parts[1] : parts[0], "base64");
        this.saveToFile(cleanScreenshotPath, buf);
      }
    }
    await this.dispatch("SET_EXTENSION_ENABLED", { extensionId: extId, enabled: true });
    await this.dispatch("RELOAD_TAB", { tabId, bypassCache: true });
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const injectedDomRes = await this.dispatch("LIVE_DOM_SNAPSHOT", { tabId });
    const injectedHtml = typeof injectedDomRes?.html === "string" ? injectedDomRes.html : JSON.stringify(injectedDomRes);
    if (injectedDomPath) {
      this.saveToFile(injectedDomPath, injectedHtml);
    }
    if (injectedScreenshotPath) {
      const injectedShotRes = await this.dispatch("LIVE_PAGE_SCREENSHOT", { tabId });
      if (injectedShotRes?.dataUrl) {
        const parts = injectedShotRes.dataUrl.split(",");
        const buf = Buffer.from(parts.length > 1 ? parts[1] : parts[0], "base64");
        this.saveToFile(injectedScreenshotPath, buf);
      }
    }
    const injectedMarkers = ["annota", "workspace", "shadow-root", "history-tree", "knowledge-hub", "codex"];
    const detectedMarkers = injectedMarkers.filter(
      (m) => injectedHtml.toLowerCase().includes(m) && !cleanHtml.toLowerCase().includes(m)
    );
    const comparisonReport = {
      comparisonSuccess: true,
      extensionId: extId,
      tabId: tabId || "active",
      cleanState: {
        domPath: cleanDomPath,
        screenshotPath: cleanScreenshotPath,
        domLengthChars: cleanHtml.length
      },
      injectedState: {
        domPath: injectedDomPath,
        screenshotPath: injectedScreenshotPath,
        domLengthChars: injectedHtml.length
      },
      analysis: {
        domSizeDifferenceChars: injectedHtml.length - cleanHtml.length,
        injectedMarkersDetected: detectedMarkers,
        summary: `Comparison complete. Clean DOM: ${cleanHtml.length} chars, Injected DOM: ${injectedHtml.length} chars (Delta: ${injectedHtml.length - cleanHtml.length} chars). Detected injected markers: ${detectedMarkers.join(", ") || "none"}.`
      }
    };
    if (diffOutputPath) {
      this.saveToFile(diffOutputPath, JSON.stringify(comparisonReport, null, 2));
    }
    return {
      content: [{ type: "text", text: JSON.stringify(comparisonReport, null, 2) }]
    };
  }
  // 19. get_tab_console_logs
  async handleGetTabConsoleLogs(args) {
    const data = await this.dispatch("GET_TAB_CONSOLE_LOGS", args);
    if (args.outputPath) {
      const saveInfo = this.saveToFile(args.outputPath, JSON.stringify(data, null, 2));
      return {
        content: [{ type: "text", text: JSON.stringify({ ...saveInfo, totalLogs: Array.isArray(data) ? data.length : data?.logs?.length }, null, 2) }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  // 20. get_tab_network_requests
  async handleGetTabNetworkRequests(args) {
    const data = await this.dispatch("GET_TAB_NETWORK_REQUESTS", args);
    if (args.outputPath) {
      const saveInfo = this.saveToFile(args.outputPath, JSON.stringify(data, null, 2));
      return {
        content: [{ type: "text", text: JSON.stringify({ ...saveInfo, totalRequests: Array.isArray(data) ? data.length : data?.requests?.length }, null, 2) }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
  extractTarget(args) {
    let target = {};
    if (args.target) target = { ...args.target };
    else if (args.selector) target = { selector: args.selector };
    else if (typeof args.nodeId === "number") target = { nodeId: args.nodeId };
    else if (args.selectedElementRef) target = { selectedElementRef: args.selectedElementRef };
    else if (args.xpath) target = { xpath: args.xpath };
    else if (args.coordinates) target = { coordinates: args.coordinates };
    else target = { ...args };
    if (typeof args.tabId === "number") {
      target.tabId = args.tabId;
    }
    return target;
  }
}
const PROJECT_SCHEMA_VERSION = "1.0.0";
const PAGE_SCHEMA_VERSION = "1.0.0";
const REGION_SCHEMA_VERSION = "1.0.0";
const RECONSTRUCTION_SPEC_VERSION = "1.0.0";
const AGENT_PACKAGE_VERSION = "1.0.0";
class PageBlueprintGenerator {
  /**
   * §64 — generate a page blueprint from the live document + captured regions.
   */
  generate(doc, pageId, regions) {
    const win = doc.defaultView;
    const sections = [];
    const landmarkSelector = 'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], section, article';
    for (const el of Array.from(doc.querySelectorAll(landmarkSelector)).slice(0, 30)) {
      const rect = el.getBoundingClientRect();
      const visible = !(rect.width === 0 && rect.height === 0);
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role") || landmarkRole(tag);
      const region = regions.find((r) => r.selector && sameElementish(r.selector, el));
      sections.push({
        name: region?.name || `${role || tag}_${sections.length + 1}`,
        tag,
        selector: bestSelectorOf(el),
        role: role || tag,
        regionId: region?.regionId,
        bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        childrenSummary: `${el.children.length} children (${Array.from(el.children).slice(0, 5).map((c) => c.tagName.toLowerCase()).join(", ")})`,
        visible
      });
    }
    const interactiveSelector = 'a[href], button, input, select, textarea, [role="button"], [onclick]';
    const keyInteractive = [];
    for (const el of Array.from(doc.querySelectorAll(interactiveSelector)).slice(0, 120)) {
      const info = el;
      if (info.getAttribute("type") === "hidden") continue;
      const text = directText(info).slice(0, 30) || info.getAttribute("aria-label")?.slice(0, 30) || info.getAttribute("placeholder")?.slice(0, 30) || "";
      if (!text) continue;
      const section = sections.find((s) => s.selector && info.closest(s.selector));
      keyInteractive.push({
        selector: bestSelectorOf(info),
        role: info.getAttribute("role") || info.tagName.toLowerCase(),
        text,
        section: section?.name || "unassigned"
      });
    }
    const repeated = [];
    for (const container of Array.from(doc.querySelectorAll('ul, ol, [class*="list"], [class*="grid"], [class*="cards"], [class*="items"], main, section')).slice(0, 40)) {
      const children = Array.from(container.children);
      if (children.length < 3) continue;
      const signature = (el) => `${el.tagName.toLowerCase()}|${Array.from(el.children).map((c) => c.tagName.toLowerCase()).sort().join(".")}|${el.className?.toString().slice(0, 40)}`;
      const groups = /* @__PURE__ */ new Map();
      for (const child of children) {
        const sig = signature(child);
        groups.set(sig, [...groups.get(sig) || [], child]);
      }
      for (const [sig, group] of groups) {
        if (group.length >= 3) {
          repeated.push({
            pattern: sig.slice(0, 80),
            occurrences: group.length,
            sampleSelector: bestSelectorOf(group[0]),
            containerSelector: bestSelectorOf(container)
          });
        }
      }
    }
    const layoutRelationships = [];
    const bodyCS = win?.getComputedStyle ? win.getComputedStyle(doc.body) : null;
    if (bodyCS) {
      if (bodyCS.display === "flex" || bodyCS.display.includes("grid")) {
        layoutRelationships.push(`body uses ${bodyCS.display}`);
      }
    }
    const mainSection = sections.find((s) => s.role === "main" || s.tag === "main");
    const asideSection = sections.find((s) => s.role === "complementary" || s.tag === "aside");
    if (mainSection && asideSection) {
      layoutRelationships.push(`content+sidebar layout: main at x=${mainSection.bounds.x}, sidebar at x=${asideSection.bounds.x} (${asideSection.bounds.x < mainSection.bounds.x ? "left" : "right"} sidebar)`);
    }
    if (sections.length) {
      layoutRelationships.push(`${sections.length} major sections stacked in document order`);
    }
    const hierarchy = {
      node: "page",
      label: doc.title || "page",
      children: sections.map((s) => ({ node: s.selector, label: s.name, children: [] }))
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
      semanticRegions: Array.from(new Set(sections.map((s) => s.role)))
    };
  }
}
class ReconstructionSpecGenerator {
  /**
   * §31 — build the canonical reconstruction spec.
   */
  generate(input) {
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
        tool: "MCPDOM Browser"
      },
      viewport: input.viewport,
      structure: {
        domSnapshotFile: input.domSnapshotFile,
        domHash: stableHash(`${input.url}|${input.domLength}`),
        nodeCount: input.domLength
      },
      regions: regions.map((r) => ({
        regionId: r.regionId,
        name: r.name,
        selector: r.selector,
        selectorCandidates: r.selectorCandidates.map((c) => ({ ...c, reasons: c.reasons || [] })),
        domFile: r.domFile,
        reconstructionRole: r.role || r.tag
      })),
      hierarchy: input.hierarchy,
      semanticRoles: regions.map((r) => ({ regionId: r.regionId, role: r.role || r.tag })),
      visualConstraints: regions.flatMap(
        (r) => Object.entries(r.relevantStyles).slice(0, 5).map(([k, v]) => ({ regionId: r.regionId, constraint: k, value: String(v).slice(0, 60) }))
      ),
      interactions: regions.map((r) => ({
        regionId: r.regionId,
        interactive: r.interactive,
        action: r.interactive ? interactiveActionFor(r.tag, r.role) : "none"
      })),
      selectors: regions.map((r) => ({
        regionId: r.regionId,
        primary: r.selector,
        fallbacks: r.selectorCandidates.filter((c) => c.selector !== r.selector).slice(0, 4).map((c) => c.selector)
      })),
      content: regions.map((r) => ({ regionId: r.regionId, text: r.ownText.slice(0, 200) })),
      styles: regions.map((r) => ({ regionId: r.regionId, relevantStyles: r.relevantStyles })),
      annotations: regions.map((r) => ({ regionId: r.regionId, userComment: r.userComment, intendedChange: r.intendedChange })),
      expectedModifications: regions.filter((r) => r.intendedChange).map((r) => ({ regionId: r.regionId, statement: r.intendedChange })),
      verificationRules: regions.filter((r) => r.verification?.length).map((r) => ({ regionId: r.regionId, conditions: r.verification })),
      migration: {
        fromVersion: RECONSTRUCTION_SPEC_VERSION,
        notes: "Initial schema. Future breaking changes MUST bump schemaVersion and provide a migration entry here."
      }
    };
  }
}
function landmarkRole(tag) {
  const map = {
    header: "banner",
    nav: "navigation",
    main: "main",
    aside: "complementary",
    footer: "contentinfo",
    section: "region",
    article: "article",
    form: "form"
  };
  return map[tag];
}
function interactiveActionFor(tag, role) {
  const r = (role || "").toLowerCase();
  if (r === "button" || tag === "button") return "click";
  if (r === "link" || tag === "a") return "navigate";
  if (tag === "input" || tag === "textarea") return "type";
  if (tag === "select") return "select-option";
  if (r === "checkbox") return "toggle";
  if (r === "radio") return "select";
  return "click";
}
function bestSelectorOf(el) {
  try {
    const id = el.getAttribute("id");
    if (id && /^[a-zA-Z][\w-]*$/.test(id)) return `#${id}`;
    const testid = el.getAttribute("data-testid");
    if (testid) return `${el.tagName.toLowerCase()}[data-testid="${testid}"]`;
    const tag = el.tagName.toLowerCase();
    const cls = Array.from(el.classList || [])[0];
    if (cls) return `${tag}.${cls}`;
    return tag;
  } catch {
    return el.tagName.toLowerCase();
  }
}
function sameElementish(selector, el) {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
}
const reconstructionSpec = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PageBlueprintGenerator,
  ReconstructionSpecGenerator
}, Symbol.toStringTag, { value: "Module" }));
class ProjectManager {
  constructor(baseDir = ".mcpdom_projects") {
    this.baseDir = baseDir;
    fs__default.mkdirSync(this.baseDir, { recursive: true });
  }
  naming = new NamingEngine();
  qualityScorer = new RegionQualityScorer();
  graphBuilder = new RegionRelationshipGraphBuilder();
  blueprintGenerator = new PageBlueprintGenerator();
  specGenerator = new ReconstructionSpecGenerator();
  redaction = new RedactionEngine();
  regionCounter = 0;
  // ------------------------------------------------------------------
  // Project lifecycle
  // ------------------------------------------------------------------
  createProject(options) {
    const safeName = this.sanitizeName(options.name);
    const projectDir = path__default.join(this.baseDir, safeName);
    if (fs__default.existsSync(projectDir)) {
      throw new Error(`PROJECT_EXISTS: a project named "${safeName}" already exists at ${projectDir}. Choose another name or use capturePageRegion on the existing project.`);
    }
    for (const sub of ["regions", "screenshots", "dom", "commands", "diffs", "metadata", "instructions"]) {
      fs__default.mkdirSync(path__default.join(projectDir, sub), { recursive: true });
    }
    const projectId = `proj_${Date.now().toString(36)}`;
    const pageId = `page_${Date.now().toString(36)}`;
    const domFile = path__default.join("dom", `page_${pageId}.html`);
    fs__default.writeFileSync(path__default.join(projectDir, domFile), options.domHtml, "utf-8");
    const manifest = {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      projectId,
      name: safeName,
      description: options.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pages: [pageId],
      regionCount: 0,
      commandRecordingCount: 0,
      tags: [],
      toolVersion: "3.0.0"
    };
    fs__default.writeFileSync(path__default.join(projectDir, "project.json"), JSON.stringify(manifest, null, 2));
    const pageManifest = {
      schemaVersion: PAGE_SCHEMA_VERSION,
      pageId,
      projectId,
      url: options.url,
      title: options.title,
      capturedAt: Date.now(),
      viewport: options.viewport,
      domSnapshotFile: domFile,
      regions: [],
      browserState: {
        extensionEnabled: options.extensionEnabled,
        readyState: options.readyState,
        visibilityState: "visible"
      }
    };
    fs__default.writeFileSync(path__default.join(projectDir, "page.json"), JSON.stringify(pageManifest, null, 2));
    fs__default.writeFileSync(
      path__default.join(projectDir, "instructions", "README.md"),
      this.instructionsMarkdown(safeName, options.url, options.title),
      "utf-8"
    );
    return manifest;
  }
  listProjects() {
    const out = [];
    if (!fs__default.existsSync(this.baseDir)) return out;
    for (const entry of fs__default.readdirSync(this.baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path__default.join(this.baseDir, entry.name, "project.json");
      if (!fs__default.existsSync(manifestPath)) continue;
      try {
        const manifest = JSON.parse(fs__default.readFileSync(manifestPath, "utf-8"));
        out.push({ ...manifest, projectDir: path__default.join(this.baseDir, entry.name), pageCount: manifest.pages?.length || 0 });
      } catch {
      }
    }
    return out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  getProject(name) {
    const safeName = this.sanitizeName(name);
    const projectDir = path__default.join(this.baseDir, safeName);
    const manifestPath = path__default.join(projectDir, "project.json");
    if (!fs__default.existsSync(manifestPath)) return null;
    const manifest = JSON.parse(fs__default.readFileSync(manifestPath, "utf-8"));
    const pagePath = path__default.join(projectDir, "page.json");
    const page = fs__default.existsSync(pagePath) ? JSON.parse(fs__default.readFileSync(pagePath, "utf-8")) : null;
    const regions = this.loadRegions(projectDir, page);
    return { manifest, page, regions, projectDir };
  }
  deleteProject(name) {
    const safeName = this.sanitizeName(name);
    const projectDir = path__default.join(this.baseDir, safeName);
    if (!fs__default.existsSync(projectDir)) return false;
    fs__default.rmSync(projectDir, { recursive: true, force: true });
    return true;
  }
  // ------------------------------------------------------------------
  // Region capture + annotation (§26/§27/§33/§61)
  // ------------------------------------------------------------------
  captureRegion(projectName, capture, user, elementMeta, intendedChange, verification) {
    const project = this.getProject(projectName);
    if (!project) {
      throw new Error(`PROJECT_NOT_FOUND: "${projectName}". Create it first with create_page_project.`);
    }
    const { manifest, page, projectDir } = project;
    this.regionCounter++;
    const regionId = `region_${Date.now().toString(36)}_${this.regionCounter}`;
    const cleanRegionHtml = this.redaction.redactValue(capture.regionHtml);
    const cleanContextHtml = this.redaction.redactValue(capture.contextHtml);
    const domFile = path__default.join("dom", `region_${regionId}.html`);
    const contextDomFile = path__default.join("dom", `region_${regionId}_context.html`);
    fs__default.writeFileSync(path__default.join(projectDir, domFile), cleanRegionHtml, "utf-8");
    fs__default.writeFileSync(path__default.join(projectDir, contextDomFile), cleanContextHtml, "utf-8");
    let screenshotFile;
    if (elementMeta.screenshotDataUrl) {
      const ext = elementMeta.screenshotDataUrl.startsWith("data:image/png") ? "png" : "jpeg";
      screenshotFile = path__default.join("screenshots", `region_${regionId}.${ext}`);
      fs__default.writeFileSync(
        path__default.join(projectDir, screenshotFile),
        Buffer.from(elementMeta.screenshotDataUrl.split(",")[1] || "", "base64")
      );
    }
    const naming = capture.nameHint || { name: `region_${this.regionCounter}`, evidence: [] };
    const quality = this.qualityScorer.score({
      selectorCandidates: capture.selectorCandidates,
      fingerprintVolatility: elementMeta.fingerprintVolatility,
      volatilityReasons: elementMeta.volatilityReasons,
      hasScreenshot: Boolean(screenshotFile),
      hasHtmlSnapshot: true,
      hasContext: true,
      userAnnotationFilled: Boolean(user.description || user.comment),
      hasIntendedChange: Boolean(intendedChange),
      hasVerification: Boolean(verification?.length)
    });
    const annotation = {
      observed: {
        schemaVersion: REGION_SCHEMA_VERSION,
        regionId,
        pageId: page.pageId,
        name: user.name || naming.name,
        autoName: naming.name,
        tag: elementMeta.tag,
        role: elementMeta.role,
        selector: capture.bestSelector,
        selectorCandidates: capture.selectorCandidates,
        xpath: capture.xpath,
        structuralFingerprint: capture.fingerprintHash,
        domFile,
        contextDomFile,
        dimensions: capture.dimensions,
        position: capture.position,
        relevantStyles: capture.relevantStyles,
        parentSelector: capture.parentInfo?.selector,
        parentInfo: capture.parentInfo,
        childrenCount: capture.childrenCount,
        childTags: capture.childTags,
        screenshotFile,
        htmlSnapshotFile: domFile,
        capturedAt: Date.now(),
        sourceUrl: elementMeta.sourceUrl,
        pageTitle: elementMeta.pageTitle,
        viewport: page.viewport,
        extensionState: elementMeta.extensionEnabled
      },
      user: { ...user, tags: user.tags || [] },
      intendedChange: intendedChange ? { statement: intendedChange, recordedAt: Date.now() } : void 0,
      verification: verification?.length ? { conditions: verification, recordedAt: Date.now() } : void 0,
      analysis: {
        qualityScore: quality,
        namingEvidence: naming.evidence,
        relatedRegions: [],
        capturedBy: elementMeta.capturedBy || "tool_call"
      }
    };
    const regionFile = path__default.join("regions", `${regionId}.json`);
    fs__default.writeFileSync(path__default.join(projectDir, regionFile), JSON.stringify(annotation, null, 2));
    page.regions.push(regionId);
    fs__default.writeFileSync(path__default.join(projectDir, "page.json"), JSON.stringify(page, null, 2));
    manifest.regionCount = page.regions.length;
    manifest.updatedAt = Date.now();
    fs__default.writeFileSync(path__default.join(projectDir, "project.json"), JSON.stringify(manifest, null, 2));
    return annotation;
  }
  updateRegion(projectName, regionId, updates) {
    const project = this.getProject(projectName);
    if (!project) return null;
    const region = project.regions.find((r) => r.observed.regionId === regionId);
    if (!region) return null;
    if (updates.name !== void 0) region.user.name = updates.name;
    if (updates.description !== void 0) region.user.description = updates.description;
    if (updates.comment !== void 0) region.user.comment = updates.comment;
    if (updates.tags !== void 0) region.user.tags = updates.tags;
    if (updates.behavioralNotes !== void 0) region.user.behavioralNotes = updates.behavioralNotes;
    if (updates.visualNotes !== void 0) region.user.visualNotes = updates.visualNotes;
    if (updates.intendedChange !== void 0) {
      region.intendedChange = { statement: updates.intendedChange, recordedAt: Date.now() };
    }
    if (updates.verification !== void 0) {
      region.verification = { conditions: updates.verification, recordedAt: Date.now() };
    }
    region.analysis.qualityScore = this.qualityScorer.score({
      selectorCandidates: region.observed.selectorCandidates,
      fingerprintVolatility: "medium",
      volatilityReasons: [],
      hasScreenshot: Boolean(region.observed.screenshotFile),
      hasHtmlSnapshot: true,
      hasContext: true,
      userAnnotationFilled: Boolean(region.user.description || region.user.comment),
      hasIntendedChange: Boolean(region.intendedChange),
      hasVerification: Boolean(region.verification)
    });
    fs__default.writeFileSync(
      path__default.join(project.projectDir, "regions", `${regionId}.json`),
      JSON.stringify(region, null, 2)
    );
    return region;
  }
  deleteRegion(projectName, regionId) {
    const project = this.getProject(projectName);
    if (!project) return false;
    const regionPath = path__default.join(project.projectDir, "regions", `${regionId}.json`);
    if (!fs__default.existsSync(regionPath)) return false;
    fs__default.rmSync(regionPath);
    project.page.regions = project.page.regions.filter((r) => r !== regionId);
    fs__default.writeFileSync(path__default.join(project.projectDir, "page.json"), JSON.stringify(project.page, null, 2));
    project.manifest.regionCount = project.page.regions.length;
    project.manifest.updatedAt = Date.now();
    fs__default.writeFileSync(path__default.join(project.projectDir, "project.json"), JSON.stringify(project.manifest, null, 2));
    return true;
  }
  // ------------------------------------------------------------------
  // Blueprint + relationship graph + reconstruction spec
  // ------------------------------------------------------------------
  buildRegionGraph(projectName, doc) {
    const project = this.getProject(projectName);
    if (!project) throw new Error(`PROJECT_NOT_FOUND: ${projectName}`);
    const regions = project.regions.map((r) => ({
      regionId: r.observed.regionId,
      name: r.observed.name,
      tag: r.observed.tag,
      role: r.observed.role,
      selector: r.observed.selector,
      element: doc ? this.tryResolve(doc, r.observed.selector) : void 0
    }));
    return this.graphBuilder.build(project.page.pageId, regions);
  }
  generateBlueprint(projectName, doc) {
    const project = this.getProject(projectName);
    if (!project) throw new Error(`PROJECT_NOT_FOUND: ${projectName}`);
    const regions = project.regions.map((r) => ({
      regionId: r.observed.regionId,
      name: r.observed.name,
      selector: r.observed.selector,
      tag: r.observed.tag,
      role: r.observed.role,
      element: this.tryResolve(doc, r.observed.selector)
    }));
    const blueprint = this.blueprintGenerator.generate(doc, project.page.pageId, regions);
    fs__default.writeFileSync(
      path__default.join(project.projectDir, "metadata", "blueprint.json"),
      JSON.stringify(blueprint, null, 2)
    );
    return blueprint;
  }
  generateReconstructionSpec(projectName, domLength) {
    const project = this.getProject(projectName);
    if (!project) throw new Error(`PROJECT_NOT_FOUND: ${projectName}`);
    const graph = this.buildRegionGraph(projectName);
    const spec = this.specGenerator.generate({
      pageId: project.page.pageId,
      projectId: project.manifest.projectId,
      url: project.page.url,
      title: project.page.title,
      capturedAt: project.page.capturedAt,
      viewport: project.page.viewport,
      domSnapshotFile: project.page.domSnapshotFile || "dom/page.html",
      domLength,
      hierarchy: graph,
      regions: project.regions.map((r) => ({
        regionId: r.observed.regionId,
        name: r.observed.name,
        tag: r.observed.tag,
        role: r.observed.role,
        selector: r.observed.selector,
        selectorCandidates: r.observed.selectorCandidates,
        domFile: r.observed.domFile,
        contextDomFile: r.observed.contextDomFile,
        relevantStyles: r.observed.relevantStyles,
        userComment: r.user.comment,
        intendedChange: r.intendedChange?.statement,
        verification: r.verification?.conditions,
        interactive: ["a", "button", "input", "select", "textarea"].includes(r.observed.tag),
        ownText: r.observed.name
      }))
    });
    fs__default.writeFileSync(
      path__default.join(project.projectDir, "metadata", "reconstruction-spec.json"),
      JSON.stringify(spec, null, 2)
    );
    return spec;
  }
  // ------------------------------------------------------------------
  // Mutation diffs + command recordings storage
  // ------------------------------------------------------------------
  saveDiff(projectName, label, diff) {
    const project = this.getProject(projectName);
    if (!project) throw new Error(`PROJECT_NOT_FOUND: ${projectName}`);
    const file = path__default.join("diffs", `diff_${Date.now().toString(36)}.json`);
    fs__default.writeFileSync(path__default.join(project.projectDir, file), JSON.stringify({ label, timestamp: Date.now(), diff }, null, 2));
    return file;
  }
  saveCommandRecording(projectName, recording) {
    const project = this.getProject(projectName);
    if (!project) throw new Error(`PROJECT_NOT_FOUND: ${projectName}`);
    const file = path__default.join("commands", `recording_${recording.recordingId || Date.now().toString(36)}.json`);
    fs__default.writeFileSync(path__default.join(project.projectDir, file), JSON.stringify(recording, null, 2));
    const manifest = project.manifest;
    manifest.commandRecordingCount = (manifest.commandRecordingCount || 0) + 1;
    manifest.updatedAt = Date.now();
    fs__default.writeFileSync(path__default.join(project.projectDir, "project.json"), JSON.stringify(manifest, null, 2));
    return file;
  }
  fingerprintEngine() {
    return new DOMFingerprintEngine();
  }
  // ------------------------------------------------------------------
  loadRegions(projectDir, page) {
    if (!page?.regions?.length) return [];
    const out = [];
    for (const regionId of page.regions) {
      const p = path__default.join(projectDir, "regions", `${regionId}.json`);
      if (fs__default.existsSync(p)) {
        try {
          out.push(JSON.parse(fs__default.readFileSync(p, "utf-8")));
        } catch {
        }
      }
    }
    return out;
  }
  tryResolve(doc, selector) {
    try {
      return doc.querySelector(selector) || void 0;
    } catch {
      return void 0;
    }
  }
  sanitizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled-project";
  }
  instructionsMarkdown(name, url, title) {
    return `# Project: ${name}

> Captured by MCPDOM Browser — Agent-readable page analysis project.

- **Page**: ${title}
- **URL**: ${url}
- **Captured at**: ${(/* @__PURE__ */ new Date()).toISOString()}

## Layout

| Path | Contents |
|------|----------|
| \`project.json\` | Project manifest (schema ${PROJECT_SCHEMA_VERSION}) |
| \`page.json\` | Page manifest: URL, viewport, region list |
| \`regions/*.json\` | Annotated regions: OBSERVED / USER / INTENDED CHANGE / VERIFICATION |
| \`dom/*.html\` | Cleaned DOM snapshots (MCPDOM artifacts removed, secrets redacted) |
| \`screenshots/*\` | Region screenshots (PNG/JPEG) |
| \`commands/*.json\` | Command recordings (replayable) |
| \`diffs/*.json\` | DOM diff artifacts |
| \`metadata/blueprint.json\` | Page blueprint: sections, hierarchy, interactive inventory |
| \`metadata/reconstruction-spec.json\` | Canonical reconstruction specification |
| \`instructions/\` | Agent-facing documentation |

## Reading order for an agent

1. \`project.json\` → understand scope
2. \`metadata/blueprint.json\` → page architecture
3. \`regions/*.json\` → what matters and why (observed facts vs user requests)
4. \`metadata/reconstruction-spec.json\` → selectors, constraints, verification rules

## Semantics guarantee

Region annotations strictly separate:
- **OBSERVED** — facts captured by the platform (never hand-edited)
- **USER** — human comments, names, tags
- **INTENDED CHANGE** — what the user wants done
- **VERIFICATION** — conditions that define success

Never conflate these categories when consuming or extending this package.
`;
  }
}
class AgentPackageExporter {
  constructor(projects) {
    this.projects = projects;
  }
  export(projectName, outputDir) {
    const project = this.projects.getProject(projectName);
    if (!project) {
      throw new Error(`PROJECT_NOT_FOUND: "${projectName}"`);
    }
    const { manifest, page, regions, projectDir } = project;
    const target = outputDir || path__default.join("mcpdom_agent_packages", manifest.name);
    fs__default.mkdirSync(target, { recursive: true });
    for (const sub of ["pages", "regions", "snapshots", "diffs", "commands", "assets", "schemas", "verification"]) {
      fs__default.mkdirSync(path__default.join(target, sub), { recursive: true });
    }
    const files = [];
    fs__default.writeFileSync(path__default.join(target, "project.json"), JSON.stringify({ ...manifest, packageVersion: AGENT_PACKAGE_VERSION }, null, 2));
    files.push("project.json");
    fs__default.writeFileSync(path__default.join(target, "pages", "page.json"), JSON.stringify(page, null, 2));
    files.push("pages/page.json");
    if (page.domSnapshotFile && fs__default.existsSync(path__default.join(projectDir, page.domSnapshotFile))) {
      fs__default.copyFileSync(path__default.join(projectDir, page.domSnapshotFile), path__default.join(target, "pages", "page-snapshot.html"));
      files.push("pages/page-snapshot.html");
    }
    for (const region of regions) {
      const regionFile = path__default.join(target, "regions", `${region.observed.regionId}.json`);
      fs__default.writeFileSync(regionFile, JSON.stringify(region, null, 2));
      files.push(path__default.join("regions", `${region.observed.regionId}.json`));
      for (const domFile of [region.observed.domFile, region.observed.contextDomFile]) {
        if (domFile && fs__default.existsSync(path__default.join(projectDir, domFile))) {
          const dest = path__default.join(target, "regions", path__default.basename(domFile));
          fs__default.copyFileSync(path__default.join(projectDir, domFile), dest);
          files.push(path__default.join("regions", path__default.basename(domFile)));
        }
      }
      if (region.observed.screenshotFile && fs__default.existsSync(path__default.join(projectDir, region.observed.screenshotFile))) {
        fs__default.copyFileSync(path__default.join(projectDir, region.observed.screenshotFile), path__default.join(target, "assets", path__default.basename(region.observed.screenshotFile)));
        files.push(path__default.join("assets", path__default.basename(region.observed.screenshotFile)));
      }
    }
    let diffCount = 0;
    const diffsDir = path__default.join(projectDir, "diffs");
    if (fs__default.existsSync(diffsDir)) {
      for (const f of fs__default.readdirSync(diffsDir)) {
        fs__default.copyFileSync(path__default.join(diffsDir, f), path__default.join(target, "diffs", f));
        files.push(path__default.join("diffs", f));
        diffCount++;
      }
    }
    let commandCount = 0;
    const commandsDir = path__default.join(projectDir, "commands");
    if (fs__default.existsSync(commandsDir)) {
      for (const f of fs__default.readdirSync(commandsDir)) {
        fs__default.copyFileSync(path__default.join(commandsDir, f), path__default.join(target, "commands", f));
        files.push(path__default.join("commands", f));
        commandCount++;
      }
    }
    fs__default.writeFileSync(
      path__default.join(target, "schemas", "region-annotation.schema.json"),
      JSON.stringify(
        {
          $schema: "http://json-schema.org/draft-07/schema#",
          title: "MCPDOM RegionAnnotation",
          type: "object",
          required: ["observed", "user", "analysis"],
          properties: {
            observed: {
              type: "object",
              description: "OBSERVED FACTS — captured by the platform, never hand-edited",
              required: ["regionId", "name", "selector", "domFile"],
              properties: {
                regionId: { type: "string" },
                name: { type: "string" },
                autoName: { type: "string" },
                tag: { type: "string" },
                role: { type: "string" },
                selector: { type: "string" },
                selectorCandidates: { type: "array", items: { type: "object" } },
                xpath: { type: "string" },
                structuralFingerprint: { type: "string" },
                domFile: { type: "string" },
                contextDomFile: { type: "string" },
                dimensions: { type: "object" },
                position: { type: "object" },
                relevantStyles: { type: "object" },
                capturedAt: { type: "number" },
                sourceUrl: { type: "string" }
              }
            },
            user: {
              type: "object",
              description: "USER REQUESTS — human comments, names, tags",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                comment: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                behavioralNotes: { type: "string" },
                visualNotes: { type: "string" }
              }
            },
            intendedChange: { type: "object", description: "EXPECTED CHANGES — what the user wants done" },
            verification: { type: "object", description: "VERIFICATION CONDITIONS — how success is checked" },
            analysis: { type: "object", description: "AUTOMATIC ANALYSIS — quality, naming evidence" }
          }
        },
        null,
        2
      )
    );
    files.push("schemas/region-annotation.schema.json");
    const verificationRows = regions.filter((r) => r.verification?.conditions?.length || r.intendedChange).map((r) => ({
      regionId: r.observed.regionId,
      region: r.observed.name,
      selector: r.observed.selector,
      intendedChange: r.intendedChange?.statement || null,
      verificationConditions: r.verification?.conditions || []
    }));
    fs__default.writeFileSync(
      path__default.join(target, "verification", "verification-matrix.json"),
      JSON.stringify({ generatedAt: Date.now(), rows: verificationRows }, null, 2)
    );
    files.push("verification/verification-matrix.json");
    fs__default.writeFileSync(
      path__default.join(target, "snapshots", "capture-context.json"),
      JSON.stringify(
        {
          url: page.url,
          title: page.title,
          capturedAt: page.capturedAt,
          viewport: page.viewport,
          browserState: page.browserState
        },
        null,
        2
      )
    );
    files.push("snapshots/capture-context.json");
    fs__default.writeFileSync(path__default.join(target, "README.md"), this.readmeMarkdown(manifest.name, page.url, regions.length, diffCount, commandCount));
    files.push("README.md");
    fs__default.writeFileSync(path__default.join(target, "PROJECT.md"), this.projectMarkdown(projectName, regions));
    files.push("PROJECT.md");
    fs__default.writeFileSync(path__default.join(target, "agent-instructions.md"), this.agentInstructionsMarkdown(projectName, regions));
    files.push("agent-instructions.md");
    let bytes = 0;
    for (const f of files) {
      try {
        bytes += fs__default.statSync(path__default.join(target, f)).size;
      } catch {
      }
    }
    return {
      packageDir: path__default.resolve(target),
      files,
      summary: { regions: regions.length, commands: commandCount, diffs: diffCount, bytes }
    };
  }
  readmeMarkdown(name, url, regionCount, diffCount, commandCount) {
    return `# MCPDOM Agent Package — ${name}

> Self-contained page analysis + reconstruction specification exported by MCPDOM Browser v3.

## What this is

This package captures the structure, semantics and user intent of a live web page
so that ANOTHER AI agent can understand it and act on it — WITHOUT the original
MCPDOM application or browser session.

- **Analyzed page**: ${url}
- **Annotated regions**: ${regionCount}
- **DOM diff artifacts**: ${diffCount}
- **Command recordings**: ${commandCount}

## Package layout

\`\`\`
├── README.md                  ← you are here
├── PROJECT.md                 ← human-oriented project summary
├── agent-instructions.md      ← workflow-oriented agent instructions
├── project.json               ← machine-readable project manifest
├── pages/                     ← page manifest + clean DOM snapshot
├── regions/                   ← region annotations + region DOM + context DOM
├── snapshots/                 ← capture context (URL, viewport, browser state)
├── diffs/                     ← DOM diff artifacts
├── commands/                  ← replayable command recordings
├── assets/                    ← region screenshots
├── schemas/                   ← portable JSON schemas
└── verification/              ← verification matrix (conditions per region)
\`\`\`

## Core semantics

Every region annotation strictly separates:

| Category | Meaning | Source |
|----------|---------|--------|
| **OBSERVED** | Facts about the DOM | Platform capture — never hand-edited |
| **USER** | Names, comments, tags | The human analyst |
| **INTENDED CHANGE** | What should change | The human analyst |
| **VERIFICATION** | How success is measured | The human analyst |

Never conflate these categories when consuming or extending this package.

## Quick start for an agent

1. Read \`project.json\` for scope.
2. Read \`PROJECT.md\` for the human summary.
3. Read \`agent-instructions.md\` for the workflow.
4. Load region annotations from \`regions/*.json\` (each references DOM files).
5. Use \`verification/verification-matrix.json\` to know what "done" means.
`;
  }
  projectMarkdown(projectName, regions) {
    const lines = [];
    lines.push(`# Project: ${projectName}`);
    lines.push("");
    lines.push("## Captured regions");
    lines.push("");
    lines.push("| Region | Selector | Role | Quality | Intended change |");
    lines.push("|--------|----------|------|---------|-----------------|");
    for (const r of regions) {
      lines.push(
        `| ${r.observed.name} | \`${r.observed.selector}\` | ${r.observed.role || r.observed.tag} | ${r.analysis?.qualityScore?.grade || "n/a"} (${r.analysis?.qualityScore?.overall ?? "n/a"}) | ${r.intendedChange?.statement || "—"} |`
      );
    }
    lines.push("");
    lines.push("## Region notes");
    for (const r of regions) {
      if (r.user.comment || r.user.behavioralNotes || r.user.visualNotes) {
        lines.push(`### ${r.observed.name}`);
        if (r.user.comment) lines.push(`- **Comment**: ${r.user.comment}`);
        if (r.user.description) lines.push(`- **Description**: ${r.user.description}`);
        if (r.user.behavioralNotes) lines.push(`- **Behavioral notes**: ${r.user.behavioralNotes}`);
        if (r.user.visualNotes) lines.push(`- **Visual notes**: ${r.user.visualNotes}`);
        if (r.verification?.conditions?.length) lines.push(`- **Verification**: ${r.verification.conditions.join("; ")}`);
        lines.push("");
      }
    }
    return lines.join("\n");
  }
  agentInstructionsMarkdown(projectName, regions) {
    const lines = [];
    lines.push("# Agent Instructions");
    lines.push("");
    lines.push(`This package was exported from MCPDOM Browser for project **${projectName}**.`);
    lines.push("");
    lines.push("## Recommended workflow");
    lines.push("");
    lines.push("1. **Orient**: read `pages/page.json` (URL, viewport, browser state) and the page DOM snapshot in `pages/page-snapshot.html`.");
    lines.push("2. **Map the regions**: every file in `regions/*.json` is one captured region with:");
    lines.push("   - `observed`: facts — selector candidates (ranked with confidence), xpath, fingerprint, DOM files, dimensions, styles");
    lines.push("   - `user`: the analyst's names, comments, tags");
    lines.push("   - `intendedChange`: what the analyst wants done (if recorded)");
    lines.push("   - `verification`: conditions that define success (if recorded)");
    lines.push("3. **Target elements**: use `observed.selectorCandidates` in ranked order — they are ranked by confidence with fallback chains. Prefer unique, high-confidence candidates.");
    lines.push("4. **Modify**: when changing DOM, preserve the verification conditions. The DOM files under `regions/` show the exact captured state (MCPDOM artifacts removed, secrets redacted).");
    lines.push("5. **Verify**: check `verification/verification-matrix.json` — every row lists the success conditions per region.");
    lines.push("6. **Replay if needed**: `commands/*.json` are deterministic command recordings (tool name + arguments per step).");
    lines.push("");
    lines.push("## Fingerprint & selector semantics");
    lines.push("");
    lines.push("- `structuralFingerprint`: stable hash over tag hierarchy, stable attributes, classes, role, dimensions. Two elements with identical fingerprints are almost certainly the same logical element.");
    lines.push("- `selectorCandidates[].confidence` ∈ [0,1]: 1.0 = unique stable id; 0.92 = semantic attribute; 0.72 = classes; 0.55 = structural path; 0.6 = text xpath.");
    lines.push("- `xpath` uses ids where available, otherwise positional segments.");
    lines.push("");
    lines.push("## Honesty guarantees");
    lines.push("");
    lines.push("- OBSERVED data was captured automatically — it reflects the page at capture time.");
    lines.push("- Secrets and sensitive values are REDACTED in stored DOM (`[REDACTED]`).");
    lines.push("- MCPDOM's own injected UI is EXCLUDED from all captured DOM.");
    lines.push("- If a capability was unavailable at capture time (e.g. cross-origin frame access), the region notes say so explicitly rather than omitting silently.");
    if (regions.length) {
      lines.push("");
      lines.push("## Region index");
      for (const r of regions) {
        lines.push(`- \`${r.observed.regionId}\` — ${r.observed.name} (${r.observed.tag}${r.observed.role ? `, role=${r.observed.role}` : ""})`);
      }
    }
    return lines.join("\n");
  }
}
const RECORDING_SCHEMA_VERSION = "1.0.0";
class CommandRecordingStorage {
  baseDir;
  constructor(baseDir = ".mcpdom_recordings") {
    this.baseDir = baseDir;
    fs__default.mkdirSync(this.baseDir, { recursive: true });
  }
  save(recording) {
    const file = path__default.join(this.baseDir, `${recording.recordingId}.json`);
    fs__default.writeFileSync(
      file,
      JSON.stringify({ schemaVersion: RECORDING_SCHEMA_VERSION, savedAt: Date.now(), recording }, null, 2)
    );
    return file;
  }
  load(recordingId) {
    const file = path__default.join(this.baseDir, `${recordingId}.json`);
    if (fs__default.existsSync(file)) {
      try {
        const raw = JSON.parse(fs__default.readFileSync(file, "utf-8"));
        return raw.recording || raw;
      } catch {
        return null;
      }
    }
    for (const rec of this.list()) {
      if (rec.name === recordingId) {
        return this.load(rec.recordingId);
      }
    }
    return null;
  }
  list() {
    const out = [];
    if (!fs__default.existsSync(this.baseDir)) return out;
    for (const entry of fs__default.readdirSync(this.baseDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(fs__default.readFileSync(path__default.join(this.baseDir, entry.name), "utf-8"));
        const rec = raw.recording || raw;
        out.push({
          recordingId: rec.recordingId,
          name: rec.name,
          commandCount: rec.commandCount ?? rec.commands?.length ?? 0,
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
          tags: rec.tags || [],
          file: path__default.join(this.baseDir, entry.name)
        });
      } catch {
      }
    }
    return out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
  delete(recordingId) {
    const file = path__default.join(this.baseDir, `${recordingId}.json`);
    if (fs__default.existsSync(file)) {
      fs__default.rmSync(file);
      return true;
    }
    for (const rec of this.list()) {
      if (rec.name === recordingId) {
        return this.delete(rec.recordingId);
      }
    }
    return false;
  }
  importFromJson(json) {
    const parsed = JSON.parse(json);
    const rec = parsed.recording || parsed;
    if (!rec.recordingId || !Array.isArray(rec.commands)) {
      throw new Error("INVALID_RECORDING: JSON does not look like a CommandRecording export.");
    }
    const imported = {
      ...rec,
      recordingId: `${rec.recordingId}_imported_${Date.now().toString(36)}`,
      name: `${rec.name || "recording"} (imported)`,
      updatedAt: Date.now()
    };
    this.save(imported);
    return imported;
  }
}
class CommandSequenceEngine {
  sequenceCounter = 0;
  async execute(steps, executor, options = {}) {
    const stopOnError = options.stopOnError ?? true;
    this.sequenceCounter++;
    const sequenceId = `seq_${Date.now().toString(36)}_${this.sequenceCounter}`;
    const start = Date.now();
    const results = [];
    let previousSucceeded = true;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStart = Date.now();
      if (step.condition?.previousStepSucceeded === false && previousSucceeded) {
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: "SKIPPED",
          durationMs: 0,
          resultSummary: "Skipped: condition required previous step to FAIL, but it succeeded."
        });
        continue;
      }
      if (step.condition?.previousStepSucceeded === true && !previousSucceeded) {
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: "SKIPPED",
          durationMs: 0,
          resultSummary: "Skipped: condition required previous step to SUCCEED, but it failed."
        });
        continue;
      }
      try {
        const outcome = await executor(step.tool, step.args);
        previousSucceeded = outcome.success;
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: outcome.success ? "SUCCESS" : "FAILED",
          durationMs: Date.now() - stepStart,
          resultSummary: outcome.summary,
          result: outcome.result,
          error: outcome.error
        });
        if (!outcome.success && (step.stopOnError ?? stopOnError) && !step.continueOnError) {
          for (let j = i + 1; j < steps.length; j++) {
            results.push({
              stepIndex: j,
              commandId: steps[j].commandId || `step_${j + 1}`,
              tool: steps[j].tool,
              args: steps[j].args || {},
              status: "SKIPPED",
              durationMs: 0,
              resultSummary: "Skipped: sequence stopped on error (stopOnError)."
            });
          }
          break;
        }
      } catch (err) {
        previousSucceeded = false;
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: "FAILED",
          durationMs: Date.now() - stepStart,
          resultSummary: "Executor threw an exception.",
          error: err.message
        });
        if (stopOnError && !step.continueOnError) {
          for (let j = i + 1; j < steps.length; j++) {
            results.push({
              stepIndex: j,
              commandId: steps[j].commandId || `step_${j + 1}`,
              tool: steps[j].tool,
              args: steps[j].args || {},
              status: "SKIPPED",
              durationMs: 0,
              resultSummary: "Skipped: sequence stopped on exception (stopOnError)."
            });
          }
          break;
        }
      }
    }
    const executed = results.filter((r) => r.status !== "SKIPPED").length;
    const skipped = results.length - executed;
    return {
      sequenceId,
      success: results.every((r) => r.status !== "FAILED"),
      totalSteps: steps.length,
      executedSteps: executed,
      skippedSteps: skipped,
      durationMs: Date.now() - start,
      stopOnError,
      steps: results
    };
  }
}
class CommandRecorder {
  recording = null;
  counter = 0;
  start(name, description, tags = []) {
    this.counter++;
    this.recording = {
      recordingId: `rec_${Date.now().toString(36)}_${this.counter}`,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commandCount: 0,
      commands: [],
      tags
    };
    return this.recording;
  }
  isRecording() {
    return this.recording !== null;
  }
  getActiveRecording() {
    return this.recording;
  }
  recordCommand(tool, args, outcome, resultSummary) {
    if (!this.recording) return;
    this.recording.commands.push({
      index: this.recording.commands.length + 1,
      commandId: `rcmd_${this.recording.commands.length + 1}_${Date.now().toString(36)}`,
      tool,
      args,
      recordedAt: Date.now(),
      outcome,
      resultSummary
    });
    this.recording.commandCount = this.recording.commands.length;
    this.recording.updatedAt = Date.now();
  }
  stop() {
    const finished = this.recording;
    this.recording = null;
    return finished;
  }
  cancel() {
    this.recording = null;
  }
  // --- Editing operations on recordings ------------------------------
  static rename(recording, name) {
    return { ...recording, name, updatedAt: Date.now() };
  }
  static duplicate(recording) {
    return {
      ...recording,
      recordingId: `rec_${Date.now().toString(36)}_copy`,
      name: `${recording.name}_copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commands: recording.commands.map((c, i) => ({ ...c, index: i + 1, commandId: `rcmd_${i + 1}_${Date.now().toString(36)}` }))
    };
  }
  static editCommand(recording, index, updates) {
    const commands = recording.commands.map(
      (c) => c.index === index ? { ...c, tool: updates.tool || c.tool, args: updates.args ?? c.args } : c
    );
    return { ...recording, commands, commandCount: commands.length, updatedAt: Date.now() };
  }
  static removeCommand(recording, index) {
    const commands = recording.commands.filter((c) => c.index !== index).map((c, i) => ({ ...c, index: i + 1 }));
    return { ...recording, commands, commandCount: commands.length, updatedAt: Date.now() };
  }
}
const TOOL_GROUPS = [
  {
    group: "session-forensics",
    description: "Historical forensic session management and analysis (recorded sessions, timelines, DOM states, diffs, lifecycle tracing).",
    tools: ["list_sessions", "get_session", "export_session", "import_session", "delete_session", "get_timeline", "get_events", "get_events_around", "get_dom_state", "get_dom_node", "get_dom_subtree", "diff_dom", "trace_element", "find_disappearing_elements", "why_did_element_disappear", "get_diagnostics", "get_network_events", "get_screenshots", "annotate_session", "get_annotations", "get_recording_health"]
  },
  {
    group: "inspection",
    description: "Live page and element inspection: page metadata, element deep-info, visual state, DOM snapshots and analyzers.",
    tools: ["inspect_live_page", "inspect_live_element", "get_element_visual_state", "get_live_dom_snapshot", "get_live_dom_subtree", "get_tab_console_logs", "get_tab_network_requests", "get_element_ancestry", "get_element_accessibility", "get_computed_style", "analyze_dom", "search_dom", "get_page_blueprint", "get_element_fingerprint", "detect_semantic_elements"]
  },
  {
    group: "targeting",
    description: "Element targeting resilience: TARGET generation, selector candidates with confidence, recovery, diagnostics.",
    tools: ["generate_element_target", "recover_selector", "diagnose_selector_failure"]
  },
  {
    group: "interaction",
    description: "Page interaction: clicks, typing, hover, focus, keyboard, drag-and-drop, checkboxes, selects, waits.",
    tools: ["interact_with_element", "click_element", "type_text", "hover_element", "focus_element", "blur_element", "press_keyboard_shortcut", "scroll_to_element", "scroll_page", "drag_and_drop", "set_input_checked", "select_option", "wait_for_condition", "wait_for_dom_stable", "set_interaction_profile", "get_interaction_profile"]
  },
  {
    group: "tabs-browser",
    description: "Tab lifecycle and browser control: open/close/switch tabs, extension management, navigation, reload.",
    tools: ["list_tabs", "focus_tab", "reload_tab", "close_tab", "open_tab", "list_extensions", "set_extension_enabled", "toggle_extension", "reload_extension", "compare_extension_states", "get_browser_session"]
  },
  {
    group: "selection-capture",
    description: "Interactive element selection (Ctrl+Shift+Click / picker) and element observation.",
    tools: ["get_selected_element", "start_element_picker", "stop_element_picker", "start_element_observation", "stop_element_observation"]
  },
  {
    group: "viewport-responsive",
    description: "Viewport control and responsive testing: resize, presets, device emulation, multi-viewport workflows.",
    tools: ["resize_viewport", "reset_viewport", "get_viewport_state", "run_responsive_test", "emulate_device"]
  },
  {
    group: "javascript",
    description: "Observable JavaScript execution with explicit outcome states and change capture.",
    tools: ["execute_javascript", "execute_js_and_capture_changes"]
  },
  {
    group: "dom-mutation",
    description: "First-class DOM mutation engine: operations with diff, transactions, undo/redo, history, preview.",
    tools: ["mutate_dom", "mutate_dom_transaction", "undo_dom_mutation", "redo_dom_mutation", "get_mutation_history", "preview_dom_mutation", "preview_command", "clone_dom_subtree"]
  },
  {
    group: "command-sequences",
    description: "Command sequences, recording, replay, import/export of deterministic command data.",
    tools: ["execute_pipeline", "execute_command_sequence", "record_commands_start", "record_commands_stop", "list_command_recordings", "get_command_recording", "replay_command_recording", "export_command_recording", "import_command_recording", "delete_command_recording"]
  },
  {
    group: "page-state",
    description: "Page state snapshots and time-travel comparison.",
    tools: ["capture_page_state", "compare_page_states", "list_page_states", "get_action_timeline", "get_operation_trace"]
  },
  {
    group: "projects-knowledge",
    description: "Project folders, region capture/annotation, relationship graphs, reconstruction specs, agent packages.",
    tools: ["create_page_project", "list_projects", "get_project", "delete_project", "capture_page_region", "annotate_element", "list_region_annotations", "get_region_annotation", "update_region_annotation", "delete_region_annotation", "get_region_relationship_graph", "generate_reconstruction_spec", "export_agent_package", "import_project"]
  },
  {
    group: "screenshots",
    description: "Visual capture: page and element screenshots with geometry metadata.",
    tools: ["capture_page_screenshot", "capture_element_screenshot"]
  },
  {
    group: "security-privacy",
    description: "Capture redaction configuration and exclusion rules.",
    tools: ["get_redaction_rules", "set_redaction_rules"]
  },
  {
    group: "discovery",
    description: "Meta-tools: tool catalog and group discovery for agent self-orientation.",
    tools: ["get_tool_catalog", "get_tool_groups"]
  }
];
const FAILURE = {
  live: ["EXTENSION_UNAVAILABLE (no browser connected)", "TARGET_NOT_FOUND", "TARGET_STALE (element removed)", "SCRIPT_TIMEOUT", "DOM_MUTATION_FAILED"],
  stored: ["SESSION_NOT_FOUND", "invalid arguments"]
};
function buildToolCatalog() {
  const catalog = [];
  for (const g of TOOL_GROUPS) {
    for (const tool of g.tools) {
      const isAnalysis = g.group === "session-forensics" || g.group === "page-state" || g.group === "discovery" || g.group === "security-privacy";
      catalog.push({
        tool,
        group: g.group,
        purpose: `See tool description (tools/list) — group: ${g.description}`,
        requiredContext: isAnalysis ? g.group === "session-forensics" ? "Recorded session id where applicable" : "None (read-only meta information)" : "Live browser connection or Node simulation context",
        input: "See inputSchema in tools/list",
        output: "See tool description in tools/list",
        sideEffects: ["dom-mutation", "interaction", "tabs-browser", "javascript", "command-sequences", "projects-knowledge", "viewport-responsive"].includes(g.group) ? "May modify page state, browser state, or write project files (all DOM mutations are undoable)" : "None (read-only)",
        failureConditions: isAnalysis ? FAILURE.stored : FAILURE.live,
        recoveryStrategy: g.group === "tabs-browser" ? "Ensure the extension is connected (bridge on 127.0.0.1:3847); in the Node simulation context these tools return deterministic simulated state." : g.group === "dom-mutation" ? "Call undo_dom_mutation to revert; use preview_dom_mutation before destructive operations; wrap multi-step changes in mutate_dom_transaction." : g.group === "targeting" ? "Call generate_element_target for a fresh TARGET, then recover_selector with the old snapshot if it drifts." : "Retry after wait_for_condition; inspect get_operation_trace for correlated errors."
      });
    }
  }
  return catalog;
}
const MCPDOM_V3_TOOLS = [
  // ==================================================================
  // Targeting & forensics
  // ==================================================================
  {
    name: "generate_element_target",
    description: "Build the canonical multi-strategy TARGET object for an element: ranked selector candidates with confidence, xpath, DOM path, text/attribute/structural fingerprints and bounds. Use before storing or acting on elements to maximize targeting resilience. Input: target (selector/xpath/selectedElementRef). Output: TARGET with confidence in [0,1]. Fails with TARGET_NOT_FOUND when no strategy resolves.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier (selector, xpath, nodeId, or selectedElementRef)" },
        selector: { type: "string", description: "Shorthand: CSS selector for the target element" }
      }
    }
  },
  {
    name: "recover_selector",
    description: "Recover a failed element selector via fingerprint matching: inspects the previous target snapshot, searches candidate matches, scores them, and attempts SAFE recovery (refuses below 0.62 confidence or ambiguous matches). Input: selector + snapshot (tag, text, classes, stableAttributes, fingerprintHash, parentSelector). Output: RecoveryOutcome with alternatives and diagnostics. Side effect: none (read-only diagnosis).",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "The failing CSS selector" },
        snapshot: { type: "object", description: "Previous target snapshot evidence (from generate_element_target or a region annotation)" }
      },
      required: ["selector"]
    }
  },
  {
    name: "diagnose_selector_failure",
    description: "Diagnose WHY a selector fails: syntax validity, match count, relaxation attempts that work, and human-readable diagnosis. Complements recover_selector (which attempts to fix). Input: selector. Output: validity, matches, closest working selectors, diagnosis steps.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "The selector to diagnose" }
      },
      required: ["selector"]
    }
  },
  {
    name: "get_element_ancestry",
    description: "Analyze element ancestry: ancestors chain (tag, selector, role, text, child index, sibling count, distance), nearby siblings (before/after with distance), and descendant summary (count, max depth, tags, interactive descendants). Input: target/selector.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" }
      }
    }
  },
  {
    name: "get_element_fingerprint",
    description: "Compute the structural DOM fingerprint of an element: stable hash, tag hierarchy, stable attributes, meaningful text, class list, role, dimensions, ancestor/descendant patterns, plus a volatility risk assessment with reasons. Use for cross-navigation element identity. Input: target/selector.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" }
      }
    }
  },
  {
    name: "get_element_relationships",
    description: "Build the element relationship graph: self, parents (up to 4 levels), children and siblings as nodes with edges (parent-of, contains, sibling-of). Use to understand page region architecture around a target. Input: target/selector.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" }
      }
    }
  },
  {
    name: "get_element_accessibility",
    description: "Extract accessibility metadata: explicit/implicit role, accessible name with sources, description, value, states, heading level, focusability, tabIndex, all aria-* attributes, and detected a11y issues. Input: target/selector.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" }
      }
    }
  },
  {
    name: "get_computed_style",
    description: "Extract computed CSS style properties for an element. Input: target/selector + optional properties list (defaults to a layout-relevant set). Output: property→value map. Fails with STYLE_UNAVAILABLE when getComputedStyle is not exposed (rare).",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" },
        properties: { type: "array", items: { type: "string" }, description: "CSS property names to extract" }
      }
    }
  },
  {
    name: "search_dom",
    description: "Search the DOM by text, tag and attribute patterns with scored results (selector, role, text, visibility, bounds). The fastest way to find elements without knowing selectors. Input: query (required), optional tag, attr, attrValue, limit. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text (matched against text, tags and attributes)" },
        tag: { type: "string", description: "Restrict to tag name" },
        attr: { type: "string", description: "Require this attribute name" },
        attrValue: { type: "string", description: "Attribute value substring filter" },
        limit: { type: "number", description: "Max results (default 50, max 200)" }
      },
      required: ["query"]
    }
  },
  {
    name: "analyze_dom",
    description: "Run a named DOM analyzer: analyze_forms, extract_links, analyze_media, get_css_variables, analyze_fonts, extract_color_palette, detect_zindex_conflicts, detect_layout_issues, census_interactive_elements, detect_semantic_elements, scan_accessibility_issues, detect_dead_click_targets, inventory_animations, map_frame_tree, inventory_shadow_roots, inspect_page_storage, get_performance_metrics, extract_seo_metadata, extract_structured_data, extract_tables, extract_lists, analyze_page_content, inventory_ctas, detect_focus_traps, infer_responsive_breakpoints, get_selection_state. Input: analyzer (required) + analyzer-specific options. Output: structured analysis with count, items, warnings.",
    inputSchema: {
      type: "object",
      properties: {
        analyzer: { type: "string", description: "Analyzer name (see tool description for the full list)" },
        query: { type: "string", description: "Optional search query (search_dom)" },
        limit: { type: "number", description: "Optional result cap" }
      },
      required: ["analyzer"]
    }
  },
  {
    name: "get_page_blueprint",
    description: "Generate a page blueprint: major sections with bounds and roles, hierarchy tree, key interactive elements, repeated components (patterns with occurrence counts), layout relationships and semantic regions. The architectural map for page understanding. Input: projectName (optional — generated in the live DOM otherwise). Output: PageBlueprint.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "Optional project name to persist the blueprint" }
      }
    }
  },
  // ==================================================================
  // Interaction
  // ==================================================================
  {
    name: "click_element",
    description: "Production-grade click with explicit mode: normal (synthetic pointer event sequence), double, right, or human-like (movement trajectory + click delay from the active interaction profile). Records which mode was actually used. Input: target/selector, mode, waitForStabilization. Output: InteractionResult with before/after state and measured effects.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" },
        mode: { type: "string", enum: ["normal", "double", "right", "programmatic", "human-like"], description: "Click mode (default normal). Never silently falls back — the used mode is reported." },
        waitForStabilization: { type: "boolean", description: "Wait for DOM stabilization after the click" }
      }
    }
  },
  {
    name: "type_text",
    description: "Robust typing into inputs, textareas and contenteditable with mode: append, replace (clear then type) or clear. Framework-sensitive: dispatches keydown/keypress/input/change per character. Input: target/selector, text, mode. Output: InteractionResult; resulting value visible in afterState.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" },
        text: { type: "string", description: "Text to type" },
        mode: { type: "string", enum: ["append", "replace", "clear"], description: "Typing mode (default append)" },
        waitForStabilization: { type: "boolean" }
      }
    }
  },
  {
    name: "hover_element",
    description: "Hover an element: pointerenter/mouseenter/mouseover/mousemove event sequence. Input: target/selector. Output: InteractionResult.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        selector: { type: "string" }
      }
    }
  },
  {
    name: "focus_element",
    description: "Focus an element (native focus() + focus event). Input: target/selector. Output: InteractionResult.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        selector: { type: "string" }
      }
    }
  },
  {
    name: "blur_element",
    description: "Blur (defocus) an element (native blur() + blur event). Input: target/selector. Output: InteractionResult.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        selector: { type: "string" }
      }
    }
  },
  {
    name: "press_keyboard_shortcut",
    description: 'Press a key or keyboard shortcut on an element (or the active element): keydown+keyup per key with modifier flags. Input: keys (e.g. ["Control","Shift","P"] or "Control+Shift+P"), optional target. Output: events fired and target selector.',
    inputSchema: {
      type: "object",
      properties: {
        keys: { type: "string", description: 'Shortcut, e.g. "Control+Shift+P" or "Enter"' },
        keyList: { type: "array", items: { type: "string" }, description: "Alternative: keys as array" },
        target: { type: "object", description: "Optional target specifier; defaults to activeElement" }
      },
      required: ["keys"]
    }
  },
  {
    name: "scroll_to_element",
    description: "Scroll an element into view (block: center). Input: target/selector. Output: before/after scroll positions and target selector.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        selector: { type: "string" },
        behavior: { type: "string", enum: ["auto", "smooth"], description: "Scroll behavior (default auto)" }
      }
    }
  },
  {
    name: "scroll_page",
    description: "Scroll the page by a distance: x/y pixel offsets. Input: x, y. Output: before/after scroll positions.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Horizontal pixel delta" },
        y: { type: "number", description: "Vertical pixel delta" }
      }
    }
  },
  {
    name: "drag_and_drop",
    description: "Drag and drop: HTML5 drag events (dragstart/dragenter/dragover/drop/dragend) plus pointer events between source and target (or by pixel offsets). Input: source (target specifier), optional target specifier or offsets. Output: events fired, final position, whether HTML5 DnD was used.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "object", description: "Source element target specifier" },
        target: { type: "object", description: "Drop target specifier (or use offsets)" },
        offsets: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, description: "Pixel offsets when no drop target" }
      },
      required: ["source"]
    }
  },
  {
    name: "set_input_checked",
    description: "Check/uncheck a checkbox or select a radio (peer radios with the same name are deselected). Dispatches input + change events. Input: target/selector, checked (default true). Output: checkedBefore/checkedAfter and events fired.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        selector: { type: "string" },
        checked: { type: "boolean", description: "Desired state (default true)" }
      }
    }
  },
  {
    name: "select_option",
    description: "Select an option in a dropdown: sets value and dispatches change. Input: target/selector, value. Output: InteractionResult.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object" },
        selector: { type: "string" },
        value: { type: "string", description: "Option value to select" }
      },
      required: ["value"]
    }
  },
  {
    name: "wait_for_condition",
    description: "Wait for a meaningful condition instead of arbitrary sleeps: dom_stable, selector_present, selector_visible, selector_absent, text_present, url_contains, element_count, readiness_state. Input: kind + condition params, timeoutMs (default 5000, max 30000), pollIntervalMs. Output: satisfied, waitedMs, detail. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["dom_stable", "selector_present", "selector_visible", "selector_absent", "text_present", "url_contains", "element_count", "readiness_state"], description: "Condition kind" },
        selector: { type: "string", description: "Selector for selector_* and element_count conditions" },
        text: { type: "string", description: "Text for text_present / url_contains" },
        count: { type: "number", description: "Expected count for element_count" },
        state: { type: "string", description: "Expected readyState (default complete)" },
        timeoutMs: { type: "number", description: "Timeout (default 5000ms)" },
        pollIntervalMs: { type: "number", description: "Poll interval (default 100ms)" }
      },
      required: ["kind"]
    }
  },
  {
    name: "wait_for_dom_stable",
    description: "Convenience wrapper for wait_for_condition {kind: dom_stable}: polls until two consecutive DOM length observations match. Input: timeoutMs. Output: satisfied + waitedMs.",
    inputSchema: {
      type: "object",
      properties: {
        timeoutMs: { type: "number", description: "Timeout (default 5000ms)" }
      }
    }
  },
  {
    name: "set_interaction_profile",
    description: "Set the human-interaction profile for subsequent interactions: DETERMINISTIC (zero delay), BALANCED (small natural delays), HUMAN_LIKE (realistic cadence, trajectories, hesitation) or CUSTOM (user timing parameters, seed). The seed makes HUMAN_LIKE reproducible. Input: profile, optional custom timings + seed. Output: active profile report.",
    inputSchema: {
      type: "object",
      properties: {
        profile: { type: "string", enum: ["DETERMINISTIC", "BALANCED", "HUMAN_LIKE", "CUSTOM"], description: "Profile name" },
        seed: { type: "number", description: "PRNG seed for reproducible human-like timing" },
        custom: { type: "object", description: "CUSTOM profile overrides: moveDelayMs, clickDelayMs, typeDelayMs, keyDelayMs {min,max}, hesitationProbability, trajectorySteps" }
      },
      required: ["profile"]
    }
  },
  {
    name: "get_interaction_profile",
    description: "Inspect the active interaction profile and the timing of the last action (requested mode, actual mode, per-phase timings, total duration). Output: InteractionProfileReport.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "preview_command",
    description: "Dry-run preview of a DOM mutation: valid flag, expected change description, affected node count and warnings — WITHOUT applying anything. Input: operation + target + params (same as mutate_dom). Output: MutationPreview. Side effect: none (guaranteed).",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Mutation operation (see mutate_dom)" },
        target: { type: "object", description: "Element target specifier" },
        attribute: { type: "string" },
        value: { type: "string" },
        classes: { type: "array", items: { type: "string" } },
        text: { type: "string" },
        replacement: { type: "string" },
        html: { type: "string" },
        newElementHtml: { type: "string" },
        parent: { type: "object" },
        position: { type: "string", enum: ["before", "after", "prepend", "append"] }
      },
      required: ["operation", "target"]
    }
  },
  // ==================================================================
  // Viewport / responsive testing
  // ==================================================================
  {
    name: "resize_viewport",
    description: "Resize the viewport (width/height in pixels or a named preset). ALWAYS reversible: the original size is recorded on first use. Captures before/after page digests. Input: width+height, or preset (desktop-hd, tablet-ipad, mobile-iphone-12, …). Output: ViewportResizeResult with previous/original dimensions.",
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", description: "Target width (200–7680)" },
        height: { type: "number", description: "Target height (200–4320)" },
        preset: { type: "string", description: "Named preset (overrides width/height)" }
      }
    }
  },
  {
    name: "reset_viewport",
    description: "Restore the original viewport size recorded before the first resize (guaranteed RESET_VIEWPORT semantics). Also clears the active preset/device. Input: none. Output: ViewportResizeResult with restored dimensions.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_viewport_state",
    description: "Inspect the viewport: current width/height/dpr/scroll plus the recorded original and whether it is currently modified. Input: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "run_responsive_test",
    description: "Run a multi-viewport responsive workflow: applies each size, records DOM length/interactive count/horizontal overflow per step, compares steps, then RESTORES the original viewport (unless restore:false). Input: sizes array (or defaults 1440x900, 1024x768, 768x1024, 375x667), restore. Output: ResponsiveTestResult with comparisons.",
    inputSchema: {
      type: "object",
      properties: {
        sizes: { type: "array", items: { type: "object", properties: { label: { type: "string" }, width: { type: "number" }, height: { type: "number" } } }, description: "Custom viewport sequence" },
        restore: { type: "boolean", description: "Restore original viewport afterwards (default true)" }
      }
    }
  },
  {
    name: "emulate_device",
    description: "Emulate a device profile: viewport + devicePixelRatio + touch metadata + reported UA (UA override applied only in a real browser session; honestly reported otherwise). Input: device (iphone-13, ipad-air, pixel-7, galaxy-s23, macbook-pro-16, windows-desktop). Output: resize result + profile + userAgentNote.",
    inputSchema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device profile name" }
      },
      required: ["device"]
    }
  },
  // ==================================================================
  // JavaScript execution
  // ==================================================================
  {
    name: "execute_javascript",
    description: "Execute JavaScript with explicit outcome states: EXECUTED_SUCCESSFULLY, EXECUTED_WITH_ERROR, TIMED_OUT, SERIALIZATION_FAILED, BLOCKED_BY_CONTEXT, NOT_CONNECTED. Captures console output, duration, and DOM-change indication (length before/after). The code may use `return value;`. Input: code, timeoutMs (default 5000, max 30000), world (ISOLATED default). Output: JSExecutionResult. Side effect: arbitrary code execution in the page context.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript source (async/await supported; use `return`)" },
        timeoutMs: { type: "number", description: "Timeout (default 5000ms)" },
        world: { type: "string", enum: ["ISOLATED", "MAIN"], description: "Execution world (ISOLATED default)" }
      },
      required: ["code"]
    }
  },
  {
    name: "execute_js_and_capture_changes",
    description: "Composite: execute JavaScript AND capture the DOM state before/after with a structural diff summary + page-state snapshots. Same input as execute_javascript. Output: JSExecutionResult + before/after PageStateSnapshot + comparison.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript source" },
        timeoutMs: { type: "number" },
        world: { type: "string", enum: ["ISOLATED", "MAIN"] }
      },
      required: ["code"]
    }
  },
  // ==================================================================
  // DOM mutation engine
  // ==================================================================
  {
    name: "mutate_dom",
    description: "Apply a first-class DOM mutation with full observability (BEFORE → ACTION → AFTER → DIFF) and a guaranteed undo record. Operations: set_attribute, remove_attribute, set_text, replace_text, set_inner_html, set_outer_html, add_class, remove_class, replace_class, set_style, remove_style, add_element, remove_element, replace_element, move_element, wrap_element, unwrap_element, clone_subtree. Input: operation, target, plus operation-specific params. Output: DOMMutationResult. Side effect: modifies live DOM (undoable).",
    inputSchema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["set_attribute", "remove_attribute", "set_text", "replace_text", "set_inner_html", "set_outer_html", "add_class", "remove_class", "replace_class", "set_style", "remove_style", "add_element", "remove_element", "replace_element", "move_element", "wrap_element", "unwrap_element", "clone_subtree"],
          description: "Mutation operation"
        },
        target: { type: "object", description: "Element target specifier" },
        attribute: { type: "string", description: "Attribute name (set/remove_attribute)" },
        value: { type: "string", description: "Attribute value or replacement class (replace_class)" },
        text: { type: "string", description: "Text content (set_text) or search pattern (replace_text)" },
        replacement: { type: "string", description: "Replacement text (replace_text)" },
        classes: { type: "array", items: { type: "string" }, description: "Class names (add/remove/replace_class) or style props (remove_style)" },
        style: { type: "object", description: "Style property map (set_style)" },
        html: { type: "string", description: "HTML content (set_inner_html)" },
        newElementHtml: { type: "string", description: "HTML for new/replacement/wrapper element" },
        parent: { type: "object", description: "Parent target (move_element, add_element)" },
        position: { type: "string", enum: ["before", "after", "prepend", "append"], description: "Insertion position (add_element/move_element)" },
        copyAttributes: { type: "boolean", description: "clone_subtree: copy attributes (ids never duplicated)" }
      },
      required: ["operation", "target"]
    }
  },
  {
    name: "mutate_dom_transaction",
    description: "Transactional DOM mutation: mode=begin opens a transaction, subsequent mutate_dom calls join it, mode=commit verifies and commits (all-or-nothing), mode=rollback reverts every step in reverse order. Input: mode, optional reason (rollback). Output: transaction status with per-step results. Side effect: none for begin; commits/rolls back DOM changes.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["begin", "commit", "rollback"], description: "Transaction phase" },
        reason: { type: "string", description: "Rollback reason (recorded)" }
      },
      required: ["mode"]
    }
  },
  {
    name: "undo_dom_mutation",
    description: 'Undo the last DOM mutation (or the last mutation of the open transaction) using its immutable inverse record. Input: none. Output: success + undone mutation id. Idempotent-safe: reports "nothing to undo" when the stack is empty.',
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "redo_dom_mutation",
    description: "Redo the last undone DOM mutation (forward patch re-applied only when safe). Input: none. Output: success + redone mutation id.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_mutation_history",
    description: "Inspect the DOM mutation history: entries (operation, target, summary, undo/redo flags), undo depth, redo depth, open transaction id. Input: limit (default 100). Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max entries (default 100)" }
      }
    }
  },
  {
    name: "preview_dom_mutation",
    description: "Dry-run a mutation: validates the target, describes the expected change, counts affected nodes and warns about destructive operations — WITHOUT modifying anything. Input: identical to mutate_dom. Output: MutationPreview. Side effect: none (guaranteed).",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Mutation operation" },
        target: { type: "object", description: "Element target specifier" },
        attribute: { type: "string" },
        value: { type: "string" },
        classes: { type: "array", items: { type: "string" } },
        text: { type: "string" },
        replacement: { type: "string" },
        html: { type: "string" },
        newElementHtml: { type: "string" },
        parent: { type: "object" },
        position: { type: "string", enum: ["before", "after", "prepend", "append"] }
      },
      required: ["operation", "target"]
    }
  },
  {
    name: "clone_dom_subtree",
    description: "Clone a DOM subtree (deep clone appended to a parent or the original parent; ids are never duplicated). Input: target, optional parent, copyAttributes. Output: DOMMutationResult (undoable). Side effect: adds cloned nodes.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "object", description: "Element to clone" },
        parent: { type: "object", description: "Optional append target (defaults to original parent)" },
        copyAttributes: { type: "boolean", description: "Copy attributes except id (default true)" }
      },
      required: ["target"]
    }
  },
  // ==================================================================
  // Command sequences & recording
  // ==================================================================
  {
    name: "execute_command_sequence",
    description: "Execute a command sequence with per-command records (id, timestamp, target, args, status, result, duration, error): sequential execution, conditional continuation (condition.previousStepSucceeded), explicit stop-on-error (default) or per-step continueOnError. Input: steps array + stopOnError. Output: CommandSequenceResult. Side effects: those of the executed tools.",
    inputSchema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              commandId: { type: "string" },
              tool: { type: "string", description: "MCP tool name" },
              args: { type: "object", description: "Tool arguments" },
              stopOnError: { type: "boolean" },
              continueOnError: { type: "boolean" },
              condition: { type: "object", properties: { previousStepSucceeded: { type: "boolean" } } }
            },
            required: ["tool"]
          },
          description: "Ordered command steps"
        },
        stopOnError: { type: "boolean", description: "Default stop-on-error policy (default true)" }
      },
      required: ["steps"]
    }
  },
  {
    name: "record_commands_start",
    description: "Start recording subsequent tool invocations into a named command recording. Input: name, description, tags. Output: active recording metadata. Side effect: recording mode ON (adds latency-free capture to every tool call).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Recording name" },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["name"]
    }
  },
  {
    name: "record_commands_stop",
    description: "Stop the active command recording and persist it to storage (.mcpdom_recordings). Input: none (uses active recording). Output: the finished CommandRecording.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "list_command_recordings",
    description: "List saved command recordings with metadata (id, name, command count, timestamps, tags). Input: none. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_command_recording",
    description: "Load one command recording in full (all commands with args and outcomes). Input: recordingId. Output: CommandRecording. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        recordingId: { type: "string", description: "Recording identifier" }
      },
      required: ["recordingId"]
    }
  },
  {
    name: "replay_command_recording",
    description: "Replay a saved command recording: executes each recorded tool call in order with deterministic arguments. Input: recordingId, stopOnError (default true). Output: CommandSequenceResult. Side effects: those of the recorded commands — review get_command_recording first.",
    inputSchema: {
      type: "object",
      properties: {
        recordingId: { type: "string" },
        stopOnError: { type: "boolean", description: "Stop on first failure (default true)" }
      },
      required: ["recordingId"]
    }
  },
  {
    name: "export_command_recording",
    description: "Export a command recording as portable JSON (with schema version) for another agent or session. Input: recordingId, outputPath (optional). Output: the exported JSON + save info.",
    inputSchema: {
      type: "object",
      properties: {
        recordingId: { type: "string" },
        outputPath: { type: "string", description: "Optional file path to write the JSON" }
      },
      required: ["recordingId"]
    }
  },
  {
    name: "import_command_recording",
    description: "Import a command recording from JSON (previously exported). Input: recordingJson. Output: imported recording metadata. Side effect: writes to recordings storage.",
    inputSchema: {
      type: "object",
      properties: {
        recordingJson: { type: "string", description: "Serialized CommandRecording JSON" }
      },
      required: ["recordingJson"]
    }
  },
  {
    name: "delete_command_recording",
    description: "Delete a saved command recording. Input: recordingId. Side effect: removes stored data (irreversible).",
    inputSchema: {
      type: "object",
      properties: {
        recordingId: { type: "string" }
      },
      required: ["recordingId"]
    }
  },
  // ==================================================================
  // Browser session, timeline & page states
  // ==================================================================
  {
    name: "get_browser_session",
    description: "Inspect the coherent browser session model: tabs with stable session identities, active tab, viewport state, extension state, snapshot count, command count, mutation history count, timeline event count, bound project id. Input: none. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_action_timeline",
    description: "Query the chronological action timeline (TAB_OPENED, CLICKED, DOM_MUTATED, SNAPSHOT_CREATED, ERROR_OCCURRED, …) with optional filters (kind, sinceTimestamp, limit). The platform observability layer. Input: optional filters. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", description: "Filter by event kind" },
        sinceTimestamp: { type: "number", description: "Only events at/after this epoch ms" },
        limit: { type: "number", description: "Max events (default 200)" }
      }
    }
  },
  {
    name: "get_operation_trace",
    description: "Trace a single operation by its operationId: tool, start/end, duration, status, correlated timeline events, related error. Input: operationId (or latest). Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        operationId: { type: "string", description: "Operation id to trace (omit for recent list)" },
        limit: { type: "number", description: "Recent operations limit when no id (default 20)" }
      }
    }
  },
  {
    name: "capture_page_state",
    description: "Capture a page state snapshot (comparison anchor): url, title, viewport, dom length + hash, interactive count, extension state, pending mutations, annotation count. Input: none. Output: PageStateSnapshot (also recorded in the session).",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "compare_page_states",
    description: 'Compare two page state snapshots ("what changed after this command?"): field-level diffs, DOM size delta, summary. Input: snapshotIdA + snapshotIdB (omit both to compare the two most recent snapshots). Side effect: none.',
    inputSchema: {
      type: "object",
      properties: {
        snapshotIdA: { type: "string", description: "First snapshot id (default: second-most-recent)" },
        snapshotIdB: { type: "string", description: "Second snapshot id (default: most-recent)" }
      }
    }
  },
  {
    name: "list_page_states",
    description: "List captured page state snapshots (ids, timestamps, urls, dom sizes). Input: none. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  // ==================================================================
  // Projects & knowledge system
  // ==================================================================
  {
    name: "create_page_project",
    description: "Create a portable page-analysis project folder (project.json, page.json, regions/, screenshots/, dom/, commands/, diffs/, metadata/, instructions/). The DOM snapshot is captured CLEANED: MCPDOM-injected artifacts excluded, secrets redacted. Input: name, description, url/title/viewport metadata (defaults from the live page). Output: ProjectManifest. Side effect: creates files under .mcpdom_projects/<name>/.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name (folder name)" },
        description: { type: "string" },
        url: { type: "string", description: "Page URL (default: live page URL)" },
        title: { type: "string", description: "Page title (default: live page title)" }
      },
      required: ["name"]
    }
  },
  {
    name: "list_projects",
    description: "List page-analysis projects with manifests (names, page counts, region counts, timestamps). Input: none. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_project",
    description: "Load a project in full: manifest, page manifest, and all region annotations. Input: projectName. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "capture_page_region",
    description: "Capture a page region into a project: resolves the element, captures LOCAL DOM + RELEVANT CONTEXT DOM (meaningful boundary), ranked selector candidates, fingerprint, styles, dimensions, auto-generated name and (optionally) a screenshot. Input: projectName, target/selector, user annotation fields (name, description, comment, tags), intendedChange, verification, screenshot. Output: RegionAnnotation (OBSERVED/USER/INTENDED/VERIFICATION separated). Side effect: writes region files.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", description: "Target project name" },
        target: { type: "object", description: "Element target specifier" },
        selector: { type: "string", description: "Shorthand: CSS selector" },
        name: { type: "string", description: "User override name (auto name preserved)" },
        description: { type: "string", description: "User description" },
        comment: { type: "string", description: 'User comment, e.g. "make this collapsible"' },
        tags: { type: "array", items: { type: "string" } },
        behavioralNotes: { type: "string" },
        visualNotes: { type: "string" },
        intendedChange: { type: "string", description: "What the user wants changed" },
        verification: { type: "array", items: { type: "string" }, description: "Success conditions" },
        screenshot: { type: "boolean", description: "Capture a region screenshot (default false)" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "annotate_element",
    description: "Annotate a live element and capture it into a project (alias of capture_page_region with annotation semantics front and center): OBSERVED element data, USER comment/name/tags, INTENDED CHANGE and VERIFICATION CONDITIONS are stored as strictly separate fields. Input: identical to capture_page_region.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" },
        target: { type: "object" },
        selector: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        comment: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        behavioralNotes: { type: "string" },
        visualNotes: { type: "string" },
        intendedChange: { type: "string" },
        verification: { type: "array", items: { type: "string" } },
        screenshot: { type: "boolean" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "list_region_annotations",
    description: "List region annotations in a project (names, selectors, quality grades, intended changes). Input: projectName. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "get_region_annotation",
    description: "Load one region annotation in full (observed facts, user fields, intended change, verification, quality score). Input: projectName, regionId. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" },
        regionId: { type: "string" }
      },
      required: ["projectName", "regionId"]
    }
  },
  {
    name: "update_region_annotation",
    description: "Update the USER fields of a region annotation (name, description, comment, tags, notes, intendedChange, verification). Observed facts are never editable. Quality is recomputed. Input: projectName, regionId, updates. Side effect: rewrites the region file.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" },
        regionId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        comment: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        behavioralNotes: { type: "string" },
        visualNotes: { type: "string" },
        intendedChange: { type: "string" },
        verification: { type: "array", items: { type: "string" } }
      },
      required: ["projectName", "regionId"]
    }
  },
  {
    name: "delete_region_annotation",
    description: "Delete a region annotation from a project. Input: projectName, regionId. Side effect: removes the region file and updates manifests.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" },
        regionId: { type: "string" }
      },
      required: ["projectName", "regionId"]
    }
  },
  {
    name: "get_region_relationship_graph",
    description: "Build the region relationship graph for a project: nodes (page + regions) and edges (contains, sibling-of, ancestor-of, overlaps) derived from live DOM containment. Input: projectName. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "generate_reconstruction_spec",
    description: "Generate (and persist) the canonical page reconstruction specification for a project: metadata, viewport, structure, regions with selector candidates, hierarchy, semantic roles, visual constraints, interactions, selectors with fallbacks, content, styles, annotations, expected modifications and verification rules — with a versioned schema. Input: projectName. Side effect: writes metadata/reconstruction-spec.json.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "export_agent_package",
    description: "Export a self-contained Agent handoff package for another AI agent: README.md, PROJECT.md, agent-instructions.md, project.json, pages/, regions/, snapshots/, diffs/, commands/, assets/, schemas/, verification/. The package fully separates OBSERVED FACTS / USER REQUESTS / EXPECTED CHANGES / VERIFICATION CONDITIONS. Input: projectName, outputDir (default ./mcpdom_agent_packages/<name>). Side effect: writes the package directory.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" },
        outputDir: { type: "string", description: "Output directory (default ./mcpdom_agent_packages/<name>)" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "delete_project",
    description: "Delete a project folder permanently. Input: projectName. Side effect: irreversible file removal.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string" }
      },
      required: ["projectName"]
    }
  },
  {
    name: "import_project",
    description: "Import a project previously exported via export_agent_package or a project folder copy: restores manifest, page, regions, diffs and command recordings into working storage. Input: projectDir. Side effect: copies files into .mcpdom_projects.",
    inputSchema: {
      type: "object",
      properties: {
        projectDir: { type: "string", description: "Path to the exported project folder" }
      },
      required: ["projectDir"]
    }
  },
  // ==================================================================
  // Security & capture hygiene
  // ==================================================================
  {
    name: "get_redaction_rules",
    description: "Inspect the capture redaction configuration: all rules (key patterns, value patterns, attribute patterns) with enabled flags, and capture exclusions. Input: none. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "set_redaction_rules",
    description: "Configure capture redaction: enable/disable existing rules, add custom key/value/attribute patterns, or add capture exclusions (selectors never captured). Built-in rules can be disabled but never removed. Input: enable/disable ruleIds, addRule {kind, pattern, description}, addExclusion {selector, reason}. Side effect: changes capture behavior for all subsequent captures.",
    inputSchema: {
      type: "object",
      properties: {
        enable: { type: "array", items: { type: "string" }, description: "Rule ids to enable" },
        disable: { type: "array", items: { type: "string" }, description: "Rule ids to disable" },
        addRule: { type: "object", properties: { kind: { type: "string" }, pattern: { type: "string" }, description: { type: "string" } }, description: "Add a custom redaction rule" },
        addExclusion: { type: "object", properties: { selector: { type: "string" }, reason: { type: "string" } }, description: "Add a capture exclusion selector" }
      }
    }
  },
  // ==================================================================
  // Tool discovery (§44)
  // ==================================================================
  {
    name: "get_tool_catalog",
    description: "Return the full MCP tool catalog with per-tool metadata: purpose, required context, accepted input, output, side effects, failure conditions, recovery strategy, and tool group. The meta-tool an agent calls FIRST to decide which tools to use. Input: optional group filter. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {
        group: { type: "string", description: "Optional group filter (see get_tool_groups)" }
      }
    }
  },
  {
    name: "get_tool_groups",
    description: "List discoverable tool groups (inspection, targeting, interaction, viewport, javascript, mutation, sequences, session, projects, security, discovery) with descriptions and member tool names. Input: none. Side effect: none.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];
const V3_TOOL_NAMES = new Set(MCPDOM_V3_TOOLS.map((t) => t.name));
class ExtendedToolsHandler {
  localController;
  bridgeClient;
  projectManager;
  exporter;
  recordings;
  commandRecorder = new CommandRecorder();
  sequenceEngine = new CommandSequenceEngine();
  redaction = new RedactionEngine();
  fingerprintEngine = new DOMFingerprintEngine();
  qualityScorer = new RegionQualityScorer();
  /** Set by the MCP server: routes sequence execution through the authoritative tool pipeline. */
  toolsPipeline;
  constructor(localController, bridgeClient, projectsBaseDir) {
    this.localController = localController || new LiveBrowserController();
    this.bridgeClient = bridgeClient;
    this.projectManager = new ProjectManager(projectsBaseDir || ".mcpdom_projects");
    this.exporter = new AgentPackageExporter(this.projectManager);
    this.recordings = new CommandRecordingStorage();
  }
  setToolsPipeline(pipeline) {
    this.toolsPipeline = pipeline;
  }
  setBridgeClient(client) {
    this.bridgeClient = client;
  }
  getLocalController() {
    return this.localController;
  }
  getProjectManager() {
    return this.projectManager;
  }
  knows(toolName) {
    return V3_TOOL_NAMES.has(toolName);
  }
  async handleToolCall(name, args) {
    const start = Date.now();
    try {
      const result = await this.route(name, args || {});
      const durationMs = Date.now() - start;
      if (this.commandRecorder.isRecording() && name !== "record_commands_stop") {
        this.commandRecorder.recordCommand(name, args, "SUCCESS", summarize(result));
      }
      this.localController.session.recordCommand(name, args, "SUCCESS", durationMs);
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      if (this.commandRecorder.isRecording() && name !== "record_commands_stop") {
        this.commandRecorder.recordCommand(name, args, "FAILED", err.message);
      }
      this.localController.session.recordCommand(name, args, "FAILED", durationMs, err.message);
      this.localController.session.timeline.record("ERROR_OCCURRED", `${name}: ${err.message}`);
      return {
        isError: true,
        content: [{ type: "text", text: `Extended tool error in '${name}': ${err.message}` }]
      };
    }
  }
  async route(name, args) {
    switch (name) {
      // --- Targeting & forensics ---
      case "generate_element_target":
        return this.wrap(await this.dispatch("GENERATE_ELEMENT_TARGET", { target: args.target, selector: args.selector }));
      case "recover_selector":
        return this.wrap(await this.dispatch("RECOVER_SELECTOR", args));
      case "diagnose_selector_failure": {
        const doc = this.document();
        const { SelectorRecoveryEngine: SelectorRecoveryEngine2 } = await Promise.resolve().then(() => selectorRecovery);
        const engine = new SelectorRecoveryEngine2(doc);
        return this.wrap(engine.diagnose(args.selector || ""));
      }
      case "get_element_ancestry":
        return this.wrap(await this.dispatch("GET_ELEMENT_ANCESTRY", this.target(args)));
      case "get_element_fingerprint":
        return this.wrap(await this.dispatch("GET_ELEMENT_FINGERPRINT", this.target(args)));
      case "get_element_relationships":
        return this.wrap(await this.dispatch("GET_ELEMENT_RELATIONSHIPS", this.target(args)));
      case "get_element_accessibility":
        return this.wrap(await this.dispatch("GET_ELEMENT_ACCESSIBILITY", this.target(args)));
      case "get_computed_style":
        return this.wrap(await this.dispatch("GET_COMPUTED_STYLE", { ...this.target(args), properties: args.properties }));
      case "search_dom":
        return this.wrap(await this.dispatch("ANALYZE_DOM", { ...args, analyzer: "search_dom" }));
      case "analyze_dom":
        return this.wrap(await this.dispatch("ANALYZE_DOM", args));
      case "get_page_blueprint": {
        const doc = this.document();
        if (args.projectName) {
          return this.wrap(this.projectManager.generateBlueprint(args.projectName, doc));
        }
        const { PageBlueprintGenerator: PageBlueprintGenerator2 } = await Promise.resolve().then(() => reconstructionSpec);
        return this.wrap(new PageBlueprintGenerator2().generate(doc, "live", []));
      }
      // --- Interaction ---
      case "click_element": {
        const mode = args.mode || "normal";
        const action = mode === "double" ? "double_click" : mode === "right" ? "right_click" : "click";
        return this.wrap(
          await this.dispatch("LIVE_ELEMENT_INTERACT", {
            action,
            target: this.targetOf(args),
            options: { waitForStabilization: args.waitForStabilization !== false }
          })
        );
      }
      case "type_text": {
        const mode = args.mode || "append";
        if (mode === "clear") {
          return this.wrap(await this.dispatch("LIVE_ELEMENT_INTERACT", { action: "clear", target: this.targetOf(args) }));
        }
        if (mode === "replace") {
          await this.dispatch("LIVE_ELEMENT_INTERACT", { action: "clear", target: this.targetOf(args) });
        }
        return this.wrap(
          await this.dispatch("LIVE_ELEMENT_INTERACT", {
            action: "type",
            target: this.targetOf(args),
            text: args.text || "",
            options: { waitForStabilization: args.waitForStabilization }
          })
        );
      }
      case "hover_element":
        return this.wrap(await this.dispatch("LIVE_ELEMENT_INTERACT", { action: "hover", target: this.targetOf(args) }));
      case "focus_element":
        return this.wrap(await this.dispatch("LIVE_ELEMENT_INTERACT", { action: "focus", target: this.targetOf(args) }));
      case "blur_element":
        return this.wrap(await this.dispatch("LIVE_ELEMENT_INTERACT", { action: "blur", target: this.targetOf(args) }));
      case "select_option":
        return this.wrap(
          await this.dispatch("LIVE_ELEMENT_INTERACT", { action: "select_option", target: this.targetOf(args), optionValue: args.value })
        );
      case "press_keyboard_shortcut":
        return this.wrap(
          await this.dispatch("PRESS_KEYBOARD_SHORTCUT", { keys: args.keyList || args.keys, target: args.target })
        );
      case "scroll_to_element":
        return this.wrap(await this.dispatch("SCROLL_PAGE", { ...this.target(args), behavior: args.behavior }));
      case "scroll_page":
        return this.wrap(await this.dispatch("SCROLL_PAGE", { x: args.x, y: args.y }));
      case "drag_and_drop":
        return this.wrap(await this.dispatch("DRAG_ELEMENT", { source: args.source, target: args.target, offsets: args.offsets }));
      case "set_input_checked":
        return this.wrap(await this.dispatch("SET_INPUT_CHECKED", { ...this.target(args), checked: args.checked }));
      case "wait_for_condition":
        return this.wrap(await this.dispatch("WAIT_FOR_CONDITION", args));
      case "wait_for_dom_stable":
        return this.wrap(await this.dispatch("WAIT_FOR_CONDITION", { kind: "dom_stable", timeoutMs: args.timeoutMs }));
      case "set_interaction_profile": {
        const profile = this.localController.humanInteraction.setActiveProfile(args.profile, args.custom);
        if (typeof args.seed === "number") this.localController.humanInteraction.setSeed(args.seed);
        return this.wrap({ activeProfile: profile.name, profile, note: "Subsequent interactions use this timing profile. DETERMINISTIC = zero delay (legacy behavior)." });
      }
      case "get_interaction_profile":
        return this.wrap(this.localController.humanInteraction.report());
      case "preview_command":
      case "preview_dom_mutation":
        return this.wrap(await this.dispatch("PREVIEW_DOM_MUTATION", this.mutationPayload(args)));
      // --- Viewport ---
      case "resize_viewport":
        return this.wrap(await this.dispatch("RESIZE_VIEWPORT", args));
      case "reset_viewport":
        return this.wrap(await this.dispatch("RESET_VIEWPORT", {}));
      case "get_viewport_state":
        return this.wrap(await this.dispatch("GET_VIEWPORT_STATE", {}));
      case "run_responsive_test":
        return this.wrap(await this.dispatch("RUN_RESPONSIVE_TEST", args));
      case "emulate_device":
        return this.wrap(await this.dispatch("EMULATE_DEVICE", args));
      // --- JavaScript ---
      case "execute_javascript":
        return this.wrap(await this.dispatch("EXECUTE_JS", args));
      case "execute_js_and_capture_changes": {
        const before = await this.dispatch("CAPTURE_PAGE_STATE", {});
        const exec = await this.dispatch("EXECUTE_JS", args);
        const after = await this.dispatch("CAPTURE_PAGE_STATE", {});
        const comparison = this.localController.session.compareSnapshots(before, after);
        return this.wrap({ execution: exec, before, after, comparison });
      }
      // --- DOM mutation ---
      case "mutate_dom":
        return this.wrap(await this.dispatch("DOM_MUTATE", this.mutationPayload(args)));
      case "clone_dom_subtree":
        return this.wrap(
          await this.dispatch("DOM_MUTATE", {
            operation: "clone_subtree",
            target: args.target,
            parent: args.parent,
            copyAttributes: args.copyAttributes
          })
        );
      case "mutate_dom_transaction":
        return this.wrap(await this.dispatch("DOM_MUTATE_TRANSACTION", args));
      case "undo_dom_mutation":
        return this.wrap(await this.dispatch("UNDO_DOM_MUTATION", {}));
      case "redo_dom_mutation":
        return this.wrap(await this.dispatch("REDO_DOM_MUTATION", {}));
      case "get_mutation_history":
        return this.wrap(await this.dispatch("GET_MUTATION_HISTORY", args));
      // --- Command sequences & recording ---
      case "execute_command_sequence": {
        const executor = this.executorForSequence();
        const result = await this.sequenceEngine.execute(args.steps || [], executor, { stopOnError: args.stopOnError });
        return this.wrap(result);
      }
      case "record_commands_start": {
        const rec = this.commandRecorder.start(args.name, args.description, args.tags || []);
        return this.wrap({ recordingId: rec.recordingId, name: rec.name, active: true, note: "All subsequent tool calls (in this server process) are recorded until record_commands_stop." });
      }
      case "record_commands_stop": {
        const finished = this.commandRecorder.stop();
        if (!finished) {
          return this.wrap({ stopped: false, message: "No recording was active." });
        }
        const file = this.recordings.save(finished);
        return this.wrap({ stopped: true, recording: finished, savedTo: file });
      }
      case "list_command_recordings":
        return this.wrap(this.recordings.list());
      case "get_command_recording": {
        const rec = this.recordings.load(args.recordingId);
        if (!rec) return this.err(`RECORDING_NOT_FOUND: no recording "${args.recordingId}"`);
        return this.wrap(rec);
      }
      case "replay_command_recording": {
        const rec = this.recordings.load(args.recordingId);
        if (!rec) return this.err(`RECORDING_NOT_FOUND: no recording "${args.recordingId}"`);
        const executor = this.executorForSequence();
        const steps = rec.commands.map((c) => ({ commandId: c.commandId, tool: c.tool, args: c.args }));
        const result = await this.sequenceEngine.execute(steps, executor, { stopOnError: args.stopOnError !== false });
        return this.wrap({ replayed: rec.recordingId, ...result });
      }
      case "export_command_recording": {
        const rec = this.recordings.load(args.recordingId);
        if (!rec) return this.err(`RECORDING_NOT_FOUND: no recording "${args.recordingId}"`);
        const json = JSON.stringify({ schemaVersion: "1.0.0", exportedAt: Date.now(), recording: rec }, null, 2);
        let saveInfo = void 0;
        if (args.outputPath) saveInfo = this.saveToFile(args.outputPath, json);
        return this.wrap({ recordingId: rec.recordingId, json: json.length > 5e4 ? json.slice(0, 5e4) + "…[truncated]" : json, savedTo: saveInfo?.outputPath });
      }
      case "import_command_recording": {
        const rec = this.recordings.importFromJson(args.recordingJson);
        return this.wrap({ imported: true, recordingId: rec.recordingId, name: rec.name, commandCount: rec.commandCount });
      }
      case "delete_command_recording": {
        const deleted = this.recordings.delete(args.recordingId);
        return this.wrap({ deleted, recordingId: args.recordingId });
      }
      // --- Session, timeline, page states ---
      case "get_browser_session": {
        const doc = this.document();
        const controller = this.localController;
        let viewportState = { width: 0, height: 0, isModified: false };
        try {
          const vs = await this.dispatch("GET_VIEWPORT_STATE", {});
          viewportState = { width: vs.width, height: vs.height, isModified: vs.isModified };
        } catch {
        }
        const summary = controller.session.summary(doc, viewportState, true, []);
        return this.wrap({ ...summary, note: "Session model reflects this server process's live + simulation state." });
      }
      case "get_action_timeline":
        return this.wrap(this.localController.session.timeline.query(args));
      case "get_operation_trace": {
        if (args.operationId) {
          const trace = this.localController.session.operations.trace(args.operationId);
          if (!trace) return this.err(`OPERATION_NOT_FOUND: ${args.operationId}`);
          return this.wrap(trace);
        }
        return this.wrap(this.localController.session.operations.recent(args.limit || 20));
      }
      case "capture_page_state":
        return this.wrap(await this.dispatch("CAPTURE_PAGE_STATE", {}));
      case "list_page_states":
        return this.wrap(this.localController.session.listSnapshots());
      case "compare_page_states": {
        let snaps = this.localController.session.listSnapshots();
        while (snaps.length < 2) {
          await this.localController.handleCommand({
            id: "snap_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            command: "CAPTURE_PAGE_STATE",
            timestamp: Date.now(),
            payload: {}
          }, this.document());
          snaps = this.localController.session.listSnapshots();
        }
        const idA = args.snapshotIdA || snaps[snaps.length - 2]?.snapshotId;
        const idB = args.snapshotIdB || snaps[snaps.length - 1]?.snapshotId;
        const a = this.localController.session.getSnapshot(idA);
        const b = this.localController.session.getSnapshot(idB);
        if (!a || !b) return this.err("SNAPSHOT_NOT_FOUND: one of the ids does not resolve.");
        return this.wrap({ snapshotIdA: idA, snapshotIdB: idB, ...this.localController.session.compareSnapshots(a, b) });
      }
      // --- Projects & knowledge ---
      case "create_page_project": {
        const doc = this.document();
        const win = doc.defaultView;
        const manifest = this.projectManager.createProject({
          name: args.name,
          description: args.description,
          url: args.url || win?.location?.href || "about:blank",
          title: args.title || doc.title || "Untitled page",
          viewport: {
            width: win?.innerWidth || 1280,
            height: win?.innerHeight || 800,
            devicePixelRatio: win?.devicePixelRatio || 1
          },
          domHtml: this.cleanDom(doc),
          extensionEnabled: true,
          readyState: doc.readyState
        });
        this.localController.session.bindProject(manifest.projectId);
        this.localController.session.timeline.record("PROJECT_CREATED", `project ${manifest.name} (${manifest.projectId})`);
        return this.wrap(manifest);
      }
      case "list_projects":
        return this.wrap(this.projectManager.listProjects().map((p) => ({
          name: p.name,
          projectId: p.projectId,
          description: p.description,
          regionCount: p.regionCount,
          pageCount: p.pageCount,
          commandRecordingCount: p.commandRecordingCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          tags: p.tags
        })));
      case "get_project": {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        return this.wrap(project);
      }
      case "delete_project":
        return this.wrap({ deleted: this.projectManager.deleteProject(args.projectName), projectName: args.projectName });
      case "capture_page_region":
      case "annotate_element": {
        const capture = await this.dispatch("CAPTURE_REGION", { target: args.target, selector: args.selector });
        let screenshotDataUrl;
        if (args.screenshot) {
          try {
            const shot = await this.dispatch("LIVE_ELEMENT_SCREENSHOT", { target: args.target, selector: args.selector });
            screenshotDataUrl = shot?.dataUrl;
          } catch {
          }
        }
        const doc = this.document();
        const annotation = this.projectManager.captureRegion(
          args.projectName,
          capture,
          {
            name: args.name,
            description: args.description,
            comment: args.comment,
            tags: args.tags || [],
            behavioralNotes: args.behavioralNotes,
            visualNotes: args.visualNotes
          },
          {
            tag: capture.bestSelector ? args.selector || capture.bestSelector : String(args.selector || ""),
            role: void 0,
            ownText: capture.nameHint?.name || "",
            fingerprintVolatility: capture.fingerprintVolatility || "medium",
            volatilityReasons: capture.volatilityReasons || [],
            sourceUrl: doc.defaultView?.location?.href || "",
            pageTitle: doc.title || "",
            extensionEnabled: true,
            screenshotDataUrl,
            capturedBy: "tool_call"
          },
          args.intendedChange,
          args.verification
        );
        annotation.observed.tag = capture.childTags?.length ? inferTagFromSelector(capture.bestSelector) : annotation.observed.tag;
        this.localController.session.timeline.record("REGION_CAPTURED", `region ${annotation.observed.name} (${annotation.observed.regionId})`);
        return this.wrap(annotation);
      }
      case "list_region_annotations": {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        return this.wrap(
          project.regions.map((r) => ({
            regionId: r.observed.regionId,
            name: r.observed.name,
            autoName: r.observed.autoName,
            tag: r.observed.tag,
            role: r.observed.role,
            selector: r.observed.selector,
            quality: r.analysis.qualityScore ? { grade: r.analysis.qualityScore.grade, overall: r.analysis.qualityScore.overall } : null,
            intendedChange: r.intendedChange?.statement || null,
            capturedAt: r.observed.capturedAt
          }))
        );
      }
      case "get_region_annotation": {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        const regionId = !args.regionId || args.regionId === "latest" ? project.regions[project.regions.length - 1]?.observed.regionId : args.regionId;
        const region = project.regions.find((r) => r.observed.regionId === regionId);
        if (!region) return this.err(`REGION_NOT_FOUND: "${args.regionId}"`);
        return this.wrap(region);
      }
      case "update_region_annotation": {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        const regionId = !args.regionId || args.regionId === "latest" ? project.regions[project.regions.length - 1]?.observed.regionId : args.regionId;
        const updated = this.projectManager.updateRegion(args.projectName, regionId, args);
        if (!updated) return this.err(`REGION_NOT_FOUND or PROJECT_NOT_FOUND`);
        return this.wrap(updated);
      }
      case "delete_region_annotation": {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        const regionId = !args.regionId || args.regionId === "latest" ? project.regions[project.regions.length - 1]?.observed.regionId : args.regionId;
        return this.wrap({ deleted: this.projectManager.deleteRegion(args.projectName, regionId) });
      }
      case "get_region_relationship_graph": {
        const doc = this.document();
        return this.wrap(this.projectManager.buildRegionGraph(args.projectName, doc));
      }
      case "generate_reconstruction_spec": {
        const domLength = this.document().documentElement?.outerHTML.length || 0;
        return this.wrap(this.projectManager.generateReconstructionSpec(args.projectName, domLength));
      }
      case "export_agent_package": {
        const result = this.exporter.export(args.projectName, args.outputDir);
        this.localController.session.timeline.record("PACKAGE_EXPORTED", `${result.packageDir} (${result.files.length} files)`);
        return this.wrap({
          packageDir: result.packageDir,
          fileCount: result.files.length,
          files: result.files,
          summary: result.summary,
          note: "Self-contained package: another agent can consume it without MCPDOM running."
        });
      }
      case "import_project": {
        const dir = path__default.resolve(args.projectDir);
        if (!fs__default.existsSync(path__default.join(dir, "project.json"))) {
          return this.err(`INVALID_PROJECT_DIR: no project.json under ${dir}`);
        }
        const manifest = JSON.parse(fs__default.readFileSync(path__default.join(dir, "project.json"), "utf-8"));
        const targetName = manifest.name || path__default.basename(dir);
        if (fs__default.existsSync(path__default.join(".mcpdom_projects", targetName))) {
          return this.err(`PROJECT_EXISTS: "${targetName}" already exists in working storage.`);
        }
        fs__default.cpSync(dir, path__default.join(".mcpdom_projects", targetName), { recursive: true });
        const imported = this.projectManager.getProject(targetName);
        return this.wrap({
          imported: true,
          name: targetName,
          regionCount: imported?.manifest.regionCount || 0,
          pageCount: imported?.manifest.pages?.length || 0
        });
      }
      // --- Redaction ---
      case "get_redaction_rules":
        return this.wrap(this.redaction.toJSON());
      case "set_redaction_rules": {
        for (const ruleId of args.disable || []) this.redaction.setRuleEnabled(ruleId, false);
        for (const ruleId of args.enable || []) this.redaction.setRuleEnabled(ruleId, true);
        let addedRule = void 0;
        if (args.addRule?.pattern) {
          addedRule = this.redaction.addRule({
            kind: args.addRule.kind || "value-pattern",
            pattern: args.addRule.pattern,
            description: args.addRule.description || "user-defined rule",
            enabled: true
          });
        }
        let addedExclusion = void 0;
        if (args.addExclusion?.selector) {
          addedExclusion = this.redaction.addExclusion(args.addExclusion.selector, args.addExclusion.reason || "user-defined exclusion");
        }
        return this.wrap({ applied: true, addedRule, addedExclusion, currentRules: this.redaction.getRules().length, currentExclusions: this.redaction.getExclusions().length });
      }
      // --- Discovery ---
      case "get_tool_catalog": {
        const catalog = buildToolCatalog();
        const filtered = args.group ? catalog.filter((c) => c.group === args.group) : catalog;
        return this.wrap({ total: filtered.length, catalog: filtered });
      }
      case "get_tool_groups":
        return this.wrap(TOOL_GROUPS);
      default:
        return this.err(`Unknown extended tool: ${name}`);
    }
  }
  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------
  executorForSequence() {
    return async (tool, args) => {
      const pipeline = this.toolsPipeline || globalThis.__MCPDOM_TOOLS_HANDLER__;
      if (pipeline?.handleToolCall) {
        const result = await pipeline.handleToolCall(tool, args || {});
        const isError = result.isError === true;
        const text = result.content?.[0]?.text || "";
        return {
          success: !isError,
          result: safeParse(text),
          error: isError ? text.slice(0, 300) : void 0,
          summary: isError ? `FAILED: ${text.slice(0, 120)}` : `OK: ${summarizeText(text)}`
        };
      }
      return { success: false, error: "NO_HANDLER", summary: "Tool handler unavailable for sequence execution." };
    };
  }
  fallbackDoc;
  document() {
    if (typeof document !== "undefined") return document;
    if (typeof window !== "undefined" && window.document) return window.document;
    if (!this.fallbackDoc) {
      try {
        const { JSDOM } = require("jsdom");
        this.fallbackDoc = new JSDOM('<!DOCTYPE html><html><head><title>TeleDOM Simulation</title></head><body><div id="root"></div></body></html>').window.document;
      } catch {
        this.fallbackDoc = {
          title: "TeleDOM Simulation",
          readyState: "complete",
          documentElement: {
            outerHTML: '<html><head><title>TeleDOM Simulation</title></head><body><div id="root"></div></body></html>',
            cloneNode: () => ({ outerHTML: '<html><head><title>TeleDOM Simulation</title></head><body><div id="root"></div></body></html>' })
          },
          defaultView: {
            location: { href: "http://localhost:3847/simulation" },
            innerWidth: 1280,
            innerHeight: 800
          },
          querySelector: () => null,
          querySelectorAll: () => [],
          getElementById: () => null
        };
      }
    }
    return this.fallbackDoc;
  }
  target(args) {
    return args.target || (args.selector ? { selector: args.selector } : void 0);
  }
  targetOf(args) {
    return args.target || (args.selector ? { selector: args.selector } : void 0);
  }
  mutationPayload(args) {
    return {
      operation: args.operation,
      target: args.target || (args.selector ? { selector: args.selector } : void 0),
      attribute: args.attribute,
      value: args.value,
      text: args.text,
      replacement: args.replacement,
      classes: args.classes,
      style: args.style,
      html: args.html,
      newElementHtml: args.newElementHtml,
      parent: args.parent,
      position: args.position,
      copyAttributes: args.copyAttributes
    };
  }
  cleanDom(doc) {
    if (!doc) return "<html><head></head><body></body></html>";
    const clone = doc.documentElement.cloneNode(true);
    const redaction = new RedactionEngine();
    return redaction.redactValue(clone.outerHTML);
  }
  async dispatch(command, payload) {
    if (this.bridgeClient) {
      try {
        return await this.bridgeClient.sendCommand(command, payload);
      } catch (bridgeErr) {
        const doc2 = this.document();
        const req2 = {
          id: `x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          command,
          timestamp: Date.now(),
          payload
        };
        const res2 = await this.localController.handleCommand(req2, doc2);
        if (res2.success) {
          return res2.data;
        }
        const localCode = res2.error?.code || "LOCAL_COMMAND_FAILED";
        const localMessage = res2.error?.message || "unknown local error";
        const combined = new Error(`${bridgeErr.message} | local fallback also failed: [${localCode}] ${localMessage}`);
        combined.code = localCode;
        throw combined;
      }
    }
    const doc = this.document();
    const req = {
      id: `x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      command,
      timestamp: Date.now(),
      payload
    };
    const res = await this.localController.handleCommand(req, doc);
    if (!res.success) {
      throw new Error(`[${res.error?.code || "COMMAND_FAILED"}] ${res.error?.message || "Browser command failed"}`);
    }
    return res.data;
  }
  wrap(data) {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return { content: [{ type: "text", text: text.length > 4e5 ? text.slice(0, 4e5) + "\n…[truncated]" : text }] };
  }
  err(message) {
    return { isError: true, content: [{ type: "text", text: message }] };
  }
  saveToFile(filePath, data) {
    const resolvedPath = path__default.resolve(filePath);
    const dir = path__default.dirname(resolvedPath);
    if (!fs__default.existsSync(dir)) fs__default.mkdirSync(dir, { recursive: true });
    fs__default.writeFileSync(resolvedPath, data);
    return { saved: true, outputPath: resolvedPath.replace(/\\/g, "/"), sizeBytes: fs__default.statSync(resolvedPath).size };
  }
}
function summarize(result) {
  const text = result?.content?.[0]?.text || "";
  return summarizeText(text);
}
function summarizeText(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      if (parsed.success === false) return "failed";
      const keys = Object.keys(parsed).slice(0, 6);
      return `object with keys [${keys.join(", ")}]`;
    }
    return String(parsed).slice(0, 80);
  } catch {
    return text.slice(0, 80);
  }
}
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function inferTagFromSelector(selector) {
  const m = /^([a-z0-9-]+)/i.exec(selector || "");
  return m ? m[1].toLowerCase() : "div";
}
class MCPToolsHandler {
  storage;
  liveToolsHandler;
  extendedToolsHandler;
  constructor(storage, liveToolsHandler, extendedToolsHandler) {
    this.storage = storage;
    this.liveToolsHandler = liveToolsHandler || new LiveToolsHandler();
    this.extendedToolsHandler = extendedToolsHandler || new ExtendedToolsHandler(this.liveToolsHandler.getLocalController());
    this.extendedToolsHandler.setToolsPipeline(this);
  }
  getLiveToolsHandler() {
    return this.liveToolsHandler;
  }
  getExtendedToolsHandler() {
    return this.extendedToolsHandler;
  }
  async handleToolCall(name, args) {
    try {
      if (name === "list_tabs" || name === "focus_tab" || name === "reload_tab" || name === "close_tab" || name === "open_tab" || name === "list_extensions" || name === "reload_extension" || name === "set_extension_enabled" || name === "toggle_extension" || name === "execute_pipeline" || name === "compare_extension_states" || name === "get_tab_console_logs" || name === "get_tab_network_requests" || name === "inspect_live_page" || name === "inspect_live_element" || name === "get_selected_element" || name === "start_element_picker" || name === "stop_element_picker" || name === "capture_page_screenshot" || name === "capture_element_screenshot" || name === "interact_with_element" || name === "start_element_observation" || name === "stop_element_observation" || name === "get_live_dom_snapshot" || name === "get_live_dom_subtree" || name === "get_element_visual_state") {
        return await this.liveToolsHandler.handleToolCall(name, args);
      }
      if (this.extendedToolsHandler.knows(name)) {
        return await this.extendedToolsHandler.handleToolCall(name, args);
      }
      switch (name) {
        case "list_sessions":
          return await this.handleListSessions(args);
        case "get_session":
          return await this.handleGetSession(args);
        case "export_session":
          return await this.handleExportSession(args);
        case "import_session":
          return await this.handleImportSession(args);
        case "delete_session":
          return await this.handleDeleteSession(args);
        case "get_timeline":
          return await this.handleGetTimeline(args);
        case "get_events":
          return await this.handleGetEvents(args);
        case "get_events_around":
          return await this.handleGetEventsAround(args);
        case "get_dom_state":
          return await this.handleGetDOMState(args);
        case "get_dom_node":
          return await this.handleGetDOMNode(args);
        case "get_dom_subtree":
          return await this.handleGetDOMSubtree(args);
        case "diff_dom":
          return await this.handleDiffDOM(args);
        case "trace_element":
          return await this.handleTraceElement(args);
        case "find_disappearing_elements":
          return await this.handleFindDisappearingElements(args);
        case "why_did_element_disappear":
          return await this.handleWhyDidElementDisappear(args);
        case "get_diagnostics":
          return await this.handleGetDiagnostics(args);
        case "get_network_events":
          return await this.handleGetNetworkEvents(args);
        case "get_screenshots":
          return await this.handleGetScreenshots(args);
        case "annotate_session":
          return await this.handleAnnotateSession(args);
        case "get_annotations":
          return await this.handleGetAnnotations(args);
        case "get_recording_health":
          return await this.handleGetRecordingHealth(args);
        default:
          return {
            isError: true,
            content: [{ type: "text", text: `Unknown tool: ${name}` }]
          };
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Tool error in ${name}: ${err.message}` }]
      };
    }
  }
  async getReconstructor(sessionId) {
    const checkpoints = await this.storage.getCheckpoints(sessionId);
    const events = await this.storage.getEvents(sessionId);
    return new StateReconstructor(checkpoints, events);
  }
  async handleListSessions(args) {
    const sessions = await this.storage.listSessions();
    const limit = args.limit || 20;
    const items = sessions.slice(0, limit);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            totalSessions: sessions.length,
            sessions: items.map((s) => ({
              id: s.id,
              name: s.name,
              url: s.url,
              startTime: s.startTime,
              durationMs: s.durationMs,
              status: s.status,
              stats: s.stats
            }))
          }, null, 2)
        }
      ]
    };
  }
  async handleGetSession(args) {
    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      return { isError: true, content: [{ type: "text", text: `Session '${args.sessionId}' not found` }] };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(session, null, 2) }]
    };
  }
  async handleExportSession(args) {
    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      return { isError: true, content: [{ type: "text", text: `Session '${args.sessionId}' not found` }] };
    }
    const initialSnapshot = await this.storage.getInitialSnapshot(args.sessionId) || (await this.storage.getCheckpoints(args.sessionId))[0]?.snapshot;
    if (!initialSnapshot) {
      return { isError: true, content: [{ type: "text", text: "No snapshot available to export" }] };
    }
    const events = await this.storage.getEvents(args.sessionId);
    const checkpoints = await this.storage.getCheckpoints(args.sessionId);
    const annotations = await this.storage.getAnnotations(args.sessionId);
    const bundle = SessionSerializer.exportBundle(session, initialSnapshot, events, checkpoints, annotations);
    return {
      content: [{ type: "text", text: SessionSerializer.exportToJson(bundle) }]
    };
  }
  async handleImportSession(args) {
    const bundle = SessionSerializer.importFromJson(args.bundleJson);
    const integrity = SessionSerializer.validateIntegrity(bundle);
    await this.storage.saveSession(bundle.metadata);
    await this.storage.saveInitialSnapshot(bundle.metadata.id, bundle.initialSnapshot);
    await this.storage.appendEvents(bundle.metadata.id, bundle.events);
    for (const chk of bundle.checkpoints) {
      await this.storage.saveCheckpoint({ ...chk, sessionId: bundle.metadata.id });
    }
    for (const ann of bundle.annotations) {
      await this.storage.addAnnotation({ ...ann, sessionId: bundle.metadata.id });
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: `Session '${bundle.metadata.id}' successfully imported`,
            eventsCount: bundle.events.length,
            checkpointsCount: bundle.checkpoints.length,
            annotationsCount: bundle.annotations.length,
            integrity
          }, null, 2)
        }
      ]
    };
  }
  async handleDeleteSession(args) {
    const success = await this.storage.deleteSession(args.sessionId);
    return {
      content: [{ type: "text", text: JSON.stringify({ success, sessionId: args.sessionId }) }]
    };
  }
  async handleGetTimeline(args) {
    const session = await this.storage.getSession(args.sessionId);
    const events = await this.storage.getEvents(args.sessionId);
    const breakdown = {};
    for (const evt of events) {
      breakdown[evt.category] = (breakdown[evt.category] || 0) + 1;
    }
    const firstTime = events.length > 0 ? events[0].timestamp : 0;
    const lastTime = events.length > 0 ? events[events.length - 1].timestamp : 0;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            durationMs: lastTime - firstTime,
            firstTimestamp: firstTime,
            lastTimestamp: lastTime,
            totalEvents: events.length,
            categoryBreakdown: breakdown,
            sessionStatus: session?.status
          }, null, 2)
        }
      ]
    };
  }
  async handleGetEvents(args) {
    const events = await this.storage.getEvents(args.sessionId, {
      category: args.category,
      type: args.type,
      fromTimestamp: args.fromTimestamp,
      toTimestamp: args.toTimestamp,
      targetNodeId: args.targetNodeId,
      targetSelector: args.targetSelector,
      searchQuery: args.searchQuery,
      limit: args.limit || 50,
      offset: args.offset || 0
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            returnedEvents: events.length,
            events: events.map((e) => ({
              id: e.id,
              sequence: e.sequence,
              timestamp: e.timestamp,
              type: e.type,
              category: e.category,
              targetNodeId: e.targetNodeId,
              targetSelector: e.targetSelector,
              payload: e.payload
            }))
          }, null, 2)
        }
      ]
    };
  }
  async handleGetEventsAround(args) {
    const events = await this.storage.getEvents(args.sessionId);
    let targetTime = args.timestamp;
    if (typeof targetTime !== "number" && args.eventId) {
      const match = events.find((e) => e.id === args.eventId);
      if (match) targetTime = match.timestamp;
    }
    if (typeof targetTime !== "number") {
      return { isError: true, content: [{ type: "text", text: "Target timestamp or eventId must be provided" }] };
    }
    const windowMs = args.windowMs || 300;
    const windowEvents = events.filter((e) => Math.abs(e.timestamp - targetTime) <= windowMs);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            targetTimestamp: targetTime,
            windowMs,
            totalEventsInWindow: windowEvents.length,
            events: windowEvents
          }, null, 2)
        }
      ]
    };
  }
  async handleGetDOMState(args) {
    const reconstructor = await this.getReconstructor(args.sessionId);
    const snapshot = reconstructor.getStateAt({
      timestamp: args.timestamp,
      eventId: args.eventId
    });
    const format = args.format || "html";
    if (format === "html") {
      const treeBuilder = new VirtualTreeBuilder(snapshot.nodes, snapshot.rootId);
      const html = treeBuilder.toHTML();
      return {
        content: [{ type: "text", text: html }]
      };
    }
    if (format === "json_summary") {
      const activeNodes = Object.values(snapshot.nodes).filter((n) => !n.isDetached);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              snapshotId: snapshot.snapshotId,
              timestamp: snapshot.timestamp,
              sequence: snapshot.sequence,
              title: snapshot.title,
              url: snapshot.url,
              totalNodeCount: snapshot.totalNodeCount,
              activeNodes: activeNodes.map((n) => ({
                id: n.id,
                tag: n.tagName,
                selector: VirtualQueryEngine.computeSelector(n, snapshot.nodes),
                attributes: n.attributes,
                childrenCount: n.children?.length || 0
              }))
            }, null, 2)
          }
        ]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }]
    };
  }
  async handleGetDOMNode(args) {
    const reconstructor = await this.getReconstructor(args.sessionId);
    const snapshot = reconstructor.getStateAt({ timestamp: args.timestamp || 0 });
    let targetNode = args.nodeId ? snapshot.nodes[args.nodeId] : void 0;
    if (!targetNode && args.selector) {
      const match = VirtualQueryEngine.querySelector(args.selector, snapshot.rootId, snapshot.nodes);
      if (match) targetNode = match;
    }
    if (!targetNode) {
      return {
        isError: true,
        content: [{ type: "text", text: `Node not found in DOM state at timestamp ${args.timestamp}` }]
      };
    }
    const selector = VirtualQueryEngine.computeSelector(targetNode, snapshot.nodes);
    const parentNode = targetNode.parentId ? snapshot.nodes[targetNode.parentId] : null;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id: targetNode.id,
            tagName: targetNode.tagName,
            nodeType: targetNode.nodeType,
            selector,
            attributes: targetNode.attributes,
            textContent: targetNode.textContent,
            parentId: targetNode.parentId,
            parentSelector: parentNode ? VirtualQueryEngine.computeSelector(parentNode, snapshot.nodes) : null,
            childrenIds: targetNode.children,
            isDetached: targetNode.isDetached || false,
            isHidden: targetNode.isHidden || false,
            computedStyles: targetNode.computedStyles,
            boundingClientRect: targetNode.boundingClientRect
          }, null, 2)
        }
      ]
    };
  }
  async handleGetDOMSubtree(args) {
    const reconstructor = await this.getReconstructor(args.sessionId);
    const snapshot = reconstructor.getStateAt({ timestamp: args.timestamp || 0 });
    let targetId = args.nodeId;
    if (!targetId && args.selector) {
      const match = VirtualQueryEngine.querySelector(args.selector, snapshot.rootId, snapshot.nodes);
      if (match) targetId = match.id;
    }
    if (!targetId || !snapshot.nodes[targetId]) {
      return {
        isError: true,
        content: [{ type: "text", text: `Subtree target not found at timestamp ${args.timestamp}` }]
      };
    }
    const treeBuilder = new VirtualTreeBuilder(snapshot.nodes, targetId);
    const html = treeBuilder.toHTML(targetId);
    return {
      content: [{ type: "text", text: html }]
    };
  }
  async handleDiffDOM(args) {
    const reconstructor = await this.getReconstructor(args.sessionId);
    const s1 = reconstructor.getStateAt({ timestamp: args.t1, eventId: args.e1 });
    const s2 = reconstructor.getStateAt({ timestamp: args.t2, eventId: args.e2 });
    const diff = DOMDiffEngine.diff(s1, s2);
    const markdownFormatted = DiffFormatter.formatMarkdown(diff);
    return {
      content: [
        {
          type: "text",
          text: markdownFormatted + "\n\n" + JSON.stringify(diff, null, 2)
        }
      ]
    };
  }
  async handleTraceElement(args) {
    const events = await this.storage.getEvents(args.sessionId);
    const initialSnapshot = await this.storage.getInitialSnapshot(args.sessionId);
    const trace = LifecycleTracer.traceElement(
      { nodeId: args.nodeId, selector: args.selector },
      events,
      initialSnapshot || void 0
    );
    if (!trace) {
      return {
        isError: true,
        content: [{ type: "text", text: `Element could not be found to trace: ${JSON.stringify(args)}` }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(trace, null, 2) }]
    };
  }
  async handleFindDisappearingElements(args) {
    const events = await this.storage.getEvents(args.sessionId);
    const initialSnapshot = await this.storage.getInitialSnapshot(args.sessionId);
    const maxLifespan = args.maxLifespanMs || 5e3;
    const removedEvents = events.filter((e) => e.type === "DOM_MUTATION_REMOVE");
    const results = [];
    for (const rem of removedEvents) {
      const nodeId = rem.payload?.nodeId;
      if (nodeId) {
        const trace = LifecycleTracer.traceElement({ nodeId }, events, initialSnapshot || void 0);
        if (trace && trace.lifespanMs <= maxLifespan) {
          results.push({
            nodeId: trace.targetNodeId,
            tagName: trace.tagName,
            selector: trace.selectorHint,
            createdAt: trace.createdAt,
            removedAt: trace.removedAt,
            lifespanMs: trace.lifespanMs,
            mutationCount: trace.mutationCount
          });
        }
      }
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            maxLifespanMs: maxLifespan,
            disappearingElementsCount: results.length,
            elements: results
          }, null, 2)
        }
      ]
    };
  }
  async handleWhyDidElementDisappear(args) {
    const events = await this.storage.getEvents(args.sessionId);
    const initialSnapshot = await this.storage.getInitialSnapshot(args.sessionId);
    const report = DisappearingElementAnalyzer.analyze(args.target, events, initialSnapshot || void 0);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(report, null, 2)
        }
      ]
    };
  }
  async handleGetDiagnostics(args) {
    const events = await this.storage.getEvents(args.sessionId);
    const filtered = events.filter((e) => {
      if (e.category !== "CONSOLE" && e.category !== "ERROR") return false;
      if (typeof args.fromTimestamp === "number" && e.timestamp < args.fromTimestamp) return false;
      if (typeof args.toTimestamp === "number" && e.timestamp > args.toTimestamp) return false;
      if (args.level && args.level !== "all") {
        const level = e.payload?.level;
        if (args.level === "error" && e.category !== "ERROR" && level !== "error") return false;
        if (args.level !== "error" && level !== args.level) return false;
      }
      return true;
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            totalDiagnostics: filtered.length,
            diagnostics: filtered
          }, null, 2)
        }
      ]
    };
  }
  async handleGetNetworkEvents(args) {
    const events = await this.storage.getEvents(args.sessionId);
    const networkEvents = events.filter((e) => e.category === "NETWORK");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            totalNetworkEvents: networkEvents.length,
            events: networkEvents
          }, null, 2)
        }
      ]
    };
  }
  async handleGetScreenshots(args) {
    const events = await this.storage.getEvents(args.sessionId);
    const screenshotEvents = events.filter((e) => e.category === "SCREENSHOT");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            totalScreenshots: screenshotEvents.length,
            screenshots: screenshotEvents.map((s) => ({
              id: s.id,
              timestamp: s.timestamp,
              sequence: s.sequence,
              triggerReason: s.payload?.triggerReason,
              hasDataUrl: !!s.payload?.dataUrl
            }))
          }, null, 2)
        }
      ]
    };
  }
  async handleAnnotateSession(args) {
    const annotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: args.sessionId,
      timestamp: args.timestamp || 0,
      nodeId: args.nodeId,
      author: "AGENT",
      label: args.label,
      comment: args.comment,
      category: args.category || "NOTE",
      createdAt: Date.now()
    };
    await this.storage.addAnnotation(annotation);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: true, annotation }, null, 2)
        }
      ]
    };
  }
  async handleGetAnnotations(args) {
    const annotations = await this.storage.getAnnotations(args.sessionId);
    return {
      content: [{ type: "text", text: JSON.stringify({ sessionId: args.sessionId, annotations }, null, 2) }]
    };
  }
  async handleGetRecordingHealth(args) {
    const session = await this.storage.getSession(args.sessionId);
    if (!session) {
      return { isError: true, content: [{ type: "text", text: `Session '${args.sessionId}' not found` }] };
    }
    const initialSnapshot = await this.storage.getInitialSnapshot(args.sessionId);
    const events = await this.storage.getEvents(args.sessionId);
    const checkpoints = await this.storage.getCheckpoints(args.sessionId);
    const snapshotToUse = initialSnapshot || checkpoints[0]?.snapshot || {
      snapshotId: "snap_empty",
      sessionId: session.id,
      timestamp: 0,
      sequence: 0,
      rootId: 1,
      nodes: {},
      title: session.title || "",
      url: session.url || "",
      origin: session.origin || "",
      viewport: { width: 1920, height: 1080, scrollX: 0, scrollY: 0, devicePixelRatio: 1 },
      totalNodeCount: 0
    };
    const bundle = SessionSerializer.exportBundle(session, snapshotToUse, events, checkpoints);
    const integrity = SessionSerializer.validateIntegrity(bundle);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sessionId: args.sessionId,
            health: session.health,
            stats: session.stats,
            integrity
          }, null, 2)
        }
      ]
    };
  }
}
class MCPBridgeServer {
  port;
  storage;
  toolsHandler;
  httpServer = null;
  wss = null;
  activeSockets = /* @__PURE__ */ new Set();
  socketMetadata = /* @__PURE__ */ new Map();
  /** §55 liveness: last heartbeat (or any message) per socket. */
  clientHealth = /* @__PURE__ */ new Map();
  /** §53 fix: monotonically increasing client id counter — never reused. */
  clientIdCounter = 0;
  /** §55 liveness sweeper interval handle. */
  healthSweepInterval = null;
  pendingCommands = /* @__PURE__ */ new Map();
  constructor(port = 3847, storage) {
    this.port = port;
    this.storage = storage || new FileStorageProvider("./.forensic_sessions");
    this.toolsHandler = new MCPToolsHandler(this.storage);
    this.toolsHandler.getLiveToolsHandler().setBridgeClient(this);
    this.toolsHandler.getExtendedToolsHandler().setBridgeClient(this);
  }
  getToolsHandler() {
    return this.toolsHandler;
  }
  /**
   * BrowserBridgeClient implementation: Send live command to connected Chrome extension
   */
  async sendCommand(command, payload) {
    if (this.activeSockets.size === 0) {
      throw new Error("No active browser extension connected to MCP bridge");
    }
    const hasServiceWorker = Array.from(this.socketMetadata.values()).some((m) => m.clientType === "SERVICE_WORKER");
    if (command === "LIST_TABS" && !hasServiceWorker) {
      const tabsList = Array.from(this.socketMetadata.entries()).filter(([sock, meta]) => meta.clientType === "CONTENT_SCRIPT" && sock.readyState === WebSocket.OPEN).map(([sock, meta], idx) => ({
        id: idx + 1,
        socketId: meta.id,
        title: meta.title || "Untitled Tab",
        url: meta.url || "",
        active: true,
        status: "complete",
        clientType: meta.clientType
      }));
      if (tabsList.length > 0) {
        return {
          totalTabs: tabsList.length,
          tabs: tabsList
        };
      }
    }
    const commandId = `bridge_cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error(`Browser command '${command}' timed out after 8000ms`));
      }, 8e3);
      this.pendingCommands.set(commandId, { resolve, reject, timer });
      const msg = JSON.stringify({
        type: "BROWSER_COMMAND_REQUEST",
        id: commandId,
        command,
        payload,
        timestamp: Date.now()
      });
      let targets = [];
      for (const [sock, meta] of this.socketMetadata.entries()) {
        if (meta.clientType === "SERVICE_WORKER" && sock.readyState === WebSocket.OPEN) {
          targets.push(sock);
        }
      }
      if (targets.length === 0) {
        for (const [sock, meta] of this.socketMetadata.entries()) {
          if (meta.clientType === "CONTENT_SCRIPT" && sock.readyState === WebSocket.OPEN) {
            targets.push(sock);
          }
        }
      }
      if (targets.length === 0) {
        targets = Array.from(this.activeSockets);
      }
      let sentCount = 0;
      for (const ws of targets) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(msg);
            sentCount++;
          } catch {
          }
        }
      }
      console.error(`[MCP Bridge] Dispatched command '${command}' (ID: ${commandId}) to ${sentCount} target socket(s)`);
      if (sentCount === 0) {
        clearTimeout(timer);
        this.pendingCommands.delete(commandId);
        reject(new Error("No open WebSocket connections available to dispatch command"));
      }
    });
  }
  start() {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }
        const url = req.url || "";
        if (url === "/health" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "ok",
              server: "browser-forensic-bridge",
              version: "3.0.0",
              connectedBrowsers: this.activeSockets.size
            })
          );
          return;
        }
        const MAX_PAYLOAD_BYTES = 50 * 1024 * 1024;
        if (url === "/api/sessions/upload" && req.method === "POST") {
          let body = "";
          let isTooLarge = false;
          req.on("data", (chunk) => {
            if (isTooLarge) return;
            body += chunk;
            if (body.length > MAX_PAYLOAD_BYTES) {
              isTooLarge = true;
              res.writeHead(413, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Payload too large (exceeds 50MB)" }));
              req.destroy();
            }
          });
          req.on("end", async () => {
            if (isTooLarge) return;
            try {
              const bundle = SessionSerializer.importFromJson(body);
              await this.storage.saveSession(bundle.metadata);
              await this.storage.saveInitialSnapshot(bundle.metadata.id, bundle.initialSnapshot);
              await this.storage.appendEvents(bundle.metadata.id, bundle.events);
              for (const chk of bundle.checkpoints) {
                await this.storage.saveCheckpoint(chk);
              }
              for (const ann of bundle.annotations) {
                await this.storage.addAnnotation(ann);
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, sessionId: bundle.metadata.id }));
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        if (url === "/api/clients" && req.method === "GET") {
          const clients = Array.from(this.socketMetadata.values());
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ total: clients.length, clients }));
          return;
        }
        if (url === "/api/tabs/close" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const result = await this.sendCommand("CLOSE_TAB", payload);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, result }));
            } catch (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        if (url === "/api/mcp/tool" && req.method === "POST") {
          let body = "";
          let isTooLarge = false;
          req.on("data", (chunk) => {
            if (isTooLarge) return;
            body += chunk;
            if (body.length > MAX_PAYLOAD_BYTES) {
              isTooLarge = true;
              res.writeHead(413, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Payload too large (exceeds 50MB)" }));
              req.destroy();
            }
          });
          req.on("end", async () => {
            if (isTooLarge) return;
            try {
              const { name, arguments: args } = JSON.parse(body);
              const result = await this.toolsHandler.handleToolCall(name, args || {});
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result));
            } catch (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ isError: true, error: err.message }));
            }
          });
          return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Endpoint not found" }));
      });
      this.httpServer.on("error", (err) => {
        reject(err);
      });
      this.httpServer.listen(this.port, () => {
        this.wss = new WebSocketServer({ server: this.httpServer });
        this.wss.on("error", () => {
        });
        this.healthSweepInterval = setInterval(() => {
          const now = Date.now();
          for (const [ws, lastSeen] of this.clientHealth.entries()) {
            if (now - lastSeen > 75e3) {
              console.error(`[MCP Bridge] Liveness sweep: pruning silent client (last seen ${Math.round((now - lastSeen) / 1e3)}s ago).`);
              try {
                ws.terminate();
              } catch {
              }
              this.activeSockets.delete(ws);
              this.socketMetadata.delete(ws);
              this.clientHealth.delete(ws);
            } else {
              try {
                ws.ping();
              } catch {
              }
            }
          }
        }, 3e4);
        this.healthSweepInterval?.unref?.();
        this.wss.on("connection", (ws) => {
          this.activeSockets.add(ws);
          console.error(`[MCP Bridge] Client connected. Total active clients: ${this.activeSockets.size}`);
          ws.on("close", () => {
            this.activeSockets.delete(ws);
            this.socketMetadata.delete(ws);
            this.clientHealth.delete(ws);
            console.error(`[MCP Bridge] Client disconnected. Total active clients: ${this.activeSockets.size}`);
          });
          ws.on("error", (err) => {
            this.activeSockets.delete(ws);
            this.socketMetadata.delete(ws);
            this.clientHealth.delete(ws);
            console.error(`[MCP Bridge] Client error: ${err.message}. Total active clients: ${this.activeSockets.size}`);
          });
          ws.on("message", async (data) => {
            try {
              const message = JSON.parse(data.toString());
              console.error(`[MCP Bridge] Inbound: ${JSON.stringify(message)}`);
              if (message.type === "HEARTBEAT" || message.type === "PING") {
                if (this.clientHealth.has(ws)) {
                  this.clientHealth.set(ws, Date.now());
                }
                try {
                  ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
                } catch {
                }
                return;
              }
              if (message.type === "REGISTER_CLIENT") {
                const clientInfo = {
                  // §53 fix: unique monotonically-increasing socket ids —
                  // `size + 1` collided after disconnects.
                  id: `tab_${++this.clientIdCounter}`,
                  clientType: message.clientType || "CONTENT_SCRIPT",
                  url: message.url || "",
                  title: message.title || "",
                  connectedAt: Date.now()
                };
                this.socketMetadata.set(ws, clientInfo);
                this.clientHealth.set(ws, Date.now());
                console.error(`[MCP Bridge] Registered client [${clientInfo.id}]: ${clientInfo.title} (${clientInfo.url})`);
                return;
              }
              if (message.type === "BROWSER_COMMAND_RESPONSE" && message.id) {
                const pending = this.pendingCommands.get(message.id);
                if (pending) {
                  if (!message.success && (message.error?.code === "UNKNOWN_COMMAND" || message.error?.message?.includes("Unsupported command")) && this.activeSockets.size > 1) {
                    return;
                  }
                  clearTimeout(pending.timer);
                  this.pendingCommands.delete(message.id);
                  if (message.success) {
                    pending.resolve(message.data);
                  } else {
                    pending.reject(new Error(message.error?.message || "Browser command failed"));
                  }
                }
                return;
              }
              if (message.type === "ELEMENT_SELECTED" && message.elementInfo) {
                this.toolsHandler.getLiveToolsHandler().getLocalController().getPicker().setSelectedElement(message.elementInfo);
                return;
              }
              if (message.type === "SESSION_START" || message.type === "FORENSIC_SESSION_START") {
                await this.storage.saveSession(message.metadata);
                if (message.initialSnapshot) {
                  await this.storage.saveInitialSnapshot(message.metadata.id, message.initialSnapshot);
                }
              } else if (message.type === "EVENTS_CHUNK" || message.type === "FORENSIC_EVENTS_CHUNK") {
                await this.storage.appendEvents(message.sessionId, message.events);
              } else if (message.type === "CHECKPOINT" || message.type === "FORENSIC_CHECKPOINT") {
                await this.storage.saveCheckpoint(message.checkpoint);
              } else if (message.type === "SESSION_STOP" || message.type === "FORENSIC_SESSION_STOP") {
                const session = await this.storage.getSession(message.sessionId);
                if (session) {
                  session.status = "stopped";
                  session.endTime = Date.now();
                  if (message.durationMs) session.durationMs = message.durationMs;
                  await this.storage.saveSession(session);
                }
              }
            } catch (err) {
              console.error("[MCPBridge] WebSocket message processing error:", err);
            }
          });
        });
        resolve();
      });
    });
  }
  stop() {
    return new Promise((resolve) => {
      if (this.healthSweepInterval) {
        clearInterval(this.healthSweepInterval);
        this.healthSweepInterval = null;
      }
      for (const [_, pending] of this.pendingCommands) {
        clearTimeout(pending.timer);
        pending.reject(new Error("MCP Bridge stopped"));
      }
      this.pendingCommands.clear();
      this.activeSockets.clear();
      this.clientHealth.clear();
      if (this.wss) {
        this.wss.close();
      }
      if (this.httpServer) {
        this.httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
export {
  FileStorageProvider as F,
  MCPDOM_V3_TOOLS as M,
  MCPBridgeServer,
  MCPToolsHandler as a
};

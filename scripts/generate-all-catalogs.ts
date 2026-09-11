import fs from 'fs';
import path from 'path';
import { FORENSIC_MCP_TOOLS } from '../dist/server/mcp-server.js';
// Registry metadata is derived from the fresh dist build (the src tree is
// not loadable under node type-stripping). Capability categories/descriptions
// are extracted from the built intelligence registry via a tiny inline parse.
type Cap = { id: string; category: string; description: string; securityClass: string };
function loadCapabilities(): Cap[] {
  // vitest/vite bundle keeps the registry only inside the single-file build;
  // re-derive it from the authoritative source spec (same shape as the registry).
  const registrySrc = fs.readFileSync(path.resolve(process.cwd(), 'src/intelligence/registry/capabilities.ts'), 'utf-8');
  const specs = [...registrySrc.matchAll(/\{ id: '(td_[a-z0-9_]+)', cat: '([a-z-]+)', desc: '((?:[^'\\]|\\.)*)'[^}]*?\}/g)].map((m) => ({
    id: m[1],
    category: m[2],
    description: m[3].replace(/\\'/g, "'"),
    securityClass: 'read-only',
  }));
  return specs as Cap[];
}
const CAPABILITY_REGISTRY = loadCapabilities();

const projectRoot = process.cwd();

console.log('Total tools in FORENSIC_MCP_TOOLS:', FORENSIC_MCP_TOOLS.length);

const capMap = new Map();
for (const c of CAPABILITY_REGISTRY) {
  capMap.set(c.id, c);
}

// Translate tool categories, descriptions, parameter names into Persian
const categoryTranslations: Record<string, string> = {
  'temporal-intelligence': 'هوش زمانی و تاریخچه DOM (Temporal Intelligence)',
  'evidence-provenance': 'مدیریت شواهد، اصالت و اثبات (Evidence & Provenance)',
  'causal-intelligence': 'تحلیل و استدلال علّی ریشه‌ای (Causal Intelligence)',
  'semantic-component': 'تحلیل سمانتیک و کامپوننت‌های وب (Semantic & Component)',
  'targeting-interaction': 'هدف‌گیری هوشمند و تعامل مقاوم (Targeting & Interaction)',
  'counterfactual-simulation': 'شبیه‌سازی خلاف‌واقع و پیش‌بینی (Counterfactual Simulation)',
  'reliability-recovery': 'تاب‌آوری، خودترمیمی و گاردین منابع (Reliability & Recovery)',
  'security-intelligence': 'امنیت مرورگر و مدل Zero-Trust (Security Intelligence)',
  'performance-memory-visual': 'عملکرد، تحلیل حافظه و رگرسیون بصری (Performance & Memory)',
  'investigation-orchestration': 'بازرسی خودکار و مدیریت حوادث (Autonomous Investigation)',
  'browser-primitives': 'پریمیتیوهای مرورگر — فاساد تمیز عامل‌محور (Browser Primitives, v4.1)',
  'workflow-runtime': 'ران‌تایم ورک‌فلوی عامل‌محور — اجرای خام و سوابق قطعی (Agent-Owned Workflow Runtime, v4.1)',
  'agent-owned-tooling': 'ابزارهای متعلق به ایجنت — حافظه تارگت و آرتیفکت‌ها (Agent-Owned Tooling, v4.1)',
  'DevTools Input Automation': 'ابزارهای ورودی و تعامل DevTools (Input Automation)',
  'DevTools Page & Navigation': 'مدیریت صفحات، تب‌ها و ناوبری DevTools (Page & Navigation)',
  'DevTools Network & Console': 'پایش شبکه و لاگ‌های کنسول DevTools (Network & Console)',
  'DevTools Inspection & Emulation': 'بازرسی عناصر، شبیه‌سازی و اسکرین‌شات (Inspection & Emulation)',
  'DevTools Performance & Memory': 'ردیابی عملکرد، لایت‌هاوس و هیپ مموری (Performance & Heapsnapshot)',
  'DevTools Extensions & WebMCP': 'مدیریت افزونه‌ها و ابزارهای شخص ثالث (Extensions & WebMCP)',
  'Forensics Correlation & Diagnostics': 'همبستگی جرم‌شناسی و تحلیل ریشه‌ای (Forensic Diagnostics)',
  'Forensics Timeline & Diff': 'دیف چندبعدی و ردیابی تایم‌لاین (Forensic Diffs)',
  'Forensics Safety & Governance': 'حکمرانی امنیت، گاردین و ژورنال تراکنش‌ها (Forensic Safety & Governance)',
  'Core Forensic Recording': 'ضبط رویدادهای مرورگر و مدیریت سشن‌ها (Session Management)',
  'Live Inspection & Observation': 'بازرسی زنده DOM و ناظر تغییرات (Live Inspection & Observer)',
  'DOM Mutation & Transactions': 'جهش‌های ایمن، تراکنش‌ها و Undo/Redo (DOM Mutation Engine)',
  'Project Management & Replay': 'پروژه‌های بازسازی و ضبط جریان تعامل (Project Capture & Replay)'
};

function categorizeTool(name: string): { en: string; fa: string } {
  if (name.startsWith('td_temporal_')) return { en: 'Temporal Intelligence (td_*)', fa: categoryTranslations['temporal-intelligence'] };
  if (name.startsWith('td_evidence_')) return { en: 'Evidence & Provenance (td_*)', fa: categoryTranslations['evidence-provenance'] };
  if (name.startsWith('td_cause_')) return { en: 'Causal Intelligence (td_*)', fa: categoryTranslations['causal-intelligence'] };
  if (name.startsWith('td_semantic_') || name.startsWith('td_component_') || name.startsWith('td_accessibility_')) return { en: 'Semantic & Component Intelligence (td_*)', fa: categoryTranslations['semantic-component'] };
  if (name.startsWith('td_target_') || name.startsWith('td_interactive_') || name.startsWith('td_input_') || name.startsWith('td_drag_')) return { en: 'Targeting & Interaction Intelligence (td_*)', fa: categoryTranslations['targeting-interaction'] };
  if (name.startsWith('td_branch_') || name.startsWith('td_counterfactual_') || name.startsWith('td_predict_') || name.startsWith('td_simulate_')) return { en: 'Counterfactual Simulation (td_*)', fa: categoryTranslations['counterfactual-simulation'] };
  if (name.startsWith('td_runtime_') || name.startsWith('td_guardian_') || name.startsWith('td_session_') || name.startsWith('td_health_') || name.startsWith('td_storage_') || name.startsWith('td_transport_')) return { en: 'Reliability & Recovery (td_*)', fa: categoryTranslations['reliability-recovery'] };
  if (name.startsWith('td_security_') || name.startsWith('td_origin_') || name.startsWith('td_instruction_') || name.startsWith('td_audit_') || name.startsWith('td_redaction_') || name.startsWith('td_policy_') || name.startsWith('td_gate_')) return { en: 'Security & Zero-Trust (td_*)', fa: categoryTranslations['security-intelligence'] };
  if (name.startsWith('td_perf_') || name.startsWith('td_render_') || name.startsWith('td_layout_') || name.startsWith('td_memory_') || name.startsWith('td_visual_') || name.startsWith('td_font_')) return { en: 'Performance & Memory Intelligence (td_*)', fa: categoryTranslations['performance-memory-visual'] };
  if (name.startsWith('td_investigate') || name.startsWith('td_incident_') || name.startsWith('td_workflow_') || name.startsWith('td_context_') || name.startsWith('td_memory_') || name.startsWith('td_agent_') || name.startsWith('td_report_')) return { en: 'Autonomous Investigation & Orchestration (td_*)', fa: categoryTranslations['investigation-orchestration'] };
  
  if (name.startsWith('dt_click') || name.startsWith('dt_drag') || name.startsWith('dt_fill') || name.startsWith('dt_handle_dialog') || name.startsWith('dt_hover') || name.startsWith('dt_press_key') || name.startsWith('dt_type_text') || name.startsWith('dt_upload_file')) {
    return { en: 'DevTools Input Automation (dt_*)', fa: categoryTranslations['DevTools Input Automation'] };
  }
  if (name.startsWith('dt_list_pages') || name.startsWith('dt_select_page') || name.startsWith('dt_new_page') || name.startsWith('dt_close_page') || name.startsWith('dt_navigate_page') || name.startsWith('dt_history_navigation') || name.startsWith('dt_wait_for') || name.startsWith('dt_emulate') || name.startsWith('dt_resize_page')) {
    return { en: 'DevTools Page & Navigation (dt_*)', fa: categoryTranslations['DevTools Page & Navigation'] };
  }
  if (name.startsWith('dt_list_network') || name.startsWith('dt_get_network') || name.startsWith('dt_evaluate_script') || name.startsWith('dt_list_console') || name.startsWith('dt_get_console') || name.startsWith('dt_take_screenshot') || name.startsWith('dt_take_snapshot') || name.startsWith('dt_screencast')) {
    return { en: 'DevTools Network, Console & Snapshot (dt_*)', fa: categoryTranslations['DevTools Network & Console'] };
  }
  if (name.startsWith('dt_performance') || name.startsWith('dt_lighthouse') || name.startsWith('dt_take_heapsnapshot') || name.startsWith('dt_close_heapsnapshot') || name.startsWith('dt_heapsnapshot_') || name.startsWith('dt_query_heapsnapshot') || name.startsWith('dt_compare_heapsnapshots')) {
    return { en: 'DevTools Performance, Memory & Lighthouse (dt_*)', fa: categoryTranslations['DevTools Performance & Memory'] };
  }
  if (name.startsWith('dt_install_extension') || name.startsWith('dt_list_extensions') || name.startsWith('dt_reload_extension') || name.startsWith('dt_trigger_extension') || name.startsWith('dt_uninstall_extension') || name.startsWith('dt_list_3p') || name.startsWith('dt_execute_3p') || name.startsWith('dt_list_webmcp') || name.startsWith('dt_execute_webmcp')) {
    return { en: 'DevTools Extensions & WebMCP (dt_*)', fa: categoryTranslations['DevTools Extensions & WebMCP'] };
  }

  if (name.startsWith('fx_')) {
    return { en: 'Advanced Forensic Capabilities (fx_*)', fa: categoryTranslations['Forensics Correlation & Diagnostics'] };
  }

  if (name.includes('session') || name.includes('tab') || name.includes('export') || name.includes('import') || name.includes('recording') || name.includes('timeline')) {
    return { en: 'Core Forensic Recording & Sessions', fa: categoryTranslations['Core Forensic Recording'] };
  }
  if (name.includes('mutate') || name.includes('undo') || name.includes('redo') || name.includes('clone') || name.includes('execute_command')) {
    return { en: 'DOM Mutation & Safe Transactions', fa: categoryTranslations['DOM Mutation & Transactions'] };
  }
  if (name.includes('inspect') || name.includes('picker') || name.includes('observation') || name.includes('snapshot') || name.includes('subtree') || name.includes('selector') || name.includes('computed_style') || name.includes('viewport')) {
    return { en: 'Live DOM Inspection & Observation', fa: categoryTranslations['Live Inspection & Observation'] };
  }
  if (name.includes('project') || name.includes('region') || name.includes('annotation') || name.includes('reconstruction')) {
    return { en: 'Project Capture & Page Reconstruction', fa: categoryTranslations['Project Management & Replay'] };
  }

  return { en: 'General Browser Intelligence & Control', fa: 'ابزارهای عمومی پلتفرم و کنترل مرورگر' };
}

// Generate English Catalog
let enMd = `# TeleDOM v4.1 — Complete 350 Tools Catalog & Reference Manual

**Platform Version**: 4.1.0  
**Total Agent-Facing Tools**: 350  
**Tool Namespaces**: 
- \`td_*\`: 144 TeleDOM Intelligence + Agent-Owned Workflow Runtime Tools (100 v4 intelligence + 44 v4.1)
- \`dt_*\`: 54 Chrome DevTools Protocol Compatibility Tools
- \`fx_*\`: 31 Advanced Forensic Primitives & Diagnostic Tools
- Base / v3: 121 Core Session Recording, Live DOM Inspection & Safe Mutation Tools

---

## Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [TeleDOM Intelligence + Workflow Runtime (144 td_* Tools)](#1-teledom-v4-intelligence-tools-td_)
3. [Chrome DevTools Compatibility Tools (54 dt_* Tools)](#2-chrome-devtools-compatibility-tools-dt_)
4. [Advanced Forensic Diagnostic Tools (31 fx_* Tools)](#3-advanced-forensic-diagnostic-tools-fx_)
5. [Core Session, Live Inspection & Mutation Tools (121 Tools)](#4-core-session-live-inspection--mutation-tools)

---

`;

// Generate Persian Catalog
let faMd = `# راهنمای مرجع و کاتالوگ جامع ۳۰۶ ابزار پلتفرم TeleDOM v4

**نسخه پلتفرم**: 4.0.0  
**تعداد کل ابزارهای در دسترس ایجنت**: ۳۰۶ ابزار رسمی  
**فضاهای نامی ابزارها (Namespaces)**:
- خانواده \`td_*\`: ۱۴۴ ابزار هوش زمانی، استدلال علّی و بازرسی خودکار
- خانواده \`dt_*\`: ۵۴ ابزار تعاملی و مانیتورینگ پروتکل DevTools کروم
- خانواده \`fx_*\`: ۳۱ ابزار پیشرفته جرم‌شناسی وب، دیف چندبعدی و ردیابی
- ابزارهای پایه و v3: ۱۲۱ ابزار ضبط رویدادها، بازرسی زنده و تراکنش‌های DOM

---

## فهرست دسته‌بندی‌ها
۱. [مقدمه و معماری ابزارها](#مقدمه-و-معماری-ابزارها)  
۲. [ابزارهای هوش زمانی و شناختی TeleDOM v4 (۱۴۴ ابزار td_*)](#۱-ابزارهای-هوش-زمانی-و-شناختی-teledom-v4)  
۳. [ابزارهای سازگاری پروتکل Chrome DevTools (۵۴ ابزار dt_*)](#۲-ابزارهای-سازگاری-پروتکل-chrome-devtools)  
۴. [ابزارهای پیشرفته جرم‌شناسی وب (۳۱ ابزار fx_*)](#۳-ابزارهای-پیشرفته-جرمشناسی-وب)  
۵. [ابزارهای پایه مدیریت سشن، بازرسی زنده و جهش DOM (۱۲۱ ابزار)](#۴-ابزارهای-پایه-مدیریت-سشن-بازرسی-زنده-و-جهش-dom)  

---

`;

// Group tools by category
const enGroups = new Map();
const faGroups = new Map();

for (let i = 0; i < FORENSIC_MCP_TOOLS.length; i++) {
  const tool = FORENSIC_MCP_TOOLS[i];
  const cat = categorizeTool(tool.name);
  
  const enList = enGroups.get(cat.en) || [];
  enList.push({ tool, index: i + 1 });
  enGroups.set(cat.en, enList);

  const faList = faGroups.get(cat.fa) || [];
  faList.push({ tool, index: i + 1, enCat: cat.en });
  faGroups.set(cat.fa, faList);
}

// Populate EN
for (const [catName, items] of enGroups) {
  enMd += `\n## ${catName} (${items.length} Tools)\n\n`;
  for (const { tool, index } of items) {
    const props = tool.inputSchema?.properties || {};
    const req = tool.inputSchema?.required || [];
    enMd += `### ${index}. \`${tool.name}\`\n\n`;
    enMd += `**Description**: ${tool.description}\n\n`;
    
    const propKeys = Object.keys(props);
    if (propKeys.length > 0) {
      enMd += `**Parameters**:\n`;
      enMd += `| Parameter | Type | Required | Description |\n|---|---|:---:|---|\n`;
      for (const k of propKeys) {
        const p = props[k];
        const isReq = req.includes(k) ? 'Yes' : 'No';
        const type = p.type || (p.enum ? `enum(${p.enum.join('|')})` : 'any');
        enMd += `| \`${k}\` | \`${type}\` | ${isReq} | ${p.description || '-'} |\n`;
      }
      enMd += `\n`;
    } else {
      enMd += `*No parameters required.*\n\n`;
    }
    enMd += `---\n\n`;
  }
}

// Populate FA
for (const [catName, items] of faGroups) {
  faMd += `\n## ${catName} (${items.length} ابزار)\n\n`;
  for (const { tool, index } of items) {
    const props = tool.inputSchema?.properties || {};
    const req = tool.inputSchema?.required || [];
    faMd += `### ${index}. ابزار \`${tool.name}\`\n\n`;
    faMd += `**توضیحات و عملکرد**: ${tool.description}\n\n`;
    
    const propKeys = Object.keys(props);
    if (propKeys.length > 0) {
      faMd += `**پارامترهای ورودی**:\n`;
      faMd += `| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |\n|---|---|:---:|---|\n`;
      for (const k of propKeys) {
        const p = props[k];
        const isReq = req.includes(k) ? 'بله' : 'خیر';
        const type = p.type || (p.enum ? `انتخابی (${p.enum.join('، ')})` : 'نامشخص');
        faMd += `| \`${k}\` | \`${type}\` | ${isReq} | ${p.description || '-'} |\n`;
      }
      faMd += `\n`;
    } else {
      faMd += `*این ابزار نیاز به پارامتر ورودی ندارد.*\n\n`;
    }
    faMd += `---\n\n`;
  }
}

fs.writeFileSync(path.join(projectRoot, 'docs/TOOLS_CATALOG_350_EN.md'), enMd);
fs.writeFileSync(path.join(projectRoot, 'docs/TOOLS_CATALOG_350_FA.md'), faMd);

console.log('Successfully generated docs/TOOLS_CATALOG_350_EN.md and docs/TOOLS_CATALOG_350_FA.md');

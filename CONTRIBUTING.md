# Contributing to TeleDOM

We welcome contributions to the **TeleDOM / MCPDOM Unified Browser Forensic & Intelligence Platform**! Whether you want to add new MCP tools, improve Chrome extension performance, or enhance DOM time-travel diffing algorithms, we are excited to have you.

---

## 🛠️ Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/TeleDOM.git
   cd TeleDOM
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build all modules** (client, extension, server):
   ```bash
   npm run build
   ```
5. **Run test suites**:
   ```bash
   # Run Vitest unit tests
   npm run test:unit

   # Run complete operational test suite
   npm run test:operational
   ```

---

## 📐 Architecture Guidelines

- **Zero Stdout Pollution**: During MCP server execution, never use `console.log()` on standard output. All diagnostic logs must route to `process.stderr`.
- **Zod Parameter Validation**: All tool schemas must be strictly typed using `z.object({...})` with descriptive metadata (`.describe()`).
- **Memory Safety**: Do not hold hard references to detached DOM nodes in long-lived caches; use `WeakMap` or string identifier lookups.

---

## 📬 Pull Request Process

1. Create a feature branch (`git checkout -b feat/my-new-tool`).
2. Implement your changes and add test cases in `tests/` or `operational-tests/`.
3. Verify that all 178 tests pass (`npm run test:operational`).
4. Commit using Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
5. Open a Pull Request targeting `master`.

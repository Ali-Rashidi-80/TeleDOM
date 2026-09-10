import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/sea',
    emptyOutDir: true,
    target: 'node20',
    ssr: true,
    rollupOptions: {
      input: {
        'sea-bundle': resolve(process.cwd(), 'src/sea-entry.ts'),
      },
      external: [
        'fs', 'path', 'http', 'https', 'readline', 'events', 'crypto', 'stream', 'url', 'os', 'child_process', 'util', 'buffer', 'net', 'tls', 'zlib', 'string_decoder', 'assert', 'perf_hooks', 'constants'
      ],
      output: {
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    },
  },
  ssr: {
    noExternal: true,
  },
});

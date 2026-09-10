import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function buildPortableExe() {
  console.log('======================================================');
  console.log('🔨 BUILDING WINDOWS PORTABLE EXECUTABLE (v2.1.0)');
  console.log('======================================================\n');

  const rootDir = process.cwd();
  const seaDir = path.join(rootDir, 'dist', 'sea');
  if (!fs.existsSync(seaDir)) {
    fs.mkdirSync(seaDir, { recursive: true });
  }

  // 1. Vite build SEA bundle
  console.log('[1/4] Bundling single-executable JavaScript bundle...');
  execSync('npx vite build --config vite.config.sea.ts', { stdio: 'inherit', cwd: rootDir });

  // 2. Generate SEA prep blob
  console.log('[2/4] Generating Node.js SEA preparation blob...');
  execSync('node --experimental-sea-config sea-config.json', { stdio: 'inherit', cwd: rootDir });

  // 3. Prepare node.exe copy
  const nodeExePath = process.execPath;
  const tempExePath = path.join(seaDir, 'McpDOM+Browser-Portable-2.1.0.exe');
  console.log(`[3/4] Copying runtime executable from: ${nodeExePath}...`);
  fs.copyFileSync(nodeExePath, tempExePath);

  // 4. Inject SEA blob into exe using postject
  console.log('[4/4] Injecting SEA blob into executable via postject...');
  const blobPath = path.join(seaDir, 'sea-prep.blob');
  
  // Use postject CLI
  const postjectCmd = `npx postject "${tempExePath}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`;
  execSync(postjectCmd, { stdio: 'inherit', cwd: rootDir });

  // Target paths
  const targetPaths = [
    'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM+Browser-Portable-2.1.0.exe',
    'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM+Browser-2.1.0-x64/McpDOM+Browser-2.1.0-x64/McpDOM+Browser-Portable-2.1.0.exe',
  ];

  for (const target of targetPaths) {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(tempExePath, target);
    console.log(`✔ Generated: ${target}`);
  }

  const stat = fs.statSync(tempExePath);
  console.log(`\n🎉 PORTABLE EXECUTABLE COMPILED SUCCESSFULLY!`);
  console.log(`Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Path: c:\\Users\\ASUS\\Downloads\\mcpdom-browser-complete-2.1.0\\McpDOM+Browser-Portable-2.1.0.exe\n`);
}

buildPortableExe().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

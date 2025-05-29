import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'backend', 'src');

async function processFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  const original = content;

  const importPattern = /from ['"]@\/(.*?)['"]/g;

  content = content.replace(importPattern, (_, subpath) => {
    const relativePath = path.relative(path.dirname(filePath), path.join(srcDir, subpath)).replace(/\\/g, '/');
    const fixed = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    return `from '${fixed}'`;
  });

  if (content !== original) {
    await fs.copyFile(filePath, filePath + '.bak');
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✔️ Fixed imports in: ${filePath}`);
  }
}

async function scanDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanDir(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      await processFile(fullPath);
    }
  }
}

await scanDir(srcDir);
console.log('✅ Done fixing all @ imports.');

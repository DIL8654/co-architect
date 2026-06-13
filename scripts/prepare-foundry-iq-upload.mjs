#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'docs', 'knowledge-base');
const outputRoot = path.join(repoRoot, 'artifacts', 'foundry-iq-upload');
const targetRoot = path.join(outputRoot, 'knowledge-base');

async function main() {
  await fs.rm(outputRoot, { recursive: true, force: true });
  await copyDirectory(sourceRoot, targetRoot);

  const files = await listFiles(targetRoot);
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'docs/knowledge-base',
    fileCount: files.length,
    files: files.map((file) => path.relative(outputRoot, file).replaceAll(path.sep, '/')),
  };

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Prepared Foundry IQ upload bundle at ${outputRoot}`);
}

async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function listFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

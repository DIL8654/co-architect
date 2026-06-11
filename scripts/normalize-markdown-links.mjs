import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs');
const absoluteRepoPrefix = '/Users/dilankamuthukumarana/Documents/sourcecodes/personal-projects/coarchitect/';
const markdownFiles = collectMarkdownFiles(repoRoot);
let changed = 0;

for (const file of markdownFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const updated = content.replaceAll(absoluteRepoPrefix, '');
  if (updated !== content) {
    fs.writeFileSync(file, updated);
    changed += 1;
  }
}

console.log(`Normalized links in ${changed} markdown files under ${path.relative(repoRoot, docsRoot)}.`);

function collectMarkdownFiles(root) {
  const files = [];
  walk(root, files);
  return files.filter((file) => file.endsWith('.md'));
}

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
}

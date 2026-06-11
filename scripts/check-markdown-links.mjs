import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs');
const markdownFiles = collectMarkdownFiles(repoRoot);
const issues = [];

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const link of extractMarkdownLinks(content)) {
    if (isIgnoredLink(link.target)) {
      continue;
    }

    const resolved = resolveLink(file, link.target);
    if (!fs.existsSync(resolved)) {
      issues.push({
        file,
        target: link.target,
        resolved,
      });
    }
  }
}

if (issues.length > 0) {
  console.error('Broken markdown links found:');
  for (const issue of issues) {
    console.error(`- ${path.relative(repoRoot, issue.file)} -> ${issue.target} (resolved: ${path.relative(repoRoot, issue.resolved)})`);
  }
  process.exitCode = 1;
} else {
  console.log(`Checked ${markdownFiles.length} markdown files under ${path.relative(repoRoot, docsRoot)} and found no broken internal links.`);
}

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

function extractMarkdownLinks(content) {
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    links.push({ target: match[1].trim() });
  }

  return links;
}

function isIgnoredLink(target) {
  return (
    !target ||
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:') ||
    target.startsWith('#') ||
    target.startsWith('file://') ||
    target.startsWith('C:\\') ||
    target.startsWith('/mnt/data/')
  );
}

function resolveLink(fromFile, target) {
  const [rawPath] = target.split('#');
  const [filePath] = rawPath.split('?');

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(path.dirname(fromFile), filePath);
}

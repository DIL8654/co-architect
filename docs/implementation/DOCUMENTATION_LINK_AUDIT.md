# Documentation Link Audit

## Purpose

Track and validate repository Markdown links so GitHub navigation stays clean.

## Scope

This audit covers:

- `README.md`
- `docs/**/*.md`
- `docs/knowledge-base/**/*.md`

## Validation Command

Run the link checker from the repository root:

```bash
node scripts/check-markdown-links.mjs
```

The script scans Markdown files, ignores external links and anchor-only links, and reports broken internal targets with non-zero exit status.

## Current Guidance

- use relative links inside docs
- use repository-relative links from root `README.md`
- do not use absolute filesystem paths in Markdown links
- keep archived docs clearly labeled as historical

## Future Enhancements

- add CI enforcement
- include link audit in release checklist

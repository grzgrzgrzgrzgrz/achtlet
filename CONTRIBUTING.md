# Contributing to Achtlet

Thanks for your interest in contributing. This document covers the basics.

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and fill in real values:
   ```bash
   cp .env.example .env
   # edit .env
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Branching & commits

- Work on a feature branch; do not commit directly to `main`.
- Keep commits focused. A commit should describe one logical change.
- Write commit messages in the imperative mood ("Add X", "Fix Y").

## Before opening a PR

- Run the type checker: `npm run check`
- Run tests: `npm test`
- Check production dependencies: `npm audit --omit=dev`
- Build the production bundle at least once: `npm run build`
- Make sure no secrets, credentials, cookies, `.env` files, or `backups/`
  data are staged. The provided `.gitignore` covers the common cases; a
  quick `git status` before pushing is still a good habit.

## Reporting security issues

Please **do not** open a public issue for security-relevant bugs. Instead,
open a private report via GitHub's "Report a vulnerability" flow on the
repository, or contact the maintainer directly.

## Scope

Achtlet is a thin management layer on top of the n8n REST API. Changes that
expand the scope beyond managing existing n8n resources (workflows,
executions, backups, credentials metadata) are likely out of scope and
should be discussed in an issue first.

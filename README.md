# Fantastic Battles army editor

Unofficial roster builder for Fantastic Battles 1.2. It is a static React app: armies are stored in the browser and can be shared as compressed URLs. It does not include the rulebook, PDFs, or the official spreadsheet.

## Run locally

```bash
npm install
npm test
npm run dev
```

## GitHub Pages

1. Push this repo to GitHub.
2. In the repository, enable **Pages** with the source **GitHub Actions**.
3. Push to `main`. The workflow builds with `BASE_PATH=/<repo-name>/` and deploys.

If the site is a user/org page (`username.github.io`) instead of a project page, set `BASE_PATH=/` in the workflow.

## Stack

Vite, React, TypeScript, Tailwind, Zustand, Zod, and a pure `src/domain` rules engine so a backend can be added later without rewriting army math.

## Documentation

- [Army editor stack](docs/army-editor-stack.md) -- original architecture plan, hosting model, catalog rules, and v1 checklist

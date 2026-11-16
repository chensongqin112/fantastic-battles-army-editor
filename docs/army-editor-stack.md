# Fantastic Battles army editor stack

This is the original architecture plan for the project. v1 of the plan is implemented in this repository.

**Overview:** a static React SPA (Vite + TypeScript) on GitHub Pages, with a rules engine and shareable army URLs that can later sit in front of a backend without a rewrite.

## Hosting

GitHub can host this for v1. GitHub Pages serves static files only (HTML/JS/CSS). A Vite-built React app is a normal Pages site. You cannot run a database or API on Pages. That is fine for the first version: army lists live in the browser and in share links. A later backend (Vercel, Fly.io, Cloudflare Workers, etc.) can reuse the same UI and rules code if we keep that logic out of React components.

Do **not** commit the PDFs, cover art, or the official .xlsx into the GitHub repo. Those files stay local as a reference. Encode the army-building catalog as our own JSON/TypeScript data (profiles, trait modifiers, exclusions, strategies). Do not copy rulebook prose or the published example army lists.

## Recommended stack (v1)

| Layer | Choice | Why |
|---|---|---|
| App | **Vite + React + TypeScript** | Fast SPA, first-class GitHub Pages deploy, easy to keep later |
| Routing | **React Router** with **HashRouter** (#/army/...) | Pages has no server rewrite; hash routes and share links both work |
| Styling | **Tailwind CSS** | Fast form-heavy UI (rosters, pickers, print view) without a component lock-in |
| Army state | **Zustand** (one army document) | Simple now; not tied to React so a future API client can reuse it |
| Catalog + validation | **JSON catalogs + Zod schemas** | Versioned army JSON; reject invalid share URLs; same schema can become the API contract |
| Rules engine | **Pure TypeScript module** (src/domain) | Points, trait caps, exclusion matrix, warlord required, strategy limits — unit-testable, no React |
| Persistence | **localStorage + compressed hash/query payload** (lz-string or similar) | Save locally and share a URL |
| Tests | **Vitest** on the domain layer | Spreadsheet-like cost math is the core; tests prevent drift when traits are added |
| CI/hosting | **GitHub Actions → GitHub Pages** | Build on push to main; set Vite ase to /repo-name/ for project pages |

**What to skip for now:** Next.js (SSR is unused on Pages), a database, auth, copying the Excel file into the browser, and a UI kit that fights print layouts.

## How the official builder maps to the app

The local Fantastic Battles 1.2 army builder spreadsheet is the behavior spec. Public Irregular Wars posts match it:

- One **warlord** (or necromancer); optional captains, magic-users, rogues; magic-users pick spells; optional relics
- **Companies** from seven bases (elite, formed, irregular, dragon, fantastic beast, vehicle, ordnance)
- Up to **three traits** per company plus one army **racial trope**
- **Strategies**, trait **exclusions**, and a **print roster**

v1 screens: army meta (name, points cap, trope, strategy) → add/edit companies and characters → live points and validation → print/export → copy share URL.

`mermaid
flowchart LR
  catalogs[JSON catalogs]
  domain[domain rules engine]
  store[Zustand army document]
  ui[React UI]
  persist[localStorage and share URL]
  catalogs --> domain
  ui --> store
  store --> domain
  store --> persist
`

## Future backend without a rewrite

Keep src/domain and the Zod ArmyDocument schema as the contract. Later you can add src/api that POSTs the same JSON to a small API. GitHub remains the **code** host; Pages stays the **static** host until you move the frontend to Vercel/Netlify if you want HTTPS APIs on the same origin.

Possible later API: Cloudflare Workers + D1, or a tiny Node/Hono service. Not needed until you want accounts.

## Project shape

- src/domain/ — profiles, traits, exclusions, points, validation
- src/data/ — versioned catalog JSON (1.2)
- src/state/ — army store, localStorage, URL codec
- src/ui/ — roster editor, trait pickers, print stylesheet

## v1 implementation checklist

- [x] Scaffold Vite + React + TypeScript + Tailwind, HashRouter, GitHub Pages workflow
- [x] Encode v1.2 profiles, traits, exclusions, strategies as JSON from the official builder (do not commit PDFs/xlsx)
- [x] Implement Zod ArmyDocument + points/validation in src/domain with Vitest
- [x] Build roster UI, localStorage, compressed share URLs, print view

# Implementation Report — Taash Find Card

## Status

**Phase 5 COMPLETE** — production deployment on Cloudflare Pages with executed smoke tests (2026-07-24).

Phase 4 closure audit remains the baseline for game behavior; Phase 5 changed hosting/adapter/CI/headers only (plus CSP hash post-build required for SvelteKit bootstrap compatibility).

## Architecture

- **SvelteKit (JavaScript)** UI shell — routes, HUD, cards, dialogs, a11y
- **Pure vanilla JS engine** in `src/lib/game/` — no Svelte/DOM/Three/audio imports
- **DOM semantic `<button>` cards** — authoritative interaction layer
- **Three.js** — lazy-loaded progressive enhancement; non-authoritative
- **Web Audio API** — procedural sounds; gesture-gated; mute; dispose
- **Vitest** + **Playwright** (local + deployed smoke)
- **Hosting:** Cloudflare Pages via `@sveltejs/adapter-static` SPA (`200.html` fallback)

## Production

- URL: https://taash-find-card.pages.dev
- Adapter: `@sveltejs/adapter-static`
- Headers: CSP (with rebuild script hashes), XCTO, Referrer-Policy, Permissions-Policy, X-Frame-Options / frame-ancestors
- Seed gating unchanged for normal production users
- CI: `.github/workflows/ci.yml`
- Details: `docs/deployment-report.md`

## Deterministic seed policy

- `?seed=` only when `isTestSeedAllowed()` (DEV / `navigator.webdriver` / `VITE_ALLOW_TEST_SEED`)
- Deployed smoke verifies `data-seed-active="0"` for non-automation browsers

## Asset license

See `docs/assets-license.md`.

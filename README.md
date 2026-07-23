# Taash — Find the Card

Browser card game: find the one face-down card that matches the target preview. One tap per round.

**Live:** https://taash-find-card.pages.dev

## Stack

- SvelteKit (JavaScript) + `@sveltejs/adapter-static`
- Pure vanilla JS game engine (`src/lib/game`)
- Three.js progressive enhancement
- Web Audio API
- Vitest + Playwright
- Cloudflare Pages hosting

## Scripts

```bash
npm run dev
npm run lint
npm run check
npm run test:unit -- --run
npm run build
npm run test:e2e
npm run verify
npm run deploy
LIVE_URL=https://taash-find-card.pages.dev npm run test:e2e:deployed
```

## Test helpers (automation / local only)

- `?seed=424242` — deterministic initial round (blocked for normal production users)
- `?motion=0` — skip deal delay
- `?webgl=0` — force DOM-only fallback

## Rules

Standard 52-card deck. Target preview is a reference clone (not a 53rd card). Exact match wins; anything else loses. Input locks after the first valid tap.

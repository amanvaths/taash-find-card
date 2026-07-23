# Deployment Report — Taash Find Card

## Status

**Phase 5 COMPLETE** — production deployment created and smoke-tested on 2026-07-24.

## Hosting

| Item              | Value                                                             |
| ----------------- | ----------------------------------------------------------------- |
| Platform          | Cloudflare Pages                                                  |
| Project           | `taash-find-card`                                                 |
| Account           | Matatofy@gmail.com's Account (`64910d534f478ce30ddba411f4d92da9`) |
| Production URL    | https://taash-find-card.pages.dev                                 |
| Production branch | `main`                                                            |
| Adapter           | `@sveltejs/adapter-static` (SPA fallback `200.html`)              |
| Client-only       | `ssr = false`, `csr = true`, `prerender = true`                   |

## Why this target

- Cloudflare OAuth succeeded in this environment (`wrangler login`).
- Game is fully client-side; static SPA + Pages `_headers` is the simplest production fit.
- Official Pages project created with `wrangler pages project create`.

## Deployment commands

```bash
npm run build
# = vite build && node scripts/apply-csp-hashes.js

npx wrangler pages project create taash-find-card --production-branch=main
npx wrangler pages deploy build --project-name=taash-find-card --branch=main --commit-dirty=true

# or
npm run deploy
```

Latest successful deploy preview alias (also promoted to production branch `main`):

- https://fd0b1f97.taash-find-card.pages.dev

Repository: https://github.com/amanvaths/taash-find-card

## Adapter / routing

- Replaced `@sveltejs/adapter-auto` with `@sveltejs/adapter-static`.
- `fallback: '200.html'` enables direct deep-link / refresh on `/`.
- `paths.relative = false` keeps absolute root asset URLs (`/favicon.ico`, `/textures/...`, `/_app/...`).

## Security headers (verified on production)

Observed on `GET https://taash-find-card.pages.dev/`:

| Header                  | Value (summary)                                                                 |
| ----------------------- | ------------------------------------------------------------------------------- |
| Content-Security-Policy | `default-src 'self'; … frame-ancestors 'none'; script-src 'self' 'sha256-…'; …` |
| X-Content-Type-Options  | `nosniff`                                                                       |
| Referrer-Policy         | `strict-origin-when-cross-origin`                                               |
| Permissions-Policy      | camera/mic/geo/payment/usb/… disabled                                           |
| X-Frame-Options         | `DENY` (complements CSP `frame-ancestors 'none'`)                               |

CSP post-build: `scripts/apply-csp-hashes.js` hashes SvelteKit’s required inline bootstrap script so `script-src` stays without blanket `'unsafe-inline'`.

## Seed controls in production

- `?seed=` only applies when `isTestSeedAllowed()` (DEV / `navigator.webdriver` / `VITE_ALLOW_TEST_SEED`).
- Deployed smoke confirmed normal users (`webdriver` forced false) get `data-seed-active="0"`.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Runs on push/PR to `main`:

1. `npm ci`
2. Prettier check
3. ESLint (`npm run lint`)
4. `npm run check`
5. `npm run test:unit -- --run`
6. `npm run build`
7. Playwright Chromium smoke (`npx playwright test --project=chromium`)

## Production smoke (executed)

Command:

```bash
LIVE_URL=https://taash-find-card.pages.dev npm run test:e2e:deployed
```

Result: **11 passed, 0 failed** (Chromium) — exit 0

| Case                                   | Status |
| -------------------------------------- | ------ |
| Initial 52-card board + target preview | PASS   |
| Winning selection                      | PASS   |
| Losing selection + correct reveal      | PASS   |
| New Round                              | PASS   |
| Mobile viewport                        | PASS   |
| Reduced motion                         | PASS   |
| WebGL-disabled fallback                | PASS   |
| Direct URL reload                      | PASS   |
| Favicon + static assets                | PASS   |
| Production seed lock                   | PASS   |
| No console errors (happy path)         | PASS   |

## NOT RUN

- Physical-device lab testing
- Custom domain / DNS cutover
- Multi-region synthetic monitoring

## Known limitations

- Preview subdomain TLS from some IPv6 paths may fail locally; production `taash-find-card.pages.dev` is the canonical URL.
- Inline bootstrap CSP hashes are rebuild-specific (applied automatically by `npm run build`).

# Verification Report — Taash Find Card

Unexecuted checks are never marked PASS. This report reflects the **post-audit** gate run on 2026-07-24.

## Environment

| Item     | Value                             |
| -------- | --------------------------------- |
| Date     | 2026-07-24                        |
| Node     | v22.18.0                          |
| npm      | 10.9.3                            |
| OS       | macOS (darwin 25.3.0)             |
| Scaffold | `sv@0.16.5` minimal, `--no-types` |

## Commands run (closure audit)

```bash
npm run format          # exit 0
npm run lint            # exit 0
npm run check           # exit 0
npm run test:unit -- --run   # exit 0 — 25/25 passed
npm run build           # exit 0
npm run test:e2e        # exit 0 — 104 passed, 36 skipped
```

## Quality gates

| Gate                 | Status   | Exit | Detail                                                           |
| -------------------- | -------- | ---- | ---------------------------------------------------------------- |
| install              | **PASS** | 0    | Prior scaffold + `three` + `svelte-check`                        |
| format check         | **PASS** | 0    | `npm run format` then `prettier --check` via lint                |
| lint                 | **PASS** | 0    | prettier --check + eslint                                        |
| Svelte check         | **PASS** | 0    | 0 errors, 0 warnings                                             |
| unit tests           | **PASS** | 0    | **25/25** (`tests/unit/game.spec.js`)                            |
| production build     | **PASS** | 0    | `vite build` + adapter-auto                                      |
| e2e Chromium         | **PASS** | 0    | game suite + evidence captures                                   |
| e2e Firefox          | **PASS** | 0    | game suite (evidence skipped)                                    |
| e2e WebKit           | **PASS** | 0    | game suite (evidence skipped)                                    |
| mobile viewport      | **PASS** | 0    | mobile-chrome project + dedicated E13/E14 + viewport screenshots |
| reduced-motion       | **PASS** | 0    | E15 + evidence `docs/evidence/reduced-motion.png`                |
| WebGL fallback       | **PASS** | 0    | E16 + evidence `docs/evidence/webgl-fallback.png`                |
| console-error check  | **PASS** | 0    | E01 / E17 / E18 collect console + pageerror                      |
| favicon.ico          | **PASS** | 0    | HTTP 200 for `/favicon.ico`                                      |
| seed production lock | **PASS** | 0    | `data-seed-active=0` when `navigator.webdriver` forced false     |

## Unit coverage vs matrix

| ID  | Requirement                        | Status |
| --- | ---------------------------------- | ------ |
| U01 | Deck count 52                      | PASS   |
| U02 | Unique IDs 52                      | PASS   |
| U03 | Suit counts 13 each                | PASS   |
| U04 | Rank coverage                      | PASS   |
| U05 | Shuffle permutation                | PASS   |
| U06 | Seed repeatability                 | PASS   |
| U07 | Different seed sanity              | PASS   |
| U08 | Target membership once             | PASS   |
| U09 | Correct → won                      | PASS   |
| U10 | Incorrect → lost                   | PASS   |
| U11 | Same rank wrong suit → lost        | PASS   |
| U12 | Same suit wrong rank → lost        | PASS   |
| U13 | Repeated selection ignored         | PASS   |
| U14 | Unknown ID rejected                | PASS   |
| U15 | New round reset                    | PASS   |
| U16 | Transition table                   | PASS   |
| —   | Seed gating (prod blocked)         | PASS   |
| —   | Audio no-autoplay / mute / dispose | PASS   |

**Unit total: 25 passed, 0 failed, 0 skipped**

## Playwright coverage vs matrix

| ID  | Behavior                                        | Status |
| --- | ----------------------------------------------- | ------ |
| E01 | 52 hidden card buttons                          | PASS   |
| E02 | Four suit groups × 13                           | PASS   |
| E03 | Target preview rank/suit face-up                | PASS   |
| E04 | Deterministic correct click wins                | PASS   |
| E05 | Deterministic wrong click loses                 | PASS   |
| E06 | Rapid double-click resolves once                | PASS   |
| E07 | Touch/click duplication resolves once           | PASS   |
| E08 | Correct card reveals after loss                 | PASS   |
| E09 | New Round changes round ID                      | PASS   |
| E10 | Enter key selects focused card                  | PASS   |
| E11 | aria-live result announcement                   | PASS   |
| E12 | Target preview noninteractive                   | PASS   |
| E13 | Mobile portrait tappable                        | PASS   |
| E14 | Sticky preview does not cover last mobile cards | PASS   |
| E15 | Reduced motion completes                        | PASS   |
| E16 | WebGL failure fallback playable                 | PASS   |
| E17 | Teardown path no console errors                 | PASS   |
| E18 | Production route `/` loads directly             | PASS   |
| —   | Same rank wrong suit / same suit wrong rank     | PASS   |
| —   | Production seed lock / favicon / mute           | PASS   |

### Playwright projects

| Project       | Game tests | Evidence | Notes                            |
| ------------- | ---------- | -------- | -------------------------------- |
| chromium      | PASS       | PASS     | Screenshots written              |
| firefox       | PASS       | skipped  | Evidence Chromium-only by design |
| webkit        | PASS       | skipped  | Evidence Chromium-only by design |
| mobile-chrome | PASS       | skipped  | Evidence Chromium-only by design |

**E2E total: 104 passed, 36 skipped (intentional evidence skip), 0 failed — exit 0**

## Viewport verification (executed)

Screenshots in `docs/evidence/`:

| Viewport | File                    | Status |
| -------- | ----------------------- | ------ |
| 320×568  | `viewport-320x568.png`  | PASS   |
| 375×667  | `viewport-375x667.png`  | PASS   |
| 390×844  | `viewport-390x844.png`  | PASS   |
| 768×1024 | `viewport-768x1024.png` | PASS   |
| 1280×720 | `viewport-1280x720.png` | PASS   |
| 1440×900 | `viewport-1440x900.png` | PASS   |

## Key-state evidence

| State                   | Path                                        |
| ----------------------- | ------------------------------------------- |
| Initial board           | `docs/evidence/initial-board.png`           |
| Winning selection       | `docs/evidence/winning-selection.png`       |
| Losing + correct reveal | `docs/evidence/losing-selection-reveal.png` |
| Mobile portrait         | `docs/evidence/mobile-portrait.png`         |
| Reduced motion          | `docs/evidence/reduced-motion.png`          |
| WebGL disabled fallback | `docs/evidence/webgl-fallback.png`          |

## Claims removed

- **Hard / Memory “engine-ready”** — removed. `createRound` throws on non-classic modes. No tested extension architecture.

## Remaining limitations

- Physical devices beyond Playwright emulation: **NOT RUN**
- Custom domain / DNS cutover: **NOT RUN**
- Fonts are system fallback stacks (no self-hosted font files)

## Phase 5 — production deployment closure

| Item | Value |
| ---- | ----- |
| Hosting | Cloudflare Pages |
| Adapter | `@sveltejs/adapter-static` |
| Production URL | https://taash-find-card.pages.dev |
| Deploy command | `npm run deploy` (`wrangler pages deploy build --project-name=taash-find-card --branch=main`) |
| CI | `.github/workflows/ci.yml` (npm ci → format → lint → check → unit → build → Chromium Playwright) |
| Security headers | CSP + XCTO + Referrer-Policy + Permissions-Policy + frame-ancestors/`X-Frame-Options` — **PASS** (live HEAD) |
| Deployed smoke | `LIVE_URL=https://taash-find-card.pages.dev npm run test:e2e:deployed` — **11/11 PASS**, exit 0 |

See `docs/deployment-report.md` for full deployment evidence.

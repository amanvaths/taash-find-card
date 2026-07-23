# Assets and licenses — Taash Find Card

All gameplay assets are original to this repository, procedurally generated at runtime, or system fallbacks. No third-party card face artwork, casino branding, or paid sound packs are included.

| Asset                                 | Path / source                                              | Origin                                                                 | License                                   |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| Card-back pattern                     | `static/textures/card-back.svg`                            | Original geometric SVG authored for this project                       | Original / project-owned                  |
| Favicon (SVG)                         | `src/lib/assets/favicon.svg` (scaffold) + linked in layout | SvelteKit scaffold default, retained                                   | MIT via SvelteKit scaffold                |
| Favicon (ICO)                         | `static/favicon.ico`                                       | Generated locally (solid table-green 16×16 PNG-in-ICO)                 | Original / project-owned                  |
| Card faces                            | DOM/CSS in `CardButton.svelte` / `TargetPreview.svelte`    | Unicode suit symbols + typography, no bitmap faces                     | Original presentation                     |
| Table surface colors                  | `src/lib/styles/tokens.css`                                | Original design tokens                                                 | Original / project-owned                  |
| Three.js table/rim/particles          | `src/lib/renderer/three/*`                                 | Procedural geometry/materials at runtime                               | Code: project; Three.js library: MIT      |
| Deal / flip / win / lose / tap sounds | `src/lib/audio/audio-manager.js`                           | Procedural oscillators via Web Audio API (no audio files)              | Original / project-owned                  |
| Robots.txt                            | `static/robots.txt`                                        | Scaffold default                                                       | N/A                                       |
| UI fonts                              | CSS `font-family` stacks in `tokens.css`                   | System-installed faces only; no bundled or remotely fetched font files | OS font licenses apply to installed faces |
| Security headers template             | `static/_headers` (+ `scripts/apply-csp-hashes.js`)        | Original Cloudflare Pages header config                                | Original / project-owned                  |

## Runtime libraries (not visual assets)

| Package                   | Role                       | License |
| ------------------------- | -------------------------- | ------- |
| `three`                   | Optional WebGL enhancement | MIT     |
| Svelte / SvelteKit / Vite | Application shell          | MIT     |
| `wrangler`                | Cloudflare Pages deploy CLI | Apache-2.0 / MIT (Cloudflare) |

## Notes

- No remote scripts are loaded for gameplay.
- No audio files exist under `static/audio/`; the directory is reserved and empty by design.
- Seed-based determinism is gated to development / automated browsers and is not a fairness claim for production play.
- Any local unused binary such as `playing_cards.glb` is gitignored and **not shipped** in the production build.

<div align="center">

# ARTIFACT Futures

**Online editorial & WebGPU platform (`Next.js 16` · `Three.js` · `GSAP` · `Cloudflare`) alongside the standalone West Bund 2026 three-screen exhibition prototype.**

[![Next.js](https://img.shields.io/badge/Next.js-16%20%7C%20React%2019-000000.svg)](#online-website)
[![Graphics](https://img.shields.io/badge/Graphics-Three.js%20%7C%20WebGPU%20%7C%20GSAP-2563EB.svg)](#tech-stack)
[![Deploy](https://img.shields.io/badge/Edge-Cloudflare%20OpenNext%20%7C%20R2-F38020.svg)](#online-website)
[![Exhibition](https://img.shields.io/badge/Exhibition-West%20Bund%202026-10B981.svg)](#west-bund-2026-exhibition-prototype)

**English** | [简体中文](README.zh-CN.md)

</div>

---

## Overview

This repository houses two closely linked design and engineering artifacts for **ARTIFACT Futures**:

1. **West Bund 2026 Exhibition Prototype (`exhibitions/westbund/`)** — A self-contained, zero-dependency interactive preview of the three-screen physical exhibition (Issues 01 & 02) with visitor presence simulation and print-dot kinetic typography.
2. **Online Website (`app/`, `components/`, `i18n/`)** — A bilingual Next.js 16 web experience featuring custom WebGPU/Three.js shaders (`vgpu`), GSAP + Lenis smooth choreography, Journal / Residency / Reel / CV folios, and Cloudflare OpenNext + R2 edge delivery.

## West Bund 2026 Exhibition Prototype

No package installation or Next.js server is required to preview the exhibition:

- Open [`exhibitions/westbund/index.html`](exhibitions/westbund/index.html) directly in a modern browser after cloning, **or** serve it locally:

```sh
python3 -m http.server 3002 --bind 127.0.0.1 --directory exhibitions/westbund
# Visit http://127.0.0.1:3002/
```

See [`exhibitions/westbund/README.md`](exhibitions/westbund/README.md) for playback controls, visitor simulation, editable `source.html`, and export regeneration. Earlier design studies and the retired website-based exhibit are preserved in [`archive/westbund/`](archive/westbund/README.md).

## Online Website

### Tech Stack

| Layer | Technologies |
| --- | --- |
| Framework & i18n | Next.js 16, React 19, TypeScript, `next-intl` |
| Graphics & Motion | Three.js, `vgpu` (WebGPU shaders), GSAP, Lenis |
| Edge & Media | Cloudflare Workers (`@opennextjs/cloudflare`), Wrangler, R2 asset pipeline |

### Local Development

```sh
bun install
bun dev
```

### Validation & Edge Preview

```sh
bun run check     # TypeScript typecheck + ESLint
bun run build     # Next.js production build
bun run preview   # Cloudflare OpenNext local preview
```

See [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md) and [`docs/westbund-images.md`](docs/westbund-images.md) for R2 media workflows and deployment setup.

## Repository Layout

```text
artifact-futures/
├── app/[locale]/            # Localized routes (home, journal, residency, reel, cv) & shaders
├── components/              # Shared UI modules
├── exhibitions/westbund/    # Standalone West Bund 2026 three-screen exhibition preview
├── archive/westbund/        # Archived website exhibit & 12 earlier design studies
├── docs/                    # Brand SVGs, Cloudflare & West Bund image pipelines
├── messages/                # i18n translation bundles
└── scripts/                 # Icon generation, WebP conversion & R2 asset scripts
```

## Contributing

Design critiques, shader/performance improvements, accessibility fixes, and exhibition playback refinements are welcome. Please run `bun run check && bun run build` and check [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

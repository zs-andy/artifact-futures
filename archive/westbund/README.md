# West Bund — archived proposals

Archived on 18 October 2026. These files are retained for design history and recovery, not as the current exhibition entry point.

**Current version:** [exhibitions/westbund](../../exhibitions/westbund/README.md).

## Design studies

The twelve original HTML fragments are preserved unchanged under [design-studies](design-studies/). Local originals were retained so earlier conversation previews remain usable.

| Files | Exploration |
| --- | --- |
| `westbund-composition.html`, `westbund-composition-v2.html` through `westbund-composition-v9.html` | Early composition and typography iterations |
| `westbund-horizontal-loop.html` | Horizontal loop exploration |
| `westbund-title-loop.html` | Title-only loop exploration |
| `westbund-type-candidates.html` | Typeface candidates |

These are fragments, not complete standalone pages. Render them using the [current project's export helper](../../exhibitions/westbund/README.md#exporting-an-edited-fragment) if they need to be reviewed again.

## Superseded website-based exhibit

[legacy-next](legacy-next/) preserves the former `app/[locale]/exhibit/` route and `scripts/exhibit-audience.test.ts`, with their original relative paths and contents. The route was moved out of the live Next.js application, and the archive is excluded from TypeScript and ESLint checks. Its original README describes historical behavior, not the current prototype.

This is a source archive, not a self-contained Next.js app. The old route also used shared homepage, journal, and rendering code. Those shared files remain with the online website; they have not been refactored as part of archiving. The full runnable historical repository is preserved at commit [`5be242c`](https://github.com/zs-andy/artifact-futures/tree/5be242c).

To inspect that complete historical version without changing your current checkout:

```sh
git worktree add --detach ../artifact-exhibit-legacy 5be242c
```

Source-image tools and journal materials are references, not abandoned proposals, and remain outside this archive.

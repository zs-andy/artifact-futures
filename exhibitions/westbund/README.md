# West Bund 2026 — current exhibition prototype

Accepted snapshot: 18 October 2026. This is the independent three-screen exhibition design, separate from the online ARTIFACT website.

**Issues 01 and 02 (19 October 2026).** Both journals are shown. They lie side by side beneath the screens, Issue 01 on the left. The title runs both themes as one continuous line; Issue 01 is set like its cover, with roman nouns and italic "and" and "of". The bottom-left annotation belongs to Issue 01, the bottom-right to Issue 02, and the event sits top-right. A visitor in front of the left screen is met by the Issue 01 cover, in front of the centre (and right) screen by Issue 02; walking across before looking re-prints the cover as the other issue. Each cover funnels to its own journal.

## Open the preview

Download or clone the repository and open `index.html` in a modern browser. GitHub's file viewer shows source code, so download the file to play it. Alternatively, from the repository root:

```sh
python3 -m http.server 3002 --bind 127.0.0.1 --directory exhibitions/westbund
```

Then visit <http://127.0.0.1:3002/>. The preview needs no package installation or Next.js server.

`index.html` is the standalone export. `source.html` is the exact editable HTML fragment used for the accepted preview, with its images, fonts, styles, and animation code embedded. The export wraps that fragment in a sandboxed frame with the preview's base styles. Keep both files together; regenerate the export when changing the source. The export helper described below also renders archived studies.

## Playback and controls

- **Loop:** no visitors; the title scrolls continuously and twelve images, alternating Issue 02 and Issue 01, cycle as blue print dots.
- **Demo:** a repeating 22-second visitor simulation demonstrates approach, slowing, clear images, and each cover travelling to its journal: Issue 01 from the left screen, Issue 02 from the centre.
- **Manual:** simulate zero, one, or two visitors; adjust each position and whether they are stopped and facing the screen.
- A visitor who remains stopped and facing the screen for three seconds triggers their cover once. They must leave before triggering again. The title slows from 96 to 24 logical units/second when someone is present.
- **Placement:** put the control capsule in any viewport corner, 12 px from the window edges (or the device safe area). It stays there when scrolling or switching screen views; an expanded panel scrolls internally if needed. Preview all three screens or one 16:9 screen, and move the pair of simulated journals (their centre) between 5% and 95% of the total width.

The title uses Arial, Georgia Italic, and IBM Plex Mono, with equal visual gaps. Small annotations frame the editorial rectangle, and the image occupies the right screen. These choices and all accepted content are preserved in this snapshot.

Interface colours follow the website's ARTIFACT palette: blue `#1546B0`, olive `#727343`, ink `#111111`, and white paper. The title, logo, print dots, progress indicators, and selected controls share the same blue; lighter control accents are derived from it for contrast on the dark panel. Original photographs and printed cover images retain their source colours. The palette is declared at the top of `source.html`, and Canvas reads its colours from those CSS variables.

The particle morph uses a fixed pool and directional correspondence adapted from ParticleSaga, with nonlinear spring timing adapted from Motion. The Genie geometry is ported from BCGenieEffect. The latest fix draws the deformed cover as one WebGL mesh to avoid bands between independently transformed strips; a CSS-strip fallback remains for browsers without WebGL. No new image change starts while a visitor is looking or a cover is flying; a change already under way finishes rather than freezing mid-morph.

## Current scope

This is a browser interaction prototype with simulated visitors. It does not yet perform camera/live audience detection or synchronize separate computers. The two books are a movable visual stand-in for the physical journals. Actual display output, sensing, and installation calibration remain separate work.

## Materials and attribution

Images are from ARTIFACT Journal Issues 01 and 02. [references/materials.md](references/materials.md) records the twelve source images and credits; [the contact sheet](references/westbund-image-shortlist.jpg) shows the original Issue 02 selection. The control capsule also displays the current image credit.

BCGenieEffect, ParticleSaga, and Motion retain their MIT copyright and license notices inside `source.html` and the exported document. See [references/third-party.md](references/third-party.md) for upstream versions. These code licenses do not grant rights to the journal images or typefaces.

## Exporting an edited fragment

The checked-in `index.html` is ready to share as-is. To rebuild it, run:

```sh
python3 exhibitions/westbund/export.py
```

The helper reuses the existing standalone export's surrounding document and base styles, replacing only its embedded fragment. It requires Python 3 and no packages. For an archived fragment, pass input and output paths:

```sh
python3 exhibitions/westbund/export.py archive/westbund/design-studies/westbund-title-loop.html /tmp/westbund-title-loop.html
```

Earlier proposals are indexed in [../../archive/westbund/README.md](../../archive/westbund/README.md).

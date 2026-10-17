# Issue 02 reading interface — design QA

final result: passed

Scope: first UI iteration, five selected Westbund projects and the Issue 02 editorial. This is not a complete migration of the issue or a production publication review.

## Reference and intentional changes

Reference: https://www.stripe.press/poor-charlies-almanack/chapter-one
The reference was inspected in the browser, including its split reading view. Its centre division, facing image/text pages, persistent navigation and compact running heads inform this design. The user explicitly requested ARTIFACT's own typography and blue/white/black palette with a small yellow accent; the reference's serif typography, paper texture and original artwork are deliberately not reproduced. Comparison is of the reading structure, not pixel identity with Stripe's page.

## Visual checks

- Typography: existing Darker Grotesque loaded and confirmed from computed styles. Large block titles, compact metadata, readable body text. Mobile paragraphs use left alignment to avoid excessive word spacing.
- Layout: equal desktop page widths, restrained running heads and centre rule. Desktop preview inspected at 1280 × 720. Phone preview inspected at 390 × 844. All five titles fit without horizontal overflow. Mobile collapses to a single page and keeps images inline in the article.
- Colours: brand blue #1546b0, white, near-black, yellow #f2ef68 limited to labels, hover states and image controls.
- Images: original Westbund material, converted to WebP. Preserved proportions using contain. All 81 files and figure references checked. No generated artwork or placeholder images.
- Content: five full original texts plus editorial; original authors and print page references retained. Short project introductions are editorial summaries. Directory explicitly says this is a five-project selection.
- Icons: existing @artifact/icons arrows and navigation icon; existing ARTIFACT logo.

## Interaction checks

Verified in browser: project introduction → full text, independent text scrolling, automatic facing-image updates when scrolling down and back up, image navigation, mobile image enlargement and closing, contents selection, editorial, all five project transitions, disabled end controls, deep-link refresh, browser Back and Escape dismissal of contents. Desktop figure cards have been replaced with compact noninteractive figure numbers and captions; the original figure positions drive the automatic updates. Mobile keeps inline images. Persistent mobile previous/next controls have explicit accessible names. Native dialogs provide modal focus handling. Reduced motion disables the entrance animation through media queries.

## Validation

- Web TypeScript check: passed.
- ESLint on the changed/new reader TypeScript files: passed.
- No browser runtime errors observed. One development image-loading warning was addressed by declaring eager loading consistently for duplicate instances of the initial image.
- Data check: 5 projects, 81 images, zero missing files or broken figure references; generated HTML tag audit passed.
- Existing demo files and their lint findings were not changed.

## Remaining scope

Full Issue 02 ingestion, final editorial copy approval, formal accessibility audit, production build and broader device/browser testing remain outside this design pass. The existing Issue 01 reader is unchanged. Preview source generation can be rerun with `bun apps/web/scripts/prepare-issue-reader.mjs`; original Resource files are read only.

Screenshots: /tmp/artifact-issue-introduction.png and /tmp/artifact-issue-reading.png.

Automatic image follow-up: /tmp/artifact-issue-auto-images.png. TypeScript and reader ESLint checks passed again; desktop forward/reverse scrolling and mobile image enlargement verified with no browser errors.

## Facing-page revision

Revisited the Stripe chapter in the browser after layout clarification: viewport-wide halves with narrow perimeter rails, a continuous central rule, and thin top/bottom navigation, rather than a floating inset book. Removed progress chrome and repeated figure cards; consecutive source figures now form one plate with individual captions and enlargement. Scroll synchronization waits 180 ms after scrolling settles. Original accent corrected to #f8941f.

Verified desktop grouped plate 07–17, individual enlargement, keyboard previous/next project navigation, mobile 390px inline images and enlargement, no horizontal overflow or browser errors. TypeScript and scoped ESLint pass. Touch swipe is implemented with a horizontal-direction threshold; physical-device gesture testing remains outstanding. Project transitions respect reduced-motion preferences.

## Perimeter and control alignment correction

Reference DOM measured: outer side rails at 18px and central 32px strip with 1px dashed borders plus central solid rule. Applied the three-line structure; per subsequent user direction, all four perimeter rails now share a single 36px measure (44px on mobile), with horizontal rules across the full viewport and side rules extending through the corner controls. The central strip spans the full desktop viewport, as requested.

Four corner actions have paired labels and icons: Archive/back, Contents/notebook, Previous project/left, Next project/right. The reading-mode control is separate from the next-project arrow. Long issue metadata was removed from the top rail. DOM geometry check found zero navigation text/icon intersections with the central 32px strip. Mobile 390px verified: all corner controls are 44 × 44px and no horizontal overflow. TypeScript and scoped ESLint passed. Screenshot: /tmp/artifact-reader-frame-controls.png.

## Icon refinement

Reader navigation uses the existing Central Icons library's 1px outlined variants at 18px, with non-scaling strokes, flat caps and miter joins. Contents now uses a two-line menu instead of a notebook pictogram. Verified computed dimensions and stroke styles in the browser; reader TypeScript and ESLint pass. Other consumers keep the package's existing defaults. Screenshot: /tmp/artifact-reader-thin-icons.png.

Latest boundary correction: vertical rules (both outer sides and the central three-line strip) now stop at the content container's top and bottom. Only the two horizontal rules extend to the viewport edges. Browser geometry confirmed content y=36…817 in an 853px viewport, matching all vertical-rule endpoints; horizontal-rule left/right offsets remain 0px. This supersedes earlier full-height vertical-rule notes.


## Legacy Journal archive

The previous Journal page tree (including scan readers, Demos, Labs, Fellows and Fellowship) is stored locally in `resource/Archive/journal`, outside the application and its build. There is no `/archive` website route. The archive is ignored by Git under the existing `resource` rule. Shared book artwork used by the homepage remains in the private Journal components, with copies in the archive. The current IssueReader has no runtime dependency on the archived scan reader or its data query. The local content preparation script reads the archived metadata. `/journal` and `/journal/issues` redirect to the current Migration reader.

The earlier migration to a public `/archive` route was a misunderstanding and has been removed. Legacy code is retained solely as a source archive, while the current reader, homepage entry points and Blob image mapping remain in the application.

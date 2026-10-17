import { JOURNAL, PROGRAMME } from "../_lib/home-content";
import { BOOK_COVERS } from "../journal/_components/node-book.data";
import { loadImage } from "../_lib/dither";

export const DESKTOP = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
export const MOTION = "(prefers-reduced-motion: no-preference)";
export const FINE = "(hover: hover) and (pointer: fine)";
export const SHELF = JOURNAL.issues.map((issue, index) => {
  const id = ["issue-01-flood", "issue-02-barcode"][index];
  return {
    ...issue,
    id: issue.cover ? id : null,
    label: `Issue ${String(index + 1).padStart(2, "0")}`,
    book: issue.cover ? BOOK_COVERS[id] : null,
  };
});
export const SEASONS = [...new Set(PROGRAMME.occasions.map((item) => item.date.split(" ")[1]))].map(
  (year) => ({
    year,
    entries: PROGRAMME.occasions.flatMap((occasion, index) =>
      occasion.date.endsWith(year) ? [{ index, month: occasion.date.split(" ")[0], occasion }] : [],
    ),
  }),
);
export const IMAGES = [
  "/home/mock/05.webp",
  "/home/mock/06.webp",
  ...PROGRAMME.occasions.map((item) => item.media.src),
];
export const PICK_IMAGE = 2;
export type Frame = { x: number; y: number; w: number; h: number; r: number };
export const createScene = () => ({
  rest: false,
  invert: 0,
  fit: 0,
  dither: 1,
  wash: 0,
  image: -1,
  pick: 0,
  field: [0x15 / 255, 0x46 / 255, 0xb0 / 255] as [number, number, number],
  frame: { x: 0, y: 0, w: 0, h: 0, r: 3 } as Frame,
});
export type Scene = ReturnType<typeof createScene>;

// One bounded image pool per homepage visit; intro and renderer share requests.
export function createImages() {
  const pending = new Map<string, Promise<HTMLImageElement>>();
  const controller = new AbortController();
  return {
    load(src: string) {
      if (!pending.has(src))
        pending.set(
          src,
          loadImage(src, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])),
        );
      return pending.get(src)!;
    },
    dispose: () => controller.abort(),
  };
}
export type Images = ReturnType<typeof createImages>;

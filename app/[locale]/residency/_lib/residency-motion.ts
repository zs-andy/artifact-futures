export const SECTION_DRIFT = 0.4;

let cachedWidth = 0;
let cachedHeight = 0;

export function viewportHeight() {
  if (typeof window === "undefined") return 0;
  const width = window.innerWidth;
  const pinned = window.matchMedia("(pointer: coarse)").matches;
  if (!pinned || cachedHeight === 0 || width !== cachedWidth) {
    cachedWidth = width;
    cachedHeight = window.innerHeight;
  }
  return cachedHeight;
}

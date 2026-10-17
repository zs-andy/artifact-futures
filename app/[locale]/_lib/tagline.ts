export const TAGLINE = "research-driven cultural institution";

const MAX_RATIO = 2;

export const inkRatio = () => Math.min(window.devicePixelRatio || 1, MAX_RATIO);

export type InkPlacement = {
  boxLeft: number;
  boxTop: number;
  left: number;
  top: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

export function inkTagline(
  line: HTMLElement,
  surface: HTMLCanvasElement,
  ratio: number,
  shifts?: readonly number[],
): InkPlacement | null {
  const box = line.getBoundingClientRect();
  const left = Math.floor(box.left * ratio) / ratio;
  const top = Math.floor(box.top * ratio) / ratio;
  const width = Math.ceil((box.right - left) * ratio);
  const height = Math.ceil((box.bottom - top) * ratio);
  if (width <= 0 || height <= 0) return null;

  if (surface.width !== width) surface.width = width;
  if (surface.height !== height) surface.height = height;
  const context = surface.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const style = getComputedStyle(line);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, width, height);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.fillStyle = "#ffffff";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(line.textContent ?? "");
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;

  const chars = line.querySelectorAll<HTMLElement>(".home__char");
  chars.forEach((char, index) => {
    const glyph = char.textContent ?? "";
    if (!glyph.trim()) return;
    const rect = char.getBoundingClientRect();
    const baseline = rect.top + (rect.height - ascent - descent) / 2 + ascent;
    const shift = (shifts?.[index] ?? 0) * rect.height;
    context.fillText(glyph, rect.left - left, baseline - top + shift);
  });

  return {
    boxLeft: box.left,
    boxTop: box.top,
    left,
    top,
    width: width / ratio,
    height: height / ratio,
    offsetX: left - box.left,
    offsetY: top - box.top,
  };
}

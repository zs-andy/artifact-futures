const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62,
  30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55,
  23, 61, 29, 53, 21,
].map((value) => (value + 0.5) / 64);

export type Rgb = readonly [number, number, number];

export const INK_BLUE: Rgb = [0x15, 0x46, 0xb0];
export const PAPER_WHITE: Rgb = [0xff, 0xff, 0xff];

const smooth = (low: number, high: number, value: number) => {
  const t = Math.min(Math.max((value - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

export function ditherTo(
  target: HTMLCanvasElement,
  source: CanvasImageSource & { width: number; height: number },
  columns: number,
  rows: number,
  ink: Rgb,
  paper: Rgb,
) {
  target.width = columns;
  target.height = rows;
  const context = target.getContext("2d", { willReadFrequently: true });
  if (!context) return;

  const scale = Math.max(columns / source.width, rows / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, (columns - width) / 2, (rows - height) / 2, width, height);

  const frame = context.getImageData(0, 0, columns, rows);
  const data = frame.data;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const at = (y * columns + x) * 4;
      const light = (0.2126 * data[at] + 0.7152 * data[at + 1] + 0.0722 * data[at + 2]) / 255;
      const color = smooth(0.08, 0.92, light) < BAYER[(y % 8) * 8 + (x % 8)] ? ink : paper;
      data[at] = color[0];
      data[at + 1] = color[1];
      data[at + 2] = color[2];
      data[at + 3] = 255;
    }
  }
  context.putImageData(frame, 0, 0);
}

export function loadImage(src: string, signal?: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    const abort = () => {
      image.src = "";
      reject(new DOMException("aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      signal?.removeEventListener("abort", abort);
      resolve(image);
    };
    image.onerror = () => {
      signal?.removeEventListener("abort", abort);
      reject(new Error(`failed to load ${src}`));
    };
    image.src = src;
  });
}

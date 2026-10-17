import { COVERS } from "../_lib/covers";
import { clamp, FLIGHT, type Visitor } from "./audience";

export const WALL_W = 2880;
export const WALL_H = 540;
const ease = (t: number) => {
  const p = clamp(t);
  return p * p * (3 - 2 * p);
};

export function createCoverPainter(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")!;
  canvas.width = WALL_W;
  canvas.height = WALL_H;
  const images = COVERS.slice(0, 8).map((cover) => {
    const image = new Image();
    image.decoding = "async";
    image.src = cover.src;
    return image;
  });

  return (
    visitors: Map<string, Visitor>,
    now: number,
    target: { x: number; gap: number },
    reduced: boolean,
  ) => {
    context.clearRect(0, 0, WALL_W, WALL_H);
    for (const v of visitors.values()) {
      const flying = v.fired !== null;
      const p = flying ? clamp((now - v.fired!) / FLIGHT) : 0;
      if (p >= 1) continue;
      const source = images[v.slot % images.length];
      const aspect = source.naturalWidth ? source.naturalWidth / source.naturalHeight : 0.707;
      const h = 162,
        w = h * aspect;
      const cx = clamp(v.shownX * WALL_W, w / 2 + 10, WALL_W - w / 2 - 10);
      const y = v.shownY * (WALL_H - h);
      context.globalAlpha = clamp(now - v.seen < 0.15 ? 1 : 1 - (now - v.seen) / 0.8);
      if (reduced && flying) context.globalAlpha *= 1 - p;

      if (!flying || reduced) {
        if (source.complete && source.naturalWidth) context.drawImage(source, cx - w / 2, y, w, h);
        else {
          context.fillStyle = "#1546b0";
          context.fillRect(cx - w / 2, y, w, h);
          context.fillStyle = "#fff";
          context.font = "18px Arial";
          context.fillText("ARTIFACT", cx - w / 2 + 8, y + 28);
        }
        if (v.dwell > 0 && !flying) {
          context.fillStyle = "rgba(255,255,255,.7)";
          context.fillRect(cx - w / 2, y + h + 9, w, 3);
          context.fillStyle = "#1546b0";
          context.fillRect(cx - w / 2, y + h + 9, w * v.dwell, 3);
        }
        continue;
      }

      // Horizontal strips bend at different times: the foot reaches the book first,
      // then the body stretches, narrows, and exits below the physical screen edge.
      const edge = (v: number) => {
        const q = ease(p * 1.65 - (1 - v) * 0.65);
        return {
          x: cx + (target.x * WALL_W - cx) * q,
          y: y + v * h + (WALL_H * (1 + target.gap) - y - v * h) * q,
          w: Math.max(0.2, w * (1 - q) ** 1.35),
        };
      };
      for (let i = 0; i < 64; i++) {
        const a = edge(i / 64),
          b = edge((i + 1) / 64);
        const stripH = Math.max(0.2, b.y - a.y);
        context.save();
        context.translate(a.x - a.w / 2, a.y);
        context.transform(1, 0, (b.x - b.w / 2 - a.x + a.w / 2) / stripH, 1, 0, 0);
        if (source.complete && source.naturalWidth)
          context.drawImage(
            source,
            0,
            (i * source.naturalHeight) / 64,
            source.naturalWidth,
            source.naturalHeight / 64,
            0,
            0,
            a.w,
            stripH + 0.8,
          );
        else {
          context.fillStyle = "#1546b0";
          context.fillRect(0, 0, a.w, stripH + 0.8);
        }
        context.restore();
      }
    }
    context.globalAlpha = 1;
  };
}

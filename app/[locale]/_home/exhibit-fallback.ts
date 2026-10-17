import { gsap } from "../_lib/motion";
import { ditherTo, INK_BLUE, PAPER_WHITE } from "../_lib/dither";
import { IMAGES, PICK_IMAGE, type Images, type Scene } from "./model";

// Keep the existing scene and assets visible on exhibition machines without WebGPU.
export function exhibitFallback(root: HTMLElement, state: Scene, pool: Images) {
  const canvas = document.createElement("canvas");
  canvas.className = "home__exhibit-image";
  canvas.setAttribute("aria-hidden", "true");
  root.querySelector(".home__scene-stage")!.append(canvas);
  const ctx = canvas.getContext("2d")!;
  const mark = root.querySelector<HTMLElement>(".home__mark")!;
  const photos: (HTMLImageElement | undefined)[] = [];
  const dithers: (HTMLCanvasElement | undefined)[] = [];
  let alive = true;
  root.dataset.fallback = "";
  IMAGES.forEach((src, index) => {
    void pool
      .load(src)
      .then((photo) => {
        if (!alive) return;
        photos[index] = photo;
        const dither = document.createElement("canvas");
        try {
          ditherTo(
            dither,
            photo,
            480,
            Math.round((480 * photo.height) / photo.width),
            INK_BLUE,
            PAPER_WHITE,
          );
          dithers[index] = dither;
        } catch {
          /* A cross-origin image can still be shown without reading its pixels. */
        }
      })
      .catch(() => undefined);
  });
  const draw = () => {
    const w = innerWidth,
      h = innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    mark.style.backgroundColor = `rgb(${state.field.map((c) => Math.round(c * 255)).join(" ")})`;
    const index = state.image === PICK_IMAGE ? PICK_IMAGE + state.pick : state.image;
    const photo = photos[index];
    const f = state.frame;
    if (!photo || f.w <= 0 || f.h <= 0) return;
    const cover = Math.max(f.w / photo.width, f.h / photo.height);
    const contain = Math.min(f.w / photo.width, f.h / photo.height);
    const scale = cover + (contain - cover) * state.fit;
    const iw = photo.width * scale,
      ih = photo.height * scale;
    const x = f.x + (f.w - iw) / 2,
      y = f.y + (f.h - ih) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(f.x, f.y, f.w, f.h, f.r);
    ctx.clip();
    ctx.fillStyle = "white";
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.drawImage(photo, x, y, iw, ih);
    if (dithers[index]) {
      ctx.globalAlpha = state.dither;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(dithers[index]!, x, y, iw, ih);
      ctx.imageSmoothingEnabled = true;
    }
    ctx.globalAlpha = state.wash;
    ctx.fillStyle = `rgb(${state.field.map((c) => c * 255).join(" ")})`;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.restore();
  };
  gsap.ticker.add(draw);
  return () => {
    alive = false;
    gsap.ticker.remove(draw);
    canvas.remove();
    mark.style.backgroundColor = "";
    delete root.dataset.fallback;
  };
}

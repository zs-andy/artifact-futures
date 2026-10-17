import { gsap, SMOOTH, SWIFT } from "../_lib/motion";
import { SEED } from "../_lib/seed";
import { inkRatio, inkTagline } from "../_lib/tagline";
import { IMAGES, PICK_IMAGE, type Scene, type Images } from "./model";
import { createGPU } from "./gpu";

const BREAK_PX = 56;
const RESIST = 0.6;
const MAX_PULL_PX = 40;
const CLOTH_SPRING = { stiffness: 260, ratio: 0.85 };
const CURSOR_SPRING = { stiffness: 900, ratio: 1 };
const RELEASE_SPRING = { stiffness: 380, ratio: 0.45 };
const RELEASE_SECONDS = 0.9;
const APPEAR_SECONDS = 0.25;
const SUBSTEP = 1 / 120;
const APPEAR_EASE = gsap.parseEase("power2.out");
const WRAP_SECONDS = 0.45;
const UNWRAP_SECONDS = 0.3;
const WRAP_PAD_X = 12;
const WRAP_PAD_Y = 7;
const MAGNET = 0.2;
const MAGNET_MAX_PX = 10;
const MAGNET_RATE = 12;
const HOP_SECONDS = 0.35;
const RESUME_FLOOR = 0.4;

type Spring = { x: number; y: number; vx: number; vy: number };
type Box = { cx: number; cy: number; hx: number; hy: number; r: number };
type Mode = "free" | "under";

const settle = (
  spring: Spring,
  tx: number,
  ty: number,
  { stiffness, ratio }: { stiffness: number; ratio: number },
  dt: number,
) => {
  const damping = 2 * Math.sqrt(stiffness) * ratio;
  let left = dt;
  while (left > 0) {
    const h = Math.min(left, SUBSTEP);
    spring.vx += ((tx - spring.x) * stiffness - spring.vx * damping) * h;
    spring.vy += ((ty - spring.y) * stiffness - spring.vy * damping) * h;
    spring.x += spring.vx * h;
    spring.y += spring.vy * h;
    left -= h;
  }
};

const gapTo = (x: number, y: number, box: Box) => {
  const qx = Math.abs(x - box.cx) - box.hx + box.r;
  const qy = Math.abs(y - box.cy) - box.hy + box.r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - box.r;
};

const toRgb = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);

export async function renderer(
  root: HTMLElement,
  state: Scene,
  images: Images,
  signal: AbortSignal,
  onLost: () => void,
) {
  const hostEl = root.querySelector<HTMLElement>(".home__loader")!;
  const markEl = root.querySelector<HTMLElement>(".home__mark")!;
  const canvas = document.createElement("canvas");
  canvas.className = "home__cloth";
  canvas.setAttribute("aria-hidden", "true");
  const gpu = await createGPU(canvas, signal, onLost);
  if (!gpu) return null;
  document.body.appendChild(canvas);
  let alive = true;
  const photos = await Promise.all(
    IMAGES.map(async (src) => {
      try {
        const image = await images.load(src);
        return alive && !signal.aborted ? gpu.upload(image) : undefined;
      } catch {
        return undefined;
      }
    }),
  );
  if (signal.aborted) {
    gpu.dispose();
    canvas.remove();
    return null;
  }
  const [red, green, blue] = toRgb(SEED.color);
  const text = { x: 0, y: 0, w: 0, h: 0 };
  const painted = { left: Number.NaN, top: Number.NaN };
  const tagline = hostEl.querySelector<HTMLElement>(".home__tagline");
  let textDirty = true;

  let radius = parseFloat(getComputedStyle(markEl).borderTopLeftRadius) || SEED.radius;
  let dpr = 1;
  let last: number[] = [];
  const resize = () => {
    dpr = inkRatio();
    gpu.resize();
    textDirty = true;
    last = [];
  };

  const surface = document.createElement("canvas");
  const paintText = () => {
    textDirty = false;
    text.w = 0;
    if (!tagline) return;
    const placed = inkTagline(tagline, surface, dpr);
    if (!placed) return;
    painted.left = placed.boxLeft;
    painted.top = placed.boxTop;

    gpu.ink(surface);
    text.x = placed.left;
    text.y = placed.top;
    text.w = placed.width;
    text.h = placed.height;
    last = [];
  };
  resize();

  const pointer = { x: 0, y: 0, on: false, seen: false };
  const piece: Spring = { x: 0, y: 0, vx: 0, vy: 0 };
  const pull: Spring = { x: 0, y: 0, vx: 0, vy: 0 };
  const foot = { x: 0, y: 0 };
  const heading = { x: 0, y: 0 };
  let mode: Mode = "free";
  let appear = 0;
  let release = RELEASE_SECONDS;
  const stance = { x: 0, y: 0, hx: SEED.size / 2, hy: SEED.size / 2 };
  const chip = document.createElement("div");
  chip.className = "home__chip-mask";
  chip.setAttribute("aria-hidden", "true");
  document.body.appendChild(chip);
  const snap = {
    hop: 1,
    from: { x: 0, y: 0, hx: 0, hy: 0 },
    link: null as HTMLElement | null,
    fly: 0,
    wrap: 0,
    shiftX: 0,
    shiftY: 0,
    leaving: false,
    motion: null as gsap.core.Timeline | null,
  };

  const settleLink = (link: HTMLElement | null) => {
    if (!link) return;
    link.style.transform = "";
    const ink = link.querySelector<HTMLElement>(":scope > .home__cta-ink");
    if (ink) ink.style.clipPath = "";
  };

  const snapTo = (link: HTMLElement) => {
    const same = snap.link === link;
    const hopping = Boolean(snap.link && !same && snap.wrap > 0.2);
    if (snap.link && !same) settleLink(snap.link);
    snap.motion?.kill();
    if (hopping) {
      snap.from = { ...stance };
      snap.hop = 0;
      gsap.to(snap, { hop: 1, duration: HOP_SECONDS, ease: SWIFT, overwrite: true });
    } else if (!same) {
      snap.hop = 1;
    }
    snap.link = link;
    snap.leaving = false;
    if (!same) {
      snap.shiftX = 0;
      snap.shiftY = 0;
    }
    if (mode === "under") {
      mode = "free";
      release = 0;
      heading.x = pull.x;
      heading.y = pull.y;
    }
    const left = 1 - Math.min(snap.fly, snap.wrap);
    snap.motion = gsap.timeline().to(snap, {
      fly: 1,
      wrap: 1,
      duration: WRAP_SECONDS * (RESUME_FLOOR + (1 - RESUME_FLOOR) * left),
      ease: SWIFT,
    });
  };

  const unsnap = () => {
    if (!snap.link || snap.leaving) return;
    snap.leaving = true;
    snap.motion?.kill();
    snap.motion = gsap
      .timeline({
        onComplete: () => {
          settleLink(snap.link);
          snap.link = null;
          snap.leaving = false;
        },
      })
      .to(snap, {
        wrap: 0,
        fly: 0,
        duration:
          UNWRAP_SECONDS * (RESUME_FLOOR + (1 - RESUME_FLOOR) * Math.max(snap.fly, snap.wrap)),
        ease: SMOOTH,
      });
  };

  const onOver = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const link =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-snap]") : null;
    if (link && (link !== snap.link || snap.leaving)) snapTo(link);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.on = true;
    if (pointer.seen) return;
    pointer.seen = true;
    piece.x = pointer.x;
    piece.y = pointer.y;
    document.documentElement.dataset.cloth = "on";
  };
  const onOut = (event: PointerEvent) => {
    if (!event.relatedTarget) pointer.on = false;
    const link = snap.link;
    if (!link || !(event.target instanceof Node) || !link.contains(event.target)) return;
    if (event.relatedTarget instanceof Node && link.contains(event.relatedTarget)) return;
    unsnap();
  };

  const masks = [...root.querySelectorAll<HTMLElement>("[data-white-mask]")];
  const tick = (_time: number, deltaMs: number) => {
    if (document.hidden) return;
    if (tagline?.dataset.live !== undefined || tagline?.dataset.stale !== undefined) {
      textDirty = true;
      delete tagline.dataset.stale;
    }
    if (tagline && !textDirty) {
      const spot = tagline.getBoundingClientRect();
      if (spot.left !== painted.left || spot.top !== painted.top) textDirty = true;
    }
    if (textDirty) paintText();
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const rect = markEl.getBoundingClientRect();
    radius = parseFloat(getComputedStyle(markEl).borderTopLeftRadius) || 0;
    const box: Box = {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      hx: rect.width / 2,
      hy: rect.height / 2,
      r: radius,
    };
    appear = Math.min(Math.max(appear + (pointer.on ? dt : -dt) / APPEAR_SECONDS, 0), 1);
    const half = SEED.size / 2;
    const hold = (x: number, y: number) =>
      [
        Math.min(Math.max(x, box.cx - box.hx + half), box.cx + box.hx - half),
        Math.min(Math.max(y, box.cy - box.hy + half), box.cy + box.hy - half),
      ] as const;

    if (mode === "under") {
      const [holdX, holdY] = hold(pointer.x, pointer.y);
      const offX = pointer.x - holdX;
      const offY = pointer.y - holdY;
      const reach = Math.hypot(offX, offY);
      const lift = reach > 0 ? Math.min(RESIST * reach, MAX_PULL_PX) / reach : 0;
      settle(
        piece,
        reach > 0 ? holdX + offX * lift : pointer.x,
        reach > 0 ? holdY + offY * lift : pointer.y,
        reach > 0 ? CLOTH_SPRING : CURSOR_SPRING,
        dt,
      );
      const [footX, footY] = hold(piece.x, piece.y);
      foot.x = footX;
      foot.y = footY;
      pull.x = piece.x - foot.x;
      pull.y = piece.y - foot.y;
      pull.vx = piece.vx;
      pull.vy = piece.vy;
      release = RELEASE_SECONDS;
      if (reach > BREAK_PX) {
        mode = "free";
        release = 0;
        heading.x = pull.x;
        heading.y = pull.y;
      }
    } else {
      settle(piece, pointer.x, pointer.y, CURSOR_SPRING, dt);
      if (release < RELEASE_SECONDS) {
        release += dt;
        settle(pull, 0, 0, RELEASE_SPRING, dt);
        if (pull.x * heading.x + pull.y * heading.y <= 0) release = RELEASE_SECONDS;
      }
      if (release >= RELEASE_SECONDS) {
        pull.x = 0;
        pull.y = 0;
        pull.vx = 0;
        pull.vy = 0;
      }
      if (!snap.link && pointer.on && gapTo(piece.x, piece.y, box) <= -half) mode = "under";
    }

    let shapeX = piece.x;
    let shapeY = piece.y;
    let shapeHX = half;
    let shapeHY = half;
    const link = snap.link;
    if (link) {
      const around = link.getBoundingClientRect();
      const seat = around;
      const seatX = seat.left + seat.width / 2;
      const seatY = seat.top + seat.height / 2;
      const aroundX = around.left + around.width / 2;
      const aroundY = around.top + around.height / 2;
      const baseX = piece.x + (seatX - piece.x) * snap.fly;
      const baseY = piece.y + (seatY - piece.y) * snap.fly;
      shapeX = baseX + (aroundX - baseX) * snap.wrap;
      shapeY = baseY + (aroundY - baseY) * snap.wrap;
      shapeHX = half + (around.width / 2 + WRAP_PAD_X - half) * snap.wrap;
      shapeHY = half + (around.height / 2 + WRAP_PAD_Y - half) * snap.wrap;

      const clamp = (value: number) => Math.min(Math.max(value, -MAGNET_MAX_PX), MAGNET_MAX_PX);
      const restX = aroundX - snap.shiftX;
      const restY = aroundY - snap.shiftY;
      const wantX = clamp((pointer.x - restX) * MAGNET) * snap.wrap;
      const wantY = clamp((pointer.y - restY) * MAGNET) * snap.wrap;
      const follow = 1 - Math.exp(-dt * MAGNET_RATE);
      snap.shiftX += (wantX - snap.shiftX) * follow;
      snap.shiftY += (wantY - snap.shiftY) * follow;
      link.style.transform = `translate3d(${snap.shiftX.toFixed(2)}px, ${snap.shiftY.toFixed(2)}px, 0)`;
      if (snap.hop < 1) {
        shapeX = snap.from.x + (shapeX - snap.from.x) * snap.hop;
        shapeY = snap.from.y + (shapeY - snap.from.y) * snap.hop;
        shapeHX = snap.from.hx + (shapeHX - snap.from.hx) * snap.hop;
        shapeHY = snap.from.hy + (shapeHY - snap.from.hy) * snap.hop;
      }
    }

    stance.x = shapeX;
    stance.y = shapeY;
    stance.hx = shapeHX;
    stance.hy = shapeHY;

    let masked = false;
    if (!snap.link && pointer.seen && appear > 0.5) {
      for (const target of masks) {
        if (!target.checkVisibility({ visibilityProperty: true })) continue;
        const area = target.getBoundingClientRect();
        const left = Math.max(area.left, shapeX - shapeHX);
        const top = Math.max(area.top, shapeY - shapeHY);
        const right = Math.min(area.right, shapeX + shapeHX);
        const bottom = Math.min(area.bottom, shapeY + shapeHY);
        if (right <= left || bottom <= top) continue;
        chip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        chip.style.width = `${right - left}px`;
        chip.style.height = `${bottom - top}px`;
        chip.style.borderRadius = `${SEED.radius}px`;
        masked = true;
        break;
      }
    }
    chip.style.display = masked ? "block" : "none";

    const scale = pointer.seen ? APPEAR_EASE(appear) : 0;
    const ink = snap.link?.querySelector<HTMLElement>(":scope > .home__cta-ink");
    if (ink) {
      const area = ink.getBoundingClientRect();
      const hx = shapeHX * scale;
      const hy = shapeHY * scale;
      const top = Math.max(0, shapeY - hy - area.top);
      const left = Math.max(0, shapeX - hx - area.left);
      const bottom = Math.max(0, area.bottom - shapeY - hy);
      const right = Math.max(0, area.right - shapeX - hx);
      ink.style.clipPath = `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px round ${(SEED.radius * scale).toFixed(1)}px)`;
    }

    const values = [
      box.cx,
      box.cy,
      box.hx,
      box.hy,
      shapeX,
      shapeY,
      shapeHX,
      shapeHY,
      scale,
      foot.x,
      foot.y,
      pull.x,
      pull.y,
      text.x,
      text.y,
      text.w,
      text.h,
      radius,
      state.invert,
      state.image,
      state.pick,
      state.dither,
      state.wash,
      state.fit,
      state.field[0],
      state.field[1],
      state.field[2],
      state.frame.x,
      state.frame.y,
      state.frame.w,
      state.frame.h,
      state.frame.r,
    ];
    if (values.every((value, index) => Math.abs(value - last[index]) < 0.01)) return;
    last = values;

    const frame = state.frame;
    const photo =
      photos[state.image >= PICK_IMAGE ? PICK_IMAGE + state.pick : Math.max(state.image, 0)];
    const fit = (width: number, height: number) => {
      const w = photo?.size[0] ?? 1;
      const h = photo?.size[1] ?? 1;
      const scale = Math.max(width / w, height / h);
      const x = width / (w * scale),
        y = height / (h * scale);
      return [x, y, (1 - x) / 2, (1 - y) / 2];
    };
    gpu.draw(
      {
        dpr,
        box: [box.cx, box.cy, box.hx, box.hy],
        boxR: radius,
        piece: [shapeX, shapeY, scale],
        shape: [shapeHX, shapeHY, SEED.radius],
        foot: [foot.x, foot.y],
        pull: [pull.x, pull.y],
        color: [red, green, blue],
        textRect: [text.x, text.y, text.w, text.h],
        view: [innerWidth, innerHeight],
        invert: state.invert,
        field: state.field,
        dither: state.dither,
        wash: state.wash,
        frameOn: state.image >= 0 && frame.w > 0.5 && frame.h > 0.5 ? 1 : 0,
        frame: [frame.x + frame.w / 2, frame.y + frame.h / 2, frame.w / 2, frame.h / 2],
        frameR: Math.min(frame.r, frame.w / 2, frame.h / 2),
        cover: fit(innerWidth, innerHeight),
        coverFit: fit(Math.max(1, frame.w), Math.max(1, frame.h)),
        fit: state.fit,
      },
      photo,
    );
    hostEl.dataset.gpu = "on";
    root.dataset.renderer = "vgpu";
  };

  document.fonts?.ready.then(() => {
    if (alive) textDirty = true;
  });
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerout", onOut);
  window.addEventListener("pointerover", onOver);
  gsap.ticker.add(tick);

  return () => {
    alive = false;
    gsap.ticker.remove(tick);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerout", onOut);
    window.removeEventListener("pointerover", onOver);
    snap.motion?.kill();
    settleLink(snap.link);
    chip.remove();
    delete hostEl.dataset.gpu;
    delete root.dataset.renderer;
    delete document.documentElement.dataset.cloth;
    gpu.dispose();
    canvas.remove();
  };
}

import { FELLOWSHIP } from "../_lib/home-content";
import { EXIT, gsap, ScrollTrigger, SMOOTH, SWIFT } from "../_lib/motion";
import { createNodeBook } from "../journal/_components/node-book";
import { LOGO_LINES } from "../_components/logo";
import { PICK_IMAGE, type Frame, type Scene } from "./model";

const SEED_HALF = 7;
const SEED_RADIUS = 3;
const BLUE = [0x15 / 255, 0x46 / 255, 0xb0 / 255];
const WHITE = [1, 1, 1];
const BLACK = [0, 0, 0];
const FIELDS: { from: number; name: string }[] = [
  { from: 0, name: "blue" },
  { from: 3.5, name: "white" },
  { from: 5.6, name: "black" },
];
const RUN_FROM = 3.6;
const RUN_TO = 5.4;
const BOOK_ENTER = 0.9;
const TAGLINE_MOVES = 0.5;
const STAY_FROM = 6.2;
const STAY_TO = 9.2;
const BOX_MAX = 300;
const BOX_SHARE = 0.2;
const BOX_INSET = 32;
const WASH_AT = 9.7;
const COLUMN_AT = 10.2;
const LEDGER_FROM = 10.8;
const LEDGER_SHARE = 0.25;
const SHRINK_SECONDS = 0.8;
const LOGO_SECONDS = 0.35;
const CHARS_SECONDS = 0.3;
const CHAR_STAGGER = 0.004;
const FILL_SECONDS = 0.5;
const REST_LEAD = 0.05;
const HINT_UNTIL = 0.02;
const SLOT_HOLD = 1.4;
const SLOT_SWAP = 0.6;
const PEEK_MAX = 420;
const PEEK_SHARE = 0.28;
const PEEK_RATIO = 2 / 3;
const PEEK_GAP = 28;
const PEEK_LAG = 0.18;
const PEEK_FPS = 60;

// Defer geometry until ScrollTrigger refreshes, including viewport resizes.
const frameValues = (get: () => Frame) => ({
  x: () => get().x,
  y: () => get().y,
  w: () => get().w,
  h: () => get().h,
  r: () => get().r,
});

const seedAt = (x: number, y: number): Frame => ({
  x: x - SEED_HALF,
  y: y - SEED_HALF,
  w: SEED_HALF * 2,
  h: SEED_HALF * 2,
  r: SEED_RADIUS,
});

export function desktop(root: HTMLElement, state: Scene, exhibit = false) {
  const reel = root.querySelector<HTMLElement>(".home__scene")!;
  const layers = root.querySelector<HTMLElement>(".home__scene-layers")!;
  const loader = root.querySelector<HTMLElement>(".home__loader")!;
  const html = document.documentElement;
  const mark = loader.querySelector<HTMLElement>(".home__mark");
  const tagline = loader.querySelector<HTMLElement>(".home__tagline");
  const chars = [...loader.querySelectorAll<HTMLElement>(".home__char")];
  const glyphLines = LOGO_LINES.map((_, index) => [
    ...loader.querySelectorAll<SVGPathElement>(`[data-line="${index}"] .logo__glyph`),
  ]);
  const slogan = [...layers.querySelectorAll<HTMLElement>("[data-slogan-line]")];
  const copies = [...layers.querySelectorAll<HTMLElement>("[data-copy]")];
  let bounds = copies.map((copy) => copy.getBoundingClientRect());
  const journalRun = copies[0].querySelector<HTMLElement>("[data-scroll]");
  const staySide = layers.querySelector<HTMLElement>(".home__stay-side");
  const ledgerRun = copies[2]?.querySelector<HTMLElement>("[data-ledger]") ?? null;
  const strip = copies[2]?.querySelector<HTMLElement>("[data-slot-strip]") ?? null;
  if (!mark || !tagline || !ledgerRun || copies.length !== 3) return;

  reel.dataset.live = "";
  html.dataset.reel = "";
  if (exhibit) bounds = copies.map((copy) => copy.getBoundingClientRect());

  const width = () => window.innerWidth;
  const height = () => window.innerHeight;
  const frame = state.frame;
  const place = (target: Frame) => {
    frame.x = target.x;
    frame.y = target.y;
    frame.w = target.w;
    frame.h = target.h;
    frame.r = target.r;
  };
  const left = (): Frame => ({ x: 0, y: 0, w: width() / 2, h: height(), r: 0 });
  const full = (): Frame => ({ x: 0, y: 0, w: width(), h: height(), r: 0 });
  const box = (): Frame => {
    if (exhibit && staySide) {
      // The first two grid columns form a dedicated artwork area beside the copy.
      const column = staySide.getBoundingClientRect().left - layers.getBoundingClientRect().left;
      const w = Math.max(0, Math.min(
        BOX_MAX,
        column - BOX_INSET * 2,
        ((height() - BOX_INSET * 2) * 1067) / 1600,
      ));
      const h = (w * 1600) / 1067;
      return { x: (column - w) / 2, y: (height() - h) / 2, w, h, r: SEED_RADIUS };
    }
    const w = Math.min(BOX_MAX, width() * BOX_SHARE);
    const h = (w * 1600) / 1067;
    return { x: BOX_INSET, y: height() - BOX_INSET - h, w, h, r: SEED_RADIUS };
  };
  const shelf = [...layers.querySelectorAll<HTMLElement>("[data-book-holder]")].flatMap(
    (holder) => {
      const element = holder.querySelector<HTMLElement>(":scope > .node-book");
      const rig = element ? createNodeBook(element, { pip: null }) : null;
      return rig ? [{ holder, rig, open: false }] : [];
    },
  );
  const books = () => {
    shelf.forEach((book) => {
      if (book.open || book.holder.getBoundingClientRect().top >= height() * BOOK_ENTER) return;
      book.open = true;
      book.rig.measure();
      book.rig.open();
    });
  };
  const rows = [...layers.querySelectorAll<HTMLElement>("[data-stay-row]")];
  const grids = rows.map((row) => row.querySelector<HTMLElement>("[data-stay-grid]"));
  const texts = rows.map((row) => row.querySelector<HTMLElement>("[data-stay-text]"));
  const stay = (now: number) => {
    const progress = Math.min(Math.max((now - STAY_FROM) / (STAY_TO - STAY_FROM), 0), 1);
    const position = progress * (rows.length - 1);
    rows.forEach((row, index) => {
      const weight = Math.max(0, 1 - Math.abs(position - index));
      row.style.flexGrow = weight.toFixed(4);
      row.dataset.open = String(weight > 0.5);
      const grid = grids[index];
      if (grid) grid.style.gridTemplateRows = `${weight.toFixed(4)}fr`;
      const copy = texts[index];
      if (copy)
        copy.style.opacity = (
          weight >= 0.5 ? 1 : weight <= 0.23 ? 0 : (weight - 0.23) / 0.27
        ).toFixed(3);
    });
  };

  const WINDOWS = [
    [3.5, 5.6],
    [5.6, 9.7],
    [COLUMN_AT, Number.POSITIVE_INFINITY],
  ];
  const runUnits = (ledgerRun.offsetHeight + height()) / height();
  const ledgerTo = LEDGER_FROM + runUnits;
  const fillFrom = ledgerTo - 0.3;
  const shrinkFrom = fillFrom + FILL_SECONDS;
  const logoFrom = shrinkFrom + SHRINK_SECONDS;
  const charsFrom = logoFrom + 0.1;
  const end = charsFrom + CHARS_SECONDS + chars.length * CHAR_STAGGER;
  const openSize = mark.offsetWidth;
  const slot = gsap.timeline({ repeat: -1, paused: true });
  FELLOWSHIP.forms.forEach((_, index) => {
    slot.to(
      strip,
      {
        yPercent: (-100 * (index + 1)) / (FELLOWSHIP.forms.length + 1),
        duration: SLOT_SWAP,
        ease: SWIFT,
      },
      SLOT_HOLD + index * (SLOT_HOLD + SLOT_SWAP),
    );
  });
  let timeline: gsap.core.Timeline | null = null;
  const tint = { t: 0 };
  const paintTint = () => {
    state.field = BLACK.map((value, index) => value + (BLUE[index] - value) * tint.t) as [
      number,
      number,
      number,
    ];
  };
  const bill = layers.querySelector<HTMLElement>("[data-bill]");
  const occasions = bill ? [...bill.querySelectorAll<HTMLElement>("[data-occasion]")] : [];
  const peek = { on: -1, open: 0, dither: 1, x: 0, y: 0, px: 0, py: 0, fx: 0, fy: 0 };
  const peekSize = () => {
    const w = exhibit
      ? Math.max(0, Math.min(
          PEEK_MAX,
          width() / 6 - BOX_INSET * 2,
          (height() - BOX_INSET * 2) / PEEK_RATIO,
        ))
      : Math.min(PEEK_MAX, width() * PEEK_SHARE);
    return { w, h: w * PEEK_RATIO };
  };
  const peekSide = () => {
    const { w, h } = peekSize();
    return {
      x: peek.px + PEEK_GAP + w > width() ? 1 : 0,
      y: peek.py + PEEK_GAP + h > height() ? 1 : 0,
    };
  };
  const peekEnd = (keep: boolean) => {
    state.fit = 0;
    state.dither = 1;
    if (!keep) {
      state.image = -1;
      frame.w = 0;
      frame.h = 0;
    }
    clip();
  };
  const peekClose = (instant: boolean, keep = false) => {
    if (peek.on < 0 && peek.open <= 0) return;
    peek.on = -1;
    delete bill?.dataset.hover;
    occasions.forEach((occasion) => delete occasion.dataset.on);
    if (instant) {
      gsap.killTweensOf(peek);
      peek.open = 0;
      peek.dither = 1;
      peekEnd(keep);
      return;
    }
    gsap.to(peek, { dither: 1, duration: 0.2, ease: "none", overwrite: "auto" });
    gsap.to(peek, {
      open: 0,
      duration: 0.3,
      ease: SMOOTH,
      overwrite: "auto",
      onComplete: () => peekEnd(false),
    });
  };
  const peekEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const now = timeline?.time() ?? 0;
    if (now < LEDGER_FROM || now >= ledgerTo) return;
    const index = Number((event.currentTarget as HTMLElement).dataset.occasion);
    peek.px = event.clientX;
    peek.py = event.clientY;
    if (peek.on < 0 && peek.open <= 0) {
      const side = peekSide();
      peek.x = peek.px;
      peek.y = peek.py;
      peek.fx = side.x;
      peek.fy = side.y;
    }
    peek.on = index;
    if (bill) bill.dataset.hover = "";
    occasions.forEach((occasion, at) => {
      if (at === index) occasion.dataset.on = "";
      else delete occasion.dataset.on;
    });
    state.pick = index;
    state.image = PICK_IMAGE;
    state.fit = 1;
    peek.dither = 1;
    gsap.to(peek, { dither: 0, duration: 0.5, ease: "none", overwrite: "auto" });
    gsap.to(peek, { open: 1, duration: 0.45, ease: SWIFT, overwrite: "auto" });
  };
  const peekLeave = (event: PointerEvent) => {
    const next =
      event.relatedTarget instanceof Element
        ? event.relatedTarget.closest("[data-occasion]")
        : null;
    if (!next) peekClose(false);
  };
  const peekMove = (event: PointerEvent) => {
    peek.px = event.clientX;
    peek.py = event.clientY;
  };
  const peekTick = () => {
    if (peek.on < 0 && peek.open <= 0) return;
    if (exhibit) {
      // Grow and close inside the reserved left column, clear of the scrolling dates.
      const { w, h } = peekSize();
      const seed = SEED_HALF * 2;
      frame.w = seed + (w - seed) * peek.open;
      frame.h = seed + (h - seed) * peek.open;
      frame.x = (width() / 6 - frame.w) / 2;
      frame.y = (height() - frame.h) / 2;
      frame.r = SEED_RADIUS;
      state.dither = peek.dither;
      clip();
      return;
    }
    const follow = 1 - (1 - PEEK_LAG) ** gsap.ticker.deltaRatio(PEEK_FPS);
    const side = peekSide();
    const { w, h } = peekSize();
    peek.x += (peek.px - peek.x) * follow;
    peek.y += (peek.py - peek.y) * follow;
    peek.fx += (side.x - peek.fx) * follow;
    peek.fy += (side.y - peek.fy) * follow;
    const seed = SEED_HALF * 2;
    const tx = peek.x + PEEK_GAP - peek.fx * (2 * PEEK_GAP + w);
    const ty = peek.y + PEEK_GAP - peek.fy * (2 * PEEK_GAP + h);
    frame.x = peek.x - SEED_HALF + (tx - peek.x + SEED_HALF) * peek.open;
    frame.y = peek.y - SEED_HALF + (ty - peek.y + SEED_HALF) * peek.open;
    frame.w = seed + (w - seed) * peek.open;
    frame.h = seed + (h - seed) * peek.open;
    frame.r = SEED_RADIUS;
    state.dither = peek.dither;
    clip();
  };
  const clip = () => {
    const now = timeline?.time() ?? 0;
    if ((peek.on >= 0 || peek.open > 0) && (now < LEDGER_FROM || now >= ledgerTo))
      peekClose(true, now < LEDGER_FROM);
    state.rest = now >= end - REST_LEAD;
    reel.toggleAttribute("data-moved", now > HINT_UNTIL);
    if (exhibit) slot.totalTime(Math.max(0, now - LEDGER_FROM) * 5).pause();
    else if (now >= LEDGER_FROM && now < ledgerTo) slot.resume();
    else slot.pause();
    const active = WINDOWS.map(([from, to]) => now >= from && now < to);
    const moving = (now > 0 && now < TAGLINE_MOVES) || (now >= charsFrom && now < end);
    if (moving) tagline.dataset.live = "";
    else if (tagline.dataset.live !== undefined) {
      delete tagline.dataset.live;
      tagline.dataset.stale = "";
    }
    const field = FIELDS.filter((entry) => now >= entry.from).pop()?.name ?? "blue";
    if (reel.dataset.field !== field) reel.dataset.field = field;
    stay(now);
    books();
    copies.forEach((copy, index) => {
      if (!active[index]) {
        copy.style.clipPath = "inset(0 0 0 100%)";
        copy.style.visibility = "hidden";
        return;
      }
      copy.style.visibility = "";
      const rect = bounds[index];
      if (state.image < 0 || frame.w <= 0 || frame.h <= 0) {
        copy.style.clipPath = "none";
        return;
      }
      const x0 = frame.x - rect.left;
      const y0 = frame.y - rect.top;
      const x1 = x0 + frame.w;
      const y1 = y0 + frame.h;
      const w = rect.width;
      const h = rect.height;
      copy.style.clipPath = `polygon(evenodd, 0 0, ${w}px 0, ${w}px ${h}px, 0 ${h}px, 0 0, ${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px, ${x0}px ${y0}px)`;
    });
  };

  place(seedAt(width() / 4, height() / 2));
  state.image = -1;
  state.invert = 0;
  gsap.set(slogan, { yPercent: 110 });
  timeline = gsap.timeline({ paused: true, defaults: { ease: "none" }, onUpdate: clip });

  timeline
    .to(chars, { yPercent: 110, duration: 0.3, ease: EXIT, stagger: CHAR_STAGGER }, 0)
    .to(
      glyphLines[1],
      { y: LOGO_LINES[1].bottom - LOGO_LINES[1].top, duration: 0.35, ease: EXIT, stagger: 0.01 },
      0.05,
    )
    .to(
      glyphLines[0],
      { y: LOGO_LINES[0].bottom - LOGO_LINES[0].top, duration: 0.35, ease: EXIT, stagger: 0.01 },
      0.1,
    )
    .to(
      mark,
      { width: () => width(), height: () => height(), borderRadius: 0, duration: 1, ease: SMOOTH },
      0.2,
    )
    .set(state, { invert: 1, field: BLUE }, 1.2)
    .to(slogan, { yPercent: 0, duration: 0.5, ease: SWIFT, stagger: 0.14 }, 1.2)
    .to(slogan, { yPercent: -110, duration: 0.4, ease: EXIT, stagger: 0.08 }, 2.4)
    .set(state, { image: 0, dither: 1 }, 2.9)
    .fromTo(
      frame,
      frameValues(() => seedAt(width() / 4, height() / 2)),
      {
        ...frameValues(full),
        duration: 0.6,
        ease: SMOOTH,
      },
      2.9,
    )
    .set(state, { field: WHITE }, 3.5)
    .to(
      frame,
      {
        ...frameValues(left),
        duration: 0.5,
        ease: SMOOTH,
      },
      3.5,
    )
    .fromTo(
      journalRun,
      { y: () => height() },
      { y: () => -(journalRun?.offsetHeight ?? 0), duration: RUN_TO - RUN_FROM },
      RUN_FROM,
    )
    .to(state, { dither: 0, duration: 0.4 }, 3.9)
    .to(state, { dither: 1, duration: 0.2 }, 4.9)
    .to(
      frame,
      {
        ...frameValues(full),
        duration: 0.5,
        ease: SMOOTH,
      },
      5.1,
    )
    .to(state, { wash: 1, duration: 0.5 }, 5.1)
    .set(state, { image: 1, field: BLACK }, 5.6)
    .to(
      frame,
      {
        ...frameValues(box),
        duration: 0.6,
        ease: SMOOTH,
      },
      5.6,
    )
    .to(state, { fit: 1, duration: 0.6, ease: SMOOTH }, 5.6)
    .to(state, { wash: 0, duration: 0.5 }, 5.6)
    .to(state, { dither: 0, duration: 0.4 }, 6.1)
    .to({}, { duration: STAY_TO - STAY_FROM }, STAY_FROM)
    .to(state, { dither: 1, duration: 0.2 }, 9.0)
    .to(
      frame,
      {
        ...frameValues(full),
        duration: 0.5,
        ease: SMOOTH,
      },
      9.2,
    )
    .to(state, { fit: 0, duration: 0.5, ease: SMOOTH }, 9.2)
    .to(state, { wash: 1, duration: COLUMN_AT - WASH_AT }, WASH_AT)
    .set(
      mark,
      { width: () => width() * LEDGER_SHARE, x: () => (-width() * (1 - LEDGER_SHARE)) / 2 },
      COLUMN_AT,
    )
    .to(
      frame,
      {
        x: () => width() * LEDGER_SHARE,
        w: () => width() * (1 - LEDGER_SHARE),
        duration: LEDGER_FROM - COLUMN_AT,
        ease: SMOOTH,
      },
      COLUMN_AT,
    )
    .set(state, { image: -1, wash: 0 }, LEDGER_FROM)
    .fromTo(
      ledgerRun,
      { y: () => height() },
      { y: () => -ledgerRun.offsetHeight, duration: runUnits },
      LEDGER_FROM,
    )
    .to(mark, { width: () => width(), x: 0, duration: FILL_SECONDS, ease: SMOOTH }, fillFrom)
    .to(tint, { t: 1, duration: SHRINK_SECONDS, ease: SMOOTH, onUpdate: paintTint }, shrinkFrom)
    .to(
      mark,
      {
        width: openSize,
        height: openSize,
        borderRadius: SEED_RADIUS,
        duration: SHRINK_SECONDS,
        ease: SMOOTH,
      },
      shrinkFrom,
    )
    .to(glyphLines[0], { y: 0, duration: LOGO_SECONDS, ease: SWIFT, stagger: 0.01 }, logoFrom)
    .to(
      glyphLines[1],
      { y: 0, duration: LOGO_SECONDS, ease: SWIFT, stagger: 0.01 },
      logoFrom + 0.05,
    )
    .to(
      chars,
      { yPercent: 0, duration: CHARS_SECONDS, ease: SWIFT, stagger: CHAR_STAGGER },
      charsFrom,
    );

  reel.style.height = exhibit ? `${height()}px` : `${Math.round((timeline.duration() + 1) * height())}px`;

  occasions.forEach((occasion) => {
    occasion.addEventListener("pointerenter", peekEnter);
    occasion.addEventListener("pointerleave", peekLeave);
  });
  bill?.addEventListener("pointermove", peekMove);
  gsap.ticker.add(peekTick);

  const trigger = exhibit ? null : ScrollTrigger.create({
    trigger: reel,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    animation: timeline,
    invalidateOnRefresh: true,
    onRefresh: () => {
      bounds = copies.map((copy) => copy.getBoundingClientRect());
      clip();
    },
  });
  ScrollTrigger.refresh();

  // The exhibition drives this same timeline; the ordinary homepage remains scroll-driven.
  let previous = 0;
  const playback = (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    const data = event.data;
    if (data?.type !== "artifact:playback" || !Number.isFinite(data.progress)) return;
    const progress = Math.min(1, Math.max(0, data.progress));
    if (progress < previous) shelf.forEach((book) => {
      book.open = false;
      book.rig.reset();
    });
    previous = progress;
    timeline?.progress(progress);
    clip();
    if (timeline && timeline.time() >= LEDGER_FROM && timeline.time() < ledgerTo) {
      const visible = occasions.map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.top > 0 && rect.bottom < height())
        .sort((a, b) => Math.abs(a.rect.top - height() * 0.45) - Math.abs(b.rect.top - height() * 0.45))[0];
      if (visible && Number(visible.element.dataset.occasion) !== peek.on) {
        visible.element.dispatchEvent(new PointerEvent("pointerenter", {
          pointerType: "mouse", clientX: 32, clientY: height() * 0.2,
        }));
      } else if (!visible && peek.on >= 0) peekClose(false);
    }
  };
  if (exhibit) window.addEventListener("message", playback);

  return () => {
    window.removeEventListener("message", playback);
    trigger?.kill();
    slot.kill();
    gsap.ticker.remove(peekTick);
    gsap.killTweensOf(peek);
    occasions.forEach((occasion) => {
      occasion.removeEventListener("pointerenter", peekEnter);
      occasion.removeEventListener("pointerleave", peekLeave);
      delete occasion.dataset.on;
    });
    bill?.removeEventListener("pointermove", peekMove);
    delete bill?.dataset.hover;
    timeline?.revert();
    shelf.forEach((book) => book.rig.dispose());
    delete reel.dataset.live;
    delete reel.dataset.moved;
    reel.style.height = "";
    delete html.dataset.reel;
    delete tagline.dataset.live;
    delete tagline.dataset.stale;

    rows.forEach((row, index) => {
      row.style.flexGrow = "";
      delete row.dataset.open;
      const grid = grids[index];
      if (grid) grid.style.gridTemplateRows = "";
      const copy = texts[index];
      if (copy) copy.style.opacity = "";
    });
    delete reel.dataset.field;
    copies.forEach((copy) => {
      copy.style.clipPath = "";
      copy.style.visibility = "";
    });
    gsap.set([mark, journalRun, ledgerRun, strip, ...chars, ...glyphLines.flat(), ...slogan], {
      clearProps: "transform,width,height,borderRadius",
    });
  };
}

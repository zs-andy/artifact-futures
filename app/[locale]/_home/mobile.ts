import { BLOOM, EXIT, gsap, ScrollTrigger, SMOOTH, SWIFT } from "../_lib/motion";
import { SEED } from "../_lib/seed";
import { LOGO_LINES } from "../_components/logo";
import { createNodeBook, type NodeBookRig } from "../journal/_components/node-book";
const SLOT_HOLD = 1.4;
const SLOT_SWAP = 0.6;
const ROUND_BELOW = 0.3;
const pad = (n: number) => String(n).padStart(2, "0");
const frameOf = (element: HTMLElement) => ({ w: element.offsetWidth, h: element.offsetHeight });

const seedClip = (element: HTMLElement) => {
  const { w, h } = frameOf(element);
  return `inset(0px ${w - SEED.size}px ${h - SEED.size}px 0px round ${SEED.radius}px)`;
};

const OPEN_CLIP = `inset(0px 0px 0px 0px round ${SEED.radius}px)`;

const scaleOf = (element: HTMLElement) => {
  const outer = element.parentElement;
  const x =
    Number(gsap.getProperty(element, "scaleX")) *
    (outer ? Number(gsap.getProperty(outer, "scaleX")) : 1);
  const y =
    Number(gsap.getProperty(element, "scaleY")) *
    (outer ? Number(gsap.getProperty(outer, "scaleY")) : 1);
  return { x, y };
};

const round = (fill: HTMLElement) => {
  const scale = scaleOf(fill);
  fill.style.borderRadius =
    scale.x < ROUND_BELOW
      ? `${SEED.radius / scale.x}px / ${SEED.radius / Math.max(scale.y, 1e-4)}px`
      : "";
};

const seedIn = (field: HTMLElement, seed: HTMLElement) => {
  const box = field.getBoundingClientRect();
  const dot = seed.getBoundingClientRect();
  return {
    x: dot.left - box.left,
    y: dot.top - box.top,
    scaleX: dot.width / Math.max(box.width, 1),
    scaleY: dot.height / Math.max(box.height, 1),
  };
};

function opening(root: HTMLElement) {
  const scene = root.querySelector<HTMLElement>(".home__scene")!;
  const stage = root.querySelector<HTMLElement>(".home__scene-stage")!;
  const loader = root.querySelector<HTMLElement>(".home__loader")!;
  const field = root.querySelector<HTMLElement>(".home__field")!;
  const ROUND_BELOW = 0.6;
  const DROP_SECONDS = 0.3,
    GROW_AT = 0.3,
    GROW_SECONDS = 1,
    HINT_UNTIL = 0.02;
  const mark = loader.querySelector<HTMLElement>(".home__mark");
  const ink = loader.querySelector<HTMLElement>(".home__ink");
  if (!mark || !ink) return;
  const glyphLines = LOGO_LINES.map((_, index) => [
    ...loader.querySelectorAll<SVGPathElement>(`[data-line="${index}"] .logo__glyph`),
  ]);

  scene.dataset.phone = "";

  const box = () => {
    const frame = stage.getBoundingClientRect();
    const block = mark.getBoundingClientRect();
    return {
      x: block.left - frame.left,
      y: block.top - frame.top,
      scaleX: block.width / Math.max(field.offsetWidth, 1),
      scaleY: block.height / Math.max(field.offsetHeight, 1),
    };
  };
  const round = () => {
    const x = Number(gsap.getProperty(field, "scaleX"));
    const y = Number(gsap.getProperty(field, "scaleY"));
    field.style.borderRadius =
      x < ROUND_BELOW ? `${SEED.radius / x}px / ${SEED.radius / Math.max(y, 1e-4)}px` : "";
  };

  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: "none" },
    onUpdate: () => {
      round();
      scene.toggleAttribute("data-moved", timeline.time() > HINT_UNTIL);
    },
  });

  timeline
    .to(ink, { yPercent: 110, duration: DROP_SECONDS, ease: EXIT }, 0)
    .to(
      glyphLines[1],
      {
        y: LOGO_LINES[1].bottom - LOGO_LINES[1].top,
        duration: DROP_SECONDS,
        ease: EXIT,
        stagger: 0.01,
      },
      0.03,
    )
    .to(
      glyphLines[0],
      {
        y: LOGO_LINES[0].bottom - LOGO_LINES[0].top,
        duration: DROP_SECONDS,
        ease: EXIT,
        stagger: 0.01,
      },
      0.06,
    )
    .fromTo(
      field,
      {
        x: () => box().x,
        y: () => box().y,
        scaleX: () => box().scaleX,
        scaleY: () => box().scaleY,
        autoAlpha: 0,
      },
      { autoAlpha: 1, duration: 0.001 },
      GROW_AT,
    )
    .to(field, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: GROW_SECONDS, ease: SMOOTH }, GROW_AT);

  const trigger = ScrollTrigger.create({
    trigger: scene,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    animation: timeline,
    invalidateOnRefresh: true,
  });
  round();
  ScrollTrigger.refresh();

  return () => {
    trigger.kill();
    timeline.revert();
    field.style.removeProperty("border-radius");
    gsap.set([ink, ...glyphLines.flat()], { clearProps: "transform" });
    delete scene.dataset.phone;
    delete scene.dataset.moved;
  };
}
export function mobile(home: HTMLElement) {
  const closeOpening = opening(home);
  const root = home.querySelector<HTMLElement>(".folio")!;
  ScrollTrigger.config({ ignoreMobileResize: true });
  root.dataset.live = "";
  const all = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) => [
    ...scope.querySelectorAll<T>(selector),
  ];
  const one = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = root) =>
    scope.querySelector<T>(selector);

  all("[data-title]").forEach((title) => {
    const inner = one(".folio__mask > span", title);
    if (!inner) return;
    gsap.from(inner, {
      yPercent: 110,
      duration: 1,
      ease: SWIFT,
      scrollTrigger: { trigger: title, start: "top 92%", once: true },
    });
  });

  all("[data-rise]").forEach((block) => {
    gsap.from(block, {
      y: 28,
      autoAlpha: 0,
      duration: 0.9,
      ease: SWIFT,
      scrollTrigger: { trigger: block, start: "top 94%", once: true },
    });
  });

  all("[data-open]").forEach((frame) => {
    gsap.fromTo(
      frame,
      { clipPath: () => seedClip(frame) },
      {
        clipPath: OPEN_CLIP,
        duration: 1.1,
        ease: BLOOM,
        scrollTrigger: { trigger: frame, start: "top 86%", once: true },
      },
    );
  });

  const slogan = one(".folio__slogan");
  const sloganField = one(".folio__slogan-field");
  const journalSeed = one(".folio__journal [data-seed]");
  if (slogan && sloganField && journalSeed) {
    gsap.from(all(".folio__slogan .folio__mask > span"), {
      yPercent: 110,
      duration: 0.9,
      ease: SWIFT,
      stagger: 0.1,
      scrollTrigger: {
        trigger: one(".folio__slogan-text") ?? slogan,
        start: "top 80%",
        once: true,
      },
    });
    gsap.fromTo(
      sloganField,
      { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      {
        x: () => seedIn(slogan, journalSeed).x,
        y: () => seedIn(slogan, journalSeed).y,
        scaleX: () => seedIn(slogan, journalSeed).scaleX,
        scaleY: () => seedIn(slogan, journalSeed).scaleY,
        ease: SMOOTH,
        onUpdate: () => round(sloganField),
        scrollTrigger: {
          trigger: slogan,
          start: "bottom bottom",
          endTrigger: journalSeed,
          end: "top 42%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }

  const residency = one(".folio__residency");
  const residencyField = one(".folio__field", residency ?? root);
  const residencyFill = one(".folio__field-fill", residency ?? root);
  const residencySeed = residency ? one("[data-seed]", residency) : null;
  const programmeSeed = one(".folio__programme [data-seed]");
  if (residency && residencyField && residencyFill && residencySeed && programmeSeed) {
    gsap.fromTo(
      residencyFill,
      {
        x: () => seedIn(residency, residencySeed).x,
        y: () => seedIn(residency, residencySeed).y,
        scaleX: () => seedIn(residency, residencySeed).scaleX,
        scaleY: () => seedIn(residency, residencySeed).scaleY,
      },
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        ease: SMOOTH,
        onUpdate: () => round(residencyFill),
        scrollTrigger: {
          trigger: residency,
          start: "top bottom",
          end: "top 18%",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => residency.toggleAttribute("data-grown", self.progress > 0.98),
        },
      },
    );
    gsap.fromTo(
      residencyField,
      { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      {
        x: () => seedIn(residency, programmeSeed).x,
        y: () => seedIn(residency, programmeSeed).y,
        scaleX: () => seedIn(residency, programmeSeed).scaleX,
        scaleY: () => seedIn(residency, programmeSeed).scaleY,
        ease: SMOOTH,
        onUpdate: () => round(residencyFill),
        scrollTrigger: {
          trigger: residency,
          start: "bottom 55%",
          endTrigger: programmeSeed,
          end: "top 40%",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );
  }

  const focus = (rows: HTMLElement[], line: string, onFocus?: (index: number) => void) =>
    rows.forEach((row, index) =>
      ScrollTrigger.create({
        trigger: row,
        start: `top ${line}`,
        end: `bottom ${line}`,
        onToggle: (self) => {
          row.toggleAttribute("data-on", self.isActive);
          if (self.isActive) onFocus?.(index);
        },
      }),
    );

  focus(all(".folio__residency .folio__rows > li"), "58%");

  const strip = one("[data-strip]");
  if (strip) {
    const count = strip.children.length - 1;
    const cycle = gsap.timeline({ repeat: -1, paused: true });
    for (let index = 0; index < count; index++) {
      cycle.to(
        strip,
        { yPercent: (-100 * (index + 1)) / (count + 1), duration: SLOT_SWAP, ease: SWIFT },
        SLOT_HOLD + index * (SLOT_HOLD + SLOT_SWAP),
      );
    }
    ScrollTrigger.create({
      trigger: strip.parentElement ?? strip,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => void (self.isActive ? cycle.play() : cycle.pause()),
    });
  }

  const rigs: NodeBookRig[] = [];
  all("[data-book]").forEach((holder) => {
    const book = one(":scope > .node-book", holder);
    const rig = book ? createNodeBook(book, { pip: null }) : null;
    if (!rig) return;
    rigs.push(rig);
    ScrollTrigger.create({
      trigger: holder,
      start: "top 82%",
      once: true,
      onEnter: () => {
        rig.measure();
        rig.open();
      },
    });
  });

  const finder = one("[data-finder]");
  const frames = finder ? all("[data-frame]", finder) : [];
  const counter = finder ? one("[data-count]", finder) : null;
  if (finder && frames.length) {
    let current = 0;
    let depth = frames.length;
    frames.forEach((frame, index) => {
      frame.style.zIndex = String(frames.length - index);
    });
    focus(all("[data-occasion]"), "64%", (index) => {
      if (index === current) return;
      current = index;
      const frame = frames[index];
      const photo = one("img", frame);
      depth += 1;
      frame.style.zIndex = String(depth);
      if (counter) counter.textContent = pad(index + 1);
      gsap.fromTo(
        frame,
        { clipPath: seedClip(frame) },
        { clipPath: OPEN_CLIP, duration: 0.8, ease: SWIFT, overwrite: true },
      );
      if (photo)
        gsap.fromTo(
          photo,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.9,
            delay: 0.3,
            ease: SMOOTH,
            overwrite: true,
          },
        );
    });
  }

  const block = one("[data-block]");
  if (block) {
    const fill = one(".folio__block-fill", block);
    const lines = LOGO_LINES.map((line, index) => ({
      glyphs: all<SVGPathElement>(`[data-line="${index}"] .logo__glyph`, block),
      drop: line.bottom - line.top,
    }));
    const tagline = one(".folio__tagline > span");
    const close = gsap.timeline({
      scrollTrigger: { trigger: block, start: "top 78%", once: true },
    });
    close.fromTo(
      fill,
      { width: SEED.size, height: SEED.size },
      { width: "100%", height: "100%", duration: 1.2, ease: BLOOM },
      0,
    );
    lines.forEach((line, index) => {
      close.fromTo(
        line.glyphs,
        { y: line.drop },
        { y: 0, duration: 0.9, ease: SWIFT, stagger: 0.035 },
        0.55 + index * 0.12,
      );
    });
    if (tagline) close.from(tagline, { yPercent: 110, duration: 0.9, ease: SWIFT }, 0.95);
  }

  return () => {
    closeOpening?.();
    rigs.forEach((rig) => rig.dispose());
    all("[data-on]").forEach((row) => row.removeAttribute("data-on"));
    residency?.removeAttribute("data-grown");
    [sloganField, residencyFill].forEach((fill) => fill?.style.removeProperty("border-radius"));
    frames.forEach((frame) => frame.style.removeProperty("z-index"));
    delete root.dataset.live;
  };
}

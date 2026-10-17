import gsap from "gsap";
import { dialAngles } from "../_components/reel-clock";
import { BASES, JOURNAL } from "./reel-data";
import { EASE, pass, type Metrics } from "./reel-kit";

export type Ink = { mark: string; nav: string };

export type Reel = {
  timeline: gsap.core.Timeline;
  rest: number;
  intro: number;
  inkAt: (time: number) => Ink;
  track: (time: number) => void;
  revert: () => void;
};

type Key<T> = { at: number; value: T };

const pick = <T,>(keys: Key<T>[], time: number) => {
  let value = keys[0].value;
  keys.forEach((key) => {
    if (time >= key.at) value = key.value;
  });
  return value;
};

const inverse = (curve: (value: number) => number, share: number) => {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 20; step += 1) {
    const middle = (low + high) / 2;
    if (curve(middle) < share) low = middle;
    else high = middle;
  }
  return high;
};

const inkBox = (root: HTMLElement, stop: HTMLElement | null) => {
  const base = stop?.querySelector<HTMLElement>(".rl-slogan__base");
  const pen = document.createElement("canvas").getContext("2d");
  if (!stop || !base || !pen) return null;
  const style = getComputedStyle(stop);
  pen.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const glyph = pen.measureText(".");
  const frame = root.getBoundingClientRect();
  const left = stop.getBoundingClientRect().left - frame.left;
  const line = base.getBoundingClientRect().top - frame.top;
  return {
    left: left - glyph.actualBoundingBoxLeft,
    right: left + glyph.actualBoundingBoxRight,
    top: line - glyph.actualBoundingBoxAscent,
    bottom: line + glyph.actualBoundingBoxDescent,
  };
};

const CODE_TOP = 0.854;
const CODE_TALL = 0.113;
const SHEET = 1.15;
const BARS_AT = 3;

export function buildReel(root: HTMLElement, metrics: Metrics): Reel {
  const { width, height, u } = metrics;
  const q = <E extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<E>(selector);
  const qa = <E extends HTMLElement = HTMLElement>(selector: string) =>
    gsap.utils.toArray<E>(selector, root);
  const timeline = gsap.timeline({ paused: true });
  const inks = {
    mark: [{ at: 0, value: "black" }] as Key<string>[],
    nav: [{ at: 0, value: "black" }] as Key<string>[],
  };
  const ink = (value: string, mark: number, nav: number) => {
    inks.mark.push({ at: mark, value });
    inks.nav.push({ at: nav, value });
  };
  const scenes: Key<string>[] = [{ at: 0, value: "cover" }];
  const folios: Key<string>[] = [{ at: 0, value: `p. ${JOURNAL.spreads[0][0]}` }];

  const context = gsap.context(() => {
    const every = (selector: string, at: number, gap: number, options?: Parameters<typeof pass>[3]) =>
      qa(selector).forEach((line, index) => pass(timeline, line, at + index * gap, options));
    const drift = (selector: string, at: number, to: { x?: number; y?: number }, duration = SHEET) =>
      qa(selector).forEach((body) =>
        timeline.fromTo(body, { x: 0, y: 0 }, { ...to, duration, ease: EASE.band }, at),
      );
    const pin = (selector: string, at: number) =>
      qa(selector).forEach((dot) =>
        timeline.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.6, ease: EASE.land }, at),
      );
    const rules = (selector: string, at: number, gap: number, duration = 0.95) =>
      qa(selector).forEach((rule, index) =>
        timeline.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration, ease: EASE.band }, at + index * gap),
      );

    const sheet = q(".rl-cover__sheet");
    if (sheet) timeline.fromTo(sheet, { x: -width }, { x: 0, duration: 1.05, ease: EASE.band }, 0.1);
    ink("white", 0.42, 0.42);
    every(".rl-cover__word", 0.72, 0, { duration: 1.25 });
    every(".rl-cover__lead .rl-pass", 1.5, 0, { duration: 0.8 });
    every(".rl-cover__bases .rl-pass", 1.58, 0.07, { duration: 0.8 });

    const codeWidth = metrics.inset;
    const codeLeft = width - codeWidth;
    const codeTop = height * CODE_TOP;
    const codeTall = height * CODE_TALL;
    const bars = qa(".rl-code__bar");
    const barsAt = BARS_AT;
    const barsFor = 1.25;
    const barGap = 0.012;
    bars.forEach((bar, index) => {
      const start = Number.parseFloat(bar.style.getPropertyValue("--start"));
      const span = Number.parseFloat(bar.style.getPropertyValue("--span"));
      const size = Number.parseFloat(bar.style.getPropertyValue("--size"));
      const small = {
        y: codeTop + start * codeTall - start * height,
        scaleX: codeWidth / width,
        scaleY: (size * codeTall) / (span * height + 1),
      };
      timeline.fromTo(
        bar,
        { x: codeLeft, ...small },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: barsFor, ease: EASE.band, immediateRender: false },
        barsAt + (bars.length - 1 - index) * barGap,
      );
      timeline.fromTo(
        bar,
        { x: width, ...small },
        { x: codeLeft, ...small, duration: 0.7, ease: EASE.land },
        1.7 + index * barGap,
      );
    });
    drift(".rl-cover__drift", barsAt, { y: -u * 1.6 }, barsFor + bars.length * barGap);
    const paperAt = barsAt + (bars.length - 1) * barGap + barsFor;
    ink("black", 4.5, 4.35);
    const paper = q(".rl-slogan__paper");
    if (paper) timeline.fromTo(paper, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, paperAt);

    scenes.push({ at: 4.2, value: "slogan" });
    qa(".rl-slogan__slice").forEach((slice, index) => {
      const landed = barsAt + (bars.length - 1 - index) * barGap + barsFor;
      timeline.fromTo(slice, { x: width }, { x: 0, duration: 1.35, ease: EASE.land }, landed - 0.3);
    });

    const nightAt = 7.4;
    scenes.push({ at: nightAt, value: "night" });
    const night = q(".rl-night__sheet");
    const stop = inkBox(root, q(".rl-slogan__source .rl-slogan__stop"));
    const nightShot = q(".rl-night");
    if (nightShot) timeline.fromTo(nightShot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, nightAt);
    if (night && stop) {
      const round = Math.min(stop.right - stop.left, stop.bottom - stop.top) * 0.22;
      timeline.fromTo(
        night,
        {
          clipPath: `inset(${stop.top}px ${width - stop.right}px ${height - stop.bottom}px ${stop.left}px round ${round}px)`,
        },
        { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1.1, ease: EASE.band },
        nightAt,
      );
    }
    ink("white", nightAt + 0.55, nightAt + 0.7);

    const ringAt = nightAt + 0.7;
    const ringFor = 1.4;
    qa(".rl-dial__ring").forEach((ring) =>
      timeline.fromTo(ring, { "--sweep": "0deg" }, { "--sweep": "360deg", duration: ringFor, ease: EASE.band }, ringAt),
    );
    const ringCurve = gsap.parseEase(EASE.band);
    qa(".rl-dial__tick").forEach((tick, index) => {
      const share = ((24 - (index % 24)) % 24) / 24;
      timeline.fromTo(
        tick,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.2, ease: "none" },
        ringAt + ringFor * inverse(ringCurve, share),
      );
    });

    const now = new Date();
    const hourOf = (zone?: string) => (zone ? dialAngles(zone, now).hour : 0);
    const minute = dialAngles(BASES[0].zone, now).minute;
    const handsAt = ringAt + 0.25;
    const handsFor = 2.4;
    const REWIND = 3;
    qa(".rl-dial__hand").forEach((hand) => {
      const target = hand.dataset.zone ? hourOf(hand.dataset.zone) : minute;
      const back = hand.dataset.zone ? REWIND * 15 : REWIND * 360;
      timeline.fromTo(hand, { "--g": 0 }, { "--g": 1, duration: 0.8, ease: EASE.land }, handsAt);
      timeline.fromTo(
        hand,
        { "--a": `${target + back}deg` },
        { "--a": `${target}deg`, duration: handsFor, ease: EASE.band },
        handsAt,
      );
    });
    qa(".rl-dial__label").forEach((label) =>
      label
        .querySelectorAll<HTMLElement>(".rl-dial__read")
        .forEach((read) =>
          pass(timeline, read, handsAt + handsFor - 0.45, {
            duration: 1,
            ease: EASE.land,
            reverse: label.dataset.side === "left",
          }),
        ),
    );
    pin(".rl-dial__pin", handsAt);

    const foldAt = handsAt + handsFor + 1.1;
    const foldFor = 0.9;
    qa(".rl-dial__hand").forEach((hand) => {
      const target = hand.dataset.zone ? hourOf(hand.dataset.zone) : minute;
      timeline.fromTo(
        hand,
        { "--a": `${target}deg` },
        { "--a": "0deg", duration: foldFor, ease: EASE.band, immediateRender: false },
        foldAt,
      );
    });
    const gutter = q(".rl-night__gutter");
    const hand = q(".rl-dial__hand--minute")?.offsetHeight ?? 0;
    const splitAt = foldAt + foldFor + 0.5;
    if (gutter) {
      timeline.fromTo(gutter, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, foldAt + foldFor);
      timeline.fromTo(
        gutter,
        { clipPath: `inset(${height / 2 - hand}px 0px ${height / 2}px 0px)` },
        { clipPath: "inset(0px 0px 0px 0px)", duration: 0.55, ease: EASE.band, immediateRender: false },
        foldAt + foldFor,
      );
      timeline.fromTo(
        gutter,
        { clipPath: "inset(0px 0px 0px 0px)" },
        { clipPath: `inset(${height / 2}px 0px ${height / 2}px 0px)`, duration: 0.7, ease: EASE.band, immediateRender: false },
        splitAt + 0.35,
      );
    }
    const splitFor = 1.2;
    qa(".rl-night__half").forEach((half) =>
      timeline.fromTo(
        half,
        { x: 0 },
        { x: half.dataset.side === "left" ? -width / 2 : width / 2, duration: splitFor, ease: EASE.band },
        splitAt,
      ),
    );

    scenes.push({ at: splitAt, value: "journal" });
    const journal = q(".rl-journal");
    if (journal) timeline.fromTo(journal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, splitAt);
    const spread = q(".rl-journal__spread");
    if (spread)
      timeline.fromTo(spread, { scale: 1.08 }, { scale: 1, duration: 1.7, ease: EASE.land }, splitAt);

    const lefts = qa(".rl-journal__side[data-side='left'] .rl-journal__leaf");
    const rights = qa(".rl-journal__side[data-side='right'] .rl-journal__leaf");
    const shade = (leaf: HTMLElement) => leaf.querySelector<HTMLElement>(".rl-journal__shade");
    const FLIPS = [0.95, 0.66, 0.46, 0.36, 0.32, 0.36, 0.52, 0.86];
    let flipAt = splitAt + splitFor + 0.25;
    lefts.slice(1).forEach((leaf) => timeline.set(leaf, { scaleX: 0 }, 0));
    JOURNAL.spreads.slice(1).forEach((pair, index) => {
      const turn = FLIPS[index % FLIPS.length];
      const half = turn / 2;
      const out = rights[index];
      const into = lefts[index + 1];
      if (out) {
        timeline.fromTo(out, { scaleX: 1 }, { scaleX: 0, duration: half, ease: "power2.in" }, flipAt);
        const dark = shade(out);
        if (dark) timeline.fromTo(dark, { opacity: 0 }, { opacity: 0.32, duration: half, ease: "power2.in" }, flipAt);
      }
      if (into) {
        timeline.fromTo(into, { scaleX: 0 }, { scaleX: 1, duration: half, ease: "power2.out", immediateRender: false }, flipAt + half);
        const dark = shade(into);
        if (dark) timeline.fromTo(dark, { opacity: 0.32 }, { opacity: 0, duration: half, ease: "power2.out" }, flipAt + half);
      }
      folios.push({ at: flipAt + half, value: `p. ${pair[0]}` });
      flipAt += index === JOURNAL.spreads.length - 2 ? turn : turn * 0.72;
    });

    const backAt = flipAt + 0.35;
    const backFor = 1.35;
    if (spread) {
      const scale = Math.min(0.6, (width * 0.42) / Math.max(spread.offsetWidth, 1));
      const lift = height - metrics.edge - (spread.offsetHeight * scale) / 2 - height / 2;
      timeline.fromTo(
        spread,
        { scale: 1, y: 0 },
        { scale, y: lift, duration: backFor, ease: EASE.band, immediateRender: false },
        backAt,
      );
    }
    every(".rl-journal__word", backAt + 0.45, 0, { duration: 1.3, ease: EASE.land });
    qa(".rl-journal__issue").forEach((issue) =>
      issue
        .querySelectorAll<HTMLElement>(":scope > .rl-pass")
        .forEach((line) => pass(timeline, line, backAt + 0.7, { duration: 1, ease: EASE.land })),
    );
    every(".rl-journal__line .rl-pass", backAt + 0.7, 0, { duration: 1, ease: EASE.land });
    every(".rl-journal__folio", splitAt + splitFor, 0, { duration: 0.8, ease: EASE.land });

    const shift = backAt + backFor + 1.6 - 15;
    const dayAt = 15 + shift;
    scenes.push({ at: dayAt, value: "fellowship" });
    const day = q(".rl-fellow__sheet");
    if (day) pass(timeline, day, dayAt, { duration: SHEET, reverse: true });
    drift(".rl-journal__mast, .rl-journal__aside, .rl-journal__issues", dayAt, { x: -u * 2.2 });
    ink("black", 15.85 + shift, 15.4 + shift);
    every(".rl-fellow__word .rl-pass", 15.6 + shift, 0.1, { duration: 1 });
    every(".rl-fellow__line .rl-pass", 15.8 + shift, 0, { duration: 0.9 });
    const frame = q(".rl-fellow__frame");
    if (frame) pass(timeline, frame, 15.7 + shift, { duration: 1.1 });
    every(".rl-fellow__lead", 16.5 + shift, 0, { duration: 0.8 });
    every(".rl-fellow__form", 17.05 + shift, 0.3, { duration: 0.28, ease: "power2.inOut" });

    const darkAt = 20.3 + shift;
    scenes.push({ at: darkAt, value: "programme" });
    const dark = q(".rl-programme__sheet");
    if (dark) pass(timeline, dark, darkAt, { duration: SHEET });
    drift(".rl-fellow__body", darkAt, { y: u * 1.6 });
    ink("white", 20.42 + shift, 20.42 + shift);
    every(".rl-programme__word .rl-pass", 20.95 + shift, 0.1, { duration: 1 });
    const line = q(".rl-programme__line");
    const drawAt = 21.2 + shift;
    const drawFor = 1.8;
    if (line)
      timeline.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: drawFor, ease: "power1.inOut" }, drawAt);
    const draw = gsap.parseEase("power1.inOut");
    qa(".rl-programme__event").forEach((event, index, all) => {
      const at = drawAt + drawFor * inverse(draw, Math.max(index / all.length, 0.001));
      const dot = event.querySelector(".rl-programme__dot");
      if (dot) timeline.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.5, ease: EASE.land }, at);
      event
        .querySelectorAll<HTMLElement>(":scope > .rl-pass")
        .forEach((part, order) => pass(timeline, part, at + order * 0.05, { duration: 0.8 }));
    });
    every(".rl-programme__label", 22.4 + shift, 0, { duration: 0.7, reverse: true });
    every(".rl-programme__lines > .rl-pass", 22.55 + shift, 0.12, { duration: 1.2, reverse: true });

    const paperEnd = 24.6 + shift;
    scenes.push({ at: paperEnd, value: "contents" });
    const white = q(".rl-contents__sheet");
    if (white) pass(timeline, white, paperEnd, { duration: SHEET });
    drift(".rl-programme__body", paperEnd, { x: u * 2.2 });
    ink("black", 24.85 + shift, 25.3 + shift);
    every(".rl-contents__label .rl-pass", 25.2 + shift, 0, { duration: 0.8 });
    qa(".rl-contents__row").forEach((row, index) => {
      row
        .querySelectorAll<HTMLElement>(".rl-row > .rl-pass")
        .forEach((part) => pass(timeline, part, 25.25 + shift + index * 0.08, { duration: 0.95 }));
    });
    rules(".rl-row__rule", 25.25 + shift, 0.08);
    scenes.push({ at: 26.1 + shift, value: "rest" });
  }, root);

  const folio = q("[data-folio]");
  let shownScene = "";
  let shownFolio = "";

  return {
    timeline,
    rest: scenes.find((scene) => scene.value === "contents")?.at ?? 0,
    intro: BARS_AT,
    inkAt: (time) => ({
      mark: pick(inks.mark, time),
      nav: pick(inks.nav, time),
    }),
    track: (time) => {
      const scene = pick(scenes, time);
      if (scene !== shownScene) {
        shownScene = scene;
        root.dataset.scene = scene;
      }
      const page = pick(folios, time);
      if (folio && page !== shownFolio) {
        shownFolio = page;
        folio.textContent = page;
      }
    },
    revert: () => {
      context.revert();
      delete root.dataset.scene;
    },
  };
}

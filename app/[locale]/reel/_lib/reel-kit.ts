import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

export const EASE = {
  band: "rl.band",
  land: "rl.land",
  lift: "rl.lift",
} as const;

CustomEase.create(EASE.band, "0.76,0,0.24,1");
CustomEase.create(EASE.land, "0.19,1,0.22,1");
CustomEase.create(EASE.lift, "0.7,0,0.84,0");

export type Metrics = {
  width: number;
  height: number;
  cell: number;
  u: number;
  edge: number;
  inset: number;
};

export const readMetrics = (stage: HTMLElement): Metrics => {
  const width = stage.clientWidth;
  const height = window.innerHeight;
  const portrait = height > width;
  const cell = portrait ? width / 3.6 : height / 5;
  return { width, height, cell, u: cell / 5, edge: portrait ? cell / 2 : height / 10, inset: width * 0.063 };
};

export const writeMetrics = (root: HTMLElement, metrics: Metrics) => {
  const entries: [string, number][] = [
    ["--rl-w", metrics.width],
    ["--rl-h", metrics.height],
    ["--rl-cell", metrics.cell],
    ["--rl-u", metrics.u],
    ["--rl-edge", metrics.edge],
    ["--rl-inset", metrics.inset],
  ];
  entries.forEach(([name, value]) => root.style.setProperty(name, `${value}px`));
};

export const fitWidth = (element: HTMLElement, target: number, variable: string, root: HTMLElement) => {
  root.style.setProperty(variable, "100px");
  const measured = element.getBoundingClientRect().width;
  if (measured <= 0) return;
  root.style.setProperty(variable, `${(100 * target) / measured}px`);
};

const SPARE = 2;

type PassOptions = {
  duration?: number;
  ease?: string;
  reverse?: boolean;
};

const parts = (line: HTMLElement) => ({
  clip: line.querySelector<HTMLElement>(":scope > .rl-pass__clip"),
  ink: line.querySelector<HTMLElement>(":scope > .rl-pass__clip > .rl-pass__ink"),
  head: line.querySelector<HTMLElement>(":scope > .rl-pass__head"),
});

export function pass(
  timeline: gsap.core.Timeline,
  line: HTMLElement,
  at: number,
  { duration = 1, ease = EASE.band, reverse = false }: PassOptions = {},
) {
  const { clip, ink, head } = parts(line);
  if (!clip || !ink) return;
  const vertical = line.dataset.axis === "y";
  const size = vertical ? line.offsetHeight : line.offsetWidth;
  const band = head ? (vertical ? head.offsetHeight : head.offsetWidth) : 0;
  const key = vertical ? "y" : "x";
  const sign = reverse ? -1 : 1;
  const tween = { duration, ease };
  timeline.fromTo(clip, { [key]: -sign * (size + band) }, { [key]: 0, ...tween }, at);
  timeline.fromTo(ink, { [key]: sign * (size + band) }, { [key]: 0, ...tween }, at);
  if (head) {
    const start = reverse ? size + SPARE : -band - SPARE;
    const end = reverse ? -band - SPARE : size + SPARE;
    timeline.fromTo(head, { [key]: start }, { [key]: end, ...tween }, at);
  }
}

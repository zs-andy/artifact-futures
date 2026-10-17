import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

export const EASE = {
  io: "af.io",
  snake: "af.snake",
  out: "af.out",
  in: "af.in",
  unmask: "af.unmask",
  press: "af.press",
  shutter: "af.shutter",
} as const;

CustomEase.create(EASE.io, "0.65,0,0.35,1");
CustomEase.create(EASE.snake, "0.76,0,0.24,1");
CustomEase.create(EASE.out, "0.19,1,0.22,1");
CustomEase.create(EASE.in, "0.5,0,0.75,0");
CustomEase.create(EASE.unmask, "M0,0 C0.16,1 0.3,1 1,1");
CustomEase.create(EASE.press, "0.65,0.05,0,1");
CustomEase.create(EASE.shutter, "M0,0 C0.5,0.08 0.8,0.35 1,1");

const parsed = {
  io: gsap.parseEase(EASE.io),
  snake: gsap.parseEase(EASE.snake),
  out: gsap.parseEase(EASE.out),
  in: gsap.parseEase(EASE.in),
  unmask: gsap.parseEase(EASE.unmask),
  press: gsap.parseEase(EASE.press),
  shutter: gsap.parseEase(EASE.shutter),
};

export const ease = parsed;

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export const fit = (
  progress: number,
  from: number,
  to: number,
  curve: (value: number) => number = (value) => value,
) => curve(clamp01((progress - from) / (to - from)));

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const FOLLOW = 0.65;
const GLIDE_SECONDS = 0.4;
const SAMPLE_EVERY = 3;
const BLACK_ABOVE = 0.179;

const channel = (value: number) => {
  const share = value / 255;
  return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
};

const luminance = (color: string) => {
  const parts = color.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3 || parts[3] === 0) return null;
  return 0.2126 * channel(parts[0]) + 0.7152 * channel(parts[1]) + 0.0722 * channel(parts[2]);
};

const inkAt = (x: number, y: number) => {
  for (const element of document.elementsFromPoint(x, y)) {
    const style = getComputedStyle(element);
    const light = luminance(element instanceof SVGGeometryElement ? style.fill : style.backgroundColor);
    if (light !== null) return light > BLACK_ABOVE ? "black" : "white";
  }
  return "black";
};

export function Cursor() {
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball || !window.matchMedia("(pointer: fine)").matches) return;

    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let seen = false;
    let frame = 0;
    gsap.set(ball, { xPercent: -50, yPercent: -50 });
    const toX = gsap.quickTo(ball, "x", { duration: GLIDE_SECONDS, ease: "power1.out" });
    const toY = gsap.quickTo(ball, "y", { duration: GLIDE_SECONDS, ease: "power1.out" });

    const onMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (seen) return;
      seen = true;
      pos.x = mouse.x;
      pos.y = mouse.y;
      gsap.set(ball, { x: pos.x, y: pos.y });
    };
    const onEnter = () => {
      if (seen) ball.dataset.on = "true";
    };
    const onLeave = () => {
      ball.dataset.on = "false";
    };
    const follow = () => {
      if (!seen) return;
      ball.dataset.on ??= "true";
      pos.x += (mouse.x - pos.x) * FOLLOW;
      pos.y += (mouse.y - pos.y) * FOLLOW;
      toX(pos.x);
      toY(pos.y);
      frame = (frame + 1) % SAMPLE_EVERY;
      if (frame === 0) ball.dataset.ink = inkAt(pos.x, pos.y);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseenter", onEnter);
    document.documentElement.addEventListener("mouseleave", onLeave);
    gsap.ticker.add(follow);

    return () => {
      gsap.ticker.remove(follow);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(ball);
      delete ball.dataset.on;
      delete ball.dataset.ink;
    };
  }, []);

  return <div ref={ballRef} className="cv-cursor" aria-hidden="true" />;
}

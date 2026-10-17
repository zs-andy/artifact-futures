import { gsap, ScrollTrigger, SMOOTH, SWIFT } from "../_lib/motion";
import { COVERS } from "../_lib/covers";
import { SEED } from "../_lib/seed";
import type { Scene } from "./model";

const QUIET_PX = 20;

export function footer(root: HTMLElement, state: Scene) {
  const zone = root.querySelector<HTMLElement>(".home__footer")!;
  const reveal = gsap
    .timeline({ paused: true })
    .fromTo(
      zone.querySelectorAll("[data-line]"),
      { scaleX: 0 },
      { scaleX: 1, duration: 1.1, ease: SMOOTH },
      0,
    )
    .fromTo(
      zone.querySelectorAll(".home__word-inner"),
      { yPercent: 110 },
      { yPercent: 0, duration: 0.9, ease: SWIFT, stagger: 0.018 },
      0.15,
    );
  ScrollTrigger.create({
    trigger: zone,
    start: "clamp(top 88%)",
    once: true,
    onEnter: () => void reveal.play(),
  });

  const layer = document.createElement("div");
  layer.className = "home__covers";
  layer.setAttribute("aria-hidden", "true");
  layer.style.setProperty("--home-radius", `${SEED.radius}px`);
  const items: HTMLImageElement[] = [];
  const animations = new Set<gsap.core.Timeline>();
  let next = 0,
    depth = 1;
  let ticking = false;
  let anchored = false;
  const pointer = { x: 0, y: 0 };
  const lag = { x: 0, y: 0 };
  const last = { x: 0, y: 0 };

  // No covers near the resting logo block and its tagline.
  const logo = root.querySelector<HTMLElement>(".home__mark");
  const tagline = root.querySelector<HTMLElement>(".home__tagline");
  const quiet = (x: number, y: number) => {
    if (!logo) return false;
    const a = logo.getBoundingClientRect();
    const b = tagline?.getBoundingClientRect() ?? a;
    return (
      x > Math.min(a.left, b.left) - QUIET_PX &&
      x < Math.max(a.right, b.right) + QUIET_PX &&
      y > Math.min(a.top, b.top) - QUIET_PX &&
      y < Math.max(a.bottom, b.bottom) + QUIET_PX
    );
  };

  // Only request the decorative covers when the closing section is nearby.
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      for (const cover of COVERS) {
        const image = new Image(cover.width, cover.height);
        image.className = "home__cover";
        image.dataset.shape = cover.width >= cover.height ? "wide" : "tall";
        image.alt = "";
        image.draggable = false;
        image.decoding = "async";
        image.src = cover.src;
        items.push(image);
        layer.append(image);
      }
      document.body.append(layer);
      gsap.set(items, { xPercent: -50, yPercent: -50 });
    },
    { rootMargin: "200% 0px" },
  );
  observer.observe(zone);

  const stopTicking = () => {
    gsap.ticker.remove(tick);
    ticking = false;
  };
  const tick = () => {
    if (!state.rest || document.hidden) {
      anchored = false;
      stopTicking();
      return;
    }
    const follow = 1 - 0.9 ** gsap.ticker.deltaRatio(120);
    lag.x += (pointer.x - lag.x) * follow;
    lag.y += (pointer.y - lag.y) * follow;
    if (items.length && Math.hypot(pointer.x - last.x, pointer.y - last.y) > 100) {
      last.x = pointer.x;
      last.y = pointer.y;
      if (!quiet(pointer.x, pointer.y) && !quiet(lag.x, lag.y)) {
        const item = items[next++ % items.length];
        gsap.killTweensOf(item);
        const animation = gsap
          .timeline({
            onComplete: () => {
              animations.delete(animation);
            },
          })
          .set(item, { x: lag.x, y: lag.y, rotate: 20, scale: 1, opacity: 1, zIndex: depth++ }, 0)
          .to(item, { x: pointer.x, y: pointer.y, rotate: 0, duration: 1, ease: "expo.out" }, 0)
          .to(item, { scale: 0.2, duration: 0.5, ease: "power3.inOut" }, 0.4)
          .to(item, { opacity: 0, duration: 0.3, ease: "none" }, 0.5);
        animations.add(animation);
      }
    }
    if (Math.hypot(pointer.x - lag.x, pointer.y - lag.y) < 0.1) stopTicking();
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    if (!state.rest) {
      anchored = false;
      return;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    // Anchor only on the first move or after waking; re-anchoring on every ticker
    // restart would reset the spawn distance before it could accumulate.
    if (!anchored) {
      lag.x = last.x = pointer.x;
      lag.y = last.y = pointer.y;
      anchored = true;
    }
    if (!ticking) {
      ticking = true;
      gsap.ticker.add(tick);
    }
  };
  window.addEventListener("pointermove", move);
  return () => {
    observer.disconnect();
    stopTicking();
    window.removeEventListener("pointermove", move);
    animations.forEach((animation) => animation.kill());
    layer.remove();
  };
}

import gsap from "gsap";

const TAU = 0.16;
const EPSILON = 0.0004;
const MAX_STEP = 100;
const IDLE_MS = 650;
const TOUCH_RATE = 1.5;
const KEY_STEP = 0.4;
const FORWARD = ["ArrowDown", "PageDown", " ", "ArrowRight"];
const BACKWARD = ["ArrowUp", "PageUp", "ArrowLeft"];

export type ReelDrive = {
  start: (from?: number) => void;
  push: (seconds: number) => void;
  seek: (time: number) => void;
  time: () => number;
  stop: () => void;
};

export function createReelDrive(options: {
  duration: () => number;
  lead: () => number;
  onFrame: (time: number) => void;
}): ReelDrive {
  let time = 0;
  let aim = 0;
  let reached = 0;
  let painted = Number.NaN;
  let running = false;
  let idleUntil = 0;

  const tick = (_now: number, deltaMs: number) => {
    const seconds = Math.min(deltaMs, MAX_STEP) / 1000;
    const end = options.duration();
    const lead = Math.min(options.lead(), end);
    if (performance.now() >= idleUntil && aim < lead) aim = Math.min(aim + seconds, lead);
    reached = Math.max(reached, aim);
    time += (aim - time) * (1 - Math.exp(-seconds / TAU));
    if (Math.abs(aim - time) < EPSILON) time = aim;
    if (time === painted) return;
    painted = time;
    options.onFrame(time);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  };

  return {
    start: (from = 0) => {
      time = from;
      aim = from;
      reached = from;
      painted = Number.NaN;
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
    },
    push: (seconds) => {
      const floor = Math.min(reached, options.lead());
      const next = gsap.utils.clamp(floor, options.duration(), aim + seconds);
      if (next === aim) return;
      idleUntil = performance.now() + IDLE_MS;
      aim = next;
      reached = Math.max(reached, aim);
    },
    seek: (next) => {
      aim = gsap.utils.clamp(0, options.duration(), next);
      time = aim;
    },
    time: () => time,
    stop,
  };
}

export function bindReelInput(stage: HTMLElement, onDelta: (pixels: number) => void) {
  let touchY: number | null = null;

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    onDelta(event.deltaMode === 1 ? event.deltaY * 40 : event.deltaY);
  };
  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (event: TouchEvent) => {
    event.preventDefault();
    if (touchY === null) return;
    const next = event.touches[0]?.clientY ?? touchY;
    onDelta((touchY - next) * TOUCH_RATE);
    touchY = next;
  };
  const onTouchEnd = () => {
    touchY = null;
  };
  const onKey = (event: KeyboardEvent) => {
    const step = stage.clientHeight * KEY_STEP;
    if (FORWARD.includes(event.key)) {
      event.preventDefault();
      onDelta(step);
    } else if (BACKWARD.includes(event.key)) {
      event.preventDefault();
      onDelta(-step);
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
    window.removeEventListener("keydown", onKey);
  };
}

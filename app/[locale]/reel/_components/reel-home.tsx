"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "@/i18n/navigation";
import { createReelDrive, bindReelInput } from "../_lib/reel-drive";
import { readMetrics, writeMetrics, fitWidth } from "../_lib/reel-kit";
import { whenIntroDone } from "./loader";
import { buildReel, type Reel } from "../_lib/reel-timeline";
import { useNow } from "./reel-clock";
import { Contents, Cover, Fellowship, Journal, Night, Programme, Slogan } from "./reel-shots";

const MOTION = "(pointer: fine) and (min-aspect-ratio: 1 / 1) and (prefers-reduced-motion: no-preference)";
const SCROLL_SECONDS = 2.4;
const RESIZE_MS = 120;
const SEEN = "rl-reel-seen";
const LEAVE_SECONDS = 0.75;

export function ReelHome() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const router = useRouter();

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const shell = root?.closest<HTMLElement>(".rl");
    if (!root || !stage || !shell) return;

    const media = window.matchMedia(MOTION);
    let reel: Reel | null = null;
    let unbind: (() => void) | null = null;
    let resizeTimer = 0;
    let ink = "";
    let watched = false;
    let loaded = false;
    let stopLoad: (() => void) | null = null;

    const paint = (time: number) => {
      if (!reel) return;
      reel.timeline.time(time);
      const next = reel.inkAt(time);
      const key = `${next.mark}${next.nav}`;
      if (key !== ink) {
        ink = key;
        shell.dataset.inkMark = next.mark;
        shell.dataset.inkNav = next.nav;
      }
      reel.track(time);
      if (!watched && time >= reel.rest) {
        watched = true;
        try {
          window.sessionStorage.setItem(SEEN, "1");
        } catch {}
      }
    };

    const drive = createReelDrive({
      duration: () => reel?.timeline.duration() ?? 0,
      lead: () => (loaded && reel ? reel.intro : 0),
      onFrame: paint,
    });

    const fit = () => {
      const word = root.querySelector<HTMLElement>(".rl-cover__word");
      if (word) fitWidth(word, stage.clientWidth * 1.015, "--rl-mark", root);
      const mast = root.querySelector<HTMLElement>(".rl-journal__word");
      if (mast) fitWidth(mast, stage.clientWidth * 1.015, "--rl-journal", root);
    };

    const build = (at: number) => {
      reel?.timeline.kill();
      reel?.revert();
      const metrics = readMetrics(stage);
      writeMetrics(root, metrics);
      fit();
      reel = buildReel(root, metrics);
      ink = "";
      paint(Math.min(at, reel.timeline.duration()));
    };

    const enable = () => {
      root.dataset.motion = "on";
      document.documentElement.dataset.reel = "on";
      build(0);
      let seen = false;
      try {
        seen = window.sessionStorage.getItem(SEEN) === "1";
      } catch {}
      const from = seen && reel ? reel.rest : 0;
      paint(from);
      drive.start(from);
      stopLoad = whenIntroDone(() => {
        loaded = true;
        root.dataset.loaded = "true";
      });
      unbind = bindReelInput(stage, (pixels) => {
        if (loaded) drive.push((pixels / Math.max(stage.clientHeight, 1)) * SCROLL_SECONDS);
      });
    };

    let leaving: gsap.core.Tween | null = null;
    const onClick = (event: MouseEvent) => {
      const row = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-row]") : null;
      if (!row || !reel || leaving || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      const href = row.dataset.href;
      const curtain = root.querySelector<HTMLElement>(".rl-curtain");
      if (!href || !curtain) return;
      event.preventDefault();
      drive.stop();
      unbind?.();
      unbind = null;
      const box = row.getBoundingClientRect();
      const tall = stage.clientHeight;
      router.prefetch(href);
      curtain.style.visibility = "visible";
      leaving = gsap.fromTo(
        curtain,
        { clipPath: `inset(${box.top}px 0px ${tall - box.bottom}px 0px)` },
        {
          clipPath: "inset(0px 0px 0px 0px)",
          duration: LEAVE_SECONDS,
          ease: "rl.band",
          onComplete: () => router.push(href),
        },
      );
    };
    root.addEventListener("click", onClick);

    const disable = () => {
      stopLoad?.();
      stopLoad = null;
      loaded = false;
      delete root.dataset.loaded;
      drive.stop();
      unbind?.();
      unbind = null;
      reel?.timeline.kill();
      reel?.revert();
      reel = null;
      delete root.dataset.motion;
      delete document.documentElement.dataset.reel;
      delete shell.dataset.inkMark;
      delete shell.dataset.inkNav;
      writeMetrics(root, readMetrics(stage));
      fit();
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (reel) {
          const at = drive.time();
          build(at);
          drive.seek(at);
        } else {
          writeMetrics(root, readMetrics(stage));
          fit();
        }
      }, RESIZE_MS);
    };

    const onChange = () => (media.matches ? enable() : disable());

    if (media.matches) enable();
    else disable();
    let fontsReady = false;
    void document.fonts?.ready.then(() => {
      if (fontsReady) return;
      fontsReady = true;
      onResize();
    });
    media.addEventListener("change", onChange);
    window.addEventListener("resize", onResize);

    return () => {
      fontsReady = true;
      leaving?.kill();
      root.removeEventListener("click", onClick);
      window.clearTimeout(resizeTimer);
      media.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
      disable();
    };
  }, [router]);

  return (
    <main ref={rootRef} className="rl-home" data-lenis-prevent>
      <div ref={stageRef} className="rl-stage">
        <Cover />
        <Slogan />
        <Night now={now} />
        <Journal />
        <Fellowship />
        <Programme />
        <Contents />
      </div>
      <div className="rl-curtain" aria-hidden="true" />
    </main>
  );
}

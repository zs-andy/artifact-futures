"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Logo } from "./logo";

gsap.registerPlugin(CustomEase);

const SWIFT_EASE = CustomEase.create("af.swift", "0.16,1,0.3,1");
const GRID_MID_AT = 0.1;
const GRID_SIDE_AT = 0.4;
const GRID_SECONDS = 0.6;
const RISE_AT = 1;
const RISE_SECONDS = 1;
const COUNT_SECONDS = 3;
const CLOSE_SECONDS = 1;

const whenBooted = (run: () => void) => {
  const root = document.documentElement;
  if (root.dataset.boot === "ready") {
    run();
    return () => undefined;
  }
  const observer = new MutationObserver(() => {
    if (root.dataset.boot !== "ready") return;
    observer.disconnect();
    run();
  });
  observer.observe(root, { attributes: true, attributeFilter: ["data-boot"] });
  return () => observer.disconnect();
};

const INTRO_DONE = "af:intro-done";

export const whenIntroDone = (run: () => void) => {
  if (document.documentElement.dataset.afIntro === "done") {
    run();
    return () => undefined;
  }
  window.addEventListener(INTRO_DONE, run, { once: true });
  return () => window.removeEventListener(INTRO_DONE, run);
};

export function Loader() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const mark = root?.querySelector<HTMLElement>(".af-loader__mark");
    const logo = root?.querySelector<SVGSVGElement>(".af-loader__logo");
    const count = root?.querySelector<HTMLElement>(".af-loader__count");
    const mid = root?.querySelector<HTMLElement>(".af-grid__line--mid");
    const sides = root?.querySelectorAll<HTMLElement>(".af-grid__line--side");
    if (!root || !mark || !logo || !count || !mid || !sides) return;
    const finish = () => {
      root.dataset.state = "done";
      document.documentElement.dataset.afIntro = "done";
      window.dispatchEvent(new Event(INTRO_DONE));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    let loaded = document.readyState === "complete";
    let counted = false;
    let closing = false;
    let close = () => {};
    const onLoad = () => {
      loaded = true;
      if (counted) close();
    };
    window.addEventListener("load", onLoad);
    let intro: gsap.core.Timeline | null = null;

    const context = gsap.context(() => {
      gsap.set(logo, { yPercent: 100 });
      gsap.set(mid, { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(sides, { scaleY: 0, transformOrigin: "50% 100%" });

      close = () => {
        if (closing) return;
        closing = true;
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(mark, { clearProps: "width" });
              finish();
            },
          })
          .to(count, { yPercent: 110, duration: 0.4, ease: "power2.inOut" }, 0)
          .to(
            mark,
            {
              width: getComputedStyle(root).getPropertyValue("--af-logo-small").trim(),
              duration: CLOSE_SECONDS,
              ease: "power2.inOut",
            },
            0,
          );
      };

      const tally = { value: 0 };
      intro = gsap
        .timeline({ paused: true })
        .to(mid, { scaleY: 1, duration: GRID_SECONDS, ease: SWIFT_EASE }, GRID_MID_AT)
        .to(sides, { scaleY: 1, duration: GRID_SECONDS, ease: SWIFT_EASE }, GRID_SIDE_AT)
        .to(logo, { yPercent: 0, duration: RISE_SECONDS, ease: "power2.inOut" }, RISE_AT)
        .to(
          tally,
          {
            value: 100,
            duration: COUNT_SECONDS,
            ease: "power2.inOut",
            onUpdate: () => {
              count.textContent = `${Math.round(tally.value)}%`;
            },
            onComplete: () => {
              counted = true;
              if (loaded) close();
            },
          },
          0,
        );
    }, root);

    const stopWaiting = whenBooted(() => void intro?.play());

    return () => {
      stopWaiting();
      window.removeEventListener("load", onLoad);
      context.revert();
      root.dataset.state = "loading";
      delete document.documentElement.dataset.afIntro;
    };
  }, []);

  return (
    <div ref={rootRef} className="af-loader" data-state="loading">
      <div className="af-grid" aria-hidden="true">
        <span className="af-grid__line af-grid__line--side" />
        <span className="af-grid__line af-grid__line--mid" />
        <span className="af-grid__line af-grid__line--side" />
      </div>
      <div className="af-loader__mark">
        <Logo className="af-loader__logo" />
      </div>
      <p className="af-loader__meter" aria-hidden="true">
        <span className="af-loader__count">0%</span>
      </p>
    </div>
  );
}

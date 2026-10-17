"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../_lib/motion";
import { seedStyle } from "../_lib/seed";
import { TAGLINE } from "../_lib/tagline";
import { Logo } from "../_components/logo";
import { SnapLink } from "../_components/snap-link";
import { DesktopView } from "./desktop-view";
import { FolioView } from "./folio-view";
import { createImages, createScene, DESKTOP, FINE, IMAGES, MOTION, type Images } from "./model";
import { intro } from "./intro";
import { desktop } from "./desktop";
import { mobile } from "./mobile";
import { footer } from "./footer";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

function Wheel({ digits }: { digits: number[] }) {
  return (
    <span className="home__wheel">
      <span className="home__reel">
        {digits.map((digit, index) => (
          <span key={index} className="home__digit">
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

export function Home({ exhibit = false }: { exhibit?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const images = useRef<Images | null>(null);
  const [ready, setReady] = useState(false);
  const [gpuLost, setGpuLost] = useState(false);

  useLayoutEffect(() => {
    const pool = createImages();
    images.current = pool;
    const assets =
      matchMedia(DESKTOP).matches && matchMedia(MOTION).matches ? IMAGES.map(pool.load) : [];
    const stop = intro(root.current!, assets, () => setReady(true));
    return () => {
      stop();
      pool.dispose();
    };
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const home = root.current!;
    const media = gsap.matchMedia();
    media.add({ all: "all", desktop: DESKTOP, motion: MOTION, fine: FINE }, (context) => {
      const { desktop: wide, motion, fine } = context.conditions!;
      const state = createScene();
      const abort = new AbortController();
      let stopRenderer: (() => void) | null = null;
      let stopScene: (() => void) | undefined;
      let stopFooter: (() => void) | undefined;
      const start = async () => {
        if (motion && fine && !gpuLost && "gpu" in navigator) {
          try {
            const { renderer } = await import("./renderer");
            if (abort.signal.aborted) return;
            stopRenderer = await renderer(home, state, images.current!, abort.signal, () =>
              setGpuLost(true),
            );
          } catch (error) {
            console.warn(
              "Homepage: using the reading layout because WebGPU is unavailable.",
              error,
            );
          }
        }
        if (abort.signal.aborted) {
          stopRenderer?.();
          return;
        }
        if (exhibit && !stopRenderer) {
          const { exhibitFallback } = await import("./exhibit-fallback");
          if (abort.signal.aborted) return;
          stopRenderer = exhibitFallback(home, state, images.current!);
        }
        // Async GPU setup finishes outside matchMedia's synchronous GSAP scope.
        context.add(() => {
          const useDesktop = exhibit || (wide && motion && !!stopRenderer);
          home.dataset.mode = useDesktop ? "desktop" : "folio";
          stopScene = exhibit
            ? desktop(home, state, true)
            : motion ? (useDesktop ? desktop(home, state) : mobile(home)) : undefined;
          stopFooter = useDesktop && !exhibit ? footer(home, state) : undefined;
          ScrollTrigger.refresh();
          if (exhibit) window.parent.postMessage({ type: "artifact:stage-ready" }, location.origin);
        });
      };
      void start();
      return () => {
        abort.abort();
        stopFooter?.();
        stopScene?.();
        stopRenderer?.();
        delete home.dataset.mode;
      };
    });
    return () => media.revert();
  }, [ready, gpuLost, exhibit]);

  return (
    <main ref={root} className="home flex-1" data-exhibit={exhibit || undefined} style={seedStyle}>
      <section className="home__scene" aria-label="ARTIFACT Futures">
        <div className="home__scene-stage">
          <div
            className="home__loader"
            role="progressbar"
            aria-label="Loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <div className="home__mark">
              <span className="home__fill" />
              <Logo className="home__logo" />
            </div>
            <p className="home__tagline" aria-label={TAGLINE}>
              {[...TAGLINE].map((char, index) => (
                <span key={index} className="home__char" aria-hidden="true">
                  {char}
                </span>
              ))}
              <canvas className="home__ink" aria-hidden="true" />
            </p>
            <div className="home__count" aria-hidden="true">
              <div className="home__row">
                <Wheel digits={[0, 1]} />
                <Wheel digits={DIGITS} />
                <Wheel digits={DIGITS} />
                <span className="home__percent">%</span>
              </div>
            </div>
          </div>
          <DesktopView />
          <span className="home__field" aria-hidden="true" />
          <p className="home__hint home__nudge" aria-hidden="true">
            <span>Scroll</span>
            <span className="home__hint-track">
              <span className="home__hint-seed" />
            </span>
          </p>
        </div>
      </section>
      <FolioView />
      <div className="home__sections">
        <footer className="home__footer">
          <div className="home__foot">
            <span className="home__rule" data-line aria-hidden="true" />
            <SnapLink href="https://vac.art" target="_blank" rel="noopener noreferrer">
              <span className="home__word">
                <span className="home__word-inner">VAC.art</span>
              </span>
              <span className="home__word">
                <span className="home__word-inner">
                  <svg className="home__cta-arrow" viewBox="0 0 12 12" aria-hidden="true">
                    <path
                      d="M1 6h10M6.5 1.5 11 6l-4.5 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                  </svg>
                </span>
              </span>
            </SnapLink>
          </div>
        </footer>
      </div>
    </main>
  );
}

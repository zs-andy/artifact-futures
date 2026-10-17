"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteHeader } from "../../_components/site-header";
import { HeroStage } from "./hero-stage";
import { RESIDENCY_STORY_MEDIA } from "../_lib/residency-media";
import { SECTION_DRIFT, viewportHeight } from "../_lib/residency-motion";
import { ResidencyChapters } from "./residency-chapters";
import { useResidencyChapters } from "./use-residency-chapters";
import "./residency-chapters.css";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  slogan: string[];
  title: string;
  statement: string;
  statementHeading: string;
  followUp: string[];
};

const INTRO_MS = 1600;
const LIFT_DURATION = 1.15;
const STORY_SCROLL = 0.85;
const READING_PAUSE_SCROLL = 0.2;
const HORIZONTAL_SCROLL = 2;
const CONTENT_BLOCK_COUNT = 3;
const BLOCK_EXIT_OVERSCAN = 2;

function peekSize() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--residency-peek")
    .trim();
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return viewportHeight() * 0.18;
  if (raw.endsWith("svh") || raw.endsWith("vh") || raw.endsWith("dvh")) {
    return (viewportHeight() * value) / 100;
  }
  return value;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForBoot() {
  if (document.documentElement.dataset.boot === "ready") return Promise.resolve();

  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.documentElement.dataset.boot === "ready") {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-boot"],
    });
  });
}

function waitForIntro() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  return wait(INTRO_MS);
}

function setPhase(phase: "intro" | "lift" | "open") {
  document.documentElement.dataset.residency = phase;
}

export function ResidencyView({ slogan, title, statement, statementHeading, followUp }: Props) {
  const mainRef = useRef<HTMLElement>(null);
  useResidencyChapters(mainRef);
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bodyWindowRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<Array<HTMLDivElement | null>>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const story = storyRef.current;
    const frame = frameRef.current;
    const bodyWindow = bodyWindowRef.current;
    const blocks = blocksRef.current.slice(0, CONTENT_BLOCK_COUNT);
    const rail = railRef.current;
    const label = labelRef.current;
    const copy = copyRef.current;
    if (
      !hero ||
      !story ||
      !frame ||
      !bodyWindow ||
      blocks.length !== CONTENT_BLOCK_COUNT ||
      blocks.some((block) => !block) ||
      !rail ||
      !label ||
      !copy
    ) {
      return;
    }

    const contentBlocks = blocks as HTMLDivElement[];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stacked = window.matchMedia("(max-width: 767px)").matches;

    if (!reduced && !stacked) setPhase("intro");

    const yToCenterLabel = (localCenter: number) => {
      const y = Number(gsap.getProperty(rail, "y")) || 0;
      const frameBox = frame.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const current = labelBox.top - frameBox.top + labelBox.height / 2;
      return y + (localCenter - current);
    };

    const placeTitleInVisibleWhite = () => {
      if (stacked) return;
      const box = frame.getBoundingClientRect();
      const top = Math.max(box.top, 0);
      const bottom = Math.min(box.bottom, viewportHeight());
      if (bottom <= top) return;
      gsap.set(rail, {
        y: yToCenterLabel((top + bottom) / 2 - box.top),
      });
    };

    const applyPeekHeight = () => {
      gsap.set(hero, { height: viewportHeight() - peekSize() });
    };

    const setHorizontalProgress = (progress: number) => {
      if (stacked) return;
      const bodyLeft = bodyWindow.getBoundingClientRect().left;
      const enterX = window.innerWidth - bodyLeft;
      const stepCount = contentBlocks.length - 1;
      const scaledProgress = Math.min(stepCount, progress * stepCount);
      const activeStep = Math.min(stepCount - 1, Math.floor(scaledProgress));
      const stepProgress = scaledProgress - activeStep;

      for (const [index, block] of contentBlocks.entries()) {
        const leaveX = -bodyLeft - block.offsetWidth - BLOCK_EXIT_OVERSCAN;
        let x = enterX;

        if (index < activeStep) x = leaveX;
        else if (index === activeStep) x = leaveX * stepProgress;
        else if (index === activeStep + 1) {
          x = enterX * (1 - stepProgress);
        }

        gsap.set(block, { x });
      }
    };

    if (reduced || stacked) {
      setPhase("open");
      applyPeekHeight();
      setHorizontalProgress(0);
      gsap.set(rail, { y: 0 });
      gsap.set(copy, { autoAlpha: 1 });
      return;
    }

    gsap.set(copy, { autoAlpha: stacked ? 1 : 0 });
    setHorizontalProgress(0);

    let pushFromY: number | null = null;
    let cancelled = false;
    let liftTick = 0;
    const triggers: ScrollTrigger[] = [];

    const driftHero = () => {
      const span = hero.offsetHeight;
      const progress = Math.min(1, Math.max(0, window.scrollY / span));
      gsap.set(hero, { y: progress * span * SECTION_DRIFT });
    };

    const bindScroll = () => {
      if (stacked) return;
      window.addEventListener("scroll", driftHero, { passive: true });
      driftHero();

      const hold = ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: () => `+=${viewportHeight() * STORY_SCROLL}`,
        scrub: true,
        invalidateOnRefresh: true,
        onEnter: () => {
          pushFromY = Number(gsap.getProperty(rail, "y")) || 0;
        },
        onLeaveBack: () => {
          pushFromY = null;
        },
        onLeave: () => {
          gsap.set(rail, { y: 0 });
          gsap.set(copy, { autoAlpha: 1 });
        },
        onUpdate: (self) => {
          if (!self.isActive && self.progress === 0) return;
          if (pushFromY === null) {
            pushFromY = Number(gsap.getProperty(rail, "y")) || 0;
          }

          const progress = self.progress;
          gsap.set(rail, { y: pushFromY * (1 - progress) });
          gsap.set(copy, { autoAlpha: progress });
        },
      });

      const approach = ScrollTrigger.create({
        trigger: story,
        start: "top bottom",
        end: "top top",
        onUpdate: () => {
          if (hold.progress > 0) return;
          placeTitleInVisibleWhite();
        },
      });

      const horizontal = ScrollTrigger.create({
        trigger: story,
        start: () => `top+=${viewportHeight() * (STORY_SCROLL + READING_PAUSE_SCROLL)} top`,
        end: () => `+=${viewportHeight() * HORIZONTAL_SCROLL}`,
        scrub: true,
        invalidateOnRefresh: true,
        onLeave: () => {
          setHorizontalProgress(1);
        },
        onLeaveBack: () => {
          setHorizontalProgress(0);
        },
        onUpdate: (self) => {
          setHorizontalProgress(self.progress);
        },
      });

      triggers.push(approach, hold, horizontal);
    };

    const onResize = () => {
      if (document.documentElement.dataset.residency !== "open") return;
      applyPeekHeight();
      driftHero();
      const hold = triggers[1];
      if (!hold || hold.progress === 0) placeTitleInVisibleWhite();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", onResize);

    void (async () => {
      try {
        await waitForBoot();
        if (cancelled) return;
        await waitForIntro();
        if (cancelled) return;

        setPhase("lift");
        const fromHeight = hero.getBoundingClientRect().height;
        const toHeight = viewportHeight() - peekSize();
        hero.style.height = `${fromHeight}px`;
        void hero.offsetHeight;
        hero.style.transition = `height ${LIFT_DURATION}s cubic-bezier(0.45, 0.05, 0.2, 1)`;
        hero.style.height = `${toHeight}px`;

        liftTick = window.setInterval(placeTitleInVisibleWhite, 16);
        await wait(LIFT_DURATION * 1000);
        window.clearInterval(liftTick);
        liftTick = 0;
        hero.style.transition = "";
        gsap.set(hero, { height: toHeight });
        if (cancelled) return;

        placeTitleInVisibleWhite();
        bindScroll();
        setPhase("open");
        ScrollTrigger.refresh();
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          applyPeekHeight();
          placeTitleInVisibleWhite();
          bindScroll();
          setPhase("open");
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", driftHero);
      if (liftTick) window.clearInterval(liftTick);
      for (const trigger of triggers) trigger.kill();
      gsap.killTweensOf([hero, rail, copy, ...contentBlocks]);
      delete document.documentElement.dataset.residency;
    };
  }, []);

  return (
    <main ref={mainRef} className="residency">
      <SiteHeader variant="residency" />

      <section ref={heroRef} className="residency-hero">
        <HeroStage lines={slogan} />
      </section>

      <section ref={storyRef} className="residency-story">
        <div ref={frameRef} className="residency-story__frame">
          <div ref={railRef} className="residency-story__rail">
            <h2 ref={labelRef} className="residency-story__title">
              {title}
            </h2>
            <div ref={bodyWindowRef} className="residency-story__body-window">
              <div className="residency-story__track">
                <div
                  ref={(node) => {
                    blocksRef.current[0] = node;
                  }}
                  className="residency-story__body-panel"
                >
                  <div ref={copyRef} className="residency-story__text residency-story__statement">
                    <h3 className="residency-story__statement-heading">{statementHeading}</h3>
                    <p>{statement}</p>
                  </div>
                </div>
                <div
                  ref={(node) => {
                    blocksRef.current[1] = node;
                  }}
                  className="residency-story__content-panel residency-story__side-panel"
                >
                  <figure className="residency-story__visual">
                    <Image
                      src={RESIDENCY_STORY_MEDIA.side.src}
                      alt={RESIDENCY_STORY_MEDIA.side.alt}
                      sizes="(max-width: 767px) 60vw, 24vw"
                      fill
                      draggable={false}
                    />
                  </figure>
                  <p className="residency-story__text">{followUp[1]}</p>
                </div>
                <div
                  ref={(node) => {
                    blocksRef.current[2] = node;
                  }}
                  className="residency-story__content-panel residency-story__stacked-panel"
                >
                  <figure className="residency-story__stacked-visual">
                    <Image
                      src={RESIDENCY_STORY_MEDIA.stacked.src}
                      alt={RESIDENCY_STORY_MEDIA.stacked.alt}
                      sizes="(max-width: 767px) 80vw, 38vw"
                      fill
                      draggable={false}
                    />
                  </figure>
                  <p className="residency-story__text">{followUp[0]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ResidencyChapters />
    </main>
  );
}

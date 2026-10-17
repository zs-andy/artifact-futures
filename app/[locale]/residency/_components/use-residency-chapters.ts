"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SECTION_DRIFT, viewportHeight } from "../_lib/residency-motion";

gsap.registerPlugin(ScrollTrigger);

export function useResidencyChapters(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "visible";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 },
    );

    for (const item of items) {
      if (reduced.matches || item.getBoundingClientRect().top < viewportHeight()) {
        item.dataset.reveal = "visible";
      } else {
        item.dataset.reveal = "pending";
        observer.observe(item);
      }
    }

    const chapters = root.querySelector<HTMLElement>(".residency-chapters");
    const tones = root.querySelectorAll<HTMLElement>("[data-nav-tone]");
    const header = root.querySelector<HTMLElement>(".hero__bar");
    let tick = 0;
    const syncHeader = () => {
      tick = 0;
      if (!header) return;
      const headerBox = header.getBoundingClientRect();
      const sampleY = Math.max(headerBox.top, 0) + 8;
      const coversNav = (section: HTMLElement) => {
        const box = section.getBoundingClientRect();
        return box.top <= sampleY && box.bottom > sampleY;
      };
      let theme = "intro";
      for (const section of tones) {
        if (coversNav(section)) theme = section.dataset.navTone || "paper";
      }
      document.documentElement.dataset.residencyChapterTheme = theme;
    };
    const scheduleHeader = () => {
      if (!tick) tick = window.requestAnimationFrame(syncHeader);
    };

    syncHeader();
    window.addEventListener("scroll", scheduleHeader, { passive: true });
    window.addEventListener("resize", scheduleHeader);

    const cover = (
      outgoing: HTMLElement | null,
      incoming: HTMLElement | null,
      reach: () => number = viewportHeight,
    ) => {
      if (!outgoing || !incoming) return;
      gsap.fromTo(
        outgoing,
        { y: 0 },
        {
          y: () => reach() * SECTION_DRIFT,
          ease: "none",
          scrollTrigger: {
            trigger: incoming,
            start: () => `top ${reach()}px`,
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    };

    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const frame = root.querySelector<HTMLElement>(".residency-story__frame");
      const archive = root.querySelector<HTMLElement>(".residency-chapter--archive");
      const community = root.querySelector<HTMLElement>(".residency-chapter--community");
      const beyond = root.querySelector<HTMLElement>(".residency-chapter--beyond");
      const score = root.querySelector<HTMLElement>(".experience-score");

      cover(frame, chapters, () => frame?.offsetHeight ?? viewportHeight());
      cover(score, archive);
      cover(archive, community);
      cover(community, beyond);

      const lines = score
        ? Array.from(score.querySelectorAll<HTMLElement>(".experience-line"))
        : [];
      if (score && lines.length > 0) {
        const span = lines.length - 1;
        const copies = lines.map((line) =>
          line.querySelector<HTMLElement>(".chapter-copy"),
        );
        const place = (progress: number) => {
          const offset = progress * span;
          const active = Math.round(offset);
          for (const [i, line] of lines.entries()) {
            line.dataset.state = i === active ? "on" : i < active ? "past" : "future";
            const copy = copies[i];
            if (copy) gsap.set(copy, { y: (i - offset) * viewportHeight() });
          }
        };
        place(0);
        ScrollTrigger.create({
          trigger: score,
          start: "top top",
          end: () => `+=${viewportHeight() * span}`,
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: (self) => place(self.progress),
          onUpdate: (self) => place(self.progress),
        });
      }
      const room = root.querySelector(".experience-room");
      if (room) {
        gsap.fromTo(root.querySelector(".experience-room__image"), { clipPath: "inset(12% 18% 12% 18%)", scale: 1.12 }, {
          clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none",
          scrollTrigger: { trigger: room, start: "top bottom", end: "top top", scrub: true },
        });
      }
    }, root);

    let refreshTick = 0;
    const layoutObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(refreshTick);
      refreshTick = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        scheduleHeader();
      });
    });
    if (chapters) layoutObserver.observe(chapters);

    return () => {
      observer.disconnect();
      media.revert();
      layoutObserver.disconnect();
      window.cancelAnimationFrame(refreshTick);
      for (const item of items) item.dataset.reveal = "visible";
      window.cancelAnimationFrame(tick);
      window.removeEventListener("scroll", scheduleHeader);
      window.removeEventListener("resize", scheduleHeader);
      delete document.documentElement.dataset.residencyChapterTheme;
    };
  }, [rootRef]);
}

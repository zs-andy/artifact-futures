import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "../../_components/smooth-scroll";

gsap.registerPlugin(CustomEase, ScrollTrigger);

const BEAT = 0.5;
const RISE = 0.8;
const EASE = {
  swift: CustomEase.create("cv.swift", "0.16,1,0.3,1"),
  snap: CustomEase.create("cv.snap", "0.85,0,0.15,1"),
  smooth: CustomEase.create("cv.smooth", "0.65,0,0.35,1"),
  exit: CustomEase.create("cv.exit", "0.7,0,0.84,0"),
  pop: CustomEase.create("cv.pop", "0.34,1.56,0.64,1"),
};
const FROM: Record<string, gsap.TweenVars> = {
  left: { xPercent: -110 },
  right: { xPercent: 110 },
  up: { yPercent: -110 },
  down: { yPercent: 110 },
};

const stepped = (progress: number, steps: number) => {
  const x = gsap.utils.clamp(0, 1, progress) * steps;
  const k = Math.min(Math.floor(x), steps - 1);
  return (k + EASE.smooth(x - k)) / steps;
};

const whenBooted = (run: () => void) => {
  const html = document.documentElement;
  if (html.dataset.boot === "ready") {
    run();
    return () => undefined;
  }
  const observer = new MutationObserver(() => {
    if (html.dataset.boot !== "ready") return;
    observer.disconnect();
    run();
  });
  observer.observe(html, { attributes: true, attributeFilter: ["data-boot"] });
  return () => observer.disconnect();
};

export function stage(root: HTMLElement) {
  const html = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 767px)");
  const restoration = history.scrollRestoration;
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const q = <T extends Element = HTMLElement>(selector: string, scope: Element = root) =>
    gsap.utils.toArray<T>(selector, scope);
  const one = <T extends Element = HTMLElement>(selector: string, scope: Element = root) =>
    scope.querySelector<T>(selector) as T;

  const sheet = one(".cv-sheet");
  const sheetIn = one(".cv-sheet__in");
  const track = one(".cv-track");
  const cover = one(".cv-cover");
  const end = one(".cv-end");
  const finaleRoot = one(".cv-finale");
  const blue = { p: 0 };
  const paint = () => {
    const x = (blue.p - 1) * 100;
    sheet.style.transform = `translate3d(${x}%,0,0)`;
    sheetIn.style.transform = `translate3d(${-x}%,0,0)`;
  };
  const follow = () => {
    track.style.transform = `translate3d(0,${-Math.min(window.scrollY, window.innerHeight * 1.5)}px,0)`;
  };

  let opened = false;
  let stopWaiting = () => {};

  const context = gsap.context(() => {
    const plates = q(".cv-cover .cv-plate, .cv-track .cv-plate");
    const inPlates = (selector: string) => q(`.cv-cover ${selector}, .cv-track ${selector}`);
    const mid = q(".cv-lines i:nth-child(2)");
    const sides = q(".cv-lines i:nth-child(odd)");
    const bases = inPlates(".cv-plate__bases .cv-m__in");
    const marks = inPlates(".cv-plate__mark .cv-m__in");
    const counts = inPlates(".cv-plate__count");
    const countMasks = counts.map((count) => count.closest(".cv-m__in") as HTMLElement);
    const stamps = inPlates(".cv-plate__stamp > .cv-m:last-child .cv-m__in");
    const feet = inPlates(".cv-plate__line .cv-m__in");

    gsap.set(mid, { scaleY: 0, transformOrigin: "50% 0%" });
    gsap.set(sides, { scaleY: 0, transformOrigin: "50% 100%" });
    gsap.set([...bases, ...marks, ...countMasks, ...stamps, ...feet], { yPercent: 110 });
    gsap.set(q(".cv-plate__code .cv-bar"), { scaleY: 0, transformOrigin: "50% 100%" });
    paint();

    const tally = { value: 0 };
    const showCount = () => counts.forEach((count) => (count.textContent = `${Math.round(tally.value)}%`));

    const intro = gsap
      .timeline({ paused: true, onComplete: () => open() })
      .to(mid, { scaleY: 1, duration: 0.6, ease: EASE.swift }, 0.1)
      .to(sides, { scaleY: 1, duration: 0.6, ease: EASE.swift }, 0.4)
      .to(bases, { yPercent: 0, duration: 0.6, ease: EASE.swift }, 2 * BEAT)
      .to(marks, { yPercent: 0, duration: 1, ease: EASE.smooth }, 2 * BEAT)
      .to(countMasks, { yPercent: 0, duration: 0.5, ease: EASE.swift }, 2.5 * BEAT);
    for (let step = 1; step <= 4; step++) {
      const at = (3 + step) * BEAT;
      intro
        .to(blue, { p: step / 4, duration: 0.4, ease: EASE.snap, onUpdate: paint }, at)
        .to(tally, { value: step * 25, duration: 0.4, ease: EASE.snap, onUpdate: showCount }, at);
    }
    intro
      .to(countMasks, { yPercent: 110, duration: 0.4, ease: EASE.exit }, 8.5 * BEAT)
      .to([...stamps, ...feet], { yPercent: 0, duration: RISE, ease: EASE.swift }, 8.7 * BEAT);
    plates.forEach((plate) =>
      intro.to(
        q(".cv-plate__code .cv-bar", plate),
        { scaleY: 1, duration: 0.5, ease: EASE.swift, stagger: { amount: 0.4 } },
        8.7 * BEAT,
      ),
    );

    gsap.set(q(".cv-m__in", finaleRoot), { yPercent: 110 });
    gsap.set(q(".cv-bar", finaleRoot), { scaleY: 0, transformOrigin: "50% 100%" });
    const finale = gsap
      .timeline({ paused: true })
      .to(q(".cv-plate__bases .cv-m__in", finaleRoot), { yPercent: 0, duration: 0.6, ease: EASE.swift }, 0)
      .to(q(".cv-plate__mark .cv-m__in", finaleRoot), { yPercent: 0, duration: 1, ease: EASE.smooth }, 0)
      .to(q(".cv-plate__foot .cv-m__in", finaleRoot), { yPercent: 0, duration: RISE, ease: EASE.swift }, 0.2)
      .to(q(".cv-bar", finaleRoot), { scaleY: 1, duration: 0.5, ease: EASE.swift, stagger: { amount: 0.4 } }, 0.2);
    let finaleOn = false;
    const toggleFinale = (on: boolean) => {
      if (on === finaleOn) return;
      finaleOn = on;
      if (on) finale.play();
      else finale.reverse();
    };

    let coverScroll: ScrollTrigger | null = null;
    let endScroll: ScrollTrigger | null = null;
    const drive = () => {
      if (!opened || mobile.matches) return;
      const side = 0.25;
      const closing = endScroll?.progress ?? 0;
      blue.p =
        closing > 0
          ? side + (1 - side) * stepped(closing, 3)
          : 1 - (1 - side) * stepped(coverScroll?.progress ?? 0, 3);
      paint();
      toggleFinale(closing > 0 && blue.p > 0.999);
    };

    const cue = (trigger: Element, timeline: gsap.core.Timeline, start = "top 80%") => {
      if (reduced) {
        timeline.progress(1);
        return;
      }
      ScrollTrigger.create({ trigger, start, once: true, onEnter: () => void timeline.play() });
    };
    const rise = (stagger = 0): gsap.TweenVars => ({ yPercent: 0, duration: RISE, ease: EASE.swift, stagger });
    const hidden = (targets: Element[]) => {
      gsap.set(targets, { yPercent: 110 });
      return targets;
    };

    q(".cv-sec").forEach((section) => {
      const title = hidden(q(".cv-sec__title .cv-m__in", section));
      cue(section, gsap.timeline({ paused: true }).to(title, rise(0.06)), "top 70%");
    });

    q("[data-cv-words]").forEach((paragraph) => {
      const words = hidden(q(".cv-m__in", paragraph).filter((word) => !word.closest(".cv-artifact__name")));
      cue(paragraph, gsap.timeline({ paused: true }).to(words, rise(0.018)));
    });

    q(".cv-profile .cv-trio, .cv-fellow .cv-trio").forEach((trio) => {
      const blocks = hidden(q(".cv-m__in", trio));
      cue(trio, gsap.timeline({ paused: true }).to(blocks, rise(0.08)));
    });

    const directions = one(".cv-directions");
    const roles = q(".cv-dir", directions);
    roles.forEach((role) => gsap.set(one(".cv-m__in", role), FROM[role.dataset.from ?? "down"]));
    const rest = hidden(q(".cv-directions__rest .cv-m__in", directions));
    cue(
      directions,
      gsap
        .timeline({ paused: true })
        .to(
          roles.map((role) => one(".cv-m__in", role)),
          { xPercent: 0, yPercent: 0, duration: 1, ease: EASE.swift },
          0,
        )
        .to(rest, rise(0.02), 2 * BEAT),
    );

    const rail = one(".cv-practice__rail");
    const line = one(".cv-practice__line", rail);
    const ticks = q(".cv-practice__tick", rail);
    const items = q(".cv-practice__item");
    const inquiry = hidden(q(".cv-practice__inquiry .cv-m__in"));
    gsap.set(line, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(ticks, { scaleY: 0 });
    const practice = gsap
      .timeline({ paused: true })
      .to(line, { scaleX: 1, duration: 3 * BEAT, ease: "none" }, 0);
    items.forEach((item, index) => {
      const at = index * BEAT;
      const parts = hidden(q(".cv-m__in", item));
      practice
        .to(ticks[index], { scaleY: 1, duration: 0.4, ease: EASE.pop }, at)
        .to(parts, rise(0.06), at + 0.05);
    });
    practice.to(inquiry, rise(), 3 * BEAT);
    cue(rail, practice);

    const strips = {
      year: q('[data-cv-clock="year"] .cv-digit__strip'),
      month: q('[data-cv-clock="month"] .cv-digit__strip'),
    };
    gsap.set([...strips.year, ...strips.month], { yPercent: 10 });
    let shown = "";
    const showDate = (year: string, month: string) => {
      if (shown === year + month) return;
      shown = year + month;
      [...strips.year.map((strip, index) => [strip, year[index]] as const), ...strips.month.map((strip, index) => [strip, month[index]] as const)].forEach(
        ([strip, digit], index) =>
          gsap.to(strip, {
            yPercent: -Number(digit) * 10,
            duration: 0.6,
            ease: EASE.snap,
            delay: index * 0.03,
            overwrite: true,
          }),
      );
    };

    q(".cv-row").forEach((row) => {
      const year = row.dataset.year ?? "";
      const month = (row.dataset.month ?? "").padStart(2, "0");
      ScrollTrigger.create({
        trigger: row,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) showDate(year, month);
        },
      });
      const parts = hidden(q(".cv-m__in", row));
      const timeline = gsap.timeline({ paused: true });
      if (row.classList.contains("cv-now")) {
        const rule = one(".cv-now__rule", row);
        const mark = one(".cv-now__mark", row);
        gsap.set(rule, { scaleX: 0, transformOrigin: "100% 50%" });
        gsap.set(mark, { scale: 0 });
        timeline
          .to(rule, { scaleX: 1, duration: 2 * BEAT, ease: EASE.smooth }, 0)
          .to(mark, { scale: 1, duration: 0.5, ease: EASE.pop }, 1.8 * BEAT)
          .to(parts, rise(0.03), 0.6 * BEAT);
      } else {
        const rule = one(".cv-row__rule", row);
        const bars = q(".cv-bar", row);
        gsap.set(rule, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
        timeline
          .to(rule, { scaleX: 1, duration: 0.7, ease: EASE.swift }, 0)
          .to(parts, rise(0.04), 0.1)
          .to(bars, { scaleY: 1, duration: 0.5, ease: EASE.swift, stagger: { amount: 0.35 } }, 0.25);
      }
      cue(row, timeline, "top 85%");
    });

    const artifact = one(".cv-artifact");
    const artifactName = hidden(q(".cv-artifact__name .cv-m__in", artifact));
    const artifactMark = one(".cv-artifact__mark", artifact);
    const slot = one(".cv-slot", artifact);
    const slotMask = hidden(q(":scope > .cv-m > .cv-m__in", slot));
    const corpus = hidden(q(":scope > .cv-text .cv-m__in", artifact));
    gsap.set(artifactMark, { scale: 0 });
    cue(
      slot,
      gsap
        .timeline({ paused: true })
        .to(artifactMark, { scale: 1, duration: 0.5, ease: EASE.pop }, 0)
        .to(artifactName, rise(), 0.1)
        .to(slotMask, rise(), BEAT)
        .to(corpus, rise(), 1.5 * BEAT),
    );
    const slotStrip = one(".cv-slot__strip", slot);
    const forms = slotStrip.children.length - 1;
    const cycle = gsap.timeline({ paused: true, repeat: -1 });
    for (let index = 1; index <= forms; index++) {
      cycle.to(
        slotStrip,
        { yPercent: (-index * 100) / (forms + 1), duration: 0.5, ease: EASE.snap },
        index * 2 * BEAT - 0.5,
      );
    }
    cycle.set(slotStrip, { yPercent: 0 }, forms * 2 * BEAT);
    if (!reduced) {
      ScrollTrigger.create({
        trigger: slot,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          if (self.isActive) cycle.play();
          else cycle.pause();
        },
      });
    }

    const withBody = one(".cv-with .cv-sec__body");
    const columns = q(".cv-with__col", withBody).map((column) => hidden(q(".cv-m__in", column)));
    const partners = hidden(q(".cv-with__partners .cv-m__in", withBody));
    const people = gsap.timeline({ paused: true });
    columns.forEach((column) => people.to(column, rise(0.035), 0));
    cue(withBody, people);
    cue(one(".cv-with__partners", withBody), gsap.timeline({ paused: true }).to(partners, rise(0.03)));

    const open = () => {
      if (opened) return;
      opened = true;
      root.dataset.phase = "open";
      delete html.dataset.cvLock;
      getLenis()?.start();
      coverScroll = ScrollTrigger.create({
        trigger: cover,
        start: "top top",
        end: "bottom top",
        onUpdate: drive,
        onRefresh: drive,
      });
      endScroll = ScrollTrigger.create({
        trigger: end,
        start: "top bottom",
        end: "bottom bottom",
        onUpdate: drive,
        onRefresh: drive,
      });
      ScrollTrigger.refresh();
    };

    const onMode = () => {
      if (!opened) return;
      if (mobile.matches) {
        blue.p = 1;
        paint();
      } else drive();
    };
    mobile.addEventListener("change", onMode);

    if (reduced) {
      intro.progress(1);
      open();
      return;
    }

    stopWaiting = whenBooted(() => {
      html.dataset.cvLock = "";
      getLenis()?.stop();
      window.scrollTo(0, 0);
      intro.play();
    });

    return () => mobile.removeEventListener("change", onMode);
  }, root);

  gsap.ticker.add(follow);

  return () => {
    stopWaiting();
    gsap.ticker.remove(follow);
    context.revert();
    delete html.dataset.cvLock;
    getLenis()?.start();
    history.scrollRestoration = restoration;
    root.dataset.phase = "intro";
  };
}

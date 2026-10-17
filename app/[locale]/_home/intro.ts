import { gsap, BLOOM, EXIT, SMOOTH, SWIFT } from "../_lib/motion";
import { inkRatio, inkTagline, TAGLINE } from "../_lib/tagline";
import { LOGO_LINES } from "../_components/logo";

// The intro owns its scroll lock and releases it on completion or unmount.
export function intro(root: HTMLElement, assets: Promise<unknown>[], done: () => void) {
  const loader = root.querySelector<HTMLElement>(".home__loader")!;
  const mark = loader.querySelector<HTMLElement>(".home__mark")!;
  const fill = loader.querySelector<HTMLElement>(".home__fill")!;
  const count = loader.querySelector<HTMLElement>(".home__count")!;
  const row = loader.querySelector<HTMLElement>(".home__row")!;
  const line = loader.querySelector<HTMLElement>(".home__tagline")!;
  const ink = loader.querySelector<HTMLCanvasElement>(".home__ink")!;
  const wheels = [...loader.querySelectorAll<HTMLElement>(".home__wheel")];
  const glyphs = LOGO_LINES.map((_, i) => [
    ...loader.querySelectorAll(`[data-line="${i}"] .logo__glyph`),
  ]);
  const shifts = [...TAGLINE].map(() => ({ value: -1 }));
  const html = document.documentElement;
  const restoration = history.scrollRestoration;
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  html.dataset.home = "intro";
  let alive = true;
  let shown = 0;
  let target = 0;
  let finished = 0;

  const drawInk = () => {
    const box = inkTagline(
      line,
      ink,
      inkRatio(),
      shifts.map((shift) => shift.value),
    );
    const ctx = ink.getContext("2d");
    if (!box || !ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ink.width, ink.height);
    ctx.globalCompositeOperation = "source-over";
    Object.assign(ink.style, {
      left: `${box.offsetX}px`,
      top: `${box.offsetY}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
  };
  const render = () => {
    const ones = shown % 10,
      carry = Math.max(0, ones - 9),
      digit = Math.floor(shown / 10) % 10;
    const values = [Math.floor(shown / 100) + (digit === 9 ? carry : 0), digit + carry, ones];
    wheels.forEach((wheel, i) => {
      (wheel.firstElementChild as HTMLElement).style.transform =
        `translate3d(0, ${(-values[i] / (i ? 11 : 2)) * 100}%, 0)`;
      wheel.dataset.lead = String(
        i === 0 ? values[0] < 0.5 : i === 1 && values[0] < 0.5 && values[1] < 0.5,
      );
    });
    fill.style.transform = `scaleY(${shown / 100})`;
    loader.toggleAttribute("data-full", shown >= 100);
    loader.setAttribute("aria-valuenow", String(Math.round(shown)));
  };

  const context = gsap.context(() => {
    const offset = -(count.offsetLeft + count.offsetWidth - mark.offsetWidth) / 2;
    gsap.set(loader, { x: offset });
    glyphs.forEach((glyph, i) => gsap.set(glyph, { y: LOGO_LINES[i].bottom - LOGO_LINES[i].top }));
    render();
    drawInk();
    loader.dataset.ink = "";
    const entrance = gsap
      .timeline({ paused: true })
      .fromTo(mark, { scale: 0 }, { scale: 1, duration: 0.5, ease: SWIFT }, 0)
      .fromTo(row, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: SWIFT }, 0.15);
    const finish = gsap
      .timeline({
        paused: true,
        onComplete: () => {
          delete html.dataset.home;
          loader.dataset.state = "open";
          gsap.set(mark, { clearProps: "width,height" });
          done();
        },
      })
      .fromTo(
        count,
        { clipPath: "inset(0% 0% 0% 0%)" },
        { clipPath: "inset(0% 100% 0% 0%)", duration: 0.5, ease: EXIT },
        0.2,
      )
      .to(row, { x: -8, duration: 0.5, ease: SMOOTH }, "<")
      .to(loader, { x: 0, duration: 0.6, ease: SMOOTH }, ">-0.05")
      .addLabel("bloom")
      .to(
        mark,
        { width: "var(--home-size)", height: "var(--home-size)", duration: 1.2, ease: BLOOM },
        "bloom",
      )
      .to(glyphs[0], { y: 0, duration: 0.9, ease: SWIFT, stagger: 0.035 }, "bloom+=0.55")
      .to(glyphs[1], { y: 0, duration: 0.9, ease: SWIFT, stagger: 0.035 }, "bloom+=0.67")
      .to(
        shifts,
        { value: 0, duration: 0.9, ease: SWIFT, stagger: 0.012, onUpdate: drawInk },
        "bloom+=0.95",
      );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (_: number, delta: number) => {
      if (html.dataset.boot !== "ready") return;
      if (entrance.paused()) entrance.play();
      if (entrance.time() < 0.4) return;
      const gap = target - shown;
      shown =
        gap <= 0.05
          ? target
          : shown + Math.min(gap * (1 - Math.exp((-delta / 1000) * 6)), (55 * delta) / 1000);
      render();
      if (shown < 100 || entrance.progress() < 1) return;
      gsap.ticker.remove(tick);
      finish.play();
    };
    if (reduced) {
      shown = 100;
      render();
      entrance.progress(1);
      finish.progress(1);
    } else gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, root);

  const tasks = [
    document.fonts.ready.then(() => {
      if (alive) drawInk();
    }),
    ...assets,
  ];
  tasks.forEach(
    (task) =>
      void task
        .catch(() => undefined)
        .then(() => {
          if (alive) target = (++finished / tasks.length) * 100;
        }),
  );
  const timeout = window.setTimeout(() => {
    target = 100;
  }, 12000);
  window.addEventListener("resize", drawInk);
  return () => {
    alive = false;
    clearTimeout(timeout);
    window.removeEventListener("resize", drawInk);
    context.revert();
    history.scrollRestoration = restoration;
    delete html.dataset.home;
    delete loader.dataset.state;
    delete loader.dataset.ink;
  };
}

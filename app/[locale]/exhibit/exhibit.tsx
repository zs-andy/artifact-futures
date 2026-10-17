"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { NodeBook, BOOK_COVERS } from "../journal/_components/node-book";
import {
  clamp,
  demoPeople,
  parsePeople,
  updateVisitors,
  type Person,
  type Visitor,
} from "./audience";
import { createCoverPainter, WALL_H, WALL_W } from "./covers";

type Source = "manual" | "demo" | "external";
type BookPosition = { x: number; gap: number };
const DEFAULT_BOOK: BookPosition = { x: 0.275, gap: 0.17 };
const BOOK_STORAGE = "artifact:exhibit:book:v1";

function bookBounds(rect: DOMRect) {
  // Keep range limits aligned with the sliders' 0.001 step.
  const margin = Math.ceil(Math.max(0.025, 24 / rect.width) * 1000) / 1000;
  const gapMin = Math.ceil((8 / rect.height) * 1000) / 1000;
  return {
    xMin: margin,
    xMax: 1 - margin,
    gapMin,
    gapMax: Math.max(
      gapMin,
      Math.floor(Math.min(0.75, (innerHeight - rect.bottom - 82) / rect.height) * 1000) / 1000,
    ),
  };
}

export function Exhibit({ locale }: { locale: string }) {
  const wall = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef({
    visitors: new Map<string, Visitor>(),
    now: 0,
    progress: 0,
    demoStart: 0,
    external: { people: [] as Person[], received: -Infinity },
    nextId: 1,
  });
  const [ready, setReady] = useState(false);
  const [interaction, setInteraction] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [source, setSource] = useState<Source>("manual");
  const [people, setPeople] = useState<Person[]>([]);
  const [book, setBook] = useState(DEFAULT_BOOK);
  const bookPosition = useRef(DEFAULT_BOOK);
  const bookDrag = useRef<{ x: number; y: number } | null>(null);
  const [bookLimits, setBookLimits] = useState({
    xMin: 0.025,
    xMax: 0.975,
    gapMin: 0.02,
    gapMax: 0.75,
  });
  const [guides, setGuides] = useState(true);
  const [output, setOutput] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [ui, setUi] = useState({
    progress: 0,
    count: 0,
    visitors: [] as { id: string; dwell: number; fired: boolean }[],
  });

  const resetVisitors = () => runtime.current.visitors.clear();
  const chooseSource = (next: Source) => {
    resetVisitors();
    runtime.current.demoStart = runtime.current.now;
    runtime.current.external = { people: [], received: -Infinity };
    setSource(next);
  };
  const toggleInteraction = () => {
    resetVisitors();
    setInteraction((value) => !value);
  };
  const restart = () => {
    resetVisitors();
    runtime.current.progress = 0;
    runtime.current.demoStart = runtime.current.now;
  };
  const togglePlayback = () => setPlaying((value) => !value);

  const placeBook = useCallback((requested: BookPosition, persist = true) => {
    const rect = wall.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    const bounds = bookBounds(rect);
    const next = {
      x: clamp(requested.x, bounds.xMin, bounds.xMax),
      gap: clamp(requested.gap, bounds.gapMin, bounds.gapMax),
    };
    bookPosition.current = next;
    setBook(next);
    if (persist) {
      try {
        localStorage.setItem(BOOK_STORAGE, JSON.stringify(next));
      } catch {
        /* Calibration still works if browser storage is unavailable. */
      }
    }
  }, []);

  const tick = useEffectEvent(
    (
      dt: number,
      realNow: number,
      paint: ReturnType<typeof createCoverPainter>,
      reduced: boolean,
    ) => {
      const r = runtime.current;
      const running = ready && playing;
      if (running) r.now += dt;
      const samples = !interaction
        ? []
        : source === "manual"
          ? people
          : source === "demo"
            ? demoPeople(r.now - r.demoStart)
            : realNow - r.external.received < 500
              ? r.external.people
              : [];
      let count = samples.filter((person) => person.confidence >= 0.65).length;
      if (running) count = updateVisitors(r.visitors, samples, r.now, dt);
      const speed = !interaction ? 1 : count ? 0.55 : 1.5;
      if (running) r.progress = (r.progress + (dt * speed) / 120) % 1;
      iframe.current?.contentWindow?.postMessage(
        { type: "artifact:playback", progress: r.progress },
        location.origin,
      );
      paint(r.visitors, r.now, book, reduced);
      return {
        progress: r.progress,
        count,
        visitors: [...r.visitors.values()].map((v) => ({
          id: v.id,
          dwell: v.dwell,
          fired: v.fired !== null,
        })),
      };
    },
  );

  useEffect(() => {
    const host = wall.current!;
    let savedBook: BookPosition | undefined;
    try {
      const value = JSON.parse(localStorage.getItem(BOOK_STORAGE) ?? "null");
      if (
        value &&
        typeof value.x === "number" &&
        Number.isFinite(value.x) &&
        typeof value.gap === "number" &&
        Number.isFinite(value.gap)
      )
        savedBook = value;
    } catch {
      /* Use the default position when saved calibration cannot be read. */
    }
    const resize = new ResizeObserver(() => {
      host.style.setProperty("--wall-scale", String(host.clientWidth / WALL_W));
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setBookLimits(bookBounds(rect));
      // Output hides the physical mock-up, so it must not recalibrate its position.
      if (!host.closest("[data-output]")) {
        placeBook(savedBook ?? bookPosition.current, false);
        savedBook = undefined;
      }
    });
    resize.observe(host);
    resize.observe(host.closest(".exhibit__view")!);
    const paint = createCoverPainter(canvas.current!);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0,
      last = performance.now(),
      updateAt = 0;
    const frame = (now: number) => {
      const elapsed = (now - last) / 1000;
      // A suspended tab must not finish a dwell on its first frame back.
      const dt = elapsed > 0.5 ? 0 : elapsed;
      if (elapsed > 0.5)
        for (const visitor of runtime.current.visitors.values()) {
          visitor.since = runtime.current.now;
          visitor.dwell = 0;
        }
      last = now;
      const next = tick(dt, now, paint, motion.matches);
      if (now - updateAt > 100) {
        updateAt = now;
        setUi(next);
      }
      request = requestAnimationFrame(frame);
    };
    request = requestAnimationFrame(frame);
    const accept = (data: unknown) => {
      const parsed = parsePeople(data);
      if (parsed) runtime.current.external = { people: parsed, received: performance.now() };
    };
    const custom = (event: Event) => accept((event as CustomEvent).detail?.people);
    const message = (event: MessageEvent) => {
      if (event.origin !== location.origin) return;
      if (
        event.source === iframe.current?.contentWindow &&
        event.data?.type === "artifact:stage-ready"
      )
        setReady(true);
      if (event.data?.type === "artifact:audience") accept(event.data.people);
    };
    window.addEventListener("message", message);
    window.addEventListener("artifact:audience", custom);
    return () => {
      cancelAnimationFrame(request);
      resize.disconnect();
      window.removeEventListener("message", message);
      window.removeEventListener("artifact:audience", custom);
    };
  }, [placeBook]);

  const keyHandler = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOutput(false);
      setPanelOpen(false);
      return;
    }
    if ((event.target as HTMLElement).closest("input, select, textarea, button")) return;
    if (event.code === "Space") {
      event.preventDefault();
      togglePlayback();
    }
    if (event.key.toLowerCase() === "i") toggleInteraction();
    if (event.key.toLowerCase() === "r") restart();
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const addPerson = () => {
    const id = `P${runtime.current.nextId++}`;
    setPeople((current) => [
      ...current,
      { id, x: [0.2, 0.55, 0.82, 0.4][current.length % 4], facing: false, confidence: 1 },
    ]);
  };
  const editPerson = (id: string, patch: Partial<Person>) =>
    setPeople((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <main className="exhibit" data-output={output || undefined}>
      <section className="exhibit__view" aria-label="三屏连续展示预览">
        <div className="exhibit__wall-surround">
          <div
            ref={wall}
            className="exhibit__wall"
            style={{ "--wall-scale": 0.4 } as CSSProperties}
          >
            <iframe
              ref={iframe}
              src={`/${locale}/exhibit?view=stage`}
              title="ARTIFACT 三屏连续画面"
              tabIndex={-1}
              width={WALL_W}
              height={WALL_H}
            />
            <canvas
              ref={canvas}
              className="exhibit__covers"
              aria-label="观众封面与飞向实体书的动画"
            />
            {guides ? (
              <div className="exhibit__seams" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            ) : null}
            {!ready ? (
              <div className="exhibit__loading">
                <span />
                ARTIFACT
              </div>
            ) : null}
          </div>
          <div
            className="exhibit__physical"
            style={{ left: `${book.x * 100}%`, top: `${(1 + book.gap) * 100}%` }}
          >
            <button
              className="exhibit__book"
              aria-label="实体书位置，可拖动调整"
              title="拖动调整位置；方向键微调"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                const rect = wall.current!.getBoundingClientRect();
                bookDrag.current = {
                  x: event.clientX - rect.left - bookPosition.current.x * rect.width,
                  y: event.clientY - rect.bottom - bookPosition.current.gap * rect.height,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!bookDrag.current) return;
                const rect = wall.current!.getBoundingClientRect();
                placeBook(
                  {
                    x: (event.clientX - bookDrag.current.x - rect.left) / rect.width,
                    gap: (event.clientY - bookDrag.current.y - rect.bottom) / rect.height,
                  },
                  false,
                );
              }}
              onPointerUp={(event) => {
                if (!bookDrag.current) return;
                bookDrag.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
                placeBook(bookPosition.current);
              }}
              onLostPointerCapture={() => {
                if (bookDrag.current) {
                  bookDrag.current = null;
                  placeBook(bookPosition.current);
                }
              }}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 0.02 : 0.002;
                const delta = {
                  ArrowLeft: [-step, 0],
                  ArrowRight: [step, 0],
                  ArrowUp: [0, -step],
                  ArrowDown: [0, step],
                }[event.key];
                if (!delta) return;
                event.preventDefault();
                placeBook({ x: book.x + delta[0], gap: book.gap + delta[1] });
              }}
            >
              <NodeBook cover={BOOK_COVERS["issue-01-flood"]} />
            </button>
          </div>
        </div>
      </section>

      <div className="exhibit__dock">
        {panelOpen ? (
          <section
            className="exhibit__panel"
            id="exhibit-panel"
            aria-label="展台控制"
            data-lenis-prevent
          >
            <header className="exhibit__panel-head">
              <span>展台</span>
              <span className="exhibit__status">
                {!ready
                  ? "载入中"
                  : !playing
                    ? "已暂停"
                    : !interaction
                      ? "循环播放"
                      : ui.count
                        ? `${ui.count} 人在场`
                        : "无人"}
              </span>
              <button aria-label="关闭展台控制" onClick={() => setPanelOpen(false)}>
                ×
              </button>
            </header>
            <div className="exhibit__panel-body">
              <div className="exhibit__playback">
                <button
                  className="exhibit__play"
                  aria-label={playing ? "暂停" : "播放"}
                  onClick={togglePlayback}
                  disabled={!ready}
                >
                  {playing ? (
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M5 3v10M11 3v10" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="m5 3 7 5-7 5Z" />
                    </svg>
                  )}
                </button>
                <input
                  aria-label="展示进度"
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={ui.progress}
                  onInput={(event) => {
                    const progress = Number(event.currentTarget.value);
                    runtime.current.progress = progress;
                    resetVisitors();
                    setUi((value) => ({ ...value, progress }));
                  }}
                />
                <button aria-label="从头播放" title="从头播放" onClick={restart}>
                  ↺
                </button>
              </div>
              <div className="exhibit__row">
                <label htmlFor="exhibit-interaction">观众交互</label>
                <button
                  id="exhibit-interaction"
                  role="switch"
                  aria-checked={interaction}
                  aria-label="观众交互"
                  className="exhibit__switch"
                  onClick={toggleInteraction}
                >
                  <span />
                </button>
              </div>
              {interaction ? (
                <div className="exhibit__interaction">
                  <label className="exhibit__row">
                    人物输入
                    <select
                      value={source}
                      onChange={(event) => chooseSource(event.target.value as Source)}
                    >
                      <option value="manual">手动模拟</option>
                      <option value="demo">自动演示 · 双人</option>
                      <option value="external">外部信号</option>
                    </select>
                  </label>
                  {source === "manual" ? (
                    <>
                      {people.map((person) => {
                        const state = ui.visitors.find((v) => v.id === person.id);
                        return (
                          <div className="exhibit__person" key={person.id}>
                            <div className="exhibit__row">
                              <span>
                                {person.id}
                                <small>
                                  {state?.fired
                                    ? "已触发"
                                    : state?.dwell
                                      ? `${(state.dwell * 3).toFixed(1)} / 3s`
                                      : "跟随"}
                                </small>
                              </span>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={person.facing}
                                  onChange={(event) =>
                                    editPerson(person.id, { facing: event.target.checked })
                                  }
                                />
                                面向屏幕
                              </label>
                              <button
                                aria-label={`移除 ${person.id}`}
                                onClick={() =>
                                  setPeople((current) => current.filter((p) => p.id !== person.id))
                                }
                              >
                                ×
                              </button>
                            </div>
                            <input
                              type="range"
                              aria-label={`${person.id} 横向位置`}
                              min="0.02"
                              max="0.98"
                              step="0.002"
                              value={person.x}
                              onInput={(event) =>
                                editPerson(person.id, { x: Number(event.currentTarget.value) })
                              }
                            />
                          </div>
                        );
                      })}
                      <button
                        className="exhibit__add"
                        onClick={addPerson}
                        disabled={people.length >= 8}
                      >
                        ＋ 添加观众
                      </button>
                      <p>停下并面向屏幕 3 秒，封面飞向实体书。</p>
                    </>
                  ) : source === "demo" ? (
                    <p>双人模拟 · 走近、驻足、离开，15 秒循环。</p>
                  ) : (
                    <p>{ui.count ? "正在接收人物信号" : "等待外部人物信号"}</p>
                  )}
                </div>
              ) : null}
              <details className="exhibit__settings">
                <summary>
                  显示设置<span>⌄</span>
                </summary>
                <label className="exhibit__row">
                  三屏边界
                  <input
                    type="checkbox"
                    checked={guides}
                    onChange={(event) => setGuides(event.target.checked)}
                  />
                </label>
                <label className="exhibit__book-position">
                  横向位置
                  <input
                    type="range"
                    aria-label="实体书横向位置"
                    min={bookLimits.xMin}
                    max={bookLimits.xMax}
                    step="0.001"
                    value={book.x}
                    onInput={(event) =>
                      placeBook({ ...book, x: Number(event.currentTarget.value) })
                    }
                  />
                </label>
                <label className="exhibit__book-position">
                  距屏幕下沿
                  <input
                    type="range"
                    aria-label="实体书距屏幕下沿"
                    min={bookLimits.gapMin}
                    max={bookLimits.gapMax}
                    step="0.001"
                    value={book.gap}
                    onInput={(event) =>
                      placeBook({ ...book, gap: Number(event.currentTarget.value) })
                    }
                  />
                </label>
                <p>
                  第 {Math.min(3, Math.floor(book.x * 3) + 1)} 屏下方 · 全宽{" "}
                  {(book.x * 100).toFixed(1)}%。可直接拖动书本，位置在本机自动保存。
                </p>
                <button onClick={() => placeBook(DEFAULT_BOOK)}>恢复默认位置</button>
                <button
                  onClick={() => {
                    setOutput(true);
                    setPanelOpen(false);
                  }}
                >
                  纯净输出 ↗
                </button>
              </details>
            </div>
          </section>
        ) : null}
        <button
          className="exhibit__capsule"
          aria-label="展台控制"
          aria-expanded={panelOpen}
          aria-controls="exhibit-panel"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <span className="exhibit__capsule-mark" />
          <span>展台</span>
          <i />
          <span className="exhibit__capsule-state">{interaction ? "交互" : "循环"}</span>
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            style={{ transform: panelOpen ? "rotate(180deg)" : undefined }}
          >
            <path d="m3 7 3-3 3 3" />
          </svg>
        </button>
      </div>
      {output ? (
        <button className="exhibit__exit-output" onClick={() => setOutput(false)}>
          退出 · Esc
        </button>
      ) : null}
      <span className="exhibit__sr" role="status">
        {ui.visitors.filter((v) => v.fired).length} 位观众已触发飞向实体书
      </span>
    </main>
  );
}

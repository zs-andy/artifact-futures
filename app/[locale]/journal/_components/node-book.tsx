import type { CSSProperties } from "react";
import gsap from "gsap";
import { EASE } from "./timeline/eases";
import { type BookCover } from "./node-book.data";
import "./node-book.css";

export { BOOK_COVERS } from "./node-book.data";

const CLOSE_RATE = 2;
const BEAT = 8;
const START = 0.02;
const SWELL = 1.4;
const COVER_W = 1000;
const COVER_H = 1403.1;

function CoverArt({ cover }: { cover: BookCover }) {
  const { barcode } = cover;
  const width = COVER_W - barcode.x;
  const bars = barcode.bars
    .map(([y, height]) => `M${barcode.x} ${y}h${width}v${height}h-${width}Z`)
    .join("");
  return (
    <svg
      className="node-book__art"
      viewBox={`0 0 ${COVER_W} ${COVER_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <text
        className="node-book__mast"
        x={-2}
        y={163}
        textLength={COVER_W + 4}
        lengthAdjust="spacingAndGlyphs"
      >
        ARTIFACT
      </text>
      {cover.blocks.map((block, index) => (
        <text
          key={index}
          className="node-book__block"
          x={block.x}
          y={block.lines[0]?.y}
          fontSize={block.size}
          fontWeight={block.weight}
        >
          {block.lines.map((line, row) => (
            <tspan key={row} x={line.x ?? block.x} y={line.y}>
              {line.runs.map((run) => (
                <tspan
                  key={run.text}
                  lang={run.lang}
                  className={run.italic ? "node-book__em" : undefined}
                >
                  {run.text}
                </tspan>
              ))}
            </tspan>
          ))}
        </text>
      ))}
      <rect x={barcode.x} y={barcode.y} width={width} height={barcode.height} fill="#ffffff" />
      <path d={bars} fill="#000000" />
    </svg>
  );
}

export function NodeBook({ cover }: { cover: BookCover }) {
  return (
    <div
      className="node-book"
      aria-hidden="true"
      style={{ "--book-board": cover.board, "--book-ink": cover.ink } as CSSProperties}
    >
      <div className="node-book__body" data-book="body">
        <div className="node-book__spine" data-book="spine">
          {cover.spine.map((text) => (
            <span key={text} className="node-book__spine-text">
              {text}
            </span>
          ))}
          <span className="node-book__veil" data-book="spine-shade" />
          <span className="node-book__veil node-book__veil--white" data-book="spine-white" />
        </div>
        <div className="node-book__cover">
          <CoverArt cover={cover} />
          <span className="node-book__veil" data-book="cover-shade" />
        </div>
      </div>
    </div>
  );
}

type BookCue = {
  pip: HTMLElement | null;
};

const at = (p: number) => (p - START) * BEAT;
const span = (from: number, to: number) => (to - from) * BEAT;
const smooth = (t: number) => t * t * (3 - 2 * t);

export type NodeBookRig = {
  open: () => void;
  close: () => void;
  reset: () => void;
  measure: () => void;
  dispose: () => void;
};

export function createNodeBook(root: HTMLElement, cue: BookCue): NodeBookRig | null {
  const pick = (name: string) => root.querySelector<HTMLElement>(`[data-book="${name}"]`);
  const body = pick("body");
  const spine = pick("spine");
  const spineShade = pick("spine-shade");
  const spineWhite = pick("spine-white");
  const coverShade = pick("cover-shade");
  if (!body || !spine || !spineShade || !spineWhite || !coverShade) return null;

  const board = root.style.getPropertyValue("--book-board").trim() || "#ffffff";
  const state = { dash: 0, grow: 0, blue: 0, face: 0 };
  let height = 1;

  const measure = () => {
    height = Math.max(body.offsetHeight, 1);
  };

  const paint = () => {
    const angle = 90 * (1 - state.face);
    const turn = (angle * Math.PI) / 180;
    const scale = 1 / height + (1 - 1 / height) * state.grow;
    body.style.transform = `rotateY(${angle.toFixed(3)}deg) scaleY(${scale.toFixed(5)})`;
    const closed = 50 * (1 - state.dash);
    spine.style.clipPath =
      closed > 0.005 ? `inset(0 ${closed.toFixed(2)}% 0 ${closed.toFixed(2)}%)` : "";
    spineShade.style.opacity = (0.45 * (1 - Math.sin(turn))).toFixed(3);
    spineWhite.style.opacity = (1 - state.blue).toFixed(3);
    coverShade.style.opacity = (0.25 * (1 - Math.cos(turn))).toFixed(3);
    root.style.visibility = state.dash > 0 ? "visible" : "";
  };

  const motion = gsap.timeline({ paused: true, onUpdate: paint });
  if (cue.pip) {
    motion
      .to(
        cue.pip,
        {
          scale: 1 + SWELL,
          backgroundColor: board,
          duration: span(0.02, 0.06),
          ease: smooth,
        },
        at(0.02),
      )
      .to(
        cue.pip,
        { scale: 1, backgroundColor: "#ffffff", duration: span(0.08, 0.11), ease: smooth },
        at(0.08),
      );
  }
  motion
    .to(state, { dash: 1, duration: span(0.06, 0.07), ease: EASE.out }, at(0.06))
    .to(state, { grow: 1, duration: span(0.072, 0.14), ease: EASE.out }, at(0.072))
    .to(state, { blue: 1, duration: span(0.072, 0.12), ease: "none" }, at(0.072))
    .to(state, { face: 1, duration: span(0.14, 0.24), ease: EASE.io }, at(0.14));

  measure();
  paint();

  return {
    open: () => {
      motion.timeScale(1).play();
    },
    close: () => {
      motion.timeScale(CLOSE_RATE).reverse();
    },
    reset: () => {
      motion.pause(0);
      paint();
    },
    measure: () => {
      measure();
      paint();
    },
    dispose: () => {
      motion.revert();
      motion.kill();
      body.style.removeProperty("transform");
      spine.style.removeProperty("clip-path");
      [spineShade, spineWhite, coverShade].forEach((veil) => veil.style.removeProperty("opacity"));
      root.style.removeProperty("visibility");
    },
  };
}

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ditherTo, INK_BLUE, loadImage, PAPER_WHITE } from "../_lib/dither";
import {
  FELLOWSHIP,
  JOURNAL,
  PROGRAMME,
  RESIDENCY,
  SLOGAN,
  STAY,
  WITH,
  type Media,
} from "../_lib/home-content";
import { TAGLINE } from "../_lib/tagline";
import { NodeBook } from "../journal/_components/node-book";
import { Logo } from "../_components/logo";
import { SnapLink } from "../_components/snap-link";
import { SEASONS, SHELF } from "./model";
const CELL_PX = 2;
const pad = (n: number) => String(n).padStart(2, "0");
const GROUPS = WITH.columns.flat();
const words = SLOGAN.join(" ").split(" ");
const SLOGAN_LINES = words.flatMap((_, i) => (i % 2 ? [] : [words.slice(i, i + 2).join(" ")]));
function Arrow() {
  return (
    <svg className="home__cta-arrow" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M1 6h10M6.5 1.5 11 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Plate({ media }: { media: Media }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = new AbortController();
    let image: HTMLImageElement | null = null;
    let painted = "";
    const paint = () => {
      const width = canvas.clientWidth;
      const size = `${width}:${canvas.clientHeight}`;
      if (!image || width === 0 || size === painted) return;
      painted = size;
      const columns = Math.max(1, Math.round(width / CELL_PX));
      const rows = Math.max(1, Math.round(canvas.clientHeight / CELL_PX));
      ditherTo(canvas, image, columns, rows, INK_BLUE, PAPER_WHITE);
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || !canvas.clientWidth) return;
        near.disconnect();
        loadImage(media.src, controller.signal)
          .then((loaded) => {
            image = loaded;
            paint();
          })
          .catch(() => undefined);
      },
      { rootMargin: "100% 0px" },
    );
    const resize = new ResizeObserver(paint);
    near.observe(canvas);
    resize.observe(canvas);
    return () => {
      controller.abort();
      near.disconnect();
      resize.disconnect();
    };
  }, [media.src]);

  return (
    <canvas ref={canvasRef} className="folio__plate" width={1} height={1} aria-hidden="true" />
  );
}

function Head({
  id,
  index,
  label,
  sub,
}: {
  id: string;
  index?: string;
  label: string;
  sub?: string;
}) {
  return (
    <header className="folio__head">
      <p className="folio__index">
        <span className="folio__seed" data-seed aria-hidden="true" />
        {index ? <span>{index}</span> : null}
        {sub ? <span className="folio__dim">{sub}</span> : null}
      </p>
      <h2 id={id} className="folio__title" data-title>
        <span className="folio__mask">
          <span>{label}</span>
        </span>
      </h2>
    </header>
  );
}

export function FolioView() {
  return (
    <div className="folio">
      <section className="folio__slogan" aria-label="Slogan">
        <span className="folio__slogan-field" aria-hidden="true" />
        <h2 className="folio__slogan-text">
          {SLOGAN_LINES.map((line) => (
            <span key={line} className="folio__mask">
              <span>{line}</span>
            </span>
          ))}
        </h2>
      </section>

      <section className="folio__sec folio__journal" aria-labelledby="folio-journal">
        <Head id="folio-journal" index={JOURNAL.index} label={JOURNAL.label} />
        <p className="folio__lead" data-rise>
          {JOURNAL.lead}
        </p>
        <div className="folio__shelf">
          {SHELF.map((issue) => (
            <article key={issue.number} className="folio__issue" data-rise>
              {issue.book ? (
                <div className="folio__book" data-book>
                  <NodeBook cover={issue.book} />
                </div>
              ) : (
                <div className="folio__blank" data-open aria-hidden="true">
                  <span>{issue.number}</span>
                </div>
              )}
              <h3 className="folio__issue-label">{issue.label}</h3>
              <p className="folio__issue-meta">{`${issue.date} · ${issue.place}`}</p>
              <p className="folio__issue-title">{issue.title}</p>
              {issue.book ? (
                <SnapLink className="folio__issue-read" href={issue.book.read}>
                  <span className="home__cta-text">Read the issue</span>
                  <Arrow />
                </SnapLink>
              ) : (
                <p className="folio__issue-soon">Coming soon</p>
              )}
            </article>
          ))}
        </div>
        <p className="folio__cta" data-rise>
          <SnapLink href={JOURNAL.href}>
            <span className="home__cta-text">{JOURNAL.cta}</span>
          </SnapLink>
        </p>
      </section>

      <section className="folio__sec folio__residency" aria-labelledby="folio-residency">
        <span className="folio__field" aria-hidden="true">
          <span className="folio__field-fill" />
        </span>
        <Head
          id="folio-residency"
          index={RESIDENCY.index}
          label={RESIDENCY.label}
          sub={RESIDENCY.sublabel}
        />
        <p className="folio__lead" data-rise>
          {RESIDENCY.lead}
        </p>
        <div className="folio__stair">
          {RESIDENCY.fellows.map((fellow) => (
            <figure
              key={fellow.src}
              className="folio__step"
              data-open
              style={{ aspectRatio: `${fellow.width} / ${fellow.height}` }}
            >
              <Plate media={fellow} />
            </figure>
          ))}
          <p className="folio__step-note" data-rise>
            {RESIDENCY.term} {FELLOWSHIP.cols[1]}
          </p>
        </div>
        <h3 className="folio__statement" data-rise>
          {STAY.heading} <span className="folio__dim">{STAY.headingMuted}</span>
        </h3>
        <ol className="folio__rows">
          {STAY.rows.map((row, index) => (
            <li key={row.title}>
              <span className="folio__row-seed" aria-hidden="true" />
              <span className="folio__row-index">{pad(index + 1)}</span>
              <h4 className="folio__row-title">{row.title}</h4>
              <p className="folio__row-copy">{row.copy}</p>
            </li>
          ))}
        </ol>
        <div className="folio__artifact" data-rise>
          <p className="folio__artifact-lead">
            {FELLOWSHIP.artifact}{" "}
            <span className="folio__nowrap">
              <span className="home__ledger-mark" aria-hidden="true" />
              Artifact:
            </span>
          </p>
          <p className="folio__slot" aria-label={FELLOWSHIP.forms.join(", ")}>
            <span className="folio__slot-strip" data-strip aria-hidden="true">
              {[...FELLOWSHIP.forms, FELLOWSHIP.forms[0]].map((form, index) => (
                <span key={index}>{form}</span>
              ))}
            </span>
          </p>
          <p className="folio__copy">{FELLOWSHIP.corpus}</p>
        </div>
        <p className="folio__cta" data-rise>
          <SnapLink href={RESIDENCY.href}>
            <span className="home__cta-text">{RESIDENCY.cta}</span>
          </SnapLink>
        </p>
      </section>

      <section className="folio__sec folio__programme" aria-labelledby="folio-programme">
        <Head id="folio-programme" index="03" label={PROGRAMME.label} />
        <div className="folio__finder" data-finder data-open>
          <div className="folio__frames">
            {PROGRAMME.occasions.map((occasion, index) => (
              <figure key={occasion.title} className="folio__frame" data-frame={index}>
                <Plate media={occasion.media} />
                <Image
                  unoptimized
                  className="folio__photo"
                  src={occasion.media.src}
                  width={occasion.media.width}
                  height={occasion.media.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </figure>
            ))}
          </div>
          <p className="folio__count" aria-hidden="true">
            <span data-count>01</span>
            <span>{`/${pad(PROGRAMME.occasions.length)}`}</span>
          </p>
        </div>
        {SEASONS.map((season) => (
          <div key={season.year} className="folio__season">
            <p className="folio__year">{season.year}</p>
            <ol className="folio__rows folio__rows--ink">
              {season.entries.map(({ index, month, occasion }) => (
                <li key={occasion.title} data-occasion={index}>
                  <span className="folio__row-seed" aria-hidden="true" />
                  <span className="folio__row-index">{`${month} · ${occasion.city}`}</span>
                  <h3 className="folio__row-title">{occasion.title}</h3>
                  <p className="folio__row-copy folio__dim">{occasion.kind}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section className="folio__sec folio__with" aria-labelledby="folio-with">
        <Head id="folio-with" label={WITH.label} />
        <div className="folio__groups">
          {GROUPS.map((group) => (
            <div key={group.title} className="folio__group" data-rise>
              <p className="folio__group-title">{group.title}</p>
              <ul className="folio__people">
                {group.people.map(([name, role]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <span className="folio__dim">{role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="folio__partners" data-rise>
          <p className="folio__group-title">Partners and hosts</p>
          <ul>
            {WITH.partners.map((partner) => (
              <li key={partner}>{partner}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="folio__close" aria-label="ARTIFACT Futures">
        <div className="folio__block" data-block>
          <span className="folio__block-fill" />
          <Logo className="folio__logo" />
        </div>
        <p className="folio__tagline">
          <span>{TAGLINE}</span>
        </p>
        <p className="folio__out">
          <SnapLink href="https://vac.art" target="_blank" rel="noopener noreferrer">
            <span className="home__cta-text">VAC.art</span>
            <Arrow />
          </SnapLink>
        </p>
      </section>
    </div>
  );
}

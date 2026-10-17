import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  BARCODE,
  BASES,
  CONTENTS,
  FELLOWSHIP,
  INSTITUTION,
  JOURNAL,
  PROGRAMME,
  SCAN_SIZE,
  SLOGAN,
  WORDMARK,
  scan,
} from "../_lib/reel-data";
import { code128 } from "../_lib/code128";
import { Clock, dialAngles } from "./reel-clock";
import { Pass } from "./reel-pass";

const barFrame = (() => {
  const { bars, modules } = code128(BARCODE);
  return bars.map((bar, index) => {
    const next = index + 1 < bars.length ? bars[index + 1].at : modules;
    return { start: bar.at / modules, span: (next - bar.at) / modules, size: bar.size / modules };
  });
})();

export function Cover() {
  return (
    <section className="rl-shot rl-cover" data-shot="cover" aria-label="ARTIFACT Futures">
      <div className="rl-cover__sheet">
        <div className="rl-cover__drift">
          <h1 className="rl-cover__mark">
            <Pass className="rl-cover__word" head="orange">
              {WORDMARK}
            </Pass>
          </h1>
          <p className="rl-cover__lead">
            <Pass head="white">{INSTITUTION}</Pass>
          </p>
          <p className="rl-cover__bases">
            <Pass head="white">New York, Hanoi,</Pass>
            <Pass head="white">Shanghai, Abu Dhabi</Pass>
          </p>
        </div>
        <Barcode />
      </div>
    </section>
  );
}

function Barcode() {
  return (
    <div className="rl-code" aria-hidden="true">
      {barFrame.map((bar, index) => (
        <span
          key={index}
          className="rl-code__bar"
          style={
            {
              "--start": bar.start,
              "--span": bar.span,
              "--size": bar.size,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function SloganLines() {
  return SLOGAN.map((line, index) =>
    index === SLOGAN.length - 1 && line.endsWith(".") ? (
      <span key={line} className="rl-slogan__line">
        {line.slice(0, -1)}
        <span className="rl-slogan__stop">
          .
          <i className="rl-slogan__base" />
        </span>
      </span>
    ) : (
      <span key={line} className="rl-slogan__line">
        {line}
      </span>
    ),
  );
}

export function Slogan() {
  return (
    <section className="rl-shot rl-slogan" data-shot="slogan">
      <span className="rl-slogan__paper" aria-hidden="true" />
      <h2 className="rl-slogan__text rl-slogan__source">
        <SloganLines />
      </h2>
      <div className="rl-slogan__slices" aria-hidden="true">
        {barFrame.map((bar, index) => (
          <div
            key={index}
            className="rl-slogan__slice"
            style={{ "--start": bar.start, "--span": bar.span } as React.CSSProperties}
          >
            <p className="rl-slogan__text rl-slogan__copy">
              <SloganLines />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Dial({ now }: { now: Date | null }) {
  const turn = (zone: string) => (now ? dialAngles(zone, now) : { hour: 0, minute: 0 });
  return (
    <div className="rl-dial">
      <span className="rl-dial__ring" aria-hidden="true" />
      <svg className="rl-dial__face" viewBox="-100 -100 200 200" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => (
          <line
            key={index}
            className={index % 6 === 0 ? "rl-dial__tick rl-dial__tick--major" : "rl-dial__tick"}
            x1="0"
            y1="-100"
            x2="0"
            y2={index % 6 === 0 ? -92 : -96}
            transform={`rotate(${index * 15})`}
          />
        ))}
      </svg>
      {BASES.map((base) => (
        <span
          key={base.city}
          className="rl-dial__hand"
          data-zone={base.zone}
          style={{ "--now": `${turn(base.zone).hour}deg` } as React.CSSProperties}
        />
      ))}
      <span
        className="rl-dial__hand rl-dial__hand--minute"
        style={{ "--now": `${turn(BASES[0].zone).minute}deg` } as React.CSSProperties}
      />
      <span className="rl-dial__pin" />
      <ul className="rl-dial__labels">
        {BASES.map((base) => {
          const angle = turn(base.zone).hour;
          return (
            <li
              key={base.city}
              className="rl-dial__label"
              data-zone={base.zone}
              data-side={angle % 360 < 180 ? "right" : "left"}
              style={{ "--now": `${angle}deg` } as React.CSSProperties}
            >
              <span className="rl-dial__tag">
                <Pass head="none" className="rl-dial__read">
                  <span className="rl-dial__city">{base.city}</span>
                  <Clock zone={base.zone} now={now} />
                </Pass>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Night({ now }: { now: Date | null }) {
  return (
    <section className="rl-shot rl-night" data-shot="night">
      <div className="rl-night__sheet">
        <div className="rl-night__half" data-side="left">
          <Dial now={now} />
        </div>
        <div className="rl-night__half" data-side="right" aria-hidden="true">
          <Dial now={now} />
        </div>
        <span className="rl-night__gutter" aria-hidden="true" />
      </div>
    </section>
  );
}

export function Journal() {
  return (
    <section className="rl-shot rl-journal" data-shot="journal">
      <span className="rl-journal__ground" aria-hidden="true" />
      <h2 className="rl-journal__mast">
        <Pass head="none" axis="y" className="rl-journal__word">
          {JOURNAL.word}
        </Pass>
      </h2>
      <figure className="rl-journal__spread">
        {(["left", "right"] as const).map((side) => (
          <div key={side} className="rl-journal__side" data-side={side}>
            {JOURNAL.spreads.map((pair, index) => (
              <div
                key={pair[0]}
                className="rl-journal__leaf"
                style={{ zIndex: side === "left" ? index + 1 : JOURNAL.spreads.length - index }}
              >
                <Image
                  src={scan(side === "left" ? pair[0] : pair[1])}
                  alt={index === 0 && side === "left" ? "Pages from ARTIFACT Journal Issue No. 1" : ""}
                  width={SCAN_SIZE.width}
                  height={SCAN_SIZE.height}
                  sizes="(min-aspect-ratio: 1/1) 36vw, 50vw"
                  loading="eager"
                  className="rl-journal__scan"
                />
                <span className="rl-journal__shade" aria-hidden="true" />
              </div>
            ))}
          </div>
        ))}
      </figure>
      <div className="rl-journal__aside">
        <Pass head="none" axis="y" className="rl-journal__folio">
          <span data-folio>{`p. ${JOURNAL.spreads[0][0]}`}</span>
          {` / ${JOURNAL.count}`}
        </Pass>
        <p className="rl-journal__line">
          <Pass head="none" axis="y">
            {JOURNAL.line}
          </Pass>
        </p>
      </div>
      <ol className="rl-journal__issues">
        {JOURNAL.issues.map((issue) => (
          <li key={issue.number} className="rl-journal__issue">
            <Pass head="none" axis="y" className="rl-journal__number">
              {issue.number}
            </Pass>
            <Pass head="none" axis="y" className="rl-journal__title">
              {issue.title}
            </Pass>
            <Pass head="none" axis="y" className="rl-journal__place">
              {`${issue.place}, ${issue.date}`}
            </Pass>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Fellowship() {
  return (
    <section className="rl-shot rl-fellow" data-shot="fellowship">
      <Pass className="rl-fellow__sheet" head="orange">
        <span className="rl-fellow__fill" />
      </Pass>
      <div className="rl-fellow__body">
        <h2 className="rl-word rl-fellow__word">
          {FELLOWSHIP.word.map((part) => (
            <Pass key={part} head="blue">
              {part}
            </Pass>
          ))}
        </h2>
        <p className="rl-fellow__line">
          <Pass head="blue">{FELLOWSHIP.line}</Pass>
        </p>
        <figure className="rl-fellow__photo">
          <Pass axis="y" head="blue" className="rl-fellow__frame">
            <Image
              src={FELLOWSHIP.photo.src}
              alt={FELLOWSHIP.photo.alt}
              width={FELLOWSHIP.photo.width}
              height={FELLOWSHIP.photo.height}
              sizes="(min-width: 768px) 40vw, 90vw"
              loading="eager"
              className="rl-fellow__image"
            />
          </Pass>
        </figure>
        <p className="rl-fellow__artifact">
          <Pass head="blue" className="rl-fellow__lead">
            {FELLOWSHIP.lead}
          </Pass>
          <span className="rl-fellow__slot">
            {FELLOWSHIP.forms.map((form) => (
              <Pass key={form} head="orange" className="rl-fellow__form">
                {form}
              </Pass>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}

export function Programme() {
  return (
    <section className="rl-shot rl-programme" data-shot="programme">
      <Pass className="rl-programme__sheet" axis="y" head="blue">
        <span className="rl-programme__fill" />
      </Pass>
      <div className="rl-programme__body">
        <h2 className="rl-word rl-programme__word">
          {PROGRAMME.word.map((part) => (
            <Pass key={part} head="orange">
              {part}
            </Pass>
          ))}
        </h2>
        <div className="rl-programme__track">
          <span className="rl-programme__line" aria-hidden="true" />
          <ol className="rl-programme__events">
            {PROGRAMME.events.map((event) => (
              <li key={event.place + event.date} className="rl-programme__event">
                <span className="rl-programme__dot" aria-hidden="true" />
                <Pass head="white" className="rl-programme__date">
                  {event.date}
                </Pass>
                <Pass head="white" className="rl-programme__place">
                  {event.place}
                </Pass>
                <Pass head="white" className="rl-programme__title">
                  {event.title}
                </Pass>
              </li>
            ))}
          </ol>
        </div>
        <div className="rl-programme__inquiry">
          <Pass head="white" className="rl-programme__label">
            {PROGRAMME.label}
          </Pass>
          <p className="rl-programme__lines">
            {PROGRAMME.inquiry.map((part) => (
              <Pass key={part} head="orange">
                {part}
              </Pass>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Contents() {
  return (
    <section className="rl-shot rl-contents" data-shot="contents">
      <Pass className="rl-contents__sheet" head="blue">
        <span className="rl-contents__fill" />
      </Pass>
      <div className="rl-contents__body">
        <p className="rl-contents__label">
          <Pass head="orange">Contents</Pass>
        </p>
        <ol className="rl-contents__rows">
          {CONTENTS.map((entry) => (
            <li key={entry.href} className="rl-contents__row">
              <Link href={entry.href} className="rl-row" data-row data-href={entry.href}>
                <span className="rl-row__fill" aria-hidden="true" />
                <Pass head="orange" className="rl-row__number">
                  {entry.number}
                </Pass>
                <Pass head="orange" className="rl-row__title">
                  {entry.title}
                </Pass>
                <Pass head="orange" className="rl-row__note">
                  {entry.note}
                </Pass>
                <span className="rl-row__rule" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

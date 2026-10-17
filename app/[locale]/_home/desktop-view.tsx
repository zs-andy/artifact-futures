import type { CSSProperties } from "react";
import {
  FELLOWSHIP,
  JOURNAL,
  PROGRAMME,
  RESIDENCY,
  SLOGAN,
  STAY,
  WITH,
} from "../_lib/home-content";
import { NodeBook } from "../journal/_components/node-book";
import { SnapLink } from "../_components/snap-link";
import { SEASONS, SHELF } from "./model";
const LEDGER_SHARE = 0.25;

function Explore({ href, label }: { href: string; label: string }) {
  return (
    <SnapLink href={href}>
      <span className="home__cta-text">{label}</span>
    </SnapLink>
  );
}

function Stay() {
  return (
    <div className="home__scene-copy home__stay" data-copy data-side="full">
      <div className="home__stay-side">
        <p className="home__panel-title">{RESIDENCY.label}</p>
        <h2 className="home__stay-heading">
          {STAY.heading} <span>{STAY.headingMuted}</span>
        </h2>
      </div>
      <ol className="home__stay-rows">
        {STAY.rows.map((row, index) => (
          <li
            key={row.title}
            className="home__stay-row"
            data-stay-row
            style={{ flexGrow: index === 0 ? 1 : 0 }}
          >
            <div className="home__stay-head">
              <h3>{row.title}</h3>
            </div>
            <div
              className="home__stay-grid"
              data-stay-grid
              style={{ gridTemplateRows: index === 0 ? "1fr" : "0fr" }}
            >
              <div className="home__stay-clip">
                <p data-stay-text style={{ opacity: index === 0 ? 1 : 0 }}>
                  {row.copy}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Ledger() {
  return (
    <div
      className="home__scene-copy home__ledger"
      data-copy
      data-side="full"
      style={{ "--ledger-col": `${LEDGER_SHARE * 100}%` } as CSSProperties}
    >
      <div className="home__ledger-run" data-ledger>
        <section className="home__ledger-sec">
          <h2 className="home__ledger-head">{FELLOWSHIP.label}</h2>
          <div className="home__ledger-body">
            <p className="home__ledger-state">{FELLOWSHIP.lead}</p>
            <div className="home__ledger-trio">
              {FELLOWSHIP.cols.map((text) => (
                <p key={text} className="home__ledger-text">
                  {text}
                </p>
              ))}
            </div>
            <div className="home__ledger-artifact">
              <p className="home__ledger-state">
                {FELLOWSHIP.artifact}{" "}
                <span className="home__ledger-artifact-name">
                  <span className="home__ledger-mark" aria-hidden="true" />
                  Artifact:
                </span>
              </p>
              <p
                className="home__ledger-display home__ledger-slot"
                aria-label={FELLOWSHIP.forms.join(", ")}
              >
                <span className="home__ledger-slot-strip" data-slot-strip aria-hidden="true">
                  {[...FELLOWSHIP.forms, FELLOWSHIP.forms[0]].map((form, index) => (
                    <span key={index}>{form}</span>
                  ))}
                </span>
              </p>
              <p className="home__ledger-text">{FELLOWSHIP.corpus}</p>
            </div>
          </div>
        </section>

        <section className="home__ledger-sec">
          <h2 className="home__ledger-head">{PROGRAMME.label}</h2>
          <div className="home__ledger-seasons" data-bill>
            {SEASONS.map((season) => (
              <ol key={season.year} className="home__ledger-rows">
                {season.entries.map(({ index, month, occasion }, order) => (
                  <li key={occasion.title} className="home__ledger-row" data-occasion={index}>
                    <span className="home__ledger-when">
                      <span>{order === 0 ? season.year : null}</span>
                      <span className="home__ledger-month">{month}</span>
                    </span>
                    <span className="home__ledger-entry">
                      <span className="home__ledger-main">
                        <span className="home__ledger-title">{occasion.title}</span>
                        <span className="home__ledger-small home__ledger-quiet">
                          {occasion.kind}
                        </span>
                      </span>
                      <span className="home__ledger-small home__ledger-city">{occasion.city}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ))}
          </div>
        </section>

        <section className="home__ledger-sec home__ledger-with">
          <h2 className="home__ledger-head">{WITH.label}</h2>
          <div className="home__ledger-body">
            <div className="home__ledger-trio">
              {WITH.columns.map((column, index) => (
                <div key={index} className="home__ledger-col">
                  {column.map((group) => (
                    <div key={group.title}>
                      <p className="home__ledger-small home__ledger-group">{group.title}</p>
                      <ul className="home__ledger-people">
                        {group.people.map(([name, role]) => (
                          <li key={name}>
                            <span className="home__ledger-name">{name}</span>
                            <span className="home__ledger-role">{role}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="home__ledger-partners">
              <p className="home__ledger-small">Partners and hosts</p>
              <ul className="home__ledger-list">
                {WITH.partners.map((partner) => (
                  <li key={partner}>{partner}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function DesktopView() {
  return (
    <div className="home__scene-layers">
      <p className="home__hint" aria-hidden="true">
        <span>Scroll to explore</span>
        <span className="home__hint-track">
          <span className="home__hint-seed" />
        </span>
      </p>
      <h2 className="home__scene-slogan">
        {SLOGAN.map((line) => (
          <span key={line} className="home__scene-mask">
            <span data-slogan-line>{line}</span>
          </span>
        ))}
      </h2>

      <div className="home__scene-copy" data-copy data-side="right" data-tone="dark">
        <div className="home__panel-text" data-scroll>
          <p className="home__panel-title">{JOURNAL.label}</p>
          <div className="home__spread">
            <div className="home__brief">
              <p className="home__panel-lead">{JOURNAL.lead}</p>
              <p className="home__brief-cta">
                <Explore href={JOURNAL.href} label={JOURNAL.cta} />
              </p>
            </div>
            <div className="home__books">
              {SHELF.map((book) => (
                <div key={book.label} className="home__book">
                  <span className="home__book-pip" aria-hidden="true" />
                  <div className="home__book-head">
                    <p className="home__book-title">{book.label}</p>
                    {book.id ? (
                      <SnapLink className="home__book-read" href={book.book!.read}>
                        <span className="home__cta-text">Read the full issue</span>
                        <svg className="home__cta-arrow" viewBox="0 0 12 12" aria-hidden="true">
                          <path
                            d="M1 6h10M6.5 1.5 11 6l-4.5 4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                        </svg>
                      </SnapLink>
                    ) : (
                      <p className="home__book-soon">Coming soon</p>
                    )}
                  </div>
                  <p className="home__book-meta">{`${book.date} · ${book.place}`}</p>
                  {book.id ? (
                    <div className="home__book-holder" data-book-holder data-white-mask>
                      <NodeBook cover={book.book!} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Stay />

      <Ledger />
    </div>
  );
}

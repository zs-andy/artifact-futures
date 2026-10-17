import { Fragment, type ReactNode } from "react";
import { EXPERIENCE, FELLOWSHIP, NOW, PARTNERS, PRACTICE, PROFILE, WITH, type Entry } from "../_lib/content";
import { Barcode } from "./barcode";
import { M, Words } from "./mask";

function Head({ index, title, children }: { index: number; title: string; children?: ReactNode }) {
  return (
    <div className="cv-sec__head">
      <h2 className="cv-sec__title">
        <M>
          <span className="cv-sec__num">{String(index).padStart(2, "0")}</span>
        </M>
        <M>{title}</M>
      </h2>
      {children}
    </div>
  );
}

export function Profile() {
  return (
    <section className="cv-sec cv-profile" data-cv-scene="profile">
      <Head index={1} title="Profile" />
      <div className="cv-sec__body">
        <p className="cv-state cv-span" data-cv-words>
          <Words text={PROFILE.lead} />
        </p>
        <div className="cv-trio">
          {PROFILE.body.map((text) => (
            <p key={text} className="cv-text">
              <M block>{text}</M>
            </p>
          ))}
        </div>
        <p className="cv-display cv-span cv-directions">
          {PROFILE.roles.map((role) => (
            <Fragment key={role.word}>
              <span className="cv-m cv-dir" data-from={role.from}>
                <span className="cv-m__in">{role.word}</span>
              </span>{" "}
            </Fragment>
          ))}
          <span className="cv-directions__rest">
            <Words text={PROFILE.rest} />
          </span>
        </p>
        <p className="cv-state cv-span cv-profile__close" data-cv-words>
          <Words text={PROFILE.close} />
        </p>
      </div>
    </section>
  );
}

export function Practice() {
  return (
    <section className="cv-sec cv-practice" data-cv-scene="practice">
      <Head index={2} title="Practice" />
      <div className="cv-sec__body">
        <p className="cv-state cv-span" data-cv-words>
          <Words text={PRACTICE.intro} />
        </p>
        <div className="cv-practice__rail cv-span" aria-hidden="true">
          <span className="cv-practice__line" />
          {PRACTICE.items.map((item) => (
            <span key={item.name} className="cv-practice__tick" />
          ))}
        </div>
        <ol className="cv-trio cv-practice__list">
          {PRACTICE.items.map((item, index) => (
            <li key={item.name} className="cv-practice__item">
              <p className="cv-small">
                <M>{`${String(index + 1).padStart(2, "0")} — ${item.kind}`}</M>
              </p>
              <h3 className="cv-display">
                <M>{item.name}</M>
              </h3>
              <p className="cv-text">
                <M block>{item.text}</M>
              </p>
              <p className="cv-small cv-practice__meta">
                <M>{item.meta}</M>
              </p>
            </li>
          ))}
        </ol>
        <p className="cv-text cv-span cv-practice__inquiry">
          <M block>{PRACTICE.inquiry}</M>
        </p>
      </div>
    </section>
  );
}

function Digits({ value, name }: { value: string; name: string }) {
  return (
    <span className="cv-clock__part" data-cv-clock={name}>
      {Array.from(value, (digit, index) => (
        <span key={index} className="cv-digit">
          <span className="cv-digit__strip" data-digit={digit}>
            {Array.from({ length: 10 }, (_, value) => (
              <span key={value}>{value}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

function Row({ entry }: { entry: Entry }) {
  return (
    <li className="cv-row" data-year={entry.year} data-month={entry.month}>
      <span className="cv-row__rule" aria-hidden="true" />
      <div className="cv-row__when">
        <p className="cv-row__date">
          <M>{entry.date}</M>
        </p>
        <p className="cv-small">
          <M>{entry.city}</M>
        </p>
      </div>
      <div className="cv-row__what">
        <p className="cv-small">
          <M>{entry.kind}</M>
        </p>
        <h3 className="cv-row__title">
          <M block>{entry.title}</M>
        </h3>
      </div>
      <div className="cv-row__more">
        <p className="cv-text">
          <M block>{entry.text}</M>
        </p>
        <div className="cv-row__tag">
          <Barcode text={entry.code} className="cv-row__code" />
          <p className="cv-small">
            <M>{entry.code}</M>
          </p>
        </div>
      </div>
    </li>
  );
}

export function Experience() {
  const [future, ...past] = EXPERIENCE;
  return (
    <section className="cv-sec cv-exp" data-cv-scene="experience">
      <Head index={3} title="Experience">
        <p className="cv-clock" aria-hidden="true">
          <Digits value={String(future.year)} name="year" />
          <span className="cv-clock__dot">.</span>
          <Digits value={String(future.month).padStart(2, "0")} name="month" />
        </p>
      </Head>
      <ol className="cv-sec__body cv-exp__list">
        <Row entry={future} />
        <li className="cv-row cv-now" data-year={NOW.year} data-month={NOW.month}>
          <span className="cv-now__rule" aria-hidden="true" />
          <span className="cv-now__mark" aria-hidden="true" />
          <div className="cv-row__when">
            <p className="cv-row__date">
              <M>Now</M>
            </p>
            <p className="cv-small">
              <M>{NOW.date}</M>
            </p>
          </div>
          <p className="cv-state cv-now__line">
            <Words text="The future is behind us." />
          </p>
        </li>
        {past.map((entry) => (
          <Row key={entry.code} entry={entry} />
        ))}
      </ol>
    </section>
  );
}

export function Fellowship() {
  return (
    <section className="cv-sec cv-fellow" data-cv-scene="fellowship">
      <Head index={4} title="Fellowship" />
      <div className="cv-sec__body">
        <p className="cv-state cv-span" data-cv-words>
          <Words text={FELLOWSHIP.lead} />
        </p>
        <div className="cv-trio">
          {FELLOWSHIP.cols.map((text) => (
            <p key={text} className="cv-text">
              <M block>{text}</M>
            </p>
          ))}
        </div>
        <div className="cv-span cv-artifact">
          <p className="cv-state" data-cv-words>
            <Words text={FELLOWSHIP.artifact} />{" "}
            <span className="cv-artifact__name">
              <span className="cv-artifact__mark" aria-hidden="true" />
              <M>Artifact:</M>
            </span>
          </p>
          <p className="cv-display cv-slot" aria-label={FELLOWSHIP.forms.join(", ")}>
            <span className="cv-m cv-m--block">
              <span className="cv-m__in">
                <span className="cv-slot__strip" aria-hidden="true">
                  {[...FELLOWSHIP.forms, FELLOWSHIP.forms[0]].map((form, index) => (
                    <span key={index}>{form}</span>
                  ))}
                </span>
              </span>
            </span>
          </p>
          <p className="cv-text">
            <M block>{FELLOWSHIP.corpus}</M>
          </p>
        </div>
      </div>
    </section>
  );
}

export function With() {
  return (
    <section className="cv-sec cv-with" data-cv-scene="with">
      <Head index={5} title="With" />
      <div className="cv-sec__body">
        <div className="cv-trio">
          {WITH.map((column, index) => (
            <div key={index} className="cv-with__col">
              {column.map((group) => (
                <div key={group.title} className="cv-with__group">
                  <p className="cv-small cv-with__title">
                    <M>{group.title}</M>
                  </p>
                  <ul className="cv-with__people">
                    {group.people.map(([name, role]) => (
                      <li key={name} className="cv-with__person">
                        <M>
                          <span className="cv-with__name">{name}</span>
                          <span className="cv-with__role">{role}</span>
                        </M>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="cv-span cv-with__partners">
          <p className="cv-small">
            <M>Partners and hosts</M>
          </p>
          <ul className="cv-with__list">
            {PARTNERS.map((partner) => (
              <li key={partner} className="cv-text">
                <M>{partner}</M>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

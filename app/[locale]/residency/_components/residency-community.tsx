"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "./residency-community.css";

const cities = [
  { key: "newYork", timeZone: "America/New_York" },
  { key: "hanoi", timeZone: "Asia/Ho_Chi_Minh" },
  { key: "shanghai", timeZone: "Asia/Shanghai" },
  { key: "abuDhabi", timeZone: "Asia/Dubai" },
] as const;

const cityFormatters = cities.map(({ timeZone }) => ({
  time: new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }),
  zone: new Intl.DateTimeFormat("en-GB", {
    timeZone,
    timeZoneName: "shortOffset",
  }),
}));

export function ResidencyCommunity() {
  const t = useTranslations("residency.chapters");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    let minuteTimer: number | undefined;
    const initialTimer = window.setTimeout(update, 0);
    const boundaryTimer = window.setTimeout(() => {
      update();
      minuteTimer = window.setInterval(update, 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(boundaryTimer);
      window.clearInterval(minuteTimer);
    };
  }, []);

  return (
    <section
      className="residency-chapter residency-chapter--community residency-community"
      id="residency-community"
      data-nav-tone="paper"
      aria-label={t("community.title")}
    >
      <p className="community-headline" data-reveal>
        <span>{t("design.communityLine1")}</span>
        <span>{t("design.communityLine2")}</span>
      </p>

      <div className="community-introduction" data-reveal>
        <p className="community-caption">
          {t("design.communityCaption1")}
          <br />
          {t("design.communityCaption2")}
        </p>
        <p className="chapter-lead community-lead">{t("community.lead")}</p>
      </div>

      <ul className="community-times" data-reveal>
        {cities.map((city, index) => {
          const cityName = t(`community.cities.${city.key}`);
          const formatter = cityFormatters[index];
          const localTime = now ? formatter.time.format(now) : "—:—";
          const zone = now
            ? formatter.zone
                .formatToParts(now)
                .find((part) => part.type === "timeZoneName")
                ?.value.replace("GMT", "UTC")
            : "UTC";

          return (
            <li className="community-city" key={city.key}>
              <span className="community-city__name">{cityName}</span>
              <div className="community-city__local">
                <time
                  className="community-city__time"
                  dateTime={now?.toISOString()}
                  aria-label={`${cityName}: ${localTime} ${zone}`}
                >
                  {localTime}
                </time>
                <span className="community-city__zone">{zone}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="community-afterword chapter-copy" data-reveal>
        <p>{t("community.relationships")}</p>
        <p>{t("community.network")}</p>
      </div>
    </section>
  );
}

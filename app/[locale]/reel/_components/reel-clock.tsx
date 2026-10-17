"use client";

import { useEffect, useState } from "react";

const formatters = new Map<string, Intl.DateTimeFormat>();

const format = (zone: string, now: Date) => {
  let formatter = formatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(zone, formatter);
  }
  return formatter.format(now);
};

const parts = new Map<string, Intl.DateTimeFormat>();

const partsOf = (zone: string) => {
  const known = parts.get(zone);
  if (known) return known;
  const made = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });
  parts.set(zone, made);
  return made;
};

export const dialAngles = (zone: string, now: Date) => {
  const pieces = partsOf(zone).formatToParts(now);
  const read = (type: string) => Number(pieces.find((part) => part.type === type)?.value ?? 0);
  const hour = read("hour");
  const minute = read("minute");
  const second = read("second");
  return { hour: (hour + minute / 60) * 15, minute: (minute + second / 60) * 6 };
};

export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

export function Clock({ zone, now }: { zone: string; now: Date | null }) {
  const text = now ? format(zone, now) : "--:--:--";
  return (
    <span className="rl-clock" aria-label={text}>
      {text.split("").map((char, index) => (
        <span key={index} className={char === ":" ? "rl-clock__colon" : "rl-clock__digit"} aria-hidden="true">
          {char}
        </span>
      ))}
    </span>
  );
}

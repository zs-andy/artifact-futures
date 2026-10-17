"use client";

import { useEffect } from "react";

const TIMEOUT_MS = 5000;

function whenFontsReady() {
  if (document.fonts.status === "loaded") return Promise.resolve();
  return document.fonts.ready.then(() => undefined);
}

function whenImagesReady() {
  const images = [...document.images].filter((image) => image.loading !== "lazy");
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

export function Boot() {
  useEffect(() => {
    const root = document.documentElement;
    let settled = false;

    const ready = () => {
      if (settled) return;
      settled = true;
      root.dataset.boot = "ready";
    };

    const timeout = window.setTimeout(ready, TIMEOUT_MS);
    void Promise.all([whenFontsReady(), whenImagesReady()]).then(ready);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}

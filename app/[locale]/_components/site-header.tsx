"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroNav } from "./hero-nav";

export function SiteHeader({ variant }: { variant?: string }) {
  const t = useTranslations("nav");
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const syncBarHeight = () => {
      document.documentElement.style.setProperty("--hero-bar-height", `${bar.offsetHeight}px`);
    };

    syncBarHeight();
    const observer = new ResizeObserver(syncBarHeight);
    observer.observe(bar);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--hero-bar-height");
    };
  }, []);

  return (
    <header ref={barRef} className={variant ? `hero__bar hero__bar--${variant}` : "hero__bar"}>
      <Link href="/" className="hero__wordmark">
        {t("wordmark")}
      </Link>
      <HeroNav />
    </header>
  );
}

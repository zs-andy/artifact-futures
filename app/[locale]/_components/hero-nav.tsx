"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const NAV_ITEMS = [
  { key: "journal", href: "/journal" },
  { key: "residency", href: "/residency" },
  { key: "programme", href: "/programme" },
  { key: "about", href: "/about" },
] as const;

export function HeroNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="hero__toggle"
        aria-controls="hero-menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t("close") : t("menu")}
      </button>

      <nav
        id="hero-menu"
        className="hero__nav"
        data-open={open ? "true" : "false"}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="hero__link"
            onClick={() => setOpen(false)}
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
    </>
  );
}

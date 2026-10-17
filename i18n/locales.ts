export const LOCALES = ["en", "ar", "zh", "vi"] as const;

export type Locale = (typeof LOCALES)[number];

export const ACTIVE_LOCALES = ["en"] as const satisfies readonly Locale[];

export type ActiveLocale = (typeof ACTIVE_LOCALES)[number];

export const DEFAULT_LOCALE: ActiveLocale = "en";

export type LocaleConfig = {
  dir: "ltr" | "rtl";
  htmlLang: string;
  label: string;
  script: "latin" | "arabic" | "han";
};

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  en: { dir: "ltr", htmlLang: "en", label: "English", script: "latin" },
  ar: { dir: "rtl", htmlLang: "ar-AE", label: "العربية", script: "arabic" },
  zh: { dir: "ltr", htmlLang: "zh-Hans", label: "简体中文", script: "han" },
  vi: { dir: "ltr", htmlLang: "vi", label: "Tiếng Việt", script: "latin" },
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

export function isActiveLocale(value: unknown): value is ActiveLocale {
  return (
    typeof value === "string" &&
    (ACTIVE_LOCALES as readonly string[]).includes(value)
  );
}

export function localeDir(locale: Locale) {
  return LOCALE_CONFIG[locale].dir;
}

export function isRtl(locale: Locale) {
  return LOCALE_CONFIG[locale].dir === "rtl";
}

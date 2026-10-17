import { defineRouting } from "next-intl/routing";
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from "./locales";

export const routing = defineRouting({
  locales: ACTIVE_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

import type { Metadata } from "next";
import { Darker_Grotesque } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LOCALE_CONFIG } from "@/i18n/locales";
import { themeLockAttrs } from "@/lib/theme/theme";
import { routing } from "@/i18n/routing";
import { Boot } from "./_components/boot";
import { SmoothScroll } from "./_components/smooth-scroll";
import "./site.css";

const darkerGrotesque = Darker_Grotesque({
  variable: "--font-darker-grotesque",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "block",
});

export const metadata: Metadata = {
  title: {
    default: "ARTIFACT Futures",
    template: "%s | ARTIFACT Futures",
  },
  description:
    "A research-driven cultural institution with bases in New York, Hanoi, Shanghai, and Abu Dhabi.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const { dir, htmlLang } = LOCALE_CONFIG[locale];

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={`${darkerGrotesque.variable} h-full`}
      {...themeLockAttrs("light")}
    >
      <body className="flex min-h-full flex-col">
        <Boot />
        <SmoothScroll />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Cursor } from "./_components/cursor";
import { ReelBar } from "./_components/reel-bar";
import "./reel.css";
import "./site.css";

export default async function ReelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="af">
      <div className="rl" data-ink="black" data-lenis-prevent>
        <ReelBar />
        {children}
      </div>
      <Cursor />
    </div>
  );
}

import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Cursor } from "./_components/cursor";
import "./cv.css";

export default async function CvLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="cv">
      {children}
      <Cursor />
    </div>
  );
}

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Home } from "../_home/home";
import { Exhibit } from "./exhibit";
import "../home.css";
import "../folio.css";
import "./exhibit.css";

export const metadata: Metadata = { title: "Exhibition", robots: { index: false, follow: false } };

export default async function ExhibitPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ locale }, { view }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  return view === "stage" ? <Home exhibit /> : <Exhibit locale={locale} />;
}

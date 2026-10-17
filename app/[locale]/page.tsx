import { setRequestLocale } from "next-intl/server";
import { Home } from "./_home/home";
import "./home.css";
import "./folio.css";

export default async function LocaleIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Home />;
}

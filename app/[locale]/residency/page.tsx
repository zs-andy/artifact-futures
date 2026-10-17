import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResidencyView } from "./_components/residency-view";

export const metadata: Metadata = {
  title: "Residency",
};

export default async function ResidencyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("residency");

  return (
    <ResidencyView
      slogan={t.raw("slogan") as string[]}
      title={t("sectionTitle")}
      statement={t("statement")}
      statementHeading={t("statementHeading")}
      followUp={t.raw("followUp") as string[]}
    />
  );
}

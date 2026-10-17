import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Cv } from "./_components/cv";

export const metadata: Metadata = {
  title: "Curriculum Vitae",
};

export default async function CvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Cv />;
}

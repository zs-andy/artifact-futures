import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Loader } from "./_components/loader";
import { ReelHome } from "./_components/reel-home";

export const metadata: Metadata = {
  title: "ARTIFACT Futures",
};

export default async function ReelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Loader />
      <ReelHome />
    </>
  );
}

import { redirect } from "@/i18n/navigation";

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/journal/issues/issue-02", locale });
}

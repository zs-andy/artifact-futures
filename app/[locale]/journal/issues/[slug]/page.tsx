import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { IssueReader } from "../../_components/reader/issue-reader";
import { resolveIssueAssets } from "../../_lib/issue-assets";
import { ISSUE_01 } from "../../_lib/issues/issue-01";
import { ISSUE_02 } from "../../_lib/issues/issue-02";

const ISSUES = [ISSUE_01, ISSUE_02];
const issueOf = (slug: string) => ISSUES.find((issue) => issue.slug === slug);

export const dynamicParams = false;

export function generateStaticParams() {
  return ISSUES.map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const issue = issueOf((await params).slug);
  return {
    title: issue ? `Issue ${String(issue.number).padStart(2, "0")}` : "Issue",
  };
}

export default async function IssueReaderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const issue = issueOf(slug);
  if (!issue) notFound();
  return <IssueReader issue={resolveIssueAssets(issue)} />;
}

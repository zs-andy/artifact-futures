import { asset } from "@/lib/assets";
import imageUrls from "./reader-image-urls.json";
import type { IssueArticle, IssueText } from "./issue-text";

const published: Record<string, string> = imageUrls;

export function resolveIssueAssets(issue: IssueText): IssueText {
  const resolveArticle = (article: IssueArticle): IssueArticle => ({
    ...article,
    images: article.images.map((image) => {
      const url = published[image.src];
      return { ...image, src: url ? asset(new URL(url).pathname) : image.src };
    }),
  });
  return {
    ...issue,
    editorial: resolveArticle(issue.editorial),
    articles: issue.articles.map(resolveArticle),
  };
}

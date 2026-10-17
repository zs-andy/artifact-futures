import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function SiteNotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-medium">{t("title")}</h1>
      <Link className="underline underline-offset-4" href="/">
        {t("backHome")}
      </Link>
    </main>
  );
}

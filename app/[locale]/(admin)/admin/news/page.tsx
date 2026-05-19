import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n.config";
import {
  AdminContentEmptyHint,
} from "@/features/admin/components/content-management-forms";
import { NewsManagement } from "@/features/admin/components/news-management";
import {
  getAdminCompanies,
  getAdminNewsArticles,
  getAdminProducts,
} from "@/lib/industry-platform";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.news" });
  const [articles, products, companies] = await Promise.all([
    getAdminNewsArticles(),
    getAdminProducts(),
    getAdminCompanies(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <AdminContentEmptyHint />
      <NewsManagement
        articles={articles}
        products={products}
        companies={companies}
        locale={locale}
      />
    </div>
  );
}

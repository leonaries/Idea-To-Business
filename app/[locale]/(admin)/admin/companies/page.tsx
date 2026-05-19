import {
  AdminContentEmptyHint,
  CompaniesManagement,
} from "@/features/admin/components/content-management-forms";
import { getAdminCompanies } from "@/lib/industry-platform";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "zh" }>;
}) {
  const { locale } = await params;
  const companies = await getAdminCompanies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">企业管理</h1>
        <p className="text-sm text-muted-foreground">
          维护企业库资料、发布状态和企业基础信息，公开企业库只展示已发布企业。
        </p>
      </div>
      <AdminContentEmptyHint />
      <CompaniesManagement companies={companies} locale={locale} />
    </div>
  );
}

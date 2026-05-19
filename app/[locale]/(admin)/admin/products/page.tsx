import {
  AdminContentEmptyHint,
  ProductsManagement,
} from "@/features/admin/components/content-management-forms";
import {
  getAdminCompanyOptions,
  getAdminProducts,
} from "@/lib/industry-platform";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "zh" }>;
}) {
  const { locale } = await params;
  const [products, companyOptions] = await Promise.all([
    getAdminProducts(),
    getAdminCompanyOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">产品管理</h1>
        <p className="text-sm text-muted-foreground">
          维护产品目录资料、所属企业、预算区间和发布状态，公开产品目录只展示已发布产品。
        </p>
      </div>
      <AdminContentEmptyHint />
      <ProductsManagement products={products} companyOptions={companyOptions} locale={locale} />
    </div>
  );
}

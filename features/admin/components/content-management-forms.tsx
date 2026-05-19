"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import {
  companyTypes,
  contentStatuses,
  fundingStages,
  priceRanges,
  productCapabilities,
  productCategories,
  productIndustries,
  type AdminCompanyListItem,
  type AdminProductListItem,
} from "@/lib/industry-shared";
import type { Locale } from "@/i18n.config";

type CompanyOption = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

interface CompaniesManagementProps {
  companies: AdminCompanyListItem[];
  locale: Locale;
}

interface ProductsManagementProps {
  products: AdminProductListItem[];
  companyOptions: CompanyOption[];
  locale: Locale;
}

const inputClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
const textareaClass =
  "w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
const selectClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring";

type StatusFilter = "all" | "published" | "draft";
type ProductSort = "updated" | "popular" | "name";
type CompanySort = "updated" | "products" | "name";

const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "published", label: "已发布" },
  { value: "draft", label: "草稿" },
];

const productSortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: "updated", label: "最近更新" },
  { value: "popular", label: "热度优先" },
  { value: "name", label: "名称排序" },
];

const companySortOptions: Array<{ value: CompanySort; label: string }> = [
  { value: "updated", label: "最近更新" },
  { value: "products", label: "产品数优先" },
  { value: "name", label: "名称排序" },
];

function csv(value: string[]) {
  return value.join(", ");
}

function recordText(value: Record<string, string>) {
  return Object.entries(value).map(([key, recordValue]) => `${key}: ${recordValue}`).join("\n");
}

function statusLabel(status: string) {
  return status === "published" ? "已发布" : "草稿";
}

function statusPill(status: string) {
  return status === "published"
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
    : "bg-secondary text-muted-foreground";
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(parts: Array<string | null | undefined>, query: string) {
  if (!query) {
    return true;
  }

  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function localizedPath(locale: Locale, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? normalizedPath : `/${locale}${normalizedPath}`;
}

function SummaryStat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/70 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

type QualityTone = "good" | "warning" | "critical";

type QualityCheck = {
  label: string;
  present: boolean;
};

type ContentQuality = {
  filled: number;
  missing: string[];
  score: number;
  total: number;
  tone: QualityTone;
};

const qualityToneClasses: Record<QualityTone, { badge: string; bar: string }> = {
  good: {
    badge:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
    bar: "bg-green-500",
  },
  warning: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  critical: {
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    bar: "bg-rose-500",
  },
};

function resolveQuality(checks: QualityCheck[]): ContentQuality {
  const missing = checks.filter(check => !check.present).map(check => check.label);
  const total = checks.length;
  const filled = total - missing.length;
  const score = total === 0 ? 0 : Math.round((filled / total) * 100);

  let tone: QualityTone = "critical";
  if (score >= 85) {
    tone = "good";
  } else if (score >= 60) {
    tone = "warning";
  }

  return {
    filled,
    missing,
    score,
    total,
    tone,
  };
}

function getCompanyQuality(company: AdminCompanyListItem) {
  return resolveQuality([
    { label: "Logo", present: Boolean(company.logo) },
    { label: "一句话介绍", present: Boolean(company.tagline) },
    { label: "企业介绍", present: Boolean(company.description) },
    { label: "地区", present: Boolean(company.country || company.city) },
    { label: "业务领域", present: company.domains.length > 0 },
    { label: "官网", present: Boolean(company.website) },
    { label: "标签", present: company.tags.length > 0 },
  ]);
}

function getProductQuality(product: AdminProductListItem) {
  return resolveQuality([
    { label: "封面图", present: Boolean(product.coverImage || product.images.length > 0) },
    { label: "所属企业", present: Boolean(product.companyId || product.companyName) },
    { label: "产品描述", present: Boolean(product.description) },
    { label: "应用行业", present: product.industries.length > 0 },
    { label: "核心能力", present: product.capabilities.length > 0 },
    { label: "参数", present: Object.keys(product.specs).length > 0 },
    { label: "官网", present: Boolean(product.officialUrl) },
    { label: "标签", present: product.tags.length > 0 },
  ]);
}

function ContentThumbnail({
  image,
  label,
  className,
  fallback,
  imageClassName = "bg-cover bg-center",
}: {
  image: string | null | undefined;
  label: string;
  className: string;
  fallback: ReactNode;
  imageClassName?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative shrink-0 overflow-hidden border border-border bg-secondary", className)}
    >
      {image ? (
        <>
          <div
            className={cn("absolute inset-0", imageClassName)}
            style={{ backgroundImage: `url("${image}")` }}
          />
          <div className="absolute inset-0 bg-black/5" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {fallback}
        </div>
      )}
    </div>
  );
}

function QualityMeter({
  quality,
}: {
  quality: ContentQuality;
}) {
  const toneClasses = qualityToneClasses[quality.tone];
  const visibleMissing = quality.missing.slice(0, 2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">内容完整度</span>
        <span className={cn("inline-flex rounded-full border px-2 py-1 text-[11px] font-medium", toneClasses.badge)}>
          {quality.filled}/{quality.total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", toneClasses.bar)}
          style={{ width: `${quality.score}%` }}
        />
      </div>
      {quality.missing.length === 0 ? (
        <span className={cn("inline-flex rounded-full border px-2 py-1 text-[11px] font-medium", toneClasses.badge)}>
          资料齐全
        </span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visibleMissing.map(item => (
            <span
              key={item}
              className={cn("inline-flex rounded-full border px-2 py-1 text-[11px] font-medium", toneClasses.badge)}
            >
              {item}
            </span>
          ))}
          {quality.missing.length > visibleMissing.length ? (
            <span className="inline-flex rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
              +{quality.missing.length - visibleMissing.length}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CompanyPreview({ company }: { company: AdminCompanyListItem }) {
  return (
    <div className="flex items-start gap-3">
      <ContentThumbnail
        image={company.logo}
        label={company.name}
        className="flex h-12 w-12 items-center justify-center rounded-lg"
        fallback={<span className="text-base font-semibold text-foreground">{company.name.slice(0, 1)}</span>}
        imageClassName="bg-contain bg-center bg-no-repeat"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{company.name}</div>
        <div className="mt-1 break-all text-xs text-muted-foreground">{company.slug}</div>
        <div className="mt-2 line-clamp-2 max-w-md text-xs leading-5 text-muted-foreground">
          {company.tagline || company.description || "-"}
        </div>
      </div>
    </div>
  );
}

function ProductPreview({ product }: { product: AdminProductListItem }) {
  return (
    <div className="flex items-start gap-3">
      <ContentThumbnail
        image={product.coverImage}
        label={product.name}
        className="flex h-14 w-20 items-center justify-center rounded-xl"
        fallback={<PackagePlus className="h-5 w-5" />}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{product.name}</div>
        <div className="mt-1 break-all text-xs text-muted-foreground">{product.slug}</div>
        <div className="mt-2 line-clamp-2 max-w-md text-xs leading-5 text-muted-foreground">
          {product.description || "-"}
        </div>
      </div>
    </div>
  );
}

export function CompaniesManagement({ companies: initialCompanies, locale }: CompaniesManagementProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState(initialCompanies);
  const [editingCompany, setEditingCompany] = useState<AdminCompanyListItem | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<CompanySort>("updated");

  useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  const visibleCompanies = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);
    return [...companies]
      .filter(item => {
        const statusMatches = statusFilter === "all" || item.status === statusFilter;
        const queryMatches = matchesQuery(
          [
            item.name,
            item.slug,
            item.type,
            item.tagline,
            item.description,
            item.country,
            item.city,
            ...item.domains,
            ...item.tags,
          ],
          normalizedQuery,
        );

        return statusMatches && queryMatches;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name, "zh-Hans-CN");
        }

        if (sortBy === "products") {
          return b.productCount - a.productCount || b.updatedAt.getTime() - a.updatedAt.getTime();
        }

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }, [companies, query, sortBy, statusFilter]);

  const summary = useMemo(() => {
    const published = companies.filter(item => item.status === "published").length;
    const draft = companies.length - published;
    const productCount = companies.reduce((total, item) => total + item.productCount, 0);
    const needsWork = companies.filter(item => getCompanyQuality(item).missing.length > 0).length;

    return {
      total: companies.length,
      published,
      draft,
      productCount,
      needsWork,
      visible: visibleCompanies.length,
    };
  }, [companies, visibleCompanies.length]);

  async function handleSaved() {
    setEditingCompany(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                内容工作台
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">企业管理</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                先快速定位企业，再进入弹窗分区补充基础信息、地区、标签、社交链接和发布状态。
              </p>
            </div>
            <Button type="button" className="h-10 gap-2 rounded-md" onClick={() => setEditingCompany("new")}>
              <Plus className="h-4 w-4" />
              新增企业
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryStat label="企业总数" value={summary.total} detail={`${summary.visible} 条匹配`} />
            <SummaryStat label="已发布" value={summary.published} detail="公开企业库可见" />
            <SummaryStat label="草稿" value={summary.draft} detail="仅后台可见" />
            <SummaryStat label="关联产品" value={summary.productCount} detail="企业下挂产品总数" />
            <SummaryStat label="需补资料" value={summary.needsWork} detail="Logo / 介绍 / 官网等" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4 text-muted-foreground" />
            快速筛选
          </div>
          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索企业名称、类型、地点、标签..."
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {statusFilterOptions.map(option => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={statusFilter === option.value ? "primary" : "outline"}
                className="rounded-md"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">排序</span>
              <select value={sortBy} onChange={event => setSortBy(event.target.value as CompanySort)} className={selectClass}>
                {companySortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-border bg-secondary/70 p-3">
              <p className="text-xs text-muted-foreground">当前匹配</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{summary.visible} 条</p>
              <p className="mt-1 text-xs text-muted-foreground">点击“编辑”进入分区表单。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead className="bg-secondary">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">企业</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">类型</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">地区</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">产品数</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">资料完整度</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">更新时间</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleCompanies.map(item => {
                const quality = getCompanyQuality(item);

                return (
                  <tr key={item.id} className="hover:bg-hover">
                    <td className="px-5 py-4 align-top">
                      <CompanyPreview company={item} />
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">{item.type}</td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                      {[item.country, item.city].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">{item.productCount}</td>
                    <td className="w-[190px] px-5 py-4 align-top">
                      <QualityMeter quality={quality} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-xs text-muted-foreground">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          as={Link}
                          href={localizedPath(locale, `/companies/${item.slug}`)}
                          target="_blank"
                          rel="noreferrer"
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-md"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          预览
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-md" onClick={() => setEditingCompany(item)}>
                          <Edit3 className="h-3.5 w-3.5" />
                          编辑
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    暂无企业记录。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editingCompany ? (
        <CompanyModal
          locale={locale}
          company={editingCompany === "new" ? null : editingCompany}
          onClose={() => setEditingCompany(null)}
          onSaved={handleSaved}
          onOptimisticUpdate={nextCompany => {
            if (editingCompany === "new") {
              return;
            }

            setCompanies(current => current.map(item => (item.id === nextCompany.id ? nextCompany : item)));
          }}
        />
      ) : null}
    </div>
  );
}

export function ProductsManagement({ products: initialProducts, companyOptions, locale }: ProductsManagementProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editingProduct, setEditingProduct] = useState<AdminProductListItem | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<ProductSort>("updated");

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);
    return [...products]
      .filter(item => {
        const statusMatches = statusFilter === "all" || item.publishStatus === statusFilter;
        const queryMatches = matchesQuery(
          [
            item.name,
            item.slug,
            item.companyName,
            item.category,
            item.subCategory,
            item.description,
            ...item.industries,
            ...item.capabilities,
            ...item.tags,
          ],
          normalizedQuery,
        );

        return statusMatches && queryMatches;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name, "zh-Hans-CN");
        }

        if (sortBy === "popular") {
          return b.popularity - a.popularity || b.updatedAt.getTime() - a.updatedAt.getTime();
        }

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }, [products, query, sortBy, statusFilter]);

  const summary = useMemo(() => {
    const published = products.filter(item => item.publishStatus === "published").length;
    const draft = products.length - published;
    const linkedCompany = products.filter(item => Boolean(item.companyId)).length;
    const needsWork = products.filter(item => getProductQuality(item).missing.length > 0).length;

    return {
      total: products.length,
      published,
      draft,
      linkedCompany,
      needsWork,
      visible: visibleProducts.length,
    };
  }, [products, visibleProducts.length]);

  async function handleSaved() {
    setEditingProduct(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <PackagePlus className="h-3.5 w-3.5" />
                内容工作台
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">产品管理</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                先快速定位产品，再进入弹窗分区补充所属企业、分类、预算、图片、标签和参数。
              </p>
            </div>
            <Button type="button" className="h-10 gap-2 rounded-md" onClick={() => setEditingProduct("new")}>
              <Plus className="h-4 w-4" />
              新增产品
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryStat label="产品总数" value={summary.total} detail={`${summary.visible} 条匹配`} />
            <SummaryStat label="已发布" value={summary.published} detail="公开产品目录可见" />
            <SummaryStat label="草稿" value={summary.draft} detail="仅后台可见" />
            <SummaryStat label="关联企业" value={summary.linkedCompany} detail="已有企业归属" />
            <SummaryStat label="需补资料" value={summary.needsWork} detail="封面 / 参数 / 官网等" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4 text-muted-foreground" />
            快速筛选
          </div>
          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索产品、slug、企业、能力或标签..."
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {statusFilterOptions.map(option => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={statusFilter === option.value ? "primary" : "outline"}
                className="rounded-md"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">排序</span>
              <select value={sortBy} onChange={event => setSortBy(event.target.value as ProductSort)} className={selectClass}>
                {productSortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-border bg-secondary/70 p-3">
              <p className="text-xs text-muted-foreground">当前匹配</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{summary.visible} 条</p>
              <p className="mt-1 text-xs text-muted-foreground">预览按钮可直接打开公开页。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-secondary">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">产品</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">企业</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">类型</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">预算</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">热度</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">资料完整度</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleProducts.map(item => {
                const quality = getProductQuality(item);

                return (
                  <tr key={item.id} className="hover:bg-hover">
                    <td className="px-5 py-4 align-top">
                      <ProductPreview product={item} />
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">{item.companyName || "-"}</td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                      {item.category}{item.subCategory ? ` / ${item.subCategory}` : ""}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">{item.priceRange || "-"}</td>
                    <td className="px-5 py-4 align-top text-sm text-muted-foreground">{item.popularity}</td>
                    <td className="w-[190px] px-5 py-4 align-top">
                      <QualityMeter quality={quality} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(item.publishStatus)}`}>
                        {statusLabel(item.publishStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          as={Link}
                          href={localizedPath(locale, `/products/${item.slug}`)}
                          target="_blank"
                          rel="noreferrer"
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-md"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          预览
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-md" onClick={() => setEditingProduct(item)}>
                          <Edit3 className="h-3.5 w-3.5" />
                          编辑
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    暂无产品记录。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct ? (
        <ProductModal
          locale={locale}
          product={editingProduct === "new" ? null : editingProduct}
          companyOptions={companyOptions}
          onClose={() => setEditingProduct(null)}
          onSaved={handleSaved}
          onOptimisticUpdate={nextProduct => {
            if (editingProduct === "new") {
              return;
            }

            setProducts(current => current.map(item => (item.id === nextProduct.id ? nextProduct : item)));
          }}
        />
      ) : null}
    </div>
  );
}

function CompanyModal({
  company,
  locale,
  onClose,
  onSaved,
  onOptimisticUpdate,
}: {
  company: AdminCompanyListItem | null;
  locale: Locale;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onOptimisticUpdate: (company: AdminCompanyListItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const previewHref = company ? localizedPath(locale, `/companies/${company.slug}`) : "";
  const statusText = company ? statusLabel(company.status) : "新建企业";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(company ? `/api/admin/companies/${company.id}` : "/api/admin/companies", {
        method: company ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      if (company) {
        onOptimisticUpdate({
          ...company,
          slug: String(payload.slug || company.slug),
          name: String(payload.name || company.name),
          logo: String(payload.logo || "") || null,
          tagline: String(payload.tagline || "") || null,
          description: String(payload.description || "") || null,
          type: String(payload.type || company.type),
          country: String(payload.country || "") || null,
          city: String(payload.city || "") || null,
          employeeRange: String(payload.employeeRange || "") || null,
          fundingStage: String(payload.fundingStage || "") || null,
          totalFunding: String(payload.totalFunding || "") || null,
          website: String(payload.website || "") || null,
          status: String(payload.status || company.status),
          updatedAt: new Date(),
        });
      }

      toast.success(company ? "企业已更新" : "企业已创建");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={company ? "编辑企业" : "新增企业"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <section className="space-y-5">
            <FormSection title="基础信息" icon={<FileText className="h-4 w-4" />} description="先把名称、Slug 和发布状态定下来。">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="name" label="企业名称" defaultValue={company?.name} required />
                <Field name="slug" label="Slug" defaultValue={company?.slug} required />
                <SelectField name="type" label="企业类型" defaultValue={company?.type || "硬件厂商"} options={companyTypes} />
                <SelectField name="status" label="发布状态" defaultValue={company?.status || "published"} options={contentStatuses} labels={{ published: "已发布", draft: "草稿" }} />
              </div>
            </FormSection>

            <FormSection title="地区与资质" icon={<Globe className="h-4 w-4" />} description="用于企业检索和供应商地图。">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="country" label="国家" defaultValue={company?.country ?? ""} />
                <Field name="city" label="城市" defaultValue={company?.city ?? ""} />
                <Field name="employeeRange" label="员工规模" defaultValue={company?.employeeRange ?? ""} placeholder="例如：200-1000" />
                <SelectField name="fundingStage" label="融资阶段" defaultValue={company?.fundingStage ?? ""} options={fundingStages} includeEmpty="暂不填写" />
                <Field name="foundedYear" label="成立年份" type="number" defaultValue={company?.foundedYear ?? ""} />
                <Field name="totalFunding" label="融资总额" defaultValue={company?.totalFunding ?? ""} />
              </div>
            </FormSection>

            <FormSection title="内容展示" icon={<Tag className="h-4 w-4" />} description="这些内容会直接影响公开页的第一屏印象。">
              <div className="space-y-4">
                <Field name="tagline" label="一句话介绍" defaultValue={company?.tagline ?? ""} />
                <TextareaField name="description" label="企业介绍" defaultValue={company?.description ?? ""} rows={5} />
                <TextareaField name="domains" label="业务领域" defaultValue={company ? csv(company.domains) : ""} placeholder="人形机器人, 运动控制, 工业服务" />
                <TextareaField name="tags" label="标签" defaultValue={company ? csv(company.tags) : ""} placeholder="具身智能, 机器人本体" />
              </div>
            </FormSection>

            <FormSection title="链接与扩展" icon={<ExternalLink className="h-4 w-4" />} description="官网与社交链接用于建立外部跳转。">
              <div className="space-y-4">
                <Field name="website" label="官网" defaultValue={company?.website ?? ""} />
                <Field name="logo" label="Logo URL" defaultValue={company?.logo ?? ""} />
                <TextareaField name="socialLinks" label="社交链接" defaultValue={company ? recordText(company.socialLinks) : ""} placeholder={"twitter: https://...\nlinkedin: https://..."} />
              </div>
            </FormSection>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">当前状态</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{statusText}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {company?.slug ? "保存后会同步到公开企业库。" : "创建后可立刻预览公开页。"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">操作</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                保存后系统会自动刷新本地列表，公开页也会读取最新数据。
              </p>
              {company ? (
                <Button
                  as={Link}
                  href={previewHref}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  className="mt-4 w-full gap-2 rounded-md"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  打开公开页
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </ModalShell>
  );
}

function ProductModal({
  product,
  companyOptions,
  locale,
  onClose,
  onSaved,
  onOptimisticUpdate,
}: {
  product: AdminProductListItem | null;
  companyOptions: CompanyOption[];
  locale: Locale;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onOptimisticUpdate: (product: AdminProductListItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const previewHref = product ? localizedPath(locale, `/products/${product.slug}`) : "";
  const selectedCompany = product?.companySlug ? companyOptions.find(item => item.slug === product.companySlug) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      if (product) {
        const selectedCompany = companyOptions.find(item => item.id === String(payload.companyId));
        onOptimisticUpdate({
          ...product,
          slug: String(payload.slug || product.slug),
          name: String(payload.name || product.name),
          coverImage: String(payload.coverImage || "") || null,
          companyId: String(payload.companyId || "") || null,
          companyName: selectedCompany?.name ?? null,
          companySlug: selectedCompany?.slug ?? null,
          category: String(payload.category || product.category),
          subCategory: String(payload.subCategory || "") || null,
          priceRange: String(payload.priceRange || "") || null,
          description: String(payload.description || "") || null,
          officialUrl: String(payload.officialUrl || "") || null,
          lifecycleStatus: String(payload.lifecycleStatus || product.lifecycleStatus),
          publishStatus: String(payload.publishStatus || product.publishStatus),
          popularity: Number(payload.popularity || product.popularity),
          updatedAt: new Date(),
        });
      }

      toast.success(product ? "产品已更新" : "产品已创建");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={product ? "编辑产品" : "新增产品"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <section className="space-y-5">
            <FormSection title="基础信息" icon={<FileText className="h-4 w-4" />} description="产品名称、Slug 和公开状态先定下来。">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="name" label="产品名称" defaultValue={product?.name} required />
                <Field name="slug" label="Slug" defaultValue={product?.slug} required />
                <SelectField name="publishStatus" label="发布状态" defaultValue={product?.publishStatus || "published"} options={contentStatuses} labels={{ published: "已发布", draft: "草稿" }} />
                <Field name="lifecycleStatus" label="生命周期状态" defaultValue={product?.lifecycleStatus || "available"} />
              </div>
            </FormSection>

            <FormSection title="分类与归属" icon={<Tag className="h-4 w-4" />} description="用于目录检索、详情关联和供应商归类。">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  name="companyId"
                  label="所属企业"
                  defaultValue={product?.companyId ?? ""}
                  includeEmpty="暂不关联"
                  options={companyOptions.map(item => item.id)}
                  labels={Object.fromEntries(companyOptions.map(item => [item.id, item.name]))}
                />
                <SelectField name="category" label="产品类型" defaultValue={product?.category || "机器人"} options={productCategories} />
                <Field name="subCategory" label="子类型" defaultValue={product?.subCategory ?? ""} placeholder="例如：人形 / 四足 / 机器视觉" />
                <SelectField name="priceRange" label="预算范围" defaultValue={product?.priceRange ?? ""} includeEmpty="暂不填写" options={priceRanges} />
                <Field name="popularity" label="热度" type="number" defaultValue={product?.popularity ?? 0} />
                <Field name="officialUrl" label="官网链接" defaultValue={product?.officialUrl ?? ""} />
              </div>
            </FormSection>

            <FormSection title="展示内容" icon={<Sparkles className="h-4 w-4" />} description="公开页重点看这里。">
              <div className="space-y-4">
                <TextareaField name="description" label="产品描述" defaultValue={product?.description ?? ""} rows={5} />
                <TextareaField name="industries" label="应用行业" defaultValue={product ? csv(product.industries) : ""} placeholder={productIndustries.join(", ")} />
                <TextareaField name="capabilities" label="核心能力" defaultValue={product ? csv(product.capabilities) : ""} placeholder={productCapabilities.join(", ")} />
                <TextareaField name="tags" label="标签" defaultValue={product ? csv(product.tags) : ""} placeholder="人形机器人, 通用平台, 具身智能" />
              </div>
            </FormSection>

            <FormSection title="图片与参数" icon={<Globe className="h-4 w-4" />} description="封面、图片集和结构化参数。">
              <div className="space-y-4">
                <Field name="coverImage" label="封面图 URL" defaultValue={product?.coverImage ?? ""} />
                <TextareaField name="images" label="图片列表" defaultValue={product ? csv(product.images) : ""} placeholder="/starter/sample.png, /starter/demo/images/..." />
                <TextareaField name="specs" label="产品参数" defaultValue={product ? recordText(product.specs) : ""} placeholder={"高度: 约 170cm\n负载: 按项目配置"} />
              </div>
            </FormSection>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">当前状态</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{product ? statusLabel(product.publishStatus) : "新建产品"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedCompany ? `当前关联：${selectedCompany.name}` : "尚未关联企业。"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">操作</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                保存后会刷新后台列表，公开产品目录也会跟着更新。
              </p>
              {product ? (
                <Button
                  as={Link}
                  href={previewHref}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  className="mt-4 w-full gap-2 rounded-md"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  打开公开页
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-border bg-muted p-5 shadow-2xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-border bg-background p-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              保存后，公开页面会按发布状态自动展示或隐藏；草稿不会进入公开目录。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, saving }: { onClose: () => void; saving: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
        取消
      </Button>
      <Button type="submit" className="rounded-md" disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </Button>
    </div>
  );
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 text-muted-foreground">{icon}</div> : null}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  includeEmpty,
  labels,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: readonly string[];
  includeEmpty?: string;
  labels?: Record<string, string>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={selectClass}>
        {includeEmpty ? <option value="">{includeEmpty}</option> : null}
        {options.map(option => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className={textareaClass}
      />
    </label>
  );
}

export function AdminContentEmptyHint() {
  return (
    <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
      本地未配置数据库时，这里会展示示例数据；配置 `DATABASE_URL` 并迁移数据库后即可保存真实内容。
      <Link href="/zh/docs" className="ml-2 inline-flex items-center gap-1 font-medium text-foreground hover:underline">
        查看文档
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Edit3,
  FileText,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import type { Locale } from "@/i18n.config";
import {
  contentStatuses,
  newsCategories,
  type AdminCompanyListItem,
  type AdminNewsArticleListItem,
  type AdminProductListItem,
} from "@/lib/industry-shared";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "published" | "draft";
type NewsSort = "updated" | "hot";

interface NewsManagementProps {
  articles: AdminNewsArticleListItem[];
  products: AdminProductListItem[];
  companies: AdminCompanyListItem[];
  locale: Locale;
}

const inputClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
const textareaClass =
  "w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
const selectClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring";

function localizedPath(locale: Locale, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? normalizedPath : `/${locale}${normalizedPath}`;
}

function csv(value: string[]) {
  return value.join(", ");
}

function statusLabel(status: string) {
  return status === "published" ? "已发布" : "草稿";
}

function statusPill(status: string) {
  return status === "published"
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
    : "bg-secondary text-muted-foreground";
}

function dateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(parts: Array<string | null | undefined>, query: string) {
  if (!query) {
    return true;
  }

  return parts.filter(Boolean).join(" ").toLowerCase().includes(query);
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

function ArticlePreview({ article }: { article: AdminNewsArticleListItem }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary bg-cover bg-center"
        style={article.coverImage ? { backgroundImage: `url("${article.coverImage}")` } : undefined}
      >
        {article.coverImage ? <div className="absolute inset-0 bg-black/5" /> : <Newspaper className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-medium leading-5 text-foreground">{article.title}</div>
        <div className="mt-1 break-all text-xs text-muted-foreground">{article.slug}</div>
        <div className="mt-2 line-clamp-2 max-w-md text-xs leading-5 text-muted-foreground">
          {article.summary}
        </div>
      </div>
    </div>
  );
}

function getArticleQuality(article: AdminNewsArticleListItem) {
  const checks = [
    Boolean(article.coverImage),
    Boolean(article.summary),
    Boolean(article.content),
    article.tags.length > 0,
    article.relatedProductIds.length > 0,
    article.relatedCompanyIds.length > 0,
    Boolean(article.sourceName || article.sourceUrl),
  ];

  return checks.filter(Boolean).length;
}

export function NewsManagement({
  articles: initialArticles,
  products,
  companies,
  locale,
}: NewsManagementProps) {
  const router = useRouter();
  const t = useTranslations("Admin.news");
  const [articles, setArticles] = useState(initialArticles);
  const [editingArticle, setEditingArticle] = useState<AdminNewsArticleListItem | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [importQuery, setImportQuery] = useState("具身智能 人形机器人 机器人 融资 应用");
  const [importCount, setImportCount] = useState(5);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<NewsSort>("updated");

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const visibleArticles = useMemo(() => {
    const normalizedQuery = normalizeQuery(query);

    return [...articles]
      .filter(article => {
        const statusMatches = statusFilter === "all" || article.publishStatus === statusFilter;
        const queryMatches = matchesQuery(
          [
            article.title,
            article.slug,
            article.summary,
            article.content,
            article.category,
            article.sourceName,
            ...article.tags,
          ],
          normalizedQuery,
        );

        return statusMatches && queryMatches;
      })
      .sort((a, b) => {
        if (sortBy === "hot") {
          return b.hotScore - a.hotScore || b.updatedAt.getTime() - a.updatedAt.getTime();
        }

        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  }, [articles, query, sortBy, statusFilter]);

  const summary = useMemo(() => {
    const published = articles.filter(item => item.publishStatus === "published").length;
    const draft = articles.length - published;
    const linkedProducts = articles.reduce((total, item) => total + item.relatedProductIds.length, 0);
    const linkedCompanies = articles.reduce((total, item) => total + item.relatedCompanyIds.length, 0);
    const needsWork = articles.filter(item => getArticleQuality(item) < 5).length;

    return {
      total: articles.length,
      published,
      draft,
      linkedProducts,
      linkedCompanies,
      needsWork,
      visible: visibleArticles.length,
    };
  }, [articles, visibleArticles.length]);

  async function handleSaved() {
    setEditingArticle(null);
    router.refresh();
  }

  async function handleImportHotNews() {
    setImporting(true);

    try {
      const response = await fetch("/api/admin/news/import-tavily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: importQuery.trim() || "具身智能 人形机器人 机器人 融资 应用",
          maxResults: importCount,
          publishStatus: "published",
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        importedCount?: number;
        updatedCount?: number;
      };

      if (!response.ok) {
        throw new Error(data.error || "导入热点资讯失败");
      }

      toast.success(`已导入 ${data.importedCount ?? 0} 条热点资讯`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导入热点资讯失败，请稍后重试");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                <Newspaper className="h-3.5 w-3.5" />
                {t("title")}
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{t("title")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("description")}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 rounded-md"
                onClick={handleImportHotNews}
                disabled={importing}
              >
                <Sparkles className="h-4 w-4" />
                {importing ? t("importing") : t("importHotNews")}
              </Button>
              <Button type="button" className="h-10 gap-2 rounded-md" onClick={() => setEditingArticle("new")}>
                <Plus className="h-4 w-4" />
                {t("newArticle")}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryStat label={t("totalArticles")} value={summary.total} detail={`${summary.visible} 条匹配`} />
            <SummaryStat label={t("published")} value={summary.published} detail="公开资讯可见" />
            <SummaryStat label={t("draft")} value={summary.draft} detail="仅后台可见" />
            <SummaryStat label={t("linkedProducts")} value={summary.linkedProducts} detail="产品导流入口" />
            <SummaryStat label={t("linkedCompanies")} value={summary.linkedCompanies} detail="企业导流入口" />
            <SummaryStat label={t("needsWork")} value={summary.needsWork} detail="封面 / 来源 / 关联" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4 text-muted-foreground" />
            {t("searchAction")}
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className={`${inputClass} pr-9`}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">{t("importQuery")}</span>
              <input
                value={importQuery}
                onChange={event => setImportQuery(event.target.value)}
                placeholder={t("importQueryPlaceholder")}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">{t("importCount")}</span>
              <select
                value={importCount}
                onChange={event => setImportCount(Number(event.target.value))}
                className={selectClass}
              >
                {[3, 5, 8, 10].map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { value: "all", label: t("allStatus") },
              { value: "published", label: t("statusPublished") },
              { value: "draft", label: t("statusDraft") },
            ].map(option => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={statusFilter === option.value ? "primary" : "outline"}
                className="rounded-md"
                onClick={() => setStatusFilter(option.value as StatusFilter)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-foreground">{t("sortLabel")}</span>
            <select value={sortBy} onChange={event => setSortBy(event.target.value as NewsSort)} className={selectClass}>
              <option value="updated">{t("sortLatest")}</option>
              <option value="hot">{t("sortHot")}</option>
            </select>
          </label>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("importHint")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-secondary">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">资讯</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">分类</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">来源</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">关联</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">热度</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">发布时间</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleArticles.map(article => (
                <tr key={article.id} className="hover:bg-hover">
                  <td className="px-5 py-4 align-top">
                    <ArticlePreview article={article} />
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-muted-foreground">{article.category}</td>
                  <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                    {article.sourceName || "-"}
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                    {article.relatedProductIds.length} 产品 / {article.relatedCompanyIds.length} 企业
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-muted-foreground">{article.hotScore}</td>
                  <td className="px-5 py-4 align-top">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(article.publishStatus)}`}>
                      {statusLabel(article.publishStatus)}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-xs text-muted-foreground">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleString() : "-"}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        as={Link}
                        href={localizedPath(locale, `/news/${article.slug}`)}
                        target="_blank"
                        rel="noreferrer"
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-md"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        {t("preview")}
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2 rounded-md" onClick={() => setEditingArticle(article)}>
                        <Edit3 className="h-3.5 w-3.5" />
                        {t("edit")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleArticles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {t("emptyState")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editingArticle ? (
        <NewsModal
          article={editingArticle === "new" ? null : editingArticle}
          products={products}
          companies={companies}
          locale={locale}
          onClose={() => setEditingArticle(null)}
          onSaved={handleSaved}
          onOptimisticUpdate={nextArticle => {
            if (editingArticle === "new") {
              return;
            }

            setArticles(current => current.map(item => (item.id === nextArticle.id ? nextArticle : item)));
          }}
        />
      ) : null}
    </div>
  );
}

function NewsModal({
  article,
  products,
  companies,
  locale,
  onClose,
  onSaved,
  onOptimisticUpdate,
}: {
  article: AdminNewsArticleListItem | null;
  products: AdminProductListItem[];
  companies: AdminCompanyListItem[];
  locale: Locale;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onOptimisticUpdate: (article: AdminNewsArticleListItem) => void;
}) {
  const t = useTranslations("Admin.news");
  const [saving, setSaving] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(article?.relatedProductIds ?? []);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(article?.relatedCompanyIds ?? []);
  const previewHref = article ? localizedPath(locale, `/news/${article.slug}`) : "";

  const visibleProducts = useMemo(() => {
    const normalizedQuery = normalizeQuery(productQuery);

    return products
      .filter(product => matchesQuery([product.name, product.slug, product.companyName, product.category, ...product.tags], normalizedQuery))
      .slice(0, 40);
  }, [productQuery, products]);

  const visibleCompanies = useMemo(() => {
    const normalizedQuery = normalizeQuery(companyQuery);

    return companies
      .filter(company => matchesQuery([company.name, company.slug, company.type, company.city, ...company.tags, ...company.domains], normalizedQuery))
      .slice(0, 40);
  }, [companies, companyQuery]);

  function toggleSelection(current: string[], value: string) {
    return current.includes(value) ? current.filter(item => item !== value) : [...current, value];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const formPayload = Object.fromEntries(formData.entries()) as Record<string, string>;
    const payload: Record<string, string> = {
      ...formPayload,
      relatedProductIds: selectedProductIds.join(","),
      relatedCompanyIds: selectedCompanyIds.join(","),
    };

    try {
      const response = await fetch(article ? `/api/admin/news/${article.id}` : "/api/admin/news", {
        method: article ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      if (article) {
        const publishStatus = String(payload.publishStatus || article.publishStatus);
        const publishedAt = String(payload.publishedAt || "");
        onOptimisticUpdate({
          ...article,
          slug: String(payload.slug || article.slug),
          title: String(payload.title || article.title),
          summary: String(payload.summary || article.summary),
          content: String(payload.content || article.content),
          sourceName: String(payload.sourceName || "") || null,
          sourceUrl: String(payload.sourceUrl || "") || null,
          coverImage: String(payload.coverImage || "") || null,
          category: String(payload.category || article.category),
          tags: String(payload.tags || "")
            .split(/[,，\n]/)
            .map(item => item.trim())
            .filter(Boolean),
          relatedProductIds: selectedProductIds,
          relatedCompanyIds: selectedCompanyIds,
          relatedProductCount: selectedProductIds.length,
          relatedCompanyCount: selectedCompanyIds.length,
          publishedAt: publishedAt ? new Date(publishedAt) : publishStatus === "published" ? article.publishedAt ?? new Date() : null,
          publishStatus,
          hotScore: Number(payload.hotScore || article.hotScore),
          updatedAt: new Date(),
        });
      }

      toast.success(article ? "资讯已更新" : "资讯已创建");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={article ? t("modalEditTitle") : t("modalCreateTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <FormSection title={t("baseInfo")} icon={<FileText className="h-4 w-4" />} description={t("previewHint")}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="title" label={t("articleTitle")} defaultValue={article?.title} required />
                <Field name="slug" label={t("slug")} defaultValue={article?.slug} required />
                <SelectField name="category" label={t("category")} defaultValue={article?.category || newsCategories[0]} options={newsCategories} />
                <SelectField name="publishStatus" label={t("publishStatus")} defaultValue={article?.publishStatus || "draft"} options={contentStatuses} labels={{ published: t("statusPublished"), draft: t("statusDraft") }} />
                <Field name="hotScore" label={t("hotScore")} type="number" defaultValue={article?.hotScore ?? 0} />
                <Field name="publishedAt" label={t("publishedAt")} type="datetime-local" defaultValue={dateInputValue(article?.publishedAt ?? null)} />
              </div>
            </FormSection>

            <FormSection title={t("content")} icon={<Newspaper className="h-4 w-4" />}>
              <div className="space-y-4">
                <TextareaField name="summary" label={t("summary")} defaultValue={article?.summary ?? ""} rows={3} required />
                <TextareaField name="content" label={t("articleBody")} defaultValue={article?.content ?? ""} rows={10} required />
                <Field name="coverImage" label={t("coverImage")} defaultValue={article?.coverImage ?? ""} />
                <TextareaField name="tags" label={t("tags")} defaultValue={article ? csv(article.tags) : ""} placeholder="人形机器人, 仓储, 试点" rows={2} />
              </div>
            </FormSection>

            <FormSection title={t("sourceInfo")} icon={<Tag className="h-4 w-4" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="sourceName" label={t("sourceName")} defaultValue={article?.sourceName ?? ""} />
                <Field name="sourceUrl" label={t("sourceUrl")} defaultValue={article?.sourceUrl ?? ""} />
              </div>
            </FormSection>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">{t("publishStatus")}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {article ? statusLabel(article.publishStatus) : t("modalCreateTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("unpublishedHint")}</p>
              {article ? (
                <Button
                  as={Link}
                  href={previewHref}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline"
                  className="mt-4 w-full gap-2 rounded-md"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t("preview")}
                </Button>
              ) : null}
            </div>

            <RelationSelector
              title={t("productSelection")}
              searchPlaceholder={t("productSearchPlaceholder")}
              selectedCountText={t("selectedCount", { count: selectedProductIds.length })}
              query={productQuery}
              onQueryChange={setProductQuery}
              options={visibleProducts.map(product => ({
                id: product.id,
                title: product.name,
                subtitle: [product.companyName, product.category].filter(Boolean).join(" / "),
              }))}
              selectedIds={selectedProductIds}
              onToggle={id => setSelectedProductIds(current => toggleSelection(current, id))}
            />

            <RelationSelector
              title={t("companySelection")}
              searchPlaceholder={t("companySearchPlaceholder")}
              selectedCountText={t("selectedCount", { count: selectedCompanyIds.length })}
              query={companyQuery}
              onQueryChange={setCompanyQuery}
              options={visibleCompanies.map(company => ({
                id: company.id,
                title: company.name,
                subtitle: [company.type, company.city].filter(Boolean).join(" / "),
              }))}
              selectedIds={selectedCompanyIds}
              onToggle={id => setSelectedCompanyIds(current => toggleSelection(current, id))}
            />
          </aside>
        </div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </ModalShell>
  );
}

function RelationSelector({
  title,
  searchPlaceholder,
  selectedCountText,
  query,
  onQueryChange,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  searchPlaceholder: string;
  selectedCountText: string;
  query: string;
  onQueryChange: (query: string) => void;
  options: Array<{ id: string; title: string; subtitle: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
          {selectedCountText}
        </span>
      </div>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className={`${inputClass} pr-9`}
        />
      </div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
        {options.map(option => {
          const checked = selectedIds.includes(option.id);

          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                checked
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:border-foreground/30",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.id)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block line-clamp-1 text-sm font-medium">{option.title}</span>
                <span className={cn("mt-1 block line-clamp-1 text-xs", checked ? "text-background/70" : "text-muted-foreground")}>
                  {option.subtitle || option.id}
                </span>
              </span>
            </label>
          );
        })}
        {options.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            -
          </p>
        ) : null}
      </div>
    </div>
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
              资讯会连接前台内容、相关目录和需求线索。
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
  labels,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={selectClass}>
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
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={textareaClass}
      />
    </label>
  );
}

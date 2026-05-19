import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Building2,
  ChevronDown,
  Factory,
  Newspaper,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { IndustryCompany, IndustryNewsArticle, IndustryProduct } from "@/lib/industry-shared";
import type { Locale } from "@/i18n.config";
import { localizedPath } from "@/features/industry/content";

const compactFieldClass =
  "h-10 w-full rounded-md border border-border/70 bg-muted/30 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground hover:border-foreground/20 focus:border-foreground/40 focus:bg-background focus:ring-2 focus:ring-ring/30";

type FilterValueMap = Record<string, string | undefined>;

export type QuickFilterGroup = {
  name: string;
  label: string;
  allLabel: string;
  value?: string;
  options: readonly string[];
};

export type ActiveFilterChip = {
  name: string;
  label: string;
  value?: string;
  displayValue?: string;
};

type SelectFilterOption = string | {
  label: string;
  value: string;
};

function buildDirectoryHref(locale: Locale, basePath: string, values: FilterValueMap, patch: FilterValueMap = {}) {
  const params = new URLSearchParams();
  const nextValues = { ...values, ...patch };

  Object.entries(nextValues).forEach(([key, value]) => {
    if (!value || (key === "sort" && value === "latest")) {
      return;
    }

    params.set(key, value);
  });

  const queryString = params.toString();

  return localizedPath(locale, queryString ? `${basePath}?${queryString}` : basePath);
}

function getFilterOption(option: SelectFilterOption) {
  return typeof option === "string" ? { label: option, value: option } : option;
}

export function PlatformBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

export function DirectorySummaryCard({
  count,
  countText,
  sampleNotice,
}: {
  count: number;
  countText: string;
  sampleNotice?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-4xl font-semibold leading-none tracking-tight text-foreground">
        {count}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {countText}
      </p>
      {sampleNotice ? (
        <p className="mt-3 inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {sampleNotice}
        </p>
      ) : null}
    </div>
  );
}

export function DirectoryFilterPanel({
  locale,
  basePath,
  values,
  title,
  searchValue,
  searchPlaceholder,
  actionLabel,
  clearLabel,
  moreLabel,
  quickGroups,
  activeFilters,
  advancedOpen = false,
  children,
}: {
  locale: Locale;
  basePath: string;
  values: FilterValueMap;
  title: string;
  searchValue?: string;
  searchPlaceholder: string;
  actionLabel: string;
  clearLabel: string;
  moreLabel: string;
  quickGroups: QuickFilterGroup[];
  activeFilters: ActiveFilterChip[];
  advancedOpen?: boolean;
  children?: ReactNode;
}) {
  const visibleActiveFilters = activeFilters.filter(filter => Boolean(filter.value));

  return (
    <form method="get" className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {quickGroups.map(group => (
        group.value ? (
          <input key={group.name} type="hidden" name={group.name} value={group.value} />
        ) : null
      ))}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {title}
          </p>
        </div>
        {visibleActiveFilters.length > 0 ? (
          <Link
            href={localizedPath(locale, basePath)}
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {clearLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        <div className="min-w-0 flex-1">
          <SearchInput defaultValue={searchValue} placeholder={searchPlaceholder} />
        </div>
        <Button
          type="submit"
          className="h-12 shrink-0 gap-2 rounded-md px-5 md:w-[132px]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {actionLabel}
        </Button>
      </div>

      {visibleActiveFilters.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleActiveFilters.map(filter => (
            <Link
              key={`${filter.name}-${filter.value}`}
              href={buildDirectoryHref(locale, basePath, values, { [filter.name]: undefined })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-muted px-3 text-xs font-medium text-foreground transition hover:border-foreground/30"
            >
              <span className="text-muted-foreground">{filter.label}</span>
              <span>{filter.displayValue ?? filter.value}</span>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : null}

      {quickGroups.length > 0 ? (
        <div
          className="mt-4 grid gap-3 border-t border-border/70 pt-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}
        >
          {quickGroups.map(group => (
            <div key={group.name} className="rounded-md bg-muted/35 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {group.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[group.allLabel, ...group.options].map((option, index) => {
                  const isAllOption = index === 0;
                  const value = isAllOption ? undefined : option;
                  const isActive = isAllOption ? !group.value : group.value === option;

                  return (
                    <Link
                      key={`${group.name}-${option}`}
                      href={buildDirectoryHref(locale, basePath, values, { [group.name]: value })}
                      className={cn(
                        "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition",
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {option}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {children ? (
        <details open={advancedOpen} className="group mt-4 border-t border-border/70 pt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-foreground/30">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            {moreLabel}
            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
        </details>
      ) : null}
    </form>
  );
}

export function SearchInput({
  name = "query",
  defaultValue,
  placeholder,
}: {
  name?: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-border/80 bg-background pl-4 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground hover:border-foreground/20 focus:border-foreground/40 focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

export function SelectFilter({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: readonly SelectFilterOption[];
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      aria-label={label}
      className={compactFieldClass}
    >
      <option value="">{label}</option>
      {options.map(option => (
        <option key={getFilterOption(option).value} value={getFilterOption(option).value}>
          {getFilterOption(option).label}
        </option>
      ))}
    </select>
  );
}

export function TextFilter({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={compactFieldClass}
    />
  );
}

export function TagList({ tags, limit = 4 }: { tags: string[]; limit?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, limit).map(tag => (
        <span
          key={tag}
          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ProductCard({ product, locale = "en" }: { product: IndustryProduct; locale?: Locale }) {
  return (
    <Link
      href={localizedPath(locale, `/products/${product.slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-derek"
    >
      <div className="relative aspect-[4/3] bg-secondary">
        {product.coverImage ? (
          <Image
            src={product.coverImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Factory className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              {product.category}{product.subCategory ? ` / ${product.subCategory}` : ""}
            </span>
            {product.priceRange ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {product.priceRange}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {product.name}
          </h3>
          {product.companyName ? (
            <p className="text-sm text-muted-foreground">{product.companyName}</p>
          ) : null}
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {product.description || "暂无产品描述，运营团队正在补充资料。"}
          </p>
        </div>
        <div className="mt-auto">
          <TagList tags={[...product.industries, ...product.capabilities]} />
        </div>
      </div>
    </Link>
  );
}

export function CompanyCard({ company, locale = "en" }: { company: IndustryCompany; locale?: Locale }) {
  return (
    <Link
      href={localizedPath(locale, `/companies/${company.slug}`)}
      className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-derek"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
          {company.logo ? (
            <Image
              src={company.logo}
              alt={company.name}
              fill
              sizes="48px"
              className="object-contain p-1.5"
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {company.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[company.country, company.city].filter(Boolean).join(" / ") || "地区待补充"}
          </p>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {company.tagline || company.description || "暂无企业简介，运营团队正在补充资料。"}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
          {company.type}
        </span>
        {company.fundingStage ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            {company.fundingStage}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <TagList tags={[...company.domains, ...company.tags]} />
      </div>
      <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-foreground">
        查看企业
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function NewsCard({ article, locale = "en" }: { article: IndustryNewsArticle; locale?: Locale }) {
  const publishedText = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={localizedPath(locale, `/news/${article.slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-derek"
    >
      <div className="relative aspect-[16/9] bg-secondary">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge>{article.category}</PlatformBadge>
            {article.hotScore > 0 ? <PlatformBadge>热度 {article.hotScore}</PlatformBadge> : null}
          </div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {article.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {article.summary}
          </p>
        </div>
        <div className="mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{article.sourceName || "平台整理"}</span>
            {publishedText ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {publishedText}
              </span>
            ) : null}
          </div>
          <TagList tags={article.tags} limit={4} />
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border bg-background p-10 text-center", className)}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

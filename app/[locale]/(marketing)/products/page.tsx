import type { Metadata } from "next";

import { Container } from "@/components/container";
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import {
  getProductDirectory,
  normalizeProductFilters,
} from "@/lib/industry-platform";
import {
  priceRanges,
  productCapabilities,
  productCategories,
  productIndustries,
} from "@/lib/industry-shared";
import { industryCopy } from "@/features/industry/content";
import {
  DirectoryFilterPanel,
  DirectorySummaryCard,
  EmptyState,
  ProductCard,
  SelectFilter,
} from "@/features/industry/components/shared";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = industryCopy[locale].products;

  return generatePageMetadata({
    locale,
    path: "/products",
    title: copy.title,
    description: copy.description,
  });
}

export default async function ProductsPage(props: PageProps) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const filters = normalizeProductFilters(searchParams);
  const copy = industryCopy[locale].products;
  const directory = await getProductDirectory(filters);
  const filterValues = {
    query: filters.query,
    category: filters.category,
    industry: filters.industry,
    capability: filters.capability,
    priceRange: filters.priceRange,
    sort: filters.sort,
  };

  return (
    <div className="min-h-screen bg-background pt-28">
      <Container className="pb-16">
        <div className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              {copy.eyebrow}
            </p>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {copy.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {copy.description}
              </p>
            </div>
          </div>
          <DirectorySummaryCard
            count={directory.total}
            countText={copy.summaryLabel}
            sampleNotice={directory.usingSampleData ? copy.sampleNotice : undefined}
          />
        </div>

        <div className="mt-6">
          <DirectoryFilterPanel
            locale={locale}
            basePath="/products"
            values={filterValues}
            title={copy.filterTitle}
            searchValue={filters.query}
            searchPlaceholder={copy.search}
            actionLabel={copy.filter}
            clearLabel={copy.clearAll}
            moreLabel={copy.moreFilters}
            quickGroups={[
              {
                name: "category",
                label: copy.categoryGroup,
                allLabel: copy.category,
                value: filters.category,
                options: productCategories,
              },
              {
                name: "industry",
                label: copy.industryGroup,
                allLabel: copy.industry,
                value: filters.industry,
                options: productIndustries,
              },
            ]}
            activeFilters={[
              { name: "query", label: copy.keyword, value: filters.query },
              { name: "category", label: copy.category, value: filters.category },
              { name: "industry", label: copy.industry, value: filters.industry },
              { name: "capability", label: copy.capability, value: filters.capability },
              { name: "priceRange", label: copy.priceRange, value: filters.priceRange },
              { name: "sort", label: copy.sort, value: filters.sort === "popular" ? filters.sort : undefined, displayValue: copy.popular },
            ]}
            advancedOpen={Boolean(filters.capability || filters.priceRange || filters.sort === "popular")}
          >
            <SelectFilter name="capability" label={copy.capability} value={filters.capability} options={productCapabilities} />
            <SelectFilter name="priceRange" label={copy.priceRange} value={filters.priceRange} options={priceRanges} />
            <SelectFilter
              name="sort"
              label={copy.sort}
              value={filters.sort}
              options={[
                { label: copy.latest, value: "latest" },
                { label: copy.popular, value: "popular" },
              ]}
            />
          </DirectoryFilterPanel>
        </div>

        {directory.products.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {directory.products.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        )}
      </Container>
    </div>
  );
}

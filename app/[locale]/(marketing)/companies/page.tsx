import type { Metadata } from "next";

import { Container } from "@/components/container";
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import {
  getCompanyDirectory,
  normalizeCompanyFilters,
} from "@/lib/industry-platform";
import { companyTypes, fundingStages } from "@/lib/industry-shared";
import { industryCopy } from "@/features/industry/content";
import {
  CompanyCard,
  DirectoryFilterPanel,
  DirectorySummaryCard,
  EmptyState,
  TextFilter,
} from "@/features/industry/components/shared";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = industryCopy[locale].companies;

  return generatePageMetadata({
    locale,
    path: "/companies",
    title: copy.title,
    description: copy.description,
  });
}

export default async function CompaniesPage(props: PageProps) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const filters = normalizeCompanyFilters(searchParams);
  const copy = industryCopy[locale].companies;
  const directory = await getCompanyDirectory(filters);
  const filterValues = {
    query: filters.query,
    type: filters.type,
    location: filters.location,
    fundingStage: filters.fundingStage,
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
            basePath="/companies"
            values={filterValues}
            title={copy.filterTitle}
            searchValue={filters.query}
            searchPlaceholder={copy.search}
            actionLabel={copy.filter}
            clearLabel={copy.clearAll}
            moreLabel={copy.moreFilters}
            quickGroups={[
              {
                name: "type",
                label: copy.typeGroup,
                allLabel: copy.type,
                value: filters.type,
                options: companyTypes,
              },
              {
                name: "fundingStage",
                label: copy.fundingStageGroup,
                allLabel: copy.fundingStage,
                value: filters.fundingStage,
                options: fundingStages,
              },
            ]}
            activeFilters={[
              { name: "query", label: copy.keyword, value: filters.query },
              { name: "type", label: copy.type, value: filters.type },
              { name: "location", label: copy.location, value: filters.location },
              { name: "fundingStage", label: copy.fundingStage, value: filters.fundingStage },
            ]}
            advancedOpen={Boolean(filters.location)}
          >
            <TextFilter name="location" defaultValue={filters.location} placeholder={copy.location} />
          </DirectoryFilterPanel>
        </div>

        {directory.companies.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {directory.companies.map(company => (
              <CompanyCard key={company.id} company={company} locale={locale} />
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

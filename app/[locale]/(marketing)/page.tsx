import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  ClipboardList,
  Database,
  Newspaper,
  Search,
} from "lucide-react";

import { Button } from "@/components/button";
import { Container } from "@/components/container";
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import {
  getCompanyDirectory,
  getNewsDirectory,
  getPlatformStats,
  getProductDirectory,
} from "@/lib/industry-platform";
import { industryCopy, localizedPath } from "@/features/industry/content";
import {
  CompanyCard,
  NewsCard,
  PlatformBadge,
  ProductCard,
} from "@/features/industry/components/shared";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>;
  }
): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = industryCopy[locale].home;

  return generatePageMetadata({
    locale,
    path: "",
    title: copy.title,
    description: copy.description,
  });
}

export default async function Home(
  props: {
    params: Promise<{ locale: Locale }>;
  }
) {
  const { locale } = await props.params;
  const copy = industryCopy[locale].home;
  const [stats, productDirectory, companyDirectory, newsDirectory] = await Promise.all([
    getPlatformStats(),
    getProductDirectory({ sort: "latest" }),
    getCompanyDirectory({}),
    getNewsDirectory({ sort: "latest" }),
  ]);
  const latestProducts = productDirectory.products.slice(0, 3);
  const latestCompanies = companyDirectory.companies.slice(0, 3);
  const latestNews = newsDirectory.articles.slice(0, 3);
  const usingSampleData = productDirectory.usingSampleData || companyDirectory.usingSampleData || newsDirectory.usingSampleData;

  const entries = [
    {
      title: copy.productEntry,
      description: copy.productEntryDescription,
      href: localizedPath(locale, "/products"),
      icon: Boxes,
    },
    {
      title: copy.companyEntry,
      description: copy.companyEntryDescription,
      href: localizedPath(locale, "/companies"),
      icon: Building2,
    },
    {
      title: copy.newsEntry,
      description: copy.newsEntryDescription,
      href: localizedPath(locale, "/news"),
      icon: Newspaper,
    },
    {
      title: copy.inquiryEntry,
      description: copy.inquiryEntryDescription,
      href: localizedPath(locale, "/inquiry"),
      icon: ClipboardList,
    },
  ];

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--secondary))_0%,hsl(var(--background))_70%)] pt-32">
        <Container className="grid gap-12 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <PlatformBadge>{copy.eyebrow}</PlatformBadge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {copy.description}
            </p>
            <form
              action={localizedPath(locale, "/products")}
              className="mt-8 flex max-w-2xl flex-col gap-3 rounded-lg border border-border bg-background p-2 shadow-aceternity sm:flex-row"
            >
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="query"
                  placeholder={copy.searchPlaceholder}
                  className="h-12 w-full rounded-md border-0 bg-transparent pl-11 pr-3 text-sm text-foreground outline-none"
                />
              </label>
              <Button type="submit" className="rounded-md">
                <Search className="mr-2 h-4 w-4" />
                {locale === "zh" ? "搜索" : "Search"}
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} href={localizedPath(locale, "/products")} className="rounded-md">
                {copy.primaryCta}
              </Button>
              <Button as={Link} href={localizedPath(locale, "/inquiry")} variant="outline" className="rounded-md">
                {copy.secondaryCta}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-derek">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-background">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Industry snapshot</p>
                <p className="text-xs text-muted-foreground">MVP validation dashboard</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 py-5">
              <StatValue label={copy.stats.companies} value={stats.companies} />
              <StatValue label={copy.stats.products} value={stats.products} />
              <StatValue label={copy.stats.inquiries} value={stats.inquiries} />
            </div>
            {usingSampleData ? (
              <p className="rounded-md bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                {copy.sampleNotice}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16">
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {copy.entriesTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy.entriesSubtitle}
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {entries.map(entry => {
              const Icon = entry.icon;

              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="group rounded-lg border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-derek"
                >
                  <Icon className="h-6 w-6 text-foreground" />
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                    {entry.description}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground">
                    {locale === "zh" ? "进入" : "Open"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-12 lg:grid-cols-3">
          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {copy.latestProducts}
              </h2>
              <Link href={localizedPath(locale, "/products")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {locale === "zh" ? "查看全部" : "View all"}
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {latestProducts.map(product => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {copy.latestCompanies}
              </h2>
              <Link href={localizedPath(locale, "/companies")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {locale === "zh" ? "查看全部" : "View all"}
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {latestCompanies.map(company => (
                <CompanyCard key={company.id} company={company} locale={locale} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {copy.latestNews}
              </h2>
              <Link href={localizedPath(locale, "/news")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {locale === "zh" ? "查看全部" : "View all"}
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {latestNews.map(article => (
                <NewsCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
}

function StatValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-2xl font-bold text-foreground">{value}+</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

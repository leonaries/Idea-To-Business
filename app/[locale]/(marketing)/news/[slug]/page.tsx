import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Flame,
} from "lucide-react";

import { Button } from "@/components/button";
import { Container } from "@/components/container";
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import {
  getNewsArticleBySlug,
  getRelatedCompaniesByIds,
  getRelatedProductsByIds,
} from "@/lib/industry-platform";
import { industryCopy, localizedPath } from "@/features/industry/content";
import {
  CompanyCard,
  PlatformBadge,
  ProductCard,
  TagList,
} from "@/features/industry/components/shared";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const article = await getNewsArticleBySlug(slug);

  if (!article) {
    return generatePageMetadata({
      locale,
      path: `/news/${slug}`,
      title: "News",
      description: "News details",
    });
  }

  return generatePageMetadata({
    locale,
    path: `/news/${slug}`,
    title: article.title,
    description: article.summary,
    ogImage: article.coverImage || undefined,
  });
}

export default async function NewsDetailPage(props: PageProps) {
  const { locale, slug } = await props.params;
  const copy = industryCopy[locale].detail;
  const article = await getNewsArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const [relatedProducts, relatedCompanies] = await Promise.all([
    getRelatedProductsByIds(article.relatedProductIds),
    getRelatedCompaniesByIds(article.relatedCompanyIds),
  ]);
  const inquiryHref = localizedPath(
    locale,
    `/inquiry?sourceType=news&sourceId=${encodeURIComponent(article.id)}&sourceName=${encodeURIComponent(article.title)}`,
  );
  const publishedText = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const paragraphs = article.content
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background pt-28">
      <Container className="pb-16">
        <Link
          href={localizedPath(locale, "/news")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.backNews}
        </Link>

        <article className="mt-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                <PlatformBadge>{article.category}</PlatformBadge>
                {article.sourceName ? <PlatformBadge>{article.sourceName}</PlatformBadge> : null}
                {article.hotScore > 0 ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Flame className="h-3.5 w-3.5" />
                    {copy.hotScore} {article.hotScore}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
                {article.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {publishedText ? (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {copy.publishedAt} {publishedText}
                  </span>
                ) : null}
                {article.sourceUrl ? (
                  <Link
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    {copy.source}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground">{copy.newsCtaTitle}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.newsCtaDescription}</p>
              <Button as={Link} href={inquiryHref} className="mt-5 w-full gap-2 rounded-md">
                {copy.inquire}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </aside>
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-secondary">
            <div className="relative aspect-[16/7] min-h-[240px]">
              {article.coverImage ? (
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  {article.category}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
            <section className="rounded-lg border border-border bg-card p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground">{copy.newsBody}</h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                {paragraphs.map(paragraph => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground">Tags</p>
                <div className="mt-3">
                  <TagList tags={article.tags} limit={10} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground">{copy.source}</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <InfoRow label={copy.source} value={article.sourceName || "-"} />
                  <InfoRow label={copy.hotScore} value={String(article.hotScore)} />
                  <InfoRow label={copy.publishedAt} value={publishedText || "-"} />
                </dl>
              </div>
            </aside>
          </div>
        </article>

        {relatedProducts.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {copy.relatedProducts}
              </h2>
              <Link href={localizedPath(locale, "/products")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {locale === "zh" ? "查看全部" : "View all"}
              </Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}

        {relatedCompanies.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {copy.relatedCompanies}
              </h2>
              <Link href={localizedPath(locale, "/companies")} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {locale === "zh" ? "查看全部" : "View all"}
              </Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedCompanies.map(company => (
                <CompanyCard key={company.id} company={company} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

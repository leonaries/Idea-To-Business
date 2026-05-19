import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/button";
import { Container } from "@/components/container";
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import {
  getCompanyBySlug,
  getProductsForCompany,
} from "@/lib/industry-platform";
import { industryCopy, localizedPath } from "@/features/industry/content";
import {
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
  const company = await getCompanyBySlug(slug);

  if (!company) {
    return generatePageMetadata({
      locale,
      path: `/companies/${slug}`,
      title: "Company",
      description: "Company details",
    });
  }

  return generatePageMetadata({
    locale,
    path: `/companies/${slug}`,
    title: company.name,
    description: company.tagline || company.description || `${company.name} company profile`,
    ogImage: company.logo || undefined,
  });
}

export default async function CompanyDetailPage(props: PageProps) {
  const { locale, slug } = await props.params;
  const copy = industryCopy[locale].detail;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const companyProducts = await getProductsForCompany(company.id);
  const inquiryHref = localizedPath(
    locale,
    `/inquiry?sourceType=company&sourceId=${encodeURIComponent(company.id)}&sourceName=${encodeURIComponent(company.name)}`,
  );
  const location = [company.country, company.city].filter(Boolean).join(" / ");

  return (
    <div className="min-h-screen bg-background pt-28">
      <Container className="pb-16">
        <Link
          href={localizedPath(locale, "/companies")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.backCompanies}
        </Link>

        <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-aceternity md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {company.name.slice(0, 1)}
                  </span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <PlatformBadge>{company.type}</PlatformBadge>
                  {company.fundingStage ? <PlatformBadge>{company.fundingStage}</PlatformBadge> : null}
                  {location ? <PlatformBadge>{location}</PlatformBadge> : null}
                </div>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
                  {company.name}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
                  {company.tagline || company.description || copy.noDescription}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button as={Link} href={inquiryHref} className="rounded-md">
                {copy.inquire}
              </Button>
              {company.website ? (
                <Button
                  as={Link}
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  className="gap-2 rounded-md"
                >
                  {copy.official}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">{copy.basicInfo}</h2>
            <dl className="mt-5 space-y-3">
              <InfoRow label="成立时间" value={company.foundedYear ? String(company.foundedYear) : null} />
              <InfoRow label="员工规模" value={company.employeeRange} />
              <InfoRow label="融资阶段" value={company.fundingStage} />
              <InfoRow label="融资总额" value={company.totalFunding} />
              <InfoRow label="所在地" value={location || null} />
            </dl>
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Domains</p>
              <TagList tags={company.domains} limit={8} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">{copy.profile}</h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {company.description || copy.noDescription}
            </p>
            {company.tags.length > 0 ? (
              <div className="mt-6">
                <TagList tags={company.tags} limit={10} />
              </div>
            ) : null}
          </section>
        </div>

        {companyProducts.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {copy.companyProducts}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {companyProducts.map(product => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}

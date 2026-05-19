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
  getProductBySlug,
  getRelatedProducts,
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
  const product = await getProductBySlug(slug);

  if (!product) {
    return generatePageMetadata({
      locale,
      path: `/products/${slug}`,
      title: "Product",
      description: "Product details",
    });
  }

  return generatePageMetadata({
    locale,
    path: `/products/${slug}`,
    title: product.name,
    description: product.description || `${product.name} product details`,
    ogImage: product.coverImage || undefined,
  });
}

export default async function ProductDetailPage(props: PageProps) {
  const { locale, slug } = await props.params;
  const copy = industryCopy[locale].detail;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);
  const inquiryHref = localizedPath(
    locale,
    `/inquiry?sourceType=product&sourceId=${encodeURIComponent(product.id)}&sourceName=${encodeURIComponent(product.name)}`,
  );

  return (
    <div className="min-h-screen bg-background pt-28">
      <Container className="pb-16">
        <Link
          href={localizedPath(locale, "/products")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.backProducts}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-secondary">
            {product.coverImage ? (
              <Image
                src={product.coverImage}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <PlatformBadge>{product.category}</PlatformBadge>
              {product.subCategory ? <PlatformBadge>{product.subCategory}</PlatformBadge> : null}
              {product.priceRange ? <PlatformBadge>{product.priceRange}</PlatformBadge> : null}
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {product.description || copy.noDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} href={inquiryHref} className="rounded-md">
                {copy.inquire}
              </Button>
              {product.officialUrl ? (
                <Button
                  as={Link}
                  href={product.officialUrl}
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
            {product.companyName ? (
              <div className="mt-8 rounded-lg border border-border bg-card p-5">
                <p className="text-sm font-medium text-muted-foreground">{copy.company}</p>
                {product.companySlug ? (
                  <Link
                    href={localizedPath(locale, `/companies/${product.companySlug}`)}
                    className="mt-2 inline-flex text-lg font-semibold text-foreground hover:underline"
                  >
                    {product.companyName}
                  </Link>
                ) : (
                  <p className="mt-2 text-lg font-semibold text-foreground">{product.companyName}</p>
                )}
                {product.companyType ? (
                  <p className="mt-1 text-sm text-muted-foreground">{product.companyType}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">{copy.specs}</h2>
            <dl className="mt-5 space-y-3">
              {Object.entries(product.specs).length > 0 ? (
                Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-border pb-3 text-sm">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="text-right font-medium text-foreground">{value}</dd>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">参数待补充</p>
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">{copy.scenarios}</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Industries</p>
                <TagList tags={product.industries} limit={8} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Capabilities</p>
                <TagList tags={product.capabilities} limit={8} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Tags</p>
                <TagList tags={product.tags} limit={8} />
              </div>
            </div>
          </section>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {copy.relatedProducts}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map(item => (
                <ProductCard key={item.id} product={item} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}

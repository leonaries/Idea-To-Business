import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/container";
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import { industryCopy } from "@/features/industry/content";
import { InquiryForm } from "@/features/industry/components/inquiry-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    sourceType?: "general" | "product" | "company" | "news";
    sourceId?: string;
    sourceName?: string;
  }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = industryCopy[locale].inquiry;

  return generatePageMetadata({
    locale,
    path: "/inquiry",
    title: copy.title,
    description: copy.description,
  });
}

export default async function InquiryPage(props: PageProps) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const copy = industryCopy[locale].inquiry;

  return (
    <div className="min-h-screen bg-background pt-28">
      <Container className="grid gap-10 pb-16 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-sm font-medium text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            {copy.description}
          </p>

          <div className="mt-8 rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">
              {copy.asideTitle}
            </h2>
            <ul className="mt-4 space-y-3">
              {copy.asideItems.map(item => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <InquiryForm
          copy={copy}
          sourceType={searchParams?.sourceType ?? "general"}
          sourceId={searchParams?.sourceId}
          sourceName={searchParams?.sourceName}
        />
      </Container>
    </div>
  );
}

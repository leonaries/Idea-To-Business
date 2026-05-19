import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n.config";
import {
  getAdminInquiries,
  getInquirySummary,
} from "@/lib/industry-platform";
import { cn } from "@/lib/utils";
import { InquiriesTable } from "@/features/admin/components/inquiries-table";

export const dynamic = "force-dynamic";

interface AdminInquiriesPageProps {
  params: Promise<{
    locale: Locale;
  }>;
  searchParams?: Promise<{
    status?: string;
  }>;
}

const statusFilters = [
  { key: "all", value: "all" },
  { key: "new", value: "new" },
  { key: "inProgress", value: "in_progress" },
  { key: "contacted", value: "contacted" },
  { key: "closed", value: "closed" },
] as const;

export default async function AdminInquiriesPage(props: AdminInquiriesPageProps) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const selectedStatus = searchParams?.status ?? "all";
  const t = await getTranslations({ locale, namespace: "Admin.inquiries" });
  const [inquiries, summary] = await Promise.all([
    getAdminInquiries(searchParams?.status),
    getInquirySummary(),
  ]);

  const summaryCards = [
    { label: t("total"), value: summary.total },
    { label: t("new"), value: summary.newCount },
    { label: t("inProgress"), value: summary.inProgressCount },
    { label: t("contacted"), value: summary.contactedCount },
    { label: t("closed"), value: summary.closedCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {summaryCards.map(card => (
          <div key={card.label} className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold leading-none text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm font-medium text-muted-foreground">{t("filterLabel")}</p>
        {statusFilters.map(filter => {
          const isActive = selectedStatus === filter.value || (!selectedStatus && filter.value === "all");
          const href = filter.value === "all"
            ? `/${locale}/admin/inquiries`
            : `/${locale}/admin/inquiries?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {t(filter.key)}
            </Link>
          );
        })}
      </div>

      <InquiriesTable inquiries={inquiries} />
    </div>
  );
}

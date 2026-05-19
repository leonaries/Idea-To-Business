"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import {
  inquiryStatuses,
  type InquiryListItem,
} from "@/lib/industry-shared";

interface InquiriesTableProps {
  inquiries: InquiryListItem[];
}

const statusColor: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  in_progress: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300",
  contacted: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  closed: "bg-secondary text-muted-foreground",
};

const statusKeyMap: Record<string, "new" | "inProgress" | "contacted" | "closed"> = {
  new: "new",
  in_progress: "inProgress",
  contacted: "contacted",
  closed: "closed",
};

const sourceKeyMap: Record<string, "sourceProduct" | "sourceCompany" | "sourceNews" | "sourceGeneral"> = {
  product: "sourceProduct",
  company: "sourceCompany",
  news: "sourceNews",
  general: "sourceGeneral",
};

export function InquiriesTable({ inquiries: initialInquiries }: InquiriesTableProps) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryListItem | null>(null);
  const t = useTranslations("Admin.inquiries");

  function getStatusLabel(status: string) {
    const key = statusKeyMap[status];
    return key ? t(key) : status;
  }

  function getSourceLabel(sourceType: string) {
    const key = sourceKeyMap[sourceType];
    return key ? t(key) : sourceType;
  }

  async function updateInquiry(inquiryId: string, status: string, adminNotes: string) {
    try {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setInquiries(current =>
        current.map(item =>
          item.id === inquiryId
            ? { ...item, status, adminNotes, updatedAt: new Date() }
            : item,
        ),
      );
      setSelectedInquiry(null);
      toast.success(t("updatedToast"));
    } catch {
      toast.error(t("updateFailedToast"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-secondary">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("lead")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("source")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("scenario")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("budget")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("status")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("time")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inquiries.map(item => (
                <tr key={item.id} className="hover:bg-hover">
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <UserRound className="h-4 w-4 text-muted-foreground" />
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {item.email}
                      </div>
                      {item.phone ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {item.phone}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="text-sm text-foreground">{getSourceLabel(item.sourceType)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.sourceName || item.companyName || item.industry || "-"}
                    </div>
                  </td>
                  <td className="max-w-xs px-5 py-4 align-top">
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {item.scenario}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-muted-foreground">
                    {item.budgetRange || "-"}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[item.status] || statusColor.closed}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={() => setSelectedInquiry(item)}
                    >
                      {t("handle")}
                    </Button>
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    {t("empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInquiry ? (
        <InquiryModal
          inquiry={selectedInquiry}
          getSourceLabel={getSourceLabel}
          getStatusLabel={getStatusLabel}
          onClose={() => setSelectedInquiry(null)}
          onSave={updateInquiry}
        />
      ) : null}
    </div>
  );
}

function InquiryModal({
  inquiry,
  getSourceLabel,
  getStatusLabel,
  onClose,
  onSave,
}: {
  inquiry: InquiryListItem;
  getSourceLabel: (sourceType: string) => string;
  getStatusLabel: (status: string) => string;
  onClose: () => void;
  onSave: (inquiryId: string, status: string, adminNotes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(inquiry.status);
  const [adminNotes, setAdminNotes] = useState(inquiry.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const t = useTranslations("Admin.inquiries");

  async function handleSave() {
    setSaving(true);
    await onSave(inquiry.id, status, adminNotes);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("modalTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{inquiry.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-hover hover:text-foreground"
          >
            {t("close")}
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-lg bg-secondary p-4 text-sm md:grid-cols-2">
          <Info label={t("name")} value={inquiry.name} />
          <Info label={t("company")} value={inquiry.companyName || "-"} />
          <Info label={t("email")} value={inquiry.email} />
          <Info label={t("phone")} value={inquiry.phone || "-"} />
          <Info label={t("industry")} value={inquiry.industry || "-"} />
          <Info label={t("budget")} value={inquiry.budgetRange || "-"} />
          <Info label={t("source")} value={getSourceLabel(inquiry.sourceType)} />
          <Info label={t("sourceTarget")} value={inquiry.sourceName || "-"} />
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t("scenario")}</p>
            <p className="mt-2 whitespace-pre-line rounded-md border border-border p-3 text-sm leading-6 text-muted-foreground">
              {inquiry.scenario}
            </p>
          </div>
          {inquiry.message ? (
            <div>
              <p className="text-sm font-medium text-foreground">{t("message")}</p>
              <p className="mt-2 whitespace-pre-line rounded-md border border-border p-3 text-sm leading-6 text-muted-foreground">
                {inquiry.message}
              </p>
            </div>
          ) : null}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">{t("status")}</span>
            <select
              value={status}
              onChange={event => setStatus(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {inquiryStatuses.map(item => (
                <option key={item} value={item}>
                  {getStatusLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">{t("adminNotes")}</span>
            <textarea
              value={adminNotes}
              onChange={event => setAdminNotes(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("adminNotesPlaceholder")}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" className="rounded-md" onClick={handleSave} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

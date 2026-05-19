"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/button";
import { Form } from "@/components/ui/form";
import {
  FormTextareaField,
  FormTextField,
} from "@/features/forms/components/form-text-field";
import {
  inquiryInputSchema,
  priceRanges,
  productIndustries,
  type InquiryInput,
} from "@/lib/industry-shared";

type InquiryCopy = {
  formEyebrow: string;
  formTitle: string;
  sourceHintDefault: string;
  sourceHintWithName: string;
  sourceBadgeProduct: string;
  sourceBadgeCompany: string;
  sourceBadgeNews: string;
  sourceBadgeGeneral: string;
  scenarioPrefill: string;
  labels: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    industry: string;
    budgetRange: string;
    scenario: string;
    message: string;
  };
  placeholders: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    industry: string;
    budgetUnknown: string;
    scenario: string;
    message: string;
  };
  successTitle: string;
  successMessage: string;
  continueLabel: string;
  submitLabel: string;
  submittingLabel: string;
  errorFallback: string;
  networkError: string;
};

interface InquiryFormProps {
  copy: InquiryCopy;
  sourceType?: "general" | "product" | "company" | "news";
  sourceId?: string;
  sourceName?: string;
}

export function InquiryForm({
  copy,
  sourceType = "general",
  sourceId,
  sourceName,
}: InquiryFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const sourceScenario = sourceName
    ? copy.scenarioPrefill.replace("{name}", sourceName)
    : "";
  const form = useForm<InquiryInput>({
    resolver: zodResolver(inquiryInputSchema),
    defaultValues: {
      sourceType,
      sourceId: sourceId ?? null,
      sourceName: sourceName ?? "",
      name: "",
      companyName: "",
      email: "",
      phone: "",
      industry: "",
      scenario: sourceScenario,
      budgetRange: "",
      message: "",
    },
  });

  const isSubmitting = status === "submitting";
  const sourceMeta = useMemo(() => {
    const badge = {
      product: copy.sourceBadgeProduct,
      company: copy.sourceBadgeCompany,
      news: copy.sourceBadgeNews,
      general: copy.sourceBadgeGeneral,
    }[sourceType];

    if (!sourceName) {
      return {
        badge,
        hint: copy.sourceHintDefault,
      };
    }

    return {
      badge,
      hint: copy.sourceHintWithName.replace("{name}", sourceName),
    };
  }, [copy, sourceName, sourceType]);

  async function onSubmit(values: InquiryInput) {
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || copy.errorFallback);
        return;
      }

      setStatus("success");
      setMessage(copy.successMessage);
      form.reset({
        sourceType,
        sourceId: sourceId ?? null,
        sourceName: sourceName ?? "",
        name: "",
        companyName: "",
        email: "",
        phone: "",
        industry: "",
        scenario: sourceScenario,
        budgetRange: "",
        message: "",
      });
    } catch {
      setStatus("error");
      setMessage(copy.networkError);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-7">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-muted-foreground">{copy.formEyebrow}</p>
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {sourceMeta.badge}
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {copy.formTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {sourceMeta.hint}
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            {copy.successTitle}
          </div>
          <p className="mt-2 text-sm">{message}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 rounded-md"
            onClick={() => setStatus("idle")}
          >
            {copy.continueLabel}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <input type="hidden" {...form.register("sourceType")} />
            <input type="hidden" {...form.register("sourceId")} />
            <input type="hidden" {...form.register("sourceName")} />
            <div className="grid gap-5 md:grid-cols-2">
              <FormTextField
                control={form.control}
                name="name"
                label={copy.labels.name}
                placeholder={copy.placeholders.name}
                autoComplete="name"
              />
              <FormTextField
                control={form.control}
                name="companyName"
                label={copy.labels.companyName}
                placeholder={copy.placeholders.companyName}
                autoComplete="organization"
              />
              <FormTextField
                control={form.control}
                name="email"
                type="email"
                label={copy.labels.email}
                placeholder={copy.placeholders.email}
                autoComplete="email"
              />
              <FormTextField
                control={form.control}
                name="phone"
                label={copy.labels.phone}
                placeholder={copy.placeholders.phone}
                autoComplete="tel"
              />
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{copy.labels.industry}</span>
                <select
                  {...form.register("industry")}
                  className="block h-10 w-full rounded-md border-0 bg-input px-4 text-foreground shadow-aceternity focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{copy.placeholders.industry}</option>
                  {productIndustries.map(industry => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{copy.labels.budgetRange}</span>
                <select
                  {...form.register("budgetRange")}
                  className="block h-10 w-full rounded-md border-0 bg-input px-4 text-foreground shadow-aceternity focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{copy.placeholders.budgetUnknown}</option>
                  {priceRanges.map(range => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <FormTextareaField
              control={form.control}
              name="scenario"
              label={copy.labels.scenario}
              placeholder={copy.placeholders.scenario}
              rows={4}
            />
            <FormTextareaField
              control={form.control}
              name="message"
              label={copy.labels.message}
              placeholder={copy.placeholders.message}
              rows={4}
            />

            {status === "error" && message ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {message}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md md:w-auto"
            >
              {isSubmitting ? copy.submittingLabel : copy.submitLabel}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

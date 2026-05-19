import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { getAdminCompanies, getAdminNewsArticles, getAdminProducts, upsertNewsArticle } from "@/lib/industry-platform";
import { contentStatuses } from "@/lib/industry-shared";
import { DEFAULT_TAVILY_NEWS_MAX_RESULTS, DEFAULT_TAVILY_NEWS_QUERY, DEFAULT_TAVILY_SEARCH_BASE_URL } from "@/lib/tavily-config";
import {
  buildTavilyNewsArticleInput,
  searchTavilyNews,
  type TavilySearchResult,
} from "@/lib/tavily-news";

const importSchema = z.object({
  query: z.string().trim().optional(),
  maxResults: z.coerce.number().int().min(1).max(10).default(DEFAULT_TAVILY_NEWS_MAX_RESULTS),
  publishStatus: z.enum(contentStatuses).optional(),
});

function normalizeSourceUrl(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";

    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "gclid" || key === "fbclid") {
        parsed.searchParams.delete(key);
      }
    }

    parsed.pathname = parsed.pathname.replace(/\/+$/, "");

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return value.trim().toLowerCase();
  }
}

function makeResponseError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function toExistingLookupKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return normalizeSourceUrl(value);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const parsed = importSchema.parse(body);
    const query = parsed.query?.trim() || DEFAULT_TAVILY_NEWS_QUERY;
    const apiKey = process.env.TAVILY_API_KEY?.trim();
    const baseUrl = process.env.TAVILY_SEARCH_BASE_URL?.trim() || DEFAULT_TAVILY_SEARCH_BASE_URL;

    if (!apiKey) {
      return makeResponseError("Tavily API key is not configured", 503);
    }

    const [products, companies, existingArticles] = await Promise.all([
      getAdminProducts(),
      getAdminCompanies(),
      getAdminNewsArticles(),
    ]);

    const results = await searchTavilyNews({
      apiKey,
      baseUrl,
      query,
      maxResults: parsed.maxResults,
    });

    const existingBySourceUrl = new Map<string, (typeof existingArticles)[number]>();
    const existingBySlug = new Map<string, (typeof existingArticles)[number]>();

    for (const article of existingArticles) {
      const sourceKey = toExistingLookupKey(article.sourceUrl);

      if (sourceKey) {
        existingBySourceUrl.set(sourceKey, article);
      }

      existingBySlug.set(article.slug, article);
    }

    const seenKeys = new Set<string>();
    const importedIds: string[] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const [index, result] of results.entries()) {
      const input = buildTavilyNewsArticleInput(result as TavilySearchResult, {
        query,
        index,
        publishStatus: parsed.publishStatus ?? "published",
        products,
        companies,
      });

      if (!input) {
        skippedCount += 1;
        continue;
      }

      const sourceKey = toExistingLookupKey(input.sourceUrl);
      const dedupeKey = sourceKey || input.slug;

      if (seenKeys.has(dedupeKey)) {
        skippedCount += 1;
        continue;
      }

      seenKeys.add(dedupeKey);

      const existingArticle = (sourceKey ? existingBySourceUrl.get(sourceKey) : null) ?? existingBySlug.get(input.slug) ?? null;

      if (existingArticle) {
        input.publishStatus = existingArticle.publishStatus as "published" | "draft";
        input.publishedAt = undefined;
      }

      const resultRow = await upsertNewsArticle(input, existingArticle?.id);
      importedIds.push(resultRow.id);

      if (existingArticle) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      query,
      createdCount,
      updatedCount,
      skippedCount,
      importedCount: createdCount + updatedCount,
      ids: importedIds,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return makeResponseError(error.issues[0]?.message || "Invalid import payload", 400);
    }

    const message = error instanceof Error ? error.message : "Failed to import hot news";

    console.error("[Admin News API] Failed to import Tavily hot news:", error);

    if (message.includes("Tavily API key is not configured")) {
      return makeResponseError(message, 503);
    }

    return makeResponseError("Failed to import hot news", 500);
  }
}

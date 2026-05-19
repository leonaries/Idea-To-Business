import { createHash } from "node:crypto";

import type {
  AdminCompanyListItem,
  AdminProductListItem,
  NewsArticleInput,
} from "@/lib/industry-shared";
import { newsCategories } from "@/lib/industry-shared";

import { DEFAULT_TAVILY_NEWS_QUERY } from "@/lib/tavily-config";

export interface TavilySearchResult {
  title?: string | null;
  url?: string | null;
  content?: string | null;
  raw_content?: string | null;
  score?: number | null;
  published_date?: string | null;
  publishedDate?: string | null;
  publishedAt?: string | null;
  answer?: string | null;
}

export interface TavilySearchResponse {
  query?: string;
  answer?: string;
  results?: TavilySearchResult[];
  response_time?: number;
}

export interface TavilySearchRequest {
  apiKey: string;
  baseUrl: string;
  query: string;
  maxResults?: number;
  topic?: "general" | "news" | "finance";
  searchDepth?: "basic" | "advanced";
  timeRange?: "day" | "week" | "month" | "year" | "d" | "w" | "m" | "y";
}

export interface TavilyNewsImportContext {
  query?: string;
  index: number;
  publishStatus?: "published" | "draft";
  products: NewsMatchingProduct[];
  companies: NewsMatchingCompany[];
}

export type NewsMatchingProduct = Pick<
  AdminProductListItem,
  | "id"
  | "name"
  | "companyName"
  | "category"
  | "subCategory"
  | "industries"
  | "capabilities"
  | "tags"
>;

export type NewsMatchingCompany = Pick<
  AdminCompanyListItem,
  "id" | "name" | "type" | "country" | "city" | "domains" | "tags"
>;

type TavilyNewsCategory = (typeof newsCategories)[number];

const keywordGroups: Array<{ category: TavilyNewsCategory; keywords: string[] }> = [
  {
    category: "融资动态",
    keywords: ["融资", "funding", "financing", "投资", "募资", "估值", "领投", "跟投", "round"],
  },
  {
    category: "政策趋势",
    keywords: ["政策", "标准", "法规", "监管", "准入", "条例", "通知", "白皮书", "policy", "standard"],
  },
  {
    category: "产品发布",
    keywords: ["发布", "推出", "上线", "首发", "新品", "量产", "launch", "release", "debut"],
  },
  {
    category: "应用案例",
    keywords: ["落地", "试点", "部署", "应用", "案例", "示范", "交付", "场景", "customer", "deployment", "warehouse", "pilot"],
  },
];

const tagDictionary: Array<{ tag: string; keywords: string[] }> = [
  { tag: "具身智能", keywords: ["具身智能", "embodied ai"] },
  { tag: "人形机器人", keywords: ["人形机器人", "humanoid robot", "humanoid"] },
  { tag: "机器人", keywords: ["机器人", "robot"] },
  { tag: "融资", keywords: ["融资", "funding", "investment", "investor"] },
  { tag: "政策", keywords: ["政策", "policy", "regulation", "standard"] },
  { tag: "发布", keywords: ["发布", "推出", "launch", "release"] },
  { tag: "试点", keywords: ["试点", "pilot", "deployment"] },
  { tag: "落地", keywords: ["落地", "application", "use case", "case study"] },
  { tag: "仓储", keywords: ["仓储", "warehouse", "logistics"] },
  { tag: "巡检", keywords: ["巡检", "inspection"] },
  { tag: "视觉AI", keywords: ["视觉", "视觉 ai", "vision ai", "computer vision"] },
  { tag: "运动控制", keywords: ["运动控制", "motion control", "control"] },
  { tag: "传感器", keywords: ["传感器", "sensor"] },
  { tag: "多模态", keywords: ["多模态", "multimodal"] },
];

const sourceNoisePattern = /^(https?:\/\/)?(www\.)?/i;

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fa5]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesText(haystack: string, needle: string) {
  const normalizedNeedle = normalizeText(needle);

  if (!normalizedNeedle) {
    return false;
  }

  return haystack.includes(normalizedNeedle);
}

function stripText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function normalizeSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    for (const key of [...parsed.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "gclid" || key === "fbclid") {
        parsed.searchParams.delete(key);
      }
    }

    parsed.pathname = parsed.pathname.replace(/\/+$/, "");

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}

function getSourceName(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(sourceNoisePattern, "");
  } catch {
    return "热点来源";
  }
}

function parsePublishedAt(result: TavilySearchResult) {
  const rawValue = result.published_date ?? result.publishedDate ?? result.publishedAt;

  if (!rawValue) {
    return new Date();
  }

  const parsed = new Date(rawValue);

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeHotScore(score: number | null | undefined, index: number) {
  if (typeof score === "number" && Number.isFinite(score)) {
    if (score <= 1) {
      return Math.max(0, Math.min(100, Math.round(score * 100)));
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  return Math.max(0, 100 - index * 8);
}

function pickKeywords(query: string | undefined, title: string, content: string) {
  const tokens = new Set<string>();
  const rawPieces = [query, title, content]
    .filter(Boolean)
    .join(" ")
    .split(/[,，|/]+|\s+/)
    .map(item => item.trim())
    .filter(Boolean);

  for (const piece of rawPieces) {
    if (piece.length < 2) {
      continue;
    }

    tokens.add(piece);
  }

  return [...tokens];
}

function tokenize(value: string | null | undefined) {
  return normalizeText(value ?? "")
    .split(" ")
    .map(item => item.trim())
    .filter(Boolean);
}

function scoreTokenMatches(corpus: string, tokens: string[], pointsPerToken: number) {
  return tokens.reduce((score, token) => (token && corpus.includes(token) ? score + pointsPerToken : score), 0);
}

function scoreProductMatch(corpus: string, product: NewsMatchingProduct) {
  let score = 0;

  score += scoreTokenMatches(corpus, tokenize(product.name), 18);
  score += scoreTokenMatches(corpus, tokenize(product.companyName), 14);

  if (product.category && includesText(corpus, product.category)) {
    score += 12;
  }

  if (product.subCategory && includesText(corpus, product.subCategory)) {
    score += 10;
  }

  for (const keyword of [...product.industries, ...product.capabilities, ...product.tags]) {
    if (includesText(corpus, keyword)) {
      score += 8;
    }
  }

  return score;
}

function scoreCompanyMatch(corpus: string, company: NewsMatchingCompany) {
  let score = 0;

  score += scoreTokenMatches(corpus, tokenize(company.name), 18);

  if (company.type && includesText(corpus, company.type)) {
    score += 12;
  }

  if (company.city && includesText(corpus, company.city)) {
    score += 8;
  }

  if (company.country && includesText(corpus, company.country)) {
    score += 8;
  }

  for (const keyword of [...company.domains, ...company.tags]) {
    if (includesText(corpus, keyword)) {
      score += 8;
    }
  }

  return score;
}

function chooseTopMatches<T extends { id: string }>(
  items: T[],
  scoreFn: (item: T) => number,
  maxItems = 3,
  minScore = 18,
) {
  return items
    .map((item, index) => ({
      item,
      score: scoreFn(item),
      index,
    }))
    .filter(entry => entry.score >= minScore)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxItems)
    .map(entry => entry.item.id);
}

function buildTags(
  query: string | undefined,
  title: string,
  summary: string,
  content: string,
  category: TavilyNewsCategory,
) {
  const corpus = normalizeText([query, title, summary, content, category].filter(Boolean).join(" "));
  const tags = new Set<string>([category]);

  for (const item of tagDictionary) {
    if (item.keywords.some(keyword => includesText(corpus, keyword))) {
      tags.add(item.tag);
    }
  }

  for (const token of pickKeywords(query, title, content)) {
    const normalizedToken = normalizeText(token);

    if (!normalizedToken || normalizedToken.length < 2) {
      continue;
    }

    const keywordAlreadyAdded = [...tags].some(tag => normalizeText(tag) === normalizedToken);

    if (!keywordAlreadyAdded && tags.size < 8) {
      tags.add(token);
    }
  }

  return [...tags].slice(0, 8);
}

export function classifyTavilyNewsCategory(
  title: string,
  summary = "",
  content = "",
  query = DEFAULT_TAVILY_NEWS_QUERY,
): TavilyNewsCategory {
  const corpus = normalizeText([title, summary, content, query].filter(Boolean).join(" "));

  for (const group of keywordGroups) {
    if (group.keywords.some(keyword => includesText(corpus, keyword))) {
      return group.category;
    }
  }

  return "行业观点";
}

export function createTavilyNewsSlug(title: string, sourceUrl: string) {
  const sourceHash = createHash("sha1").update(normalizeSourceUrl(sourceUrl)).digest("hex").slice(0, 8);
  const slug = createSlug(`${title}-${getSourceName(sourceUrl)}-${sourceHash}`);

  return slug || `tavily-news-${sourceHash}`;
}

export function normalizeTavilySearchResultUrl(result: TavilySearchResult) {
  return result.url?.trim() || "";
}

export async function searchTavilyNews(request: TavilySearchRequest) {
  const response = await fetch(request.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: request.query,
      topic: request.topic ?? "news",
      search_depth: request.searchDepth ?? "basic",
      max_results: request.maxResults ?? 5,
      time_range: request.timeRange ?? "week",
      include_answer: false,
      include_raw_content: "markdown",
      auto_parameters: true,
    }),
  });

  const responseText = await response.text();
  let payload: (TavilySearchResponse & { error?: string; message?: string }) | null = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as TavilySearchResponse;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorMessage = String(
      payload && typeof payload === "object" && "error" in payload && payload.error
        ? payload.error
        : payload && typeof payload === "object" && "message" in payload && payload.message
          ? payload.message
          : responseText || `Tavily request failed with ${response.status}`,
    );

    throw new Error(errorMessage);
  }

  return Array.isArray(payload?.results) ? payload.results : [];
}

export function buildTavilyNewsArticleInput(
  result: TavilySearchResult,
  context: TavilyNewsImportContext,
): NewsArticleInput | null {
  const sourceUrl = normalizeTavilySearchResultUrl(result);
  const title = result.title?.trim();

  if (!sourceUrl || !title) {
    return null;
  }

  const sourceName = getSourceName(sourceUrl);
  const summarySource = result.content ?? result.raw_content ?? title;
  const summary = stripText(summarySource).slice(0, 180) || title;
  const articleContent = [
    stripText(result.content ?? result.raw_content ?? summarySource) || summary,
    `来源：${sourceName}${sourceUrl ? ` (${sourceUrl})` : ""}`,
    "本条资讯由 Tavily 实时热点抓取生成，适合作为行业流量入口的基础内容。",
  ]
    .join("\n\n")
    .trim();
  const category = classifyTavilyNewsCategory(title, summary, articleContent, context.query);
  const corpus = normalizeText([title, summary, articleContent, context.query, sourceName].filter(Boolean).join(" "));
  const relatedProductIds = chooseTopMatches(context.products, item => scoreProductMatch(corpus, item));
  const relatedCompanyIds = chooseTopMatches(context.companies, item => scoreCompanyMatch(corpus, item));
  const tags = buildTags(context.query, title, summary, articleContent, category);
  const publishedAt = parsePublishedAt(result).toISOString();
  const publishStatus = context.publishStatus ?? "published";

  return {
    slug: createTavilyNewsSlug(title, sourceUrl),
    title,
    summary,
    content: articleContent,
    sourceName,
    sourceUrl,
    coverImage: undefined,
    category,
    tags: tags.join(", "),
    relatedProductIds: relatedProductIds.join(", "),
    relatedCompanyIds: relatedCompanyIds.join(", "),
    publishedAt,
    publishStatus,
    hotScore: normalizeHotScore(result.score, context.index),
  };
}

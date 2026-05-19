import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/lib/db";
import { company, inquiry, newsArticle, product } from "@/lib/db/schema";
import { getActiveSessionUser } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";
import {
  getSourceLabel,
  companyInputSchema,
  inquiryInputSchema,
  inquiryUpdateSchema,
  newsArticleInputSchema,
  productInputSchema,
  type AdminCompanyListItem,
  type AdminNewsArticleListItem,
  type AdminProductListItem,
  type CompanyFilters,
  type CompanyInput,
  type IndustryCompany,
  type IndustryProduct,
  type IndustryNewsArticle,
  type InquiryInput,
  type InquiryListItem,
  type InquiryUpdateInput,
  type NewsFilters,
  type NewsArticleInput,
  type ProductInput,
  type ProductFilters,
} from "@/lib/industry-shared";

const publishedCompanyStatus = "published";
const publishedProductStatus = "published";
const publishedNewsStatus = "published";

const sampleCompanies: IndustryCompany[] = [
  {
    id: "sample-company-agibot",
    slug: "agibot",
    name: "智元机器人",
    logo: null,
    tagline: "面向工业与商业服务场景的通用具身智能企业",
    description:
      "智元机器人专注于通用机器人本体、运动控制和具身智能模型，产品覆盖人形机器人与行业解决方案。",
    type: "硬件厂商",
    domains: ["人形机器人", "运动控制", "工业服务"],
    foundedYear: 2023,
    country: "中国",
    city: "上海",
    employeeRange: "200-1000",
    fundingStage: "B",
    totalFunding: "数亿元人民币",
    website: "https://www.agibot.com",
    socialLinks: {},
    tags: ["人形机器人", "通用机器人"],
    status: publishedCompanyStatus,
    createdAt: new Date("2026-01-10T00:00:00Z"),
    updatedAt: new Date("2026-01-10T00:00:00Z"),
  },
  {
    id: "sample-company-unitree",
    slug: "unitree",
    name: "宇树科技",
    logo: null,
    tagline: "四足机器人与通用机器人平台厂商",
    description:
      "宇树科技提供四足机器人、人形机器人和运动控制技术，产品广泛用于巡检、科研、教育和商业展示。",
    type: "硬件厂商",
    domains: ["四足机器人", "人形机器人", "巡检"],
    foundedYear: 2016,
    country: "中国",
    city: "杭州",
    employeeRange: "200-1000",
    fundingStage: "C+",
    totalFunding: "未披露",
    website: "https://www.unitree.com",
    socialLinks: {},
    tags: ["四足机器人", "巡检"],
    status: publishedCompanyStatus,
    createdAt: new Date("2026-01-12T00:00:00Z"),
    updatedAt: new Date("2026-01-12T00:00:00Z"),
  },
  {
    id: "sample-company-megvii",
    slug: "megvii-robotics",
    name: "旷视机器人",
    logo: null,
    tagline: "面向物流与制造的机器人视觉和智能仓储方案",
    description:
      "旷视机器人围绕视觉 AI、仓储自动化和移动机器人调度，为物流和制造客户提供系统化解决方案。",
    type: "AI公司",
    domains: ["机器视觉", "物流", "智能仓储"],
    foundedYear: 2011,
    country: "中国",
    city: "北京",
    employeeRange: "1000+",
    fundingStage: "C+",
    totalFunding: "未披露",
    website: "https://www.megvii.com",
    socialLinks: {},
    tags: ["视觉AI", "物流"],
    status: publishedCompanyStatus,
    createdAt: new Date("2026-01-15T00:00:00Z"),
    updatedAt: new Date("2026-01-15T00:00:00Z"),
  },
];

const sampleProducts: IndustryProduct[] = [
  {
    id: "sample-product-humanoid",
    slug: "general-purpose-humanoid-robot",
    name: "通用人形机器人平台",
    coverImage: "/starter/sample.png",
    images: ["/starter/sample.png"],
    companyId: "sample-company-agibot",
    companyName: "智元机器人",
    companySlug: "agibot",
    companyType: "硬件厂商",
    category: "机器人",
    subCategory: "人形",
    industries: ["制造", "服务", "教育"],
    capabilities: ["搬运", "识别", "交互"],
    specs: {
      高度: "约 170cm",
      负载: "按项目配置",
      自由度: "多自由度全身控制",
    },
    priceRange: "100万+",
    description:
      "适合科研展示、柔性制造和服务场景验证的人形机器人平台，可按项目需求接入视觉、语音和调度系统。",
    officialUrl: "https://www.agibot.com",
    lifecycleStatus: "available",
    publishStatus: publishedProductStatus,
    tags: ["人形机器人", "通用平台", "具身智能"],
    popularity: 128,
    createdAt: new Date("2026-02-02T00:00:00Z"),
    updatedAt: new Date("2026-02-02T00:00:00Z"),
  },
  {
    id: "sample-product-quadruped",
    slug: "industrial-quadruped-inspection-robot",
    name: "工业巡检四足机器人",
    coverImage: "/starter/demo/images/preset-mystical-forest.jpg",
    images: ["/starter/demo/images/preset-mystical-forest.jpg"],
    companyId: "sample-company-unitree",
    companyName: "宇树科技",
    companySlug: "unitree",
    companyType: "硬件厂商",
    category: "机器人",
    subCategory: "四足",
    industries: ["制造", "物流", "服务"],
    capabilities: ["导航", "巡检", "识别"],
    specs: {
      载荷: "可挂载巡检传感器",
      续航: "按任务配置",
      场景: "园区、厂区、能源设施",
    },
    priceRange: "50-100万",
    description:
      "面向复杂地形和无人巡检任务的四足机器人，可集成热成像、气体检测、高清摄像头等传感器。",
    officialUrl: "https://www.unitree.com",
    lifecycleStatus: "available",
    publishStatus: publishedProductStatus,
    tags: ["四足机器人", "巡检", "移动平台"],
    popularity: 96,
    createdAt: new Date("2026-02-05T00:00:00Z"),
    updatedAt: new Date("2026-02-05T00:00:00Z"),
  },
  {
    id: "sample-product-vision-system",
    slug: "warehouse-vision-ai-system",
    name: "仓储视觉识别 AI 系统",
    coverImage: "/starter/demo/images/preset-cyberpunk-city.jpg",
    images: ["/starter/demo/images/preset-cyberpunk-city.jpg"],
    companyId: "sample-company-megvii",
    companyName: "旷视机器人",
    companySlug: "megvii-robotics",
    companyType: "AI公司",
    category: "AI系统",
    subCategory: "机器视觉",
    industries: ["物流", "制造", "零售"],
    capabilities: ["识别", "导航", "交互"],
    specs: {
      部署: "私有化或云边协同",
      能力: "货物识别、路径辅助、异常检测",
      接口: "支持 API 对接",
    },
    priceRange: "10-50万",
    description:
      "用于仓储和产线场景的视觉识别系统，帮助机器人和自动化设备完成货物识别、定位和异常检测。",
    officialUrl: "https://www.megvii.com",
    lifecycleStatus: "available",
    publishStatus: publishedProductStatus,
    tags: ["机器视觉", "仓储", "AI系统"],
    popularity: 84,
    createdAt: new Date("2026-02-08T00:00:00Z"),
    updatedAt: new Date("2026-02-08T00:00:00Z"),
  },
];

const sampleNewsArticles: IndustryNewsArticle[] = [
  {
    id: "sample-news-robot-launch",
    slug: "humanoid-robot-warehouse-trial",
    title: "人形机器人进入仓储试点，具身智能落地再提速",
    summary:
      "多家厂商开始在仓储和巡检场景部署具身智能产品，围绕搬运、识别和调度的试点密度持续升高。",
    content:
      "随着仓储自动化升级，具身智能企业开始将人形机器人和多模态视觉系统引入真实业务场景。当前最先落地的路径仍然集中在搬运、巡检、拣选和辅助交互等任务，行业更关注能否形成稳定、可复制的交付方案。\n\n从产品侧看，具身智能供应商正在加速补齐传感器、控制系统和现场实施能力；从企业侧看，客户更在意整体方案、交付节奏和后续运维能力。对于正在选型的企业来说，新闻热点往往也是判断技术成熟度的重要窗口。",
    sourceName: "行业观察",
    sourceUrl: "https://example.com/news/warehouse-trial",
    coverImage: "/starter/demo/images/preset-cyberpunk-city.jpg",
    category: "应用案例",
    tags: ["人形机器人", "仓储", "试点"],
    relatedProductIds: ["sample-product-humanoid", "sample-product-vision-system"],
    relatedCompanyIds: ["sample-company-agibot", "sample-company-megvii"],
    publishedAt: new Date("2026-03-08T00:00:00Z"),
    publishStatus: publishedNewsStatus,
    hotScore: 96,
    createdAt: new Date("2026-03-08T00:00:00Z"),
    updatedAt: new Date("2026-03-08T00:00:00Z"),
  },
  {
    id: "sample-news-funding",
    slug: "embodied-ai-funding-round",
    title: "具身智能融资继续活跃，软硬件一体化团队更受关注",
    summary:
      "本轮融资热点仍集中在机器人本体、运动控制、机器视觉和具身模型的组合能力上。",
    content:
      "从投资视角看，具身智能赛道并未只看单点技术，而是越来越关注从模型、控制到整机交付的完整闭环。那些同时掌握算法、硬件和场景适配能力的团队，通常更容易拿到持续关注。\n\n对于产品和企业目录来说，这类融资新闻不仅仅是“新闻”，它还会直接影响采购方对供应商的认知和优先级，因此非常适合作为需求引导入口。",
    sourceName: "融资周报",
    sourceUrl: "https://example.com/news/funding-round",
    coverImage: "/starter/demo/images/preset-mystical-forest.jpg",
    category: "融资动态",
    tags: ["融资", "机器人本体", "视觉AI"],
    relatedProductIds: ["sample-product-humanoid"],
    relatedCompanyIds: ["sample-company-agibot", "sample-company-unitree"],
    publishedAt: new Date("2026-03-16T00:00:00Z"),
    publishStatus: publishedNewsStatus,
    hotScore: 84,
    createdAt: new Date("2026-03-16T00:00:00Z"),
    updatedAt: new Date("2026-03-16T00:00:00Z"),
  },
  {
    id: "sample-news-policy",
    slug: "robot-safety-standard-update",
    title: "机器人安全与场景准入标准更新，企业开始重新梳理部署清单",
    summary:
      "政策和标准变化会直接影响企业的部署节奏，尤其是公共空间、园区和工业现场的准入要求。",
    content:
      "当标准更新时，最先受到影响的通常不是实验室，而是已经进入真实项目的交付团队。企业需要重新评估传感器冗余、数据采集、应急机制和运维流程，这会直接影响采购决策。\n\n这类资讯对于平台来说很适合链接到“相关企业”和“相关产品”，帮助用户更快从新闻理解成可执行的选型动作。",
    sourceName: "政策观察",
    sourceUrl: "https://example.com/news/policy-update",
    coverImage: "/starter/sample.png",
    category: "政策趋势",
    tags: ["安全标准", "政策", "准入"],
    relatedProductIds: ["sample-product-quadruped"],
    relatedCompanyIds: ["sample-company-unitree"],
    publishedAt: new Date("2026-03-22T00:00:00Z"),
    publishStatus: publishedNewsStatus,
    hotScore: 72,
    createdAt: new Date("2026-03-22T00:00:00Z"),
    updatedAt: new Date("2026-03-22T00:00:00Z"),
  },
];

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

function parseList(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    // Fall back to comma-separated values for hand-edited seed data.
  }

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeCsvList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.map(item => item.trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean);
    }
  } catch {
    // Admin forms use comma/newline separated input for simple editing.
  }

  return value
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function stringifyList(value: string[] | undefined) {
  return JSON.stringify(value ?? []);
}

function getSampleRelatedCount(ids: string[], options: Array<{ id: string }>) {
  return ids.filter(id => options.some(option => option.id === id)).length;
}

function extractSourceNameFromMessage(message: string | null | undefined) {
  if (!message) {
    return null;
  }

  const match = message.match(/^咨询对象：(.+)$/m);
  return match?.[1]?.trim() || null;
}

function stripLegacySourceNameFromMessage(message: string | null | undefined) {
  if (!message) {
    return null;
  }

  const cleaned = message.replace(/^咨询对象：.+(?:\r?\n){0,2}/, "").trim();
  return cleaned || null;
}

function parseRecord(value: string | null | undefined): Record<string, string> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );
    }
  } catch {
    return {};
  }

  return {};
}

function normalizeRecordInput(value: string | Record<string, string> | null | undefined) {
  if (!value) {
    return {};
  }

  if (typeof value !== "string") {
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );
    }
  } catch {
    return Object.fromEntries(
      value
        .split(/\n/)
        .map((row: string) => row.trim())
        .filter(Boolean)
        .map((row: string) => {
          const [key, ...rest] = row.split(/[:：]/);
          return [key?.trim(), rest.join(":").trim()];
        })
        .filter((entry: (string | undefined)[]): entry is [string, string] => Boolean(entry[0] && entry[1])),
    );
  }

  return {};
}

function normalizeQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export function normalizeProductFilters(searchParams?: Record<string, string | string[] | undefined>): ProductFilters {
  return {
    query: normalizeQueryValue(searchParams?.query),
    category: normalizeQueryValue(searchParams?.category),
    industry: normalizeQueryValue(searchParams?.industry),
    capability: normalizeQueryValue(searchParams?.capability),
    priceRange: normalizeQueryValue(searchParams?.priceRange),
    sort: normalizeQueryValue(searchParams?.sort) || "latest",
  };
}

export function normalizeCompanyFilters(searchParams?: Record<string, string | string[] | undefined>): CompanyFilters {
  return {
    query: normalizeQueryValue(searchParams?.query),
    type: normalizeQueryValue(searchParams?.type),
    location: normalizeQueryValue(searchParams?.location),
    fundingStage: normalizeQueryValue(searchParams?.fundingStage),
  };
}

export function normalizeNewsFilters(searchParams?: Record<string, string | string[] | undefined>): NewsFilters {
  return {
    query: normalizeQueryValue(searchParams?.query),
    category: normalizeQueryValue(searchParams?.category),
    sort: normalizeQueryValue(searchParams?.sort) || "latest",
  };
}

function mapCompanyRow(row: typeof company.$inferSelect): IndustryCompany {
  return {
    ...row,
    domains: parseList(row.domains),
    socialLinks: parseRecord(row.socialLinks),
    tags: parseList(row.tags),
  };
}

function mapProductRow(row: typeof product.$inferSelect & {
  companyName?: string | null;
  companySlug?: string | null;
  companyType?: string | null;
}): IndustryProduct {
  return {
    ...row,
    images: parseList(row.images),
    industries: parseList(row.industries),
    capabilities: parseList(row.capabilities),
    specs: parseRecord(row.specs),
    tags: parseList(row.tags),
    companyName: row.companyName ?? null,
    companySlug: row.companySlug ?? null,
    companyType: row.companyType ?? null,
  };
}

function mapNewsRow(
  row: typeof newsArticle.$inferSelect & {
    relatedProductCount?: number | string | null;
    relatedCompanyCount?: number | string | null;
  },
): IndustryNewsArticle & {
  relatedProductCount?: number;
  relatedCompanyCount?: number;
} {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    coverImage: row.coverImage,
    category: row.category,
    tags: parseList(row.tags),
    relatedProductIds: parseList(row.relatedProductIds),
    relatedCompanyIds: parseList(row.relatedCompanyIds),
    publishedAt: row.publishedAt,
    publishStatus: row.publishStatus,
    hotScore: row.hotScore,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    relatedProductCount: row.relatedProductCount == null ? undefined : Number(row.relatedProductCount),
    relatedCompanyCount: row.relatedCompanyCount == null ? undefined : Number(row.relatedCompanyCount),
  };
}

function filterSampleProducts(filters: ProductFilters) {
  const query = filters.query?.toLowerCase();

  return sampleProducts
    .filter(item => {
      const matchesQuery = !query || [
        item.name,
        item.description ?? "",
        item.companyName ?? "",
        item.category,
        item.subCategory ?? "",
        ...item.tags,
      ].join(" ").toLowerCase().includes(query);
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesIndustry = !filters.industry || item.industries.includes(filters.industry);
      const matchesCapability = !filters.capability || item.capabilities.includes(filters.capability);
      const matchesPrice = !filters.priceRange || item.priceRange === filters.priceRange;

      return matchesQuery && matchesCategory && matchesIndustry && matchesCapability && matchesPrice;
    })
    .sort((a, b) => {
      if (filters.sort === "popular") {
        return b.popularity - a.popularity;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

function filterSampleCompanies(filters: CompanyFilters) {
  const query = filters.query?.toLowerCase();

  return sampleCompanies
    .filter(item => {
      const matchesQuery = !query || [
        item.name,
        item.tagline ?? "",
        item.description ?? "",
        item.type,
        ...item.domains,
        ...item.tags,
      ].join(" ").toLowerCase().includes(query);
      const matchesType = !filters.type || item.type === filters.type;
      const matchesLocation = !filters.location || [item.country, item.city].filter(Boolean).join(" ").includes(filters.location);
      const matchesFunding = !filters.fundingStage || item.fundingStage === filters.fundingStage;

      return matchesQuery && matchesType && matchesLocation && matchesFunding;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function filterSampleNews(filters: NewsFilters = {}) {
  const normalizedQuery = filters.query?.toLowerCase();

  return sampleNewsArticles
    .filter(item => {
      const matchesQuery = !normalizedQuery || [
        item.title,
        item.summary,
        item.content,
        item.category,
        item.sourceName ?? "",
        ...item.tags,
      ].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesCategory = !filters.category || item.category === filters.category;

      return matchesQuery && matchesCategory;
    })
    .sort((a, b) => {
      if (filters.sort === "hot") {
        return b.hotScore - a.hotScore || (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
      }

      return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
    });
}

export const getProductDirectory = cache(async (filters: ProductFilters = {}) => {
  if (!hasDatabaseUrl()) {
    return {
      products: filterSampleProducts(filters),
      total: filterSampleProducts(filters).length,
      usingSampleData: true,
    };
  }

  try {
    const conditions = [eq(product.publishStatus, publishedProductStatus)];
    const query = filters.query;

    if (query) {
      conditions.push(
        or(
          ilike(product.name, `%${query}%`),
          ilike(product.description, `%${query}%`),
          ilike(company.name, `%${query}%`),
        )!,
      );
    }

    if (filters.category) {
      conditions.push(eq(product.category, filters.category));
    }

    if (filters.industry) {
      conditions.push(ilike(product.industries, `%${filters.industry}%`));
    }

    if (filters.capability) {
      conditions.push(ilike(product.capabilities, `%${filters.capability}%`));
    }

    if (filters.priceRange) {
      conditions.push(eq(product.priceRange, filters.priceRange));
    }

    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        coverImage: product.coverImage,
        images: product.images,
        companyId: product.companyId,
        companyName: company.name,
        companySlug: company.slug,
        companyType: company.type,
        category: product.category,
        subCategory: product.subCategory,
        industries: product.industries,
        capabilities: product.capabilities,
        specs: product.specs,
        priceRange: product.priceRange,
        description: product.description,
        officialUrl: product.officialUrl,
        lifecycleStatus: product.lifecycleStatus,
        publishStatus: product.publishStatus,
        tags: product.tags,
        popularity: product.popularity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .leftJoin(company, eq(product.companyId, company.id))
      .where(and(...conditions))
      .orderBy(filters.sort === "popular" ? desc(product.popularity) : desc(product.createdAt))
      .limit(100);

    const products = rows.map(mapProductRow);

    return {
      products,
      total: products.length,
      usingSampleData: products.length === 0,
    };
  } catch (error) {
    console.error("[Industry] Failed to load products:", error);
    const products = filterSampleProducts(filters);

    return {
      products,
      total: products.length,
      usingSampleData: true,
    };
  }
});

export const getCompanyDirectory = cache(async (filters: CompanyFilters = {}) => {
  if (!hasDatabaseUrl()) {
    return {
      companies: filterSampleCompanies(filters),
      total: filterSampleCompanies(filters).length,
      usingSampleData: true,
    };
  }

  try {
    const conditions = [eq(company.status, publishedCompanyStatus)];
    const query = filters.query;

    if (query) {
      conditions.push(
        or(
          ilike(company.name, `%${query}%`),
          ilike(company.tagline, `%${query}%`),
          ilike(company.description, `%${query}%`),
          ilike(company.domains, `%${query}%`),
        )!,
      );
    }

    if (filters.type) {
      conditions.push(eq(company.type, filters.type));
    }

    if (filters.location) {
      conditions.push(
        or(
          ilike(company.country, `%${filters.location}%`),
          ilike(company.city, `%${filters.location}%`),
        )!,
      );
    }

    if (filters.fundingStage) {
      conditions.push(eq(company.fundingStage, filters.fundingStage));
    }

    const rows = await db
      .select()
      .from(company)
      .where(and(...conditions))
      .orderBy(desc(company.createdAt))
      .limit(100);

    const companies = rows.map(mapCompanyRow);

    return {
      companies,
      total: companies.length,
      usingSampleData: companies.length === 0,
    };
  } catch (error) {
    console.error("[Industry] Failed to load companies:", error);
    const companies = filterSampleCompanies(filters);

    return {
      companies,
      total: companies.length,
      usingSampleData: true,
    };
  }
});

export const getNewsDirectory = cache(async (filters: NewsFilters = {}) => {
  if (!hasDatabaseUrl()) {
    const articles = filterSampleNews(filters);

    return {
      articles,
      total: articles.length,
      usingSampleData: true,
    };
  }

  try {
    const conditions = [eq(newsArticle.publishStatus, publishedNewsStatus)];
    const query = filters.query;

    if (query) {
      conditions.push(
        or(
          ilike(newsArticle.title, `%${query}%`),
          ilike(newsArticle.summary, `%${query}%`),
          ilike(newsArticle.content, `%${query}%`),
          ilike(newsArticle.sourceName, `%${query}%`),
          ilike(newsArticle.tags, `%${query}%`),
        )!,
      );
    }

    if (filters.category) {
      conditions.push(eq(newsArticle.category, filters.category));
    }

    const rows = await db
      .select()
      .from(newsArticle)
      .where(and(...conditions))
      .orderBy(filters.sort === "hot" ? desc(newsArticle.hotScore) : desc(newsArticle.publishedAt))
      .limit(100);

    const articles = rows.map(mapNewsRow);

    return {
      articles,
      total: articles.length,
      usingSampleData: false,
    };
  } catch (error) {
    console.error("[Industry] Failed to load news:", error);
    const articles = filterSampleNews(filters);

    return {
      articles,
      total: articles.length,
      usingSampleData: true,
    };
  }
});

export const getProductBySlug = cache(async (slug: string) => {
  const sample = sampleProducts.find(item => item.slug === slug);

  if (!hasDatabaseUrl()) {
    return sample ?? null;
  }

  try {
    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        coverImage: product.coverImage,
        images: product.images,
        companyId: product.companyId,
        companyName: company.name,
        companySlug: company.slug,
        companyType: company.type,
        category: product.category,
        subCategory: product.subCategory,
        industries: product.industries,
        capabilities: product.capabilities,
        specs: product.specs,
        priceRange: product.priceRange,
        description: product.description,
        officialUrl: product.officialUrl,
        lifecycleStatus: product.lifecycleStatus,
        publishStatus: product.publishStatus,
        tags: product.tags,
        popularity: product.popularity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .leftJoin(company, eq(product.companyId, company.id))
      .where(and(eq(product.slug, slug), eq(product.publishStatus, publishedProductStatus)))
      .limit(1);

    return rows[0] ? mapProductRow(rows[0]) : sample ?? null;
  } catch (error) {
    console.error("[Industry] Failed to load product:", error);
    return sample ?? null;
  }
});

export const getCompanyBySlug = cache(async (slug: string) => {
  const sample = sampleCompanies.find(item => item.slug === slug);

  if (!hasDatabaseUrl()) {
    return sample ?? null;
  }

  try {
    const rows = await db
      .select()
      .from(company)
      .where(and(eq(company.slug, slug), eq(company.status, publishedCompanyStatus)))
      .limit(1);

    return rows[0] ? mapCompanyRow(rows[0]) : sample ?? null;
  } catch (error) {
    console.error("[Industry] Failed to load company:", error);
    return sample ?? null;
  }
});

export const getNewsArticleBySlug = cache(async (slug: string) => {
  const sample = sampleNewsArticles.find(item => item.slug === slug);

  if (!hasDatabaseUrl()) {
    return sample ?? null;
  }

  try {
    const rows = await db
      .select()
      .from(newsArticle)
      .where(and(eq(newsArticle.slug, slug), eq(newsArticle.publishStatus, publishedNewsStatus)))
      .limit(1);

    return rows[0] ? mapNewsRow(rows[0]) : sample ?? null;
  } catch (error) {
    console.error("[Industry] Failed to load news article:", error);
    return sample ?? null;
  }
});

export const getProductsForCompany = cache(async (companyId: string) => {
  if (companyId.startsWith("sample-")) {
    return sampleProducts.filter(item => item.companyId === companyId);
  }

  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        coverImage: product.coverImage,
        images: product.images,
        companyId: product.companyId,
        companyName: company.name,
        companySlug: company.slug,
        companyType: company.type,
        category: product.category,
        subCategory: product.subCategory,
        industries: product.industries,
        capabilities: product.capabilities,
        specs: product.specs,
        priceRange: product.priceRange,
        description: product.description,
        officialUrl: product.officialUrl,
        lifecycleStatus: product.lifecycleStatus,
        publishStatus: product.publishStatus,
        tags: product.tags,
        popularity: product.popularity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .leftJoin(company, eq(product.companyId, company.id))
      .where(and(eq(product.companyId, companyId), eq(product.publishStatus, publishedProductStatus)))
      .orderBy(desc(product.createdAt))
      .limit(12);

    return rows.map(mapProductRow);
  } catch (error) {
    console.error("[Industry] Failed to load company products:", error);
    return [];
  }
});

export const getRelatedProducts = cache(async (currentProduct: IndustryProduct) => {
  const sampleRelated = sampleProducts
    .filter(item => item.id !== currentProduct.id && (item.companyId === currentProduct.companyId || item.category === currentProduct.category))
    .slice(0, 3);

  if (currentProduct.id.startsWith("sample-") || !hasDatabaseUrl()) {
    return sampleRelated;
  }

  try {
    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        coverImage: product.coverImage,
        images: product.images,
        companyId: product.companyId,
        companyName: company.name,
        companySlug: company.slug,
        companyType: company.type,
        category: product.category,
        subCategory: product.subCategory,
        industries: product.industries,
        capabilities: product.capabilities,
        specs: product.specs,
        priceRange: product.priceRange,
        description: product.description,
        officialUrl: product.officialUrl,
        lifecycleStatus: product.lifecycleStatus,
        publishStatus: product.publishStatus,
        tags: product.tags,
        popularity: product.popularity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .leftJoin(company, eq(product.companyId, company.id))
      .where(
        and(
          eq(product.publishStatus, publishedProductStatus),
          sql`${product.id} <> ${currentProduct.id}`,
          or(eq(product.companyId, currentProduct.companyId ?? ""), eq(product.category, currentProduct.category)),
        ),
      )
      .orderBy(desc(product.popularity))
      .limit(3);

    return rows.map(mapProductRow);
  } catch (error) {
    console.error("[Industry] Failed to load related products:", error);
    return sampleRelated;
  }
});

export const getRelatedProductsByIds = cache(async (productIds: string[]) => {
  if (productIds.length === 0) {
    return [];
  }

  if (productIds.some(id => id.startsWith("sample-")) || !hasDatabaseUrl()) {
    return productIds
      .map(id => sampleProducts.find(item => item.id === id))
      .filter((item): item is IndustryProduct => Boolean(item));
  }

  try {
    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        coverImage: product.coverImage,
        images: product.images,
        companyId: product.companyId,
        companyName: company.name,
        companySlug: company.slug,
        companyType: company.type,
        category: product.category,
        subCategory: product.subCategory,
        industries: product.industries,
        capabilities: product.capabilities,
        specs: product.specs,
        priceRange: product.priceRange,
        description: product.description,
        officialUrl: product.officialUrl,
        lifecycleStatus: product.lifecycleStatus,
        publishStatus: product.publishStatus,
        tags: product.tags,
        popularity: product.popularity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .leftJoin(company, eq(product.companyId, company.id))
      .where(and(eq(product.publishStatus, publishedProductStatus), inArray(product.id, productIds)))
      .limit(6);

    return rows.map(mapProductRow);
  } catch (error) {
    console.error("[Industry] Failed to load related products by ids:", error);
    return [];
  }
});

export const getRelatedCompaniesByIds = cache(async (companyIds: string[]) => {
  if (companyIds.length === 0) {
    return [];
  }

  if (companyIds.some(id => id.startsWith("sample-")) || !hasDatabaseUrl()) {
    return companyIds
      .map(id => sampleCompanies.find(item => item.id === id))
      .filter((item): item is IndustryCompany => Boolean(item));
  }

  try {
    const rows = await db
      .select()
      .from(company)
      .where(and(eq(company.status, publishedCompanyStatus), inArray(company.id, companyIds)))
      .limit(6);

    return rows.map(mapCompanyRow);
  } catch (error) {
    console.error("[Industry] Failed to load related companies by ids:", error);
    return [];
  }
});

export const getPlatformStats = cache(async () => {
  if (!hasDatabaseUrl()) {
    return {
      companies: sampleCompanies.length,
      products: sampleProducts.length,
      inquiries: 0,
    };
  }

  try {
    const [companyCount, productCount, inquiryCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(company).where(eq(company.status, publishedCompanyStatus)),
      db.select({ count: sql<number>`count(*)` }).from(product).where(eq(product.publishStatus, publishedProductStatus)),
      db.select({ count: sql<number>`count(*)` }).from(inquiry),
    ]);

    return {
      companies: Number(companyCount[0]?.count ?? 0),
      products: Number(productCount[0]?.count ?? 0),
      inquiries: Number(inquiryCount[0]?.count ?? 0),
    };
  } catch (error) {
    console.error("[Industry] Failed to load stats:", error);
    return {
      companies: sampleCompanies.length,
      products: sampleProducts.length,
      inquiries: 0,
    };
  }
});

export async function getAdminNewsArticles(): Promise<AdminNewsArticleListItem[]> {
  if (!hasDatabaseUrl()) {
    return sampleNewsArticles.map(item => ({
      ...item,
      relatedProductCount: getSampleRelatedCount(item.relatedProductIds, sampleProducts),
      relatedCompanyCount: getSampleRelatedCount(item.relatedCompanyIds, sampleCompanies),
    }));
  }

  try {
    const rows = await db
      .select()
      .from(newsArticle)
      .orderBy(desc(newsArticle.updatedAt))
      .limit(200);

    return rows.map(row => {
      const article = mapNewsRow(row);

      return {
        ...article,
        relatedProductCount: article.relatedProductIds.length,
        relatedCompanyCount: article.relatedCompanyIds.length,
      };
    });
  } catch (error) {
    console.error("[Industry] Failed to load admin news:", error);
    return [];
  }
}

export async function upsertNewsArticle(input: NewsArticleInput, articleId?: string) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const parsed = newsArticleInputSchema.parse(input);
  const now = new Date();
  const existingArticle = articleId
    ? (
        await db
          .select({
            publishedAt: newsArticle.publishedAt,
          })
          .from(newsArticle)
          .where(eq(newsArticle.id, articleId))
          .limit(1)
      )[0] ?? null
    : null;
  const publishedAt = parsed.publishedAt
    ? new Date(parsed.publishedAt)
    : parsed.publishStatus === publishedNewsStatus
      ? existingArticle?.publishedAt ?? now
      : null;
  const values = {
    slug: createSlug(parsed.slug),
    title: parsed.title,
    summary: parsed.summary,
    content: parsed.content,
    sourceName: parsed.sourceName || null,
    sourceUrl: parsed.sourceUrl || null,
    coverImage: parsed.coverImage || null,
    category: parsed.category,
    tags: stringifyList(normalizeCsvList(parsed.tags)),
    relatedProductIds: stringifyList(normalizeCsvList(parsed.relatedProductIds)),
    relatedCompanyIds: stringifyList(normalizeCsvList(parsed.relatedCompanyIds)),
    publishedAt,
    publishStatus: parsed.publishStatus,
    hotScore: parsed.hotScore,
    updatedAt: now,
  };

  if (articleId) {
    await db.update(newsArticle).set(values).where(eq(newsArticle.id, articleId));
    return { id: articleId };
  }

  const id = crypto.randomUUID();
  await db.insert(newsArticle).values({
    id,
    ...values,
  });

  return { id };
}

export async function createInquiry(input: InquiryInput, headersList?: Headers) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const access = headersList ? await getActiveSessionUser(headersList) : null;
  const parsed = inquiryInputSchema.parse(input);
  const inquiryId = crypto.randomUUID();

  await db.insert(inquiry).values({
    id: inquiryId,
    userId: access?.ok ? access.user.id : null,
    sourceType: parsed.sourceType,
    sourceId: parsed.sourceId || null,
    sourceName: parsed.sourceName || null,
    name: parsed.name,
    companyName: parsed.companyName || null,
    email: parsed.email,
    phone: parsed.phone || null,
    industry: parsed.industry || null,
    scenario: parsed.scenario,
    budgetRange: parsed.budgetRange || null,
    message: parsed.message || null,
    status: "new",
  });

  await notifyAdminForInquiry({ id: inquiryId, ...parsed });

  return { id: inquiryId };
}

export const getInquirySummary = cache(async () => {
  if (!hasDatabaseUrl()) {
    return {
      total: 0,
      newCount: 0,
      inProgressCount: 0,
      contactedCount: 0,
      closedCount: 0,
    };
  }

  try {
    const rows = await db
      .select({
        status: inquiry.status,
        count: sql<number>`count(*)`,
      })
      .from(inquiry)
      .groupBy(inquiry.status);

    const summary = {
      total: 0,
      newCount: 0,
      inProgressCount: 0,
      contactedCount: 0,
      closedCount: 0,
    };

    for (const row of rows) {
      const count = Number(row.count ?? 0);
      summary.total += count;

      switch (row.status) {
        case "new":
          summary.newCount = count;
          break;
        case "in_progress":
          summary.inProgressCount = count;
          break;
        case "contacted":
          summary.contactedCount = count;
          break;
        case "closed":
          summary.closedCount = count;
          break;
        default:
          break;
      }
    }

    return summary;
  } catch (error) {
    console.error("[Industry] Failed to load inquiry summary:", error);
    return {
      total: 0,
      newCount: 0,
      inProgressCount: 0,
      contactedCount: 0,
      closedCount: 0,
    };
  }
});

async function notifyAdminForInquiry(input: InquiryInput & { id: string }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!adminEmail) {
    console.warn("[Inquiry] ADMIN_NOTIFICATION_EMAIL is not configured; skipping notification");
    return;
  }

  const result = await sendEmail({
    to: adminEmail,
    subject: `新的具身智能需求线索：${input.name}`,
    replyTo: input.email,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; line-height: 1.7;">
        <h1 style="font-size: 22px;">新的需求线索</h1>
        <p><strong>线索 ID：</strong>${input.id}</p>
        <p><strong>姓名：</strong>${input.name}</p>
        <p><strong>公司：</strong>${input.companyName || "-"}</p>
        <p><strong>邮箱：</strong>${input.email}</p>
        <p><strong>手机：</strong>${input.phone || "-"}</p>
        <p><strong>行业：</strong>${input.industry || "-"}</p>
        <p><strong>预算：</strong>${input.budgetRange || "-"}</p>
        <p><strong>来源：</strong>${input.sourceType}${input.sourceId ? ` / ${input.sourceId}` : ""}</p>
        <p><strong>咨询对象：</strong>${input.sourceName || "-"}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p><strong>需求场景：</strong></p>
        <p>${input.scenario}</p>
        ${input.message ? `<p><strong>补充说明：</strong></p><p>${input.message}</p>` : ""}
      </div>
    `,
  });

  if (!result.success) {
    console.warn("[Inquiry] Failed to send admin notification", result.error);
  }
}

export async function getAdminInquiries(status?: string): Promise<InquiryListItem[]> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const conditions = status && status !== "all" ? [eq(inquiry.status, status)] : [];

  try {
    const rows = await db
      .select()
      .from(inquiry)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(inquiry.createdAt))
      .limit(100);

    return rows.map(row => ({
      id: row.id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      sourceLabel: getSourceLabel(row.sourceType),
      sourceName: row.sourceName || extractSourceNameFromMessage(row.message),
      name: row.name,
      companyName: row.companyName,
      email: row.email,
      phone: row.phone,
      industry: row.industry,
      scenario: row.scenario,
      budgetRange: row.budgetRange,
      message: stripLegacySourceNameFromMessage(row.message),
      status: row.status,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    console.error("[Industry] Failed to load inquiries:", error);
    return [];
  }
}

export async function updateInquiryStatus(inquiryId: string, input: InquiryUpdateInput) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const parsed = inquiryUpdateSchema.parse(input);

  await db
    .update(inquiry)
    .set({
      status: parsed.status,
      adminNotes: parsed.adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(inquiry.id, inquiryId));

  return { success: true };
}

export async function getAdminCompanies(): Promise<AdminCompanyListItem[]> {
  if (!hasDatabaseUrl()) {
    return sampleCompanies.map(item => ({
      ...item,
      productCount: sampleProducts.filter(productItem => productItem.companyId === item.id).length,
    }));
  }

  try {
    const rows = await db
      .select({
        id: company.id,
        slug: company.slug,
        name: company.name,
        logo: company.logo,
        tagline: company.tagline,
        description: company.description,
        type: company.type,
        domains: company.domains,
        foundedYear: company.foundedYear,
        country: company.country,
        city: company.city,
        employeeRange: company.employeeRange,
        fundingStage: company.fundingStage,
        totalFunding: company.totalFunding,
        website: company.website,
        socialLinks: company.socialLinks,
        tags: company.tags,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        productCount: sql<number>`count(${product.id})`,
      })
      .from(company)
      .leftJoin(product, eq(product.companyId, company.id))
      .groupBy(company.id)
      .orderBy(desc(company.updatedAt))
      .limit(200);

    return rows.map(row => ({
      ...mapCompanyRow(row),
      productCount: Number(row.productCount ?? 0),
    }));
  } catch (error) {
    console.error("[Industry] Failed to load admin companies:", error);
    return [];
  }
}

export async function getAdminCompanyOptions() {
  if (!hasDatabaseUrl()) {
    return sampleCompanies.map(item => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      status: item.status,
    }));
  }

  try {
    return await db
      .select({
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: company.status,
      })
      .from(company)
      .orderBy(desc(company.updatedAt))
      .limit(200);
  } catch (error) {
    console.error("[Industry] Failed to load company options:", error);
    return [];
  }
}

export async function getAdminProducts(): Promise<AdminProductListItem[]> {
  if (!hasDatabaseUrl()) {
    return sampleProducts.map(item => ({
      ...item,
      companyStatus: sampleCompanies.find(companyItem => companyItem.id === item.companyId)?.status ?? null,
    }));
  }

  try {
    const rows = await db
      .select({
        id: product.id,
        slug: product.slug,
        name: product.name,
        coverImage: product.coverImage,
        images: product.images,
        companyId: product.companyId,
        companyName: company.name,
        companySlug: company.slug,
        companyType: company.type,
        companyStatus: company.status,
        category: product.category,
        subCategory: product.subCategory,
        industries: product.industries,
        capabilities: product.capabilities,
        specs: product.specs,
        priceRange: product.priceRange,
        description: product.description,
        officialUrl: product.officialUrl,
        lifecycleStatus: product.lifecycleStatus,
        publishStatus: product.publishStatus,
        tags: product.tags,
        popularity: product.popularity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .from(product)
      .leftJoin(company, eq(product.companyId, company.id))
      .orderBy(desc(product.updatedAt))
      .limit(200);

    return rows.map(row => ({
      ...mapProductRow(row),
      companyStatus: row.companyStatus ?? null,
    }));
  } catch (error) {
    console.error("[Industry] Failed to load admin products:", error);
    return [];
  }
}

export async function upsertCompany(input: CompanyInput, companyId?: string) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const parsed = companyInputSchema.parse(input);
  const now = new Date();
  const values = {
    slug: createSlug(parsed.slug),
    name: parsed.name,
    logo: parsed.logo || null,
    tagline: parsed.tagline || null,
    description: parsed.description || null,
    type: parsed.type,
    domains: stringifyList(normalizeCsvList(parsed.domains)),
    foundedYear: parsed.foundedYear ?? null,
    country: parsed.country || null,
    city: parsed.city || null,
    employeeRange: parsed.employeeRange || null,
    fundingStage: parsed.fundingStage || null,
    totalFunding: parsed.totalFunding || null,
    website: parsed.website || null,
    socialLinks: JSON.stringify(normalizeRecordInput(parsed.socialLinks)),
    tags: stringifyList(normalizeCsvList(parsed.tags)),
    status: parsed.status,
    updatedAt: now,
  };

  if (companyId) {
    await db.update(company).set(values).where(eq(company.id, companyId));
    return { id: companyId };
  }

  const id = crypto.randomUUID();
  await db.insert(company).values({
    id,
    ...values,
  });

  return { id };
}

export async function upsertProduct(input: ProductInput, productId?: string) {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const parsed = productInputSchema.parse(input);
  const now = new Date();
  const values = {
    slug: createSlug(parsed.slug),
    name: parsed.name,
    coverImage: parsed.coverImage || null,
    images: stringifyList(normalizeCsvList(parsed.images || parsed.coverImage || "")),
    companyId: parsed.companyId || null,
    category: parsed.category,
    subCategory: parsed.subCategory || null,
    industries: stringifyList(normalizeCsvList(parsed.industries)),
    capabilities: stringifyList(normalizeCsvList(parsed.capabilities)),
    specs: JSON.stringify(normalizeRecordInput(parsed.specs)),
    priceRange: parsed.priceRange || null,
    description: parsed.description || null,
    officialUrl: parsed.officialUrl || null,
    lifecycleStatus: parsed.lifecycleStatus || "available",
    publishStatus: parsed.publishStatus,
    tags: stringifyList(normalizeCsvList(parsed.tags)),
    popularity: parsed.popularity,
    updatedAt: now,
  };

  if (productId) {
    await db.update(product).set(values).where(eq(product.id, productId));
    return { id: productId };
  }

  const id = crypto.randomUUID();
  await db.insert(product).values({
    id,
    ...values,
  });

  return { id };
}

export function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function encodeListForDb(value: string[]) {
  return stringifyList(value);
}

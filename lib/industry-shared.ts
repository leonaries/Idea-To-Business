import { z } from "zod";

export const productCategories = [
  "机器人",
  "传感器",
  "AI系统",
  "控制器",
  "解决方案",
] as const;

export const productIndustries = [
  "制造",
  "医疗",
  "物流",
  "零售",
  "农业",
  "服务",
  "教育",
] as const;

export const productCapabilities = [
  "搬运",
  "识别",
  "导航",
  "抓取",
  "交互",
  "巡检",
] as const;

export const priceRanges = ["<10万", "10-50万", "50-100万", "100万+"] as const;

export const companyTypes = [
  "硬件厂商",
  "AI公司",
  "系统集成商",
  "服务商",
  "研究机构",
] as const;

export const fundingStages = [
  "种子",
  "天使",
  "A",
  "B",
  "C+",
  "已上市",
  "未融资",
] as const;

export const inquiryStatuses = ["new", "in_progress", "contacted", "closed"] as const;
export const contentStatuses = ["published", "draft"] as const;
export const newsCategories = [
  "政策趋势",
  "融资动态",
  "产品发布",
  "行业观点",
  "应用案例",
] as const;

export interface ProductFilters {
  query?: string;
  category?: string;
  industry?: string;
  capability?: string;
  priceRange?: string;
  sort?: string;
}

export interface CompanyFilters {
  query?: string;
  type?: string;
  location?: string;
  fundingStage?: string;
}

export interface NewsFilters {
  query?: string;
  category?: string;
  sort?: string;
}

export interface IndustryCompany {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  tagline: string | null;
  description: string | null;
  type: string;
  domains: string[];
  foundedYear: number | null;
  country: string | null;
  city: string | null;
  employeeRange: string | null;
  fundingStage: string | null;
  totalFunding: string | null;
  website: string | null;
  socialLinks: Record<string, string>;
  tags: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndustryProduct {
  id: string;
  slug: string;
  name: string;
  coverImage: string | null;
  images: string[];
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  companyType: string | null;
  category: string;
  subCategory: string | null;
  industries: string[];
  capabilities: string[];
  specs: Record<string, string>;
  priceRange: string | null;
  description: string | null;
  officialUrl: string | null;
  lifecycleStatus: string;
  publishStatus: string;
  tags: string[];
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InquiryListItem {
  id: string;
  sourceType: string;
  sourceId: string | null;
  sourceLabel: string;
  sourceName: string | null;
  name: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  scenario: string;
  budgetRange: string | null;
  message: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminProductListItem extends IndustryProduct {
  companyStatus: string | null;
}

export interface AdminCompanyListItem extends IndustryCompany {
  productCount: number;
}

export interface IndustryNewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  sourceName: string | null;
  sourceUrl: string | null;
  coverImage: string | null;
  category: string;
  tags: string[];
  relatedProductIds: string[];
  relatedCompanyIds: string[];
  publishedAt: Date | null;
  publishStatus: string;
  hotScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminNewsArticleListItem extends IndustryNewsArticle {
  relatedProductCount: number;
  relatedCompanyCount: number;
}

export const inquiryInputSchema = z.object({
  sourceType: z.enum(["general", "product", "company", "news"]).default("general"),
  sourceId: z.string().optional().nullable(),
  sourceName: z.string().trim().optional(),
  name: z.string().trim().min(2, "请输入姓名"),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email("请输入有效邮箱"),
  phone: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  scenario: z.string().trim().min(8, "请简单描述需求场景"),
  budgetRange: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

export type InquiryInput = z.infer<typeof inquiryInputSchema>;

export const inquiryUpdateSchema = z.object({
  status: z.enum(inquiryStatuses),
  adminNotes: z.string().trim().optional(),
});

export type InquiryUpdateInput = z.infer<typeof inquiryUpdateSchema>;

export const productInputSchema = z.object({
  slug: z.string().trim().min(2, "请输入产品 slug"),
  name: z.string().trim().min(2, "请输入产品名称"),
  coverImage: z.string().trim().optional(),
  images: z.string().trim().optional(),
  companyId: z.string().trim().optional().nullable(),
  category: z.string().trim().min(2, "请输入产品类型"),
  subCategory: z.string().trim().optional(),
  industries: z.string().trim().optional(),
  capabilities: z.string().trim().optional(),
  specs: z.string().trim().optional(),
  priceRange: z.string().trim().optional(),
  description: z.string().trim().optional(),
  officialUrl: z.string().trim().optional(),
  lifecycleStatus: z.string().trim().default("available"),
  publishStatus: z.enum(contentStatuses).default("published"),
  tags: z.string().trim().optional(),
  popularity: z.coerce.number().int().min(0).default(0),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const companyInputSchema = z.object({
  slug: z.string().trim().min(2, "请输入企业 slug"),
  name: z.string().trim().min(2, "请输入企业名称"),
  logo: z.string().trim().optional(),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  type: z.string().trim().min(2, "请输入企业类型"),
  domains: z.string().trim().optional(),
  foundedYear: z.preprocess(
    value => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return value;
    },
    z.coerce.number().int().positive().optional(),
  ),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  employeeRange: z.string().trim().optional(),
  fundingStage: z.string().trim().optional(),
  totalFunding: z.string().trim().optional(),
  website: z.string().trim().optional(),
  socialLinks: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  status: z.enum(contentStatuses).default("published"),
});

export type CompanyInput = z.infer<typeof companyInputSchema>;

export const newsArticleInputSchema = z.object({
  slug: z.string().trim().min(2, "请输入资讯 slug"),
  title: z.string().trim().min(2, "请输入资讯标题"),
  summary: z.string().trim().min(10, "请输入资讯摘要"),
  content: z.string().trim().min(20, "请输入资讯正文"),
  sourceName: z.string().trim().optional(),
  sourceUrl: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
  category: z.enum(newsCategories),
  tags: z.string().trim().optional(),
  relatedProductIds: z.string().trim().optional(),
  relatedCompanyIds: z.string().trim().optional(),
  publishedAt: z.string().trim().optional(),
  publishStatus: z.enum(contentStatuses).default("draft"),
  hotScore: z.coerce.number().int().min(0).default(0),
});

export type NewsArticleInput = z.infer<typeof newsArticleInputSchema>;

export function getSourceLabel(sourceType: string) {
  switch (sourceType) {
    case "product":
      return "产品详情";
    case "company":
      return "企业详情";
    case "news":
      return "资讯详情";
    default:
      return "通用入口";
  }
}

export function getNewsCategoryLabel(category: string) {
  switch (category) {
    case "政策趋势":
    case "融资动态":
    case "产品发布":
    case "行业观点":
    case "应用案例":
      return category;
    default:
      return category;
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "new":
      return "新线索";
    case "in_progress":
      return "处理中";
    case "contacted":
      return "已联系";
    case "closed":
      return "已关闭";
    default:
      return status;
  }
}

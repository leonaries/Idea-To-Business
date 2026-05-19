import {
  buildTavilyNewsArticleInput,
  classifyTavilyNewsCategory,
  createTavilyNewsSlug,
} from "@/lib/tavily-news";

describe("tavily news helpers", () => {
  it("classifies funding news into the funding category", () => {
    expect(
      classifyTavilyNewsCategory(
        "Embodied AI startup closes new funding round",
        "The company raised capital to expand humanoid robot production.",
      ),
    ).toBe("融资动态");
  });

  it("creates a stable slug from the source url", () => {
    const slug = createTavilyNewsSlug(
      "Humanoid robot enters warehouse pilot",
      "https://example.com/news/humanoid-robot?utm_source=test",
    );

    expect(slug).toContain("humanoid-robot-enters-warehouse-pilot");
    expect(slug).toContain("example-com");
  });

  it("maps Tavily search results into news article input", () => {
    const article = buildTavilyNewsArticleInput(
      {
        title: "Humanoid robot pilot expands",
        url: "https://example.com/news/robot-pilot",
        content: "A humanoid robot pilot is expanding to more warehouses.",
        score: 0.92,
        published_date: "2026-05-01T00:00:00Z",
      },
      {
        query: "humanoid robot warehouse",
        index: 0,
        publishStatus: "published",
        products: [
          {
            id: "product-1",
            name: "Warehouse Humanoid Robot",
            companyName: "Example Robotics",
            category: "机器人",
            subCategory: "人形",
            industries: ["物流"],
            capabilities: ["搬运", "识别"],
            tags: ["人形机器人"],
          },
        ],
        companies: [
          {
            id: "company-1",
            name: "Example Robotics",
            type: "硬件厂商",
            country: "中国",
            city: "上海",
            domains: ["人形机器人"],
            tags: ["机器人"],
          },
        ],
      },
    );

    expect(article).toMatchObject({
      slug: expect.stringContaining("humanoid-robot-pilot-expands"),
      category: "应用案例",
      publishStatus: "published",
      hotScore: 92,
    });
    expect(article?.relatedProductIds).toContain("product-1");
    expect(article?.relatedCompanyIds).toContain("company-1");
  });
});

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { upsertNewsArticle } from "@/lib/industry-platform";
import { newsArticleInputSchema } from "@/lib/industry-shared";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ articleId: string }> },
) {
  const { articleId } = await props.params;

  try {
    await requireAdmin();

    const body = await request.json();
    const input = newsArticleInputSchema.parse(body);
    await upsertNewsArticle(input, articleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid news update" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update news article";
    const status = message.includes("DATABASE_URL") ? 503 : 500;

    console.error("[Admin News API] Failed to update news article:", error);

    return NextResponse.json(
      { error: status === 503 ? "Database is not configured" : "Failed to update news article" },
      { status },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { upsertProduct } from "@/lib/industry-platform";
import { productInputSchema } from "@/lib/industry-shared";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ productId: string }> },
) {
  const { productId } = await props.params;

  try {
    await requireAdmin();

    const body = await request.json();
    const input = productInputSchema.parse(body);
    await upsertProduct(input, productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid product update" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update product";
    const status = message.includes("DATABASE_URL") ? 503 : 500;

    console.error("[Admin Product API] Failed to update product:", error);

    return NextResponse.json(
      { error: status === 503 ? "Database is not configured" : "Failed to update product" },
      { status },
    );
  }
}

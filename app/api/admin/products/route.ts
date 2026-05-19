import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { upsertProduct } from "@/lib/industry-platform";
import { productInputSchema } from "@/lib/industry-shared";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const input = productInputSchema.parse(body);
    const result = await upsertProduct(input);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid product payload" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to create product";
    const status = message.includes("DATABASE_URL") ? 503 : 500;

    console.error("[Admin Product API] Failed to create product:", error);

    return NextResponse.json(
      { error: status === 503 ? "Database is not configured" : "Failed to create product" },
      { status },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { upsertCompany } from "@/lib/industry-platform";
import { companyInputSchema } from "@/lib/industry-shared";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await props.params;

  try {
    await requireAdmin();

    const body = await request.json();
    const input = companyInputSchema.parse(body);
    await upsertCompany(input, companyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid company update" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update company";
    const status = message.includes("DATABASE_URL") ? 503 : 500;

    console.error("[Admin Company API] Failed to update company:", error);

    return NextResponse.json(
      { error: status === 503 ? "Database is not configured" : "Failed to update company" },
      { status },
    );
  }
}

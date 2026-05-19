import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { updateInquiryStatus } from "@/lib/industry-platform";
import { inquiryUpdateSchema } from "@/lib/industry-shared";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ inquiryId: string }> },
) {
  const { inquiryId } = await props.params;

  try {
    await requireAdmin();

    const body = await request.json();
    const input = inquiryUpdateSchema.parse(body);
    await updateInquiryStatus(inquiryId, input);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid inquiry update" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to update inquiry";
    const status = message.includes("DATABASE_URL") ? 503 : 500;

    console.error("[Admin Inquiry API] Failed to update inquiry:", error);

    return NextResponse.json(
      { error: status === 503 ? "Database is not configured" : "Failed to update inquiry" },
      { status },
    );
  }
}

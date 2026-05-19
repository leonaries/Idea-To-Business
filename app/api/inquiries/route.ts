import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createInquiry } from "@/lib/industry-platform";
import { inquiryInputSchema } from "@/lib/industry-shared";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = inquiryInputSchema.parse(body);
    const result = await createInquiry(input, await headers());

    return NextResponse.json({
      id: result.id,
      message: "Inquiry submitted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Invalid inquiry payload" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to submit inquiry";
    const status = message.includes("DATABASE_URL") ? 503 : 500;

    console.error("[Inquiry API] Failed to create inquiry:", error);

    return NextResponse.json(
      {
        message:
          status === 503
            ? "Database is not configured yet. Please set DATABASE_URL before accepting inquiries."
            : "Failed to submit inquiry. Please try again.",
      },
      { status },
    );
  }
}

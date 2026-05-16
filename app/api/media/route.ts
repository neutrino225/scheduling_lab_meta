import { NextRequest, NextResponse } from "next/server";
import { deleteMediaItems } from "@/lib/media/service";

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    await deleteMediaItems(ids);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

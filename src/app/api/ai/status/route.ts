import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

export function GET() {
  const provider = getProvider();
  return NextResponse.json({ enabled: Boolean(provider), provider: provider?.name ?? null });
}

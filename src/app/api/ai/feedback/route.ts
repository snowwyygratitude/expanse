import { NextResponse } from "next/server";
import { getLesson } from "@/content";
import { getProvider } from "@/lib/ai/provider";
import { feedbackPrompt } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const lesson = typeof body.lessonId === "string" ? getLesson(body.lessonId) : undefined;
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });

  const ex = lesson.exercise;
  const authored = "authoredResponse" in ex ? ex.authoredResponse : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const selections = Array.isArray(body.selections)
    ? body.selections.filter((s): s is string => typeof s === "string").slice(0, 6)
    : [];

  const provider = getProvider();
  if (provider && (text.length >= 3 || selections.length > 0) && authored) {
    try {
      const feedback = await provider.complete(feedbackPrompt({ lesson, text, selections }));
      if (feedback) return NextResponse.json({ source: "ai", feedback });
    } catch (error) {
      console.error("[aha] feedback fell back to pre-authored text:", error);
    }
  }
  return NextResponse.json({ source: "demo", feedback: authored });
}

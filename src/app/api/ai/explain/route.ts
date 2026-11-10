import { NextResponse } from "next/server";
import { getLesson } from "@/content";
import { getProvider } from "@/lib/ai/provider";
import { explainPrompt } from "@/lib/ai/prompts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const lesson = typeof body.lessonId === "string" ? getLesson(body.lessonId) : undefined;
  if (!lesson) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });

  const provider = getProvider();
  if (provider) {
    try {
      const explanation = await provider.complete(explainPrompt(lesson));
      if (explanation) return NextResponse.json({ source: "ai", explanation });
    } catch (error) {
      console.error("[aha] explanation fell back to pre-authored text:", error);
    }
  }
  return NextResponse.json({ source: "demo", explanation: lesson.alternateExplanation });
}

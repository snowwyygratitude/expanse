import { NextResponse } from "next/server";
import { topicById, motivationById } from "@/content";
import { extractJson, getProvider } from "@/lib/ai/provider";
import { journeyPrompt } from "@/lib/ai/prompts";
import { generateJourneyDraft, sanitizeJourneyDraft, type JourneyInput } from "@/lib/journey";
import type { MotivationId, TopicId } from "@/lib/types";

function parseInput(body: unknown): JourneyInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const topics = Array.isArray(b.selectedTopics) ? b.selectedTopics : [];
  const completed = Array.isArray(b.completedLessonIds) ? b.completedLessonIds : [];
  const motivation = typeof b.growthMotivation === "string" ? b.growthMotivation : "";
  return {
    profile: {
      selectedTopics: topics.filter((t): t is TopicId => typeof t === "string" && t in topicById),
      growthMotivation: motivation in motivationById ? (motivation as MotivationId) : null,
      personalGoal: typeof b.personalGoal === "string" ? b.personalGoal.slice(0, 400) : "",
    },
    completedLessonIds: completed.filter((c): c is string => typeof c === "string"),
    avoidLessonIds: Array.isArray(b.avoidLessonIds)
      ? b.avoidLessonIds.filter((c): c is string => typeof c === "string")
      : [],
  };
}

export async function POST(request: Request) {
  const input = parseInput(await request.json().catch(() => null));
  const provider = getProvider();

  if (provider) {
    try {
      const text = await provider.complete(journeyPrompt(input));
      // Every AI-proposed lesson id is validated against the catalog.
      const draft = sanitizeJourneyDraft(extractJson(text), input);
      if (draft) return NextResponse.json({ source: "ai", draft });
    } catch (error) {
      console.error("[aha] journey generation fell back to demo logic:", error);
    }
  }
  return NextResponse.json({ source: "demo", draft: generateJourneyDraft(input) });
}

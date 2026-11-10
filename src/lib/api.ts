"use client";

import { getLesson } from "@/content";
import { generateJourneyDraft, type JourneyDraft, type JourneyInput } from "./journey";
import type { ContentSource } from "./types";

/**
 * Client helpers for the AI endpoints. Each one degrades to local,
 * pre-authored content if the server or network is unavailable, so the
 * interface never depends on a live AI connection.
 */

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function requestJourney(
  input: JourneyInput,
): Promise<{ source: ContentSource; draft: JourneyDraft }> {
  try {
    return await post("/api/ai/journey", {
      ...input.profile,
      completedLessonIds: input.completedLessonIds,
      avoidLessonIds: input.avoidLessonIds ?? [],
    });
  } catch {
    return { source: "demo", draft: generateJourneyDraft(input) };
  }
}

export async function requestFeedback(payload: {
  lessonId: string;
  text?: string;
  selections?: string[];
}): Promise<{ source: ContentSource; feedback: string }> {
  try {
    return await post("/api/ai/feedback", payload);
  } catch {
    const ex = getLesson(payload.lessonId)?.exercise;
    return {
      source: "demo",
      feedback: ex && "authoredResponse" in ex ? ex.authoredResponse : "",
    };
  }
}

export async function requestExplanation(
  lessonId: string,
): Promise<{ source: ContentSource; explanation: string }> {
  try {
    return await post("/api/ai/explain", { lessonId });
  } catch {
    return { source: "demo", explanation: getLesson(lessonId)?.alternateExplanation ?? "" };
  }
}

export async function requestAIStatus(): Promise<{ enabled: boolean; provider: string | null }> {
  try {
    const response = await fetch("/api/ai/status");
    return await response.json();
  } catch {
    return { enabled: false, provider: null };
  }
}

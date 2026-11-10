"use client";

import { getLesson } from "@/content";
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

export interface DialogueReply {
  source: ContentSource;
  /** The authored option the AI mapped a free-text message onto. */
  choiceId?: string;
  reply?: string;
}

/**
 * Asks the AI to voice the character's reaction to a chosen (or typed) line.
 * Returns `source: "demo"` when no AI is available so the caller uses the
 * authored branch as written.
 */
export async function requestDialogue(payload: {
  scenarioId: string;
  nodeId: string;
  choiceId?: string;
  freeText?: string;
  history: { who: "them" | "you"; text: string }[];
}): Promise<DialogueReply> {
  try {
    return await post("/api/ai/dialogue", payload);
  } catch {
    return { source: "demo" };
  }
}

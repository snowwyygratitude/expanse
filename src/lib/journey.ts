import { lessonById, lessons, motivationById, topicById } from "@/content";
import type {
  ContentSource,
  JourneyLesson,
  JourneyStage,
  LearningJourney,
  Lesson,
  UserProfile,
} from "./types";

export const JOURNEY_LENGTH = 5;

const STAGE_ORDER: JourneyStage[] = ["notice", "understand", "relate", "decide", "act"];

export interface JourneyInput {
  profile: Pick<UserProfile, "selectedTopics" | "growthMotivation" | "personalGoal">;
  completedLessonIds: string[];
  /** Lessons to steer away from, e.g. when asking for a different journey. */
  avoidLessonIds?: string[];
}

export interface JourneyDraft {
  title: string;
  description: string;
  lessons: JourneyLesson[];
}

function goalMatches(lesson: Lesson, goal: string): number {
  const g = goal.toLowerCase();
  if (!g.trim()) return 0;
  return lesson.keywords.filter((k) => g.includes(k)).length;
}

function scoreLesson(lesson: Lesson, input: JourneyInput): number {
  const { profile } = input;
  let score = 0;
  if (profile.selectedTopics.includes(lesson.topicId)) score += 5;
  if (profile.growthMotivation && lesson.motivations.includes(profile.growthMotivation)) score += 3;
  score += Math.min(goalMatches(lesson, profile.personalGoal), 3) * 2;
  if (input.avoidLessonIds?.includes(lesson.id)) score -= 6;
  return score;
}

export function reasonFor(lesson: Lesson, input: JourneyInput): string {
  const { profile } = input;
  const topic = topicById[lesson.topicId];
  const matches = goalMatches(lesson, profile.personalGoal);
  const picked = profile.selectedTopics.includes(lesson.topicId);
  // Only claim a goal connection when it is strong, or the lesson comes from
  // outside the chosen topics (so the goal is the real reason it's here).
  if (matches >= 2 || (matches > 0 && !picked)) {
    return `Connects to the goal you shared. ${lesson.journeyReason}`;
  }
  if (picked) {
    return `You picked ${topic.shortName}. ${lesson.journeyReason}`;
  }
  if (profile.growthMotivation && lesson.motivations.includes(profile.growthMotivation)) {
    return `Fits what brought you here. ${lesson.journeyReason}`;
  }
  return `A fresh angle from ${topic.shortName}. ${lesson.journeyReason}`;
}

function orderByStage(list: Lesson[]): Lesson[] {
  return [...list].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );
}

function describe(input: JourneyInput, picked: Lesson[]): { title: string; description: string } {
  const { profile } = input;
  const motivation = profile.growthMotivation ? motivationById[profile.growthMotivation] : null;
  const title = motivation?.journeyTitle ?? "A wander through big ideas";
  const topicNames = [...new Set(picked.map((l) => topicById[l.topicId].shortName))];
  const list =
    topicNames.length > 1
      ? `${topicNames.slice(0, -1).join(", ")} and ${topicNames[topicNames.length - 1]}`
      : topicNames[0];
  const goal = profile.personalGoal.trim();
  const description = goal
    ? `Five short lessons across ${list}, chosen with your goal in mind. They move from noticing, to understanding, to trying something small.`
    : `Five short lessons across ${list}. They move from noticing, to understanding, to trying something small.`;
  return { title, description };
}

/**
 * Deterministic journey generator. Used when no AI key is configured and as
 * the safety net behind AI output. Only ever returns real catalog lessons.
 */
export function generateJourneyDraft(input: JourneyInput): JourneyDraft {
  const completed = new Set(input.completedLessonIds);
  let pool = lessons.filter((l) => !completed.has(l.id));
  if (pool.length < JOURNEY_LENGTH) pool = lessons;

  const ranked = pool
    .map((lesson, index) => ({ lesson, index, score: scoreLesson(lesson, input) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selectedCount = input.profile.selectedTopics.length;
  const perTopicCap = selectedCount === 1 ? 3 : 2;
  const perTopic: Record<string, number> = {};
  const picked: Lesson[] = [];

  for (const { lesson } of ranked) {
    if (picked.length >= JOURNEY_LENGTH) break;
    const count = perTopic[lesson.topicId] ?? 0;
    if (count >= perTopicCap) continue;
    perTopic[lesson.topicId] = count + 1;
    picked.push(lesson);
  }
  for (const { lesson } of ranked) {
    if (picked.length >= JOURNEY_LENGTH) break;
    if (!picked.includes(lesson)) picked.push(lesson);
  }

  const ordered = orderByStage(picked);
  return {
    ...describe(input, ordered),
    lessons: ordered.map((lesson) => ({
      lessonId: lesson.id,
      reason: reasonFor(lesson, input),
    })),
  };
}

/**
 * Validates an AI-proposed journey against the catalog: drops unknown or
 * duplicate lesson IDs and tops up from the deterministic generator so the
 * result always has exactly five real lessons.
 */
export function sanitizeJourneyDraft(raw: unknown, input: JourneyInput): JourneyDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as { title?: unknown; description?: unknown; lessons?: unknown };
  if (!Array.isArray(candidate.lessons)) return null;

  const seen = new Set<string>();
  const valid: JourneyLesson[] = [];
  for (const item of candidate.lessons) {
    const id = (item as { id?: unknown; lessonId?: unknown })?.id ?? (item as { lessonId?: unknown })?.lessonId;
    const reason = (item as { reason?: unknown })?.reason;
    if (typeof id !== "string" || !lessonById[id] || seen.has(id)) continue;
    seen.add(id);
    valid.push({
      lessonId: id,
      reason:
        typeof reason === "string" && reason.trim()
          ? reason.trim().slice(0, 240)
          : reasonFor(lessonById[id], input),
    });
    if (valid.length === JOURNEY_LENGTH) break;
  }
  if (valid.length < 3) return null;

  const fallback = generateJourneyDraft(input);
  for (const item of fallback.lessons) {
    if (valid.length >= JOURNEY_LENGTH) break;
    if (!seen.has(item.lessonId)) {
      seen.add(item.lessonId);
      valid.push(item);
    }
  }

  return {
    title:
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim().slice(0, 80)
        : fallback.title,
    description:
      typeof candidate.description === "string" && candidate.description.trim()
        ? candidate.description.trim().slice(0, 320)
        : fallback.description,
    lessons: valid,
  };
}

export function draftToJourney(
  draft: JourneyDraft,
  source: ContentSource,
  completedLessonIds: string[],
): LearningJourney {
  const lessonIds = draft.lessons.map((l) => l.lessonId);
  return {
    id: `journey-${Date.now()}`,
    title: draft.title,
    description: draft.description,
    lessonIds,
    reasons: Object.fromEntries(draft.lessons.map((l) => [l.lessonId, l.reason])),
    currentLessonIndex: nextIndex(lessonIds, completedLessonIds),
    source,
    createdAt: new Date().toISOString(),
  };
}

/** Index of the first journey lesson not yet completed (or length if done). */
export function nextIndex(lessonIds: string[], completedLessonIds: string[]): number {
  const index = lessonIds.findIndex((id) => !completedLessonIds.includes(id));
  return index === -1 ? lessonIds.length : index;
}

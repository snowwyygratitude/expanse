import { lessons } from "@/content";
import type { LearningJourney, Lesson, UserProfile, UserProgress } from "./types";

function dayNumber(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** Next unfinished lesson in the journey, if any. */
export function nextJourneyLesson(
  journey: LearningJourney | null,
  progress: UserProgress,
): Lesson | undefined {
  if (!journey) return undefined;
  const id = journey.lessonIds.find((l) => !progress.completedLessonIds.includes(l));
  return lessons.find((l) => l.id === id);
}

/** Today's featured lesson: the journey's next step, else something unexplored. */
export function todaysLesson(
  journey: LearningJourney | null,
  profile: UserProfile,
  progress: UserProgress,
): Lesson {
  const next = nextJourneyLesson(journey, progress);
  if (next) return next;
  const fresh = lessons.filter((l) => !progress.completedLessonIds.includes(l.id));
  const preferred = fresh.filter((l) => profile.selectedTopics.includes(l.topicId));
  const pool = preferred.length ? preferred : fresh.length ? fresh : lessons;
  return pool[dayNumber() % pool.length];
}

/**
 * "Discover something new": an unexplored lesson from outside the journey,
 * favouring topics the user has touched least. Rotates daily.
 */
export function discoveryLesson(
  journey: LearningJourney | null,
  profile: UserProfile,
  progress: UserProgress,
  excludeId?: string,
): Lesson | undefined {
  const inJourney = new Set(journey?.lessonIds ?? []);
  const touched: Record<string, number> = {};
  for (const id of progress.completedLessonIds) {
    const lesson = lessons.find((l) => l.id === id);
    if (lesson) touched[lesson.topicId] = (touched[lesson.topicId] ?? 0) + 1;
  }
  const candidates = lessons.filter(
    (l) =>
      !progress.completedLessonIds.includes(l.id) && !inJourney.has(l.id) && l.id !== excludeId,
  );
  if (!candidates.length) return undefined;
  const score = (l: Lesson) =>
    (touched[l.topicId] ?? 0) * 2 + (profile.selectedTopics.includes(l.topicId) ? 1 : 0);
  const min = Math.min(...candidates.map(score));
  const pool = candidates.filter((l) => score(l) === min);
  return pool[dayNumber() % pool.length];
}

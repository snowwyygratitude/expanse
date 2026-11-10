import type { Lesson, TopicId } from "@/lib/types";
import { communicationLessons } from "./lessons/communication";
import { psychologyLessons } from "./lessons/psychology";
import { moneyLessons } from "./lessons/money";
import { careerLessons } from "./lessons/career";
import { creativityLessons } from "./lessons/creativity";
import { habitsLessons } from "./lessons/habits";

export * from "./topics";

/** The curated lesson library. To add a lesson, add it to a topic file. */
export const lessons: Lesson[] = [
  ...communicationLessons,
  ...psychologyLessons,
  ...moneyLessons,
  ...careerLessons,
  ...creativityLessons,
  ...habitsLessons,
];

export const lessonById: Record<string, Lesson> = Object.fromEntries(
  lessons.map((l) => [l.id, l]),
);

export function getLesson(id: string): Lesson | undefined {
  return lessonById[id];
}

export function lessonsForTopic(topicId: TopicId): Lesson[] {
  return lessons.filter((l) => l.topicId === topicId);
}

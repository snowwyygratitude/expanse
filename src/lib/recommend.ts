import { experiences, type Experience } from "@/experiences";
import type { UserProgress } from "./types";

export interface Recommendation {
  experience: Experience;
  /** Short personal reason shown on the featured card. */
  reason: string;
}

/** Picks the experience to feature, based on what the player has and hasn't done. */
export function recommend(progress: UserProgress): Recommendation {
  const plays = progress.plays;
  const unplayed = experiences.filter((e) => !plays[e.id]);
  if (unplayed.length) {
    return {
      experience: unplayed[0],
      reason: unplayed.length === experiences.length ? "Start here" : "New for you",
    };
  }

  for (const experience of experiences) {
    if (experience.kind === "dialogue") {
      const left = experience.endings.length - (plays[experience.id]?.outcomes.length ?? 0);
      if (left > 0) return { experience, reason: `${left} ending${left === 1 ? "" : "s"} you haven't seen` };
    }
    if (experience.kind === "challenges" && Number(plays[experience.id]?.detail?.tricked ?? 0) > 0) {
      return { experience, reason: "Rematch: dodge all three" };
    }
  }

  const oldest = [...experiences].sort((a, b) => plays[a.id].lastAt.localeCompare(plays[b.id].lastAt))[0];
  return { experience: oldest, reason: "Worth another go" };
}

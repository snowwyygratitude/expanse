import { trickYourBrain } from "./content/brain";
import { conversationGame } from "./content/conversation";
import { moneyPlayground } from "./content/money";
import type { Experience } from "./types";

export * from "./types";

/** The playground. Add an experience by adding its data file here. */
export const experiences: Experience[] = [conversationGame, moneyPlayground, trickYourBrain];

export const experienceById: Record<string, Experience> = Object.fromEntries(
  experiences.map((e) => [e.id, e]),
);

export const insightId = (experienceId: string) => `exp:${experienceId}`;

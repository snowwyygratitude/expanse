"use client";

import { experienceById } from "@/experiences";
import { useApp } from "@/lib/store";
import { BrainStory } from "./BrainStory";
import { ConversationStory } from "./ConversationStory";
import { MoneyStory } from "./MoneyStory";

/** Maps an experience's data to its story-mode (video-style) player. */
export function StoryHost({ id }: { id: string }) {
  const experience = experienceById[id];
  const { hydrated } = useApp();
  // Stories use randomness and timers, so they render on the client only.
  if (!hydrated) return <div className="fixed inset-0 bg-black" />;
  switch (experience.kind) {
    case "dialogue":
      return <ConversationStory scenario={experience} />;
    case "simulation":
      return <MoneyStory sim={experience} />;
    case "challenges":
      return <BrainStory set={experience} />;
  }
}

"use client";

import { experienceById } from "@/experiences";
import { useApp } from "@/lib/store";
import { ChallengePlayer } from "./ChallengePlayer";
import { DialoguePlayer } from "./DialoguePlayer";
import { themeVars } from "./PlayShell";
import { SimulationPlayer } from "./SimulationPlayer";

/** Maps an experience's data to the engine that plays it. */
export function ExperienceHost({ id }: { id: string }) {
  const experience = experienceById[id];
  const { hydrated } = useApp();
  // Experiences use randomness and saved progress, so they render on the
  // client only. Until then, show the themed backdrop to avoid a flash.
  if (!hydrated) return <div style={themeVars(experience.theme)} className="play-surface min-h-dvh" />;
  switch (experience.kind) {
    case "dialogue":
      return <DialoguePlayer scenario={experience} />;
    case "simulation":
      return <SimulationPlayer sim={experience} />;
    case "challenges":
      return <ChallengePlayer set={experience} />;
  }
}

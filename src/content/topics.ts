import type { Motivation, Topic, TopicId } from "@/lib/types";

export const topics: Topic[] = [
  {
    id: "communication",
    name: "Communication & Relationships",
    shortName: "Relationships",
    description: "Connect more meaningfully with other people.",
    icon: "messages",
    themeColor: "#D9583B",
    softColor: "#FCE6DE",
  },
  {
    id: "psychology",
    name: "Self-Understanding & Psychology",
    shortName: "Psychology",
    description: "Understand why you think, feel, and behave the way you do.",
    icon: "brain",
    themeColor: "#7556C8",
    softColor: "#EBE4FA",
  },
  {
    id: "money",
    name: "Money & Life Decisions",
    shortName: "Money",
    description: "Build a healthier relationship with money and choices.",
    icon: "coins",
    themeColor: "#2E8A66",
    softColor: "#DDF1E7",
  },
  {
    id: "career",
    name: "Career & Influence",
    shortName: "Career",
    description: "Navigate work and collaboration with greater confidence.",
    icon: "compass",
    themeColor: "#3270BF",
    softColor: "#DFEAF8",
  },
  {
    id: "creativity",
    name: "Creativity & Thinking",
    shortName: "Creativity",
    description: "See familiar situations from fresh perspectives.",
    icon: "lightbulb",
    themeColor: "#B97A0E",
    softColor: "#FBEDCB",
  },
  {
    id: "habits",
    name: "Habits & Focus",
    shortName: "Habits",
    description: "Build routines that support what matters to you.",
    icon: "sprout",
    themeColor: "#1F8A8C",
    softColor: "#D9F0EF",
  },
];

export const topicById = Object.fromEntries(
  topics.map((t) => [t.id, t]),
) as Record<TopicId, Topic>;

export const motivations: Motivation[] = [
  {
    id: "understand-myself",
    label: "Better understand myself",
    journeyTitle: "Getting to know your own mind",
  },
  {
    id: "relationships",
    label: "Improve my relationships",
    journeyTitle: "Feeling closer to the people around you",
  },
  {
    id: "decisions",
    label: "Make wiser life decisions",
    journeyTitle: "Choosing with more clarity",
  },
  {
    id: "grow",
    label: "Grow personally and professionally",
    journeyTitle: "Becoming more confident and intentional",
  },
  {
    id: "curious",
    label: "Just curious and want to explore",
    journeyTitle: "A wander through big ideas",
  },
];

export const motivationById = Object.fromEntries(
  motivations.map((m) => [m.id, m]),
) as Record<Motivation["id"], Motivation>;

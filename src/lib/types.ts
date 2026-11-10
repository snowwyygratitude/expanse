// Core data models for Aha. Lesson content lives in src/content and is
// kept fully separate from UI logic.

export type TopicId =
  | "communication"
  | "psychology"
  | "money"
  | "career"
  | "creativity"
  | "habits";

export type TopicIcon =
  | "messages"
  | "brain"
  | "coins"
  | "compass"
  | "lightbulb"
  | "sprout";

export interface Topic {
  id: TopicId;
  name: string;
  shortName: string;
  description: string;
  icon: TopicIcon;
  /** Strong topic colour (text, icons, accents). */
  themeColor: string;
  /** Soft tint used for card backgrounds. */
  softColor: string;
}

export type MotivationId =
  | "understand-myself"
  | "relationships"
  | "decisions"
  | "grow"
  | "curious";

export interface Motivation {
  id: MotivationId;
  label: string;
  journeyTitle: string;
}

/* ---------- Lesson content ---------- */

export type ContentBlock =
  | { type: "insight"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "example"; title: string; text: string }
  | { type: "list"; title?: string; items: string[] }
  | {
      type: "contrast";
      left: { label: string; text: string };
      right: { label: string; text: string };
    };

export interface ChoiceOption {
  id: string;
  text: string;
  /** Pre-authored, trade-off oriented feedback. */
  feedback: string;
}

/** Scenario decisions and thought experiments: pick an option, explore all. */
export interface ChoiceExercise {
  type: "scenario" | "thought-experiment";
  setup: string;
  quote?: string;
  question: string;
  options: ChoiceOption[];
  closing: string;
}

/** Perspective-taking: reveal how different people see the same moment. */
export interface PerspectivesExercise {
  type: "perspectives";
  setup: string;
  viewpoints: { id: string; who: string; thought: string }[];
  question: string;
  options: ChoiceOption[];
  closing: string;
}

/** Short personal reflection (free text). */
export interface ReflectionExercise {
  type: "reflection";
  prompt: string;
  helper?: string;
  placeholder: string;
  starters?: string[];
  /** Shown when no AI is configured. Cannot respond to the user's words. */
  authoredResponse: string;
}

/** Communication practice: rewrite or draft something, compare to a sample. */
export interface PracticeExercise {
  type: "practice";
  situation: string;
  original?: string;
  task: string;
  tips: string[];
  placeholder: string;
  sample: string;
  authoredResponse: string;
}

/** Pick a few items from a set, then reflect on the choice. */
export interface SelectionExercise {
  type: "selection";
  prompt: string;
  items: string[];
  pick: number;
  followUp: string;
  placeholder: string;
  authoredResponse: string;
}

/** Interactive visual model. */
export interface SimulatorExercise {
  type: "simulator";
  simulator: "compounding";
  intro: string;
  closing: string;
}

export type Exercise =
  | ChoiceExercise
  | PerspectivesExercise
  | ReflectionExercise
  | PracticeExercise
  | SelectionExercise
  | SimulatorExercise;

export interface Source {
  title: string;
  author: string;
  kind: "Book" | "Research" | "Essay" | "Talk" | "Framework";
  year?: number;
  /** How this source informed the lesson (our words, never a quotation). */
  note: string;
}

export type JourneyStage = "notice" | "understand" | "relate" | "decide" | "act";

export interface Lesson {
  id: string;
  topicId: TopicId;
  title: string;
  subtitle: string;
  objective: string;
  centralConcept: string;
  estimatedMinutes: number;
  hook: { question: string; story: string[]; cta: string };
  contentBlocks: ContentBlock[];
  /** Pre-authored alternative angle for "Explain this differently". */
  alternateExplanation: string;
  exercise: Exercise;
  /** Guidance for AI feedback. Never shown to the user. */
  feedbackGuidance: string;
  realWorldExperiment: { text: string; prompt?: string };
  keyInsight: { headline: string; text: string };
  sources: Source[];
  /** Recommendation metadata. */
  motivations: MotivationId[];
  keywords: string[];
  stage: JourneyStage;
  /** One-line reason used in journey explanations. */
  journeyReason: string;
}

/* ---------- User state ---------- */

export type ContentSource = "ai" | "demo";

export type Usefulness = "very" | "somewhat" | "not";

export interface Interaction {
  lessonId: string;
  exerciseType: Exercise["type"];
  choiceId?: string;
  selections?: string[];
  text?: string;
  at: string;
}

export interface PlayRecord {
  count: number;
  lastAt: string;
  /** Distinct outcomes reached so far (e.g. conversation endings). */
  outcomes: string[];
  detail?: Record<string, string | number | boolean>;
}

export type PlayMode = "story" | "tap";

export interface UserProgress {
  /** Preferred way to play: video-style stories or tap-through. */
  mode: PlayMode;
  /** Keyed by experience id. */
  plays: Record<string, PlayRecord>;
  /** Experience insights are stored as `exp:<id>`, lesson insights by lesson id. */
  savedInsightIds: string[];
  completedLessonIds: string[];
  interactionHistory: Interaction[];
  lessonFeedback: Record<string, Usefulness>;
  reportedExperiments: string[];
  recentLessonIds: string[];
}

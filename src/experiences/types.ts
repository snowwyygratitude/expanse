/**
 * Experience content model. Experiences are pure data; the engines in
 * src/components/play render them. Adding a new conversation, simulation or
 * set of challenges means adding data here, not new UI.
 */

export interface ExperienceTheme {
  /** Screen background gradient (from, to). */
  bg: [string, string];
  /** Text on the background. */
  fg: string;
  /** Loud accent for actions and highlights. */
  accent: string;
  /** Text placed on the accent colour. */
  accentInk: string;
  /** Raised surfaces on the background. */
  panel: string;
}

export interface Insight {
  /** Revealed only after play. */
  headline: string;
  line: string;
  /** Optional detail behind a "Why this works" expander. */
  why: string;
  sources: { title: string; author: string; year?: number }[];
  /** Existing lessons offered as optional deeper reading. */
  deeperLessonIds: string[];
}

interface ExperienceBase {
  id: string;
  title: string;
  /** One short, intriguing line for the home card. */
  teaser: string;
  minutes: number;
  art: "conversation" | "money" | "brain";
  theme: ExperienceTheme;
  insight: Insight;
}

/* ---------- Branching dialogue ---------- */

export type Mood = "hurt" | "angry" | "guarded" | "soft" | "warm" | "cold";

export interface DialogueOption {
  id: string;
  text: string;
  /** Key into `moves`: names the kind of move, shown only in the debrief. */
  move: string;
  /** Change to the connection meter. */
  delta: number;
  reaction: { mood: Mood; text: string };
  /** Next node id, a specific ending, or "resolve" to pick an ending by meter. */
  next: string | { ending: string } | "resolve";
}

export interface DialogueNode {
  id: string;
  /** What the character says to open this beat (after any reaction). */
  say?: string;
  options: DialogueOption[];
}

export interface DialogueEnding {
  id: string;
  title: string;
  mood: Mood;
  line: string;
  /** For "resolve": the highest ending whose `min` the meter reaches wins. */
  min?: number;
  tone: "great" | "ok" | "rough";
}

export interface DialogueScenario extends ExperienceBase {
  kind: "dialogue";
  character: { name: string; relation: string };
  setup: string;
  opening: { mood: Mood; lines: string[] };
  meter: { label: string; start: number; max: number };
  startNode: string;
  nodes: Record<string, DialogueNode>;
  endings: DialogueEnding[];
  moves: Record<string, { label: string; effect: "opens" | "closes" | "mixed" }>;
  /** Guardrails for AI-voiced replies. */
  aiBrief: string;
}

/* ---------- Simulation ---------- */

export interface SimParam {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  format: "usd" | "years" | "percent";
}

export interface SavingsSimulation extends ExperienceBase {
  kind: "simulation";
  model: "savings";
  endAge: number;
  challenge: {
    prompt: string;
    early: { name: string; startAge: number; monthly: number };
    late: { name: string; startAge: number };
    rate: number;
    guesses: { id: string; label: string; multiplier: number }[];
    slider: SimParam;
    reveal: string;
  };
  sandbox: {
    prompt: string;
    startAge: number;
    params: SimParam[];
    quests: { id: string; label: string; found: string }[];
  };
  assumptions: string[];
}

/* ---------- Predict and reveal ---------- */

interface ChallengeBase {
  id: string;
  title: string;
  /** Name of the bias: hidden until the reveal. */
  principle: string;
  principleLine: string;
  evidence: string;
}

export interface AnchorChallenge extends ChallengeBase {
  kind: "anchor";
  unit: string;
  subject: string;
  truth: number;
  truthNote: string;
  anchors: { high: number; low: number };
  /** Average guesses reported in the original study for each anchor. */
  studyGuesses: { high: number; low: number };
  range: [number, number];
}

export interface FrameChallenge extends ChallengeBase {
  kind: "frame";
  stake: number;
  sure: number;
  winChance: number;
  /** Share of people who gambled under each wording in the original study. */
  studyGambleRate: { gain: number; loss: number };
}

export interface SequenceChallenge extends ChallengeBase {
  kind: "sequence";
  question: string;
  sequences: { id: string; flips: string; label: string }[];
  trials: number;
}

export type Challenge = AnchorChallenge | FrameChallenge | SequenceChallenge;

export interface ChallengeSet extends ExperienceBase {
  kind: "challenges";
  challenges: Challenge[];
}

export type Experience = DialogueScenario | SavingsSimulation | ChallengeSet;

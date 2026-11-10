import type { ChallengeSet } from "../types";

export const trickYourBrain: ChallengeSet = {
  id: "brain",
  kind: "challenges",
  title: "Trick Your Brain",
  teaser: "Three traps. Your brain walks into at least one.",
  minutes: 3,
  art: "brain",
  theme: {
    bg: ["#2B1A8F", "#4527C4"],
    fg: "#F6F3FF",
    accent: "#FFD84D",
    accentInk: "#22135E",
    panel: "rgba(255,255,255,0.1)",
  },
  challenges: [
    {
      id: "tree",
      kind: "anchor",
      title: "The Tall Tree",
      unit: "ft",
      subject: "the world's tallest tree",
      truth: 380,
      truthNote: "A coast redwood named Hyperion, about 380 ft.",
      anchors: { high: 1200, low: 180 },
      studyGuesses: { high: 844, low: 282 },
      range: [50, 1500],
      principle: "Anchoring",
      principleLine: "A number you just saw drags your guess toward it, even when it's irrelevant.",
      evidence:
        "In Jacowitz & Kahneman's 1995 study, people first asked about 1,200 ft guessed 844 ft on average. Those asked about 180 ft guessed 282.",
    },
    {
      id: "fifty",
      kind: "frame",
      title: "Keep or Gamble",
      stake: 50,
      sure: 20,
      winChance: 0.4,
      studyGambleRate: { gain: 43, loss: 62 },
      principle: "Framing",
      principleLine: "“Keep $20” and “lose $30” are the same deal. The wording changes what we choose.",
      evidence:
        "In De Martino and colleagues' 2006 study in Science, people gambled about 43% of the time under “keep” wording and 62% under “lose” wording.",
    },
    {
      id: "coins",
      kind: "sequence",
      title: "Coin Streak",
      question: "A fair coin, flipped 6 times. Which result is most likely?",
      sequences: [
        { id: "messy", flips: "HTHTTH", label: "Mixed up" },
        { id: "split", flips: "HHHTTT", label: "Half and half" },
        { id: "streak", flips: "HHHHHH", label: "All heads" },
      ],
      trials: 6400,
      principle: "The randomness illusion",
      principleLine: "Each exact sequence is 1 in 64. Streaks look wrong to us, but chance doesn't care.",
      evidence:
        "Kahneman & Tversky (1972) found people judge “random-looking” sequences as more likely than orderly ones with identical odds.",
    },
  ],
  insight: {
    headline: "Knowing the trick doesn't switch it off.",
    line: "Slowing down does. The moment to pause is when an answer arrives instantly.",
    why: "These shortcuts are fast and usually useful, which is why they're hard to notice from the inside. Kahneman compared them to visual illusions: you can know the lines are equal and still see them as different.",
    sources: [
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: 2011 },
      { title: "Measures of Anchoring in Estimation Tasks", author: "Karen E. Jacowitz & Daniel Kahneman", year: 1995 },
      { title: "Frames, Biases, and Rational Decision-Making in the Human Brain", author: "Benedetto De Martino, Dharshan Kumaran, Ben Seymour & Raymond J. Dolan", year: 2006 },
      { title: "Subjective Probability: A Judgment of Representativeness", author: "Daniel Kahneman & Amos Tversky", year: 1972 },
    ],
    deeperLessonIds: ["hidden-shortcuts", "understanding-risk"],
  },
};

import type { SavingsSimulation } from "../types";

export const moneyPlayground: SavingsSimulation = {
  id: "money",
  kind: "simulation",
  model: "savings",
  title: "The Money Playground",
  teaser: "Drag time. Watch money bend.",
  minutes: 4,
  art: "money",
  theme: {
    bg: ["#0B2B22", "#0F3D2E"],
    fg: "#F1FFF6",
    accent: "#C8F560",
    accentInk: "#0B2B22",
    panel: "rgba(255,255,255,0.08)",
  },
  endAge: 65,
  challenge: {
    prompt: "Lea starts saving 10 years after Eli. How much more must she save each month to catch him by 65?",
    early: { name: "Eli", startAge: 25, monthly: 200 },
    late: { name: "Lea", startAge: 35 },
    rate: 6,
    guesses: [
      { id: "quarter", label: "25% more", multiplier: 1.25 },
      { id: "half", label: "50% more", multiplier: 1.5 },
      { id: "double", label: "Double", multiplier: 2 },
    ],
    slider: { id: "lateMonthly", label: "Lea saves per month", min: 200, max: 600, step: 10, initial: 200, format: "usd" },
    reveal: "Ten years late costs double the effort, every month, for thirty years.",
  },
  sandbox: {
    prompt: "Your turn. Try to break it.",
    startAge: 25,
    params: [
      { id: "wait", label: "Wait before starting", min: 0, max: 30, step: 1, initial: 10, format: "years" },
      { id: "monthly", label: "Saved per month", min: 50, max: 1000, step: 50, initial: 200, format: "usd" },
      { id: "rate", label: "Yearly growth", min: 0, max: 10, step: 0.5, initial: 6, format: "percent" },
    ],
    quests: [
      { id: "zero", label: "Set growth to 0%", found: "No growth, no magic. Waiting only costs what you didn't put in." },
      { id: "long-wait", label: "Wait 20+ years", found: "The late line barely leaves the ground. Time was doing the lifting." },
      { id: "wobble", label: "Roll a wobbly future", found: "Same average, very different ride. Real growth is never a smooth line." },
    ],
  },
  assumptions: [
    "Growth is a steady yearly rate, compounded monthly. Real returns jump around and can be negative.",
    "Inflation, fees and taxes are ignored, so real buying power would be lower.",
    "“Wobbly future” draws random yearly returns around your chosen average. It is one of countless possible paths.",
    "This is a toy model for building intuition. It is not financial advice.",
  ],
  insight: {
    headline: "Time is the multiplier.",
    line: "How long money sits matters more than how much you add. The curve does its real work at the end.",
    why: "Compounding is growth on previous growth, so it accelerates. Our intuition thinks in straight lines and underestimates it, a pattern researchers call exponential growth bias. The same shape appears in debt, skills and habits.",
    sources: [
      { title: "Exponential Growth Bias and Household Finance", author: "Victor Stango & Jonathan Zinman", year: 2009 },
      { title: "The Psychology of Money", author: "Morgan Housel", year: 2020 },
    ],
    deeperLessonIds: ["power-of-compounding", "money-and-happiness"],
  },
};

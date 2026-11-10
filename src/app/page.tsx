"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Shuffle, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TopicCard } from "@/components/TopicCard";
import { Button, cx, Logo } from "@/components/ui";
import { motivations, topics } from "@/content";
import { requestJourney } from "@/lib/api";
import { draftToJourney } from "@/lib/journey";
import { useApp } from "@/lib/store";
import type { MotivationId, TopicId } from "@/lib/types";

type Step = "welcome" | "motivation" | "topics" | "goal" | "generating";

const GOAL_EXAMPLES = [
  "I want to become a better communicator.",
  "I want to feel more confident managing money.",
  "I'm interested in psychology and human behavior.",
];

const GENERATING_LINES = [
  "Reading what you shared…",
  "Looking through the lesson library…",
  "Finding ideas that connect…",
  "Putting your journey in order…",
];

export default function WelcomePage() {
  const { hydrated, profile, progress, completeOnboarding } = useApp();
  const router = useRouter();
  const leaving = useRef(false);

  const [step, setStep] = useState<Step>("welcome");
  const [selected, setSelected] = useState<TopicId[]>([]);
  const [motivation, setMotivation] = useState<MotivationId | null>(null);
  const [goal, setGoal] = useState("");
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (hydrated && profile.onboardingCompleted && !leaving.current) router.replace("/home");
  }, [hydrated, profile.onboardingCompleted, router]);

  useEffect(() => {
    if (step !== "generating") return;
    const timer = setInterval(() => setLine((l) => (l + 1) % GENERATING_LINES.length), 700);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const toggleTopic = (id: TopicId) =>
    setSelected((s) => (s.includes(id) ? s.filter((t) => t !== id) : [...s, id]));

  async function generate(next: { topics: TopicId[]; motivation: MotivationId; goal: string }) {
    setStep("generating");
    const input = {
      profile: {
        selectedTopics: next.topics,
        growthMotivation: next.motivation,
        personalGoal: next.goal.trim(),
      },
      completedLessonIds: progress.completedLessonIds,
    };
    // Keep the moment visible briefly even when generation is instant.
    const [result] = await Promise.all([
      requestJourney(input),
      new Promise((resolve) => setTimeout(resolve, 1800)),
    ]);
    leaving.current = true;
    completeOnboarding(
      input.profile,
      draftToJourney(result.draft, result.source, progress.completedLessonIds),
    );
    router.push("/journey?new=1");
  }

  function surpriseMe() {
    const shuffled = [...topics].sort(() => Math.random() - 0.5).slice(0, 3);
    generate({ topics: shuffled.map((t) => t.id), motivation: "curious", goal: "" });
  }

  if (!hydrated || (profile.onboardingCompleted && !leaving.current)) {
    return <div className="min-h-dvh" />;
  }

  if (step === "generating") {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="animate-rise">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-accent-soft">
            <Sparkles className="size-8 animate-pulse text-accent" aria-hidden />
          </span>
          <h1 className="font-display mt-8 text-3xl font-semibold">Shaping your journey</h1>
          <p className="mt-3 h-6 text-ink-soft" aria-live="polite">
            {GENERATING_LINES[line]}
          </p>
        </div>
      </main>
    );
  }

  const questionIndex = step === "motivation" ? 1 : step === "topics" ? 2 : step === "goal" ? 3 : 0;
  const back: Record<Step, Step> = {
    welcome: "welcome",
    motivation: "welcome",
    topics: "motivation",
    goal: "topics",
    generating: "goal",
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pt-6 pb-36 md:px-8 md:pt-10">
      <header className="flex h-10 items-center justify-between">
        {questionIndex > 0 ? (
          <button
            type="button"
            onClick={() => setStep(back[step])}
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-sand"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <Logo />
        )}
        {questionIndex > 0 && (
          <div className="flex items-center gap-1.5" aria-label={`Question ${questionIndex} of 3`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cx(
                  "h-1.5 rounded-full transition-all duration-300",
                  n === questionIndex ? "w-8 bg-accent" : n < questionIndex ? "w-4 bg-accent/50" : "w-4 bg-line",
                )}
              />
            ))}
          </div>
        )}
        <span className="w-10" />
      </header>

      <div key={step} className="animate-step flex-1">
        {step === "welcome" && (
          <>
            <p className="mt-8 text-sm font-semibold tracking-wider text-accent uppercase md:mt-14">
              A little more insight, five minutes a day
            </p>
            <h1 className="font-display mt-3 text-[2.6rem] leading-[1.05] font-semibold text-balance md:text-6xl">
              What would you love to get better at?
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">
              Explore ideas that change how you think, connect, and live.
            </p>
            <p className="mt-8 text-sm font-medium text-ink-soft">Pick as many as you like.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  selected={selected.includes(topic.id)}
                  onToggle={() => toggleTopic(topic.id)}
                />
              ))}
            </div>
          </>
        )}

        {step === "motivation" && (
          <>
            <Question n={1} title="What brings you here?" hint="Pick the one that fits best today." />
            <div className="mt-6 grid gap-3">
              {motivations.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={motivation === m.id}
                  onClick={() => {
                    setMotivation(m.id);
                    setTimeout(() => setStep("topics"), 220);
                  }}
                  className={cx(
                    "flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left text-[17px] font-medium transition active:scale-[0.99]",
                    motivation === m.id
                      ? "border-accent bg-accent-soft"
                      : "border-transparent bg-card ring-1 ring-line hover:ring-accent",
                  )}
                >
                  {m.label}
                  <ArrowRight className="size-4 text-ink-faint" aria-hidden />
                </button>
              ))}
            </div>
          </>
        )}

        {step === "topics" && (
          <>
            <Question
              n={2}
              title="What topics interest you?"
              hint="Choose any that spark something. Your journey can weave them together."
            />
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  selected={selected.includes(topic.id)}
                  onToggle={() => toggleTopic(topic.id)}
                />
              ))}
            </div>
          </>
        )}

        {step === "goal" && (
          <>
            <Question
              n={3}
              title="How would you describe your current goal?"
              hint="Optional. A sentence in your own words helps us choose better."
            />
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="In your own words…"
              className="mt-6 w-full resize-none rounded-2xl border border-line bg-card p-4 text-[17px] leading-relaxed placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
            <p className="mt-5 text-sm font-medium text-ink-soft">Or borrow one of these:</p>
            <div className="mt-2 flex flex-col items-start gap-2">
              {GOAL_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setGoal(example)}
                  className="rounded-full bg-sand px-4 py-2 text-left text-sm text-ink-soft transition hover:bg-accent-soft hover:text-ink"
                >
                  “{example}”
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 py-4 md:px-8">
          {step === "welcome" && (
            <>
              <div className="flex gap-3">
                <Button variant="outline" onClick={surpriseMe} className="flex-1 border-accent/40 px-3 whitespace-nowrap text-accent-deep">
                  <Shuffle className="size-4" aria-hidden /> Surprise me
                </Button>
                <Button
                  variant="accent"
                  disabled={selected.length === 0}
                  onClick={() => setStep("motivation")}
                  className="flex-[1.4]"
                >
                  Continue <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
              <p className="text-center text-xs text-ink-faint">
                No account needed. Your progress stays on this device.
              </p>
            </>
          )}
          {step === "motivation" && (
            <Button variant="accent" disabled={!motivation} onClick={() => setStep("topics")}>
              Continue <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
          {step === "topics" && (
            <Button variant="accent" disabled={selected.length === 0} onClick={() => setStep("goal")}>
              {selected.length === 0 ? "Pick at least one topic" : "Continue"}
              {selected.length > 0 && <ArrowRight className="size-4" aria-hidden />}
            </Button>
          )}
          {step === "goal" && (
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => generate({ topics: selected, motivation: motivation ?? "curious", goal: "" })}
              >
                Skip
              </Button>
              <Button
                variant="accent"
                className="flex-1"
                onClick={() => generate({ topics: selected, motivation: motivation ?? "curious", goal })}
              >
                <Sparkles className="size-4" aria-hidden /> Generate my journey
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Question({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="mt-8 md:mt-12">
      <p className="text-sm font-semibold tracking-wider text-accent uppercase">Question {n} of 3</p>
      <h1 className="font-display mt-2 text-4xl leading-tight font-semibold text-balance md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-ink-soft">{hint}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  FlaskConical,
  Quote,
  Share2,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { topicById } from "@/content";
import { requestExplanation } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ContentBlock, ContentSource, Lesson, Usefulness } from "@/lib/types";
import { Button, ButtonLink, cx, SourceTag, TopicIcon, topicVars } from "../ui";
import { EXERCISE_LABEL, ExerciseView } from "./Exercises";

const STEPS = ["Hook", "Discover", "Experience", "Apply", "Insight"] as const;

const USEFULNESS: { id: Usefulness; label: string }[] = [
  { id: "very", label: "Very useful" },
  { id: "somewhat", label: "Somewhat useful" },
  { id: "not", label: "Not for me" },
];

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const app = useApp();
  const topic = topicById[lesson.topicId];
  const [step, setStep] = useState(0);
  const [engaged, setEngaged] = useState(false);

  const { hydrated, visitLesson, completeLesson } = app;

  useEffect(() => {
    if (hydrated) visitLesson(lesson.id);
  }, [hydrated, lesson.id, visitLesson]);

  useEffect(() => {
    if (hydrated && step === STEPS.length - 1) completeLesson(lesson.id);
  }, [hydrated, step, lesson.id, completeLesson]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const exit = "/";

  const footer: Record<number, { label: string; disabled?: boolean }> = {
    0: { label: lesson.hook.cta },
    1: { label: lesson.exercise.type === "simulator" ? "Try it yourself" : "Try it out" },
    2: { label: "Continue", disabled: !engaged },
    3: { label: "See your insight" },
  };

  return (
    <div style={topicVars(topic)} className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              aria-label="Previous step"
              className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sand"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <span className="size-10 shrink-0" />
          )}
          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
          >
            {STEPS.map((name, index) => (
              <span key={name} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-(--t) transition-all duration-500 ease-out"
                  style={{ width: index <= step ? "100%" : "0%" }}
                />
              </span>
            ))}
          </div>
          <Link
            href={exit}
            aria-label="Close lesson"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sand"
          >
            <X className="size-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-4 pb-36 md:pt-10">
        <div key={step} className="animate-step">
          {step === 0 && <HookStep lesson={lesson} />}
          {step === 1 && <DiscoverStep lesson={lesson} />}
          {step === 2 && (
            <section>
              <Eyebrow>{EXERCISE_LABEL[lesson.exercise.type]}</Eyebrow>
              <div className="mt-4">
                <ExerciseView lesson={lesson} onEngaged={() => setEngaged(true)} />
              </div>
            </section>
          )}
          {step === 3 && <ApplyStep lesson={lesson} />}
          {step === 4 && <InsightStep lesson={lesson} />}
        </div>
      </main>

      {step < 4 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
            {step === 2 && !engaged && (
              <Button variant="ghost" onClick={next}>
                Skip
              </Button>
            )}
            <Button variant="topic" className="flex-1" disabled={footer[step].disabled} onClick={next}>
              {footer[step].label} <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.14em] text-(--t) uppercase">{children}</p>;
}

/* ---------- A. Hook ---------- */

function HookStep({ lesson }: { lesson: Lesson }) {
  const topic = topicById[lesson.topicId];
  return (
    <section className="pt-4 md:pt-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-(--t-soft) px-3 py-1.5 text-xs font-semibold text-(--t)">
        <TopicIcon icon={topic.icon} className="size-3.5" />
        {topic.shortName} · {lesson.estimatedMinutes} min
      </span>
      <p className="mt-4 text-sm font-medium text-ink-soft">{lesson.title}</p>
      <h1 className="font-display mt-2 text-[2.3rem] leading-[1.08] font-semibold text-balance md:text-5xl">
        {lesson.hook.question}
      </h1>
      <div className="mt-8 space-y-4">
        {lesson.hook.story.map((line, index) => (
          <p
            key={index}
            className="animate-rise text-[18px] leading-relaxed"
            style={{ animationDelay: `${250 + index * 160}ms` }}
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}

/* ---------- B. Discover ---------- */

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "insight":
      return (
        <h2 className="font-display text-[1.9rem] leading-[1.15] font-semibold text-balance md:text-4xl">
          {block.text}
        </h2>
      );
    case "paragraph":
      return <p className="text-[17px] leading-[1.7]">{block.text}</p>;
    case "example":
      return (
        <aside className="rounded-3xl bg-(--t-soft) p-5">
          <p className="text-xs font-bold tracking-wider text-(--t) uppercase">{block.title}</p>
          <p className="mt-2 text-[16px] leading-relaxed">{block.text}</p>
        </aside>
      );
    case "list":
      return (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-line">
          {block.title && <p className="text-sm font-bold">{block.title}</p>}
          <ul className={cx("space-y-3", block.title && "mt-3")}>
            {block.items.map((item, index) => (
              <li key={index} className="flex gap-3 text-[16px] leading-relaxed">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-(--t-soft) text-xs font-bold text-(--t)">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "contrast":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-sand p-5">
            <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{block.left.label}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{block.left.text}</p>
          </div>
          <div className="rounded-3xl bg-(--t-soft) p-5 ring-1 ring-(--t)/30">
            <p className="text-xs font-bold tracking-wider text-(--t) uppercase">{block.right.label}</p>
            <p className="mt-2 text-[15px] leading-relaxed">{block.right.text}</p>
          </div>
        </div>
      );
  }
}

function DiscoverStep({ lesson }: { lesson: Lesson }) {
  const [loading, setLoading] = useState(false);
  const [alt, setAlt] = useState<{ source: ContentSource; text: string } | null>(null);

  async function explain() {
    setLoading(true);
    const result = await requestExplanation(lesson.id);
    setAlt({ source: result.source, text: result.explanation });
    setLoading(false);
  }

  return (
    <section>
      <Eyebrow>The idea</Eyebrow>
      <div className="mt-4 space-y-5">
        {lesson.contentBlocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>

      <div className="mt-8 border-t border-line pt-6">
        {alt ? (
          <div className="animate-rise rounded-3xl bg-card p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-center gap-2">
              <SourceTag source={alt.source} demoLabel="Another angle · pre-written" />
            </div>
            <p className="mt-3 text-[16px] leading-relaxed">{alt.text}</p>
            <p className="mt-3 text-xs text-ink-faint">
              {alt.source === "ai"
                ? "Generated by AI from this lesson's curated content. It isn't a quotation from the sources."
                : "Written by our editors. With an AI key configured, you'd get a fresh analogy each time."}
            </p>
            {alt.source === "ai" && (
              <button
                type="button"
                onClick={explain}
                disabled={loading}
                className="mt-3 text-sm font-semibold text-(--t) hover:underline"
              >
                {loading ? "Thinking…" : "Try another angle"}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={explain}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-(--t) hover:text-(--t)"
          >
            <WandSparkles className={cx("size-4", loading && "animate-pulse")} aria-hidden />
            {loading ? "Finding another angle…" : "Explain this differently"}
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------- D. Apply ---------- */

function ApplyStep({ lesson }: { lesson: Lesson }) {
  return (
    <section className="pt-2">
      <Eyebrow>Apply in real life</Eyebrow>
      <h2 className="font-display mt-3 text-4xl leading-tight font-semibold">Your small experiment</h2>
      <div className="mt-6 rounded-[2rem] bg-card p-6 ring-1 ring-line md:p-8">
        <span className="grid size-12 place-items-center rounded-2xl bg-(--t-soft) text-(--t)">
          <FlaskConical className="size-6" aria-hidden />
        </span>
        <p className="mt-5 text-[18px] leading-relaxed">{lesson.realWorldExperiment.text}</p>
        {lesson.realWorldExperiment.prompt && (
          <p className="font-display mt-5 rounded-2xl bg-(--t-soft) px-5 py-4 text-xl leading-snug font-medium">
            {lesson.realWorldExperiment.prompt}
          </p>
        )}
      </div>
      <p className="mt-5 text-sm leading-relaxed text-ink-soft">
        No pressure and no deadline.
      </p>
    </section>
  );
}

/* ---------- E. Save and reflect ---------- */

function InsightStep({ lesson }: { lesson: Lesson }) {
  const { progress, toggleSavedInsight, setLessonFeedback } = useApp();
  const saved = progress.savedInsightIds.includes(lesson.id);
  const rating = progress.lessonFeedback[lesson.id];
  const [shared, setShared] = useState(false);

  async function share() {
    const text = `“${lesson.keyInsight.headline}” ${lesson.keyInsight.text}\n\nFrom “${lesson.title}” on Aha`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch {
      /* share cancelled */
    }
  }

  return (
    <section className="pt-2">
      <Eyebrow>Your insight</Eyebrow>
      <div className="animate-pop relative mt-4 overflow-hidden rounded-[2rem] bg-(--t-soft) p-7 md:p-10">
        <span aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-(--t) opacity-10" />
        <Quote className="size-8 text-(--t)" aria-hidden />
        <p className="font-display mt-4 text-[2rem] leading-[1.12] font-semibold text-balance md:text-[2.6rem]">
          {lesson.keyInsight.headline}
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{lesson.keyInsight.text}</p>
        <p className="mt-6 text-xs font-semibold tracking-wider text-(--t) uppercase">{lesson.title}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          variant={saved ? "outline" : "topic"}
          className="flex-1"
          aria-pressed={saved}
          onClick={() => toggleSavedInsight(lesson.id)}
        >
          {saved ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          {saved ? "Saved" : "Save insight"}
        </Button>
        <Button variant="outline" onClick={share} aria-label="Share this insight">
          {shared ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
          {shared ? "Copied" : "Share"}
        </Button>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold">Was this insight useful?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {USEFULNESS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={rating === option.id}
              onClick={() => setLessonFeedback(lesson.id, option.id)}
              className={cx(
                "rounded-full border-2 px-4 py-2 text-sm font-medium transition active:scale-95",
                rating === option.id
                  ? "border-ink bg-ink text-white"
                  : "border-transparent bg-card ring-1 ring-line hover:ring-ink/40",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {rating && <p className="animate-rise mt-2 text-sm text-ink-soft">Thanks. That helps shape what we suggest.</p>}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/" variant="primary">
          Back to the playground <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/collection" variant="outline">
          My collection
        </ButtonLink>
      </div>

      <Sources lesson={lesson} />
    </section>
  );
}

function Sources({ lesson }: { lesson: Lesson }) {
  return (
    <div className="mt-12 border-t border-line pt-6">
      <p className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-ink-soft uppercase">
        <BookOpen className="size-4" aria-hidden /> Sources behind this lesson
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        These works informed the lesson. The explanations are written in our own words and are not
        quotations. Any text marked “AI response” is generated separately and is not part of a source.
      </p>
      <ul className="mt-4 space-y-4">
        {lesson.sources.map((source) => (
          <li key={source.title} className="text-sm leading-relaxed">
            <p>
              <span className="mr-2 rounded-md bg-sand px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink-soft uppercase">
                {source.kind}
              </span>
              <cite className="font-semibold not-italic">{source.title}</cite>
              <span className="text-ink-soft">
                {" "}
                · {source.author}
                {source.year ? ` (${source.year})` : ""}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-ink-soft">{source.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

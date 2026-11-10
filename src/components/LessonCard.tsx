"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { topicById } from "@/content";
import type { Lesson } from "@/lib/types";
import { cx, TopicBadge, TopicIcon, topicVars } from "./ui";

export function Minutes({ lesson }: { lesson: Lesson }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
      <Clock className="size-3.5" aria-hidden /> {lesson.estimatedMinutes} min
    </span>
  );
}

export function ExploredMark({ label = "Explored" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft">
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {label}
    </span>
  );
}

/** Compact lesson card used in Explore and lists. */
export function LessonCard({
  lesson,
  completed,
  showTopic = false,
  note,
}: {
  lesson: Lesson;
  completed: boolean;
  showTopic?: boolean;
  note?: string;
}) {
  const topic = topicById[lesson.topicId];
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      style={topicVars(topic)}
      className="group flex h-full flex-col rounded-3xl bg-card p-5 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md hover:ring-(--t)"
    >
      <div className="flex items-center justify-between gap-3">
        {showTopic ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--t)">
            <TopicIcon icon={topic.icon} className="size-3.5" /> {topic.shortName}
          </span>
        ) : (
          <Minutes lesson={lesson} />
        )}
        {completed ? <ExploredMark /> : showTopic ? <Minutes lesson={lesson} /> : null}
      </div>
      <h3 className="font-display mt-3 text-xl leading-snug font-semibold">{lesson.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{lesson.subtitle}</p>
      {note && <p className="mt-3 text-[13px] leading-relaxed text-ink-soft italic">{note}</p>}
      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-(--t)">
        {completed ? "Revisit" : "Explore"}
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

/** Large editorial card for "Today's insight" and discovery. */
export function FeaturedLesson({
  lesson,
  eyebrow,
  cta,
  completed = false,
}: {
  lesson: Lesson;
  eyebrow: string;
  cta: string;
  completed?: boolean;
}) {
  const topic = topicById[lesson.topicId];
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      style={topicVars(topic)}
      className="group relative block overflow-hidden rounded-[2rem] bg-(--t-soft) p-6 transition hover:shadow-lg md:p-10"
    >
      <span
        aria-hidden
        className="absolute -top-16 -right-16 size-56 rounded-full bg-(--t) opacity-10 transition duration-500 group-hover:scale-110"
      />
      <span
        aria-hidden
        className="absolute right-10 -bottom-20 size-40 rounded-full bg-(--t) opacity-10"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wider text-(--t) uppercase">
          <span>{eyebrow}</span>
          <span className="text-ink-soft normal-case tracking-normal">
            {topic.shortName} · {lesson.estimatedMinutes} min{completed ? " · explored" : ""}
          </span>
        </div>
        <p className="font-display mt-4 max-w-2xl text-[1.7rem] leading-[1.15] font-semibold text-balance md:text-4xl">
          {lesson.hook.question}
        </p>
        <p className="mt-3 text-[15px] text-ink-soft">
          {lesson.title}: {lesson.subtitle}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-white transition group-hover:bg-black">
          {cta} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Numbered card for the horizontal "My journey" strip. */
export function JourneyStepCard({
  lesson,
  index,
  state,
}: {
  lesson: Lesson;
  index: number;
  state: "done" | "current" | "upcoming";
}) {
  const topic = topicById[lesson.topicId];
  return (
    <Link
      href={`/lesson/${lesson.id}`}
      style={topicVars(topic)}
      className={cx(
        "flex w-[13.5rem] shrink-0 snap-start flex-col rounded-3xl p-4 transition hover:-translate-y-0.5 md:w-auto",
        state === "current" ? "bg-(--t-soft) ring-2 ring-(--t)" : "bg-card ring-1 ring-line hover:ring-(--t)",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cx(
            "grid size-7 place-items-center rounded-full text-xs font-bold",
            state === "done" ? "bg-(--t) text-white" : "bg-(--t-soft) text-(--t)",
            state === "current" && "bg-card",
          )}
        >
          {state === "done" ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : index + 1}
        </span>
        <TopicBadge topic={topic} size="sm" />
      </div>
      <h3 className="mt-3 text-[15px] leading-snug font-semibold">{lesson.title}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-soft">{lesson.subtitle}</p>
      <span className="mt-auto pt-3 text-xs font-semibold text-(--t)">
        {state === "done" ? "Explored" : state === "current" ? "Up next" : `${lesson.estimatedMinutes} min`}
      </span>
    </Link>
  );
}

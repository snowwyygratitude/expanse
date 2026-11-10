"use client";

import Link from "next/link";
import { ArrowRight, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink, cx, SourceTag, TopicIcon, topicVars } from "@/components/ui";
import { lessonById, topicById } from "@/content";
import { requestJourney } from "@/lib/api";
import { draftToJourney } from "@/lib/journey";
import { nextJourneyLesson } from "@/lib/recommend";
import { useApp } from "@/lib/store";

export default function JourneyPage() {
  return (
    <AppShell>
      <JourneyView />
    </AppShell>
  );
}

function JourneyView() {
  const { journey, profile, progress, setJourney } = useApp();
  const [isNew, setIsNew] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setIsNew(new URLSearchParams(window.location.search).get("new") === "1");
  }, []);

  async function refresh() {
    setRefreshing(true);
    const result = await requestJourney({
      profile,
      completedLessonIds: progress.completedLessonIds,
      // Steer away from unexplored lessons in the current journey so a
      // "different journey" really is different, even in demo mode.
      avoidLessonIds: journey?.lessonIds.filter((id) => !progress.completedLessonIds.includes(id)),
    });
    setJourney(draftToJourney(result.draft, result.source, progress.completedLessonIds));
    setRefreshing(false);
  }

  if (!journey) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">No journey yet</h1>
        <p className="mt-3 text-ink-soft">Let's put together five lessons that fit you.</p>
        <Button variant="accent" className="mt-6" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Creating…" : "Create my journey"}
        </Button>
      </div>
    );
  }

  const next = nextJourneyLesson(journey, progress);
  const done = journey.lessonIds.filter((id) => progress.completedLessonIds.includes(id)).length;
  const finished = done === journey.lessonIds.length;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-semibold tracking-wider text-accent uppercase">
        {isNew ? "Your journey is ready" : "Your journey"}
      </p>
      <h1 className="font-display mt-2 text-4xl leading-tight font-semibold text-balance md:text-5xl">
        {journey.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{journey.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SourceTag source={journey.source} demoLabel="Matched by rules · demo mode" />
        <span className="text-sm text-ink-soft">
          {done} of {journey.lessonIds.length} explored
        </span>
      </div>

      <ol className="mt-8 space-y-3">
        {journey.lessonIds.map((id, index) => {
          const lesson = lessonById[id];
          const topic = topicById[lesson.topicId];
          const completed = progress.completedLessonIds.includes(id);
          const current = next?.id === id;
          return (
            <li key={id} className="animate-rise" style={{ animationDelay: `${index * 70}ms` }}>
              <Link
                href={`/lesson/${id}`}
                style={topicVars(topic)}
                className={cx(
                  "group flex gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-md",
                  current ? "bg-(--t-soft) ring-2 ring-(--t)" : "bg-card ring-1 ring-line hover:ring-(--t)",
                )}
              >
                <span
                  className={cx(
                    "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                    completed ? "bg-(--t) text-white" : current ? "bg-card text-(--t)" : "bg-(--t-soft) text-(--t)",
                  )}
                >
                  {completed ? <Check className="size-4" strokeWidth={3} aria-hidden /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-(--t)">
                    <TopicIcon icon={topic.icon} className="size-3.5" />
                    {topic.shortName}
                    <span className="font-normal text-ink-soft">· {lesson.estimatedMinutes} min</span>
                  </span>
                  <span className="font-display mt-1 block text-xl leading-snug font-semibold">
                    {lesson.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{lesson.subtitle}</span>
                  <span className="mt-3 block border-l-2 border-(--t) pl-3 text-sm leading-relaxed text-ink-soft">
                    <span className="font-semibold text-ink">Why this one: </span>
                    {journey.reasons[id]}
                  </span>
                </span>
                <ArrowRight
                  className="mt-2 size-5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-(--t)"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {next ? (
          <ButtonLink href={`/lesson/${next.id}`} variant="accent" className="flex-1">
            {done === 0 ? "Start my first lesson" : "Continue my journey"}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        ) : (
          <Button variant="accent" className="flex-1" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={cx("size-4", refreshing && "animate-spin")} aria-hidden />
            {refreshing ? "Creating…" : "Create my next journey"}
          </Button>
        )}
        <ButtonLink href="/home" variant="outline">
          Go to home
        </ButtonLink>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-ink-soft">
        {finished
          ? "You've explored every lesson in this journey. A new one will draw on lessons you haven't opened yet."
          : "This is a suggestion, not a syllabus. You can open any lesson in any order, or wander off into Explore."}
        {!finished && (
          <>
            {" "}
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="font-semibold text-accent-deep underline-offset-2 hover:underline"
            >
              {refreshing ? "Refreshing…" : "Suggest a different journey"}
            </button>
          </>
        )}
      </p>
    </div>
  );
}

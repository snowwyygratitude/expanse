"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Quote } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeaturedLesson, JourneyStepCard, LessonCard } from "@/components/LessonCard";
import { SectionHeading, TopicBadge, topicVars } from "@/components/ui";
import { lessonById, lessonsForTopic, topicById, topics } from "@/content";
import { discoveryLesson, nextJourneyLesson, todaysLesson } from "@/lib/recommend";
import { useApp } from "@/lib/store";
import type { MotivationId } from "@/lib/types";

const GREETING_LINE: Record<MotivationId, string> = {
  "understand-myself": "Ready to notice something new about yourself?",
  relationships: "Ready for an idea that brings people closer?",
  decisions: "Ready for an idea that makes choosing easier?",
  grow: "Ready for one small step forward?",
  curious: "Ready to follow your curiosity?",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

export default function HomePage() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

function Home() {
  const { profile, journey, progress } = useApp();
  const completed = progress.completedLessonIds;
  const today = todaysLesson(journey, profile, progress);
  const fromJourney = nextJourneyLesson(journey, progress)?.id === today.id;
  const discovery = discoveryLesson(journey, profile, progress, today.id);
  const journeyDone = journey ? journey.lessonIds.filter((id) => completed.includes(id)).length : 0;
  const saved = progress.savedInsightIds.map((id) => lessonById[id]).filter(Boolean).slice(-3).reverse();
  const recent = progress.recentLessonIds
    .map((id) => lessonById[id])
    .filter((l) => l && l.id !== today.id)
    .slice(0, 3);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">{greeting()}</h1>
        <p className="mt-2 text-lg text-ink-soft">
          {GREETING_LINE[profile.growthMotivation ?? "curious"]}
        </p>
        <div className="mt-6">
          <FeaturedLesson
            lesson={today}
            eyebrow="Today's insight"
            cta={fromJourney ? (journeyDone === 0 ? "Start my journey" : "Continue my journey") : "Explore this idea"}
            completed={completed.includes(today.id)}
          />
        </div>
      </section>

      {journey && (
        <section>
          <SectionHeading
            title="My journey"
            hint={`${journey.title} · ${journeyDone} of ${journey.lessonIds.length} explored`}
            action={
              <Link href="/journey" className="shrink-0 text-sm font-semibold text-accent-deep hover:underline">
                See why
              </Link>
            }
          />
          <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {journey.lessonIds.map((id, index) => (
              <JourneyStepCard
                key={id}
                lesson={lessonById[id]}
                index={index}
                state={completed.includes(id) ? "done" : today.id === id ? "current" : "upcoming"}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title="Explore"
          hint="Wander anywhere. Nothing is locked."
          action={
            <Link href="/explore" className="shrink-0 text-sm font-semibold text-accent-deep hover:underline">
              All lessons
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {topics.map((topic) => {
            const count = lessonsForTopic(topic.id).filter((l) => completed.includes(l.id)).length;
            return (
              <Link
                key={topic.id}
                href={`/explore#${topic.id}`}
                style={topicVars(topic)}
                className="flex items-center gap-2.5 rounded-3xl bg-card p-3.5 ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-(--t)"
              >
                <TopicBadge topic={topic} />
                <span className="min-w-0">
                  <span className="block text-sm leading-tight font-semibold sm:text-[15px]">{topic.shortName}</span>
                  <span className="block text-xs text-ink-soft">
                    {count === 0 ? "3 lessons" : `${count} of 3 explored`}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {discovery && (
        <section>
          <SectionHeading title="Discover something new" hint="One idea from somewhere you haven't been yet." />
          <div className="md:max-w-md">
            <LessonCard lesson={discovery} completed={false} showTopic note={`“${discovery.hook.question}”`} />
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title="My saved insights"
          action={
            saved.length > 0 && (
              <Link href="/growth" className="shrink-0 text-sm font-semibold text-accent-deep hover:underline">
                See all
              </Link>
            )
          }
        />
        {saved.length === 0 ? (
          <div className="flex items-start gap-4 rounded-3xl border border-dashed border-line p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-ink-soft">
              <Bookmark className="size-5" aria-hidden />
            </span>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              Insights you save at the end of a lesson collect here, so the ideas that mattered are easy
              to find again.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {saved.map((lesson) => (
              <Link
                key={lesson.id}
                href="/growth#insights"
                style={topicVars(topicById[lesson.topicId])}
                className="rounded-3xl bg-(--t-soft) p-5 transition hover:-translate-y-0.5"
              >
                <Quote className="size-5 text-(--t)" aria-hidden />
                <p className="font-display mt-2 text-xl leading-snug font-semibold">
                  {lesson.keyInsight.headline}
                </p>
                <p className="mt-2 text-xs font-semibold text-(--t)">{lesson.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <SectionHeading title="Recently explored" />
          <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
            {recent.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/lesson/${lesson.id}`}
                  className="group flex items-center gap-4 p-4 transition hover:bg-sand/60"
                >
                  <TopicBadge topic={topicById[lesson.topicId]} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{lesson.title}</span>
                    <span className="block truncate text-[13px] text-ink-soft">
                      {completed.includes(lesson.id) ? lesson.centralConcept : "Opened, not finished yet"}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

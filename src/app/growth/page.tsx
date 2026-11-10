"use client";

import Link from "next/link";
import { Check, Copy, FlaskConical, PenLine, Quote, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, ButtonLink, cx, SectionHeading, TopicBadge, topicVars } from "@/components/ui";
import { lessonById, lessonsForTopic, topicById, topics } from "@/content";
import { requestAIStatus } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { Lesson } from "@/lib/types";

export default function GrowthPage() {
  return (
    <AppShell>
      <Growth />
    </AppShell>
  );
}

function Growth() {
  const { progress, toggleSavedInsight, toggleExperiment, reset } = useApp();
  const completed = progress.completedLessonIds.map((id) => lessonById[id]).filter(Boolean);
  const saved = progress.savedInsightIds.map((id) => lessonById[id]).filter(Boolean).reverse();
  const tried = progress.reportedExperiments.filter((id) => progress.completedLessonIds.includes(id));
  const topicsExplored = new Set(completed.map((l) => l.topicId)).size;
  const [confirming, setConfirming] = useState(false);
  const [ai, setAi] = useState<{ enabled: boolean; provider: string | null } | null>(null);

  useEffect(() => {
    requestAIStatus().then(setAi);
  }, []);

  const stats = [
    { label: "Topics explored", value: `${topicsExplored}`, of: "of 6" },
    { label: "Lessons explored", value: `${completed.length}`, of: "of 18" },
    { label: "Insights saved", value: `${saved.length}`, of: "" },
    { label: "Experiments tried", value: `${tried.length}`, of: "" },
  ];

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">My Growth</h1>
        <p className="mt-2 max-w-xl text-lg text-ink-soft">
          A record of what you've explored and what stayed with you. It isn't a score.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl bg-card p-5 ring-1 ring-line">
              <dd className="font-display text-4xl font-semibold tabular-nums">
                {stat.value}
                {stat.of && <span className="ml-1.5 font-sans text-sm font-medium text-ink-faint">{stat.of}</span>}
              </dd>
              <dt className="mt-1 text-sm text-ink-soft">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {completed.length === 0 && (
        <section className="rounded-[2rem] bg-accent-soft p-7 text-center md:p-10">
          <h2 className="font-display text-2xl font-semibold">Your collection starts with one idea.</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Explore a lesson and the insights, experiments, and topics you touch will gather here.
          </p>
          <ButtonLink href="/home" variant="accent" className="mt-5">
            Find today's insight
          </ButtonLink>
        </section>
      )}

      <section id="insights" className="scroll-mt-24">
        <SectionHeading title="Saved insights" hint="Your personal collection of ideas worth keeping." />
        {saved.length === 0 ? (
          <Empty icon={<Quote className="size-5" aria-hidden />}>
            Nothing saved yet. At the end of each lesson you can keep the insight that resonated.
          </Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {saved.map((lesson) => (
              <InsightCard key={lesson.id} lesson={lesson} onRemove={() => toggleSavedInsight(lesson.id)} />
            ))}
          </div>
        )}
      </section>

      <section id="experiments" className="scroll-mt-24">
        <SectionHeading
          title="Real-life experiments"
          hint="From lessons you've explored. Tick the ones you actually tried."
        />
        {completed.length === 0 ? (
          <Empty icon={<FlaskConical className="size-5" aria-hidden />}>
            Each lesson ends with one small thing to try in real life. They'll be listed here.
          </Empty>
        ) : (
          <ul className="space-y-3">
            {completed.map((lesson) => {
              const done = progress.reportedExperiments.includes(lesson.id);
              return (
                <li key={lesson.id} style={topicVars(topicById[lesson.topicId])}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggleExperiment(lesson.id)}
                    className={cx(
                      "flex w-full items-start gap-4 rounded-3xl p-5 text-left transition",
                      done ? "bg-(--t-soft)" : "bg-card ring-1 ring-line hover:ring-(--t)",
                    )}
                  >
                    <span
                      className={cx(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition",
                        done ? "border-(--t) bg-(--t) text-white" : "border-line text-transparent",
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-(--t)">{lesson.title}</span>
                      <span className="mt-1 block text-[15px] leading-relaxed">
                        {lesson.realWorldExperiment.text}
                        {lesson.realWorldExperiment.prompt && (
                          <span className="mt-1 block font-medium">{lesson.realWorldExperiment.prompt}</span>
                        )}
                      </span>
                      <span className="mt-2 block text-xs font-semibold text-ink-soft">
                        {done ? "You tried this" : "Tap when you've tried it"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading title="Topics explored" hint="Where your curiosity has taken you so far." />
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-card ring-1 ring-line">
          {topics.map((topic) => {
            const list = lessonsForTopic(topic.id);
            const count = list.filter((l) => progress.completedLessonIds.includes(l.id)).length;
            return (
              <li key={topic.id} style={topicVars(topic)}>
                <Link href={`/explore#${topic.id}`} className="flex items-center gap-4 p-4 transition hover:bg-sand/60">
                  <TopicBadge topic={topic} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{topic.name}</span>
                    <span className="block text-[13px] text-ink-soft">
                      {count === 0 ? "Not visited yet" : `${count} of 3 lessons explored`}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5" aria-hidden>
                    {list.map((l) => (
                      <span
                        key={l.id}
                        className={cx(
                          "size-2.5 rounded-full",
                          progress.completedLessonIds.includes(l.id) ? "bg-(--t)" : "bg-line",
                        )}
                      />
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          Exploring a lesson means you've met an idea, not mastered a skill. The real change happens
          when you try things out.
        </p>
      </section>

      <section className="rounded-3xl bg-sand p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-ink-soft">
            {ai?.enabled ? <Sparkles className="size-4" aria-hidden /> : <PenLine className="size-4" aria-hidden />}
          </span>
          <div className="text-sm leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">
              {ai === null ? "Checking AI status…" : ai.enabled ? `Live AI is on (${ai.provider})` : "Demo mode"}
            </p>
            <p className="mt-0.5">
              {ai?.enabled
                ? "Journeys, written feedback, and alternative explanations are personalised by AI and labelled “AI response”. Lesson content is always curated."
                : "No AI key is configured, so journeys are matched by rules and feedback is pre-written. Everything is labelled so you can tell the difference."}
            </p>
            <p className="mt-0.5">Your progress is stored only in this browser.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {confirming ? (
            <>
              <span className="text-sm font-medium">Erase all progress and start over?</span>
              <Button
                variant="accent"
                className="px-4 py-2 text-sm"
                onClick={() => {
                  reset();
                  setConfirming(false);
                }}
              >
                Yes, start over
              </Button>
              <Button variant="ghost" className="px-4 py-2 text-sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" className="px-4 py-2 text-sm" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" aria-hidden /> Start over
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function Empty({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-dashed border-line p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-ink-soft">{icon}</span>
      <p className="text-[15px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function InsightCard({ lesson, onRemove }: { lesson: Lesson; onRemove: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `“${lesson.keyInsight.headline}” ${lesson.keyInsight.text}\n\nFrom “${lesson.title}” on Aha`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <article style={topicVars(topicById[lesson.topicId])} className="flex flex-col rounded-3xl bg-(--t-soft) p-6">
      <Quote className="size-6 text-(--t)" aria-hidden />
      <p className="font-display mt-3 text-2xl leading-snug font-semibold">{lesson.keyInsight.headline}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{lesson.keyInsight.text}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Link href={`/lesson/${lesson.id}`} className="text-xs font-semibold text-(--t) hover:underline">
          {lesson.title}
        </Link>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy insight as text"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-card"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove from saved insights"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-card"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </span>
      </div>
    </article>
  );
}

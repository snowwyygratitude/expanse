"use client";

import Link from "next/link";
import { ArrowRight, House, PenLine, Play, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { themeVars } from "@/components/play/PlayShell";
import { cx, TopicIcon, topicVars } from "@/components/ui";
import { lessonById, lessonsForTopic, topicById, topics } from "@/content";
import { experienceById, experiences } from "@/experiences";
import { requestAIStatus } from "@/lib/api";
import { useApp } from "@/lib/store";

export default function CollectionPage() {
  const { progress, toggleSavedInsight, reset } = useApp();
  const [ai, setAi] = useState<{ enabled: boolean; provider: string | null } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    requestAIStatus().then(setAi);
  }, []);

  const saved = [...progress.savedInsightIds].reverse().flatMap((id) => {
    if (id.startsWith("exp:")) {
      const e = experienceById[id.slice(4)];
      return e ? [{ id, headline: e.insight.headline, line: e.insight.line, from: e.title, href: `/play/${e.id}`, style: { background: e.theme.bg[1], color: e.theme.fg } }] : [];
    }
    const l = lessonById[id];
    const t = l && topicById[l.topicId];
    return l ? [{ id, headline: l.keyInsight.headline, line: l.keyInsight.text, from: l.title, href: `/lesson/${l.id}`, style: { background: t.softColor } }] : [];
  });

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 pt-4 pb-12 md:px-8 md:pt-8">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back to Home" className="grid size-10 place-items-center rounded-full bg-card ring-1 ring-line transition hover:ring-ink/40">
          <House className="size-5" />
        </Link>
        <h1 className="font-display text-3xl font-semibold">Your collection</h1>
      </header>

      <section className="mt-6">
        {saved.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-line p-8 text-center">
            <p className="font-display text-2xl font-semibold">Nothing kept yet.</p>
            <p className="mt-1 text-ink-soft">Play something. Keep what surprises you.</p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-bold text-white">
              <Play className="size-4" fill="currentColor" aria-hidden /> Play
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {saved.map((item) => (
              <article key={item.id} style={item.style} className="flex flex-col rounded-[1.75rem] p-5">
                <p className="font-display text-2xl leading-tight font-semibold text-balance">{item.headline}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{item.line}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-bold hover:underline">
                    {item.from} <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    aria-label="Remove from collection"
                    onClick={() => toggleSavedInsight(item.id)}
                    className="grid size-8 place-items-center rounded-full opacity-60 transition hover:bg-black/10 hover:opacity-100"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Played</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {experiences.map((e) => {
            const play = progress.plays[e.id];
            return (
              <Link key={e.id} href={`/play/${e.id}`} style={themeVars(e.theme)} className="play-surface rounded-2xl p-3 transition hover:-translate-y-0.5">
                <p className="text-[13px] leading-tight font-bold">{e.title}</p>
                <p className="mt-1 text-[11px] opacity-75">
                  {!play
                    ? "Not yet"
                    : e.kind === "dialogue"
                      ? `${play.outcomes.length}/${e.endings.length} endings`
                      : `${play.count}×`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Deep dives</h2>
        <p className="mt-1 text-sm text-ink-soft">Optional 5-minute reads behind the ideas.</p>
        <div className="mt-3 space-y-3">
          {topics.map((topic) => (
            <div key={topic.id} style={topicVars(topic)} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-(--t)">
                <TopicIcon icon={topic.icon} className="size-4" /> {topic.shortName}
              </span>
              {lessonsForTopic(topic.id).map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.id}`}
                  className={cx(
                    "rounded-full px-3 py-1.5 text-[13px] font-medium transition hover:bg-(--t-soft)",
                    progress.completedLessonIds.includes(lesson.id) ? "bg-(--t-soft)" : "bg-card ring-1 ring-line",
                  )}
                >
                  {lesson.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-sand p-5 text-sm text-ink-soft">
        <p className="inline-flex items-center gap-2 font-semibold text-ink">
          {ai?.enabled ? <Sparkles className="size-4" aria-hidden /> : <PenLine className="size-4" aria-hidden />}
          {ai === null ? "Checking AI…" : ai.enabled ? `Live AI is on (${ai.provider})` : "Demo mode"}
        </p>
        <p className="mt-1 leading-relaxed">
          {ai?.enabled
            ? "Characters' replies are voiced by AI inside authored guardrails and marked “AI-voiced”. You can also write your own lines."
            : "No AI key is set, so characters use authored dialogue. Everything is still fully playable."}{" "}
          Your progress lives only in this browser.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="font-medium text-ink">Erase everything?</span>
              <button type="button" onClick={() => { reset(); setConfirming(false); }} className="rounded-full bg-accent px-4 py-2 font-bold text-white">
                Yes, start over
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-4 py-2 font-semibold hover:bg-card">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-2 font-semibold text-ink ring-1 ring-line">
              <Trash2 className="size-4" aria-hidden /> Start over
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

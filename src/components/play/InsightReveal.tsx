"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, BookmarkCheck, ChevronDown, House, RotateCcw, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { lessonById } from "@/content";
import { insightId, type Experience } from "@/experiences";
import { useApp } from "@/lib/store";
import { cx } from "../ui";
import { GhostButton, PlayButton } from "./PlayShell";

/**
 * The payoff screen shared by every experience: the principle is revealed
 * only now, tied to what the player actually did (`children`).
 */
export function InsightReveal({
  experience,
  eyebrow = "What you just discovered",
  replayLabel = "Play again",
  onReplay,
  children,
}: {
  experience: Experience;
  eyebrow?: string;
  replayLabel?: string;
  onReplay: () => void;
  children?: ReactNode;
}) {
  const { progress, toggleSavedInsight } = useApp();
  const [open, setOpen] = useState(false);
  const { insight } = experience;
  const id = insightId(experience.id);
  const saved = progress.savedInsightIds.includes(id);

  return (
    <div className="flex flex-1 flex-col pt-4">
      {children && <div className="animate-sheet">{children}</div>}

      <div className="animate-sheet mt-5 rounded-[2rem] bg-white p-6 text-[#1F1A17] shadow-2xl" style={{ animationDelay: "250ms" }}>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">
          <Sparkles className="size-3.5" aria-hidden /> {eyebrow}
        </p>
        <h2 className="font-display mt-2 text-[2rem] leading-[1.08] font-semibold text-balance">{insight.headline}</h2>
        <p className="mt-3 text-[16px] leading-relaxed opacity-75">{insight.line}</p>

        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Why this works <ChevronDown className={cx("size-4 transition", open && "rotate-180")} aria-hidden />
        </button>
        {open && (
          <div className="animate-rise mt-3 border-t border-black/10 pt-3 text-sm leading-relaxed">
            <p className="opacity-80">{insight.why}</p>
            <p className="mt-3 text-[11px] font-bold tracking-wider uppercase opacity-50">Grounded in</p>
            <ul className="mt-1 space-y-0.5 text-[13px] opacity-70">
              {insight.sources.map((s) => (
                <li key={s.title}>
                  <cite className="font-medium not-italic">{s.title}</cite> · {s.author}
                  {s.year ? ` (${s.year})` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] font-bold tracking-wider uppercase opacity-50">Go deeper (5 min reads)</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {insight.deeperLessonIds.map((lessonId) => (
                <Link
                  key={lessonId}
                  href={`/lesson/${lessonId}`}
                  className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-[13px] font-semibold hover:bg-black/10"
                >
                  {lessonById[lessonId]?.title} <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          aria-pressed={saved}
          onClick={() => toggleSavedInsight(id)}
          className={cx(
            "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-bold transition active:scale-95",
            saved ? "bg-black/5" : "bg-[#1F1A17] text-white",
          )}
        >
          {saved ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
          {saved ? "Saved to your collection" : "Keep this insight"}
        </button>
      </div>

      <div className="animate-sheet mt-4 flex gap-3" style={{ animationDelay: "400ms" }}>
        <PlayButton className="flex-1" onClick={onReplay}>
          <RotateCcw className="size-4" aria-hidden /> {replayLabel}
        </PlayButton>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-(--panel) px-5 py-3 text-sm font-semibold transition hover:bg-white/15 active:scale-95"
        >
          <House className="size-4" aria-hidden /> Home
        </Link>
      </div>
    </div>
  );
}

export { GhostButton };

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Clock, Dices, Play } from "lucide-react";
import { useState } from "react";
import { CardArt } from "@/components/play/CardArt";
import { themeVars } from "@/components/play/PlayShell";
import { cx, Logo } from "@/components/ui";
import { experiences, type Experience } from "@/experiences";
import { recommend } from "@/lib/recommend";
import { useApp } from "@/lib/store";

export default function HomePage() {
  const { progress, hydrated } = useApp();
  const router = useRouter();
  const [rolling, setRolling] = useState(false);
  const pick = recommend(progress);
  const others = experiences.filter((e) => e.id !== pick.experience.id);

  function surprise() {
    setRolling(true);
    const choice = others[Math.floor(Math.random() * others.length)];
    setTimeout(() => router.push(`/play/${choice.id}`), 550);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 pt-4 pb-10 md:px-8 md:pt-8">
      <header className="flex items-center justify-between">
        <Logo className="text-3xl" />
        <Link
          href="/collection"
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-semibold ring-1 ring-line transition hover:ring-ink/40"
        >
          <Bookmark className="size-4" aria-hidden />
          {progress.savedInsightIds.length > 0 ? progress.savedInsightIds.length : "Saved"}
        </Link>
      </header>

      <h1 className="font-display mt-5 text-[2.1rem] leading-none font-semibold md:mt-8 md:text-5xl">
        Play with an idea.
      </h1>

      <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3 md:gap-4">
        <ExperienceCard experience={pick.experience} tag={hydrated ? pick.reason : undefined} featured />

        <button
          type="button"
          onClick={surprise}
          disabled={rolling}
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-[1.75rem] bg-ink px-6 py-5 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] md:order-last md:col-span-3"
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-90"
            style={{ background: "linear-gradient(100deg,#FF7A59,#FFD84D 45%,#C8F560 70%,#7C5CFF)" }}
          />
          <Dices className={cx("relative size-7 text-ink transition group-hover:rotate-12", rolling && "animate-spin")} aria-hidden />
          <span className="relative text-ink">{rolling ? "Rolling…" : "Surprise me"}</span>
        </button>

        {others.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} played={Boolean(progress.plays[experience.id])} />
        ))}
      </div>
    </main>
  );
}

function ExperienceCard({
  experience,
  featured = false,
  tag,
  played,
}: {
  experience: Experience;
  featured?: boolean;
  tag?: string;
  played?: boolean;
}) {
  return (
    <Link
      href={`/play/${experience.id}`}
      style={themeVars(experience.theme)}
      className={cx(
        "play-surface group relative flex flex-col justify-end overflow-hidden rounded-[2rem] p-5 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]",
        featured ? "min-h-[27rem] md:col-span-2 md:row-span-2 md:min-h-[32rem] md:p-8" : "min-h-52 md:min-h-0",
      )}
    >
      <CardArt
        art={experience.art}
        className={cx(
          "absolute top-0 transition duration-500 group-hover:scale-[1.03]",
          featured ? "inset-x-0 h-[48%] md:h-[58%]" : "right-0 h-full w-[46%]",
        )}
      />
      {featured && (
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[56%] md:h-[46%]" style={{ background: "linear-gradient(to top, var(--bg1) 78%, transparent)" }} />
      )}

      <div className={cx("relative", !featured && "max-w-[54%]")}>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wide uppercase">
          {tag && <span className="rounded-full bg-(--accent) px-2.5 py-1 text-(--accent-ink)">{tag}</span>}
          <span className="inline-flex items-center gap-1 opacity-75">
            <Clock className="size-3" aria-hidden /> {experience.minutes} min{played ? " · played" : ""}
          </span>
        </div>
        <h2 className={cx("font-display mt-2 leading-none font-semibold", featured ? "text-4xl md:text-5xl" : "text-[1.6rem]")}>
          {experience.title}
        </h2>
        <p className={cx("mt-2 opacity-85", featured ? "text-lg" : "text-sm")}>{experience.teaser}</p>
        <span
          className={cx(
            "mt-4 inline-flex items-center gap-2 rounded-full bg-(--accent) font-bold text-(--accent-ink) shadow-lg transition group-hover:scale-105",
            featured ? "animate-glow px-8 py-3.5 text-lg" : "px-5 py-2.5 text-sm",
          )}
        >
          <Play className={featured ? "size-5" : "size-4"} fill="currentColor" aria-hidden /> Play
        </span>
      </div>
    </Link>
  );
}

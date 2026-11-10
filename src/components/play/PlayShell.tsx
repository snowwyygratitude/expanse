"use client";

import Link from "next/link";
import { House } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { ExperienceTheme } from "@/experiences";
import { cx } from "../ui";

export function themeVars(theme: ExperienceTheme): CSSProperties {
  return {
    "--bg1": theme.bg[0],
    "--bg2": theme.bg[1],
    "--fg": theme.fg,
    "--accent": theme.accent,
    "--accent-ink": theme.accentInk,
    "--panel": theme.panel,
  } as CSSProperties;
}

/** Full-screen themed frame for every experience: Home button, title, progress pips. */
export function PlayShell({
  theme,
  title,
  step,
  steps,
  fixed,
  children,
}: {
  theme: ExperienceTheme;
  title: string;
  step?: number;
  steps?: number;
  /** Lock to the viewport height (for chat-style layouts that scroll inside). */
  fixed?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={themeVars(theme)} className={cx("play-surface flex flex-col", fixed ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <header className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-3 pb-1">
        <Link
          href="/"
          aria-label="Back to Home"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-(--panel) transition hover:scale-105 active:scale-95"
        >
          <House className="size-5" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold opacity-80">{title}</p>
        {steps ? (
          <div className="flex gap-1.5" aria-label={`Part ${(step ?? 0) + 1} of ${steps}`}>
            {Array.from({ length: steps }, (_, i) => (
              <span
                key={i}
                className={cx(
                  "h-2 rounded-full transition-all duration-500",
                  i === step ? "w-6 bg-(--accent)" : i < (step ?? 0) ? "w-2 bg-(--accent)" : "w-2 bg-white/25",
                )}
              />
            ))}
          </div>
        ) : null}
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col px-4 pb-6">{children}</main>
    </div>
  );
}

/** Primary action on a play surface. */
export function PlayButton({
  children,
  className,
  pulse,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pulse?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-(--accent) px-6 py-3.5 text-base font-bold text-(--accent-ink) shadow-lg transition hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:active:scale-100",
        pulse && "animate-glow",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-(--panel) px-5 py-3 text-sm font-semibold transition hover:bg-white/15 active:scale-95",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const CONFETTI = ["#FF7A59", "#FFD84D", "#C8F560", "#7FD8FF", "#FF9FD5", "#FFFFFF"];

/** One-shot celebratory burst. Render it conditionally to trigger. */
export function Confetti() {
  return (
    <div className="confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2;
        const dist = 90 + ((i * 37) % 80);
        return (
          <i
            key={i}
            style={
              {
                background: CONFETTI[i % CONFETTI.length],
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist - 40}px`,
                "--r": `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
                animationDelay: `${(i % 5) * 30}ms`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

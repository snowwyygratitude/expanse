"use client";

import Link from "next/link";
import { Pause, Volume2, VolumeX, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ExperienceTheme } from "@/experiences";
import { themeVars } from "../play/PlayShell";
import { cx } from "../ui";

/* ---------- Optional voice ---------- */

const SoundContext = createContext<(text: string) => void>(() => {});
/** Speaks a line aloud when the viewer has switched sound on. */
export const useSpeak = () => useContext(SoundContext);

/**
 * The "video player" for story mode: a vertical stage with segmented
 * progress, timed beats that advance on their own, hold-to-pause, and an
 * optional voice. Beats that need the viewer (`duration: null`) wait for a
 * gesture instead of a timer.
 */
export function StoryStage({
  theme,
  title,
  segments,
  segment,
  beatKey,
  duration,
  onBeatEnd,
  children,
}: {
  theme: ExperienceTheme;
  title: string;
  segments: number;
  segment: number;
  /** Changes whenever a new beat starts, restarting the timer. */
  beatKey: string | number;
  /** Milliseconds this beat plays for, or null to wait for a gesture. */
  duration: number | null;
  onBeatEnd: () => void;
  children: ReactNode;
}) {
  const [held, setHeld] = useState(false);
  const [sound, setSound] = useState(false);
  const bar = useRef<HTMLSpanElement>(null);
  const done = useRef(onBeatEnd);
  done.current = onBeatEnd;
  const heldRef = useRef(false);
  heldRef.current = held;
  // A quick tap skips to the next beat; a longer press pauses while held.
  const press = useRef<{ at: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const TAP_MS = 220;

  const pressStart = () => {
    if (duration === null) return;
    press.current = { at: performance.now(), timer: setTimeout(() => setHeld(true), TAP_MS) };
  };
  const pressEnd = (allowTap: boolean) => {
    const p = press.current;
    press.current = null;
    setHeld(false);
    if (!p) return;
    clearTimeout(p.timer);
    if (allowTap && performance.now() - p.at < TAP_MS) done.current();
  };

  // Beat timer: advances the current progress segment and fires onBeatEnd.
  useEffect(() => {
    if (bar.current) bar.current.style.width = duration === null ? "100%" : "0%";
    if (duration === null) return;
    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (!heldRef.current) elapsed += now - last;
      last = now;
      if (bar.current) bar.current.style.width = `${Math.min((elapsed / duration) * 100, 100)}%`;
      if (elapsed >= duration) return done.current();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [beatKey, duration]);

  // Space pauses timed beats for keyboard users.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (duration === null) return;
      if (e.code === "Space") {
        e.preventDefault();
        setHeld(true);
      }
      if (e.key === "ArrowRight" || e.key === "Enter") done.current();
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [duration]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = useCallback(
    (text: string) => {
      if (!sound || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[“”"]/g, ""));
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    },
    [sound],
  );

  const timed = duration !== null;
  return (
    <div className="fixed inset-0 grid place-items-center bg-black">
      <div
        style={themeVars(theme)}
        className="play-surface relative flex h-dvh w-full flex-col overflow-hidden select-none md:max-w-[calc(100dvh*9/16)] md:rounded-[2rem]"
        onPointerDown={pressStart}
        onPointerUp={() => pressEnd(true)}
        onPointerLeave={() => pressEnd(false)}
        onPointerCancel={() => pressEnd(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="z-20 px-3 pt-3">
          <div className="flex gap-1" aria-label={`Part ${segment + 1} of ${segments}`}>
            {Array.from({ length: segments }, (_, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                {i < segment && <span className="block h-full w-full bg-white" />}
                {i === segment && (
                  <span ref={bar} className={cx("block h-full bg-white", !timed && "animate-pulse")} style={{ width: 0 }} />
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[13px] font-bold opacity-90">{title}</p>
            <button
              type="button"
              aria-pressed={sound}
              aria-label={sound ? "Turn voice off" : "Turn voice on"}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                if (sound) window.speechSynthesis?.cancel();
                setSound((s) => !s);
              }}
              className="grid size-9 place-items-center rounded-full bg-black/25 backdrop-blur"
            >
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
            <Link
              href="/"
              aria-label="Close and go Home"
              onPointerDown={(e) => e.stopPropagation()}
              className="grid size-9 place-items-center rounded-full bg-black/25 backdrop-blur"
            >
              <X className="size-4" />
            </Link>
          </div>
        </div>

        <SoundContext.Provider value={speak}>
          <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
        </SoundContext.Provider>

        {timed && !held && (
          <p className="pointer-events-none absolute inset-x-0 bottom-2 z-20 text-center text-[10px] font-bold tracking-wide uppercase opacity-45">
            Tap to continue · hold to pause
          </p>
        )}

        {held && timed && (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/30">
            <span className="animate-pop inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold">
              <Pause className="size-4" fill="currentColor" /> Paused
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** How long a caption should stay on screen, by length. */
export const readTime = (text: string, base = 1500) => base + text.length * 55;

/** Subtitle-style line that animates in word by word. */
export function Caption({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <p className={cx("font-display leading-[1.1] font-semibold text-balance", className)} aria-live="polite">
      {text.split(" ").map((word, i) => (
        <span key={`${text}-${i}`} className="story-word" style={{ animationDelay: `${delay + i * 70}ms` }}>
          {word}&nbsp;
        </span>
      ))}
    </p>
  );
}

/** Small instruction for the current gesture. */
export function GestureHint({ children }: { children: ReactNode }) {
  return (
    <p className="pointer-events-none text-center text-[12px] font-bold tracking-wide uppercase opacity-70">
      {children}
    </p>
  );
}

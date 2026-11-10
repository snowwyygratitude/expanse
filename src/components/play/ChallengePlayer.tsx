"use client";

import { ArrowRight, ChevronDown, Equal, RotateCcw } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type {
  AnchorChallenge,
  Challenge,
  ChallengeSet,
  FrameChallenge,
  SequenceChallenge,
} from "@/experiences";
import { useApp } from "@/lib/store";
import { cx } from "../ui";
import { InsightReveal } from "./InsightReveal";
import { Confetti, GhostButton, PlayButton, PlayShell } from "./PlayShell";
import { AnimatedNumber, useTweenedArray } from "./sim";

/**
 * Predict-and-reveal engine: one challenge at a time, the player commits
 * before anything is explained, and the principle is named only afterwards.
 */
export function ChallengePlayer({ set }: { set: ChallengeSet }) {
  const { recordPlay } = useApp();
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [tricked, setTricked] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const challenge = set.challenges[index];
  const count = Object.values(tricked).filter(Boolean).length;

  function report(id: string, wasTricked: boolean) {
    // The first attempt is the honest one: replays don't overwrite it.
    setTricked((t) => (id in t ? t : { ...t, [id]: wasTricked }));
  }

  function next() {
    if (index < set.challenges.length - 1) return setIndex((i) => i + 1);
    recordPlay(set.id, `tricked-${count}`, { tricked: count });
    setDone(true);
  }

  function restart() {
    setIndex(0);
    setTricked({});
    setDone(false);
    setRound((r) => r + 1);
  }

  if (done) {
    return (
      <PlayShell theme={set.theme} title={set.title}>
        <InsightReveal experience={set} onReplay={restart}>
          <div className="relative rounded-3xl bg-(--panel) p-5 text-center">
            {count === 0 && <Confetti />}
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">Your brain took the bait</p>
            <p className="font-display mt-1 text-5xl font-semibold">
              {count} <span className="text-2xl opacity-60">of {set.challenges.length}</span>
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {set.challenges.map((c) => (
                <span
                  key={c.id}
                  className={cx(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
                    tricked[c.id] ? "bg-rose-300 text-rose-950" : "bg-emerald-300 text-emerald-950",
                  )}
                >
                  {tricked[c.id] ? "Caught by" : "Dodged"} {c.principle.toLowerCase()}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs opacity-70">
              {count === 0 ? "Rare. Most people fall for at least one." : "That's normal. These catch nearly everyone."}
            </p>
          </div>
        </InsightReveal>
      </PlayShell>
    );
  }

  const props = { onResult: (t: boolean) => report(challenge.id, t), onNext: next, last: index === set.challenges.length - 1 };
  return (
    <PlayShell theme={set.theme} title={set.title} step={index} steps={set.challenges.length}>
      <div key={`${challenge.id}-${round}`} className="animate-step flex flex-1 flex-col pt-3">
        <p className="text-[11px] font-bold tracking-[0.14em] text-(--accent) uppercase">
          Challenge {index + 1} · {challenge.title}
        </p>
        {challenge.kind === "anchor" && <Anchor challenge={challenge} {...props} />}
        {challenge.kind === "frame" && <Frame challenge={challenge} {...props} />}
        {challenge.kind === "sequence" && <Sequence challenge={challenge} {...props} />}
      </div>
    </PlayShell>
  );
}

interface ChallengeProps<T extends Challenge> {
  challenge: T;
  onResult: (tricked: boolean) => void;
  onNext: () => void;
  last: boolean;
}

/* ---------- Shared reveal ---------- */

function Reveal({
  challenge,
  verdict,
  replayLabel,
  onReplay,
  onNext,
  last,
  children,
}: {
  challenge: Challenge;
  verdict: string;
  replayLabel?: string;
  onReplay?: () => void;
  onNext: () => void;
  last: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="animate-sheet mt-4 rounded-[1.75rem] bg-white p-5 text-[#22135E] shadow-2xl">
      <p className="text-sm font-bold">{verdict}</p>
      {children}
      <p className="mt-3 text-[11px] font-bold tracking-[0.14em] uppercase opacity-50">The trick</p>
      <p className="font-display text-2xl font-semibold">{challenge.principle}</p>
      <p className="mt-1 text-[15px] leading-snug opacity-80">{challenge.principleLine}</p>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100"
      >
        The research <ChevronDown className={cx("size-3.5 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && <p className="animate-rise mt-1 text-[13px] leading-relaxed opacity-70">{challenge.evidence}</p>}
      <div className="mt-4 flex gap-2">
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#22135E]/8 px-3 py-3 text-[13px] font-bold transition active:scale-95"
          >
            <RotateCcw className="size-3.5" aria-hidden /> {replayLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#22135E] px-3 py-3 text-[13px] font-bold text-white transition active:scale-95"
        >
          {last ? "See the pattern" : "Next challenge"} <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Bar({ label, value, max, color, suffix = "" }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const [w] = useTweenedArray([(value / max) * 100], 700);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[12px] font-semibold">
        <span>{label}</span>
        <span className="tabular-nums">
          <AnimatedNumber value={value} format={(n) => `${Math.round(n).toLocaleString()}${suffix}`} />
        </span>
      </div>
      <div className="mt-0.5 h-3 overflow-hidden rounded-full bg-[#22135E]/10">
        <div className="h-full rounded-full" style={{ width: `${Math.min(w, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------- 1. Anchoring ---------- */

function Tree({ height, max, label }: { height: number; max: number; label: string }) {
  const [h] = useTweenedArray([height], 300);
  const px = 26 + (h / max) * 150;
  return (
    <svg viewBox="0 0 320 200" className="mx-auto w-full max-w-sm" role="img" aria-label={`A tree ${Math.round(height)} feet tall`}>
      <line x1="20" x2="300" y1="190" y2="190" stroke="currentColor" opacity="0.3" strokeWidth="2" />
      {/* a person for scale */}
      <circle cx="96" cy="181" r="2.2" fill="currentColor" />
      <rect x="94.6" y="183.5" width="2.8" height="6.5" rx="1.2" fill="currentColor" />
      {/* ruler */}
      <line x1="232" x2="232" y1={190 - px} y2="190" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 4" />
      <line x1="224" x2="240" y1={190 - px} y2={190 - px} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <text x="246" y={194 - px} fontSize="15" fontWeight="800" fill="var(--accent)">{label}</text>
      {/* trunk and canopy */}
      <rect x="155" y={190 - px} width="10" height={px} rx="3" fill="#B9794B" />
      {[0.0, 0.22, 0.44].map((f, i) => (
        <path
          key={i}
          d={`M 160 ${190 - px - 8 + px * f * 0.9} l ${-(18 + i * 9)} ${px * 0.34} l ${(18 + i * 9) * 2} 0 Z`}
          fill={["#7BE495", "#56C97A", "#39A862"][i]}
        />
      ))}
    </svg>
  );
}

function Anchor({ challenge: c, onResult, onNext, last }: ChallengeProps<AnchorChallenge>) {
  const first = useMemo<"high" | "low">(() => (Math.random() < 0.5 ? "high" : "low"), []);
  const [which, setWhich] = useState<"high" | "low">(first);
  const [step, setStep] = useState<"compare" | "estimate" | "reveal">("compare");
  const [guess, setGuess] = useState(Math.round((c.range[0] + c.range[1]) / 2));
  const [touched, setTouched] = useState(false);
  const [attempts, setAttempts] = useState<{ which: "high" | "low"; guess: number }[]>([]);

  const anchor = c.anchors[which];
  const pulled = which === "high" ? guess > c.truth : guess < c.truth;
  const fill = ((guess - c.range[0]) / (c.range[1] - c.range[0])) * 100;

  function lock() {
    setAttempts((a) => [...a, { which, guess }]);
    if (attempts.length === 0) onResult(pulled);
    setStep("reveal");
  }

  function replay() {
    setWhich(which === "high" ? "low" : "high");
    setGuess(Math.round((c.range[0] + c.range[1]) / 2));
    setTouched(false);
    setStep("compare");
  }

  return (
    <>
      <Tree
        height={step === "reveal" ? c.truth : step === "estimate" ? guess : anchor}
        max={step === "reveal" ? Math.max(c.truth, ...attempts.map((a) => a.guess)) * 1.15 : c.range[1]}
        label={step === "reveal" ? `${c.truth} ${c.unit}` : step === "estimate" ? `${guess} ${c.unit}` : `${anchor.toLocaleString()} ${c.unit}?`}
      />

      {step === "compare" && (
        <div className="animate-sheet mt-3">
          <p className="text-xl leading-snug font-bold text-balance">
            Is {c.subject} taller or shorter than {anchor.toLocaleString()} {c.unit}?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["Taller", "Shorter"].map((label) => (
              <PlayButton key={label} onClick={() => setStep("estimate")}>
                {label}
              </PlayButton>
            ))}
          </div>
        </div>
      )}

      {step === "estimate" && (
        <div className="animate-sheet mt-3">
          <p className="text-xl leading-snug font-bold">So how tall is it? Grow the tree.</p>
          <input
            type="range"
            className="play-range mt-2"
            min={c.range[0]}
            max={c.range[1]}
            step={10}
            value={guess}
            aria-label={`Your estimate in ${c.unit}`}
            onChange={(e) => {
              setGuess(Number(e.target.value));
              setTouched(true);
            }}
            style={{ "--fill": `${fill}%` } as CSSProperties}
          />
          <PlayButton className="mt-2 w-full" disabled={!touched} pulse={touched} onClick={lock}>
            Lock in {guess} {c.unit}
          </PlayButton>
        </div>
      )}

      {step === "reveal" && (
        <Reveal
          challenge={c}
          verdict={pulled ? `Your guess leaned toward the ${anchor.toLocaleString()} you were shown.` : "You resisted the number you were shown. Nice."}
          replayLabel={`Retry with ${c.anchors[which === "high" ? "low" : "high"].toLocaleString()}`}
          onReplay={attempts.length < 2 ? replay : undefined}
          onNext={onNext}
          last={last}
        >
          <p className="mt-1 text-[13px] opacity-70">{c.truthNote}</p>
          <Bar label="Actual height" value={c.truth} max={c.range[1]} color="#39A862" suffix={` ${c.unit}`} />
          {attempts.map((a, i) => (
            <Bar
              key={i}
              label={`Your guess after seeing ${c.anchors[a.which].toLocaleString()}`}
              value={a.guess}
              max={c.range[1]}
              color={a.which === "high" ? "#F2617A" : "#5B8DEF"}
              suffix={` ${c.unit}`}
            />
          ))}
          <Bar
            label={`Study average after ${c.anchors[which].toLocaleString()}`}
            value={c.studyGuesses[which]}
            max={c.range[1]}
            color="#C9C2E8"
            suffix={` ${c.unit}`}
          />
        </Reveal>
      )}
    </>
  );
}

/* ---------- 2. Framing ---------- */

function Frame({ challenge: c, onResult, onNext, last }: ChallengeProps<FrameChallenge>) {
  const first = useMemo<"gain" | "loss">(() => (Math.random() < 0.5 ? "gain" : "loss"), []);
  const [frame, setFrame] = useState<"gain" | "loss">(first);
  const [step, setStep] = useState<"choose" | "spinning" | "reveal">("choose");
  const [spin, setSpin] = useState<{ deg: number; won: boolean } | null>(null);
  const [attempts, setAttempts] = useState<{ frame: "gain" | "loss"; gambled: boolean }[]>([]);

  const winDeg = c.winChance * 360;
  const sureLabel = frame === "gain" ? `Keep $${c.sure}` : `Lose $${c.stake - c.sure}`;

  function decide(gambled: boolean) {
    setAttempts((a) => [...a, { frame, gambled }]);
    // Following the wording (safe when told "keep", risky when told "lose") is the classic pattern.
    if (attempts.length === 0) onResult(frame === "gain" ? !gambled : gambled);
    if (!gambled) return setStep("reveal");
    const won = Math.random() < c.winChance;
    const landing = won ? Math.random() * (winDeg - 16) + 8 : winDeg + 8 + Math.random() * (360 - winDeg - 16);
    setSpin({ deg: 360 * 4 + (360 - landing), won });
    setStep("spinning");
    setTimeout(() => setStep("reveal"), 2600);
  }

  function replay() {
    setFrame(frame === "gain" ? "loss" : "gain");
    setSpin(null);
    setStep("choose");
  }

  const latest = attempts[attempts.length - 1];
  return (
    <>
      <div className="relative mx-auto mt-4 grid size-52 place-items-center">
        <div
          className="size-full rounded-full border-8 border-white/90 shadow-2xl"
          style={{
            background: `conic-gradient(#7BE495 0deg ${winDeg}deg, #F2617A ${winDeg}deg 360deg)`,
            transform: `rotate(${spin?.deg ?? 0}deg)`,
            transition: spin ? "transform 2.4s cubic-bezier(0.15, 0.8, 0.2, 1)" : "none",
          }}
        />
        <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-white drop-shadow" />
        <div className="absolute grid size-24 place-items-center rounded-full bg-white text-center text-[#22135E] shadow-lg">
          <div>
            <p className="font-display text-3xl leading-none font-bold">${c.stake}</p>
            <p className="text-[10px] font-bold tracking-wide uppercase opacity-60">is yours</p>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs opacity-75">
        <span className="font-bold text-[#7BE495]">{Math.round(c.winChance * 100)}% keep it all</span> ·{" "}
        <span className="font-bold text-[#FF9AAA]">{Math.round((1 - c.winChance) * 100)}% lose it all</span>
      </p>

      {step === "choose" && (
        <div className="animate-sheet mt-4">
          <p className="text-xl leading-snug font-bold text-balance">You've been handed ${c.stake}. Pick one.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PlayButton onClick={() => decide(false)}>{sureLabel}</PlayButton>
            <GhostButton className="border-2 border-white/30 py-3.5 text-base font-bold" onClick={() => decide(true)}>
              Spin the wheel
            </GhostButton>
          </div>
        </div>
      )}

      {step === "spinning" && <p className="mt-6 text-center text-lg font-bold opacity-80">Spinning…</p>}

      {step === "reveal" && latest && (
        <Reveal
          challenge={c}
          verdict={
            latest.gambled
              ? spin?.won
                ? `You spun and kept all $${c.stake}. Lucky!`
                : "You spun and lost it all. Ouch."
              : `You took the sure thing and walked away with $${c.sure}.`
          }
          replayLabel="Retry with other wording"
          onReplay={attempts.length < 2 ? replay : undefined}
          onNext={onNext}
          last={last}
        >
          <div className="mt-3 flex items-center justify-center gap-2 text-center">
            <span className={cx("rounded-2xl px-3 py-2 text-sm font-bold", frame === "gain" ? "bg-[#FFD84D]" : "bg-[#22135E]/8")}>
              “Keep ${c.sure}”
            </span>
            <Equal className="size-5 opacity-60" aria-label="is the same as" />
            <span className={cx("rounded-2xl px-3 py-2 text-sm font-bold", frame === "loss" ? "bg-[#FFD84D]" : "bg-[#22135E]/8")}>
              “Lose ${c.stake - c.sure}”
            </span>
          </div>
          <p className="mt-2 text-center text-[12px] opacity-60">Same money. You saw the highlighted wording.</p>
          <Bar label="Study: chose to gamble when told “keep”" value={c.studyGambleRate.gain} max={100} color="#5B8DEF" suffix="%" />
          <Bar label="Study: chose to gamble when told “lose”" value={c.studyGambleRate.loss} max={100} color="#F2617A" suffix="%" />
          {attempts.length === 2 && (
            <p className="mt-3 rounded-xl bg-[#22135E]/6 px-3 py-2 text-[13px] font-semibold">
              You: {attempts.map((a) => `“${a.frame === "gain" ? "keep" : "lose"}” → ${a.gambled ? "gambled" : "played safe"}`).join(" · ")}
            </p>
          )}
        </Reveal>
      )}
    </>
  );
}

/* ---------- 3. Randomness ---------- */

function Coins({ flips, small }: { flips: string; small?: boolean }) {
  return (
    <span className="flex gap-1">
      {flips.split("").map((f, i) => (
        <span
          key={i}
          className={cx(
            "grid place-items-center rounded-full border-2 font-black",
            small ? "size-6 text-[10px]" : "size-9 text-sm",
            f === "H" ? "border-[#B8860B] bg-[#FFD84D] text-[#6B4E00]" : "border-[#8A93A6] bg-[#E3E8F2] text-[#4A5266]",
          )}
        >
          {f}
        </span>
      ))}
    </span>
  );
}

function Sequence({ challenge: c, onResult, onNext, last }: ChallengeProps<SequenceChallenge>) {
  const [pick, setPick] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [runs, setRuns] = useState(0);

  function choose(id: string) {
    setPick(id);
    onResult(id !== "equal");
  }

  function simulate() {
    const tally: Record<string, number> = Object.fromEntries(c.sequences.map((s) => [s.flips, 0]));
    for (let i = 0; i < c.trials; i++) {
      let flips = "";
      for (let j = 0; j < 6; j++) flips += Math.random() < 0.5 ? "H" : "T";
      if (flips in tally) tally[flips]++;
    }
    setCounts(tally);
    setRuns((r) => r + 1);
  }

  const expected = c.trials / 64;
  return (
    <>
      <p className="mt-3 text-xl leading-snug font-bold text-balance">{c.question}</p>
      <div className="mt-4 space-y-2">
        {c.sequences.map((s, i) => (
          <button
            key={s.id}
            type="button"
            disabled={pick !== null}
            onClick={() => choose(s.id)}
            className={cx(
              "animate-sheet flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition active:scale-[0.98]",
              pick === s.id ? "border-(--accent) bg-white/15" : "border-white/20 bg-(--panel)",
              pick === null && "hover:border-(--accent)",
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Coins flips={s.flips} />
            <span className="text-sm font-semibold opacity-80">{s.label}</span>
          </button>
        ))}
        <button
          type="button"
          disabled={pick !== null}
          onClick={() => choose("equal")}
          className={cx(
            "animate-sheet w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-bold transition active:scale-[0.98]",
            pick === "equal" ? "border-(--accent) bg-white/15" : "border-white/20 bg-(--panel)",
            pick === null && "hover:border-(--accent)",
          )}
          style={{ animationDelay: "210ms" }}
        >
          They're all equally likely
        </button>
      </div>

      {pick && (
        <Reveal
          challenge={c}
          verdict={pick === "equal" ? "Exactly right. They're all equally likely." : "Surprise: all three are equally likely."}
          onNext={onNext}
          last={last}
        >
          <div className="mt-3 rounded-2xl bg-[#22135E]/6 p-3">
            {c.sequences.map((s) => (
              <div key={s.id} className="mt-1 first:mt-0">
                <div className="flex items-center justify-between">
                  <Coins flips={s.flips} small />
                  <span className="text-[12px] font-bold tabular-nums">
                    {counts ? <AnimatedNumber value={counts[s.flips]} format={(n) => `${Math.round(n)} times`} /> : "1 in 64"}
                  </span>
                </div>
                {counts && <Bar label="" value={counts[s.flips]} max={expected * 1.6} color="#7C5CFF" />}
              </div>
            ))}
            <button
              type="button"
              onClick={simulate}
              className="mt-3 w-full rounded-full bg-[#FFD84D] px-3 py-2.5 text-[13px] font-bold transition active:scale-95"
            >
              {runs === 0 ? `Prove it: flip 6 coins ${c.trials.toLocaleString()} times` : "Flip them all again"}
            </button>
            {counts && (
              <p className="mt-2 text-center text-[11px] opacity-60">
                About {Math.round(expected)} each is expected. The small differences are chance.
              </p>
            )}
          </div>
        </Reveal>
      )}
    </>
  );
}

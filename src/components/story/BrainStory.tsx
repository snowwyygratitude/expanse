"use client";

import { Equal } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AnchorChallenge, Challenge, ChallengeSet, FrameChallenge, SequenceChallenge } from "@/experiences";
import { useApp } from "@/lib/store";
import { Bar, Coins, spinTarget, Tree, Wheel } from "../play/ChallengePlayer";
import { InsightReveal } from "../play/InsightReveal";
import { Confetti } from "../play/PlayShell";
import { cx } from "../ui";
import { DragValue, ReplyDeck, SwipeChoice } from "./gestures";
import { Caption, StoryStage, useSpeak } from "./StoryStage";

type Step = "ask" | "estimate" | "spin" | "reveal";

/**
 * Trick Your Brain as a story: each challenge is answered with a gesture
 * (swipe, drag-and-hold, flick), then the reveal plays out like a clip.
 * Uses the same challenge data as the tap version.
 */
export function BrainStory({ set }: { set: ChallengeSet }) {
  const { recordPlay } = useApp();
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("ask");
  const [run, setRun] = useState(0);
  const [tricked, setTricked] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<"play" | "score" | "insight">("play");

  const challenge = set.challenges[index];
  const count = Object.values(tricked).filter(Boolean).length;

  function nextChallenge() {
    if (index < set.challenges.length - 1) {
      setIndex((i) => i + 1);
      setStep("ask");
      return;
    }
    recordPlay(set.id, `tricked-${count}`, { tricked: count });
    setPhase("score");
  }

  function restart() {
    setIndex(0);
    setStep("ask");
    setTricked({});
    setPhase("play");
    setRun((r) => r + 1);
  }

  const duration =
    phase === "score" ? 4500 : phase === "insight" ? null : step === "reveal" ? 10000 : step === "spin" ? 3000 : null;
  const onBeatEnd = phase === "score" ? () => setPhase("insight") : step === "spin" ? () => setStep("reveal") : nextChallenge;

  const shared = {
    step,
    setStep,
    onResult: (t: boolean) => setTricked((prev) => ({ ...prev, [challenge.id]: t })),
  };

  return (
    <StoryStage
      theme={set.theme}
      title={set.title}
      segments={set.challenges.length + 1}
      segment={phase === "play" ? index : set.challenges.length}
      beatKey={`${run}-${phase}-${index}-${step}`}
      duration={duration}
      onBeatEnd={onBeatEnd}
    >
      {phase === "insight" ? (
        <div className="flex-1 overflow-y-auto px-4 pb-6" onPointerDown={(e) => e.stopPropagation()}>
          <InsightReveal experience={set} replayLabel="Watch again" onReplay={restart}>
            <div className="flex flex-wrap justify-center gap-2 rounded-3xl bg-(--panel) p-4">
              {set.challenges.map((c) => (
                <span key={c.id} className={cx("rounded-full px-3 py-1.5 text-xs font-bold", tricked[c.id] ? "bg-rose-300 text-rose-950" : "bg-emerald-300 text-emerald-950")}>
                  {tricked[c.id] ? "Caught by" : "Dodged"} {c.principle.toLowerCase()}
                </span>
              ))}
            </div>
          </InsightReveal>
        </div>
      ) : phase === "score" ? (
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
          {count === 0 && <Confetti />}
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-70">Your brain took the bait</p>
          <p className="font-display animate-pop mt-2 text-[7rem] leading-none font-semibold text-(--accent)">
            {count}
            <span className="text-4xl opacity-70">/{set.challenges.length}</span>
          </p>
          <Caption text={count === 0 ? "Rare. Most people fall for at least one." : "Normal. These catch nearly everyone."} className="mt-4 text-2xl" delay={500} />
        </div>
      ) : (
        <div key={`${run}-${challenge.id}`} className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4">
          <p className="text-[11px] font-bold tracking-[0.14em] text-(--accent) uppercase">
            {index + 1} of {set.challenges.length} · {challenge.title}
          </p>
          {challenge.kind === "anchor" && <AnchorScene c={challenge} {...shared} />}
          {challenge.kind === "frame" && <FrameScene c={challenge} {...shared} />}
          {challenge.kind === "sequence" && <SequenceScene c={challenge} {...shared} />}
        </div>
      )}
    </StoryStage>
  );
}

interface SceneProps<T extends Challenge> {
  c: T;
  step: Step;
  setStep: (step: Step) => void;
  onResult: (tricked: boolean) => void;
}

/** The reveal card that plays after the viewer has committed. */
function Trick({ challenge, verdict, children }: { challenge: Challenge; verdict: string; children?: ReactNode }) {
  const speak = useSpeak();
  useEffect(() => {
    speak(`${verdict} ${challenge.principle}. ${challenge.principleLine}`);
  }, [challenge, verdict, speak]);
  return (
    <div className="animate-sheet pointer-events-none mt-3 rounded-[1.75rem] bg-white p-5 text-[#22135E] shadow-2xl">
      <p className="text-[15px] leading-snug font-bold">{verdict}</p>
      {children}
      <div className="animate-sheet" style={{ animationDelay: "1800ms" }}>
        <p className="mt-3 text-[11px] font-bold tracking-[0.14em] uppercase opacity-50">The trick</p>
        <p className="font-display text-3xl font-semibold">{challenge.principle}</p>
        <p className="mt-1 text-[15px] leading-snug opacity-80">{challenge.principleLine}</p>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold tracking-wide uppercase opacity-40">Hold to pause</p>
    </div>
  );
}

/* ---------- Anchoring ---------- */

function AnchorScene({ c, step, setStep, onResult }: SceneProps<AnchorChallenge>) {
  const which = useMemo<"high" | "low">(() => (Math.random() < 0.5 ? "high" : "low"), []);
  const [guess, setGuess] = useState(Math.round((c.range[0] + c.range[1]) / 2 / 10) * 10);
  const anchor = c.anchors[which];
  const pulled = which === "high" ? guess > c.truth : guess < c.truth;

  if (step === "ask") {
    return (
      <>
        <Caption text={`Is ${c.subject} taller or shorter than ${anchor.toLocaleString()} ${c.unit}?`} className="mt-2 text-[1.7rem]" />
        <SwipeChoice
          axis="y"
          first={{ id: "taller", label: "Taller" }}
          second={{ id: "shorter", label: "Shorter" }}
          onChoose={() => setStep("estimate")}
        >
          <div className="w-full">
            <Tree height={anchor} max={c.range[1]} label={`${anchor.toLocaleString()} ${c.unit}?`} />
          </div>
        </SwipeChoice>
      </>
    );
  }

  if (step === "estimate") {
    return (
      <>
        <Caption text="So how tall is it? Grow the tree." className="mt-2 text-[1.7rem]" />
        <DragValue
          axis="y"
          min={c.range[0]}
          max={c.range[1]}
          step={10}
          value={guess}
          onChange={setGuess}
          onLock={() => {
            onResult(pulled);
            setStep("reveal");
          }}
          hint="Drag up or down to set the height"
          lockLabel="Hold still to lock your guess"
        >
          <div className="pointer-events-none flex flex-1 flex-col justify-center">
            <Tree height={guess} max={c.range[1]} label={`${guess} ${c.unit}`} />
          </div>
        </DragValue>
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none">
        <Tree height={c.truth} max={Math.max(c.truth, guess) * 1.15} label={`${c.truth} ${c.unit}`} />
      </div>
      <Trick challenge={c} verdict={pulled ? `Your guess leaned toward the ${anchor.toLocaleString()} you were shown.` : "You resisted the number you were shown."}>
        <Bar label="Actual height" value={c.truth} max={c.range[1]} color="#39A862" suffix={` ${c.unit}`} />
        <Bar label={`Your guess after seeing ${anchor.toLocaleString()}`} value={guess} max={c.range[1]} color={which === "high" ? "#F2617A" : "#5B8DEF"} suffix={` ${c.unit}`} />
        <Bar label="Study average for that number" value={c.studyGuesses[which]} max={c.range[1]} color="#C9C2E8" suffix={` ${c.unit}`} />
      </Trick>
    </>
  );
}

/* ---------- Framing ---------- */

function FrameScene({ c, step, setStep, onResult }: SceneProps<FrameChallenge>) {
  const frame = useMemo<"gain" | "loss">(() => (Math.random() < 0.5 ? "gain" : "loss"), []);
  const [gambled, setGambled] = useState(false);
  const [spin, setSpin] = useState<{ deg: number; won: boolean } | null>(null);
  const sureLabel = frame === "gain" ? `Keep $${c.sure}` : `Lose $${c.stake - c.sure}`;

  // Start the wheel one frame after the spin scene mounts so it animates.
  useEffect(() => {
    if (step !== "spin" || spin) return;
    const won = Math.random() < c.winChance;
    const frameId = requestAnimationFrame(() => setSpin({ deg: spinTarget(c.winChance, won), won }));
    return () => cancelAnimationFrame(frameId);
  }, [step, spin, c.winChance]);

  const odds = (
    <p className="mt-2 text-center text-xs opacity-80">
      <span className="font-bold text-[#7BE495]">{Math.round(c.winChance * 100)}% keep it all</span> ·{" "}
      <span className="font-bold text-[#FF9AAA]">{Math.round((1 - c.winChance) * 100)}% lose it all</span>
    </p>
  );

  if (step === "ask") {
    return (
      <>
        <Caption text={`You've been handed $${c.stake}. Your call.`} className="mt-2 text-[1.7rem]" />
        <SwipeChoice
          axis="x"
          first={{ id: "sure", label: sureLabel }}
          second={{ id: "spin", label: "Spin the wheel" }}
          onChoose={(id) => {
            const risky = id === "spin";
            setGambled(risky);
            // Following the wording (safe on "keep", risky on "lose") is the classic pattern.
            onResult(frame === "gain" ? !risky : risky);
            setStep(risky ? "spin" : "reveal");
          }}
        >
          <div>
            <Wheel stake={c.stake} winChance={c.winChance} />
            {odds}
          </div>
        </SwipeChoice>
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none">
        <Wheel stake={c.stake} winChance={c.winChance} spinDeg={spin?.deg} />
        {odds}
      </div>
      {step === "spin" && <Caption text="Spinning…" className="mt-6 text-center text-3xl" />}
      {step === "reveal" && (
        <Trick
          challenge={c}
          verdict={gambled ? (spin?.won ? `You spun and kept all $${c.stake}. Lucky!` : "You spun and lost it all. Ouch.") : `You took the sure thing: $${c.sure}.`}
        >
          <div className="mt-3 flex items-center justify-center gap-2 text-center">
            <span className={cx("rounded-2xl px-3 py-2 text-sm font-bold", frame === "gain" ? "bg-[#FFD84D]" : "bg-[#22135E]/8")}>“Keep ${c.sure}”</span>
            <Equal className="size-5 opacity-60" aria-label="is the same as" />
            <span className={cx("rounded-2xl px-3 py-2 text-sm font-bold", frame === "loss" ? "bg-[#FFD84D]" : "bg-[#22135E]/8")}>“Lose ${c.stake - c.sure}”</span>
          </div>
          <Bar label="Study: gambled when told “keep”" value={c.studyGambleRate.gain} max={100} color="#5B8DEF" suffix="%" />
          <Bar label="Study: gambled when told “lose”" value={c.studyGambleRate.loss} max={100} color="#F2617A" suffix="%" />
        </Trick>
      )}
    </>
  );
}

/* ---------- Randomness ---------- */

function SequenceScene({ c, step, setStep, onResult }: SceneProps<SequenceChallenge>) {
  const [pick, setPick] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  // The proof plays by itself a moment into the reveal.
  useEffect(() => {
    if (step !== "reveal") return;
    const timer = setTimeout(() => {
      const tally: Record<string, number> = Object.fromEntries(c.sequences.map((s) => [s.flips, 0]));
      for (let i = 0; i < c.trials; i++) {
        let flips = "";
        for (let j = 0; j < 6; j++) flips += Math.random() < 0.5 ? "H" : "T";
        if (flips in tally) tally[flips]++;
      }
      setCounts(tally);
    }, 1200);
    return () => clearTimeout(timer);
  }, [step, c]);

  if (step === "ask") {
    return (
      <>
        <Caption text={c.question} className="mt-2 text-[1.7rem]" />
        <div className="flex-1" />
        <ReplyDeck
          sendLabel="Flick up to pick"
          options={[
            ...c.sequences.map((s) => ({
              id: s.id,
              content: (
                <span className="flex flex-col items-center gap-2">
                  <Coins flips={s.flips} />
                  <span className="text-sm">{s.label}</span>
                </span>
              ),
            })),
            { id: "equal", content: "They're all equally likely" },
          ]}
          onSend={(id) => {
            setPick(id);
            onResult(id !== "equal");
            setStep("reveal");
          }}
        />
      </>
    );
  }

  const expected = c.trials / 64;
  return (
    <Trick challenge={c} verdict={pick === "equal" ? "Exactly right. They're all equally likely." : "Surprise: all three are equally likely."}>
      <p className="mt-2 text-[12px] font-semibold opacity-60">
        {counts ? `6 coins flipped ${c.trials.toLocaleString()} times:` : "Each is 1 in 64. Flipping to prove it…"}
      </p>
      {c.sequences.map((s) => (
        <div key={s.id} className="mt-2">
          <Coins flips={s.flips} small />
          <Bar label="" value={counts?.[s.flips] ?? 0} max={expected * 1.6} color="#7C5CFF" suffix=" times" />
        </div>
      ))}
    </Trick>
  );
}

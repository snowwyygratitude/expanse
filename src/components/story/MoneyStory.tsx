"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SavingsSimulation } from "@/experiences";
import { useApp } from "@/lib/store";
import { InsightReveal } from "../play/InsightReveal";
import { Confetti } from "../play/PlayShell";
import { AnimatedNumber, ProjectionChart, savingsSeries, usd, usdShort } from "../play/sim";
import { DragValue, ReplyDeck } from "./gestures";
import { Caption, StoryStage, useSpeak } from "./StoryStage";

const EARLY = "#C8F560";
const LATE = "#FF9F6B";

type Scene = "race" | "guess" | "catchup" | "answer" | "scrub" | "insight";
const ORDER: Scene[] = ["race", "guess", "catchup", "answer", "scrub", "insight"];
const DURATION: Partial<Record<Scene, number>> = { race: 7000, answer: 6500 };

/**
 * The Money Playground as a story: the chart plays like a clip, and the
 * viewer joins in by flicking a guess, dragging a line upward, and scrubbing
 * time sideways. Uses the same simulation data as the tap version.
 */
export function MoneyStory({ sim }: { sim: SavingsSimulation }) {
  const { recordPlay } = useApp();
  const c = sim.challenge;
  const [scene, setScene] = useState<Scene>("race");
  const [run, setRun] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const [monthly, setMonthly] = useState(c.slider.initial);
  const [wait, setWait] = useState(0);
  const [reveal, setReveal] = useState(0);
  const fromAge = c.early.startAge;

  const next = () => setScene((s) => ORDER[Math.min(ORDER.indexOf(s) + 1, ORDER.length - 1)]);

  // Opening clip: the two lines draw themselves across the years.
  useEffect(() => {
    if (scene !== "race") return setReveal(1);
    setReveal(0);
    const startAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - startAt - 900) / 4200, 1);
      setReveal(Math.max(0, t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scene, run]);

  useEffect(() => {
    if (scene === "insight") recordPlay(sim.id, "watched");
  }, [scene, recordPlay, sim.id]);

  const early = useMemo(
    () => savingsSeries({ fromAge, endAge: sim.endAge, startAge: c.early.startAge, monthly: c.early.monthly, rate: c.rate }),
    [c, fromAge, sim.endAge],
  );
  const lateStart = scene === "scrub" ? Math.min(fromAge + wait, sim.endAge - 1) : c.late.startAge;
  const lateMonthly = scene === "scrub" ? c.early.monthly : monthly;
  const late = useMemo(
    () => savingsSeries({ fromAge, endAge: sim.endAge, startAge: lateStart, monthly: lateMonthly, rate: c.rate }),
    [c.rate, fromAge, sim.endAge, lateStart, lateMonthly],
  );
  const earlyEnd = early[early.length - 1];
  const lateEnd = late[late.length - 1];
  const caught = lateEnd >= earlyEnd;
  const needed = useMemo(() => {
    for (let m = c.slider.min; m <= c.slider.max; m += c.slider.step) {
      const s = savingsSeries({ fromAge, endAge: sim.endAge, startAge: c.late.startAge, monthly: m, rate: c.rate });
      if (s[s.length - 1] >= earlyEnd) return m;
    }
    return c.slider.max;
  }, [c, fromAge, sim.endAge, earlyEnd]);

  // Once caught up, celebrate briefly and move on by itself.
  useEffect(() => {
    if (scene !== "catchup" || !caught) return;
    const timer = setTimeout(next, 1500);
    return () => clearTimeout(timer);
  }, [scene, caught]);

  function restart() {
    setGuess(null);
    setMonthly(c.slider.initial);
    setWait(0);
    setRun((r) => r + 1);
    setScene("race");
  }

  const guessed = c.guesses.find((g) => g.id === guess);
  const age = Math.round(fromAge + reveal * (sim.endAge - fromAge));

  const chart = (
    <div className="pointer-events-none rounded-3xl bg-(--panel) p-3">
      <div className="flex justify-between px-1 text-[13px] font-bold">
        <span style={{ color: EARLY }}>
          {scene === "scrub" ? "Start now" : `${c.early.name} · from ${c.early.startAge}`}
          <AnimatedNumber value={scene === "race" ? early[age - fromAge] : earlyEnd} format={usdShort} className="block text-2xl font-black tabular-nums" />
        </span>
        <span style={{ color: LATE }} className="text-right">
          {scene === "scrub" ? `Wait ${lateStart - fromAge} yrs` : `${c.late.name} · from ${c.late.startAge}`}
          <AnimatedNumber value={scene === "race" ? late[age - fromAge] : lateEnd} format={usdShort} className="block text-2xl font-black tabular-nums" />
        </span>
      </div>
      <ProjectionChart
        fromAge={fromAge}
        endAge={sim.endAge}
        max={earlyEnd}
        reveal={reveal}
        series={[
          { id: "early", label: c.early.name, color: EARLY, values: early, fill: true },
          { id: "late", label: c.late.name, color: LATE, values: late },
        ]}
      />
      <p className="px-1 text-[10px] leading-snug opacity-55">
        Illustration only: steady {c.rate}% yearly growth, no inflation, fees or taxes. Real returns vary. Not advice.
      </p>
    </div>
  );

  return (
    <StoryStage
      theme={sim.theme}
      title={sim.title}
      segments={ORDER.length}
      segment={ORDER.indexOf(scene)}
      beatKey={`${scene}-${run}`}
      duration={DURATION[scene] ?? null}
      onBeatEnd={next}
    >
      {scene === "insight" ? (
        <div className="flex-1 overflow-y-auto px-4 pb-6" onPointerDown={(e) => e.stopPropagation()}>
          <InsightReveal experience={sim} replayLabel="Watch again" onReplay={restart}>
            <div className="rounded-3xl bg-(--panel) p-4 text-center">
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">You found</p>
              <p className="font-display mt-1 text-xl leading-snug font-semibold text-balance">{c.reveal}</p>
            </div>
          </InsightReveal>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4">
          {scene === "race" && (
            <>
              {chart}
              <div className="flex flex-1 flex-col justify-center">
                <Narration key={reveal < 1 ? "a" : "b"} text={reveal < 1 ? `Same ${usd(c.early.monthly)} a month. ${c.late.name} just starts 10 years later.` : `At 65, ${c.early.name} has about twice as much.`} />
                <p className="mt-3 text-center text-5xl font-black tabular-nums text-(--accent)">age {age}</p>
              </div>
            </>
          )}

          {scene === "guess" && (
            <>
              {chart}
              <div className="flex flex-1 flex-col justify-center">
                <Narration text={`How much more must ${c.late.name} save to catch up?`} />
              </div>
              <ReplyDeck
                sendLabel="Flick up to lock your guess"
                options={c.guesses.map((g) => ({ id: g.id, content: <span className="font-display text-4xl">{g.label}</span> }))}
                onSend={(id) => {
                  setGuess(id);
                  next();
                }}
              />
            </>
          )}

          {scene === "catchup" && (
            <DragValue
              axis="y"
              min={c.slider.min}
              max={c.slider.max}
              step={c.slider.step}
              value={monthly}
              onChange={setMonthly}
              hint={`Drag up to raise ${c.late.name}'s savings`}
              onSkip={caught ? undefined : () => setMonthly(needed)}
            >
              {chart}
              <div className="relative flex flex-1 flex-col items-center justify-center text-center">
                {caught && <Confetti />}
                <p className="text-sm font-bold opacity-70">{c.late.name} saves per month</p>
                <p className="font-display text-7xl font-semibold tabular-nums text-(--accent)">{usd(monthly)}</p>
                <p className="mt-2 text-xl font-bold" aria-live="polite">
                  {caught ? `Caught up at ${(monthly / c.early.monthly).toFixed(1)}×!` : `${usdShort(earlyEnd - lateEnd)} behind`}
                </p>
              </div>
            </DragValue>
          )}

          {scene === "answer" && (
            <>
              {chart}
              <div className="flex flex-1 flex-col justify-center text-center">
                <p className="text-sm font-bold opacity-70">You guessed {guessed?.label.toLowerCase()}. It takes</p>
                <p className="font-display animate-pop text-8xl font-semibold text-(--accent)">{(needed / c.early.monthly).toFixed(1)}×</p>
                <Narration text={c.reveal} small />
              </div>
            </>
          )}

          {scene === "scrub" && (
            <DragValue
              axis="x"
              min={0}
              max={30}
              step={1}
              value={wait}
              onChange={setWait}
              onLock={next}
              canLock={wait >= 15}
              lockMs={2200}
              lockLabel="Hold still to see why"
              onSkip={next}
              hint={wait > 0 ? "Keep dragging: wait 15+ years" : "Drag sideways to scrub the wait"}
            >
              {chart}
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-sm font-bold opacity-70">Waiting {wait} year{wait === 1 ? "" : "s"} costs</p>
                <AnimatedNumber value={earlyEnd - lateEnd} format={usdShort} className="font-display text-7xl font-semibold tabular-nums text-(--accent)" />
                <p className="mt-2 text-sm opacity-75">
                  but only skips <strong>{usdShort(c.early.monthly * 12 * wait)}</strong> of deposits
                </p>
              </div>
            </DragValue>
          )}
        </div>
      )}
    </StoryStage>
  );
}

function Narration({ text, small }: { text: string; small?: boolean }) {
  const speak = useSpeak();
  const spoken = useRef("");
  useEffect(() => {
    if (spoken.current !== text) speak(text);
    spoken.current = text;
  }, [text, speak]);
  return <Caption text={text} className={small ? "mt-3 text-center text-xl" : "text-center text-[1.75rem]"} />;
}

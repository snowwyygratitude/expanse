"use client";

import { ArrowRight, Check, ChevronDown, Dices, Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { SavingsSimulation } from "@/experiences";
import { useApp } from "@/lib/store";
import { cx } from "../ui";
import { InsightReveal } from "./InsightReveal";
import { Confetti, GhostButton, PlayButton, PlayShell } from "./PlayShell";
import { AnimatedNumber, ProjectionChart, SimSlider, savingsSeries, usd, usdShort, wobblyRates } from "./sim";

const EARLY = "#C8F560";
const LATE = "#FF9F6B";
const WOBBLE = "#7FD8FF";

type Stage = "guess" | "catchup" | "sandbox" | "insight";

/** Simulation engine for the savings model: predict, test by dragging, then free play. */
export function SimulationPlayer({ sim }: { sim: SavingsSimulation }) {
  const { recordPlay } = useApp();
  const [stage, setStage] = useState<Stage>("guess");
  const [guess, setGuess] = useState<string | null>(null);

  const reset = () => {
    setStage("guess");
    setGuess(null);
  };
  const stageIndex = { guess: 0, catchup: 0, sandbox: 1, insight: 2 }[stage];

  return (
    <PlayShell theme={sim.theme} title={sim.title} step={stageIndex} steps={3}>
      {(stage === "guess" || stage === "catchup") && (
        <CatchUp
          sim={sim}
          guess={guess}
          onGuess={(id) => {
            setGuess(id);
            setStage("catchup");
          }}
          onNext={() => setStage("sandbox")}
        />
      )}
      {stage === "sandbox" && (
        <Sandbox
          sim={sim}
          onDone={(quests) => {
            recordPlay(sim.id, "played", { quests });
            setStage("insight");
          }}
        />
      )}
      {stage === "insight" && (
        <InsightReveal experience={sim} onReplay={reset}>
          <div className="rounded-3xl bg-(--panel) p-4 text-center">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">You found</p>
            <p className="font-display mt-1 text-xl leading-snug font-semibold text-balance">{sim.challenge.reveal}</p>
          </div>
        </InsightReveal>
      )}
    </PlayShell>
  );
}

/* ---------- Stage 1: guess, then drag to find out ---------- */

function CatchUp({
  sim,
  guess,
  onGuess,
  onNext,
}: {
  sim: SavingsSimulation;
  guess: string | null;
  onGuess: (id: string) => void;
  onNext: () => void;
}) {
  const c = sim.challenge;
  const [monthly, setMonthly] = useState(c.slider.initial);
  const [gaveUp, setGaveUp] = useState(false);
  const fromAge = c.early.startAge;

  const early = useMemo(
    () => savingsSeries({ fromAge, endAge: sim.endAge, startAge: c.early.startAge, monthly: c.early.monthly, rate: c.rate }),
    [c, fromAge, sim.endAge],
  );
  const late = useMemo(
    () => savingsSeries({ fromAge, endAge: sim.endAge, startAge: c.late.startAge, monthly, rate: c.rate }),
    [c, fromAge, sim.endAge, monthly],
  );
  const earlyEnd = early[early.length - 1];
  const lateEnd = late[late.length - 1];
  const gap = earlyEnd - lateEnd;
  const caught = gap <= 0;
  const done = caught || gaveUp;
  const multiple = monthly / c.early.monthly;
  const guessed = c.guesses.find((g) => g.id === guess);
  const needed = useMemo(() => {
    for (let m = c.slider.min; m <= c.slider.max; m += c.slider.step) {
      const s = savingsSeries({ fromAge, endAge: sim.endAge, startAge: c.late.startAge, monthly: m, rate: c.rate });
      if (s[s.length - 1] >= earlyEnd) return m;
    }
    return c.slider.max;
  }, [c, fromAge, sim.endAge, earlyEnd]);

  return (
    <div className="flex flex-1 flex-col pt-3">
      <div className="rounded-3xl bg-(--panel) p-3">
        <div className="flex justify-between px-1 text-sm font-bold">
          <span style={{ color: EARLY }}>
            {c.early.name} · from {c.early.startAge} · <AnimatedNumber value={earlyEnd} format={usdShort} />
          </span>
          <span style={{ color: LATE }}>
            {c.late.name} · from {c.late.startAge} · <AnimatedNumber value={lateEnd} format={usdShort} />
          </span>
        </div>
        <ProjectionChart
          fromAge={fromAge}
          endAge={sim.endAge}
          max={earlyEnd}
          series={[
            { id: "early", label: c.early.name, color: EARLY, values: early, fill: true },
            { id: "late", label: c.late.name, color: LATE, values: late },
          ]}
        />
      </div>

      {!guess ? (
        <div className="animate-sheet mt-5">
          <p className="text-xl leading-snug font-bold text-balance">{c.prompt}</p>
          <p className="mt-1 text-sm opacity-70">Both save {usd(c.early.monthly)}/month right now. Take a guess.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {c.guesses.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onGuess(g.id)}
                className="rounded-2xl border-2 border-white/20 bg-(--panel) px-2 py-4 text-base font-bold transition hover:border-(--accent) active:scale-95"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-sheet relative mt-5">
          {caught && <Confetti />}
          <p className="text-lg leading-snug font-bold">
            {done ? (caught ? `${c.late.name} caught up!` : "Here's the answer.") : `Now test it. Drag until ${c.late.name} catches ${c.early.name}.`}
          </p>
          <div className="mt-3">
            <SimSlider param={c.slider} value={monthly} onChange={setMonthly} />
          </div>
          <p className={cx("mt-1 text-center text-2xl font-black tabular-nums", caught ? "text-(--accent)" : "")} aria-live="polite">
            {caught ? `${multiple.toFixed(1)}× ${c.early.name}'s monthly amount` : `${usdShort(gap)} behind`}
          </p>

          {done ? (
            <div className="animate-sheet mt-4 rounded-3xl bg-white p-5 text-[#0B2B22]">
              <p className="text-[15px] leading-relaxed font-medium">
                You guessed <strong>{guessed?.label.toLowerCase()}</strong>. It takes about{" "}
                <strong>{usd(needed)}</strong> a month, roughly <strong>{(needed / c.early.monthly).toFixed(1)}×</strong>.
              </p>
              <p className="mt-1 text-[15px] leading-relaxed opacity-70">{c.reveal}</p>
              <PlayButton className="mt-4 w-full" onClick={onNext}>
                Now break it yourself <ArrowRight className="size-4" aria-hidden />
              </PlayButton>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMonthly(needed);
                setGaveUp(true);
              }}
              className="mx-auto mt-3 block text-xs font-semibold underline-offset-4 opacity-60 hover:underline hover:opacity-100"
            >
              Just show me
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Stage 2: sandbox with small discoveries ---------- */

function Sandbox({ sim, onDone }: { sim: SavingsSimulation; onDone: (questsFound: number) => void }) {
  const s = sim.sandbox;
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(s.params.map((p) => [p.id, p.initial])),
  );
  const [wobble, setWobble] = useState<number[] | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const fromAge = s.startAge;
  const years = sim.endAge - fromAge;
  const { wait, monthly, rate } = values;
  const lateStart = Math.min(fromAge + wait, sim.endAge - 1);

  const now = useMemo(
    () => savingsSeries({ fromAge, endAge: sim.endAge, startAge: fromAge, monthly, rate }),
    [fromAge, sim.endAge, monthly, rate],
  );
  const later = useMemo(
    () => savingsSeries({ fromAge, endAge: sim.endAge, startAge: lateStart, monthly, rate }),
    [fromAge, sim.endAge, lateStart, monthly, rate],
  );
  const wobbly = useMemo(
    () => (wobble ? savingsSeries({ fromAge, endAge: sim.endAge, startAge: fromAge, monthly, rate: wobble }) : null),
    [wobble, fromAge, sim.endAge, monthly],
  );

  const nowEnd = now[now.length - 1];
  const laterEnd = later[later.length - 1];
  const deposits = monthly * 12 * years;
  const skipped = monthly * 12 * (lateStart - fromAge);
  const growthShare = nowEnd > 0 ? Math.max(0, (nowEnd - deposits) / nowEnd) : 0;

  function discover(id: string) {
    if (found.includes(id)) return;
    setFound((f) => [...f, id]);
    setToast(s.quests.find((q) => q.id === id)?.found ?? null);
  }

  function set(id: string, value: number) {
    const next = { ...values, [id]: value };
    setValues(next);
    if (id === "rate") setWobble(null);
    if (next.rate === 0) discover("zero");
    if (next.wait >= 20) discover("long-wait");
  }

  function roll() {
    setWobble(wobblyRates(years, rate));
    discover("wobble");
  }

  return (
    <div className="flex flex-1 flex-col pt-3">
      <p className="text-xl font-bold">{s.prompt}</p>

      <div className="mt-3 rounded-3xl bg-(--panel) p-3">
        <div className="grid grid-cols-2 gap-2 px-1">
          <div>
            <p className="text-[11px] font-bold tracking-wide uppercase" style={{ color: EARLY }}>Start now</p>
            <AnimatedNumber value={nowEnd} format={usdShort} className="text-2xl font-black tabular-nums" />
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold tracking-wide uppercase" style={{ color: LATE }}>
              Wait {lateStart - fromAge} yrs
            </p>
            <AnimatedNumber value={laterEnd} format={usdShort} className="text-2xl font-black tabular-nums" />
          </div>
        </div>
        <ProjectionChart
          fromAge={fromAge}
          endAge={sim.endAge}
          series={[
            { id: "now", label: "Start now", color: EARLY, values: now, fill: true },
            { id: "later", label: "Wait", color: LATE, values: later },
            ...(wobbly ? [{ id: "wobble", label: "Wobbly", color: WOBBLE, values: wobbly, dashed: true }] : []),
          ]}
        />
        <div className="mt-1 flex h-5 overflow-hidden rounded-full bg-white/10 text-[10px] font-bold">
          <span className="grid place-items-center bg-white/35 transition-all duration-500" style={{ width: `${(1 - growthShare) * 100}%` }}>
            {growthShare < 0.8 && "you put in"}
          </span>
          <span className="grid flex-1 place-items-center text-[#0B2B22] transition-all duration-500" style={{ background: EARLY }}>
            {growthShare > 0.15 && `growth ${Math.round(growthShare * 100)}%`}
          </span>
        </div>
        <p className="mt-2 px-1 text-[13px] leading-snug opacity-80" aria-live="polite">
          {wobbly ? (
            <>
              <span style={{ color: WOBBLE }} className="font-bold">Wobbly future: {usdShort(wobbly[wobbly.length - 1])}.</span>{" "}
              Same average growth, different luck.
            </>
          ) : lateStart === fromAge ? (
            "No wait, no gap. Drag the wait slider."
          ) : (
            <>
              Waiting skips <strong>{usdShort(skipped)}</strong> of deposits but costs{" "}
              <strong className="text-(--accent)">{usdShort(nowEnd - laterEnd)}</strong>.
            </>
          )}
        </p>
      </div>

      <div className="mt-4 space-y-1">
        {s.params.map((p) => (
          <SimSlider key={p.id} param={p} value={values[p.id]} onChange={(v) => set(p.id, v)} />
        ))}
      </div>

      <GhostButton onClick={roll} className="mt-2 w-full">
        <Dices className="size-4" aria-hidden /> Roll a wobbly future
      </GhostButton>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Things to discover">
        {s.quests.map((q) => {
          const done = found.includes(q.id);
          return (
            <span
              key={q.id}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
                done ? "animate-bubble bg-(--accent) text-(--accent-ink)" : "border border-dashed border-white/40 opacity-80",
              )}
            >
              {done && <Check className="size-3.5" strokeWidth={3} aria-hidden />} {q.label}
            </span>
          );
        })}
      </div>
      {toast && (
        <p key={toast} className="animate-sheet mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-snug font-medium text-[#0B2B22]">
          {toast}
        </p>
      )}

      <button
        type="button"
        aria-expanded={showAssumptions}
        onClick={() => setShowAssumptions((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-semibold opacity-70 hover:opacity-100"
      >
        <Info className="size-3.5" aria-hidden /> What this model assumes
        <ChevronDown className={cx("size-3.5 transition", showAssumptions && "rotate-180")} aria-hidden />
      </button>
      {showAssumptions && (
        <ul className="animate-rise mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed opacity-75">
          {sim.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      <PlayButton className="mt-5 w-full" pulse={found.length >= 2} onClick={() => onDone(found.length)}>
        {found.length === 0 ? "Skip to the insight" : "So what's going on?"} <ArrowRight className="size-4" aria-hidden />
      </PlayButton>
    </div>
  );
}

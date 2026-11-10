"use client";

import { PenLine, Send, Sparkles, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DialogueEnding, DialogueOption, DialogueScenario, Mood } from "@/experiences";
import { requestAIStatus, requestDialogue } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cx } from "../ui";
import { Face } from "./Face";
import { InsightReveal } from "./InsightReveal";
import { Confetti, GhostButton, PlayButton, PlayShell } from "./PlayShell";

interface Bubble {
  who: "them" | "you";
  text: string;
  ai?: boolean;
}

/** Everything needed to rewind to the moment before a choice. */
interface Snapshot {
  nodeId: string;
  bubbles: Bubble[];
  mood: Mood;
  meter: number;
  moves: string[];
}

type Phase = "intro" | "typing" | "choosing" | "ended" | "insight";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveEnding(scenario: DialogueScenario, meter: number): DialogueEnding {
  return (
    [...scenario.endings]
      .filter((e) => e.min !== undefined)
      .sort((a, b) => (b.min ?? 0) - (a.min ?? 0))
      .find((e) => meter >= (e.min ?? 0)) ?? scenario.endings[scenario.endings.length - 1]
  );
}

/**
 * Branching dialogue engine. The graph, meter effects and endings always come
 * from authored scenario data; when AI is configured it only voices the
 * character's reaction (and maps free-typed replies onto an authored option).
 */
export function DialoguePlayer({ scenario }: { scenario: DialogueScenario }) {
  const { progress, recordPlay } = useApp();
  const [phase, setPhase] = useState<Phase>("intro");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mood, setMood] = useState<Mood>(scenario.opening.mood);
  const [meter, setMeter] = useState(scenario.meter.start);
  const [nodeId, setNodeId] = useState(scenario.startNode);
  const [moves, setMoves] = useState<string[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [delta, setDelta] = useState<{ value: number; key: number } | null>(null);
  const [ending, setEnding] = useState<DialogueEnding | null>(null);
  const [ai, setAi] = useState(false);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const run = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

  const node = scenario.nodes[nodeId];
  const found = progress.plays[scenario.id]?.outcomes ?? [];

  useEffect(() => {
    requestAIStatus().then((s) => setAi(s.enabled));
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, phase]);

  const say = useCallback(async (token: number, lines: string[], aiVoiced = false) => {
    for (const text of lines) {
      setPhase("typing");
      await wait(500 + Math.min(text.length * 18, 700));
      if (run.current !== token) return false;
      setBubbles((b) => [...b, { who: "them", text, ai: aiVoiced }]);
    }
    return true;
  }, []);

  const start = useCallback(async () => {
    const token = ++run.current;
    setBubbles([]);
    setMood(scenario.opening.mood);
    setMeter(scenario.meter.start);
    setNodeId(scenario.startNode);
    setMoves([]);
    setHistory([]);
    setEnding(null);
    setDelta(null);
    setWriting(false);
    if (await say(token, scenario.opening.lines)) setPhase("choosing");
  }, [say, scenario]);

  async function choose(option: DialogueOption, typed?: string, aiReply?: string) {
    const token = ++run.current;
    setWriting(false);
    setDraft("");
    setNotice("");
    setHistory((h) => [...h, { nodeId, bubbles, mood, meter, moves }]);
    const mine: Bubble = { who: "you", text: typed ?? option.text };
    setBubbles((b) => [...b, mine]);
    setPhase("typing");

    // Ask the AI to voice the reaction while the "typing" beat plays.
    let reply = aiReply;
    if (ai && !reply) {
      const [result] = await Promise.all([
        requestDialogue({
          scenarioId: scenario.id,
          nodeId,
          choiceId: option.id,
          history: [...bubbles, mine].map(({ who, text }) => ({ who, text })),
        }),
        wait(600),
      ]);
      if (result.source === "ai" && result.reply) reply = result.reply;
    } else {
      await wait(700);
    }
    if (run.current !== token) return;

    const nextMeter = Math.max(0, Math.min(scenario.meter.max, meter + option.delta));
    setMood(option.reaction.mood);
    setMeter(nextMeter);
    setMoves((m) => [...m, option.move]);
    setDelta({ value: option.delta, key: Date.now() });
    setBubbles((b) => [...b, { who: "them", text: reply ?? option.reaction.text, ai: Boolean(reply) }]);

    const finish = async (end: DialogueEnding) => {
      await wait(900);
      if (run.current !== token) return;
      setMood(end.mood);
      if (!(await say(token, [end.line]))) return;
      setEnding(end);
      setPhase("ended");
      recordPlay(scenario.id, end.id);
    };

    if (option.next === "resolve") return finish(resolveEnding(scenario, nextMeter));
    if (typeof option.next === "object") {
      const end = scenario.endings.find((e) => e.id === (option.next as { ending: string }).ending);
      return finish(end ?? resolveEnding(scenario, nextMeter));
    }
    const next = scenario.nodes[option.next];
    setNodeId(next.id);
    await wait(500);
    if (next.say && !(await say(token, [next.say]))) return;
    if (run.current === token) setPhase("choosing");
  }

  async function sendOwnWords() {
    const text = draft.trim();
    if (text.length < 2) return;
    setNotice("");
    setPhase("typing");
    const result = await requestDialogue({
      scenarioId: scenario.id,
      nodeId,
      freeText: text,
      history: bubbles.map(({ who, text: t }) => ({ who, text: t })),
    });
    const option = node.options.find((o) => o.id === result.choiceId);
    if (result.source !== "ai" || !option) {
      setPhase("choosing");
      setNotice("Couldn't read that one. Pick a reply below.");
      setWriting(false);
      return;
    }
    choose(option, text, result.reply);
  }

  function rewind() {
    const last = history[history.length - 1];
    if (!last) return;
    run.current++;
    setHistory((h) => h.slice(0, -1));
    setBubbles(last.bubbles);
    setMood(last.mood);
    setMeter(last.meter);
    setMoves(last.moves);
    setNodeId(last.nodeId);
    setEnding(null);
    setDelta(null);
    setPhase("choosing");
  }

  /* ---------- Intro ---------- */
  if (phase === "intro") {
    return (
      <PlayShell theme={scenario.theme} title={scenario.title}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Face mood="hurt" size={190} className="animate-float" />
          <p className="mt-6 max-w-xs text-xl leading-snug font-semibold text-balance">{scenario.setup}</p>
          <PlayButton pulse className="mt-8 px-10 text-lg" onClick={start}>
            Open the chat
          </PlayButton>
          <p className="mt-4 text-xs opacity-60">
            {found.length}/{scenario.endings.length} endings found
          </p>
        </div>
      </PlayShell>
    );
  }

  /* ---------- Insight ---------- */
  if (phase === "insight" && ending) {
    return (
      <PlayShell theme={scenario.theme} title={scenario.title}>
        <InsightReveal experience={scenario} replayLabel="Try another path" onReplay={start}>
          <MovesRecap scenario={scenario} moves={moves} found={found.length} />
        </InsightReveal>
      </PlayShell>
    );
  }

  /* ---------- Chat ---------- */
  const pct = (meter / scenario.meter.max) * 100;
  return (
    <PlayShell theme={scenario.theme} title={scenario.title} fixed>
      <div className="relative flex items-center gap-4 py-2">
        <div key={mood} className={cx("relative shrink-0", mood === "angry" || mood === "cold" ? "animate-shake" : "animate-wiggle")}>
          <Face mood={mood} size={104} />
          {delta && delta.value !== 0 && (
            <span
              key={delta.key}
              className={cx(
                "animate-drift absolute -top-1 right-0 rounded-full px-2 py-0.5 text-sm font-black",
                delta.value > 0 ? "bg-emerald-300 text-emerald-950" : "bg-rose-300 text-rose-950",
              )}
            >
              {delta.value > 0 ? `+${delta.value}` : delta.value}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{scenario.character.name}</p>
          <p className="text-xs opacity-70" aria-live="polite">
            {phase === "typing" ? "typing…" : `feeling ${mood}`}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-3 flex-1 overflow-hidden rounded-full bg-white/15"
              role="meter"
              aria-label={scenario.meter.label}
              aria-valuemin={0}
              aria-valuemax={scenario.meter.max}
              aria-valuenow={meter}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: pct >= 70 ? "#6EE7B7" : pct >= 40 ? "#FCD34D" : "#FDA4AF",
                }}
              />
            </div>
            <span className="text-[11px] font-semibold opacity-70">{scenario.meter.label}</span>
          </div>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar mt-2 flex min-h-40 flex-1 basis-0 flex-col gap-2 overflow-y-auto py-2">
        <div className="mt-auto" />
        {bubbles.map((bubble, i) => (
          <div
            key={i}
            className={cx(
              "animate-bubble max-w-[82%] rounded-3xl px-4 py-2.5 text-[16px] leading-snug",
              bubble.who === "them"
                ? "origin-bottom-left self-start rounded-bl-md bg-white text-[#2A1638]"
                : "origin-bottom-right self-end rounded-br-md bg-(--accent) font-medium text-(--accent-ink)",
            )}
          >
            {bubble.text}
            {bubble.ai && (
              <span className="mt-1 flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase opacity-50">
                <Sparkles className="size-3" aria-hidden /> AI-voiced
              </span>
            )}
          </div>
        ))}
        {phase === "typing" && (
          <div className="dot-typing animate-bubble self-start rounded-3xl rounded-bl-md bg-white px-4 py-3 text-[#2A1638]">
            <span /> <span /> <span />
          </div>
        )}
      </div>

      <div className="relative pt-2">
        {phase === "choosing" && (
          <div className="space-y-2">
            {notice && <p className="text-center text-xs opacity-80">{notice}</p>}
            {writing ? (
              <form
                className="animate-sheet flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendOwnWords();
                }}
              >
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={160}
                  rows={2}
                  placeholder={`Say it to ${scenario.character.name} your way…`}
                  className="flex-1 resize-none rounded-2xl bg-white px-4 py-3 text-[16px] text-[#2A1638] placeholder:text-black/40 focus:outline-none"
                />
                <PlayButton type="submit" aria-label="Send" className="px-4" disabled={draft.trim().length < 2}>
                  <Send className="size-5" />
                </PlayButton>
              </form>
            ) : (
              node.options.map((option, i) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => choose(option)}
                  className="animate-sheet block w-full rounded-2xl border-2 border-white/20 bg-(--panel) px-4 py-3 text-left text-[15px] leading-snug font-medium transition hover:border-(--accent) hover:bg-white/15 active:scale-[0.98]"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {option.text}
                </button>
              ))
            )}
            <div className="flex items-center justify-between pt-1">
              {history.length > 0 ? (
                <button type="button" onClick={rewind} className="inline-flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100">
                  <Undo2 className="size-3.5" aria-hidden /> Take that back
                </button>
              ) : (
                <span />
              )}
              {ai && (
                <button
                  type="button"
                  onClick={() => setWriting((w) => !w)}
                  className="inline-flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100"
                >
                  <PenLine className="size-3.5" aria-hidden /> {writing ? "Show replies" : "Write your own"}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "ended" && ending && (
          <div className="animate-sheet relative rounded-3xl bg-(--panel) p-5 text-center">
            {ending.tone === "great" && <Confetti />}
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">Ending</p>
            <p className="font-display mt-1 text-3xl font-semibold">{ending.title}</p>
            <div className="mt-4 flex gap-3">
              <GhostButton onClick={rewind} className="flex-1">
                <Undo2 className="size-4" aria-hidden /> Rewind
              </GhostButton>
              <PlayButton pulse className="flex-[1.5]" onClick={() => setPhase("insight")}>
                What happened?
              </PlayButton>
            </div>
          </div>
        )}
      </div>
    </PlayShell>
  );
}

/** Debrief of the moves a player made, colour-coded by their effect. */
export function MovesRecap({ scenario, moves, found }: { scenario: DialogueScenario; moves: string[]; found: number }) {
  return (
    <div className="rounded-3xl bg-(--panel) p-4">
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase opacity-60">Your moves</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {moves.map((move, i) => {
          const info = scenario.moves[move];
          return (
            <span
              key={i}
              className={cx(
                "animate-bubble rounded-full px-3 py-1.5 text-[13px] font-bold",
                info.effect === "opens" && "bg-emerald-300 text-emerald-950",
                info.effect === "closes" && "bg-rose-300 text-rose-950",
                info.effect === "mixed" && "bg-amber-200 text-amber-950",
              )}
              style={{ animationDelay: `${i * 140}ms` }}
            >
              {info.effect === "opens" ? "↑" : info.effect === "closes" ? "↓" : "→"} {info.label}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs opacity-60">
        Green opened {scenario.character.name} up. Red closed her off. {found}/{scenario.endings.length} endings found.
      </p>
    </div>
  );
}

export { resolveEnding };

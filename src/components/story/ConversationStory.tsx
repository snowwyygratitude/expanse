"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DialogueEnding, DialogueScenario, Mood } from "@/experiences";
import { requestAIStatus, requestDialogue } from "@/lib/api";
import { useApp } from "@/lib/store";
import { MovesRecap, resolveEnding } from "../play/DialoguePlayer";
import { Face } from "../play/Face";
import { InsightReveal } from "../play/InsightReveal";
import { Confetti } from "../play/PlayShell";
import { cx } from "../ui";
import { ReplyDeck } from "./gestures";
import { Caption, readTime, StoryStage, useSpeak } from "./StoryStage";

type Beat =
  | { kind: "line"; who: "narrator" | "them" | "you"; text: string; mood?: Mood; delta?: number; ai?: boolean; wait?: boolean }
  | { kind: "choose"; nodeId: string }
  | { kind: "ending"; ending: DialogueEnding }
  | { kind: "insight" };

interface Snapshot {
  nodeId: string;
  mood: Mood;
  meter: number;
  moves: string[];
}

const SEGMENTS = 5;

/**
 * The Conversation Game as a story: the same authored dialogue graph as the
 * tap version, played as auto-advancing scenes. Replies are chosen by
 * swiping through a deck and flicking one up to send.
 */
export function ConversationStory({ scenario }: { scenario: DialogueScenario }) {
  const { progress, recordPlay } = useApp();
  const [beat, setBeat] = useState<Beat | null>(null);
  const [count, setCount] = useState(0);
  const [mood, setMood] = useState<Mood>(scenario.opening.mood);
  const [meter, setMeter] = useState(scenario.meter.start);
  const [moves, setMoves] = useState<string[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [delta, setDelta] = useState<{ value: number; key: number } | null>(null);
  const [ai, setAi] = useState(false);
  const queue = useRef<Beat[]>([]);
  const found = progress.plays[scenario.id]?.outcomes ?? [];

  useEffect(() => {
    requestAIStatus().then((s) => setAi(s.enabled));
  }, []);

  const advance = useCallback(() => {
    const next = queue.current.shift();
    if (!next) return;
    if (next.kind === "line") {
      if (next.mood) setMood(next.mood);
      if (next.delta !== undefined) {
        const change = next.delta;
        setMeter((m) => Math.max(0, Math.min(scenario.meter.max, m + change)));
        if (change !== 0) setDelta({ value: change, key: Date.now() });
      }
    }
    if (next.kind === "ending") {
      setMood(next.ending.mood);
      recordPlay(scenario.id, next.ending.id);
    }
    setBeat(next);
    setCount((c) => c + 1);
  }, [recordPlay, scenario]);

  const start = useCallback(() => {
    setMood(scenario.opening.mood);
    setMeter(scenario.meter.start);
    setMoves([]);
    setHistory([]);
    setDelta(null);
    queue.current = [
      { kind: "line", who: "narrator", text: scenario.setup },
      ...scenario.opening.lines.map((text): Beat => ({ kind: "line", who: "them", text })),
      { kind: "choose", nodeId: scenario.startNode },
    ];
    advance();
  }, [advance, scenario]);

  useEffect(() => {
    start();
  }, [start]);

  async function send(nodeId: string, optionId: string) {
    const option = scenario.nodes[nodeId].options.find((o) => o.id === optionId);
    if (!option) return;
    setHistory((h) => [...h, { nodeId, mood, meter, moves }]);
    setMoves((m) => [...m, option.move]);

    let reply = option.reaction.text;
    let voiced = false;
    if (ai) {
      // Hold on the player's line while the AI words the reaction.
      setBeat({ kind: "line", who: "you", text: option.text, wait: true });
      setCount((c) => c + 1);
      const result = await requestDialogue({
        scenarioId: scenario.id,
        nodeId,
        choiceId: option.id,
        history: [{ who: "you", text: option.text }],
      });
      if (result.source === "ai" && result.reply) {
        reply = result.reply;
        voiced = true;
      }
      queue.current = [];
    } else {
      queue.current = [{ kind: "line", who: "you", text: option.text }];
    }

    queue.current.push({
      kind: "line",
      who: "them",
      text: reply,
      mood: option.reaction.mood,
      delta: option.delta,
      ai: voiced,
    });

    const nextMeter = Math.max(0, Math.min(scenario.meter.max, meter + option.delta));
    const end = (ending: DialogueEnding) =>
      queue.current.push(
        { kind: "line", who: "them", text: ending.line, mood: ending.mood },
        { kind: "ending", ending },
        { kind: "insight" },
      );

    if (option.next === "resolve") end(resolveEnding(scenario, nextMeter));
    else if (typeof option.next === "object") {
      const target = option.next.ending;
      end(scenario.endings.find((e) => e.id === target) ?? resolveEnding(scenario, nextMeter));
    } else {
      const next = scenario.nodes[option.next];
      if (next.say) queue.current.push({ kind: "line", who: "them", text: next.say });
      queue.current.push({ kind: "choose", nodeId: next.id });
    }
    advance();
  }

  function rewind() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setMood(last.mood);
    setMeter(last.meter);
    setMoves(last.moves);
    setDelta(null);
    queue.current = [{ kind: "choose", nodeId: last.nodeId }];
    advance();
  }

  if (!beat) return null;

  const duration =
    beat.kind === "line" ? (beat.wait ? null : readTime(beat.text)) : beat.kind === "ending" ? 3200 : null;
  const segment = beat.kind === "insight" || beat.kind === "ending" ? SEGMENTS - 1 : Math.min(moves.length, SEGMENTS - 2);
  const pct = (meter / scenario.meter.max) * 100;

  return (
    <StoryStage
      theme={scenario.theme}
      title={scenario.title}
      segments={SEGMENTS}
      segment={segment}
      beatKey={count}
      duration={duration}
      onBeatEnd={advance}
    >
      {beat.kind === "insight" ? (
        <div className="flex-1 overflow-y-auto px-4 pb-6" onPointerDown={(e) => e.stopPropagation()}>
          <InsightReveal experience={scenario} replayLabel="Watch another path" onReplay={start}>
            <MovesRecap scenario={scenario} moves={moves} found={found.length} />
          </InsightReveal>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center px-5 pt-2">
            <div key={mood} className={cx("relative", mood === "angry" || mood === "cold" ? "animate-shake" : "animate-wiggle")}>
              <Face mood={mood} size={beat.kind === "choose" ? 150 : 210} className="transition-all duration-500" />
              {delta && delta.value !== 0 && (
                <span
                  key={delta.key}
                  className={cx(
                    "animate-drift absolute top-2 right-0 rounded-full px-3 py-1 text-lg font-black",
                    delta.value > 0 ? "bg-emerald-300 text-emerald-950" : "bg-rose-300 text-rose-950",
                  )}
                >
                  {delta.value > 0 ? `+${delta.value}` : delta.value}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-bold">
              {scenario.character.name} <span className="font-medium opacity-60">· {mood}</span>
            </p>
            <div className="mt-1.5 h-2.5 w-40 overflow-hidden rounded-full bg-white/15" role="meter" aria-label={scenario.meter.label} aria-valuemin={0} aria-valuemax={scenario.meter.max} aria-valuenow={meter}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(pct, 4)}%`, background: pct >= 70 ? "#6EE7B7" : pct >= 40 ? "#FCD34D" : "#FDA4AF" }}
              />
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col justify-center px-5 pb-5">
            {beat.kind === "line" && <Line key={count} beat={beat} name={scenario.character.name} />}

            {beat.kind === "choose" && (
              <div key={count} className="animate-sheet mt-auto">
                <ReplyDeck
                  options={scenario.nodes[beat.nodeId].options.map((o) => ({ id: o.id, content: o.text }))}
                  onSend={(id) => send(beat.nodeId, id)}
                  onRewind={history.length ? rewind : undefined}
                />
              </div>
            )}

            {beat.kind === "ending" && (
              <div key={count} className="relative text-center">
                {beat.ending.tone === "great" && <Confetti />}
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">Ending</p>
                <Caption text={beat.ending.title} className="mt-1 text-5xl" />
                <p className="mt-3 text-xs opacity-60">
                  {found.length}/{scenario.endings.length} endings found
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </StoryStage>
  );
}

function Line({ beat, name }: { beat: Extract<Beat, { kind: "line" }>; name: string }) {
  const speak = useSpeak();
  useEffect(() => {
    if (beat.who !== "you") speak(beat.text);
  }, [beat, speak]);

  if (beat.who === "narrator") {
    return <Caption text={beat.text} className="text-center text-[1.9rem]" />;
  }
  const mine = beat.who === "you";
  return (
    <div className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
      <span className="mb-1 px-2 text-[11px] font-bold tracking-wide uppercase opacity-60">{mine ? "You" : name}</span>
      <div
        className={cx(
          "animate-bubble max-w-[92%] rounded-[1.75rem] px-5 py-4 shadow-2xl",
          mine ? "origin-bottom-right rounded-br-md bg-(--accent) text-(--accent-ink)" : "origin-bottom-left rounded-bl-md bg-white text-[#2A1638]",
        )}
      >
        <Caption text={beat.text} className="text-[1.65rem]" delay={150} />
        {beat.ai && (
          <span className="mt-1 flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase opacity-50">
            <Sparkles className="size-3" aria-hidden /> AI-voiced
          </span>
        )}
        {beat.wait && (
          <span className="dot-typing mt-2 block opacity-60">
            <span /> <span /> <span />
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { Check, ChevronDown, Eye, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { requestFeedback } from "@/lib/api";
import { useApp } from "@/lib/store";
import type {
  ChoiceOption,
  ContentSource,
  Exercise,
  Lesson,
  PerspectivesExercise,
  PracticeExercise,
  ReflectionExercise,
  SelectionExercise,
  SimulatorExercise,
} from "@/lib/types";
import { Button, cx, SourceTag } from "../ui";

export const EXERCISE_LABEL: Record<Exercise["type"], string> = {
  scenario: "Scenario",
  "thought-experiment": "Thought experiment",
  perspectives: "Perspective-taking",
  reflection: "Reflection",
  practice: "Practice",
  selection: "Reflection",
  simulator: "Try it yourself",
};

interface Props {
  lesson: Lesson;
  /** Called once the learner has meaningfully engaged with the exercise. */
  onEngaged: () => void;
}

export function ExerciseView({ lesson, onEngaged }: Props) {
  const ex = lesson.exercise;
  switch (ex.type) {
    case "scenario":
    case "thought-experiment":
      return (
        <div>
          <Setup text={ex.setup} quote={ex.quote} />
          <Choices lesson={lesson} question={ex.question} options={ex.options} closing={ex.closing} onEngaged={onEngaged} />
        </div>
      );
    case "perspectives":
      return <Perspectives lesson={lesson} ex={ex} onEngaged={onEngaged} />;
    case "reflection":
      return <Reflection lesson={lesson} ex={ex} onEngaged={onEngaged} />;
    case "practice":
      return <Practice lesson={lesson} ex={ex} onEngaged={onEngaged} />;
    case "selection":
      return <Selection lesson={lesson} ex={ex} onEngaged={onEngaged} />;
    case "simulator":
      return <Compounding ex={ex} lesson={lesson} onEngaged={onEngaged} />;
  }
}

/* ---------- Shared pieces ---------- */

function Setup({ text, quote }: { text: string; quote?: string }) {
  return (
    <>
      <p className="text-[17px] leading-relaxed">{text}</p>
      {quote && (
        <blockquote className="mt-4 rounded-3xl rounded-tl-md bg-(--t-soft) px-5 py-4 text-[17px] leading-relaxed font-medium">
          “{quote}”
        </blockquote>
      )}
    </>
  );
}

function Choices({
  lesson,
  question,
  options,
  closing,
  onEngaged,
}: Props & { question: string; options: ChoiceOption[]; closing: string }) {
  const { recordInteraction } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  function choose(option: ChoiceOption) {
    setActive(option.id);
    if (!seen.includes(option.id)) setSeen((s) => [...s, option.id]);
    if (seen.length === 0) {
      recordInteraction({ lessonId: lesson.id, exerciseType: lesson.exercise.type, choiceId: option.id });
      onEngaged();
    }
  }

  return (
    <div className="mt-6">
      <h3 className="font-display text-2xl leading-snug font-semibold">{question}</h3>
      <div className="mt-4 space-y-3">
        {options.map((option, index) => {
          const isActive = active === option.id;
          const wasSeen = seen.includes(option.id);
          return (
            <div
              key={option.id}
              className={cx(
                "overflow-hidden rounded-3xl border-2 transition",
                isActive ? "border-(--t) bg-card shadow-sm" : "border-transparent bg-card ring-1 ring-line",
              )}
            >
              <button
                type="button"
                aria-expanded={isActive}
                onClick={() => choose(option)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <span
                  className={cx(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition",
                    isActive ? "bg-(--t) text-white" : wasSeen ? "bg-(--t-soft) text-(--t)" : "bg-sand text-ink-soft",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-[16px] leading-relaxed">{option.text}</span>
              </button>
              {isActive && (
                <div className="animate-rise border-t border-line bg-(--t-soft)/50 px-4 py-4">
                  <p className="text-[15px] leading-relaxed">{option.feedback}</p>
                  <p className="mt-2 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
                    Curated feedback, written by our editors
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {seen.length > 0 && (
        <div className="animate-rise mt-5">
          {seen.length < options.length && (
            <p className="text-sm text-ink-soft">
              Curious about the others? Tap any option to see how it might land. Nothing is scored.
            </p>
          )}
          <p className="mt-3 rounded-2xl bg-sand px-4 py-3 text-[15px] leading-relaxed">{closing}</p>
        </div>
      )}
    </div>
  );
}

function Perspectives({ lesson, ex, onEngaged }: Props & { ex: PerspectivesExercise }) {
  const [open, setOpen] = useState<string[]>([]);
  const allSeen = open.length === ex.viewpoints.length;
  return (
    <div>
      <p className="text-[17px] leading-relaxed">{ex.setup}</p>
      <div className="mt-5 space-y-3">
        {ex.viewpoints.map((view) => {
          const isOpen = open.includes(view.id);
          return (
            <button
              key={view.id}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((o) => (o.includes(view.id) ? o : [...o, view.id]))}
              className={cx(
                "block w-full rounded-3xl p-4 text-left transition",
                isOpen ? "bg-(--t-soft)" : "bg-card ring-1 ring-line hover:ring-(--t)",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-(--t)">{view.who}</span>
                {!isOpen && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
                    <Eye className="size-3.5" aria-hidden /> Tap to see
                  </span>
                )}
              </span>
              {isOpen && (
                <span className="animate-rise mt-2 block text-[16px] leading-relaxed">{view.thought}</span>
              )}
            </button>
          );
        })}
      </div>
      {allSeen ? (
        <div className="animate-rise">
          <Choices lesson={lesson} question={ex.question} options={ex.options} closing={ex.closing} onEngaged={onEngaged} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          {open.length} of {ex.viewpoints.length} viewpoints opened
        </p>
      )}
    </div>
  );
}

/** Feedback card for free-text exercises: AI when configured, pre-written otherwise. */
function Response({ source, text }: { source: ContentSource; text: string }) {
  return (
    <div className="animate-rise mt-5 rounded-3xl bg-card p-5 ring-1 ring-line">
      <SourceTag source={source} />
      <p className="mt-3 text-[16px] leading-relaxed whitespace-pre-line">{text}</p>
      {source === "demo" && (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          This reflection was written in advance, so it doesn't respond to your exact words. With an
          AI key configured, you'd get a personal response here.
        </p>
      )}
    </div>
  );
}

function useFeedback(lesson: Lesson, onEngaged: () => void) {
  const { recordInteraction } = useApp();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ source: ContentSource; text: string } | null>(null);

  async function submit(payload: { text?: string; selections?: string[] }) {
    setLoading(true);
    recordInteraction({ lessonId: lesson.id, exerciseType: lesson.exercise.type, ...payload });
    const result = await requestFeedback({ lessonId: lesson.id, ...payload });
    setResponse({ source: result.source, text: result.feedback });
    setLoading(false);
    onEngaged();
  }
  return { loading, response, submit, clear: () => setResponse(null) };
}

const TEXTAREA =
  "w-full resize-none rounded-2xl border border-line bg-card p-4 text-[16px] leading-relaxed placeholder:text-ink-faint focus:border-(--t) focus:outline-none";

function SubmitButton({ loading, disabled, onClick, label }: { loading: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <Button variant="topic" className="mt-3 w-full" disabled={disabled || loading} onClick={onClick}>
      <Sparkles className={cx("size-4", loading && "animate-pulse")} aria-hidden />
      {loading ? "Thinking…" : label}
    </Button>
  );
}

function Reflection({ lesson, ex, onEngaged }: Props & { ex: ReflectionExercise }) {
  const [text, setText] = useState("");
  const { loading, response, submit } = useFeedback(lesson, onEngaged);
  return (
    <div>
      <h3 className="font-display text-2xl leading-snug font-semibold">{ex.prompt}</h3>
      {ex.helper && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{ex.helper}</p>}
      {ex.starters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ex.starters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => setText((t) => (t.trim() ? t : `${starter.replace(/…$/, "")} `))}
              className="rounded-full bg-(--t-soft) px-3.5 py-1.5 text-sm font-medium text-(--t) transition hover:brightness-95"
            >
              {starter}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={1000}
        placeholder={ex.placeholder}
        className={cx(TEXTAREA, "mt-4")}
        aria-label="Your reflection"
      />
      <p className="mt-1 text-xs text-ink-faint">Only you see this. It stays on your device.</p>
      <SubmitButton
        loading={loading}
        disabled={text.trim().length < 3}
        onClick={() => submit({ text: text.trim() })}
        label={response ? "Reflect again" : "Reflect on this"}
      />
      {response && <Response source={response.source} text={response.text} />}
    </div>
  );
}

function Practice({ lesson, ex, onEngaged }: Props & { ex: PracticeExercise }) {
  const [text, setText] = useState("");
  const { loading, response, submit } = useFeedback(lesson, onEngaged);
  return (
    <div>
      <p className="text-[17px] leading-relaxed">{ex.situation}</p>
      {ex.original && (
        <div className="mt-4 rounded-3xl rounded-tl-md bg-sand px-5 py-4">
          <p className="text-[11px] font-semibold tracking-wide text-ink-soft uppercase">First draft</p>
          <p className="mt-1 text-[16px] leading-relaxed text-ink-soft">{ex.original}</p>
        </div>
      )}
      <h3 className="font-display mt-6 text-2xl leading-snug font-semibold">{ex.task}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {ex.tips.map((tip) => (
          <li key={tip} className="inline-flex items-center gap-1.5 rounded-full bg-(--t-soft) px-3 py-1.5 text-[13px] font-medium text-(--t)">
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {tip}
          </li>
        ))}
      </ul>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={1000}
        placeholder={ex.placeholder}
        className={cx(TEXTAREA, "mt-4")}
        aria-label="Your version"
      />
      <SubmitButton
        loading={loading}
        disabled={text.trim().length < 3}
        onClick={() => submit({ text: text.trim() })}
        label={response ? "Try another version" : "See how it lands"}
      />
      {response && (
        <>
          <Response source={response.source} text={response.text} />
          <div className="animate-rise mt-3 rounded-3xl bg-(--t-soft) p-5">
            <p className="text-[11px] font-semibold tracking-wide text-(--t) uppercase">
              One possible version, from our editors
            </p>
            <p className="mt-2 text-[16px] leading-relaxed">{ex.sample}</p>
            <p className="mt-2 text-xs text-ink-soft">There are many good ways to say this. Yours counts.</p>
          </div>
        </>
      )}
    </div>
  );
}

function Selection({ lesson, ex, onEngaged }: Props & { ex: SelectionExercise }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const { loading, response, submit } = useFeedback(lesson, onEngaged);
  const full = picked.length >= ex.pick;

  const toggle = (item: string) =>
    setPicked((p) => (p.includes(item) ? p.filter((i) => i !== item) : p.length < ex.pick ? [...p, item] : p));

  return (
    <div>
      <h3 className="font-display text-2xl leading-snug font-semibold">{ex.prompt}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {ex.items.map((item) => {
          const on = picked.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item)}
              className={cx(
                "rounded-full border-2 px-4 py-2 text-[15px] font-medium transition active:scale-95",
                on
                  ? "border-(--t) bg-(--t) text-white"
                  : full
                    ? "border-transparent bg-sand text-ink-faint"
                    : "border-transparent bg-card text-ink ring-1 ring-line hover:ring-(--t)",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {picked.length} of {ex.pick} chosen{full ? ". Tap one to swap it out." : ""}
      </p>

      {picked.length > 0 && (
        <div className="animate-rise mt-6">
          <p className="text-[17px] leading-relaxed font-medium">{ex.followUp}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={ex.placeholder}
            className={cx(TEXTAREA, "mt-3")}
            aria-label="Your thoughts"
          />
          <p className="mt-1 text-xs text-ink-faint">Optional. Only you see this.</p>
          <SubmitButton
            loading={loading}
            disabled={false}
            onClick={() => submit({ selections: picked, text: text.trim() || undefined })}
            label={response ? "Reflect again" : "Reflect on this"}
          />
        </div>
      )}
      {response && <Response source={response.source} text={response.text} />}
    </div>
  );
}

/* ---------- Compounding simulator ---------- */

const END_AGE = 65;
const MONTHLY = 200;
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function futureValue(years: number, ratePct: number) {
  const months = years * 12;
  const r = ratePct / 100 / 12;
  const total = r === 0 ? MONTHLY * months : MONTHLY * ((Math.pow(1 + r, months) - 1) / r);
  const contributed = MONTHLY * months;
  return { total, contributed, growth: total - contributed };
}

function Compounding({ ex, lesson, onEngaged }: Props & { ex: SimulatorExercise }) {
  const { recordInteraction } = useApp();
  const [startAge, setStartAge] = useState(25);
  const [delay, setDelay] = useState(10);
  const [rate, setRate] = useState(6);
  const [touched, setTouched] = useState(false);

  const touch = () => {
    if (touched) return;
    setTouched(true);
    recordInteraction({ lessonId: lesson.id, exerciseType: "simulator" });
    onEngaged();
  };

  const lateAge = Math.min(startAge + delay, END_AGE - 1);
  const early = useMemo(() => futureValue(END_AGE - startAge, rate), [startAge, rate]);
  const late = useMemo(() => futureValue(END_AGE - lateAge, rate), [lateAge, rate]);
  const max = early.total;

  const rows = [
    { label: `Starts at ${startAge}`, data: early },
    { label: `Starts at ${lateAge}`, data: late },
  ];

  return (
    <div>
      <p className="text-[17px] leading-relaxed">{ex.intro}</p>

      <div className="mt-5 rounded-3xl bg-card p-5 ring-1 ring-line">
        <div className="space-y-5">
          {rows.map(({ label, data }) => (
            <div key={label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{label}</span>
                <span className="font-display text-2xl font-semibold tabular-nums">{usd.format(data.total)}</span>
              </div>
              <div
                className="mt-2 flex h-7 overflow-hidden rounded-full bg-sand transition-all duration-300"
                style={{ width: `${Math.max((data.total / max) * 100, 6)}%` }}
              >
                <span
                  className="h-full bg-ink/70 transition-all duration-300"
                  style={{ width: `${(data.contributed / data.total) * 100}%` }}
                />
                <span className="h-full flex-1 bg-(--t)" />
              </div>
              <p className="mt-1.5 text-xs text-ink-soft tabular-nums">
                Put in {usd.format(data.contributed)} · growth {usd.format(data.growth)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ink/70" /> Money put in
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-(--t)" /> Growth on growth
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <Slider label="Early starter begins at age" value={startAge} display={`${startAge}`} min={20} max={45}
          onChange={(v) => { setStartAge(v); touch(); }} />
        <Slider label="Late starter waits" value={delay} display={`${delay} year${delay === 1 ? "" : "s"}`} min={1} max={20}
          onChange={(v) => { setDelay(v); touch(); }} />
        <Slider label="Yearly growth (illustrative)" value={rate} display={`${rate}%`} min={2} max={9}
          onChange={(v) => { setRate(v); touch(); }} />
      </div>

      <div className="mt-5 rounded-2xl bg-(--t-soft) px-4 py-3 text-[15px] leading-relaxed">
        Waiting {lateAge - startAge} years means putting in{" "}
        <strong>{usd.format(early.contributed - late.contributed)}</strong> less, and ending up with{" "}
        <strong>{usd.format(early.total - late.total)}</strong> less. The gap is mostly growth that never had time to happen.
      </div>
      {!touched && (
        <p className="mt-3 inline-flex items-center gap-1 text-sm text-ink-soft">
          <ChevronDown className="size-4 rotate-180" aria-hidden /> Move a slider to explore
        </p>
      )}
      <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{ex.closing}</p>
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold text-(--t) tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2"
      />
    </label>
  );
}

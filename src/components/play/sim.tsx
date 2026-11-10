"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SimParam } from "@/experiences";

/* ---------- Formatting ---------- */

const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const usd = (n: number) => usdFmt.format(Math.round(n));
export const usdShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 10_000 ? `$${Math.round(n / 1000)}k` : usd(n);

export function formatParam(format: SimParam["format"], value: number) {
  if (format === "usd") return usd(value);
  if (format === "percent") return `${value}%`;
  return value === 0 ? "No wait" : `${value} yr${value === 1 ? "" : "s"}`;
}

/* ---------- Animation ---------- */

/** Smoothly animates an array of numbers toward its latest target. */
export function useTweenedArray(target: number[], ms = 380): number[] {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const current = useRef(target);
  const key = target.join(",");

  useEffect(() => {
    from.current = current.current;
    const startAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - startAt) / ms, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = target.map((v, i) => {
        const a = from.current[i] ?? v;
        return a + (v - a) * eased;
      });
      current.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ms]);

  return value;
}

export function AnimatedNumber({ value, format = usd, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const [shown] = useTweenedArray([value], 450);
  return <span className={className}>{format(shown)}</span>;
}

/* ---------- Simulation controls ---------- */

export function SimSlider({
  param,
  value,
  onChange,
}: {
  param: SimParam;
  value: number;
  onChange: (value: number) => void;
}) {
  const fill = ((value - param.min) / (param.max - param.min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-sm font-semibold opacity-80">{param.label}</span>
        <span className="text-xl font-black text-(--accent) tabular-nums">{formatParam(param.format, value)}</span>
      </span>
      <input
        type="range"
        className="play-range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

/* ---------- Savings model ---------- */

/** Balance at each age from `fromAge` to `endAge`, saving monthly from `startAge`. */
export function savingsSeries(opts: {
  fromAge: number;
  endAge: number;
  startAge: number;
  monthly: number;
  /** Yearly growth in percent, or one rate per year for uneven paths. */
  rate: number | number[];
}): number[] {
  const out: number[] = [];
  let balance = 0;
  for (let age = opts.fromAge; age <= opts.endAge; age++) {
    out.push(balance);
    if (age >= opts.startAge && age < opts.endAge) {
      const yearly = Array.isArray(opts.rate) ? (opts.rate[age - opts.fromAge] ?? 0) : opts.rate;
      const r = yearly / 100 / 12;
      for (let m = 0; m < 12; m++) balance = Math.max(0, balance * (1 + r) + opts.monthly);
    }
  }
  return out;
}

/** Random yearly returns averaging `mean` percent (rough bell curve). */
export function wobblyRates(years: number, mean: number, spread = 14): number[] {
  return Array.from({ length: years }, () => {
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    return mean + noise * spread;
  });
}

/* ---------- Animated projection chart ---------- */

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
  fill?: boolean;
}

const W = 340;
const H = 190;
const PAD = { l: 6, r: 6, t: 14, b: 22 };

function Line({ series, max, n }: { series: ChartSeries; max: number; n: number }) {
  const values = useTweenedArray(series.values);
  const x = (i: number) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (Math.max(v, 0) / max) * (H - PAD.t - PAD.b);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1] ?? 0;
  return (
    <g>
      {series.fill && (
        <path d={`${d} L${x(n - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`} fill={series.color} opacity="0.16" />
      )}
      <path
        d={d}
        fill="none"
        stroke={series.color}
        strokeWidth={series.dashed ? 2.5 : 4}
        strokeDasharray={series.dashed ? "3 6" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x(n - 1)} cy={y(last)} r="6" fill={series.color} stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
    </g>
  );
}

export function ProjectionChart({
  series,
  fromAge,
  endAge,
  max,
  reveal = 1,
}: {
  series: ChartSeries[];
  fromAge: number;
  endAge: number;
  /** Fixed y-axis top; defaults to the tallest series. */
  max?: number;
  /** Draw only the first fraction (0..1) of the timeline, for animated playback. */
  reveal?: number;
}) {
  const n = endAge - fromAge + 1;
  const top = Math.max(max ?? 0, ...series.flatMap((s) => s.values), 1) * 1.08;
  const [tweenedTop] = useTweenedArray([top]);
  const ticks = [fromAge, Math.round((fromAge + endAge) / 2), endAge];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Projected savings by age">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b - f * (H - PAD.t - PAD.b)} y2={H - PAD.b - f * (H - PAD.t - PAD.b)}
          stroke="currentColor" opacity="0.1" strokeDasharray="2 5" />
      ))}
      <clipPath id="chart-reveal">
        <rect x="0" y="0" width={PAD.l + reveal * (W - PAD.l - PAD.r) + (reveal >= 1 ? 20 : 0)} height={H} />
      </clipPath>
      <g clipPath="url(#chart-reveal)">
        {series.map((s) => (
          <Line key={s.id} series={s} max={tweenedTop} n={n} />
        ))}
      </g>
      {ticks.map((age, i) => (
        <text key={age} x={i === 0 ? PAD.l : i === 1 ? W / 2 : W - PAD.r} y={H - 4}
          textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"} fontSize="11" fill="currentColor" opacity="0.6">
          age {age}
        </text>
      ))}
    </svg>
  );
}

"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cx } from "../ui";

/* ---------- Pointer drag ---------- */

interface DragState {
  dx: number;
  dy: number;
  active: boolean;
}

/** Tracks a pointer drag (touch or mouse) relative to where it started. */
export function useDrag(opts: {
  onMove?: (dx: number, dy: number, step: { ddx: number; ddy: number }) => void;
  onEnd?: (dx: number, dy: number) => void;
}) {
  const [drag, setDrag] = useState<DragState>({ dx: 0, dy: 0, active: false });
  const origin = useRef<{ x: number; y: number; lx: number; ly: number } | null>(null);

  const bind = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      origin.current = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY };
      setDrag({ dx: 0, dy: 0, active: true });
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const o = origin.current;
      if (!o) return;
      const dx = e.clientX - o.x;
      const dy = e.clientY - o.y;
      opts.onMove?.(dx, dy, { ddx: e.clientX - o.lx, ddy: e.clientY - o.ly });
      o.lx = e.clientX;
      o.ly = e.clientY;
      setDrag({ dx, dy, active: true });
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const o = origin.current;
      if (!o) return;
      origin.current = null;
      opts.onEnd?.(e.clientX - o.x, e.clientY - o.y);
      setDrag({ dx: 0, dy: 0, active: false });
    },
    onPointerCancel: () => {
      origin.current = null;
      setDrag({ dx: 0, dy: 0, active: false });
    },
  };
  return { drag, bind };
}

/* ---------- Reply deck: swipe to browse, flick up to send ---------- */

export function ReplyDeck({
  options,
  onSend,
  onRewind,
  sendLabel = "Flick up to send",
}: {
  options: { id: string; content: ReactNode }[];
  onSend: (id: string) => void;
  /** Pull down to undo the previous choice. */
  onRewind?: () => void;
  sendLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [sent, setSent] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const clamp = (i: number) => Math.max(0, Math.min(options.length - 1, i));

  const send = () => {
    if (sent) return;
    setSent(true);
    setTimeout(() => onSend(options[active].id), 260);
  };

  const { drag, bind } = useDrag({
    onEnd: (dx, dy) => {
      if (sent) return;
      if (dy < -60 && Math.abs(dy) > Math.abs(dx)) return send();
      if (dy > 80 && Math.abs(dy) > Math.abs(dx)) return onRewind?.();
      if (dx < -45) setActive((a) => clamp(a + 1));
      else if (dx > 45) setActive((a) => clamp(a - 1));
    },
  });

  useEffect(() => root.current?.focus(), []);

  const vertical = Math.abs(drag.dy) > Math.abs(drag.dx);
  return (
    <div
      ref={root}
      tabIndex={0}
      role="listbox"
      aria-label="Your reply. Left and right to browse, up to send."
      aria-activedescendant={`reply-${options[active].id}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setActive((a) => clamp(a + 1));
        else if (e.key === "ArrowLeft") setActive((a) => clamp(a - 1));
        else if (e.key === "ArrowUp" || e.key === "Enter") send();
        else if (e.key === "ArrowDown") onRewind?.();
      }}
      className="gesture-surface relative touch-none"
      {...bind}
    >
      <div className="mb-2 flex flex-col items-center gap-0.5 opacity-80">
        <ChevronUp className="nudge-y size-5" aria-hidden />
        <span className="text-[11px] font-bold tracking-wide uppercase">{sendLabel}</span>
      </div>
      <div className="relative h-36">
        {options.map((option, i) => {
          const offset = i - active;
          const isActive = offset === 0;
          const x = offset * 86 + (vertical ? 0 : (drag.dx / 3.6));
          const y = isActive && vertical ? Math.max(Math.min(drag.dy, 60), -140) : 0;
          return (
            <div
              key={option.id}
              id={`reply-${option.id}`}
              role="option"
              aria-selected={isActive}
              className={cx(
                "absolute inset-x-[7%] top-0 flex h-full cursor-grab items-center justify-center rounded-3xl border-2 px-4 py-3 text-center text-[16px] leading-snug font-semibold shadow-xl active:cursor-grabbing",
                isActive ? "z-10 border-(--accent) bg-(--accent) text-(--accent-ink)" : "border-white/20 bg-(--panel) opacity-60",
                isActive && sent && "fly-up",
              )}
              style={{
                transform: `translate(${x}%, ${y}px) scale(${isActive ? 1 : 0.9})`,
                transition: drag.active ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s",
              }}
            >
              {option.content}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <ChevronLeft className={cx("size-4", active === 0 ? "opacity-20" : "opacity-80")} aria-hidden />
        <div className="flex gap-1.5">
          {options.map((o, i) => (
            <span key={o.id} className={cx("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-(--accent)" : "w-1.5 bg-white/40")} />
          ))}
        </div>
        <ChevronRight className={cx("size-4", active === options.length - 1 ? "opacity-20" : "opacity-80")} aria-hidden />
      </div>
      <p className="mt-1 text-center text-[11px] font-semibold opacity-60">
        Swipe to browse{onRewind ? " · pull down to take it back" : ""}
      </p>
    </div>
  );
}

/* ---------- Two-way swipe ---------- */

export function SwipeChoice({
  axis,
  first,
  second,
  onChoose,
  children,
}: {
  axis: "x" | "y";
  /** Left (x) or up (y). */
  first: { id: string; label: string };
  /** Right (x) or down (y). */
  second: { id: string; label: string };
  onChoose: (id: string) => void;
  children?: ReactNode;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const THRESHOLD = 70;

  const choose = (id: string) => {
    if (chosen) return;
    setChosen(id);
    setTimeout(() => onChoose(id), 280);
  };

  const { drag, bind } = useDrag({
    onEnd: (dx, dy) => {
      const d = axis === "x" ? dx : dy;
      if (d <= -THRESHOLD) choose(first.id);
      else if (d >= THRESHOLD) choose(second.id);
    },
  });
  useEffect(() => root.current?.focus(), []);

  const d = axis === "x" ? drag.dx : drag.dy;
  const pull = Math.max(-1, Math.min(1, d / THRESHOLD));
  const lean = chosen ? (chosen === first.id ? -1 : 1) : pull;
  const Before = axis === "x" ? ChevronLeft : ChevronUp;
  const After = axis === "x" ? ChevronRight : ChevronDown;

  const label = (side: -1 | 1, option: { label: string }, Icon: typeof ChevronUp) => {
    const strength = Math.max(0, lean * side);
    return (
      <div
        className={cx(
          "flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-center text-[15px] leading-tight font-bold transition-colors",
          axis === "x" ? "flex-1" : "w-full",
          strength > 0.95 ? "border-(--accent) bg-(--accent) text-(--accent-ink)" : "border-white/25 bg-(--panel)",
        )}
        style={{ transform: `scale(${1 + strength * 0.08})`, opacity: lean * side < -0.2 ? 0.45 : 1 }}
      >
        {side === -1 && <Icon className={cx("size-4 shrink-0", axis === "x" ? "nudge-x" : "nudge-y")} aria-hidden />}
        {option.label}
        {side === 1 && <Icon className={cx("size-4 shrink-0", axis === "x" ? "nudge-x" : "nudge-y")} aria-hidden />}
      </div>
    );
  };

  return (
    <div
      ref={root}
      tabIndex={0}
      role="group"
      aria-label={`Swipe ${axis === "x" ? "left" : "up"} for ${first.label}, ${axis === "x" ? "right" : "down"} for ${second.label}`}
      onKeyDown={(e) => {
        if (e.key === (axis === "x" ? "ArrowLeft" : "ArrowUp")) choose(first.id);
        if (e.key === (axis === "x" ? "ArrowRight" : "ArrowDown")) choose(second.id);
      }}
      className={cx("gesture-surface mt-3 flex flex-1 touch-none flex-col", axis === "y" ? "gap-3" : "justify-end gap-3")}
      {...bind}
    >
      {axis === "y" && label(-1, first, Before)}
      <div
        className="flex flex-1 cursor-grab items-center justify-center active:cursor-grabbing"
        style={{
          transform: axis === "x" ? `translateX(${lean * 46}px) rotate(${lean * 5}deg)` : `translateY(${lean * 34}px)`,
          transition: drag.active ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>
      {axis === "y" ? (
        label(1, second, After)
      ) : (
        <div className="flex gap-3">
          {label(-1, first, Before)}
          {label(1, second, After)}
        </div>
      )}
      <p className="pointer-events-none text-center text-[11px] font-bold tracking-wide uppercase opacity-60">
        Swipe {axis === "x" ? "left or right" : "up or down"} to choose
      </p>
    </div>
  );
}

/* ---------- Drag to set a value, hold still to lock ---------- */

export function DragValue({
  axis,
  min,
  max,
  step,
  value,
  onChange,
  onLock,
  pixelsPerRange = 260,
  lockMs = 1600,
  lockLabel = "Hold still to lock in",
  hint,
  canLock = true,
  children,
}: {
  axis: "x" | "y";
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Fires once the value has been left alone for `lockMs`. Omit to never lock. */
  onLock?: () => void;
  pixelsPerRange?: number;
  lockMs?: number;
  lockLabel?: string;
  hint: string;
  canLock?: boolean;
  children: ReactNode;
}) {
  const [touched, setTouched] = useState(false);
  const raw = useRef(value);
  const root = useRef<HTMLDivElement>(null);
  const lock = useRef(onLock);
  lock.current = onLock;

  const set = (next: number) => {
    raw.current = Math.max(min, Math.min(max, next));
    const snapped = Math.round(raw.current / step) * step;
    setTouched(true);
    if (snapped !== value) onChange(snapped);
  };

  const { drag, bind } = useDrag({
    onMove: (_dx, _dy, { ddx, ddy }) => {
      const delta = axis === "x" ? ddx : -ddy;
      set(raw.current + (delta / pixelsPerRange) * (max - min));
    },
  });
  useEffect(() => root.current?.focus(), []);

  // Lock in once the value has rested (and the finger is still or lifted).
  const armed = touched && canLock && Boolean(onLock);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => lock.current?.(), lockMs);
    return () => clearTimeout(timer);
  }, [armed, value, lockMs]);

  const Icon = axis === "x" ? ChevronRight : ChevronUp;
  return (
    <div
      ref={root}
      tabIndex={0}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={hint}
      onKeyDown={(e) => {
        const up = e.key === "ArrowUp" || e.key === "ArrowRight";
        const down = e.key === "ArrowDown" || e.key === "ArrowLeft";
        if (up || down) {
          e.preventDefault();
          set(value + (up ? step : -step));
        }
        if (e.key === "Enter" && touched) lock.current?.();
      }}
      className={cx("gesture-surface relative flex flex-1 touch-none flex-col", drag.active ? "cursor-grabbing" : "cursor-grab")}
      {...bind}
    >
      {children}
      <div className="mt-auto flex h-12 items-center justify-center gap-2 pb-1">
        {armed ? (
          <span key={value} className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wide uppercase">
            <svg viewBox="0 0 36 36" className="lock-ring size-7 -rotate-90" style={{ "--lock-ms": `${lockMs}ms` } as CSSProperties}>
              <circle className="track" cx="18" cy="18" r="15.9" fill="none" strokeWidth="4" />
              <circle className="fill" cx="18" cy="18" r="15.9" fill="none" strokeWidth="4" pathLength="100" strokeLinecap="round" />
            </svg>
            {lockLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide uppercase opacity-80">
            <Icon className={cx("size-5", axis === "x" ? "nudge-x" : "nudge-y")} aria-hidden /> {hint}
          </span>
        )}
      </div>
    </div>
  );
}

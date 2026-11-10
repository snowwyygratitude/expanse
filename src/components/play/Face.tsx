"use client";

import type { Mood } from "@/experiences";

/** Per-mood geometry for the character's face. Transitions are animated in CSS. */
const MOODS: Record<
  Mood,
  { browL: number; browR: number; browY: number; eye: number; mouth: string; skin: string; halo: string; blush: number; tear?: boolean }
> = {
  hurt: { browL: -14, browR: 14, browY: 0, eye: 6.5, mouth: "M 78 132 Q 100 122 122 132", skin: "#F2B48C", halo: "#7B5CD6", blush: 0.15, tear: true },
  angry: { browL: 20, browR: -20, browY: 5, eye: 4.5, mouth: "M 80 134 Q 100 120 120 134", skin: "#F0A27E", halo: "#E0453A", blush: 0.5 },
  guarded: { browL: 6, browR: -2, browY: 2, eye: 5, mouth: "M 82 130 Q 100 129 118 131", skin: "#F2B48C", halo: "#8A7F9E", blush: 0.1 },
  soft: { browL: -6, browR: 6, browY: -1, eye: 7, mouth: "M 82 128 Q 100 136 118 128", skin: "#F4BA93", halo: "#F2A65A", blush: 0.3 },
  warm: { browL: -4, browR: 4, browY: -3, eye: 7.5, mouth: "M 76 124 Q 100 150 124 124", skin: "#F6C09A", halo: "#FF7A59", blush: 0.55 },
  cold: { browL: 2, browR: -2, browY: 4, eye: 3, mouth: "M 84 132 L 116 132", skin: "#E3B195", halo: "#56617A", blush: 0 },
};

const EASE = { transition: "all 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)" };

export function Face({ mood, size = 132, className }: { mood: Mood; size?: number; className?: string }) {
  const m = MOODS[mood];
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} role="img" aria-label={`Looks ${mood}`}>
      <circle cx="100" cy="100" r="96" fill={m.halo} opacity="0.35" style={EASE} />
      <circle cx="100" cy="100" r="80" fill={m.halo} opacity="0.45" style={EASE} />
      {/* hair back */}
      <path d="M 38 108 C 30 40 170 40 162 108 C 168 150 150 172 138 176 L 62 176 C 50 172 32 150 38 108 Z" fill="#2E1A26" />
      {/* face */}
      <ellipse cx="100" cy="108" rx="48" ry="54" fill={m.skin} style={EASE} />
      {/* fringe */}
      <path d="M 50 96 C 52 54 148 54 150 96 C 132 70 108 66 96 80 C 84 66 62 74 50 96 Z" fill="#2E1A26" />
      {/* blush */}
      <ellipse cx="70" cy="122" rx="11" ry="7" fill="#FF6B6B" opacity={m.blush} style={EASE} />
      <ellipse cx="130" cy="122" rx="11" ry="7" fill="#FF6B6B" opacity={m.blush} style={EASE} />
      {/* brows */}
      <g style={{ ...EASE, transform: `translateY(${m.browY}px)` }}>
        <rect x="66" y="88" width="24" height="5" rx="2.5" fill="#2E1A26"
          style={{ ...EASE, transformBox: "fill-box", transformOrigin: "center", transform: `rotate(${m.browL}deg)` }} />
        <rect x="110" y="88" width="24" height="5" rx="2.5" fill="#2E1A26"
          style={{ ...EASE, transformBox: "fill-box", transformOrigin: "center", transform: `rotate(${m.browR}deg)` }} />
      </g>
      {/* eyes */}
      <ellipse cx="78" cy="106" rx="6.5" ry={m.eye} fill="#2E1A26" style={EASE} />
      <ellipse cx="122" cy="106" rx="6.5" ry={m.eye} fill="#2E1A26" style={EASE} />
      <circle cx="80" cy="104" r="1.8" fill="#fff" opacity={m.eye > 4 ? 0.9 : 0} />
      <circle cx="124" cy="104" r="1.8" fill="#fff" opacity={m.eye > 4 ? 0.9 : 0} />
      {m.tear && <path d="M 128 116 q 4 8 0 11 q -4 -3 0 -11" fill="#9AD8FF" />}
      {/* mouth */}
      <path d={m.mouth} fill="none" stroke="#7A2E2E" strokeWidth="5" strokeLinecap="round" style={{ ...EASE, d: `path("${m.mouth}")` } as React.CSSProperties} />
    </svg>
  );
}

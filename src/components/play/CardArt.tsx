import type { Experience } from "@/experiences";
import { Face } from "./Face";

/** Bold illustration for each experience's home card. Pure SVG, lightly animated. */
export function CardArt({ art, className }: { art: Experience["art"]; className?: string }) {
  if (art === "conversation") {
    return (
      <div className={className} aria-hidden>
        <div className="relative h-full w-full">
          <div className="animate-float absolute top-[4%] right-[-6%] h-[92%] aspect-square">
            <Face mood="hurt" size={400} className="h-full w-full" />
          </div>
          <div className="animate-bubble absolute top-[12%] left-[6%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm font-bold text-[#2A1638] shadow-xl" style={{ animationDelay: "300ms" }}>
            So you're not coming.
          </div>
          <div className="animate-bubble absolute top-[36%] left-[6%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-sm font-bold text-[#2A1638] shadow-xl" style={{ animationDelay: "900ms" }}>
            Again.
          </div>
        </div>
      </div>
    );
  }

  if (art === "money") {
    return (
      <div className={className} aria-hidden>
        <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMaxYMax slice">
          <defs>
            <linearGradient id="art-money-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C8F560" stopOpacity="0.55" />
              <stop offset="1" stopColor="#C8F560" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[70, 130, 190, 250].map((y) => (
            <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#fff" opacity="0.07" strokeDasharray="3 7" />
          ))}
          <path d="M 0 280 C 120 276 220 250 290 170 S 370 60 400 20 L 400 300 L 0 300 Z" fill="url(#art-money-fill)" />
          <path d="M 0 280 C 120 276 220 250 290 170 S 370 60 400 20" fill="none" stroke="#C8F560" strokeWidth="7" strokeLinecap="round" />
          <path d="M 120 290 C 200 286 290 268 400 205" fill="none" stroke="#FF9F6B" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
          <g className="animate-float" style={{ transformOrigin: "290px 170px" }}>
            <circle cx="290" cy="170" r="26" fill="#FFD84D" stroke="#B8860B" strokeWidth="4" />
            <text x="290" y="180" textAnchor="middle" fontSize="28" fontWeight="900" fill="#6B4E00">$</text>
          </g>
          <circle cx="205" cy="246" r="15" fill="#FFD84D" stroke="#B8860B" strokeWidth="3" />
          <circle cx="110" cy="274" r="9" fill="#FFD84D" stroke="#B8860B" strokeWidth="2.5" />
          <circle cx="365" cy="62" r="38" fill="#FFD84D" stroke="#B8860B" strokeWidth="5" opacity="0.95" />
          <text x="365" y="77" textAnchor="middle" fontSize="42" fontWeight="900" fill="#6B4E00">$</text>
        </svg>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMaxYMid slice">
        {[150, 118, 86, 54].map((r, i) => (
          <circle key={r} cx="285" cy="150" r={r} fill="none" stroke="#FFD84D" strokeWidth="10" opacity={0.18 + i * 0.12} />
        ))}
        <g className="animate-float" style={{ transformOrigin: "285px 150px" }}>
          <path
            d="M 285 92 c -34 -22 -78 4 -70 42 c -22 14 -18 48 6 56 c 4 26 40 36 64 16 c 24 20 60 10 64 -16 c 24 -8 28 -42 6 -56 c 8 -38 -36 -64 -70 -42 Z"
            fill="#FF8FCB"
            stroke="#22135E"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M 285 96 v 108 M 250 130 q 18 8 14 30 M 322 128 q -20 10 -14 34 M 246 176 q 16 -10 28 4 M 326 178 q -14 -12 -28 2" fill="none" stroke="#22135E" strokeWidth="5" strokeLinecap="round" />
          <circle cx="262" cy="152" r="7" fill="#22135E" />
          <circle cx="308" cy="152" r="7" fill="#22135E" />
          <path d="M 270 176 q 15 12 30 0" fill="none" stroke="#22135E" strokeWidth="5" strokeLinecap="round" />
        </g>
        <path d="M 120 40 l -22 46 h 26 l -18 50 l 52 -66 h -28 l 20 -30 Z" fill="#FFD84D" stroke="#22135E" strokeWidth="5" strokeLinejoin="round" />
        <text x="62" y="236" fontSize="92" fontWeight="900" fill="#FFD84D" opacity="0.9" transform="rotate(-14 62 236)">?</text>
      </svg>
    </div>
  );
}

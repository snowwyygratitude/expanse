/** Everything the garden remembers lives in localStorage on this device. */
import type { Emotion, WishSpec } from './world/scene';
import type { WorrySpec } from './worry';

export interface Keepsake {
  id: string; kind: string; x: number; y: number;
  from: string;            // the world it was found in
  date: number;
  data?: any;              // worldDrop: { emotions, wish, name, sky }
}
export interface Memory { id: string; text: string; date: number; u: number; v: number; }
export interface Planted { emo: Emotion | 'wish' | 'worry'; x: number; y: number; }

export interface Save {
  v: 1;
  planted: Planted[];
  wish: WishSpec | null;
  /** the worry currently in the garden: held (a stone to carry), planted (being unknotted) or done */
  worry: (WorrySpec & { stage: 'held' | 'planted' | 'done'; opened: boolean[] }) | null;
  discovered: Record<string, number>;   // world key -> first seen
  treasures: Record<string, number>;    // keepsake kind -> first found
  keepsakes: Keepsake[];
  memories: Memory[];
  hopeUnlocked: boolean;
  everPlanted: boolean;
  /** where things stand after the person has rearranged the scenery */
  layout: { v?: number; tree: number[]; door: number[]; stone: number[]; wish: number[]; lake: number[]; flowers: number[][]; mushrooms: number[][] } | null;
  moveHint: boolean;
  worryUsed: boolean;        // once someone has set a worry down, the firefly stops pointing at the stone
  sound: boolean;
  soundOff: boolean;         // the person turned sound off; otherwise it starts on first touch
  lastVisit: string;
}

const KEY = 'expanse.garden.v1';
const fresh = (): Save => ({
  v: 1, planted: [], wish: null, worry: null, discovered: {}, treasures: {}, keepsakes: [], memories: [],
  hopeUnlocked: false, everPlanted: false, layout: null, moveHint: false, worryUsed: false, sound: false, soundOff: false, lastVisit: '',
});

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return { ...fresh(), ...s }; }
  } catch { /* storage unavailable: the garden still works, it just forgets */ }
  return fresh();
}

let timer = 0;
export function persist(s: Save) {
  clearTimeout(timer);
  timer = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }, 150);
}

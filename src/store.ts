/** Everything the garden remembers lives in localStorage on this device. */
import type { Emotion, WishSpec } from './world/scene';
import type { WorrySpec } from './worry';
import type { DesireSpec } from './desire';

export interface Keepsake {
  id: string; kind: string; x: number; y: number;
  from: string;            // the world it was found in
  date: number;
  data?: any;              // worldDrop: { emotions, wish, name, sky }
}
export interface Memory { id: string; text: string; date: number; u: number; v: number; }
export interface Planted { emo: Emotion | 'wish' | 'worry'; x: number; y: number; words?: string; ax?: number; ay?: number; }

/** a wish growing in the garden: a young tree, its three blossoms, and a leaf for every step taken toward it */
export type Desire = DesireSpec & { id: string; x: number; y: number; born: number; opened: boolean[]; steps: { text: string; date: number }[]; active: boolean };
export const MAX_WISHES = 1;
/** one visit day. Worries are kept as a few words only, never the whole text. */
export interface Day { feelings: string[]; /** every worry set down that day, each with the words chosen for it */ worries?: { id: string; words: string; kept?: string }[]; /** older saves kept one worry per day */ worry?: string; felt?: string; kept?: string; wish?: string; steps: string[]; }
/** a worry that was finished or let go, kept as a small stone: a few words and a date */
export interface CairnStone { id: string; words: string; day: string; kept?: string; }
export const fewWords = (t: string, n = 5) => { const w = t.trim().split(/\s+/); return w.length <= n ? w.join(' ') : w.slice(0, n).join(' ') + '…'; };

export interface Save {
  v: 1;
  planted: Planted[];
  wish: WishSpec | null;
  /** the worry currently in the garden: held (a stone to carry), planted (being unknotted) or done */
  worry: (WorrySpec & { stage: 'held' | 'planted' | 'done'; opened: boolean[]; explored?: boolean; part?: string; /** links it to its line in the journal */ jid?: string; /** what the person said about each bud */ felt?: ('helps' | 'not quite' | null)[]; /** every version of each bud they have been shown */ seen?: string[][] }) | null;
  /** one wish tree at a time (kept as a list so older saves carry over) */
  desires: Desire[];
  days: Record<string, Day>;            // YYYY-MM-DD -> what happened that day
  cairn: CairnStone[];
  lastDay: string;                      // the last day the garden was visited
  dayShift: number;                     // testing only: how many days ahead the garden pretends to be
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
  v: 1, planted: [], wish: null, worry: null, desires: [], days: {}, cairn: [], lastDay: '', dayShift: 0, discovered: {}, treasures: {}, keepsakes: [], memories: [],
  hopeUnlocked: false, everPlanted: false, layout: null, moveHint: false, worryUsed: false, sound: false, soundOff: false, lastVisit: '',
});

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) { if (s.desire && !s.desires) s.desires = [{ id: 'w' + Date.now().toString(36), ...s.desire }]; delete s.desire; if (Array.isArray(s.desires) && s.desires.length > 1) s.desires = [s.desires.find((d: any) => d.active) ?? s.desires[s.desires.length - 1]]; return { ...fresh(), ...s }; } }
  } catch { /* storage unavailable: the garden still works, it just forgets */ }
  return fresh();
}

let timer = 0, wiped = false;
/** forget the whole garden on this device; nothing is written again until the page reloads */
export function wipe() { wiped = true; clearTimeout(timer); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
export function persist(s: Save) {
  if (wiped) return;
  clearTimeout(timer);
  timer = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }, 150);
}

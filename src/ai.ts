/**
 * Wishes: turn a sentence into a scene.
 *
 * Three composers, tried in order. All of them return the same small JSON
 * WishSpec, and every result goes through validateSpec() before it can touch
 * the garden.
 *   1. /api/wish        - the optional Node server (server/server.mjs) calling Claude
 *   2. claude.use("sample") - available when the page is hosted as a Claude artifact
 *   3. composeLocally   - a keyword composer that runs entirely on this device
 */
import { EMOTIONS, FEATURES, Emotion, Feature, validateSpec, WishSpec, World } from './world/scene';
import { hashStr, rng } from './util';

export type Composer = 'server' | 'artifact' | 'local';
export interface WishMemory { discovered: string[]; treasures: string[]; }

let composer: Composer = 'local';
let sample: any = null;

let detecting: Promise<Composer> | null = null;
/**
 * Find out who can compose. Inside a Claude artifact the `claude` object can
 * appear a moment after the page starts, so keep looking for a while rather
 * than deciding "local" once at load and never asking again.
 */
export function detectComposer(): Promise<Composer> {
  if (detecting) return detecting;
  detecting = (async () => {
    try {
      const r = await fetch('/api/health', { signal: AbortSignal.timeout(2500) });
      if (r.ok && (await r.json()).ai) return (composer = 'server');
    } catch { /* no server: fine */ }
    for (let i = 0; i < 40 && !(window as any).claude?.use; i++) await new Promise(res => setTimeout(res, 250));
    try {
      const c = (window as any).claude;
      if (c?.use) { sample = await c.use('sample'); if (sample) return (composer = 'artifact'); }
    } catch { /* not an artifact */ }
    return (composer = 'local');
  })();
  return detecting;
}
/** wait briefly for detection to finish, so the note under the writing line tells the truth */
export async function readyComposer(maxMs = 2000): Promise<Composer> {
  await Promise.race([detectComposer(), new Promise(res => setTimeout(res, maxMs))]);
  return composer;
}
export const currentComposer = () => composer;

export const WISH_INSTRUCTIONS = `You compose scenes for a small magical garden out of a fixed component library. You never invent components.

Given a person's wish, answer with ONE JSON object and nothing else:
{
  "name": string,      // a 2-5 word poetic title for the scene, in title case
  "whisper": string,   // one gentle, concrete sentence (max 140 characters) describing what just appeared. No advice, no questions, no therapy language.
  "emotions": { ${EMOTIONS.map(e => `"${e}": number`).join(', ')} },  // 0..1, how much of each emotional material the scene is built from; usually two or three are non-zero
  "features": [ { "key": string, "amount": number } ],  // 3-9 entries that tune the scene, amount 0..1
  "sky": [string, string, string]   // sky gradient top, middle, horizon as #rrggbb
}

Allowed feature keys: ${FEATURES.join(', ')}.
What they are: sun/rays/moon/stars/aurora/clouds/rainbow are sky things; rain, storm (distant lightning), mist, petals (falling), fireflies, motes (floating light) are weather; mountains, lake, waterDoor (a glowing door under the lake), passage (a lit gate in the mountain) shape the land; blooms (bright flowers), blueBlooms (glowing blue flowers), warmBlooms (amber flowers), hopeSprouts (luminous seedlings), mushrooms (glowing) grow from the ground; door (a mysterious door), path (stepping stones), floaters (curious floating objects), garlands (string lights), lanterns (floating over the lake), memoryLantern are objects; puffs (small round creatures), butterflies, birds, koi are creatures; treeGlow, treeGold, gifts change the great tree.

Every emotion is beautiful here. Sadness is rain and blue light, never ruin. Compose something this person would find quietly wonderful.`;

const extractJson = (text: string) => {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
};

/** Ask whichever Claude is reachable for one JSON object. Null means: use the local composer. */
export async function askModel(path: string, body: unknown, prompt: string): Promise<any | null> {
  try {
    if (composer === 'server') {
      const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
      return r.ok ? await r.json() : null;
    }
    if (composer === 'artifact' && sample) { const out = await sample(prompt, { modelTier: 'default', cache: false }); return extractJson(out?.text ?? ''); }
  } catch { /* fall through */ }
  return null;
}

/** Compose a wish. Never throws: falls back to the local composer. */
export async function composeWish(wish: string, memory: WishMemory): Promise<{ spec: WishSpec; world: World; by: Composer }> {
  const text = wish.trim().slice(0, 280);
  try {
    if (composer === 'server') {
      const r = await fetch('/api/wish', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wish: text, memory }), signal: AbortSignal.timeout(45000),
      });
      if (r.ok) { const v = validateSpec(await r.json()); if (v) return { ...v, by: 'server' }; }
    } else if (composer === 'artifact' && sample) {
      const prompt = `${WISH_INSTRUCTIONS}\n\nThis garden has already seen: ${memory.discovered.join(', ') || 'nothing yet'}. Prefer something it has not seen.\n\nThe wish: "${text}"`;
      const out = await sample(prompt, { modelTier: 'quick' });
      const v = validateSpec(extractJson(out?.text ?? ''));
      if (v) return { ...v, by: 'artifact' };
    }
  } catch { /* fall through to the local composer */ }
  return { ...validateSpec(composeLocally(text))!, by: 'local' };
}

/* ---------- local composer: works with no network at all ---------- */
const EMO_WORDS: Record<Emotion, RegExp> = {
  joy: /happy|joy|sun|play|laugh|party|festival|bright|danc|summer|fun|birthday|giggl|warm day/,
  calm: /calm|peace|quiet|still|gentle|soft|rest|sleep|slow|breath|hush|serene|silence|safe/,
  sadness: /sad|rain|miss|lonely|blue|tear|cry|grief|lost|goodbye|ache|heavy|melanchol|homesick/,
  curiosity: /curious|myster|secret|wonder|strange|door|explor|magic|unknown|puzzle|hidden|dream|question|weird/,
  courage: /brave|courage|mountain|climb|storm|strong|bold|adventur|fierce|fearless|fight|stand|summit|dare/,
  gratitude: /grateful|thank|gift|memory|memories|childhood|grandm|grandp|home|family|friend|love|cozy|nostalg|remember|kitchen/,
  hope: /hope|dawn|new|begin|spring|tomorrow|grow|sprout|morning|someday|wish|start|light at/,
};
const FEATURE_WORDS: [RegExp, Feature, number][] = [
  [/lantern|candle/, 'lanterns', 1], [/rain|drizzle/, 'rain', 0.8], [/storm|thunder|lightning/, 'storm', 1],
  [/star|night|midnight/, 'stars', 1], [/moon/, 'moon', 1], [/mountain|peak|summit|cliff/, 'mountains', 1],
  [/lake|pond|water|sea|ocean|river/, 'lake', 1], [/butterfl/, 'butterflies', 1], [/firefl|glow/, 'fireflies', 1],
  [/aurora|northern light/, 'aurora', 1], [/rainbow/, 'rainbow', 1], [/mushroom|forest|woods/, 'mushrooms', 1],
  [/door|gate|portal/, 'door', 1], [/mist|fog|haze/, 'mist', 1], [/bird|wing|fly/, 'birds', 1],
  [/petal|blossom|cherry/, 'petals', 1], [/flower|garden|bloom|meadow/, 'blooms', 0.9], [/fish|koi/, 'koi', 1],
  [/festival|party|fair|carnival|lights/, 'garlands', 1], [/sun|golden|noon/, 'sun', 1], [/sunset|sunrise|dusk/, 'rays', 0.9],
  [/gift|present|tree/, 'treeGold', 0.9], [/path|road|journey|walk/, 'path', 1], [/cloud/, 'clouds', 0.8],
  [/creature|animal|bunny|pet|friend/, 'puffs', 1], [/float|dream|strange/, 'floaters', 0.8], [/sprout|seedling|grow/, 'hopeSprouts', 1],
];
const ADJ: Record<Emotion, string[]> = {
  joy: ['Sunlit', 'Laughing', 'Golden'], calm: ['Quiet', 'Still', 'Hushed'], sadness: ['Rain-soft', 'Blue', 'Tender'],
  curiosity: ['Secret', 'Wondering', 'Half-hidden'], courage: ['High', 'Unafraid', 'Bright-edged'],
  gratitude: ['Remembered', 'Warm', 'Well-loved'], hope: ['Dawning', 'New-green', 'Someday'],
};
const NOUN: Record<Emotion, string[]> = {
  joy: ['Meadow', 'Afternoon', 'Festival'], calm: ['Water', 'Evening', 'Shore'], sadness: ['Rain', 'Garden', 'Lake'],
  curiosity: ['Door', 'Path', 'Hollow'], courage: ['Ridge', 'Horizon', 'Summit'],
  gratitude: ['Orchard', 'Hearth', 'Keepsake'], hope: ['Morning', 'Seedbed', 'Clearing'],
};

export function composeLocally(wish: string): WishSpec {
  const w = wish.toLowerCase();
  const r = rng(hashStr(w) || 7);
  const emotions: Partial<Record<Emotion, number>> = {};
  for (const e of EMOTIONS) { const m = w.match(new RegExp(EMO_WORDS[e].source, 'g')); if (m) emotions[e] = Math.min(1, 0.6 + 0.2 * m.length); }
  if (!Object.keys(emotions).length) { // nothing recognised: let the words themselves pick, deterministically
    const a = EMOTIONS[Math.floor(r() * EMOTIONS.length)], b = EMOTIONS[Math.floor(r() * EMOTIONS.length)];
    emotions[a] = 1; if (b !== a) emotions[b] = 0.7;
  }
  const features = FEATURE_WORDS.filter(([re]) => re.test(w)).map(([, key, amount]) => ({ key, amount }));
  const ranked = (Object.entries(emotions) as [Emotion, number][]).sort((x, y) => y[1] - x[1]).map(([e]) => e);
  const a = ranked[0], b = ranked[1] ?? ranked[0];
  const name = `The ${ADJ[a][Math.floor(r() * 3)]} ${NOUN[b][Math.floor(r() * 3)]}`;
  const short = wish.length > 70 ? wish.slice(0, 67).trimEnd() + '…' : wish;
  return { name, whisper: `The garden listened: “${short}”`, emotions, features };
}

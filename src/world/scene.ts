/**
 * The world model.
 *
 * A Scene is nothing but numbers: eight palette colours and ~35 feature
 * amounts in the range 0..1 ("how much rain", "how tall are the mountains").
 * Every emotion contributes a partial scene; mixing two emotions blends their
 * contributions and then applies a hand-written "recipe" that adds the
 * surprising part. Because scenes are pure numbers the renderer can glide
 * between any two of them, and an AI can only ever *compose* the garden out of
 * the same vetted component library (see validateSpec).
 */
import { RGB, hex, mix, clamp } from '../util';

export const EMOTIONS = ['joy', 'calm', 'sadness', 'curiosity', 'courage', 'gratitude', 'hope'] as const;
export type Emotion = (typeof EMOTIONS)[number];
/** the six seeds everybody starts with; hope is found in the garden */
export const BASE_EMOTIONS: Emotion[] = ['joy', 'calm', 'sadness', 'curiosity', 'courage', 'gratitude'];

export const FEATURES = [
  'sun', 'rays', 'moon', 'stars', 'aurora', 'clouds', 'rainbow', 'rain', 'storm', 'mist', 'petals',
  'fireflies', 'motes', 'mountains', 'lake', 'waterDoor', 'blooms', 'blueBlooms', 'warmBlooms',
  'hopeSprouts', 'mushrooms', 'door', 'path', 'passage', 'floaters', 'garlands', 'lanterns',
  'memoryLantern', 'puffs', 'butterflies', 'birds', 'koi', 'treeGlow', 'treeGold', 'gifts',
] as const;
export type Feature = (typeof FEATURES)[number];
export const PAL_KEYS = ['skyTop', 'skyMid', 'skyLow', 'light', 'ground', 'groundFar', 'foliage', 'water'] as const;
export type PalKey = (typeof PAL_KEYS)[number];

export interface Scene { pal: Record<PalKey, RGB>; f: Record<Feature, number>; }
export interface World {
  key: string; name: string; whisper: string;
  emotions: Emotion[]; scene: Scene; custom?: boolean;
}

type Pal = Record<PalKey, RGB>;
const pal = (skyTop: string, skyMid: string, skyLow: string, light: string, ground: string, groundFar: string, foliage: string, water: string): Pal =>
  ({ skyTop: hex(skyTop), skyMid: hex(skyMid), skyLow: hex(skyLow), light: hex(light), ground: hex(ground), groundFar: hex(groundFar), foliage: hex(foliage), water: hex(water) });

export interface EmotionDef {
  name: string; color: RGB; deep: RGB; pal: Pal; f: Partial<Record<Feature, number>>;
  solo: string; soloWhisper: string; treasure: string; chord: number[];
}

export const EMO: Record<Emotion, EmotionDef> = {
  joy: {
    name: 'Joy', color: hex('#ffd35a'), deep: hex('#f08a1d'),
    pal: pal('#3f9fe8', '#96d4fb', '#ffe7a6', '#ffd76a', '#86d062', '#c6ea8c', '#55b765', '#7fd6f2'),
    f: { sun: 1, rays: 0.7, clouds: 0.35, blooms: 1, puffs: 1, butterflies: 0.5, petals: 0.5, motes: 0.5, lake: 0.3 },
    solo: 'The Sunlit Meadow', soloWhisper: 'Everything here is turning its face toward the light.',
    treasure: 'pinwheel', chord: [0, 4, 7, 11],
  },
  calm: {
    name: 'Calm', color: hex('#8fd8d2'), deep: hex('#4a8fb5'),
    pal: pal('#34447f', '#8a98d2', '#f1c6d6', '#ffe8c9', '#5aa394', '#8fc3bd', '#3c8a84', '#9cc7e8'),
    f: { moon: 0.7, stars: 0.35, lake: 1, lanterns: 1, mist: 0.5, koi: 0.8, fireflies: 0.3, clouds: 0.15, puffs: 0.3 },
    solo: 'The Still Water', soloWhisper: 'The lake is holding the whole sky and not spilling a drop.',
    treasure: 'chime', chord: [0, 7, 12, 16],
  },
  sadness: {
    name: 'Sadness', color: hex('#6fa8ff'), deep: hex('#3558b8'),
    pal: pal('#1b2550', '#3a4f82', '#7d95b8', '#a9c8ff', '#3b6676', '#577f92', '#2b5668', '#5d86b8'),
    f: { rain: 1, clouds: 0.9, lake: 0.7, blueBlooms: 1, mist: 0.6, moon: 0.2 },
    solo: 'The Rain Garden', soloWhisper: 'The rain is in no hurry. Touch where it falls.',
    treasure: 'mistbell', chord: [0, 3, 7, 10],
  },
  curiosity: {
    name: 'Curiosity', color: hex('#c08cff'), deep: hex('#6a3fd0'),
    pal: pal('#140f3a', '#45308a', '#d07cc2', '#9ff5e4', '#3b7478', '#5b6fa8', '#2c6a7a', '#4f7fd0'),
    f: { stars: 0.7, door: 1, path: 1, mushrooms: 1, floaters: 0.6, motes: 1, fireflies: 0.6, lake: 0.3 },
    solo: 'The Door in the Garden', soloWhisper: 'Something here was not here a moment ago.',
    treasure: 'crystal', chord: [0, 2, 7, 9],
  },
  courage: {
    name: 'Courage', color: hex('#ff7a5c'), deep: hex('#c0303f'),
    pal: pal('#2a1d5c', '#c04a6c', '#ffb35c', '#ffb25a', '#6c8c4c', '#b3925f', '#3d774d', '#d98c7a'),
    f: { mountains: 1, treeGlow: 1, rays: 1, sun: 0.7, birds: 1, clouds: 0.45, motes: 0.3, lake: 0.25 },
    solo: 'The High Country', soloWhisper: 'The mountains stood up when you arrived.',
    treasure: 'feather', chord: [0, 7, 12, 14],
  },
  gratitude: {
    name: 'Gratitude', color: hex('#ffab6b'), deep: hex('#d6557a'),
    pal: pal('#653a78', '#ee8a6c', '#ffd98a', '#ffc76a', '#9ab457', '#d9bf70', '#7c9c48', '#f0b08a'),
    f: { treeGold: 1, gifts: 1, warmBlooms: 1, butterflies: 1, fireflies: 0.7, sun: 0.4, motes: 0.6, lake: 0.3, puffs: 0.4 },
    solo: 'The Giving Tree', soloWhisper: 'The old tree has been saving something for you.',
    treasure: 'heartstone', chord: [0, 4, 9, 12],
  },
  hope: {
    name: 'Hope', color: hex('#b6f08a'), deep: hex('#3fae7a'),
    pal: pal('#6ab2d6', '#bde4d2', '#ffe1ec', '#fff0b8', '#8ad295', '#c9efc0', '#5fbc86', '#a8e6e0'),
    f: { rainbow: 0.8, hopeSprouts: 1, sun: 0.5, birds: 0.4, blooms: 0.35, motes: 0.5, lake: 0.35, clouds: 0.25 },
    solo: 'The First Green', soloWhisper: 'Small lights are pushing up through the soil.',
    treasure: 'dawnsprout', chord: [0, 4, 7, 14],
  },
};

const NEUTRAL_PAL = pal('#6f9fd8', '#b4d3ee', '#fbe3cc', '#fff1d0', '#78bd88', '#a8d7b2', '#4c9f78', '#8fd0e8');
const NEUTRAL_F: Partial<Record<Feature, number>> = { sun: 0.45, clouds: 0.3, lake: 0.3, blooms: 0.22, puffs: 0.35, motes: 0.3, butterflies: 0.2 };

export const pairKey = (a: Emotion, b: Emotion) => [a, b].sort((x, y) => EMOTIONS.indexOf(x) - EMOTIONS.indexOf(y)).join('+');

interface Recipe { name: string; whisper: string; f?: Partial<Record<Feature, number>>; pal?: Partial<Record<PalKey, string>>; }

/** Every pair has a hand-made result. The `f` overrides are the surprise. */
export const RECIPES: Record<string, Recipe> = {
  'joy+calm': { name: 'The Golden Afternoon', whisper: 'Petals drift across the water and nobody is counting them.', f: { petals: 1, koi: 1, lanterns: 0.4, sun: 0.8, moon: 0, stars: 0 } },
  'joy+sadness': { name: 'The Sunshower', whisper: 'It is raining and shining at once, and the sky has decided that is allowed.', f: { rain: 0.6, sun: 0.9, rainbow: 1, clouds: 0.5, rays: 0.6 }, pal: { skyTop: '#3d6cb4', skyMid: '#8fb4e0', skyLow: '#ffe2a8' } },
  'joy+curiosity': { name: 'The Festival of Wonders', whisper: 'Someone strung lights between the trees. The floating things came on their own.', f: { garlands: 1, floaters: 1, lanterns: 0.45, stars: 0.8, sun: 0, rays: 0 }, pal: { skyTop: '#1d1750', skyMid: '#6a3f9c', skyLow: '#ffb27a' } },
  'joy+courage': { name: 'The Summit Parade', whisper: 'Birds are racing the sunrise over the peaks.', f: { birds: 1, mountains: 1, rainbow: 0.4, petals: 0.7 } },
  'joy+gratitude': { name: 'The Lantern Tree', whisper: 'A golden tree, and around it every light you ever thanked.', f: { treeGold: 1, lanterns: 1, gifts: 1, garlands: 0.5 } },
  'joy+hope': { name: 'The Morning Chorus', whisper: 'Everything that can bloom has decided to do it today.', f: { blooms: 1, hopeSprouts: 1, rainbow: 1, birds: 0.8 } },
  'calm+sadness': { name: 'The Moonlit Rain', whisper: 'Soft rain on still water. The moon is keeping you company.', f: { moon: 1, rain: 0.55, lake: 1, lanterns: 0.4, clouds: 0.45, stars: 0.3 } },
  'calm+curiosity': { name: 'The Door Beneath Still Water', whisper: 'The lake is quiet. Something beneath it is glowing.', f: { waterDoor: 1, door: 0, path: 0.4, lake: 1, stars: 0.8, koi: 1 } },
  'calm+courage': { name: 'The Mirror Peaks', whisper: 'The mountains are looking at themselves in the lake. An aurora came to watch.', f: { aurora: 1, mountains: 1, lake: 1, stars: 0.9, sun: 0, rays: 0, moon: 0.5 }, pal: { skyTop: '#101a4a', skyMid: '#31508f', skyLow: '#e99aa8' } },
  'calm+gratitude': { name: 'The Memory Lantern', whisper: 'One lantern is waiting, in case there is something you would like to keep.', f: { memoryLantern: 1, lanterns: 0.7, treeGold: 0.7, stars: 0.5 } },
  'calm+hope': { name: 'The Quiet Dawn', whisper: 'First light on the water. Nothing is being asked of you.', f: { mist: 0.8, lake: 1, hopeSprouts: 1, rainbow: 0.3, lanterns: 0.3, moon: 0 } },
  'sadness+curiosity': { name: 'The Door by the Quiet Lake', whisper: 'Rain on the water, blue flowers opening, and a door that was not here before.', f: { door: 1, lake: 0.9, rain: 0.85, blueBlooms: 1, path: 0.8, mushrooms: 0.8, stars: 0.35 } },
  'sadness+courage': { name: 'The Stormlight', whisper: 'The storm is enormous and the tree is glowing right through it.', f: { storm: 1, rain: 0.9, treeGlow: 1, mountains: 1, clouds: 1, rays: 0.5, sun: 0.2 }, pal: { skyTop: '#151a40', skyMid: '#4b3d70', skyLow: '#e08a5c' } },
  'sadness+gratitude': { name: 'The Tender Rain', whisper: 'Warm flowers and blue flowers are growing in the same bed.', f: { rain: 0.6, treeGold: 0.7, warmBlooms: 1, blueBlooms: 1, gifts: 0.5, fireflies: 0.8 } },
  'sadness+hope': { name: 'First Light After Rain', whisper: 'It is still raining. Luminous things have started growing anyway.', f: { rain: 0.6, hopeSprouts: 1, rainbow: 0.7, blueBlooms: 0.8, sun: 0.4, rays: 0.6 } },
  'curiosity+courage': { name: 'The Passage of Lights', whisper: 'A way has opened in the mountain. Small lights are showing where to step.', f: { passage: 1, path: 1, mountains: 1, door: 0, stars: 0.8, fireflies: 0.9, sun: 0.15, rays: 0.3 } },
  'curiosity+gratitude': { name: 'The Cabinet of Small Wonders', whisper: 'The garden is showing you everything it has collected.', f: { floaters: 1, gifts: 1, door: 1, treeGold: 0.9, mushrooms: 1 } },
  'curiosity+hope': { name: 'The Seedling Stars', whisper: 'Some of the stars seem to be growing out of the ground.', f: { hopeSprouts: 1, stars: 1, door: 1, floaters: 0.8, aurora: 0.5 } },
  'courage+gratitude': { name: 'The Elder Tree', whisper: 'It grew this tall by being thankful for every storm.', f: { treeGlow: 1, treeGold: 1, mountains: 0.8, gifts: 0.8, birds: 0.7 } },
  'courage+hope': { name: 'The Far Horizon', whisper: 'Past the last mountain there is a colour you have not seen yet.', f: { rainbow: 1, mountains: 1, birds: 1, hopeSprouts: 0.9, aurora: 0.4 } },
  'gratitude+hope': { name: 'The Promise Garden', whisper: 'Every gift on the tree is a seed for something else.', f: { treeGold: 1, gifts: 1, hopeSprouts: 1, butterflies: 1, rainbow: 0.5 } },
};

export const emptyF = (): Record<Feature, number> => Object.fromEntries(FEATURES.map(k => [k, 0])) as Record<Feature, number>;

/** Blend weighted emotions into one scene. */
export function blend(weights: Partial<Record<Emotion, number>>): Scene {
  const entries = (Object.entries(weights) as [Emotion, number][]).filter(([, w]) => w > 0.01);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (!entries.length) return { pal: { ...NEUTRAL_PAL }, f: { ...emptyF(), ...NEUTRAL_F } };
  const p = {} as Pal;
  for (const k of PAL_KEYS) {
    let c: RGB = [0, 0, 0];
    for (const [e, w] of entries) { const q = EMO[e].pal[k]; c = [c[0] + q[0] * w / total, c[1] + q[1] * w / total, c[2] + q[2] * w / total]; }
    p[k] = c;
  }
  const f = emptyF();
  const maxW = Math.max(...entries.map(([, w]) => w));
  for (const [e, w] of entries) {
    const rel = w / maxW; // the strongest emotion shows fully, the others in proportion
    for (const [k, v] of Object.entries(EMO[e].f) as [Feature, number][]) f[k] = Math.max(f[k], v * rel * (entries.length > 1 ? 0.9 : 1));
  }
  return { pal: p, f };
}

export function composeWorld(emotions: Emotion[]): World {
  if (emotions.length === 0) {
    return { key: 'empty', name: '', whisper: '', emotions: [], scene: blend({}) };
  }
  if (emotions.length === 1) {
    const e = emotions[0];
    return { key: e, name: EMO[e].solo, whisper: EMO[e].soloWhisper, emotions: [e], scene: blend({ [e]: 1 }) };
  }
  const [a, b] = emotions;
  const key = pairKey(a, b);
  const r = RECIPES[key] ?? RECIPES[pairKey(b, a)];
  const scene = blend({ [a]: 1, [b]: 1 });
  if (r?.f) for (const [k, v] of Object.entries(r.f) as [Feature, number][]) scene.f[k] = v;
  if (r?.pal) for (const [k, v] of Object.entries(r.pal) as [PalKey, string][]) scene.pal[k] = hex(v);
  return { key, name: r?.name ?? `${EMO[a].name} & ${EMO[b].name}`, whisper: r?.whisper ?? '', emotions: [a, b], scene };
}

/* ---------- AI / wish scenes ---------- */

/** The only shape an AI (or the local composer) may hand to the garden. */
export interface WishSpec {
  name: string; whisper: string;
  emotions: Partial<Record<Emotion, number>>;
  features?: { key: string; amount: number }[];
  sky?: string[];
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const cleanText = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max) : '');

/**
 * Validate an untrusted scene spec and turn it into a World. Unknown keys are
 * dropped, numbers are clamped, colours must be #rrggbb. Returns null when
 * nothing usable is left, so callers can fall back to the local composer.
 */
export function validateSpec(raw: any): { spec: WishSpec; world: World } | null {
  if (!raw || typeof raw !== 'object') return null;
  const emotions: Partial<Record<Emotion, number>> = {};
  if (raw.emotions && typeof raw.emotions === 'object') {
    for (const e of EMOTIONS) {
      const v = Number(raw.emotions[e]);
      if (Number.isFinite(v) && v > 0.05) emotions[e] = clamp(v);
    }
  }
  if (!Object.keys(emotions).length) return null;
  const features: { key: Feature; amount: number }[] = [];
  if (Array.isArray(raw.features)) {
    for (const it of raw.features.slice(0, 24)) {
      const v = Number(it?.amount);
      if (it && (FEATURES as readonly string[]).includes(it.key) && Number.isFinite(v)) features.push({ key: it.key, amount: clamp(v) });
    }
  }
  const sky = Array.isArray(raw.sky) && raw.sky.length === 3 && raw.sky.every((c: unknown) => typeof c === 'string' && HEX.test(c)) ? (raw.sky as string[]) : undefined;
  const spec: WishSpec = {
    name: cleanText(raw.name, 48) || 'A Wished-for Garden',
    whisper: cleanText(raw.whisper, 180),
    emotions, features, sky,
  };
  const scene = blend(emotions);
  for (const { key, amount } of features) scene.f[key] = amount;
  // keep the scene physically sensible whatever was asked for
  if (scene.f.waterDoor > 0.3 || scene.f.koi > 0.3) scene.f.lake = Math.max(scene.f.lake, 0.8);
  if (scene.f.passage > 0.3) scene.f.mountains = Math.max(scene.f.mountains, 0.8);
  if (scene.f.gifts > 0.3) scene.f.treeGold = Math.max(scene.f.treeGold, 0.5);
  if (sky) { scene.pal.skyTop = hex(sky[0]); scene.pal.skyMid = hex(sky[1]); scene.pal.skyLow = hex(sky[2]); }
  const ranked = (Object.entries(emotions) as [Emotion, number][]).sort((a, b) => b[1] - a[1]).map(([e]) => e);
  return { spec, world: { key: 'wish', name: spec.name, whisper: spec.whisper, emotions: ranked.slice(0, 2), scene, custom: true } };
}

export const mixRGB = mix;

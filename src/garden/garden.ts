/**
 * The garden: one canvas, no panels.
 *
 * Layer A (emotional weather) is `cur`, a Scene that glides toward the scene of
 * the current World. Layer B (the personal garden) is everything in `save`:
 * keepsakes, released lanterns, world dewdrops. Seeds rest on a mossy ledge in
 * the foreground and are physically carried into the ground; the change
 * spreads outward from wherever the seed lands.
 */
import { RGB, TAU, WHITE, approach, clamp, css, hashStr, hex, lerp, mix, outBack, rng, smooth, uid } from '../util';
import { BASE_EMOTIONS, EMO, EMOTIONS, Emotion, FEATURES, Feature, PAL_KEYS, RECIPES, Scene, World, composeWorld, pairKey, validateSpec } from '../world/scene';
import { Keepsake, Save, persist } from '../store';
import { Sound } from '../audio';
import { composeWish, readyComposer } from '../ai';
import { KEEPSAKES, drawKeepsake, drawSeed, ell, glow, shine, star4 } from './art';
import { BeliefChoice, HiddenKind, HiddenWorld, OWN_WORDS, SERIF, SkyView, text } from './overlays';
import { CRISIS_LINE, CRISIS_TITLE, composeWorry, worryParts } from '../worry';
import { Gesture, SPECS } from './gesture';

type Ctx = CanvasRenderingContext2D;
type SeedKind = Emotion | 'wish' | 'worry';

export interface Hooks {
  caption(title: string, line?: string, opts?: { fresh?: boolean; hold?: number }): void;
  ask(o: { placeholder: string; note: string | Promise<string>; action: string; max: number; question?: string; chips?: string[] }): Promise<string | null>;
}

const WORLD_W = 1800, HORIZON = 560, CX = 900;
const TREE = { x: 700, y: 690 }, DOOR = { x: 900, y: 704 }, LAKE = { x: 1220, y: 735, rx: 255, ry: 62 };
const STONE = { x: 735, y: 764, rx: 60, ry: 17 } /* front-left, before the tree: the middle belongs to doors and paths */, BUDS = [[-38, -40], [0, -68], [38, -40]];
const WISH = { x: 1030, y: 790 }, WK = 1.45 /* the listening flower stands on the lake shore, drawn larger than life */, MEM = { x: 1130, y: 492 }, PASSAGE_X = 976; /* the mountain gate sits between the tree and the listening flower */
const GOLD: RGB = [245, 190, 80];
const DARK: RGB = [14, 18, 44];
const BLOOM_COLORS = ['#ff7aa2', '#ffb347', '#fff07a', '#ff8fd0', '#b98cff', '#ffffff', '#ff6f6f'].map(hex);
const WARM_COLORS = ['#ffb86b', '#ff8f7a', '#ffd08a', '#ff9fb0'].map(hex);
const BULBS = ['#ffd35a', '#ff8fa3', '#8fd8ff', '#c08cff', '#b6f08a'].map(hex);
const gy = (x: number) => HORIZON + 12 * Math.sin(x / 210) + 7 * Math.sin(x / 97 + 1);
const inLake = (x: number, y: number, pad = 0) => ((x - LAKE.x) / (LAKE.rx + pad)) ** 2 + ((y - LAKE.y) / (LAKE.ry + pad)) ** 2 < 1;
const tri = (x: number) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);

interface Flower { x: number; y: number; kind: 'joy' | 'blue' | 'warm' | 'hope'; c: RGB; th: number; ph: number; size: number; g: number; pop: number; open: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; c: RGB; r: number; grav: number; shape: 0 | 1 | 2; screen?: boolean; }
interface Ring { x: number; y: number; t0: number; dur: number; max: number; c: RGB; flat: number; }
interface Flight { kind: SeedKind; x0: number; y0: number; tx: number; ty: number; world: boolean; t: number; dur: number; arc: number; done: () => void; }
interface Sprout { kind: SeedKind; x: number; y: number; t0: number; words?: string; ax?: number; ay?: number; }

export class Garden {
  ctx: Ctx; W = 0; H = 0; dpr = 1; s = 1; vw = 0;
  t = 0; cam = { x: 600, vx: 0 };
  world: World; cur: Scene;
  rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private wave: { x: number; y: number; t0: number } | null = null;
  private flash = 0; private flashC: RGB = WHITE;
  private worldT0 = 0; private giftTaken = false; private rainCount = 0; private memReleased = false;
  private glimmer = { x: 0, y: 0, found: false }; private foundGlimmers = new Set<string>();
  private wishBusy = false; private stormFlash = 0; private nextStorm = 3;

  private flowers: Flower[] = []; private rainBlooms: Flower[] = [];
  private mushrooms: { x: number; y: number; c: RGB; g: number; pop: number; size: number }[] = [];
  private stonesA: { x: number; y: number; g: number }[] = []; private stonesB: { q: number; g: number }[] = [];
  private tufts: { x: number; y: number; h: number; ph: number }[] = [];
  private stars: number[][] = []; private clouds: { x: number; y: number; sc: number; spd: number; blobs: number[][] }[] = [];
  private treeline: { x: number; h: number; w: number; tone: number }[] = [];
  private canopy: { dx: number; dy: number; r: number; tone: number }[] = [];
  private gifts: { dx: number; len: number; g: number; taken: boolean; kind: number }[] = [];
  private fallen: { x: number; y: number; vy: number; ground: number; kind: number; t: number; first: boolean }[] = [];
  private puffs: { x: number; y: number; g: number; hop: number; fx: number; fy: number; tx: number; ty: number; gx: number; gy: number; wait: number; dir: number; c: RGB; jump: number }[] = [];
  private flies: { ax: number; ay: number; ph: number; fx: number; fy: number; c: RGB; x: number; y: number }[] = [];
  private fireflies: number[][] = []; private motes: number[][] = []; private petals: number[][] = []; private rain: number[][] = [];
  private lanterns: { x: number; y: number; th: number; g: number; boost: number; ph: number }[] = [];
  private floaters: { x: number; y: number; kind: number; ph: number; spin: number; g: number }[] = [];
  private mfar: number[] = []; private mnear: number[] = [];
  private particles: Particle[] = []; private rings: Ring[] = []; private flights: Flight[] = [];
  private risingMem: { x: number; y: number; t: number; tx: number; ty: number } | null = null;

  planted: Sprout[] = [];
  private drag: any = null; private pointerId = -1;
  private hits: { x: number; y: number; r: number; fn: () => void }[] = [];
  private slots: { kind: Emotion; x: number; y: number }[] = []; private seedR = 20; private ledgeTop = 0;
  private choice: BeliefChoice | null = null; private worryBusy = false; private budT = [-9, -9, -9];
  private hidden: HiddenWorld | null = null; private sky: SkyView | null = null;
  private auroraSprites: HTMLCanvasElement[] = [];
  private idle = 14; private guide = -1; /* firefly: -1 resting, else 0..1 along its flight */
  /** the garden's answer to what was planted, and the quiet around it */
  private gest: Gesture | null = null; private quietUntil = -9; private hush = 1; private camGoal: number | null = null; private exploreT = -9;
  private autoT = -9; private hintT = 4; private last = 0; private lean: { scene: Scene; k: number } | null = null;

  constructor(private canvas: HTMLCanvasElement, public save: Save, public sound: Sound, private hooks: Hooks) {
    this.ctx = canvas.getContext('2d')!;
    save.hopeUnlocked = true; // all eight seeds are on the ledge from the start
    this.build();
    this.applyLayout();
    // restore the world exactly as it was left
    this.planted = save.planted.filter(p => p.emo === 'wish' ? !!save.wish : p.emo === 'worry' ? !!save.worry && save.worry.stage !== 'held' : (EMOTIONS as readonly string[]).includes(p.emo)).slice(0, 2)
      .map(p => ({ kind: p.emo, x: p.x, y: p.y, t0: -10, words: (p as any).words, ax: (p as any).ax, ay: (p as any).ay }));
    this.world = this.compose();
    this.cur = JSON.parse(JSON.stringify(this.world.scene));
    this.resetWorldState();
    this.snapEntities();
    this.resize();
    this.startGesture(true);
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.move(e));
    canvas.addEventListener('pointerup', e => this.up(e));
    canvas.addEventListener('pointercancel', e => this.up(e, true));
    requestAnimationFrame(ts => this.frame(ts));
  }

  /* ---------------- world building: seeded so the garden is the same garden every visit ---------------- */
  private build() {
    const r = rng(20261110);
    const spot = (x0: number, x1: number, y0 = 612, y1 = 880): [number, number] => {
      for (let i = 0; i < 30; i++) {
        const x = lerp(x0, x1, r()), y = lerp(y0, y1, r() ** 0.8);
        if (!inLake(x, y, 26) && Math.hypot(x - DOOR.x, y - DOOR.y) > 45 && Math.hypot(x - TREE.x, y - TREE.y) > 40 && Math.hypot(x - WISH.x, y - WISH.y) > 64 && ((x - STONE.x) / 80) ** 2 + ((y - STONE.y) / 42) ** 2 > 1) return [x, y];
      }
      return [x0, y0];
    };
    const addFlowers = (n: number, kind: Flower['kind'], colors: RGB[]) => {
      for (let i = 0; i < n; i++) {
        const [x, y] = spot(60, 1740);
        this.flowers.push({ x, y, kind, c: colors[Math.floor(r() * colors.length)], th: i / n, ph: r() * TAU, size: 9 + r() * 6, g: 0, pop: 0, open: 0 });
      }
    };
    addFlowers(34, 'joy', BLOOM_COLORS); addFlowers(26, 'blue', [hex('#6fc2ff'), hex('#8fd8ff'), hex('#7f9dff')]);
    addFlowers(22, 'warm', WARM_COLORS); addFlowers(18, 'hope', [hex('#d8ff9a'), hex('#fff2a8')]);
    for (let i = 0; i < 10; i++) {
      const [x, y] = spot(860, 1000, 705, 790);
      this.mushrooms.push({ x, y, c: i % 2 ? hex('#ff7ad9') : hex('#6ff0e0'), g: 0, pop: 0, size: 7 + r() * 6 });
    }
    for (let i = 0; i < 9; i++) this.stonesA.push({ x: 0, y: 0, g: 0 });
    this.layStones();
    for (let i = 0; i < 12; i++) this.stonesB.push({ q: i / 11, g: 0 });
    for (let i = 0; i < 170; i++) { const [x, y] = spot(0, WORLD_W, 585, 990); this.tufts.push({ x, y, h: 5 + r() * 7, ph: r() * TAU }); }
    for (let i = 0; i < 150; i++) this.stars.push([r(), r() ** 1.4, 0.5 + r() * 1.3, r() * TAU]);
    for (let i = 0; i < 8; i++) this.clouds.push({ x: r() * 2400 - 300, y: 90 + r() * 240, sc: 0.8 + r() * 0.9, spd: 3 + r() * 5, blobs: Array.from({ length: 5 }, (_, j) => [(j - 2) * 46 + r() * 20, r() * 22 - 11, 60 + r() * 40]) });
    for (let i = 0; i < 20; i++) this.treeline.push({ x: i * 95 + r() * 60 - 20, h: 60 + r() * 60, w: 26 + r() * 20, tone: r() });
    for (let i = 0; i < 12; i++) this.canopy.push({ dx: (r() - 0.5) * 200, dy: (r() - 0.5) * 120, r: 46 + r() * 30, tone: r() });
    this.canopy.sort((a, b) => a.dy - b.dy);
    for (let i = 0; i < 6; i++) this.gifts.push({ dx: -95 + i * 38 + r() * 10, len: 22 + r() * 30, g: 0, taken: false, kind: i % 3 });
    const pc = ['#fff4dc', '#ffe3ee', '#e6f4ff', '#f1ffe3'].map(hex);
    for (let i = 0; i < 4; i++) { const [x, y] = spot(720, 1150, 660, 820); this.puffs.push({ x, y, g: 0, hop: 0, fx: x, fy: y, tx: x, ty: y, gx: NaN, gy: NaN, wait: 1 + r() * 3, dir: 1, c: pc[i], jump: 0 }); }
    for (let i = 0; i < 9; i++) this.flies.push({ ax: 420 + r() * 1000, ay: 500 + r() * 220, ph: r() * TAU, fx: 0, fy: 0, c: [hex('#ffd0e8'), hex('#fff0a8'), hex('#c8f0ff')][i % 3], x: 0, y: 0 });
    for (let i = 0; i < 34; i++) this.fireflies.push([r() * WORLD_W, 470 + r() * 360, r() * TAU, 0.5 + r()]);
    for (let i = 0; i < 40; i++) this.motes.push([r() * WORLD_W, 300 + r() * 600, r() * TAU, 0.4 + r()]);
    for (let i = 0; i < 28; i++) this.petals.push([r(), r(), r() * TAU, 0.6 + r() * 0.8]);
    for (let i = 0; i < 130; i++) this.rain.push([r(), r(), 0.7 + r() * 0.6]);
    for (let i = 0; i < 8; i++) this.lanterns.push({ x: 985 + i * 62 + r() * 30, y: 410 + r() * 150, th: i / 8, g: 0, boost: 0, ph: r() * TAU });
    for (let i = 0; i < 8; i++) this.floaters.push({ x: 480 + i * 125 + r() * 50, y: 330 + r() * 190, kind: i % 7, ph: r() * TAU, spin: 0, g: 0 });
    const o = [r() * 9, r() * 9, r() * 9, r() * 9, r() * 9, r() * 9];
    for (let x = 0; x <= WORLD_W; x += 20) {
      this.mfar.push(clamp(0.55 * tri(x / 330 + o[0]) + 0.3 * tri(x / 141 + o[1]) + 0.15 * tri(x / 57 + o[2])));
      this.mnear.push(clamp(0.5 * tri(x / 270 + o[3]) + 0.32 * tri(x / 113 + o[4]) + 0.18 * tri(x / 43 + o[5])));
    }
    for (const c of [[120, 255, 190], [90, 200, 255], [190, 130, 255]] as RGB[]) {
      const sp = document.createElement('canvas'); sp.width = 4; sp.height = 64;
      const g = sp.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, css(c, 0)); gr.addColorStop(0.35, css(c, 1)); gr.addColorStop(1, css(c, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 4, 64); this.auroraSprites.push(sp);
    }
  }

  /** ground that stays clear so the landmarks are never covered: the Resting Stone and its words, the listening flower, the door, the trunk */
  private blocked(x: number, y: number, pad = 0, door = true) {
    // the stone's zone reaches back behind it too, so nothing grows up out of its far edge
    if (((x - STONE.x) / (100 + pad)) ** 2 + ((y - STONE.y) / (62 + pad)) ** 2 < 1) return true;
    if (((x - WISH.x - 8) / (82 + pad)) ** 2 + ((y - WISH.y + 10) / (48 + pad)) ** 2 < 1) return true;
    // the door's spot is kept free even before it appears, or a seed could land where it is about to rise
    if (door && Math.abs(x - DOOR.x) < 62 + pad && y > DOOR.y - 24 && y < DOOR.y + 26 + pad) return true;
    return Math.abs(x - TREE.x) < 46 && Math.abs(y - TREE.y) < 24;
  }
  /** the nearest open ground to a point: seeds land here rather than on a landmark */
  private freeSpot(x: number, y: number): [number, number] {
    const [gx, gyv] = this.groundSpot(x, y);
    if (!this.blocked(gx, gyv)) return [gx, gyv];
    for (let r = 24; r < 480; r += 24) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU, [nx, ny] = this.groundSpot(gx + Math.cos(a) * r, gyv + Math.sin(a) * r * 0.45);
      if (!this.blocked(nx, ny) && !inLake(nx, ny, 14) && nx > this.cam.x + 30 && nx < this.cam.x + this.vw - 30) return [nx, ny];
    }
    return [gx, gyv];
  }
  /** the stepping stones always lead to wherever the door stands */
  private layStones() {
    this.stonesA.forEach((st, i) => {
      const q = i / 8, a = (1 - q) ** 2, b = 2 * q * (1 - q), c = q * q;
      st.x = a * (DOOR.x - 10) + b * (DOOR.x - 50) + c * (DOOR.x - 8); st.y = a * (DOOR.y + 176) + b * (DOOR.y + 86) + c * (DOOR.y + 20);
    });
  }

  /* ---------------- everything can be moved: press and hold a thing, then drag ---------------- */
  private grabs: { x: number; y: number; r: number; o: { x: number; y: number }; name: string }[] = [];
  private grab(o: { x: number; y: number }, wx: number, wy: number, r: number, name: string) { this.grabs.push({ x: this.sx(wx), y: this.sy(wy), r: Math.max(22, r * this.s), o, name }); }
  /** the thing whose middle is nearest the finger (relative to its size), so a flower behind a flower can still be taken */
  private grabAt(x: number, y: number) {
    let best: Garden['grabs'][number] | null = null, bd = 1;
    for (let i = this.grabs.length - 1; i >= 0; i--) { const g = this.grabs[i], d = Math.hypot(x - g.x, y - g.y) / g.r; if (d < bd - 0.05 || (d < 1 && !best)) { best = g; bd = d; } }
    return best;
  }
  private moveTo(o: { x: number; y: number }, name: string, wx: number, wy: number) {
    if (name === 'lake') {
      const nx = clamp(wx, 300, WORLD_W - 300), ny = clamp(wy, 690, Math.min(800, this.maxPlantY() - 36)), dx = nx - LAKE.x, dy = ny - LAKE.y;
      LAKE.x = nx; LAKE.y = ny; MEM.x += dx; MEM.y += dy; for (const l of this.lanterns) { l.x += dx; l.y += dy; } // its lanterns travel with it
      return;
    }
    if (name === 'answer' && this.gest) { this.shiftAnswer(...this.groundSpot(wx, wy)); return; }
    if (name === 'sprout' && this.gest) { // a seed takes its answer along
      const em = this.planted.filter(p => !this.custom(p.kind)), px = o.x, py = o.y;
      [o.x, o.y] = this.groundSpot(wx, wy);
      if (em[em.length - 1] === o) this.shiftAnswer(this.gest.x + o.x - px, this.gest.y + o.y - py);
      return;
    }
    [o.x, o.y] = this.groundSpot(wx, wy);
    if (name === 'door') this.layStones();
    if (name === 'puff') { const p = o as Garden['puffs'][number]; p.hop = 0; p.fx = p.tx = p.x; p.fy = p.ty = p.y; p.gx = NaN; p.wait = 1.5; }
  }
  /** move the garden's answer, and everything in it, to a new spot */
  private shiftAnswer(x: number, y: number) {
    const g = this.gest!, dx = x - g.x, dy = y - g.y;
    g.x += dx; g.y += dy; for (const q of g.places) { q.x += dx; q.y += dy; }
    const em = this.planted.filter(p => !this.custom(p.kind)), seed = em[em.length - 1];
    if (seed) { seed.ax = g.x; seed.ay = g.y; }
  }
  /** after a move: nothing is left standing in the water, and the arrangement is remembered */
  private settle() {
    const all: { x: number; y: number }[] = [TREE, DOOR, STONE, WISH, ...this.flowers, ...this.mushrooms, ...this.puffs, ...this.planted, ...this.save.keepsakes];
    for (const o of all) if (inLake(o.x, o.y, 14)) [o.x, o.y] = this.groundSpot(o.x, o.y);
    const em = this.planted.filter(p => !this.custom(p.kind)), newest = em[em.length - 1];
    for (const p of this.planted) if (this.blocked(p.x, p.y, -10)) {
      const px = p.x, py = p.y; [p.x, p.y] = this.freeSpot(p.x, p.y);
      if (p === newest && this.gest) this.shiftAnswer(this.gest.x + p.x - px, this.gest.y + p.y - py);
    }
    this.layStones();
    const xy = (o: { x: number; y: number }) => [Math.round(o.x), Math.round(o.y)];
    this.save.layout = { v: 3, tree: xy(TREE), door: xy(DOOR), stone: xy(STONE), wish: xy(WISH), lake: xy(LAKE), flowers: this.flowers.map(xy), mushrooms: this.mushrooms.map(xy) };
    this.save.planted = this.planted.map(p => ({ emo: p.kind, x: p.x, y: p.y, words: p.words, ax: p.ax, ay: p.ay }));
    persist(this.save);
  }
  private applyLayout() {
    const L = this.save.layout; if (!L || (L as any).v !== 3) return; // arrangements from before the landmarks found their places are let go
    const ok = (a: unknown): a is number[] => Array.isArray(a) && a.length === 2 && a.every(v => Number.isFinite(v));
    const put = (o: { x: number; y: number }, a: unknown) => { if (ok(a)) { o.x = clamp(a[0], 40, WORLD_W - 40); o.y = clamp(a[1], 600, 900); } };
    if (ok(L.lake)) { const dx = clamp(L.lake[0], 300, WORLD_W - 300) - LAKE.x, dy = clamp(L.lake[1], 690, 800) - LAKE.y; LAKE.x += dx; LAKE.y += dy; MEM.x += dx; MEM.y += dy; for (const l of this.lanterns) { l.x += dx; l.y += dy; } }
    put(TREE, L.tree); put(DOOR, L.door); put(STONE, L.stone); put(WISH, L.wish);
    if (Array.isArray(L.flowers) && L.flowers.length === this.flowers.length) this.flowers.forEach((f, i) => put(f, L.flowers[i]));
    if (Array.isArray(L.mushrooms) && L.mushrooms.length === this.mushrooms.length) this.mushrooms.forEach((m, i) => put(m, L.mushrooms[i]));
    this.layStones();
  }

  private resize() {
    this.W = window.innerWidth; this.H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    while (this.W * this.H * dpr * dpr > 3.4e6 && dpr > 1) dpr -= 0.25;
    this.dpr = dpr;
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
    const portrait = this.H > this.W;
    this.s = Math.max(this.W / WORLD_W, this.H / (portrait ? 1250 : 1000));
    this.vw = this.W / this.s;
    this.cam.x = clamp(868 - this.vw / 2, 0, Math.max(0, WORLD_W - this.vw));
    this.layoutLedge();
  }
  private seedKinds(): Emotion[] { return this.save.hopeUnlocked ? [...BASE_EMOTIONS, 'hope'] : BASE_EMOTIONS; }
  private layoutLedge() {
    const kinds = this.seedKinds(), ledgeH = clamp(this.H * 0.14, 96, 128);
    const span = Math.min(this.W - 12, 640), gap = span / kinds.length;
    this.seedR = clamp(gap * 0.3, 14, 23);
    this.ledgeTop = this.H - ledgeH;
    this.slots = kinds.map((kind, i) => ({ kind, x: this.W / 2 - span / 2 + gap * (i + 0.5), y: this.H - ledgeH * 0.56 + Math.sin(i * 1.9) * 3 }));
  }

  /* ---------------- coordinates ---------------- */
  /** parallax layers pivot around the world centre so far things stay in view */
  private pivot(p: number) { return CX + (this.cam.x + this.vw / 2 - CX) * p; }
  private sx(wx: number, p = 1) { return (wx - this.pivot(p)) * this.s + this.W / 2; }
  private sy(wy: number) { return this.H - (1000 - wy) * this.s; }
  private wx(sx: number) { return sx / this.s + this.cam.x; }
  private wy(sy: number) { return 1000 - (this.H - sy) / this.s; }
  private layer(p: number) { const k = this.dpr * this.s; this.ctx.setTransform(k, 0, 0, k, (this.W / 2 - this.pivot(p) * this.s) * this.dpr, (this.H - 1000 * this.s) * this.dpr); }
  private screen() { this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
  private maxPlantY() { return Math.min(900, this.wy(this.ledgeTop) - 16); }
  private groundSpot(x: number, y: number): [number, number] {
    x = clamp(x, 40, WORLD_W - 40); y = clamp(y, 612, this.maxPlantY());
    if (inLake(x, y, 14)) y = Math.min(this.maxPlantY(), LAKE.y + LAKE.ry + 22);
    if (inLake(x, y, 14)) y = LAKE.y - LAKE.ry - 20;
    return [x, y];
  }
  private hit(wx: number, wy: number, r: number, fn: () => void, p = 1) { this.hits.push({ x: this.sx(wx, p), y: this.sy(wy), r: Math.max(24, r * this.s), fn }); }
  /** hits that must win over anything wandering in front of them (a creature sitting on the worry stone) */
  private late: Garden['hits'] = [];
  private lateHit(wx: number, wy: number, r: number, fn: () => void) { this.late.push({ x: this.sx(wx), y: this.sy(wy), r: Math.max(24, r * this.s), fn }); }
  private passageGX() { return PASSAGE_X - CX * 0.5 + 0.5 * (this.cam.x + this.vw / 2); }

  /* ---------------- the world state machine ---------------- */
  private compose(): World {
    const c = this.planted.find(p => this.custom(p.kind));
    if (c) {
      const v = validateSpec(c.kind === 'wish' ? this.save.wish : this.save.worry?.scene);
      if (v) {
        const w = this.save.worry;
        if (c.kind === 'worry' && w) { v.world.key = 'worry'; v.world.whisper = w.stage === 'done' ? '' : w.acknowledge; }
        return v.world;
      }
    }
    return composeWorld(this.planted.filter(p => !this.custom(p.kind)).map(p => p.kind as Emotion));
  }
  private resetWorldState() {
    this.worldT0 = this.t; this.giftTaken = false; this.rainCount = 0; this.memReleased = false;
    this.gifts.forEach(g => (g.taken = false));
    const r = rng(hashStr(this.world.key + this.world.name) + 5);
    for (let i = 0; i < 20; i++) { const x = 560 + r() * 760, y = 640 + r() * 170; if (!inLake(x, y, 20)) { this.glimmer = { x, y, found: this.foundGlimmers.has(this.world.key) || !this.world.emotions.length }; break; } }
  }
  private snapEntities() {
    const f = this.world.scene.f;
    for (const fl of this.flowers) fl.g = this.flowerTarget(fl, f);
    for (const m of this.mushrooms) m.g = f.mushrooms > 0.3 ? 1 : 0;
    this.stonesA.forEach((s, i) => (s.g = f.path * (f.passage > 0.5 ? 0 : 1) > i / 9 ? 1 : 0));
    this.stonesB.forEach(s => (s.g = f.passage > s.q * 0.9 + 0.05 ? 1 : 0));
  }
  private flowerTarget(fl: Flower, f: Record<Feature, number>) {
    const amt = fl.kind === 'joy' ? f.blooms : fl.kind === 'blue' ? f.blueBlooms : fl.kind === 'warm' ? f.warmBlooms : f.hopeSprouts;
    return amt > fl.th * 0.92 + 0.04 ? 1 : 0;
  }
  private setWorld(origin: { x: number; y: number }, announce = true) {
    const prevKey = this.world.key;
    this.world = this.compose();
    this.wave = { x: origin.x, y: origin.y, t0: this.t };
    this.resetWorldState();
    this.rainBlooms.forEach(b => (b.th = 9)); // marked to fade
    this.save.planted = this.planted.map(p => ({ emo: p.kind, x: p.x, y: p.y, words: p.words, ax: p.ax, ay: p.ay }));
    const w = this.world;
    this.sound.setChord(w.emotions.length ? EMO[w.emotions[0]].chord : [0, 7, 12, 16]);
    if (w.emotions.length && announce) {
      if (!w.custom && !this.save.discovered[w.key]) this.save.discovered[w.key] = Date.now();
      if (w.custom) { this.hooks.caption(w.name, w.whisper, { hold: 12 }); if (prevKey !== w.key) this.sound.bloom(); }
      else this.hooks.caption('', ''); // nothing to read yet: first the garden answers, then it speaks
    } else if (!w.emotions.length) this.idleCaption();
    this.startGesture(!announce);
    persist(this.save);
  }
  /** one nearby thing responds to the feeling just planted (see gesture.ts) */
  private startGesture(steady: boolean) {
    const em = this.planted.filter(p => !this.custom(p.kind));
    if (this.world.custom || !em.length) { this.gest = null; return; }
    const key = em.length === 2 ? pairKey(em[0].kind as Emotion, em[1].kind as Emotion) : (em[0].kind as string);
    const spec = SPECS[key]; if (!spec) { this.gest = null; return; }
    const seed = em[em.length - 1], other = em.length === 2 ? em[0] : null;
    const door = this.world.scene.f.door > 0.3;
    const clear = (x: number, y: number) => !this.blocked(x, y, 6, door) && !inLake(x, y, 34) && x > this.cam.x + 50 && x < this.cam.x + this.vw - 50 && !(other && Math.abs(other.x - x) < 56 && Math.abs(other.y - y) < 44);
    // the open side: never pressed up against the Resting Stone or the wish flower
    const spots: [number, number][] = [[62, 2], [34, -46], [-34, -46], [-62, 2]];
    const pick = spots.find(([dx, dy]) => clear(seed.x + dx, seed.y + dy)) ?? (seed.x < STONE.x + 160 ? spots[1] : spots[2]);
    let side = pick[0] >= 0 ? 1 : -1, gx = seed.x + pick[0], gy = seed.y + pick[1];
    if (other && Math.abs(other.x - seed.x) > 80 && Math.abs(other.x - seed.x) < 320) { // two feelings: the event happens between them
      const mx = (other.x + seed.x) / 2, my = (other.y + seed.y) / 2 + 4;
      if (!this.blocked(mx, my, 6, door) && !inLake(mx, my, 34)) { gx = mx; gy = my; side = seed.x > other.x ? 1 : -1; }
    }
    if (steady && seed.ax !== undefined && seed.ay !== undefined) { gx = seed.ax; gy = seed.ay; } // where the person last put it
    else { seed.ax = undefined; seed.ay = undefined; }
    this.gest = new Gesture(key, spec, gx, gy, side, { x: seed.x, y: seed.y }, LAKE, c => this.sound.cue(c), this.rm, steady);
    if (!steady) {
      this.quietUntil = this.t + this.gest.revealAt + 7;
      const f = this.gest.focus;
      if (spec.focus === 'lake') this.camGoal = clamp(LAKE.x - this.vw * 0.56, 0, Math.max(0, WORLD_W - this.vw)); // bring the near bank and doorway into reach
      else if (f.x < this.cam.x + this.vw * 0.18 || f.x > this.cam.x + this.vw * 0.82) this.camGoal = clamp(f.x - this.vw * 0.5, 0, Math.max(0, WORLD_W - this.vw));
    }
  }
  /** invitations (the stone's and flower's words, the guide) wait while a feeling is being answered */
  private invite() { return this.t < this.quietUntil ? 0 : clamp((this.t - this.quietUntil) / 1.5); }
  idleCaption() {
    const sub = this.gest?.spec.sub ?? this.world.whisper;
    const today = new Date().toDateString();
    const returning = this.save.lastVisit && this.save.lastVisit !== today;
    this.save.lastVisit = today; persist(this.save);
    if (this.planted.length) this.hooks.caption(this.world.name, returning ? 'Your garden is ready for something new.' : sub, { hold: 10 });
    else this.hooks.caption(returning ? 'Your garden is ready for something new.' : 'What is happening in your world today?', this.save.everPlanted ? '' : 'carry a seed into the garden', { hold: 1e9 });
  }

  /* ---------------- seeds: carrying, planting, unplanting ---------------- */
  private seedBusy(kind: SeedKind) {
    return this.planted.some(p => p.kind === kind) || this.flights.some(f => f.kind === kind) || (this.drag?.type === 'seed' && this.drag.kind === kind);
  }
  private slotOf(kind: SeedKind): { x: number; y: number; world: boolean } {
    if (kind === 'wish') return { x: WISH.x - 58, y: WISH.y + 6, world: true };
    if (kind === 'worry') return { x: STONE.x, y: STONE.y - 34, world: true };
    const s = this.slots.find(q => q.kind === kind) ?? this.slots[0];
    return { x: s.x, y: s.y, world: false };
  }
  private fly(kind: SeedKind, x0: number, y0: number, tx: number, ty: number, world: boolean, done: () => void, arc = 90) {
    const tsx = world ? this.sx(tx) : tx, tsy = world ? this.sy(ty) : ty;
    const d = Math.hypot(tsx - x0, tsy - y0);
    this.flights.push({ kind, x0, y0, tx, ty, world, t: 0, dur: this.rm ? 0.15 : clamp(d / 900, 0.28, 0.7), arc: Math.min(arc, d * 0.5), done });
  }
  /** plant a seed at a world position; this is the heart of the whole thing */
  private plant(kind: SeedKind, x: number, y: number) {
    [x, y] = this.freeSpot(x, y);
    const send = (p: Sprout) => this.goHome(p);
    if (this.custom(kind)) { this.planted.forEach(send); this.planted = []; }
    else {
      const w = this.planted.findIndex(p => this.custom(p.kind));
      if (w >= 0) send(this.planted.splice(w, 1)[0]);
      while (this.planted.length >= 2) send(this.planted.shift()!);
    }
    this.planted.push({ kind, x, y, t0: this.t });
    if (kind === 'worry' && this.save.worry) { this.save.worry.stage = 'planted'; this.budT = [-9, -9, -9]; }
    this.save.everPlanted = true;
    const c = this.seedColor(kind);
    this.flash = 1; this.flashC = c; this.sound.plant();
    this.burst(x, y, c, this.rm ? 8 : 34, 190); this.burst(x, y, WHITE, this.rm ? 3 : 12, 120, 1);
    this.rings.push({ x, y, t0: this.t, dur: 1.1, max: 150, c, flat: 0.32 });
    this.setWorld({ x, y });
    if (kind === 'worry') this.quietUntil = this.t + 6;
  }
  private unplant(i: number) {
    const p = this.planted.splice(i, 1)[0]; if (!p) return;
    this.goHome(p); this.sound.pop();
    this.setWorld({ x: p.x, y: p.y });
  }
  /** wish-seeds and worry stones bring a whole scene of their own, so they are planted alone */
  private custom(kind: SeedKind) { return kind === 'wish' || kind === 'worry'; }
  /** a seed leaves the ground and returns to where it rests */
  private goHome(p: Sprout) {
    this.burst(p.x, p.y - 10, this.seedColor(p.kind), 9);
    const w = this.save.worry;
    p.words = undefined;
    if (p.kind === 'worry' && w) { if (w.stage === 'done') { this.save.worry = null; return; } w.stage = 'held'; }
    const h = this.slotOf(p.kind);
    this.fly(p.kind, this.sx(p.x), this.sy(p.y) - 30 * this.s, h.x, h.y, h.world, () => { });
  }
  private chordOf(kind: SeedKind) { return kind === 'wish' ? [0, 4, 7, 11] : kind === 'worry' ? [0, 3, 7, 10] : EMO[kind].chord; }
  private seedColor(kind: SeedKind): RGB { return kind === 'wish' ? [215, 200, 255] : kind === 'worry' ? [175, 165, 235] : EMO[kind].color; }
  /** plant without dragging (tap, keyboard, constellations) */
  autoPlant(kind: SeedKind, delay = 0) {
    setTimeout(() => {
      if (this.seedBusy(kind) || (kind === 'wish' && !this.save.wish) || (kind === 'worry' && this.save.worry?.stage !== 'held')) return;
      const h = this.slotOf(kind);
      // a tapped seed lands near the middle of the view, so its answer happens where you are looking
      const others = this.planted.filter(p => !this.custom(p.kind)).length, mid = this.cam.x + this.vw * 0.5;
      const first = this.planted.find(p => !this.custom(p.kind));
      const [tx, ty] = this.freeSpot(others && first ? first.x + this.vw * 0.15 : mid + (Math.random() - 0.5) * this.vw * 0.12, others && first ? first.y + (Math.random() - 0.5) * 20 : 735 + Math.random() * 40);
      this.fly(kind, h.world ? this.sx(h.x) : h.x, h.world ? this.sy(h.y) : h.y, tx, ty, true, () => this.plant(kind, tx, ty), 200);
    }, delay);
  }
  /** a tap on a seed (or its keyboard button): plant it, or bring it home if it is already planted */
  toggleSeed(kind: SeedKind) {
    const i = this.planted.findIndex(p => p.kind === kind);
    if (i >= 0) this.unplant(i); else this.autoPlant(kind);
  }
  private replant(emos: Emotion[]) {
    const keep = this.planted.filter(p => emos.includes(p.kind as Emotion));
    for (let i = this.planted.length - 1; i >= 0; i--) if (!keep.includes(this.planted[i])) this.unplant(i);
    emos.filter(e => !keep.some(k => k.kind === e)).forEach((e, i) => this.autoPlant(e, 350 + i * 550));
  }

  /* ---------------- effects ---------------- */
  private burst(x: number, y: number, c: RGB, n: number, speed = 110, shape: 0 | 1 | 2 = 0, up = 0.6) {
    if (this.rm) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - speed * up, life: 0, max: 0.7 + Math.random() * 0.9, c, r: 2 + Math.random() * 3, grav: 90, shape });
    }
  }
  private grant(kind: string, x: number, y: number) {
    [x, y] = this.groundSpot(x, y);
    const k: Keepsake = { id: uid(), kind, x, y, from: this.world.name, date: Date.now() };
    this.save.keepsakes.push(k); (k as any).born = this.t;
    if (!this.save.treasures[kind]) this.save.treasures[kind] = Date.now();
    persist(this.save);
    this.burst(x, y - 20, [255, 240, 190], 22, 130, 1); this.sound.bloom();
    this.rings.push({ x, y, t0: this.t, dur: 1, max: 90, c: [255, 240, 190], flat: 0.32 });
    const d = KEEPSAKES[kind];
    this.hooks.caption(d.name, d.line + ' It is yours to keep, and to move wherever you like.', { hold: 8 });
    return k;
  }
  private openHidden(kind: HiddenKind, wx: number, wy: number, gx: number, gyy: number, p = 1) {
    if (this.hidden) return;
    this.sound.chime(2); this.sound.whoosh(true);
    this.hooks.caption('', '');
    this.hidden = new HiddenWorld(kind, this.sx(wx, p), this.sy(wy),
      opts => opts.find(o => !this.save.treasures[o]) ?? opts[Math.floor(Math.random() * opts.length)],
      got => { if (got) this.grant(got, gx, gyy); },
      step => this.sound.chime(step ?? 0, 0.16, 2), this.rm);
  }
  openSky() {
    if (this.sky || this.hidden) return;
    const kinds = this.seedKinds(), pairs: any[] = [];
    for (let i = 0; i < kinds.length; i++) for (let j = i + 1; j < kinds.length; j++) {
      const key = pairKey(kinds[i], kinds[j]);
      pairs.push({ key, a: kinds[i], b: kinds[j], name: RECIPES[key].name, found: !!this.save.discovered[key] });
    }
    const unfound = pairs.filter(p => !p.found);
    const suggest = unfound.length ? unfound[new Date().getDate() % unfound.length].key : null;
    const treasures = Object.keys(KEEPSAKES).map(kind => ({ kind, found: !!this.save.treasures[kind] }));
    this.hooks.caption('', '');
    this.sound.chime(3); this.sound.whoosh(true);
    this.sky = new SkyView({ pairs, treasures, suggest }, pick => { if (pick) this.replant(pick); else this.idleCaption(); }, this.rm);
  }
  toggleSound() {
    // this very touch just woke the sound (it may still be warming up): never let it also switch it off
    if (this.t - this.autoT < 0.8 && this.sound.on) { this.sound.start(); this.sound.bloom(); return true; }
    const on = this.sound.toggle(); this.save.sound = on; this.save.soundOff = !on; persist(this.save);
    if (on) { this.sound.setChord(this.world.emotions.length ? EMO[this.world.emotions[0]].chord : [0, 7, 12, 16]); setTimeout(() => this.sound.bloom(), 120); }
    return on;
  }
  /** keep the current sky as a dewdrop in the garden */
  bottleWorld() {
    if (!this.planted.length) { this.hooks.caption('', 'Plant a seed first, then a dewdrop can keep the sky.', { hold: 4 }); return; }
    const toHex = (c: RGB) => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
    const p = this.world.scene.pal;
    const k = this.grant('worlddrop', this.cam.x + this.vw * (0.3 + Math.random() * 0.4), 740 + Math.random() * 60);
    k.data = { name: this.world.name, emotions: this.world.custom ? null : this.world.emotions, wish: this.world.custom ? this.save.wish : null, sky: [toHex(p.skyTop), toHex(p.skyMid), toHex(p.skyLow)] };
    persist(this.save);
    this.hooks.caption('World Dewdrop', `“${this.world.name}” is kept in a drop of dew. Touch it any day to return.`, { hold: 7 });
  }
  private tapKeepsake(k: Keepsake) {
    this.burst(k.x, k.y - 20, [255, 240, 200], 8, 70, 1); this.sound.chime();
    (k as any).born = this.t - 0.25;
    if (k.kind === 'beliefbloom' && k.data) { const w: string = k.data.worry ?? ''; this.hooks.caption(`“${k.data.reframe}”`, `grown from: “${w.length > 90 ? w.slice(0, 88).trimEnd() + '…' : w}”`, { hold: 10 }); return; }
    if (k.kind === 'worlddrop' && k.data) {
      if (k.data.wish) { const i = this.planted.findIndex(p => p.kind === 'wish'); if (i >= 0) this.unplant(i); this.save.wish = k.data.wish; this.autoPlant('wish', 900); }
      else if (k.data.emotions) this.replant(k.data.emotions);
      return;
    }
    this.hooks.caption(KEEPSAKES[k.kind]?.name ?? '', `found in ${k.from || 'the garden'}`, { hold: 4 });
  }
  private async askWish() {
    if (this.wishBusy) return;
    const words = await this.hooks.ask({ placeholder: 'describe a garden you wish for…', note: this.privacyNote('your words travel to Claude to shape the scene'), action: 'whisper it', max: 240 });
    if (!words || !words.trim()) return;
    this.wishBusy = true;
    this.hooks.caption('', 'The flower is listening…', { hold: 60 });
    const out = await composeWish(words, { discovered: Object.keys(this.save.discovered).map(k => RECIPES[k]?.name ?? k), treasures: Object.keys(this.save.treasures) });
    this.wishBusy = false;
    const i = this.planted.findIndex(p => p.kind === 'wish'); if (i >= 0) this.unplant(i);
    this.save.wish = out.spec; persist(this.save);
    this.burst(WISH.x, WISH.y - 70, [220, 200, 255], 26, 140, 1); this.sound.bloom();
    this.hooks.caption('A wish-seed has formed', 'Carry it into the garden.', { hold: 8 });
  }
  /* ---------------- worries: set one down, unknot it, choose new words ---------------- */
  async askWorry() {
    if (this.worryBusy || this.choice) return;
    const words = await this.hooks.ask({ placeholder: 'what is weighing on you?', note: this.privacyNote('your words travel to Claude so the garden can answer'), action: 'set it down', max: 400 });
    if (!words || !words.trim()) return;
    this.save.worryUsed = true; this.guide = -1;
    this.worryBusy = true;
    this.hooks.caption('', 'The garden is listening…', { hold: 60 });
    const out = await composeWorry(words);
    this.worryBusy = false;
    if (out === 'crisis') { this.hooks.caption(CRISIS_TITLE, CRISIS_LINE, { hold: 120 }); return; }
    const i = this.planted.findIndex(p => p.kind === 'worry');
    if (i >= 0) { if (this.save.worry) this.save.worry.stage = 'done'; this.unplant(i); }
    this.save.worry = { ...out, stage: 'held', opened: [false, false, false], explored: false }; persist(this.save);
    this.burst(STONE.x, STONE.y - 14, [180, 170, 240], 22, 90, 1); this.sound.chime(0, 0.16, 1);
    this.hooks.caption('It has a shape now', 'You do not have to keep holding it. Carry the stone into the garden and set it down.', { hold: 14 });
  }
  private openBud(i: number, x: number, y: number) {
    const w = this.save.worry; if (!w || w.opened[i]) return;
    w.opened[i] = true; this.budT[i] = this.t; persist(this.save);
    this.burst(x, y, [255, 236, 190], 16, 90, 1); this.sound.chime(i * 2 + 1, 0.16, 2); this.sound.whoosh(true);
    this.rings.push({ x, y: y + 20, t0: this.t, dur: 1.2, max: 80, c: [255, 236, 190], flat: 0.32 });
    const p = w.petals[i];
    this.hooks.caption(p.label, p.text + (w.opened.every(Boolean) ? ' The stone has opened. Touch its light.' : ''), { hold: 26 });
  }
  private openChoice() {
    const w = this.save.worry; if (!w || this.choice) return;
    this.hooks.caption('', ''); this.sound.whoosh(true);
    this.choice = new BeliefChoice(w.belief, w.reframes, async r => {
      if (r === OWN_WORDS) r = (await this.hooks.ask({ placeholder: 'words that feel true enough…', note: 'kept only in this garden, on this device', action: 'keep these words', max: 140 }))?.trim() || null;
      if (r) this.finishWorry(r);
    }, this.rm, n => this.sound.chime(n * 2));
  }
  private finishWorry(reframe: string) {
    const w = this.save.worry, p = this.planted.find(q => q.kind === 'worry'); if (!w || !p) return;
    w.stage = 'done';
    this.flash = 1; this.flashC = [255, 236, 190];
    this.wave = { x: p.x, y: p.y, t0: this.t };
    const k = this.grant('beliefbloom', p.x + 56, p.y + 14);
    k.data = { worry: w.worry, belief: w.belief, reframe }; persist(this.save);
    this.hooks.caption(`“${reframe}”`, 'It grows here now. Touch it whenever the old thought gets loud.', { hold: 12 });
  }
  /** The Resting Stone: a broad, mossy landmark in the foreground where worries are set down. It breathes. */
  private paintWorryStone() {
    const { ctx, t } = this, P = this.cur.pal, w = this.save.worry, { x, y, rx, ry } = STONE;
    this.grab(STONE, STONE.x, STONE.y - 15, 56, 'stone');
    const ph = t % 10, breath = this.worryBusy ? 0.5 + 0.5 * Math.sin(t * 6) : ph < 4 ? smooth(ph / 4) : 1 - smooth((ph - 4) / 6); // in for four, out for six
    const held = w?.stage === 'held', away = w?.stage === 'planted', inviting = !held && !away, lit = away ? 0.25 : 1;
    const top = y - 15;
    ctx.fillStyle = 'rgba(8,14,36,.38)'; ell(ctx, x + 4, y + 7, rx * 1.12, ry * 0.9); ctx.fill();
    if (inviting) { ctx.save(); ctx.translate(x, top); ctx.scale(1, 0.42); shine(ctx, 0, 0, rx * (1.9 + 0.5 * breath), [185, 172, 255], 0.3 + 0.4 * breath); ctx.restore(); }
    // the side of the slab, then its top face
    const side = ctx.createLinearGradient(0, top, 0, y + ry); side.addColorStop(0, css(mix([110, 104, 150], P.skyTop, 0.25))); side.addColorStop(1, css(mix([44, 40, 76], P.skyTop, 0.3)));
    ctx.fillStyle = side; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI); ctx.lineTo(x - rx, top); ctx.ellipse(x, top, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(x + rx, y); ctx.fill();
    const face = ctx.createRadialGradient(x - rx * 0.3, top - ry * 0.4, 4, x, top, rx * 1.1); face.addColorStop(0, css(mix([206, 200, 232], P.light, 0.25))); face.addColorStop(1, css(mix([128, 122, 172], P.skyMid, 0.25)));
    ctx.fillStyle = face; ell(ctx, x, top, rx, ry); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, top, rx - 1, ry - 0.6, 0, Math.PI * 1.05, Math.PI * 1.9); ctx.stroke();
    // moss on the edges
    ctx.fillStyle = css(mix(mix(P.foliage, [120, 200, 130], 0.4), P.light, 0.15));
    for (const [mx, my, mr] of [[-0.86, 0.1, 13], [-0.62, 0.62, 10], [0.8, 0.28, 12], [0.5, 0.72, 9], [-0.2, 0.92, 8]]) { ell(ctx, x + mx * rx, top + my * ry + 3, mr, mr * 0.5); ctx.fill(); }
    // the carved spiral, glowing with the breath
    ctx.save(); ctx.translate(x, top); ctx.scale(1, ry / rx * 1.25);
    const carve = (alpha: number, width: number, col: string) => { ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath(); for (let a = 0.6; a < 3.1 * TAU; a += 0.22) ctx.lineTo(Math.cos(a + 1) * a * 1.72, Math.sin(a + 1) * a * 1.72); ctx.stroke(); };
    carve(0.45, 4, 'rgba(50,44,90,1)');
    ctx.globalCompositeOperation = 'lighter'; carve(lit * (0.25 + 0.7 * breath), 2.4, '#e6dcff'); ctx.globalCompositeOperation = 'source-over';
    ctx.restore(); ctx.globalAlpha = 1;
    const label = (s: string, a: number) => { ctx.save(); ctx.translate(x, y + 34); ctx.scale(1, 0.34); glow(ctx, 0, 0, 86, [10, 14, 40], 0.5); ctx.restore(); text(ctx, s, x, y + 33, 14.5 / this.s, a, { italic: true }); };
    if (held) {
      if (this.seedBusy('worry')) return;
      const h = this.slotOf('worry');
      drawSeed(ctx, 'worry', h.x, h.y + Math.sin(t * 1.5) * 2.5, 21, t, 1.5);
      label('carry it into the garden', 0.95 * Math.max(this.invite(), this.planted.length ? 0 : 1));
      if (!this.rm) { // a ghost of the stone shows the gesture, as the seeds do
        const q = ((t % 5) - 1.6) / 2.6;
        if (q > 0 && q < 1) { const e = Math.sin(q * Math.PI), gx = h.x - 150 * e, gyv = h.y - 20 * e - Math.sin(e * Math.PI) * 46; ctx.globalAlpha = 0.42 * Math.sin(q * Math.PI); drawSeed(ctx, 'worry', gx, gyv, 19, t); ctx.globalAlpha = 1; }
      }
      return;
    }
    if (away) return;
    label(this.worryBusy ? 'listening…' : 'set down a worry', 0.95 * this.invite());
    if (!this.worryBusy) this.lateHit(x, top, 58, () => { this.sound.chime(0, 0.12, 1); void this.askWorry(); });
  }
  /** the planted worry: a stone wrapped in bramble, with three buds that open into gentler thoughts */
  private paintKnot(p: Sprout) {
    const { ctx, t } = this, w = this.save.worry; if (!w) return;
    const d = (0.95 + (p.y - 600) / 300 * 0.3) * 1.35, g = outBack((t - p.t0) / 0.9), n = w.opened.filter(Boolean).length, all = n === 3, done = w.stage === 'done';
    const warm: RGB = [255, 236, 190], sy0 = p.y - 11 * d;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.35); shine(ctx, 0, 0, 100 * d, n ? warm : [170, 160, 235], 0.35 + 0.15 * n); ctx.restore();
    ctx.fillStyle = 'rgba(10,20,40,.35)'; ell(ctx, p.x, p.y + 2, 30 * d, 8 * d); ctx.fill();
    if (done) { // opened, and something small and bright is growing where it was
      for (const sg of [-1, 1]) { ctx.save(); ctx.translate(p.x + sg * 15 * d, sy0 + 3); ctx.rotate(sg * 0.35); const sgd = ctx.createLinearGradient(0, -9, 0, 9); sgd.addColorStop(0, '#8f89b8'); sgd.addColorStop(1, '#3a3660'); ctx.fillStyle = sgd; ctx.beginPath(); ctx.ellipse(0, 0, 12 * d, 9 * d, 0, sg > 0 ? -Math.PI / 2 : Math.PI / 2, sg > 0 ? Math.PI / 2 : Math.PI * 1.5); ctx.fill(); ctx.restore(); }
      shine(ctx, p.x, sy0 - 4, 30 * d * (0.9 + 0.1 * Math.sin(t * 2)), warm, 0.4);
      ctx.strokeStyle = '#8fdcae'; ctx.lineWidth = 2.2 * d; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + 3, p.y - 12 * d, p.x, p.y - 22 * d); ctx.stroke();
      return;
    }
    // bramble and buds
    // buds grow only if the person chooses to explore; setting the stone down is enough on its own
    const explored = w.explored !== false, bg = explored ? outBack((t - Math.max(p.t0, this.exploreT)) / 0.9) : 0;
    if (explored) BUDS.forEach(([bx, by], i) => {
      const open = w.opened[i], X = p.x + bx * d * bg, Y = p.y + by * d * bg, age = t - this.budT[i], o = open ? outBack(clamp(age / 0.7)) : 0;
      ctx.strokeStyle = open ? '#7fcf9f' : '#3a3358'; ctx.lineWidth = 2.6 * d; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x + bx * 0.3 * d, sy0); ctx.quadraticCurveTo(p.x + bx * 1.25 * d, p.y + by * 0.35 * d, X, Y); ctx.stroke();
      if (!open) { ctx.lineWidth = 1.4 * d; ctx.beginPath(); for (const q of [0.35, 0.65]) { const tx = p.x + bx * (0.3 + 0.9 * q) * d, ty = sy0 + (Y - sy0) * q; ctx.moveTo(tx, ty); ctx.lineTo(tx + (bx >= 0 ? 6 : -6) * d, ty - 5 * d); } ctx.stroke(); }
      if (open) {
        shine(ctx, X, Y, 34 * d * (0.9 + 0.1 * Math.sin(t * 2 + i)), warm, 0.85);
        for (let k = 0; k < 6; k++) { const a = (k * TAU) / 6 + i; ctx.fillStyle = k % 2 ? '#fff6dc' : '#ffe2a8'; ell(ctx, X + Math.cos(a) * 6.5 * d * o, Y + Math.sin(a) * 6.5 * d * o, 5.6 * d * o, 3.4 * d * o, a); ctx.fill(); }
        ctx.fillStyle = '#fffdf0'; ell(ctx, X, Y, 3 * d, 3 * d); ctx.fill();
      } else {
        const pu = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 2.1);
        shine(ctx, X, Y, 22 * d + 8 * pu, [200, 190, 255], 0.3 + 0.35 * pu);
        ctx.strokeStyle = `rgba(230,225,255,${0.25 + 0.4 * pu})`; ctx.lineWidth = 1.2; ell(ctx, X, Y, 13 * d + 3 * pu, 13 * d + 3 * pu); ctx.stroke();
        ctx.fillStyle = '#5a4f86'; ctx.beginPath(); ctx.moveTo(X, Y - 9 * d); ctx.bezierCurveTo(X + 7 * d, Y - 2 * d, X + 5 * d, Y + 7 * d, X, Y + 7 * d); ctx.bezierCurveTo(X - 5 * d, Y + 7 * d, X - 7 * d, Y - 2 * d, X, Y - 9 * d); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, X - 2 * d, Y - 2 * d, 1.6 * d, 3 * d, 0.3); ctx.fill();
        this.lateHit(X, Y, 20, () => this.openBud(i, X, Y));
      }
    });
    // the stone itself: each open bud lets more light through
    const sg = ctx.createRadialGradient(p.x - 6 * d, sy0 - 6 * d, 2, p.x, sy0, 26 * d); sg.addColorStop(0, css(mix([143, 137, 184], warm, n * 0.2))); sg.addColorStop(0.55, '#514b78'); sg.addColorStop(1, '#221f3c');
    ctx.fillStyle = sg; ell(ctx, p.x, sy0, 23 * d * g, 14.5 * d * g); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(warm, (0.15 + 0.28 * n) * (0.8 + 0.2 * Math.sin(t * 3))); ctx.lineWidth = (1.2 + n * 0.7) * d; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(p.x - 12 * d, sy0 - 6 * d); ctx.lineTo(p.x - 3 * d, sy0 - 1 * d); ctx.lineTo(p.x - 6 * d, sy0 + 8 * d); ctx.moveTo(p.x - 3 * d, sy0 - 1 * d); ctx.lineTo(p.x + 8 * d, sy0 - 5 * d); ctx.lineTo(p.x + 13 * d, sy0 + 4 * d); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    if (all) {
      const pu = 0.5 + 0.5 * Math.sin(t * 2.6);
      shine(ctx, p.x, sy0, (46 + 16 * pu) * d, warm, 0.9);
      ctx.fillStyle = '#fffdf0'; star4(ctx, p.x, sy0, (7 + 3 * pu) * d, t * 0.5, 0.3); ctx.fill();
      ctx.strokeStyle = css(warm, 0.4 + 0.4 * pu); ctx.lineWidth = 1.5; ell(ctx, p.x, sy0, (28 + 6 * pu) * d, (19 + 4 * pu) * d); ctx.stroke();
      this.lateHit(p.x, sy0, 28, () => this.openChoice());
    }
    if (!explored && this.t > this.quietUntil && !this.worryBusy) { // an optional next step, offered quietly
      const a = clamp((this.t - this.quietUntil) / 2) * 0.7, ly = sy0 - 40 * d;
      ctx.save(); ctx.translate(p.x, ly); ctx.scale(1, 0.34); glow(ctx, 0, 0, 96, [10, 14, 40], 0.5 * a / 0.7); ctx.restore();
      text(ctx, 'explore this feeling', p.x, ly, 13 / this.s, a, { italic: true });
      if (a > 0.2) this.lateHit(p.x, ly, 36, () => { this.sound.chime(1); void this.exploreWorry(); });
    }
  }
  /** the line under the writing space says truthfully where the words go, once that is known */
  private privacyNote(remote: string): Promise<string> {
    return readyComposer().then(c => (c === 'local' ? 'your words stay on this device' : remote));
  }
  /** begins with one open question, and lets the person's own answer lead */
  private async exploreWorry() {
    const w = this.save.worry; if (!w || this.worryBusy) return;
    const part = await this.hooks.ask({ question: 'What part of this is weighing on you?', placeholder: 'or put it in your own words…', chips: worryParts(w.worry), note: this.privacyNote('your words travel to Claude so the garden can answer'), action: 'tell the garden', max: 240 });
    if (!part || !part.trim()) return;
    this.worryBusy = true;
    this.hooks.caption('', 'The garden is listening…', { hold: 60 });
    const out = await composeWorry(w.worry, part.trim());
    this.worryBusy = false;
    if (out === 'crisis') { this.hooks.caption(CRISIS_TITLE, CRISIS_LINE, { hold: 120 }); return; }
    const cur = this.save.worry; if (!cur) return;
    Object.assign(cur, { acknowledge: out.acknowledge, belief: out.belief, petals: out.petals, reframes: out.reframes, part: part.trim(), explored: true, opened: [false, false, false] });
    persist(this.save);
    this.exploreT = this.t; this.budT = [-9, -9, -9]; this.sound.cue('sprout');
    this.hooks.caption(`“${part.trim()}”`, 'Three buds have formed. Touch one when you are ready.', { hold: 14 });
  }
  private async askMemory() {
    const words = await this.hooks.ask({ placeholder: 'a memory, a thought, or nothing at all', note: 'kept only in this garden, on this device', action: 'let it rise', max: 200 });
    if (words === null) return;
    const r = Math.random;
    const m = { id: uid(), text: words.trim(), date: Date.now(), u: 0.08 + r() * 0.84, v: r() };
    this.memReleased = true;
    this.risingMem = { x: MEM.x, y: MEM.y, t: 0, tx: 560 + m.u * 680, ty: 90 + m.v * 230 };
    this.sound.bloom();
    setTimeout(() => { this.save.memories.push(m); persist(this.save); }, this.rm ? 100 : 3800);
    this.hooks.caption('', 'It will stay in your sky. Touch it whenever you want to read it again.', { hold: 6 });
  }
  private rainBloom(x: number, y: number) {
    [x, y] = this.groundSpot(x, y);
    this.rainBlooms.push({ x, y, kind: 'blue', c: hex('#8fe0ff'), th: 0, ph: Math.random() * TAU, size: 15, g: 0, pop: 1, open: 1 });
    this.rings.push({ x, y, t0: this.t, dur: 0.9, max: 60, c: [150, 210, 255], flat: 0.32 });
    this.burst(x, y - 10, [150, 215, 255], 10, 70); this.sound.chime(this.rainCount, 0.14, 2);
    if (++this.rainCount === 5) {
      setTimeout(() => {
        this.grant('rainbloom', x + 30, y + 10);
        if (!this.save.hopeUnlocked) {
          this.save.hopeUnlocked = true; persist(this.save); this.layoutLedge();
          const h = this.slotOf('hope');
          this.fly('hope', this.sx(x), this.sy(y) - 40, h.x, h.y, false, () => this.hooks.caption('A seed of Hope', 'It grew out of the rain. It is waiting on the ledge with the others.', { hold: 8 }), 260);
        }
      }, 700);
    }
  }

  /* ---------------- input ---------------- */
  private pos(e: PointerEvent) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  private down(e: PointerEvent) {
    if (this.drag) return;
    this.camGoal = null;
    this.idle = 0;
    if (!this.sound.audible && !this.save.soundOff) { this.sound.start(); this.autoT = this.t; this.sound.setChord(this.world.emotions.length ? EMO[this.world.emotions[0]].chord : [0, 7, 12, 16]); }
    const { x, y } = this.pos(e);
    this.pointerId = e.pointerId; try { this.canvas.setPointerCapture(e.pointerId); } catch { /* */ }
    const base = { sx: x, sy: y, x, y, moved: false, touch: e.pointerType === 'touch' };
    if (this.hidden || this.sky || this.choice) { this.drag = { type: 'overlay', ...base }; return; }
    for (const sl of this.slots) if (!this.seedBusy(sl.kind) && Math.hypot(x - sl.x, y - sl.y) < this.seedR * 1.7) { this.startSeedDrag(sl.kind, base); return; }
    if (this.save.wish && !this.seedBusy('wish')) { const h = this.slotOf('wish'); if (Math.hypot(x - this.sx(h.x), y - this.sy(h.y)) < 30) { this.startSeedDrag('wish', base); return; } }
    if (this.save.worry?.stage === 'held' && !this.seedBusy('worry')) { const h = this.slotOf('worry'); if (Math.hypot(x - this.sx(h.x), y - this.sy(h.y)) < 44) { this.startSeedDrag('worry', base); return; } }
    // words and buds that must win (the flower, the stone's buds) beat the seed or keepsake beneath them
    if (this.late.some(h => Math.hypot(x - h.x, y - h.y) < h.r)) { this.drag = { type: 'pan', ...base, lastX: x, grabC: this.grabAt(x, y) }; return; }
    for (let i = this.save.keepsakes.length - 1; i >= 0; i--) {
      const k = this.save.keepsakes[i];
      if (Math.hypot(x - this.sx(k.x), y - (this.sy(k.y) - 22 * this.s)) < 30) { this.drag = { type: 'keep', k, ox: this.sx(k.x) - x, oy: this.sy(k.y) - y, ...base }; return; }
    }
    const near = this.grabAt(x, y), nd = near ? Math.hypot(x - near.x, y - near.y) / near.r : 1;
    for (let i = 0; i < this.planted.length; i++) {
      const p = this.planted[i], d = Math.hypot(x - this.sx(p.x), y - (this.sy(p.y) - 24 * this.s));
      if (p.kind !== 'worry' && d < 30 && !(near && near.o !== p && nd < d / 30 - 0.15)) { this.drag = { type: 'sprout', i, grabC: { o: p, name: 'sprout' }, ...base }; return; } // unless a flower right beside it is plainly nearer the finger
    }
    this.drag = { type: 'pan', ...base, lastX: x, grabC: this.grabAt(x, y) };
  }
  private startSeedDrag(kind: SeedKind, base: any) {
    const preview = kind === 'wish' ? validateSpec(this.save.wish)?.world.scene : kind === 'worry' ? validateSpec(this.save.worry?.scene)?.world.scene
      : composeWorld([...this.planted.filter(p => !this.custom(p.kind)).map(p => p.kind as Emotion).slice(-1), kind]).scene;
    this.lean = preview ? { scene: preview, k: 0 } : null;
    this.drag = { type: 'seed', kind, ...base };
    this.sound.pickup(this.chordOf(kind));
  }
  private move(e: PointerEvent) {
    const d = this.drag; if (!d || e.pointerId !== this.pointerId) return;
    const { x, y } = this.pos(e);
    if (Math.hypot(x - d.sx, y - d.sy) > 8) d.moved = true;
    // small things follow the finger straight away; the tree and the lake (which fill the view) still want a press-and-hold, so a drag over them slides the garden
    if (d.moved && (d.type === 'pan' || d.type === 'sprout') && d.grabC && d.grabC.name !== 'tree' && d.grabC.name !== 'lake') {
      const o = d.grabC.o, name: string = d.grabC.name;
      this.drag = { ...d, type: 'move', o, name, ox: this.sx(o.x) - d.sx, oy: this.sy(o.y) - d.sy };
      this.moveTo(o, name, this.wx(x + this.drag.ox), this.wy(y + this.drag.oy));
      this.drag.lastX = x; this.drag.x = x; this.drag.y = y; return;
    }
    if (d.type === 'pan' && d.moved) { const dx = (x - d.lastX) / this.s; this.cam.x -= dx; this.cam.vx = -dx * 60 * 0.5 + this.cam.vx * 0.5; }
    if (d.type === 'move') this.moveTo(d.o, d.name, this.wx(x + d.ox), this.wy(y + d.oy));
    if (d.type === 'keep' && d.moved) {
      const wx = this.wx(x + d.ox), wy = this.wy(y + d.oy);
      d.letgo = wy < HORIZON - 30;
      if (d.letgo) { d.k.x = clamp(wx, 20, WORLD_W - 20); d.k.y = wy; } else[d.k.x, d.k.y] = this.groundSpot(wx, wy);
    }
    d.lastX = x; d.x = x; d.y = y;
  }
  private up(e: PointerEvent, cancel = false) {
    this.sound.wake();
    const d = this.drag; if (!d || e.pointerId !== this.pointerId) return;
    this.drag = null;
    const { x, y } = this.pos(e);
    if (d.type === 'overlay') { if (!d.moved && !cancel) { if (this.hidden) this.hidden.tap(x, y, this.W, this.H); else if (this.sky) this.sky.tap(x, y); else this.choice?.tap(x, y); } return; }
    if (d.type === 'seed') {
      this.lean = null;
      const kind: SeedKind = d.kind, h = this.slotOf(kind), lift = d.touch ? 44 : 0;
      if (!d.moved && !cancel) { this.toggleSeed(kind); return; }
      const py = y - lift;
      if (cancel || py > this.ledgeTop - 4) { this.fly(kind, x, py, h.x, h.y, h.world, () => { }, 30); return; }
      // released over the world: it falls to the ground beneath and takes root
      const wx = this.wx(x), wy = this.wy(py);
      const [tx, ty] = this.freeSpot(wx, wy > gy(wx) + 40 ? wy : 650 + Math.random() * 70);
      if (Math.abs(ty - wy) < 12) this.plant(kind, tx, ty);
      else this.fly(kind, x, py, tx, ty, true, () => this.plant(kind, tx, ty), 0);
      return;
    }
    if (d.type === 'keep') {
      const k: Keepsake = d.k;
      if (!d.moved) this.tapKeepsake(k);
      else if (d.letgo) {
        this.save.keepsakes = this.save.keepsakes.filter(q => q !== k);
        this.burst(k.x, k.y, [255, 240, 200], 30, 120, 1, 1); this.sound.bloom();
        this.hooks.caption('', `The ${KEEPSAKES[k.kind]?.name ?? 'keepsake'} drifted up into the sky.`, { hold: 4 });
      }
      persist(this.save); return;
    }
    if (d.type === 'move') { this.settle(); this.burst(d.o.x, d.o.y, mix(this.cur.pal.light, WHITE, 0.5), 8, 60); this.sound.pop(); return; }
    if (d.type === 'sprout') { if (!d.moved) this.unplant(d.i); return; }
    if (d.type === 'pan' && !d.moved && !cancel) this.tap(x, y);
  }
  private tap(x: number, y: number) {
    for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (Math.hypot(x - h.x, y - h.y) < h.r) { h.fn(); return; } }
    if (y > this.ledgeTop) { // a tap on a planted seed's empty spot calls that one seed home; the others stay
      const gap = this.slots.length > 1 ? this.slots[1].x - this.slots[0].x : this.W;
      const sl = this.slots.reduce((b, q) => (Math.abs(q.x - x) < Math.abs(b.x - x) ? q : b), this.slots[0]);
      const i = sl && Math.abs(sl.x - x) < gap / 2 ? this.planted.findIndex(p => p.kind === sl.kind) : -1;
      if (i >= 0) this.unplant(i);
      return;
    }
    const wx = this.wx(x), wy = this.wy(y), ground = wy > gy(wx) + 6;
    if (this.cur.f.rain > 0.35) { // touch the rain: light falls where you touched and something blooms
      if (ground && !inLake(wx, wy)) this.rainBloom(wx, wy);
      else { const ty = 640 + Math.random() * 120; this.particles.push({ x: wx, y: wy, vx: 0, vy: 260, life: 0, max: Math.max(0.2, (ty - wy) / 260), c: [170, 220, 255], r: 4, grav: 0, shape: 0 }); setTimeout(() => this.rainBloom(wx, ty), Math.max(200, ((ty - wy) / 260) * 1000)); }
      return;
    }
    if (inLake(wx, wy) && this.cur.f.lake > 0.5) { this.rings.push({ x: wx, y: wy, t0: this.t, dur: 1.6, max: 70, c: WHITE, flat: 0.3 }); this.sound.splash(); return; }
    if (ground) { this.burst(wx, wy, mix(this.cur.pal.ground, WHITE, 0.5), 6, 60); return; }
    // the sky answers too
    this.particles.push({ x: wx, y: wy, vx: 260 + Math.random() * 120, vy: 90, life: 0, max: 0.8, c: WHITE, r: 3, grav: 0, shape: 1 });
    this.burst(wx, wy, this.cur.pal.light, 5, 40, 1, 0);
  }

  /* ---------------- update ---------------- */
  private frame(ts: number) {
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0.016); this.last = ts;
    this.t += dt;
    this.update(dt); this.draw();
    requestAnimationFrame(q => this.frame(q));
  }
  private update(dt: number) {
    const t = this.t, T = this.world.scene, rate = this.rm ? 5 : 1;
    // the weather glides; while a seed is being carried the world leans toward what it would become
    let lk = 0;
    if (this.lean && this.drag?.type === 'seed') { const over = this.drag.moved && this.drag.y < this.ledgeTop; this.lean.k = approach(this.lean.k, over ? 1 : 0, 3, dt); lk = this.lean.k * 0.3; }
    for (const k of PAL_KEYS) { const tg = lk ? mix(T.pal[k], this.lean!.scene.pal[k], lk) : T.pal[k]; const c = this.cur.pal[k]; for (let i = 0; i < 3; i++) c[i] = approach(c[i], tg[i], 1.0 * rate, dt); }
    for (const k of FEATURES) { const tg = lk ? lerp(T.f[k], this.lean!.scene.f[k], lk) : T.f[k]; this.cur.f[k] = approach(this.cur.f[k], tg, 1.25 * rate, dt); }
    const f = this.cur.f;
    this.sound.tick(dt, {
      rain: f.rain, wind: clamp(f.mountains * 0.5 + f.storm * 0.8 + f.mist * 0.35 + f.clouds * 0.2), water: clamp(f.lake - 0.2) + f.koi * 0.3,
      birds: clamp(f.birds * 0.8 + f.sun * 0.5 + f.blooms * 0.3 + f.hopeSprouts * 0.5 - f.rain - f.stars), night: clamp(f.stars + f.moon * 0.4 - f.sun),
      sparkle: clamp(f.motes * 0.4 + f.fireflies * 0.5 + f.lanterns * 0.5 + f.floaters * 0.4 + f.treeGold * 0.3), bright: clamp(f.sun * 0.7 + f.rays * 0.4),
      bees: clamp(f.blooms * 0.6 + f.warmBlooms * 0.5 + f.butterflies * 0.3 - f.rain - f.stars) * clamp(f.sun + f.rays * 0.5),
      frogs: clamp(f.lake * 0.9) * clamp(f.stars * 0.7 + f.moon * 0.6 + f.rain * 0.7 + f.mist * 0.3),
      owl: clamp(f.stars * 0.6 + f.moon * 0.5 - f.sun) * clamp(0.35 + f.mushrooms * 0.4 + f.door * 0.4 + f.floaters * 0.3),
      hawk: f.mountains * clamp(1 - f.rain - f.stars), doves: clamp(f.lanterns * 0.4 + f.koi * 0.3 + f.treeGold * 0.5 + f.mist * 0.3) * clamp(1 - f.stars - f.rain),
      leaves: clamp(0.55 + f.treeGold * 0.2 + f.treeGlow * 0.2 + f.petals * 0.2),
    });
    const cd = this.drag?.type === 'seed' && this.drag.moved ? this.drag : null;
    this.sound.carry(cd ? 1 : 0, cd ? clamp(1 - cd.y / this.H) : 0, cd ? this.chordOf(cd.kind) : undefined);
    // the wave: things near the planted seed change first
    const wr = this.wave ? (this.rm ? 1e5 : (t - this.wave.t0) * 620) : 1e5, wx0 = this.wave?.x ?? 0;
    if (this.wave && wr > 2600) this.wave = null;
    // press and hold on a thing to lift it
    const dg = this.drag;
    if (dg && (dg.type === 'pan' || dg.type === 'sprout') && !dg.moved && dg.grabC && (dg.hold = (dg.hold ?? 0) + dt) > 0.32) {
      const o = dg.grabC.o, name: string = dg.grabC.name;
      this.drag = { ...dg, type: 'move', o, name, ox: this.sx(o.x) - dg.x, oy: this.sy(o.y) - dg.y };
      this.rings.push({ x: o.x, y: o.y, t0: t, dur: 0.6, max: name === 'lake' ? 200 : name === 'tree' ? 110 : 50, c: WHITE, flat: 0.32 });
      this.sound.pickup([0, 7]); this.hooks.caption('', '');
    }
    const reached = (x: number) => Math.abs(x - wx0) < wr;
    for (const fl of this.flowers) { if (reached(fl.x)) fl.g = approach(fl.g, this.flowerTarget(fl, T.f), 5, dt); fl.pop = Math.max(0, fl.pop - dt * 1.6); }
    this.rainBlooms = this.rainBlooms.filter(b => { b.g = approach(b.g, b.th > 1 ? 0 : 1, 4, dt); b.pop = Math.max(0, b.pop - dt * 1.4); return b.g > 0.02 || b.th <= 1; });
    for (const m of this.mushrooms) { if (reached(m.x)) m.g = approach(m.g, T.f.mushrooms > 0.3 ? 1 : 0, 5, dt); m.pop = Math.max(0, m.pop - dt * 2); }
    this.stonesA.forEach((s, i) => { if (reached(s.x)) s.g = approach(s.g, T.f.path > i / 9 && T.f.passage < 0.5 ? 1 : 0, 6, dt); });
    this.stonesB.forEach(s => { s.g = approach(s.g, T.f.passage > s.q * 0.9 + 0.05 && wr > s.q * 900 ? 1 : 0, 5, dt); });
    this.gifts.forEach((g, i) => (g.g = approach(g.g, !g.taken && f.gifts > (i + 0.5) / 7 ? 1 : 0, 4, dt)));
    this.lanterns.forEach(l => { l.g = approach(l.g, f.lanterns > l.th * 0.9 + 0.08 ? 1 : 0, 2.2, dt); l.boost = Math.max(0, l.boost - dt * 0.5); });
    this.floaters.forEach((fl, i) => { fl.g = approach(fl.g, f.floaters > i / 9 + 0.1 ? 1 : 0, 2.5, dt); fl.spin = Math.max(0, fl.spin - dt * 1.2); });
    // camera
    if (this.drag?.type !== 'pan') { this.cam.x += this.cam.vx * dt; this.cam.vx *= Math.exp(-4 * dt); }
    const maxX = Math.max(0, WORLD_W - this.vw);
    if (this.drag?.type === 'seed' || this.drag?.type === 'move' || (this.drag?.type === 'keep' && this.drag.moved)) { // carry something to the edge and the world scrolls
      const e = this.drag.x / this.W; if (e < 0.1) this.cam.x -= 380 * dt * (1 - e / 0.1); if (e > 0.9) this.cam.x += 380 * dt * ((e - 0.9) / 0.1);
    }
    if (this.camGoal !== null && !this.drag) { this.cam.x = approach(this.cam.x, this.camGoal, 2.2, dt); this.cam.vx = 0; if (Math.abs(this.cam.x - this.camGoal) < 0.5) this.camGoal = null; }
    this.cam.x = clamp(this.cam.x, 0, maxX);
    // the answer to a planted feeling, then its two lines of words
    if (this.gest) {
      this.gest.update(dt);
      if (!this.gest.revealed && this.gest.age >= this.gest.revealAt) {
        this.gest.revealed = true;
        if (!this.hidden && !this.sky && !this.choice) { this.hooks.caption(this.world.name, this.gest.spec.sub, { hold: 14 }); this.sound.cue('reveal'); }
      }
    }
    this.hush = approach(this.hush, this.gest && this.gest.age < this.gest.revealAt + 3 ? 0.3 : 1, 1.2, dt); // other sparkle steps back
    // creatures
    const np = Math.round(f.puffs * 4);
    this.puffs.forEach((p, i) => {
      p.g = approach(p.g, i < np ? 1 : 0, 4, dt); p.jump = Math.max(0, p.jump - dt * 1.4);
      if (p.hop > 0) { p.hop = Math.max(0, p.hop - dt * 2.4); const q = 1 - p.hop; p.x = lerp(p.fx, p.tx, q); p.y = lerp(p.fy, p.ty, q); }
      else if ((p.wait -= dt) < 0 && p.g > 0.5) {
        let gx = p.gx, gyv = p.gy, tx: number, ty: number;
        if (this.drag?.type === 'seed' && this.drag.moved && this.drag.y < this.ledgeTop) { gx = this.wx(this.drag.x); gyv = p.y; }
        if (!isNaN(gx) && Math.hypot(gx - p.x, gyv - p.y) > 36) { tx = p.x + clamp(gx - p.x, -75, 75); ty = p.y + clamp(gyv - p.y, -30, 30); p.wait = 0.12; }
        else { p.gx = NaN; tx = p.x + (Math.random() - 0.5) * 160; ty = p.y + (Math.random() - 0.5) * 60; p.wait = 0.8 + Math.random() * 3; }
        tx = clamp(tx, 440, 1560); ty = clamp(ty, 632, this.maxPlantY());
        if (!inLake(tx, ty, 20) && ((tx - STONE.x) / 78) ** 2 + ((ty - STONE.y + 6) / 34) ** 2 > 1) { p.fx = p.x; p.fy = p.y; p.tx = tx; p.ty = ty; p.dir = tx > p.x ? 1 : -1; p.hop = 1; } else p.gx = NaN;
      }
    });
    for (const b of this.flies) { b.fx *= Math.exp(-1.5 * dt); b.fy *= Math.exp(-1.5 * dt); b.x = b.ax + Math.sin(t * 0.31 + b.ph) * 130 + Math.sin(t * 1.3 + b.ph) * 14 + b.fx; b.y = b.ay + Math.sin(t * 0.47 + b.ph * 2) * 50 + Math.cos(t * 1.7 + b.ph) * 8 + b.fy; }
    // falling gifts
    this.fallen = this.fallen.filter(g => {
      g.t += dt;
      if (g.y < g.ground) { g.vy += 900 * dt; g.y = Math.min(g.ground, g.y + g.vy * dt); if (g.y >= g.ground) { g.t = 0; this.burst(g.x, g.y - 6, [255, 220, 150], 16, 110, 1); this.sound.chime(4); if (g.first) this.grant('sapling', g.x, g.y); else for (const b of this.flies.slice(0, 4)) { b.fx = g.x - b.ax; b.fy = g.y - 60 - b.ay; } } return true; }
      return g.t < 0.5;
    });
    if (this.risingMem) { const m = this.risingMem; m.t += dt / (this.rm ? 0.1 : 3.8); if (m.t >= 1) this.risingMem = null; }
    // particles, flights
    this.particles = this.particles.filter(p => { p.life += dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; return p.life < p.max; });
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);
    this.rings = this.rings.filter(r => t - r.t0 < r.dur);
    this.flights = this.flights.filter(fl => { fl.t += dt / fl.dur; if (fl.t >= 1) { fl.done(); return false; } return true; });
    this.flash = Math.max(0, this.flash - dt * 1.3);
    // ambient emitters
    if (!this.rm) {
      if (f.treeGlow > 0.4 && Math.random() < dt * 9) this.particles.push({ x: TREE.x + (Math.random() - 0.5) * 220, y: TREE.y - 240 - Math.random() * 120, vx: (Math.random() - 0.5) * 12, vy: -24, life: 0, max: 2.6, c: this.cur.pal.light, r: 2.2, grav: -4, shape: 0 });
      if (f.rain > 0.3 && Math.random() < dt * 14 * f.rain) { const x = this.cam.x + Math.random() * this.vw, y = 610 + Math.random() * 330; this.rings.push({ x, y, t0: t, dur: 0.7, max: inLake(x, y) ? 26 : 10, c: [200, 225, 255], flat: 0.3 }); }
      if (f.storm > 0.4 && (this.nextStorm -= dt) < 0) { this.stormFlash = 1; this.nextStorm = 4 + Math.random() * 6; this.sound.thunder(); }
      if (this.drag?.type === 'seed' && this.drag.moved && Math.random() < dt * 40) { const d = this.drag; this.particles.push({ x: d.x + (Math.random() - 0.5) * 10, y: d.y - (d.touch ? 44 : 0), vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 40, life: 0, max: 0.8, c: this.seedColor(d.kind), r: 2.4, grav: 60, shape: 0, screen: true }); }
    }
    this.stormFlash = Math.max(0, this.stormFlash - dt * 2.5);
    this.hintT -= dt;
    // the guide: until someone has used the resting stone, a firefly shows the way after a quiet while
    this.idle += dt;
    const quiet = !this.save.worryUsed && !this.gest && this.t > this.quietUntil && !this.rm && !this.drag && !this.hidden && !this.sky && !this.choice && !this.worryBusy && !this.save.worry;
    if (this.guide < 0) { if (quiet && this.idle > 20) { this.guide = 0; this.idle = 0; } }
    else { this.guide += dt / 9; if (this.guide >= 1 || !quiet) this.guide = -1; }
    this.hidden?.update(dt); if (this.hidden?.finished) this.hidden = null;
    this.choice?.update(dt); if (this.choice?.finished) this.choice = null;
    this.sky?.update(dt); if (this.sky?.finished) this.sky = null;
  }

  /* ---------------- painting ---------------- */
  private draw() {
    const { ctx, W, H, t } = this, P = this.cur.pal, f = this.cur.f;
    this.hits = []; this.late = []; this.grabs = [];
    this.screen();
    const hy = this.sy(HORIZON);
    // sky
    const sg = ctx.createLinearGradient(0, 0, 0, hy + 20);
    sg.addColorStop(0, css(P.skyTop)); sg.addColorStop(0.58, css(P.skyMid)); sg.addColorStop(1, css(P.skyLow));
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    if (f.stars > 0.02) { ctx.fillStyle = '#fff'; for (const [u, v, r, ph] of this.stars) { ctx.globalAlpha = f.stars * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + ph))) * (1 - v * 0.5); ctx.fillRect(u * W - this.cam.x * 0.02, v * hy * 0.92, r, r); } ctx.globalAlpha = 1; }
    if (f.aurora > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) for (let x = 0; x < W; x += 12) {
        const y0 = hy * (0.08 + 0.1 * b) + Math.sin(x * 0.006 + t * 0.25 + b * 2) * hy * 0.07, h = hy * (0.34 + 0.12 * Math.sin(x * 0.011 - t * 0.3 + b));
        ctx.globalAlpha = f.aurora * (0.1 + 0.08 * Math.sin(x * 0.02 + t * 0.6 + b * 3)); ctx.drawImage(this.auroraSprites[b], x, y0, 13, h);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    // sun, moon
    this.layer(0.06);
    const sunY = 300 + 150 * clamp(f.mountains * 0.7 + f.treeGold * 0.6 - f.blooms * 0.5), sunX = 965;
    if (f.sun > 0.02 || f.rays > 0.02) {
      const c = mix(P.light, WHITE, 0.35);
      if (f.rays > 0.02) {
        ctx.save(); ctx.translate(sunX, sunY); ctx.globalCompositeOperation = 'lighter';
        const rg = ctx.createRadialGradient(0, 0, 30, 0, 0, 1000); rg.addColorStop(0, css(c, 0.12 * f.rays)); rg.addColorStop(1, css(c, 0));
        ctx.fillStyle = rg; ctx.beginPath();
        for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12 + t * 0.025, w = 0.07 + 0.03 * Math.sin(i * 3 + t * 0.4); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - w) * 1000, Math.sin(a - w) * 1000); ctx.lineTo(Math.cos(a + w) * 1000, Math.sin(a + w) * 1000); }
        ctx.fill(); ctx.restore();
      }
      shine(ctx, sunX, sunY, 520, c, 0.33 * Math.max(f.sun, f.rays * 0.6)); shine(ctx, sunX, sunY, 170, c, 0.8 * f.sun);
      ctx.fillStyle = css(mix(c, WHITE, 0.6), f.sun); ell(ctx, sunX, sunY, 44, 44); ctx.fill();
    }
    if (f.moon > 0.02) {
      shine(ctx, 1105, 300, 240, [220, 225, 255], 0.5 * f.moon);
      ctx.fillStyle = css([246, 243, 226], f.moon); ell(ctx, 1105, 300, 36, 36); ctx.fill();
      ctx.fillStyle = css(mix(P.skyTop, P.skyMid, 0.35), f.moon * 0.92); ell(ctx, 1123, 290, 31, 31); ctx.fill();
    }
    if (f.rainbow > 0.02) {
      this.layer(0.12); ctx.globalCompositeOperation = 'screen'; ctx.lineWidth = 11;
      ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'].forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.32 * f.rainbow; ctx.beginPath(); ctx.arc(930, HORIZON + 70, Math.min(600, this.vw * 0.66) - i * 11, Math.PI, TAU); ctx.stroke(); });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    // lights you have released
    this.layer(0.2);
    for (const m of this.save.memories) {
      const x = 560 + m.u * 680 + Math.sin(t * 0.2 + m.v * 9) * 14, y = 90 + m.v * 230 + Math.sin(t * 0.5 + m.u * 9) * 6;
      this.paintLantern(x, y, 0.62, 1, 0.15);
      this.hit(x, y, 26, () => { this.sound.chime(); this.hooks.caption(m.text ? `“${m.text}”` : 'a quiet light', new Date(m.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }), { hold: 6 }); }, 0.2);
    }
    if (f.clouds > 0.02) {
      this.layer(0.15);
      const cc = mix(WHITE, P.skyTop, clamp(0.1 + 0.42 * f.rain + 0.3 * f.storm));
      for (const c of this.clouds) {
        const x = ((c.x + t * c.spd) % 2600 + 2600) % 2600 - 350;
        ctx.save(); ctx.translate(x, c.y); ctx.scale(c.sc, c.sc * 0.52);
        for (const [bx, by, br] of c.blobs) glow(ctx, bx, by, br * 1.5, cc, 0.62 * f.clouds);
        ctx.restore();
      }
    }
    if (this.stormFlash > 0.01) { this.screen(); ctx.fillStyle = `rgba(230,235,255,${0.3 * this.stormFlash * f.storm})`; ctx.fillRect(0, 0, W, hy); }
    if (f.birds > 0.03) {
      this.layer(0.25); ctx.strokeStyle = css(mix(P.skyTop, DARK, 0.6), 0.75 * f.birds); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      const bx = this.pivot(0.25) - this.vw / 2 - 200 + ((t * 46) % (this.vw + 600)); ctx.beginPath();
      for (let i = 0; i < 7; i++) { const x = bx - Math.abs(i - 3) * 34 - (i % 2) * 8, y = 250 + (i - 3) * 16 + Math.sin(t * 0.7 + i) * 8, w = Math.sin(t * 7 + i) * 5; ctx.moveTo(x - 9, y - w); ctx.quadraticCurveTo(x - 3, y - 2, x, y + 2); ctx.quadraticCurveTo(x + 3, y - 2, x + 9, y - w); }
      ctx.stroke();
    }
    this.paintMountains();
    this.paintGround();
    this.paintEntities();
    this.paintAir();
    this.hits.push(...this.late);
    // weather in front
    this.screen();
    if (f.rain > 0.02) {
      ctx.strokeStyle = `rgba(205,225,255,${0.42 * f.rain})`; ctx.lineWidth = 1.2; ctx.beginPath();
      const n = this.rm ? 40 : this.rain.length, sp = this.rm ? 0.25 : 1;
      for (let i = 0; i < n; i++) { const [u, v, k] = this.rain[i]; const y = ((v + t * 1.25 * k * sp) % 1) * (H + 40) - 20, x = ((u * (W + 120) - y * 0.12) % (W + 120) + W + 120) % (W + 120) - 60; ctx.moveTo(x, y); ctx.lineTo(x - 2.6 * k, y + 20 * k); }
      ctx.stroke();
    }
    const vg = ctx.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(8,10,34,0)'); vg.addColorStop(1, 'rgba(8,10,34,.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (this.flash > 0.01 && !this.rm) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(this.flashC, 0.2 * this.flash * this.flash); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    this.paintLedge();
    if (this.hidden) this.hidden.draw(ctx, W, H);
    if (this.choice) this.choice.draw(ctx, W, H);
    if (this.sky) this.sky.draw(ctx, W, H);
  }

  private paintMountains() {
    const { ctx, t } = this, P = this.cur.pal, f = this.cur.f;
    const ridge = (arr: number[], p: number, base: number, amp: number, top: RGB, bottom: RGB, bump = 0) => {
      this.layer(p);
      const g = ctx.createLinearGradient(0, HORIZON - amp - base, 0, HORIZON + 10); g.addColorStop(0, css(top)); g.addColorStop(1, css(bottom));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, HORIZON + 30);
      arr.forEach((h, i) => { const x = i * 20; ctx.lineTo(x, HORIZON - base - h * amp - bump * Math.exp(-(((x - PASSAGE_X) / 150) ** 2))); });
      ctx.lineTo(WORLD_W + 20, HORIZON + 30); ctx.fill();
    };
    const m = f.mountains;
    if (m > 0.01) {
      ridge(this.mfar, 0.25, 30 * m, 330 * m, mix(mix(P.skyMid, P.skyTop, 0.45), P.light, 0.25), mix(P.skyMid, P.skyLow, 0.7));
      // snow
      ctx.fillStyle = css(mix(WHITE, P.light, 0.3), 0.55 * m); ctx.beginPath();
      this.mfar.forEach((h, i) => { if (h > 0.6) { const x = i * 20, y = HORIZON - 30 * m - h * 330 * m; ctx.moveTo(x - 20, y + 20 * m + (h - 0.6) * 120 * m); ctx.lineTo(x, y); ctx.lineTo(x + 20, y + 20 * m + (h - 0.6) * 90 * m); ctx.lineTo(x + 6, y + 14 * m); ctx.lineTo(x - 5, y + 24 * m); } });
      ctx.fill();
      if (f.ridgeGlow > 0.02) { // the ridge glows red
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (const [w, al] of [[16, 0.08], [7, 0.2], [2.4, 0.55]]) {
          ctx.strokeStyle = css([255, 92, 56], al * f.ridgeGlow * (0.85 + 0.15 * Math.sin(t * 0.6))); ctx.lineWidth = w; ctx.beginPath();
          this.mfar.forEach((h, i) => { const x = i * 20, y = HORIZON - 30 * m - h * 330 * m; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    if (m > 0.01 || f.passage > 0.01) ridge(this.mnear, 0.5, 14 * m, 200 * m, mix(mix(P.skyTop, P.foliage, 0.35), P.light, 0.12), mix(P.foliage, P.skyLow, 0.5), 150 * f.passage);
    if (f.passage > 0.03) { // the lit way into the mountain
      this.layer(0.5); const g = f.passage, x = PASSAGE_X, y = HORIZON + 4, h = 78 * g, w = 25 * g;
      shine(ctx, x, y - h * 0.5, 150 * g * (0.9 + 0.1 * Math.sin(t * 2)), P.light, 0.7);
      ctx.fillStyle = '#120b2c'; ctx.beginPath(); ctx.moveTo(x - w - 8, y); ctx.lineTo(x - w - 8, y - h + w); ctx.arc(x, y - h + w, w + 8, Math.PI, 0); ctx.lineTo(x + w + 8, y); ctx.fill();
      const ig = ctx.createLinearGradient(0, y - h, 0, y); ig.addColorStop(0, css(mix(P.light, [120, 80, 220], 0.5))); ig.addColorStop(1, css(mix(P.light, WHITE, 0.6)));
      ctx.fillStyle = ig; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w, y - h + w); ctx.arc(x, y - h + w, w, Math.PI, 0); ctx.lineTo(x + w, y); ctx.fill();
      for (let i = 0; i < 9; i++) { const lx = x + (i % 2 ? 1 : -1) * (40 + i * 13) + Math.sin(i * 5) * 10, ly = y - 20 - i * 15 * g; shine(ctx, lx, ly, 13 + 5 * Math.sin(t * 3 + i * 2), i % 3 ? [255, 220, 150] : [160, 255, 230], 0.9 * g); }
      if (g > 0.6) this.hit(x, y - h * 0.5, 54, () => this.openHidden('passage', x, y - h * 0.5, this.passageGX() + 30, 650, 0.5), 0.5);
    }
    // soft far hills + tree line
    this.layer(0.6); ctx.fillStyle = css(mix(P.groundFar, P.skyLow, 0.5)); ctx.beginPath(); ctx.moveTo(-20, HORIZON + 30);
    for (let x = -20; x <= WORLD_W + 20; x += 40) ctx.lineTo(x, HORIZON - 24 - 16 * Math.sin(x * 0.004 + 1) - 9 * Math.sin(x * 0.011));
    ctx.lineTo(WORLD_W + 20, HORIZON + 30); ctx.fill();
    this.layer(0.8);
    for (const tr of this.treeline) {
      const c = mix(mix(P.foliage, P.skyMid, 0.34), DARK, 0.1 * tr.tone), sw = Math.sin(t * 0.7 + tr.x) * 1.5, by = HORIZON + 8;
      ctx.strokeStyle = css(mix(c, DARK, 0.3)); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tr.x, by); ctx.lineTo(tr.x, by - tr.h * 0.6); ctx.stroke();
      ctx.fillStyle = css(c); ell(ctx, tr.x + sw, by - tr.h * 0.75, tr.w * 0.8, tr.h * 0.42); ctx.fill();
      ctx.fillStyle = css(mix(c, P.light, 0.22)); ell(ctx, tr.x + sw - tr.w * 0.2, by - tr.h * 0.86, tr.w * 0.45, tr.h * 0.22); ctx.fill();
    }
  }

  private paintGround() {
    const { ctx, t } = this, P = this.cur.pal, f = this.cur.f;
    this.layer(1);
    const g = ctx.createLinearGradient(0, HORIZON - 20, 0, 1000);
    g.addColorStop(0, css(mix(P.groundFar, P.skyLow, 0.25))); g.addColorStop(0.12, css(P.groundFar)); g.addColorStop(0.5, css(P.ground)); g.addColorStop(1, css(mix(P.ground, DARK, 0.5)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-60, 1010);
    for (let x = -60; x <= WORLD_W + 60; x += 30) ctx.lineTo(x, gy(x));
    ctx.lineTo(WORLD_W + 60, 1010); ctx.fill();
    // horizon haze melts land into sky
    ctx.save(); ctx.translate(0, HORIZON + 6); ctx.scale(1, 0.09);
    for (let x = 100; x < WORLD_W; x += 330) glow(ctx, x, 0, 360, P.skyLow, 0.5);
    ctx.restore();
    // light pooling on the grass beneath the sun
    ctx.save(); ctx.translate(1010, 720); ctx.scale(1, 0.3); shine(ctx, 0, 0, 620, P.light, 0.16 * Math.max(f.sun, f.moon * 0.6)); ctx.restore();
    // grass
    const sway = (ph: number) => Math.sin(t * 1.3 + ph) * 2.2;
    ctx.lineCap = 'round'; ctx.lineWidth = 1.8;
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = css(pass ? mix(P.ground, P.light, 0.4) : mix(P.ground, DARK, 0.3), 0.75); ctx.beginPath();
      for (let i = pass; i < this.tufts.length; i += 2) { const tf = this.tufts[i], d = 0.6 + (tf.y - 580) / 400, s = sway(tf.ph); ctx.moveTo(tf.x - 3 * d, tf.y); ctx.lineTo(tf.x - 5 * d + s, tf.y - tf.h * d); ctx.moveTo(tf.x, tf.y); ctx.lineTo(tf.x + s, tf.y - tf.h * 1.3 * d); ctx.moveTo(tf.x + 3 * d, tf.y); ctx.lineTo(tf.x + 5 * d + s, tf.y - tf.h * d); }
      ctx.stroke();
    }
    // lake
    const k = Math.sqrt(clamp(f.lake)), rx = LAKE.rx * k, ry = LAKE.ry * k;
    if (k > 0.1) {
      ctx.fillStyle = css(mix(P.ground, DARK, 0.3)); ell(ctx, LAKE.x, LAKE.y + 3, rx + 9, ry + 6); ctx.fill();
      ctx.save(); ell(ctx, LAKE.x, LAKE.y, rx, ry); ctx.clip();
      const wg = ctx.createLinearGradient(0, LAKE.y - ry, 0, LAKE.y + ry);
      wg.addColorStop(0, css(mix(P.water, P.skyLow, 0.6))); wg.addColorStop(0.5, css(mix(P.water, P.skyMid, 0.35))); wg.addColorStop(1, css(mix(P.water, P.skyTop, 0.5)));
      ctx.fillStyle = wg; ctx.fillRect(LAKE.x - rx, LAKE.y - ry, rx * 2, ry * 2);
      if (f.mountains > 0.2) { ctx.fillStyle = css(mix(P.skyTop, P.foliage, 0.4), 0.22 * f.mountains); ctx.beginPath(); for (let i = 0; i < 5; i++) { const x = LAKE.x - rx + i * rx * 0.5; ctx.moveTo(x - 70, LAKE.y - ry); ctx.lineTo(x, LAKE.y - ry + 50 + (i % 2) * 22); ctx.lineTo(x + 70, LAKE.y - ry); } ctx.fill(); }
      ctx.save(); ctx.translate(LAKE.x + 40, LAKE.y - ry * 0.2); ctx.scale(1, 0.35); shine(ctx, 0, 0, rx * 0.8, mix(P.light, WHITE, 0.4), 0.35 * Math.max(f.sun, f.moon)); ctx.restore();
      for (const l of this.lanterns) if (l.g > 0.05) { ctx.save(); ctx.translate(l.x, LAKE.y + (l.y - 500) * 0.2); ctx.scale(1, 0.4); shine(ctx, 0, 0, 44, [255, 190, 110], 0.5 * l.g); ctx.restore(); }
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 11; i++) { const y = LAKE.y - ry + (i + 0.5) * ((ry * 2) / 11), x = LAKE.x + Math.sin(i * 2.4 + t * 0.4) * rx * 0.6, w = 18 + 14 * Math.sin(t + i); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y); }
      ctx.stroke();
      if (f.koi > 0.05) for (let i = 0; i < 4; i++) {
        const dir = i % 2 ? 1 : -1, a = t * 0.32 * dir + i * 1.7, kx = LAKE.x + Math.cos(a) * rx * (0.35 + i * 0.1), ky = LAKE.y + Math.sin(a) * ry * (0.3 + i * 0.1);
        const hd = Math.atan2(Math.cos(a) * ry * dir, -Math.sin(a) * rx * dir), c: RGB = i % 2 ? [255, 160, 90] : [255, 240, 230];
        ctx.save(); ctx.translate(kx, ky); ctx.scale(1, 0.55); ctx.rotate(hd); ctx.globalAlpha = f.koi;
        shine(ctx, 0, 0, 26, c, 0.5); ctx.fillStyle = css(c, 0.9); ell(ctx, 0, 0, 13, 4.5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-21, -5 + Math.sin(t * 6 + i) * 3); ctx.lineTo(-21, 5 + Math.sin(t * 6 + i) * 3); ctx.fill(); ctx.restore();
      }
      if (f.waterDoor > 0.03) { // a door, under the water
        const d = f.waterDoor, pulse = 0.75 + 0.25 * Math.sin(t * 1.8);
        ctx.save(); ctx.translate(LAKE.x, LAKE.y + 4); ctx.scale(1, 0.5);
        shine(ctx, 0, 0, 150 * d, P.light, 0.8 * pulse * d);
        ctx.strokeStyle = css(mix(P.light, WHITE, 0.6), d); ctx.lineWidth = 5; ctx.fillStyle = css(mix(P.light, WHITE, 0.3), 0.35 * d * pulse);
        ctx.beginPath(); ctx.moveTo(-28, 46); ctx.lineTo(-28, -16); ctx.arc(0, -16, 28, Math.PI, 0); ctx.lineTo(28, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = css(WHITE, d); ell(ctx, 14, 16, 4, 4); ctx.fill(); ctx.restore();
      }
      for (const r of this.rings) if (inLake(r.x, r.y)) { const q = (t - r.t0) / r.dur; ctx.strokeStyle = css(r.c, 0.6 * (1 - q)); ctx.lineWidth = 1.6; ell(ctx, r.x, r.y, r.max * q, r.max * q * r.flat); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = css(mix(P.light, WHITE, 0.5), 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(LAKE.x, LAKE.y, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      if (f.waterDoor > 0.4) {
        ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createLinearGradient(0, LAKE.y - 230, 0, LAKE.y); lg.addColorStop(0, css(P.light, 0)); lg.addColorStop(1, css(P.light, 0.3 * f.waterDoor));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(LAKE.x - 26, LAKE.y); ctx.lineTo(LAKE.x - 60, LAKE.y - 230); ctx.lineTo(LAKE.x + 60, LAKE.y - 230); ctx.lineTo(LAKE.x + 26, LAKE.y); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
        this.hit(LAKE.x, LAKE.y, 70, () => this.openHidden('lake', LAKE.x, LAKE.y, LAKE.x - 120, LAKE.y + LAKE.ry + 40));
      }
    }
    if (k > 0.3) for (const q of [-0.6, 0, 0.6]) this.grab(LAKE, LAKE.x + q * rx, LAKE.y, ry * 0.95, 'lake');
    // stepping stones
    const stone = (x: number, y: number, g: number, i: number) => {
      if (g < 0.02 || this.blocked(x, y, -8, false) || (this.gest && Math.abs(x - this.gest.x) < 70 && Math.abs(y - this.gest.y) < 34)) return; const d = (0.55 + (y - 560) / 420) * outBack(g);
      ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.4); shine(ctx, 0, 0, 40 * d, P.light, 0.5 * g * (0.7 + 0.3 * Math.sin(t * 2 - i * 0.6))); ctx.restore();
      ctx.fillStyle = css(mix([205, 205, 225], P.light, 0.35), g); ell(ctx, x, y, 17 * d, 6.5 * d); ctx.fill();
      ctx.fillStyle = css(WHITE, 0.4 * g); ell(ctx, x - 3 * d, y - 1.5 * d, 9 * d, 2.6 * d); ctx.fill();
    };
    this.stonesA.forEach((s, i) => stone(s.x, s.y, s.g, i));
    const ex = this.passageGX(), ey = gy(ex) + 10;
    this.stonesB.forEach((s, i) => { const q = s.q, a = (1 - q) ** 2, b = 2 * q * (1 - q), c = q * q; stone(a * 880 + b * 790 + c * ex, a * 880 + b * 680 + c * ey, s.g, i); });
    // rings on land (the transformation wave and small ripples)
    for (const r of this.rings) if (!inLake(r.x, r.y)) { const q = (t - r.t0) / r.dur; ctx.strokeStyle = css(r.c, 0.7 * (1 - q)); ctx.lineWidth = 2.2; ell(ctx, r.x, r.y, r.max * q, r.max * q * r.flat); ctx.stroke(); }
    if (this.wave && !this.rm) {
      const age = t - this.wave.t0, R = age * 620, a = clamp(1 - age / 2.4);
      if (a > 0) { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const rr = R - i * 46; if (rr > 0) { ctx.strokeStyle = css(mix(this.flashC, WHITE, 0.4), a * (0.5 - i * 0.14)); ctx.lineWidth = 9 - i * 2; ell(ctx, this.wave.x, this.wave.y, rr, rr * 0.3); ctx.stroke(); } } ctx.globalCompositeOperation = 'source-over'; }
    }
  }

  private paintFlower(fl: Flower) {
    const { ctx, t } = this; if (fl.g < 0.02) return;
    const d = (0.62 + (fl.y - 600) / 330 * 0.6) * (1 + fl.open * 0.22), g = outBack(fl.g), pop = 1 + Math.sin(fl.pop * Math.PI) * 0.55;
    let lean = Math.sin(t * 1.2 + fl.ph) * 0.09;
    if (this.drag?.type === 'seed' && this.drag.moved) { const dx = this.wx(this.drag.x) - fl.x; if (Math.abs(dx) < 260) lean += clamp(dx / 260, -1, 1) * 0.25 * (1 - Math.abs(dx) / 260); }
    const h = fl.size * 2.3 * d * g, r = fl.size * d * g * pop * 0.62;
    const hx = fl.x + Math.sin(lean) * h, hyy = fl.y - Math.cos(lean) * h;
    ctx.strokeStyle = css(mix(this.cur.pal.foliage, DARK, 0.15)); ctx.lineWidth = 2 * d; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fl.x, fl.y); ctx.quadraticCurveTo(fl.x, fl.y - h * 0.6, hx, hyy); ctx.stroke();
    if (fl.kind === 'hope') {
      ctx.fillStyle = css(mix(this.cur.pal.foliage, [190, 255, 170], 0.6));
      ell(ctx, hx - r * 0.9, hyy + r * 0.9, r * 0.9, r * 0.38, 0.6); ctx.fill(); ell(ctx, hx + r * 0.9, hyy + r * 0.6, r * 0.9, r * 0.38, -0.6); ctx.fill();
      shine(ctx, hx, hyy - r * 0.3, r * 3.2 * (0.85 + 0.15 * Math.sin(t * 2.4 + fl.ph)), fl.c, 0.8);
      ctx.fillStyle = '#fffde6'; ell(ctx, hx, hyy - r * 0.3, r * 0.42, r * 0.5); ctx.fill();
    } else if (fl.kind === 'blue') {
      shine(ctx, hx, hyy, r * 3.6 * (0.85 + 0.15 * Math.sin(t * 2 + fl.ph)), fl.c, 0.6);
      ctx.fillStyle = css(fl.c);
      for (let i = 0; i < 5; i++) { const a = (i * TAU) / 5 + lean - Math.PI / 2; ctx.beginPath(); ctx.moveTo(hx, hyy); ctx.quadraticCurveTo(hx + Math.cos(a - 0.5) * r * 0.9, hyy + Math.sin(a - 0.5) * r * 0.9, hx + Math.cos(a) * r * 1.5, hyy + Math.sin(a) * r * 1.5); ctx.quadraticCurveTo(hx + Math.cos(a + 0.5) * r * 0.9, hyy + Math.sin(a + 0.5) * r * 0.9, hx, hyy); ctx.fill(); }
      ctx.fillStyle = '#f2fbff'; ell(ctx, hx, hyy, r * 0.32, r * 0.32); ctx.fill();
    } else if (fl.kind === 'warm') {
      shine(ctx, hx, hyy - r * 0.4, r * 2.8, fl.c, 0.45);
      ctx.save(); ctx.translate(hx, hyy); ctx.rotate(lean);
      for (const [o, c] of [[-0.45, mix(fl.c, DARK, 0.12)], [0.45, mix(fl.c, DARK, 0.06)], [0, mix(fl.c, WHITE, 0.2)]] as [number, RGB][]) { ctx.fillStyle = css(c); ctx.save(); ctx.rotate(o * (0.6 + fl.open * 0.5)); ctx.beginPath(); ctx.moveTo(0, r * 0.3); ctx.bezierCurveTo(-r * 0.8, -r * 0.2, -r * 0.5, -r * 1.4, 0, -r * 1.6); ctx.bezierCurveTo(r * 0.5, -r * 1.4, r * 0.8, -r * 0.2, 0, r * 0.3); ctx.fill(); ctx.restore(); }
      ctx.restore();
    } else {
      ctx.fillStyle = css(fl.c);
      for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 + lean + fl.ph; ell(ctx, hx + Math.cos(a) * r * 0.78, hyy + Math.sin(a) * r * 0.78, r * 0.62, r * 0.4, a); ctx.fill(); }
      ctx.fillStyle = '#ffd35a'; ell(ctx, hx, hyy, r * 0.4, r * 0.4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(ctx, hx - r * 0.12, hyy - r * 0.12, r * 0.16, r * 0.16); ctx.fill();
    }
    if (fl.g > 0.6) this.grab(fl, hx, hyy, 24, 'flower');
    if (fl.g > 0.6) this.hit(hx, hyy, 15, () => { fl.pop = 1; fl.open = 1; this.burst(hx, hyy, fl.c, 9, 70, fl.kind === 'joy' ? 0 : 1); this.sound.chime(); });
  }

  private paintEntities() {
    const { ctx, t } = this, P = this.cur.pal, f = this.cur.f;
    this.layer(1);
    const list: [number, () => void][] = [];
    for (const fl of this.flowers) if (fl.g > 0.02) list.push([fl.y, () => this.paintFlower(fl)]);
    for (const fl of this.rainBlooms) list.push([fl.y, () => this.paintFlower(fl)]);
    for (const m of this.mushrooms) if (m.g > 0.02) list.push([m.y, () => {
      const d = (0.7 + (m.y - 600) / 400) * outBack(m.g), sq = 1 - Math.sin(m.pop * Math.PI) * 0.3, s = m.size * d;
      ctx.fillStyle = '#f3ead8'; ctx.fillRect(m.x - s * 0.2, m.y - s * 1.1 * sq, s * 0.4, s * 1.1 * sq);
      shine(ctx, m.x, m.y - s * 1.2 * sq, s * 3.4, m.c, 0.5 + 0.2 * Math.sin(t * 2 + m.x));
      ctx.fillStyle = css(m.c); ctx.beginPath(); ctx.ellipse(m.x, m.y - s * 1.05 * sq, s * (1 + (1 - sq)), s * 0.8 * sq, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, m.x - s * 0.4, m.y - s * 1.4 * sq, s * 0.14, s * 0.1); ctx.fill(); ell(ctx, m.x + s * 0.3, m.y - s * 1.3 * sq, s * 0.18, s * 0.12); ctx.fill();
      this.grab(m, m.x, m.y - s, 14, 'mushroom');
      this.hit(m.x, m.y - s, 14, () => { m.pop = 1; this.burst(m.x, m.y - s * 1.4, m.c, 10, 50, 0, 1.2); this.sound.pop(); });
    }]);
    list.push([TREE.y, () => this.paintTree()]);
    if (f.door > 0.03) list.push([DOOR.y, () => this.paintDoor()]);
    list.push([WISH.y, () => this.paintWishFlower()]);
    list.push([STONE.y, () => this.paintWorryStone()]);
    if (f.garlands > 0.05) for (const [px, py, ph] of [[330, 668, 110], [990, 668, 112], [1430, 652, 108]]) list.push([py, () => { ctx.strokeStyle = css(mix([120, 90, 70], DARK, 0.2)); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - ph * outBack(f.garlands)); ctx.stroke(); }]);
    for (const p of this.puffs) if (p.g > 0.03) list.push([p.y, () => this.paintPuff(p)]);
    for (const g of this.fallen) list.push([g.ground, () => { const open = g.y >= g.ground ? g.t * 2 : 0; ctx.globalAlpha = 1 - clamp(open); this.paintGift(g.x, g.y - 8, g.kind, 1.3 + open); ctx.globalAlpha = 1; }]);
    for (const k of this.save.keepsakes) list.push([k.y, () => {
      const born = (k as any).born ?? -9, age = t - born, d = 0.85 + (clamp(k.y, 600, 900) - 600) / 300 * 0.45, held = this.drag?.type === 'keep' && this.drag.k === k && this.drag.moved;
      const sc = d * (0.4 + 0.6 * outBack(age / 0.6)), lift = held ? 10 : 0;
      ctx.fillStyle = `rgba(10,20,40,${held ? 0.18 : 0.28})`; ell(ctx, k.x, k.y + 1, 15 * d, 4.5 * d); ctx.fill();
      if (held) { ctx.strokeStyle = this.drag.letgo ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]); ell(ctx, k.x, k.y - 20, 32, 32); ctx.stroke(); ctx.setLineDash([]); }
      drawKeepsake(ctx, k.kind, k.x, k.y - lift, sc, t + k.x, k.data);
    }]);
    this.planted.forEach((p, i) => list.push([p.y, () => (p.kind === 'worry' ? this.paintKnot(p) : this.paintSprout(p, i))]));
    if (this.gest) { const g = this.gest; list.push([g.y + 1, () => { g.paint(ctx, t, this.cur.pal.light, this.hush); for (const [hx, hy, hr] of g.handles) this.grab(g, hx, hy, hr, 'answer'); }]); }
    if (!this.glimmer.found && this.t > this.quietUntil) list.push([this.glimmer.y, () => {
      const gl = this.glimmer, tw = Math.max(0, Math.sin(t * 1.9 + gl.x)) ** 5;
      shine(ctx, gl.x, gl.y - 8, 18 + 22 * tw, WHITE, 0.25 + 0.7 * tw);
      ctx.fillStyle = css(WHITE, 0.35 + 0.65 * tw); star4(ctx, gl.x, gl.y - 8, 3 + 7 * tw, t * 0.6, 0.25); ctx.fill();
      this.hit(gl.x, gl.y - 8, 20, () => { gl.found = true; this.foundGlimmers.add(this.world.key); this.grant(EMO[this.world.emotions[0]].treasure, gl.x, gl.y); });
    }]);
    list.sort((a, b) => a[0] - b[0]);
    for (const [, fn] of list) fn();
    // the wish seed rests beside its flower until carried
    if (this.save.wish && !this.seedBusy('wish')) { const h = this.slotOf('wish'); ctx.fillStyle = 'rgba(10,20,40,.3)'; ell(ctx, h.x, h.y + 14, 12, 4); ctx.fill(); drawSeed(ctx, 'wish', h.x, h.y + Math.sin(t * 2) * 3, 11, t); }
  }

  private paintTree() {
    const { ctx, t } = this, P = this.cur.pal, f = this.cur.f;
    const S = 1 + 0.32 * f.treeGlow + 0.1 * f.treeGold, cy = -235 * S;
    ctx.save(); ctx.translate(TREE.x, TREE.y);
    ctx.fillStyle = 'rgba(10,20,40,.25)'; ell(ctx, 10, 2, 120 * S, 16); ctx.fill();
    if (f.treeGlow > 0.03) shine(ctx, 0, cy, 380 * S * (0.92 + 0.08 * Math.sin(t * 1.5)), P.light, 0.5 * f.treeGlow);
    if (f.treeGold > 0.03) shine(ctx, 0, cy, 300 * S, GOLD, 0.3 * f.treeGold);
    const trunk = mix(mix([96, 66, 56], P.skyTop, 0.25), [160, 110, 66], f.treeGold * 0.5);
    const tg = ctx.createLinearGradient(-26, 0, 26, 0); tg.addColorStop(0, css(mix(trunk, DARK, 0.25))); tg.addColorStop(0.6, css(trunk)); tg.addColorStop(1, css(mix(trunk, P.light, 0.3)));
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-27, 0); ctx.bezierCurveTo(-13, -60 * S, -20, -120 * S, -9, -200 * S); ctx.lineTo(10, -200 * S); ctx.bezierCurveTo(19, -120 * S, 12, -60 * S, 30, 0); ctx.fill();
    ctx.strokeStyle = css(trunk); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -150 * S); ctx.quadraticCurveTo(-40, -180 * S, -66, -222 * S); ctx.moveTo(4, -140 * S); ctx.quadraticCurveTo(36, -170 * S, 60, -212 * S); ctx.stroke();
    const leaf = mix(mix(P.foliage, GOLD, f.treeGold * 0.85), P.light, f.treeGlow * 0.3);
    for (const b of this.canopy) { const sw = Math.sin(t * 0.8 + b.dx) * 2.5; ctx.fillStyle = css(mix(leaf, b.tone < 0.5 ? mix(P.skyTop, DARK, 0.3) : P.light, b.tone < 0.5 ? 0.32 - b.tone * 0.4 : (b.tone - 0.5) * 0.3)); ell(ctx, b.dx * S + sw, cy + b.dy * S, b.r * S, b.r * S * 0.92); ctx.fill(); }
    for (const b of this.canopy) if (b.tone > 0.35) { const sw = Math.sin(t * 0.8 + b.dx) * 2.5; ctx.fillStyle = css(mix(leaf, WHITE, 0.3), 0.4); ell(ctx, b.dx * S + sw - b.r * 0.22 * S, cy + b.dy * S - b.r * 0.28 * S, b.r * 0.5 * S, b.r * 0.4 * S); ctx.fill(); }
    if (f.treeGlow > 0.03) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, cy, 190 * S, P.light, 0.3 * f.treeGlow * (0.8 + 0.2 * Math.sin(t * 2.2))); ctx.globalCompositeOperation = 'source-over'; }
    this.gifts.forEach((g, i) => {
      if (g.g < 0.03) return; const a = Math.sin(t * 1.4 + i * 1.3) * 0.13, top = cy + 62 * S, len = g.len * g.g;
      const gx = g.dx * S + Math.sin(a) * len, gyv = top + Math.cos(a) * len;
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.dx * S, top - 10); ctx.lineTo(gx, gyv); ctx.stroke();
      ctx.save(); ctx.translate(gx, gyv); ctx.rotate(-a); this.paintGift(0, 8, g.kind, g.g); ctx.restore();
      this.hit(TREE.x + gx, TREE.y + gyv + 8, 16, () => { g.taken = true; g.g = 0; this.fallen.push({ x: TREE.x + gx, y: TREE.y + gyv, vy: 0, ground: TREE.y + 20 + i * 9, kind: g.kind, t: 0, first: !this.giftTaken }); this.giftTaken = true; this.sound.pop(); });
    });
    ctx.restore();
    this.grab(TREE, TREE.x, TREE.y - 80, 44, 'tree'); this.grab(TREE, TREE.x, TREE.y + cy, 96 * S, 'tree');
    this.hit(TREE.x, TREE.y + cy, 96 * S, () => { // shake the tree
      const c = mix(mix(P.foliage, GOLD, f.treeGold), WHITE, 0.2);
      for (let i = 0; i < 16; i++) this.particles.push({ x: TREE.x + (Math.random() - 0.5) * 220 * S, y: TREE.y + cy + (Math.random() - 0.3) * 120, vx: (Math.random() - 0.5) * 50, vy: 20, life: 0, max: 2.2, c, r: 3.5, grav: 60, shape: 2 });
      this.sound.chime();
    });
  }
  private paintGift(x: number, y: number, kind: number, sc: number) {
    const { ctx, t } = this, c = [hex('#ff8fa3'), hex('#8fd8ff'), hex('#ffe08a')][kind];
    shine(ctx, x, y, 24 * sc, c, 0.55 + 0.15 * Math.sin(t * 3 + kind));
    ctx.fillStyle = css(c); ctx.beginPath(); ctx.roundRect(x - 7 * sc, y - 7 * sc, 14 * sc, 14 * sc, 3 * sc); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x - 1.3 * sc, y - 7 * sc, 2.6 * sc, 14 * sc); ctx.fillRect(x - 7 * sc, y - 1.3 * sc, 14 * sc, 2.6 * sc);
  }
  private paintDoor() {
    const { ctx, t } = this, P = this.cur.pal, g = this.cur.f.door, h = 124, pulse = 0.75 + 0.25 * Math.sin(t * 1.7);
    ctx.save(); ctx.translate(DOOR.x, DOOR.y);
    ctx.fillStyle = 'rgba(10,20,40,.3)'; ell(ctx, 0, 2, 58 * g, 10 * g); ctx.fill();
    ctx.beginPath(); ctx.rect(-90, -220, 180, 224); ctx.clip();
    ctx.translate(0, (1 - outBack(g) * 0.999) * (h + 30));
    shine(ctx, 0, -60, 150 * pulse, P.light, 0.65);
    const stone = mix([156, 152, 182], P.skyMid, 0.3), sg = ctx.createLinearGradient(-44, 0, 44, 0); sg.addColorStop(0, css(mix(stone, DARK, 0.3))); sg.addColorStop(1, css(mix(stone, P.light, 0.25)));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-44, -82); ctx.arc(0, -82, 44, Math.PI, 0); ctx.lineTo(44, 0); ctx.fill();
    ctx.strokeStyle = css(mix(stone, DARK, 0.4), 0.6); ctx.lineWidth = 1.5;
    for (let i = 0; i <= 6; i++) { const a = Math.PI + (i * Math.PI) / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 31, -82 + Math.sin(a) * 31); ctx.lineTo(Math.cos(a) * 44, -82 + Math.sin(a) * 44); ctx.stroke(); }
    const dg = ctx.createLinearGradient(0, -116, 0, 0); dg.addColorStop(0, '#3a2376'); dg.addColorStop(1, '#6a3fb8');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-30, -82); ctx.arc(0, -82, 30, Math.PI, 0); ctx.lineTo(30, 0); ctx.fill();
    // the light behind it leaks through
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(mix(P.light, WHITE, 0.5), 0.9 * pulse);
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(21, -98); ctx.lineTo(30, -84); ctx.lineTo(30, 0); ctx.fill();
    ctx.fillRect(-30, -3, 60, 3); glow(ctx, 24, -50, 60, mix(P.light, WHITE, 0.4), 0.7 * pulse);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ell(ctx, -4, -78, 10, 10); ctx.stroke();
    ctx.fillStyle = css(mix(P.light, WHITE, 0.5), pulse); star4(ctx, -4, -78, 7, t * 0.5, 0.3); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; ell(ctx, 10, -46, 3, 3); ctx.fill();
    ctx.restore();
    if (g > 0.6) this.grab(DOOR, DOOR.x, DOOR.y - 60, 56, 'door');
    if (g > 0.6) this.hit(DOOR.x, DOOR.y - 60, 56, () => this.openHidden('door', DOOR.x, DOOR.y - 60, DOOR.x + 70, DOOR.y + 44));
  }
  private paintWishFlower() {
    const { ctx, t } = this, x = WISH.x, y = WISH.y, K = WK, busy = this.wishBusy, sp = busy ? 7 : 1.6, pulse = 0.8 + 0.2 * Math.sin(t * sp);
    const sw = Math.sin(t * 0.9) * 0.06, hx = x + 14 + Math.sin(sw) * 60, hyy = y - 66;
    const HX = x + (hx - x) * K, HY = y + (hyy - y) * K; // where the bloom really is, after scaling
    const breath = (() => { const ph = t % 10; return ph < 4 ? smooth(ph / 4) : 1 - smooth((ph - 4) / 6); })();
    const c1: RGB = [215 + 40 * Math.sin(t * 0.8), 200 + 40 * Math.sin(t * 0.8 + 2), 255];
    ctx.save(); ctx.translate(x, y + 2); ctx.scale(1, 0.32); shine(ctx, 0, 0, 70, c1, 0.25 + 0.25 * breath); ctx.restore();
    shine(ctx, HX + 6, HY - 14, (70 + 26 * breath) * pulse, c1, 0.55 + 0.25 * breath);
    ctx.save(); ctx.translate(x, y); ctx.scale(K, K); ctx.translate(-x, -y);
    ctx.strokeStyle = css(mix(this.cur.pal.foliage, WHITE, 0.25)); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 10, y - 30, x + 20, y - 40, hx, hyy); ctx.stroke();
    ctx.fillStyle = css(mix(this.cur.pal.foliage, WHITE, 0.2)); ell(ctx, x - 12, y - 14, 13, 5, 0.6); ctx.fill(); ell(ctx, x + 12, y - 24, 12, 4.5, -0.5); ctx.fill();
    ctx.save(); ctx.translate(hx, hyy); ctx.rotate(0.5 + sw);
    const g = ctx.createLinearGradient(0, 6, 0, -32); g.addColorStop(0, '#b9a2ff'); g.addColorStop(0.6, '#f4ecff'); g.addColorStop(1, '#bff3ff');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-3, 6); ctx.bezierCurveTo(-5, -10, -20, -20, -19, -30); ctx.quadraticCurveTo(-9, -24, 0, -31); ctx.quadraticCurveTo(9, -24, 19, -30); ctx.bezierCurveTo(20, -20, 5, -10, 3, 6); ctx.fill();
    ctx.fillStyle = 'rgba(120,90,220,.45)'; ell(ctx, 0, -27, 14, 4.5); ctx.fill();
    ctx.fillStyle = '#fff8c8'; ell(ctx, 0, -27, 3, 2); ctx.fill();
    ctx.restore();
    if (!this.rm) for (let i = 0; i < 3; i++) { const q = (t * (busy ? 1.2 : 0.35) + i / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - q)})`; ell(ctx, hx + 16 + Math.sin(q * 6 + i) * 6, hyy - 30 - q * 46, 2, 2); ctx.fill(); }
    ctx.restore();
    // its words, above the bloom, on a soft dark backing so they read over any sky or scenery
    const said = busy ? 'listening…' : this.save.wish ? (this.seedBusy('wish') ? '' : 'plant your wish') : 'whisper a wish';
    if (said) {
      const ly = HY - 62;
      const inv = this.invite();
      ctx.save(); ctx.translate(HX + 4, ly); ctx.scale(1, 0.34); glow(ctx, 0, 0, said.length * 5.2 + 34, [10, 14, 40], 0.55 * inv); ctx.restore();
      text(ctx, said, HX + 4, ly, 14.5 / this.s, 0.95 * inv, { italic: true });
      if (!busy && !this.save.wish) this.lateHit(HX + 4, ly, 34, () => { this.sound.chime(1); void this.askWish(); });
    }
    this.grab(WISH, HX + 6, HY - 14, 40, 'wish'); this.grab(WISH, x, y - 24, 26, 'wish');
    this.lateHit(HX + 6, HY - 14, 40, () => { this.sound.chime(1); void this.askWish(); }); // wins over butterflies passing in front
  }

  private paintPuff(p: Garden['puffs'][number]) {
    const { ctx, t } = this, d = 0.8 + (p.y - 640) / 300 * 0.45, q = 1 - p.hop;
    const air = p.hop > 0 ? Math.sin(q * Math.PI) : 0, j = Math.sin(clamp(p.jump) * Math.PI), up = air * 24 + j * 50;
    const sq = 1 + air * 0.12 - (p.hop <= 0 ? Math.max(0, Math.sin(t * 2.2 + p.x)) * 0.05 : 0), R = 14 * d * outBack(p.g);
    ctx.fillStyle = `rgba(10,20,40,${0.28 - air * 0.12})`; ell(ctx, p.x, p.y + 1, R * (1 - air * 0.25), R * 0.3); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y - R * 0.9 - up * d); ctx.scale(p.dir / sq, sq);
    const leafC = mix(this.cur.pal.foliage, [170, 235, 150], 0.5), tw = Math.sin(t * 3 + p.x) * 0.12 + air * 0.4;
    ctx.fillStyle = css(leafC);
    ctx.save(); ctx.translate(-R * 0.35, -R * 0.8); ctx.rotate(-0.4 - tw); ell(ctx, 0, -R * 0.55, R * 0.26, R * 0.62); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(R * 0.3, -R * 0.8); ctx.rotate(0.35 + tw); ell(ctx, 0, -R * 0.55, R * 0.26, R * 0.62); ctx.fill(); ctx.restore();
    const bg = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R * 1.15); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.5, css(p.c)); bg.addColorStop(1, css(mix(p.c, this.cur.pal.skyMid, 0.45)));
    ctx.fillStyle = bg; ell(ctx, 0, 0, R, R * 0.94); ctx.fill();
    const blink = Math.sin(t * 0.8 + p.x) > 0.985 ? 0.15 : 1;
    ctx.fillStyle = '#2a2a3a'; ell(ctx, R * 0.18, -R * 0.1, R * 0.11, R * 0.14 * blink); ctx.fill(); ell(ctx, R * 0.62, -R * 0.1, R * 0.1, R * 0.14 * blink); ctx.fill();
    ctx.fillStyle = 'rgba(255,140,150,.5)'; ell(ctx, R * 0.02, R * 0.2, R * 0.16, R * 0.1); ctx.fill(); ell(ctx, R * 0.76, R * 0.2, R * 0.13, R * 0.1); ctx.fill();
    ctx.restore();
    this.grab(p, p.x, p.y - R * 0.6, 26, 'puff');
    this.hit(p.x, p.y - R, 18, () => { p.jump = 1; this.burst(p.x, p.y - R * 2.4, [255, 150, 170], 6, 60, 1, 1.4); this.sound.chime(5, 0.14, 4); });
  }
  private paintSprout(p: Sprout, i: number) {
    const { ctx, t } = this, c = this.seedColor(p.kind), g = outBack((t - p.t0) / 0.8), d = 0.9 + (p.y - 600) / 300 * 0.35, pulse = 0.8 + 0.2 * Math.sin(t * 2.5 + i * 2);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.35); shine(ctx, 0, 0, 80 * d, c, 0.6 * pulse); ctx.restore();
    ctx.fillStyle = css(mix(this.cur.pal.ground, DARK, 0.5)); ell(ctx, p.x, p.y, 15 * d, 5 * d); ctx.fill();
    const h = 30 * d * g;
    ctx.strokeStyle = css(mix(c, WHITE, 0.35)); ctx.lineWidth = 2.6 * d; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + 5 * d, p.y - h * 0.5, p.x, p.y - h); ctx.stroke();
    ctx.fillStyle = css(mix(c, WHITE, 0.25)); ell(ctx, p.x - 8 * d * g, p.y - h * 0.55, 8 * d * g, 3.2 * d * g, 0.55); ctx.fill(); ell(ctx, p.x + 8 * d * g, p.y - h * 0.7, 8 * d * g, 3.2 * d * g, -0.55); ctx.fill();
    drawSeed(ctx, p.kind, p.x, p.y - h - 9 * d + Math.sin(t * 2 + i) * 2, 8.5 * d * g, t, pulse);
    if (p.words) { // the person's words, kept as a small glowing note beside the seed
      const nx = p.x - (this.gest?.x && this.gest.x > p.x ? 18 : -18) * d, ny = p.y - 50 * d + Math.sin(t * 1.2 + i) * 2;
      shine(ctx, nx, ny, 16 * d, [255, 236, 190], 0.6);
      ctx.fillStyle = '#fff6dc'; ctx.save(); ctx.translate(nx, ny); ctx.rotate(-0.15); ctx.fillRect(-6 * d, -4 * d, 12 * d, 8 * d); ctx.strokeStyle = 'rgba(160,120,80,.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-4 * d, -1 * d); ctx.lineTo(4 * d, -1 * d); ctx.moveTo(-4 * d, 1.5 * d); ctx.lineTo(2 * d, 1.5 * d); ctx.stroke(); ctx.restore();
      this.lateHit(nx, ny, 22, () => { this.sound.chime(2); this.hooks.caption(`“${p.words}”`, 'Kept beside your seed.', { hold: 8 }); });
    }
  }
  private paintLantern(x: number, y: number, sc: number, a: number, boost: number) {
    const { ctx } = this;
    shine(ctx, x, y, 52 * sc * (1 + boost), [255, 185, 100], (0.6 + boost) * a);
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, y - 13 * sc, 0, y + 13 * sc); g.addColorStop(0, '#fff3c8'); g.addColorStop(1, '#ff9d4a');
    ctx.fillStyle = g; ell(ctx, x, y, 9.5 * sc, 12.5 * sc); ctx.fill();
    ctx.fillStyle = 'rgba(120,60,30,.8)'; ctx.fillRect(x - 5 * sc, y - 14.5 * sc, 10 * sc, 2.6 * sc); ctx.fillRect(x - 4 * sc, y + 12 * sc, 8 * sc, 2.2 * sc);
    ctx.strokeStyle = 'rgba(160,80,40,.35)'; ctx.lineWidth = 0.8; ell(ctx, x, y, 4.5 * sc, 12.5 * sc); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private paintAir() {
    const { ctx, t } = this, P = this.cur.pal, f = this.cur.f;
    this.layer(1);
    if (this.drag?.type === 'move') { const o = this.drag.o, big = this.drag.name === 'lake' ? 4.2 : this.drag.name === 'tree' ? 2.2 : 1, pu = 4 * Math.sin(t * 6); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 6]); ell(ctx, o.x, o.y, (34 + pu) * big, (11 + pu * 0.3) * big); ctx.stroke(); ctx.setLineDash([]); }
    if (this.guide >= 0) { // one firefly, from the opening words down to the resting stone, then around it
      const at = (u: number): [number, number] => {
        const sx0 = this.wx(this.W * 0.5), sy0 = this.wy(this.H * 0.2), tx = STONE.x, ty = STONE.y - 40;
        if (u < 0.5) { const q = smooth(u / 0.5); return [lerp(sx0, tx + 74, q) + Math.sin(q * 9) * 36 * (1 - q), lerp(sy0, ty, q * q) + Math.cos(q * 7) * 14 * (1 - q)]; }
        const a = ((u - 0.5) / 0.5) * TAU * 2.25; return [tx + Math.cos(a) * 74, ty + 14 + Math.sin(a) * 24];
      };
      const fade = Math.min(1, this.guide * 8, (1 - this.guide) * 6);
      for (let i = 9; i >= 0; i--) { const [gx, gyv] = at(Math.max(0, this.guide - i * 0.008)); shine(ctx, gx, gyv, i ? 9 - i * 0.6 : 26, [255, 244, 170], fade * (i ? 0.5 - i * 0.045 : 1)); }
      const [hx, hyv] = at(this.guide); ctx.fillStyle = css([255, 255, 230], fade); ell(ctx, hx, hyv, 2.6, 2.6); ctx.fill();
    }
    // the thread of light between two planted seeds: this is the mix
    if (this.planted.length === 2) {
      const [a, b] = this.planted, k = clamp((t - Math.max(a.t0, b.t0)) / 1.2) * this.invite(), /* waits until the garden's answer has registered */ ay = a.y - 40, by = b.y - 40, mx = (a.x + b.x) / 2, my = Math.min(ay, by) - 70 - Math.abs(a.x - b.x) * 0.18;
      const ca = this.seedColor(a.kind), cb = this.seedColor(b.kind);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(mix(mix(ca, cb, 0.5), WHITE, 0.4), 0.28 * k); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x, ay); ctx.quadraticCurveTo(mx, my, b.x, by); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 7; i++) { const q = (t * 0.28 + i / 7) % 1, u = 1 - q; shine(ctx, u * u * a.x + 2 * u * q * mx + q * q * b.x, u * u * ay + 2 * u * q * my + q * q * by, 13, mix(ca, cb, q), 0.9 * k * Math.sin(q * Math.PI)); }
    }
    if (f.garlands > 0.05) {
      const g = f.garlands, pts = [[130, 500], [330, 558], [TREE.x - 10, TREE.y - 220], [990, 556], [1430, 544], [1720, 500]];
      for (let s = 0; s < pts.length - 1; s++) {
        const [x0, y0] = pts[s], [x1, y1] = pts[s + 1], mx = (x0 + x1) / 2, my = Math.max(y0, y1) + 46;
        ctx.strokeStyle = `rgba(40,30,60,${0.5 * g})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
        for (let i = 1; i < 9; i++) { const q = i / 9; if (q > g + 0.05) break; const u = 1 - q, bx = u * u * x0 + 2 * u * q * mx + q * q * x1, by = u * u * y0 + 2 * u * q * my + q * q * y1 + 5, c = BULBS[(i + s) % 5]; shine(ctx, bx, by, 24 * (0.8 + 0.2 * Math.sin(t * 3 + i + s * 2)), c, 0.85); ctx.fillStyle = css(mix(c, WHITE, 0.5)); ell(ctx, bx, by, 3.4, 4.4); ctx.fill(); }
      }
    }
    for (const l of this.lanterns) if (l.g > 0.03) {
      const y = l.y + Math.sin(t * 0.8 + l.ph) * 7 + (1 - smooth(l.g)) * 130 - l.boost * 34, x = l.x + Math.sin(t * 0.3 + l.ph) * 10;
      this.paintLantern(x, y, 1, smooth(l.g), l.boost);
      this.hit(x, y, 22, () => { l.boost = 1; this.burst(x, y, [255, 200, 130], 6, 40, 0, 0.8); this.sound.chime(); });
    }
    if (f.memoryLantern > 0.3 && !this.memReleased) {
      const a = smooth(f.memoryLantern), y = MEM.y + Math.sin(t * 0.9) * 8;
      ctx.strokeStyle = `rgba(255,235,190,${0.5 * a * (0.5 + 0.5 * Math.sin(t * 2.4))})`; ctx.lineWidth = 1.5; ell(ctx, MEM.x, y, 34 + 5 * Math.sin(t * 2.4), 34 + 5 * Math.sin(t * 2.4)); ctx.stroke();
      this.paintLantern(MEM.x, y, 1.7, a, 0.25);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; star4(ctx, MEM.x, y, 6, t * 0.4, 0.3); ctx.fill();
      this.hit(MEM.x, y, 40, () => { this.sound.chime(2); void this.askMemory(); });
    }
    if (this.risingMem) { const m = this.risingMem, q = smooth(m.t), ex = this.wx(this.sx(m.tx, 0.2)); this.paintLantern(lerp(m.x, ex, q) + Math.sin(q * 9) * 10 * (1 - q), lerp(m.y, m.ty, q), lerp(1.7, 0.62, q), 1, 0.3 * (1 - q)); }
    for (const fl of this.floaters) if (fl.g > 0.03) {
      const x = fl.x + Math.sin(t * 0.4 + fl.ph) * 16, y = fl.y + Math.sin(t * 0.7 + fl.ph) * 12 + (1 - smooth(fl.g)) * 60, rot = t * 0.4 + fl.ph + (1 - fl.spin) ** 2 * 0 + fl.spin * fl.spin * 14;
      const c = mix(P.light, WHITE, 0.55);
      shine(ctx, x, y, 44 + fl.spin * 30, P.light, (0.45 * fl.g + fl.spin * 0.4) * this.hush);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(rot) * 0.5 + fl.spin * 6); ctx.globalAlpha = smooth(fl.g) * (0.35 + 0.65 * this.hush); ctx.strokeStyle = css(c); ctx.fillStyle = css(c, 0.25); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      switch (fl.kind) {
        case 0: ctx.arc(0, -8, 6, 0, TAU); ctx.moveTo(0, -2); ctx.lineTo(0, 14); ctx.moveTo(0, 9); ctx.lineTo(5, 9); ctx.moveTo(0, 14); ctx.lineTo(6, 14); break; // key
        case 1: ctx.moveTo(0, -12); ctx.lineTo(11, -6); ctx.lineTo(11, 6); ctx.lineTo(0, 12); ctx.lineTo(-11, 6); ctx.lineTo(-11, -6); ctx.closePath(); ctx.moveTo(-11, -6); ctx.lineTo(0, 0); ctx.lineTo(11, -6); ctx.moveTo(0, 0); ctx.lineTo(0, 12); break; // cube
        case 2: ctx.moveTo(0, -14); ctx.lineTo(9, -2); ctx.lineTo(0, 14); ctx.lineTo(-9, -2); ctx.closePath(); ctx.moveTo(-9, -2); ctx.lineTo(9, -2); break; // gem
        case 3: ctx.ellipse(0, 0, 12, 12 * Math.abs(Math.cos(rot)) + 2, 0, 0, TAU); break; // ring
        case 4: ctx.arc(0, 0, 11, 0.6, TAU - 0.9); ctx.quadraticCurveTo(2, 0, 9, 6); break; // moon
        case 5: for (let a = 0; a < 2.6 * TAU; a += 0.35) ctx.lineTo(Math.cos(a) * a * 0.85, Math.sin(a) * a * 0.85); break; // spiral
        default: for (let i = 0; i < 10; i++) { const a = (i * TAU) / 10 - Math.PI / 2, r = i % 2 ? 5 : 12; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
      }
      if (fl.kind !== 5 && fl.kind !== 0) ctx.fill(); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
      this.hit(x, y, 24, () => { fl.spin = 1; this.burst(x, y, P.light, 12, 90, 1, 0.2); this.sound.chime(fl.kind, 0.14, 4); });
    }
    const nb = Math.round(f.butterflies * this.flies.length);
    for (let i = 0; i < nb; i++) {
      const b = this.flies[i], flap = Math.abs(Math.sin(t * 9 + b.ph)), w = 7;
      shine(ctx, b.x, b.y, 22, b.c, 0.3 + 0.35 * f.treeGold);
      ctx.fillStyle = css(mix(b.c, P.light, 0.3), 0.95);
      for (const sgn of [-1, 1]) { ell(ctx, b.x + sgn * w * 0.55 * (0.25 + flap * 0.75), b.y - 2, w * (0.25 + flap * 0.75), w * 0.85, sgn * 0.4); ctx.fill(); ell(ctx, b.x + sgn * w * 0.4 * (0.25 + flap * 0.75), b.y + 4, w * 0.6 * (0.25 + flap * 0.75), w * 0.55, -sgn * 0.3); ctx.fill(); }
      ctx.fillStyle = 'rgba(60,40,60,.8)'; ell(ctx, b.x, b.y, 1, 5); ctx.fill();
      this.hit(b.x, b.y, 18, () => { b.fx += (Math.random() - 0.5) * 240; b.fy -= 120 + Math.random() * 80; this.burst(b.x, b.y, b.c, 6, 50, 1); this.sound.chime(4, 0.1, 4); });
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = this.hush;
    if (f.fireflies > 0.03) { const n = Math.round((this.rm ? 12 : this.fireflies.length) * f.fireflies); for (let i = 0; i < n; i++) { const [x, y, ph, k] = this.fireflies[i]; glow(ctx, x + Math.sin(t * 0.5 * k + ph) * 40, y + Math.sin(t * 0.8 * k + ph * 2) * 22, 11, [225, 255, 150], 0.25 + 0.75 * Math.max(0, Math.sin(t * 1.6 * k + ph))); } }
    if (f.motes > 0.03) { const n = Math.round((this.rm ? 12 : this.motes.length) * f.motes); for (let i = 0; i < n; i++) { const [x, y, ph, k] = this.motes[i]; const yy = 960 - ((960 - y + t * 9 * k) % 700); glow(ctx, x + Math.sin(t * 0.3 + ph) * 26, yy, 6 * k, P.light, 0.5 * Math.sin(((960 - yy) / 700) * Math.PI)); } }
    ctx.globalCompositeOperation = 'source-over';
    if (f.petals > 0.03 && !this.rm) { const n = Math.round(this.petals.length * f.petals); for (let i = 0; i < n; i++) { const [u, v, ph, k] = this.petals[i]; const y = 250 + ((v + t * 0.045 * k) % 1) * 700, x = this.cam.x + ((u + Math.sin(t * 0.4 + ph) * 0.03 + t * 0.012) % 1) * (this.vw + 60) - 30; ctx.fillStyle = css(BLOOM_COLORS[i % 4], 0.8); ell(ctx, x, y, 5, 2.4, t * k + ph); ctx.fill(); } }
    ctx.globalAlpha = 1;
    // particles
    for (const p of this.particles) {
      const a = 1 - p.life / p.max;
      if (p.screen) { this.screen(); shine(ctx, p.x, p.y, p.r * 4, p.c, a); this.layer(1); continue; }
      if (p.shape === 1) { shine(ctx, p.x, p.y, p.r * 4, p.c, a * 0.8); ctx.fillStyle = css(mix(p.c, WHITE, 0.6), a); star4(ctx, p.x, p.y, p.r * 1.5, p.life * 3, 0.35); ctx.fill(); }
      else if (p.shape === 2) { ctx.fillStyle = css(p.c, a); ell(ctx, p.x + Math.sin(p.life * 4 + p.r) * 8, p.y, p.r * 1.6, p.r * 0.8, p.life * 3); ctx.fill(); }
      else shine(ctx, p.x, p.y, p.r * 3.4, p.c, a);
    }
    if (f.mist > 0.03) { ctx.save(); ctx.scale(1, 0.22); const mc = mix(WHITE, P.skyLow, 0.45); for (let i = 0; i < 6; i++) glow(ctx, ((i * 390 + t * (8 + i * 3)) % 2400) - 300, (600 + (i % 3) * 60) / 0.22, 420, mc, 0.34 * f.mist); ctx.restore(); }
  }

  /** the mossy ledge in the foreground: where the seeds rest, and the branch where the charms hang */
  private paintLedge() {
    const { ctx, W, H, t } = this, P = this.cur.pal;
    this.screen();
    const top = this.ledgeTop, moss = mix(mix(P.ground, P.foliage, 0.5), DARK, 0.58);
    const g = ctx.createLinearGradient(0, top - 10, 0, H); g.addColorStop(0, css(mix(moss, P.light, 0.16))); g.addColorStop(0.3, css(moss)); g.addColorStop(1, css(mix(moss, DARK, 0.75)));
    const edge = (x: number) => top + 10 - Math.sin((x / W) * Math.PI) * 14 + Math.sin(x * 0.045) * 2.5;
    ctx.fillStyle = 'rgba(8,10,30,.3)'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, edge(x) - 7); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, edge(x)); ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = css(mix(P.light, moss, 0.45), 0.7); ctx.lineWidth = 1.6; ctx.beginPath();
    for (let x = 4; x < W; x += 9) { const y = edge(x) + 1, s = Math.sin(t * 1.4 + x * 0.3) * 1.5; ctx.moveTo(x, y); ctx.lineTo(x + s - 1.5, y - 5 - (x * 7 % 5)); }
    ctx.stroke();
    // seeds
    const r = this.seedR, never = !this.save.everPlanted;
    this.slots.forEach((sl, i) => {
      ctx.fillStyle = 'rgba(6,8,24,.5)'; ell(ctx, sl.x, sl.y + r * 0.85, r * 1.05, r * 0.36); ctx.fill();
      const name = EMO[sl.kind].name.toLowerCase(), busy = this.seedBusy(sl.kind);
      const inGarden = this.planted.some(p => p.kind === sl.kind);
      text(ctx, name, sl.x, sl.y + r + 17, Math.max(10, Math.min(12.5, r * 0.58)), inGarden ? 0.98 : busy ? 0.4 : 0.82, { spacing: 0.6 });
      if (inGarden) { // chosen: its symbol stays, ringed, with a small sprout to say it is in the garden
        const col = EMO[sl.kind].color, pu = 0.85 + 0.15 * Math.sin(t * 1.6 + i);
        shine(ctx, sl.x, sl.y, r * 2.1, col, 0.32 * pu);
        ctx.strokeStyle = css(mix(col, WHITE, 0.4), 0.9); ctx.lineWidth = 2; ell(ctx, sl.x, sl.y, r * 1.28, r * 1.28); ctx.stroke();
        drawSeed(ctx, sl.kind, sl.x, sl.y, r * 0.8, t + i, 0.55);
        const spx = sl.x + r * 0.95, spy = sl.y - r * 0.95;
        ctx.strokeStyle = '#7fd68f'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(spx, spy + 3); ctx.lineTo(spx, spy - 4); ctx.stroke();
        ctx.fillStyle = '#9fe6a8'; ell(ctx, spx - 3, spy - 4.5, 3.4, 1.7, 0.5); ctx.fill(); ell(ctx, spx + 3, spy - 5.5, 3.4, 1.7, -0.5); ctx.fill();
        return;
      }
      if (busy) { ctx.strokeStyle = css(EMO[sl.kind].color, 0.3); ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]); ell(ctx, sl.x, sl.y, r * 0.8, r * 0.8); ctx.stroke(); ctx.setLineDash([]); return; }
      const bob = Math.sin(t * 1.7 + i * 1.1) * (never ? 3 : 1.6);
      drawSeed(ctx, sl.kind, sl.x, sl.y + bob, r, t + i);
    });
    // before the first planting, a ghost seed shows the gesture
    if (never && !this.drag && !this.rm && this.slots.length) {
      const q = ((t % 5.2) - 2.2) / 1.6;
      if (q > 0 && q < 1) { const sl = this.slots[0], e = smooth(q), tx = W * 0.5, ty = this.sy(720), x = lerp(sl.x, tx, e), y = lerp(sl.y, ty, e) - Math.sin(e * Math.PI) * 70; ctx.globalAlpha = 0.5 * Math.sin(q * Math.PI); drawSeed(ctx, sl.kind, x, y, r * 0.9, t); ctx.globalAlpha = 1; }
    }
    // flights and the carried seed
    for (const fl of this.flights) { const e = smooth(fl.t), tx = fl.world ? this.sx(fl.tx) : fl.tx, ty = fl.world ? this.sy(fl.ty) : fl.ty; const x = lerp(fl.x0, tx, e), y = lerp(fl.y0, ty, fl.arc ? e : e * e) - Math.sin(e * Math.PI) * fl.arc; drawSeed(ctx, fl.kind, x, y, r * 0.9, t); }
    const d = this.drag;
    if (d?.type === 'seed') {
      const y = d.y - (d.touch && d.moved ? 44 : 0), over = y < top;
      if (over && d.moved) { // where it will land
        const wx = this.wx(d.x), wy = this.wy(y), gyv = wy > gy(wx) + 40 ? wy : 680, c = this.seedColor(d.kind);
        const [tx, ty] = this.freeSpot(wx, gyv);
        this.layer(1); ctx.save(); ctx.translate(tx, ty); ctx.scale(1, 0.35); shine(ctx, 0, 0, 90 + 14 * Math.sin(t * 5), c, 0.75); ctx.strokeStyle = css(mix(c, WHITE, 0.5), 0.8); ctx.lineWidth = 2; ell(ctx, 0, 0, 34 + 6 * Math.sin(t * 5), 34 + 6 * Math.sin(t * 5)); ctx.stroke(); ctx.restore();
        if (Math.abs(ty - wy) > 20) { ctx.strokeStyle = css(c, 0.35); ctx.lineWidth = 1.5; ctx.setLineDash([3, 7]); ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); }
        this.screen();
      }
      drawSeed(ctx, d.kind, d.x, y, r * (d.moved ? 1.25 : 1.05), t, 1.6);
    }
    // the branch of charms
    const charms: [string, () => void][] = [['skies', () => this.openSky()], ['keep', () => this.bottleWorld()], ['sound', () => this.toggleSound()]];
    const bx = W - 8, by = 18, wood = mix([70, 50, 44], P.skyTop, 0.35);
    ctx.strokeStyle = css(wood); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + 20, by - 12); ctx.quadraticCurveTo(bx - 80, by + 2, bx - 172, by + 16); ctx.stroke();
    ctx.fillStyle = css(mix(P.foliage, DARK, 0.25));
    for (let i = 0; i < 6; i++) { const lx = bx - 20 - i * 29, ly = by + 2 + i * 2.4; ell(ctx, lx, ly - 7, 9, 4, -0.5 + Math.sin(t + i) * 0.1); ctx.fill(); ell(ctx, lx - 12, ly + 6, 8, 3.6, 0.5 + Math.sin(t * 1.2 + i) * 0.1); ctx.fill(); }
    charms.forEach(([label, fn], i) => {
      const hx = bx - 34 - i * 50, hy0 = by + 6 + i * 4, len = [34, 46, 36][i], a = Math.sin(t * 1.1 + i * 2) * 0.09 * (label === 'sound' && this.sound.audible ? 2.2 : 1);
      const cx = hx + Math.sin(a) * len, cy = hy0 + Math.cos(a) * len;
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy0); ctx.lineTo(cx, cy - 8); ctx.stroke();
      if (label === 'skies') { shine(ctx, cx, cy + 2, 26, [255, 235, 160], 0.6 + 0.2 * Math.sin(t * 2)); ctx.fillStyle = '#fff1b8'; star4(ctx, cx, cy + 2, 10, a * 2, 0.36); ctx.fill(); }
      if (label === 'keep') drawKeepsake(ctx, 'worlddrop', cx, cy + 16, 0.62, t, { sky: [P.skyTop, P.skyMid, P.skyLow].map(c => css(c)) });
      if (label === 'sound') {
        const on = this.sound.audible; if (on) shine(ctx, cx, cy + 6, 26, [170, 240, 230], 0.6);
        ctx.fillStyle = css(mix([150, 130, 110], P.skyTop, 0.2)); ctx.fillRect(cx - 9, cy - 9, 18, 3);
        for (let j = 0; j < 3; j++) { ctx.save(); ctx.translate(cx + (j - 1) * 6, cy - 6); ctx.rotate(Math.sin(t * (on ? 3 : 1) + j * 1.4) * (on ? 0.2 : 0.05)); ctx.fillStyle = on ? ['#a8e6df', '#e0fbf6', '#8fd0d8'][j] : 'rgba(210,215,230,.55)'; ctx.fillRect(-1.5, 2, 3, 11 + j * 3); ctx.restore(); }
      }
      text(ctx, label, cx, cy + 30, 10, 0.72 * (0.35 + 0.65 * this.invite()), { spacing: 1.2 });
      this.hits.push({ x: cx, y: cy + 8, r: 26, fn });
    });
  }
}

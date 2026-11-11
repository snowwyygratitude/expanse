/**
 * The garden's answer to a planted feeling.
 *
 * When a seed lands, one nearby thing responds to it: embers settle into
 * stones, a lantern comes on, a flower opens and a bud leans toward it. For a
 * pair of feelings, both take part in the same small event (a raindrop lands
 * on an open flower and catches the sun). Only after that response has had a
 * moment to register are the scene name and one short sentence revealed.
 *
 * Everything is drawn in world coordinates beside the seed, in the garden's
 * existing style (soft glows, rounded petals, the same acorn lantern and
 * meadow creature), larger than ordinary scenery so it reads on a phone.
 */
import { RGB, TAU, clamp, css, hex, lerp, mix, outBack, smooth, WHITE } from '../util';
import { ell, shine, star4 } from './art';

type Ctx = CanvasRenderingContext2D;
export type Obj = 'flower' | 'blossom' | 'blueFlower' | 'pool' | 'stones' | 'lantern' | 'mushroom' | 'sprout' | 'bud';
export type Actor = 'embers' | 'raindrop' | 'leaf' | 'butterfly' | 'spark' | 'creature';
export type Cue = 'ember' | 'settle' | 'lantern' | 'bloom' | 'bud' | 'hop' | 'drop' | 'leaf' | 'flutter' | 'spark' | 'sprout' | 'ripple' | 'reveal';
export interface Spec {
  objs: Obj[];
  actors: Actor[];          // played in order; each lands on objs[onto]
  onto?: number;
  glint?: boolean;          // the sun catches whatever the actor leaves behind
  focus?: 'lake';           // the event happens at the pond, not beside the seed
  sub: string;              // the one sentence revealed under the scene name
  /** from the review (exact copy) or drafted here to the same pattern */
  source: 'review' | 'draft';
}

/* Keys follow the garden's internal names: curiosity is Wonder, courage is Anger, gratitude is Love. */
export const SPECS: Record<string, Spec> = {
  // the three priority scenes, exactly as reviewed
  courage: { objs: ['stones'], actors: ['embers'], sub: 'The stones can hold this heat for a while.', source: 'review' },
  fear: { objs: ['lantern'], actors: [], sub: 'There’s a little light right here beside you.', source: 'review' },
  'joy+hope': { objs: ['flower', 'bud'], actors: ['creature'], sub: 'An open flower and a new bud share the sun.', source: 'review' },
  'joy+sadness': { objs: ['flower'], actors: ['raindrop'], glint: true, sub: 'One petal holds a raindrop and a little sun.', source: 'review' },
  // the other single feelings
  joy: { objs: ['flower'], actors: ['creature'], glint: true, sub: 'A flower opened all the way, and someone came to see.', source: 'draft' },
  calm: { objs: ['pool'], actors: ['leaf'], sub: 'A leaf came down, and the water stayed still.', source: 'draft' },
  sadness: { objs: ['blueFlower'], actors: ['raindrop'], sub: 'The rain is gentle here. A blue flower opened in it.', source: 'draft' },
  gratitude: { objs: ['blossom'], actors: ['butterfly'], sub: 'A butterfly came to rest on a warm blossom.', source: 'draft' },
  curiosity: { objs: ['mushroom'], actors: ['spark'], sub: 'A small light is circling, just to be looked at.', source: 'draft' },
  hope: { objs: ['sprout'], actors: [], sub: 'A new shoot is turning toward the light.', source: 'draft' },
  // pairs: both feelings take part in one event
  'joy+calm': { objs: ['pool', 'flower'], actors: ['creature'], sub: 'A small friend sits by the still water, warm in the sun.', source: 'draft' },
  'joy+curiosity': { objs: ['flower'], actors: ['spark'], sub: 'A spark found the open flower and settled in.', source: 'draft' },
  'joy+courage': { objs: ['flower'], actors: ['embers'], sub: 'An ember landed in a flower and became warm light.', source: 'draft' },
  'joy+gratitude': { objs: ['flower'], actors: ['butterfly'], sub: 'A butterfly found the flower that opened for you.', source: 'draft' },
  'joy+fear': { objs: ['lantern'], actors: ['creature'], sub: 'A small friend came to sit by the little light.', source: 'draft' },
  'calm+sadness': { objs: ['pool'], actors: ['raindrop'], sub: 'One drop falls, and the water takes it gently.', source: 'draft' },
  'calm+curiosity': { objs: [], actors: ['spark'], focus: 'lake', sub: 'A spark sank into the still water, and the doorway lit.', source: 'draft' },
  'calm+courage': { objs: ['pool', 'stones'], actors: ['embers'], onto: 1, sub: 'The warm stones glow quietly in the still water.', source: 'draft' },
  'calm+gratitude': { objs: ['pool'], actors: ['butterfly'], sub: 'A butterfly rests at the edge of the still water.', source: 'draft' },
  'calm+hope': { objs: ['pool', 'sprout'], actors: [], sub: 'A new shoot leans over the still water.', source: 'draft' },
  'calm+fear': { objs: ['pool', 'lantern'], actors: [], sub: 'The little light shows again in the still water.', source: 'draft' },
  'sadness+curiosity': { objs: ['mushroom'], actors: ['raindrop'], sub: 'A raindrop made the little mushroom glow brighter.', source: 'draft' },
  'sadness+courage': { objs: ['stones'], actors: ['embers', 'raindrop'], sub: 'The rain falls on the warm stones, and they keep glowing.', source: 'draft' },
  'sadness+gratitude': { objs: ['blueFlower'], actors: ['butterfly'], sub: 'A butterfly found shelter under a blue flower.', source: 'draft' },
  'sadness+hope': { objs: ['sprout'], actors: ['raindrop'], sub: 'A drop of rain, and the new shoot lifts a little.', source: 'draft' },
  'sadness+fear': { objs: ['lantern', 'blueFlower'], actors: ['raindrop'], sub: 'The little light stays lit through the rain.', source: 'draft' },
  'curiosity+courage': { objs: ['stones'], actors: ['embers', 'spark'], sub: 'One ember rose and became a floating light.', source: 'draft' },
  'curiosity+gratitude': { objs: ['mushroom'], actors: ['spark', 'butterfly'], sub: 'A butterfly and a spark came to the same mushroom.', source: 'draft' },
  'curiosity+hope': { objs: ['sprout'], actors: ['spark'], sub: 'A spark settled on the new shoot like a small star.', source: 'draft' },
  'curiosity+fear': { objs: ['lantern'], actors: ['spark'], sub: 'A curious spark lit the lantern beside you.', source: 'draft' },
  'courage+gratitude': { objs: ['stones'], actors: ['embers', 'butterfly'], sub: 'A butterfly came to rest on the warm stones.', source: 'draft' },
  'courage+hope': { objs: ['stones', 'sprout'], actors: ['embers'], sub: 'The warm stones keep the new shoot company.', source: 'draft' },
  'courage+fear': { objs: ['stones', 'lantern'], actors: ['embers'], sub: 'Two small warm lights, holding steady in the mist.', source: 'draft' },
  'gratitude+hope': { objs: ['bud'], actors: ['butterfly'], sub: 'A butterfly landed, and the new bud opened a little.', source: 'draft' },
  'gratitude+fear': { objs: ['lantern'], actors: ['butterfly'], sub: 'A butterfly came to rest on the little light.', source: 'draft' },
  'hope+fear': { objs: ['lantern', 'sprout'], actors: [], sub: 'A new shoot is turning toward the little light.', source: 'draft' },
};

const ARRIVE = [1.7, 2.9];        // when each actor lands (seconds after planting)
const SELF = 1.2;                 // when an object with no visitor makes its own move
const FLOWER: RGB = hex('#ffb3c8'), FLOWER_IN: RGB = hex('#ffe58a'), BLUE: RGB = hex('#8fd8ff'), PINK: RGB = hex('#ff9fbf');
const EMBER: RGB = [255, 150, 70], LAMP: RGB = [255, 196, 110];

interface Place { obj: Obj; x: number; y: number; hitAt: number; hits: number }

export class Gesture {
  age = 0;
  revealed = false;
  readonly revealAt: number;
  readonly places: Place[] = [];
  /** where a finger can take hold of the answer, refreshed every frame: [x, y, radius] in world units */
  readonly handles: [number, number, number][] = [];
  private cued = new Set<string>();
  private dir: number;
  /** where the creature hops in from, and where the actors start */
  constructor(public key: string, public spec: Spec, public x: number, public y: number, side: number,
              private seed: { x: number; y: number }, private lake: { x: number; y: number; ry: number },
              private cue: (c: Cue, pan?: number) => void, private rm: boolean, steady = false) {
    this.dir = side;
    const k = 2.1; // drawn larger than scenery so it reads on a phone
    spec.objs.forEach((obj, i) => { // two things are arranged in depth so neither sits on a seed
      let nx = x, ny = obj === 'pool' ? y + 10 : y;
      if (spec.objs.length === 2) {
        if (spec.objs[0] === 'pool') { if (i === 1) { nx = x + side * 9 * k; ny = y - 6; } else ny = y + 12; }
        else if (i === 0) { nx = x - side * 8; ny = y - 6; } else { nx = x + side * 24; ny = y + 12; }
      }
      this.places.push({ obj, x: nx, y: ny, hitAt: 99, hits: 0 });
    });
    const last = spec.actors.length ? ARRIVE[spec.actors.length - 1] + (spec.actors.includes('embers') ? 0.5 : 0) : SELF + 0.4;
    this.revealAt = this.rm ? 0.6 : (key === 'joy+hope' ? 3.0 : last + 0.7);
    if (steady) { this.age = 60; this.revealed = true; this.places.forEach(p => { p.hitAt = 0; p.hits = 3; }); }
  }
  get target(): Place | undefined { return this.places[this.spec.onto ?? 0]; }
  /** the point the eye should rest on */
  get focus() { return this.spec.focus === 'lake' ? { x: this.lake.x, y: this.lake.y + 4 } : { x: this.x, y: this.y }; }

  update(dt: number) {
    this.age += dt;
    const a = this.age, once = (k: string, at: number, fn: () => void) => { if (a >= at && !this.cued.has(k)) { this.cued.add(k); fn(); } };
    this.spec.actors.forEach((act, i) => {
      const at = ARRIVE[i];
      if (act === 'embers') for (let e = 0; e < 3; e++) once(`ember${e}`, at - 0.35 + e * 0.25, () => { const t = this.target; if (t) { t.hits++; t.hitAt = Math.min(t.hitAt, a); } this.cue('ember'); });
      else once(`a${i}`, at, () => { const t = this.target; if (t) { t.hits++; t.hitAt = Math.min(t.hitAt, a); } this.cue(act === 'raindrop' ? 'drop' : act === 'leaf' ? 'leaf' : act === 'butterfly' ? 'flutter' : act === 'spark' ? 'spark' : 'hop'); });
      if (act === 'creature') { once('hop1', at - 0.9, () => this.cue('hop')); once('hop2', at - 0.45, () => this.cue('hop')); }
    });
    if (this.spec.actors.includes('embers')) once('settle', ARRIVE[this.spec.actors.indexOf('embers')] + 0.5, () => this.cue('settle'));
    for (const p of this.places) {
      if (p.obj === 'lantern') once('lamp', this.lanternAt(), () => this.cue('lantern'));
      if (p.obj === 'flower' || p.obj === 'blossom') once('bloom', 0.55, () => this.cue('bloom'));
      if (p.obj === 'sprout' || p.obj === 'bud') once('sprout', 1.3, () => this.cue(p.obj === 'bud' ? 'bud' : 'sprout'));
      if (p.obj === 'pool') once('ripple', 0.4, () => this.cue('ripple'));
    }
  }
  /** a lantern is switched on by a spark that comes to it; otherwise it comes on by itself */
  private lanternAt() { const i = this.spec.actors.indexOf('spark'); return i >= 0 && this.places[this.spec.onto ?? 0]?.obj === 'lantern' ? ARRIVE[i] : SELF; }

  /* ---------------- drawing ---------------- */
  paint(ctx: Ctx, t: number, light: RGB, dim: number) {
    const a = this.age;
    this.handles.length = 0;
    for (const p of this.places) {
      this.drawObj(ctx, p, a, t, light);
      const h = (p as any).head as number[] | undefined, big = p.obj === 'pool' || p.obj === 'stones';
      this.handles.push([p.x, p.y - (big ? 0 : 14), big ? 44 : 30]);
      if (h) this.handles.push([h[0], h[1], 32]);
      if (p.obj === 'pool') for (const side of [-1, 1]) this.handles.push([p.x + side * 44, p.y, 30]); // a pool is wide: either end will do
    }
    if (this.spec.focus === 'lake') this.drawLakeEvent(ctx, a, t);
    this.spec.actors.forEach((act, i) => this.drawActor(ctx, act, i, a, t, light, dim));
  }

  private grow(a: number, from = 0.15, dur = 0.6) { return this.rm ? 1 : outBack(clamp((a - from) / dur)); }

  private drawObj(ctx: Ctx, p: Place, a: number, t: number, light: RGB) {
    const g = this.grow(a), k = 2.1 * (0.9 + (p.y - 600) / 300 * 0.3), { x, y } = p;
    if (g <= 0.01) return;
    ctx.save();
    switch (p.obj) {
      case 'flower': case 'blossom': case 'blueFlower': {
        const blue = p.obj === 'blueFlower', pink = p.obj === 'blossom';
        const opensAt = blue && this.spec.actors[0] === 'raindrop' ? ARRIVE[0] - 0.2 : 0.5;
        const open = this.rm ? 1 : smooth((a - opensAt) / 0.9), c = blue ? BLUE : pink ? PINK : FLOWER;
        const lean = Math.sin(t * 1.1 + x) * 0.05, h = 26 * k * g, hx = x + Math.sin(lean) * h, hy = y - h;
        ctx.strokeStyle = '#4f9a6a'; ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4 * k, y - h * 0.5, hx, hy); ctx.stroke();
        ctx.fillStyle = '#6fbf7f'; ell(ctx, x - 6 * k, y - h * 0.38, 7 * k, 2.8 * k, 0.6); ctx.fill();
        const warm = p.hits && this.spec.actors[0] === 'embers' ? smooth((a - p.hitAt) / 0.8) : 0;
        const fc = mix(c, EMBER, warm * 0.55);
        shine(ctx, hx, hy, (16 + 14 * open) * k, mix(fc, WHITE, 0.2), 0.35 + 0.35 * open + 0.3 * warm);
        const r = 8.5 * k;
        for (let i = 0; i < 6; i++) { // petals unfold from a closed bud
          const ang = (i * TAU) / 6 - Math.PI / 2 + lean, spread = 0.25 + 0.75 * open, len = r * (0.55 + 0.45 * open);
          ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang * spread - Math.PI / 2 * (1 - spread));
          ctx.fillStyle = css(mix(fc, WHITE, i % 2 ? 0.1 : 0.28));
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.55, -len * 0.45, len, 0); ctx.quadraticCurveTo(len * 0.55, len * 0.45, 0, 0); ctx.fill(); ctx.restore();
        }
        ctx.fillStyle = css(blue ? [240, 250, 255] : FLOWER_IN); ell(ctx, hx, hy, 3.2 * k * (0.5 + 0.5 * open), 3.2 * k * (0.5 + 0.5 * open)); ctx.fill();
        if (warm) shine(ctx, hx, hy, 9 * k, EMBER, 0.6 * warm * (0.85 + 0.15 * Math.sin(t * 2.4)));
        // a raindrop resting on a petal, catching the light
        if (p.hits && this.spec.actors.includes('raindrop') && a >= p.hitAt) {
          const bx = hx + r * 0.62, by = hy - r * 0.15, q = smooth((a - p.hitAt) / 0.3);
          ctx.fillStyle = css([200, 235, 255], 0.85 * q); ell(ctx, bx, by, 2.6 * k * q, 2.9 * k * q); ctx.fill();
          ctx.fillStyle = css(WHITE, q); ell(ctx, bx - 0.8 * k, by - 1 * k, 0.8 * k, 0.8 * k); ctx.fill();
          if (this.spec.glint) { const tw = 0.6 + 0.4 * Math.sin(t * 2.2); shine(ctx, bx, by, 14 * k * tw, [255, 236, 170], 0.75 * q); ctx.fillStyle = css([255, 250, 220], q * tw); star4(ctx, bx, by, 5 * k * tw, t * 0.4, 0.22); ctx.fill(); }
        }
        if (this.spec.glint && !this.spec.actors.includes('raindrop') && open > 0.9) { const tw = Math.max(0, Math.sin(t * 1.3 + 1)) ** 3; ctx.fillStyle = css([255, 250, 220], tw); star4(ctx, hx - r * 0.5, hy - r * 0.7, 4 * k, t * 0.3, 0.22); ctx.fill(); }
        (p as any).head = [hx, hy];
        break;
      }
      case 'bud': { // a neighbouring bud lifts and leans toward the open flower
        const lift = this.rm ? 1 : smooth((a - 1.3) / 1.0), other = this.places.find(q => q !== p && (q.obj === 'flower' || q.obj === 'blossom'));
        const toward = other ? Math.sign(other.x - x) : -this.dir, lean = toward * (0.08 + 0.32 * lift), h = (14 + 12 * lift) * k * g;
        const hx = x + Math.sin(lean) * h, hy = y - Math.cos(lean) * h;
        const opens = p.hits && this.spec.actors.includes('butterfly') ? smooth((a - p.hitAt) / 1.2) * 0.45 : 0;
        ctx.strokeStyle = '#5aa86e'; ctx.lineWidth = 2.2 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - h * 0.6, hx, hy); ctx.stroke();
        ctx.fillStyle = '#7ccf8a'; ell(ctx, x + 5 * k, y - h * 0.35, 6 * k, 2.4 * k, -0.6); ctx.fill();
        shine(ctx, hx, hy, 12 * k, [255, 210, 220], 0.35 + 0.3 * lift);
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(lean);
        ctx.fillStyle = '#ffc7d6'; ctx.beginPath(); ctx.moveTo(0, 3 * k); ctx.bezierCurveTo(-(4 + 4 * opens) * k, -1 * k, -(2 + 3 * opens) * k, -7 * k, 0, -9 * k); ctx.bezierCurveTo((2 + 3 * opens) * k, -7 * k, (4 + 4 * opens) * k, -1 * k, 0, 3 * k); ctx.fill();
        ctx.fillStyle = '#6fbf7f'; ctx.beginPath(); ctx.moveTo(-3.6 * k, 1.5 * k); ctx.quadraticCurveTo(0, -1.5 * k, 3.6 * k, 1.5 * k); ctx.quadraticCurveTo(0, 4 * k, -3.6 * k, 1.5 * k); ctx.fill();
        ctx.restore();
        (p as any).head = [hx, hy - 6 * k];
        break;
      }
      case 'sprout': { // a new shoot unfurls and turns toward the light (or a neighbour)
        const up = this.rm ? 1 : smooth((a - 0.4) / 1.2), other = this.places.find(q => q !== p);
        const lift = p.hits ? smooth((a - p.hitAt) / 0.8) : 0;
        const toward = other ? Math.sign(other.x - x) : 1, lean = toward * (0.1 + 0.25 * up) - lift * toward * 0.08, h = (10 + 20 * up + 5 * lift) * k * g;
        const hx = x + Math.sin(lean) * h, hy = y - Math.cos(lean) * h;
        shine(ctx, hx, hy, 18 * k, [200, 255, 190], 0.25 + 0.3 * up);
        ctx.strokeStyle = '#5fbc86'; ctx.lineWidth = 2.6 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - toward * 2 * k, y - h * 0.6, hx, hy); ctx.stroke();
        ctx.fillStyle = '#8ee0a2';
        const leaf = (s: number, f: number) => { ctx.save(); ctx.translate(lerp(x, hx, f), lerp(y, hy, f)); ctx.rotate(s * (0.9 - 0.5 * up) + lean); ell(ctx, s * 6 * k * up, 0, 7 * k * up, 2.8 * k * up); ctx.fill(); ctx.restore(); };
        leaf(-1, 0.85); leaf(1, 0.7);
        (p as any).head = [hx, hy];
        break;
      }
      case 'pool': { // a small still pool that reflects the sky
        const rx = 34 * k * g, ry = 9 * k * g;
        ctx.fillStyle = 'rgba(20,40,60,.25)'; ell(ctx, x, y + 2, rx + 4, ry + 2.5); ctx.fill();
        const pg = ctx.createLinearGradient(0, y - ry, 0, y + ry); pg.addColorStop(0, css(mix(light, WHITE, 0.4), 0.85)); pg.addColorStop(1, css(mix([90, 150, 200], light, 0.25), 0.9));
        ctx.fillStyle = pg; ell(ctx, x, y, rx, ry); ctx.fill();
        ctx.save(); ell(ctx, x, y, rx, ry); ctx.clip();
        for (const q of this.places) if (q !== p && (q.obj === 'lantern' || q.obj === 'stones')) { // the neighbour's light, shown again in the water
          const on = q.obj === 'lantern' ? (a >= this.lanternAt() ? smooth((a - this.lanternAt()) / 0.6) : 0) : clamp(q.hits / 3) * (q.hits ? smooth((a - q.hitAt) / 0.8) : 0);
          ctx.save(); ctx.translate(q.x, y + 2); ctx.scale(1, 0.4); shine(ctx, 0, 0, 22 * k, q.obj === 'lantern' ? LAMP : EMBER, 0.75 * on); ctx.restore();
        }
        if (p.hits) for (let i = 0; i < 2; i++) { const q = (a - p.hitAt - i * 0.6) / 2.4; if (q > 0 && q < 1) { ctx.strokeStyle = css(WHITE, 0.55 * (1 - q)); ctx.lineWidth = 1.4; ell(ctx, x + this.dir * 4, y, rx * 0.8 * q + 2, ry * 0.8 * q + 0.6); ctx.stroke(); } }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        (p as any).head = [x + this.dir * 4, y];
        break;
      }
      case 'stones': { // three river stones that take in the embers and hold their glow
        const heat = clamp(p.hits / 3) * (p.hits ? smooth((a - p.hitAt) / 1.4) : 0), steady = 0.88 + 0.12 * Math.sin(t * 1.1);
        const st: [number, number, number, number][] = [[-11, 0, 11, 6.5], [9, 1, 9, 5.5], [-1, -6, 7, 4.5]];
        ctx.save(); ctx.translate(x, y + 2); ctx.scale(1, 0.4); shine(ctx, 0, 0, 38 * k, EMBER, 0.8 * heat * steady); ctx.restore();
        shine(ctx, x, y - 6 * k, 26 * k, [255, 170, 90], 0.45 * heat * steady);
        for (const [sx, sy, rx, ry] of st) {
          const cx = x + sx * k * 0.9, cy = y + sy * k * 0.9 - 3 * k, R = rx * k * 0.9 * g, Ry = ry * k * 0.9 * g;
          const sg = ctx.createLinearGradient(0, cy - Ry, 0, cy + Ry);
          sg.addColorStop(0, css(mix([150, 140, 165], [255, 170, 110], heat * 0.55))); sg.addColorStop(1, css(mix([70, 62, 90], [150, 60, 40], heat * 0.5)));
          ctx.fillStyle = sg; ell(ctx, cx, cy, R, Ry); ctx.fill();
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(EMBER, 0.55 * heat * steady); ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.98, Ry * 0.96, 0, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); ctx.restore();
        }
        if (heat > 0) for (let i = 0; i < 3; i++) shine(ctx, x + (i - 1) * 7 * k, y - 4 * k, 6 * k, [255, 200, 120], heat * (0.55 + 0.25 * Math.sin(t * 1.4 + i * 2)));
        (p as any).head = [x, y - 8 * k];
        break;
      }
      case 'lantern': { // the acorn lantern from the hidden world, coming on beside you
        const on = this.rm ? 1 : smooth((a - this.lanternAt()) / 0.7), fl = 1 + 0.04 * Math.sin(t * 5.3) * on;
        const h = 38 * k * g;
        ctx.strokeStyle = '#7a5a40'; ctx.lineWidth = 2 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - 3 * k, y - h * 0.5, x, y - h, x + 9 * k, y - h); ctx.stroke();
        const lx = x + 9 * k + Math.sin(t * 1.2) * 0.8, ly = y - h + 5 * k;
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 9 * k, y - h); ctx.lineTo(lx, ly); ctx.stroke();
        if (on > 0) { shine(ctx, lx, ly + 7 * k, 40 * k * fl, LAMP, 0.75 * on); ctx.save(); ctx.translate(x, y + 2); ctx.scale(1, 0.35); shine(ctx, 0, 0, 30 * k, LAMP, 0.35 * on); ctx.restore(); }
        const body = ctx.createLinearGradient(0, ly + 2 * k, 0, ly + 13 * k);
        body.addColorStop(0, css(mix([120, 105, 110], [255, 240, 184], on))); body.addColorStop(1, css(mix([90, 75, 85], [255, 162, 74], on)));
        ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(lx - 5 * k, ly + 3 * k); ctx.bezierCurveTo(lx - 5.5 * k, ly + 9 * k, lx - 1.5 * k, ly + 12 * k, lx, ly + 14 * k); ctx.bezierCurveTo(lx + 1.5 * k, ly + 12 * k, lx + 5.5 * k, ly + 9 * k, lx + 5 * k, ly + 3 * k); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(lx, ly + 3 * k, 6 * k, 3.6 * k, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(lx - 0.8 * k, ly - 1.5 * k, 1.6 * k, 2 * k);
        if (on > 0.2) { ctx.fillStyle = css([255, 252, 230], on); ell(ctx, lx, ly + 8 * k, 1.6 * k, 2.4 * k); ctx.fill(); }
        (p as any).head = [lx, ly - 2 * k];
        break;
      }
      case 'mushroom': {
        const brighter = p.hits ? smooth((a - p.hitAt) / 0.6) : 0, pulse = 0.85 + 0.15 * Math.sin(t * 2);
        const c: RGB = [120, 240, 225], s = 9 * k * g;
        shine(ctx, x, y - s * 1.2, s * (3 + 1.5 * brighter), c, (0.45 + 0.45 * brighter) * pulse);
        ctx.fillStyle = '#f3ead8'; ctx.fillRect(x - s * 0.22, y - s * 1.15, s * 0.44, s * 1.15);
        ctx.fillStyle = css(mix(c, WHITE, 0.15 + 0.3 * brighter)); ctx.beginPath(); ctx.ellipse(x, y - s * 1.1, s * 1.1, s * 0.85, 0, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(ctx, x - s * 0.45, y - s * 1.45, s * 0.16, s * 0.11); ctx.fill(); ell(ctx, x + s * 0.32, y - s * 1.35, s * 0.2, s * 0.13); ctx.fill();
        (p as any).head = [x, y - s * 1.5];
        break;
      }
    }
    ctx.restore();
  }

  /** where an actor is, 0..1 along its way to the target, and what it is doing */
  private drawActor(ctx: Ctx, act: Actor, i: number, a: number, t: number, light: RGB, dim: number) {
    const tg = this.target, head: [number, number] = (tg as any)?.head ?? [this.x, this.y - 20];
    const arrive = ARRIVE[i], k = 2.1 * (0.9 + (this.y - 600) / 300 * 0.3);
    const lakeDoor = this.spec.focus === 'lake' ? [this.lake.x, this.lake.y + 4] as [number, number] : null;
    const goal = lakeDoor ?? head;
    switch (act) {
      case 'embers': {
        for (let e = 0; e < 3; e++) {
          const land = arrive - 0.35 + e * 0.25, start = land - 1.4, q = this.rm ? 1 : clamp((a - start) / 1.4);
          if (q <= 0 || q >= 1) continue;
          const sx = goal[0] + (e - 1) * 40 + this.dir * 30, sy = goal[1] - 230;
          const ex = lerp(sx, goal[0] + (e - 1) * 6 * k, smooth(q)) + Math.sin(q * 9 + e) * 8 * (1 - q), ey = lerp(sy, goal[1] + 2, q * q);
          for (let j = 4; j >= 0; j--) shine(ctx, ex - j * 1.5 * this.dir, ey - j * 5, (j ? 5 - j * 0.6 : 11) * k * 0.6, EMBER, (j ? 0.35 - j * 0.06 : 1));
          ctx.fillStyle = '#fff1c8'; ell(ctx, ex, ey, 1.6 * k, 1.6 * k); ctx.fill();
        }
        break;
      }
      case 'raindrop': {
        const start = arrive - 0.6, q = this.rm ? 1 : clamp((a - start) / 0.6);
        if (q > 0 && q < 1) {
          const dx = goal[0] + 6 * k, dy = lerp(goal[1] - 200, goal[1] - 2, q * q);
          ctx.fillStyle = 'rgba(205,232,255,.95)'; ctx.beginPath(); ctx.moveTo(dx, dy - 6 * k); ctx.quadraticCurveTo(dx + 3 * k, dy, dx, dy + 2.5 * k); ctx.quadraticCurveTo(dx - 3 * k, dy, dx, dy - 6 * k); ctx.fill();
          ctx.strokeStyle = 'rgba(205,232,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, dy - 6 * k); ctx.lineTo(dx, dy - 26 * k); ctx.stroke();
        }
        const sp = (a - arrive) / 0.5; // splash
        if (sp > 0 && sp < 1 && !this.rm) for (let s = -1; s <= 1; s += 2) { ctx.fillStyle = `rgba(215,238,255,${0.8 * (1 - sp)})`; ell(ctx, goal[0] + 6 * k + s * 7 * k * sp, goal[1] - 2 - 6 * k * Math.sin(sp * Math.PI), 1.3 * k, 1.3 * k); ctx.fill(); }
        break;
      }
      case 'leaf': {
        const start = arrive - 1.6, q = this.rm ? 1 : clamp((a - start) / 1.6);
        if (q <= 0) break;
        const lx = q < 1 ? lerp(goal[0] - this.dir * 50, goal[0], q) + Math.sin(q * 7) * 14 * (1 - q) : goal[0] + Math.sin(t * 0.6) * 1.5, ly = q < 1 ? lerp(goal[1] - 190, goal[1] - 1, q) : goal[1] - 1 + Math.sin(t * 0.9) * 0.6;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(q < 1 ? Math.sin(q * 7) * 0.9 : 0.25); ctx.scale(1, q < 1 ? 1 : 0.55);
        ctx.fillStyle = '#e0a84f'; ctx.beginPath(); ctx.moveTo(-8 * k, 0); ctx.quadraticCurveTo(0, -5 * k, 8 * k, 0); ctx.quadraticCurveTo(0, 5 * k, -8 * k, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(120,70,30,.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-7 * k, 0); ctx.lineTo(7 * k, 0); ctx.stroke(); ctx.restore();
        break;
      }
      case 'butterfly': {
        const start = arrive - 1.5, q = this.rm ? 1 : clamp((a - start) / 1.5);
        if (q <= 0) break;
        const sx = goal[0] + this.dir * 170, sy = goal[1] - 120, perch = [goal[0] + 1, goal[1] - 3 * k];
        const bx = q < 1 ? lerp(sx, perch[0], smooth(q)) + Math.sin(q * 11) * 10 * (1 - q) : perch[0], by = q < 1 ? lerp(sy, perch[1], smooth(q)) - Math.sin(q * Math.PI) * 30 : perch[1];
        const flap = q < 1 ? Math.abs(Math.sin(t * 16)) : 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9)) ** 2, w = 7.5 * k, c: RGB = this.spec.actors.length > 1 || this.spec.objs[0] === 'blueFlower' ? [255, 200, 225] : [255, 214, 120];
        shine(ctx, bx, by, 16 * k, c, 0.4);
        ctx.fillStyle = css(mix(c, light, 0.15));
        for (const sg of [-1, 1]) { ell(ctx, bx + sg * w * 0.55 * (0.2 + flap * 0.8), by - 2 * k, w * (0.2 + flap * 0.8), w * 0.85, sg * 0.35); ctx.fill(); ell(ctx, bx + sg * w * 0.4 * (0.2 + flap * 0.8), by + 3.5 * k, w * 0.6 * (0.2 + flap * 0.8), w * 0.55, -sg * 0.3); ctx.fill(); }
        ctx.fillStyle = 'rgba(60,40,60,.85)'; ell(ctx, bx, by, 1.1 * k, 4.5 * k); ctx.fill();
        break;
      }
      case 'spark': {
        const start = arrive - (lakeDoor ? 1.9 : 1.6), q = this.rm ? 1 : clamp((a - start) / (lakeDoor ? 1.9 : 1.6));
        if (q <= 0) break;
        let px: number, py: number;
        if (lakeDoor) { // from the seed, across to the pond, and down into the water
          const s0 = [this.seed.x, this.seed.y - 40]; px = lerp(s0[0], goal[0], smooth(q)); py = lerp(s0[1], goal[1], smooth(q)) - Math.sin(q * Math.PI) * 70;
        } else if (this.spec.actors[0] === 'embers') { // one ember rises out of the warm stones and floats
          px = goal[0] + Math.sin(q * 5) * 10 * q + Math.sin(t * 0.8) * 3 * q; py = goal[1] - 4 - smooth(q) * 46 * k + Math.sin(t * 1.3) * 3 * q;
        } else if (q < 1) { const ang = q * TAU * 1.5 + 1, r = 26 * k * (1 - q * 0.8); px = goal[0] + Math.cos(ang) * r; py = goal[1] - 10 * k * (1 - q) + Math.sin(ang) * r * 0.5; }
        else { px = goal[0]; py = goal[1] - 2 * k; }
        if (lakeDoor && q >= 1) break;
        const settled = q >= 1, tw = settled ? 0.75 + 0.25 * Math.sin(t * 2.4) : 1;
        shine(ctx, px, py, (settled ? 12 : 16) * k * tw, [255, 246, 200], 0.9 * dim);
        ctx.fillStyle = css([255, 252, 232], tw); star4(ctx, px, py, (settled ? 3.6 : 4.6) * k * tw, t * 0.8, 0.3); ctx.fill();
        break;
      }
      case 'creature': { // a little meadow creature hops over and sits close
        const start = arrive - 1.4, q = this.rm ? 1 : clamp((a - start) / 1.4);
        if (q <= 0) break;
        const tx = this.x - this.dir * 9 * k, ty = this.y + 20, sx = tx - this.dir * -1 * 120, hopQ = q < 1 ? (q * 3) % 1 : 0;
        const px = lerp(sx, tx, smooth(Math.floor(q * 3) / 3 + smooth(hopQ) / 3)), up = q < 1 ? Math.sin(hopQ * Math.PI) * 14 : 0;
        const R = 9 * k, sq = 1 + (q < 1 ? Math.sin(hopQ * Math.PI) * 0.1 : -Math.max(0, Math.sin(t * 2)) * 0.04), face = Math.sign(this.x - px) || 1;
        ctx.fillStyle = 'rgba(10,20,40,.25)'; ell(ctx, px, ty + 1, R * 0.9, R * 0.28); ctx.fill();
        ctx.save(); ctx.translate(px, ty - R * 0.9 - up); ctx.scale(face / sq, sq);
        ctx.fillStyle = '#9fdc8f';
        ctx.save(); ctx.translate(-R * 0.35, -R * 0.8); ctx.rotate(-0.4); ell(ctx, 0, -R * 0.55, R * 0.26, R * 0.62); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(R * 0.3, -R * 0.8); ctx.rotate(0.35); ell(ctx, 0, -R * 0.55, R * 0.26, R * 0.62); ctx.fill(); ctx.restore();
        const bg = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R * 1.15); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.55, '#fff4dc'); bg.addColorStop(1, '#e8d8c0');
        ctx.fillStyle = bg; ell(ctx, 0, 0, R, R * 0.94); ctx.fill();
        const blink = Math.sin(t * 0.8 + 2) > 0.985 ? 0.15 : 1;
        ctx.fillStyle = '#2a2a3a'; ell(ctx, R * 0.18, -R * 0.1, R * 0.11, R * 0.14 * blink); ctx.fill(); ell(ctx, R * 0.62, -R * 0.1, R * 0.1, R * 0.14 * blink); ctx.fill();
        ctx.fillStyle = 'rgba(255,140,150,.5)'; ell(ctx, R * 0.02, R * 0.2, R * 0.16, R * 0.1); ctx.fill(); ell(ctx, R * 0.76, R * 0.2, R * 0.13, R * 0.1); ctx.fill();
        ctx.restore();
        this.handles.push([px, ty - R * 0.9 - up, R * 1.6]);
        break;
      }
    }
  }

  /** calm + wonder: the doorway under the pond brightens where the spark went in */
  private drawLakeEvent(ctx: Ctx, a: number, t: number) {
    const hitAt = ARRIVE[0], q = this.rm ? 1 : smooth((a - hitAt) / 0.8);
    if (q <= 0) return;
    const [x, y] = [this.lake.x, this.lake.y + 4];
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.5);
    shine(ctx, 0, -6, 120 * q * (0.92 + 0.08 * Math.sin(t * 1.6)), [190, 255, 240], 0.55 * q);
    ctx.restore();
    for (let i = 0; i < 3; i++) { const r = (a - hitAt - i * 0.7) / 2.6; if (r > 0 && r < 1) { ctx.strokeStyle = css(WHITE, 0.6 * (1 - r)); ctx.lineWidth = 1.6; ell(ctx, x, y - 2, 90 * r + 6, 22 * r + 2); ctx.stroke(); } }
  }
}

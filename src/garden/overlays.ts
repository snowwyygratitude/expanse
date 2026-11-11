/**
 * The two places you can travel to without leaving the garden:
 *  - HiddenWorld: the tiny worlds behind the door, beneath the lake and inside the mountain
 *  - SkyView: look up, and every mix you have found is a constellation
 * Both are painted on the same canvas as the garden; there are no panels.
 */
import { TAU, RGB, css, clamp, outBack, outCubic, rng, hex, smooth } from '../util';
import { EMO, Emotion } from '../world/scene';
import { drawKeepsake, drawSeed, ell, glow, KEEPSAKES, shine, star4 } from './art';

type Ctx = CanvasRenderingContext2D;
export const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif";

export function text(ctx: Ctx, s: string, x: number, y: number, size: number, alpha = 1, opts: { italic?: boolean; align?: CanvasTextAlign; color?: string; spacing?: number } = {}) {
  ctx.save();
  ctx.font = `${opts.italic ? 'italic ' : ''}${size}px ${SERIF}`;
  ctx.textAlign = opts.align ?? 'center'; ctx.textBaseline = 'middle';
  if (opts.spacing) (ctx as any).letterSpacing = `${opts.spacing}px`;
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = 'rgba(8,10,30,.45)'; ctx.fillText(s, x, y + 1.2);
  ctx.fillStyle = opts.color ?? '#fff'; ctx.fillText(s, x, y);
  ctx.restore();
}
export function wrap(ctx: Ctx, s: string, size: number, maxW: number, italic = true): string[] {
  ctx.save(); ctx.font = `${italic ? 'italic ' : ''}${size}px ${SERIF}`;
  const words = s.split(' '), lines: string[] = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  ctx.restore(); return lines;
}

/* ================= hidden worlds ================= */
export type HiddenKind = 'door' | 'lake' | 'passage';
interface Spot { nx: number; ny: number; label?: string; on: boolean; a: number; give?: string[]; }

/** what each lamp in the Garden of Possibilities says as it lights */
const POSSIBLE = ['What if it goes better than you fear?', 'What if there is a way you have not seen yet?', 'What if you only need the next step?'];
const HIDDEN_TEXT: Record<HiddenKind, [string, string]> = {
  door: ['A tiny world, folded behind the door', 'Two ways lead on.'],
  lake: ['Beneath the still water', 'Something sleeps in the shell. The bubbles might wake it.'],
  passage: ['The Garden of Possibilities', 'Three lamps, three ways forward. Light them one by one.'],
};

export class HiddenWorld {
  k = 0; t = 0; closing = false; revealed: string | null = null; revealT = 0;
  spots: Spot[] = [];
  private stars = Array.from({ length: 70 }, (_, i) => { const r = rng(i * 97 + 3); return [r(), r(), r()]; });
  constructor(public kind: HiddenKind, public ox: number, public oy: number,
    private choose: (options: string[]) => string,
    private onClose: (keepsake: string | null) => void,
    private ping: (step?: number) => void, private rm: boolean) {
    if (kind === 'door') this.spots = [
      { nx: -0.36, ny: -0.16, label: 'the mossy stair', on: false, a: 0, give: ['mossfriend', 'snailhouse', 'acornlamp'] },
      { nx: 0.36, ny: -0.16, label: 'the star bridge', on: false, a: 0, give: ['starjar', 'moondial', 'comet'] }];
    if (kind === 'lake') this.spots = Array.from({ length: 5 }, () => ({ nx: 0, ny: 0, on: false, a: 0 }));
    if (kind === 'passage') this.spots = [
      { nx: -0.27, ny: 0.2, on: false, a: 0 }, { nx: 0.24, ny: 0.02, on: false, a: 0 }, { nx: -0.14, ny: -0.2, on: false, a: 0 }];
  }
  private geo(W: number, H: number) { const U = Math.min(W, H * 0.72); return { U, cx: W / 2, cy: H * 0.56 }; }
  private spotPos(i: number, W: number, H: number): [number, number] {
    const { U, cx, cy } = this.geo(W, H), s = this.spots[i];
    if (this.kind === 'lake') {
      const ph = (this.t * 0.045 + i * 0.2) % 1;
      return [cx + Math.sin(this.t * 0.5 + i * 1.7) * U * 0.1 + (i - 2) * U * 0.17, H * (0.84 - ph * 0.62)];
    }
    return [cx + s.nx * U, cy + s.ny * U + Math.sin(this.t * 1.2 + i * 2) * 4];
  }
  update(dt: number) {
    this.t += dt;
    this.k = clamp(this.k + (this.closing ? -1 : 1) * dt / (this.rm ? 0.25 : 0.85));
    for (const s of this.spots) if (s.on) s.a = Math.min(1, s.a + dt * 2.2);
    if (this.revealed) this.revealT += dt;
    if (this.closing && this.k <= 0) { const r = this.revealed; this.onClose(r); }
  }
  get finished() { return this.closing && this.k <= 0; }

  tap(x: number, y: number, W: number, H: number) {
    if (this.closing || this.k < 0.8) return;
    if (this.revealed) { if (this.revealT > 0.7) this.closing = true; return; }
    if (x < 200 && y < 96) { this.closing = true; return; }
    const { U } = this.geo(W, H);
    for (let i = 0; i < this.spots.length; i++) {
      const s = this.spots[i]; if (s.on) continue;
      const [px, py] = this.spotPos(i, W, H);
      if (Math.hypot(x - px, y - py) < Math.max(34, U * 0.09)) {
        s.on = true; this.ping(i);
        const lit = this.spots.filter(q => q.on).length;
        if (this.kind === 'door') this.reveal(this.choose(s.give!));
        else if (this.kind === 'lake' && lit >= 3) this.reveal(this.choose(['moonpearl', 'bubblefish', 'lotuslamp']));
        else if (this.kind === 'passage' && lit >= 3) this.reveal(this.choose(['cairn', 'compass', 'geode', 'waylamp', 'ribbonpole']));
        return;
      }
    }
  }
  private reveal(kind: string) { setTimeout(() => { this.revealed = kind; this.ping(5); }, this.rm ? 50 : 650); }

  draw(ctx: Ctx, W: number, H: number) {
    const { U, cx, cy } = this.geo(W, H), t = this.t;
    const R = outCubic(this.k) * Math.hypot(W, H) * 1.05;
    ctx.save();
    ctx.beginPath(); ctx.arc(this.ox, this.oy, Math.max(0.1, R), 0, TAU); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const stops = this.kind === 'door' ? ['#120c36', '#3a2a7a', '#2a9d96'] : this.kind === 'lake' ? ['#1d6a86', '#0f3c6a', '#07163a'] : ['#141c3c', '#3a3f72', '#e6a59a'] /* dawn, for hope */;
    g.addColorStop(0, stops[0]); g.addColorStop(0.6, stops[1]); g.addColorStop(1, stops[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    if (this.kind === 'door') {
      for (const [u, v, p] of this.stars) { ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.6 + p) + p * 9)); ctx.fillStyle = '#fff'; ctx.fillRect(u * W, v * H * 0.8, 1.6, 1.6); }
      ctx.globalAlpha = 1;
      shine(ctx, cx + U * 0.22, H * 0.2, U * 0.5, [200, 170, 255], 0.5);
      ctx.fillStyle = '#efe6ff'; ell(ctx, cx + U * 0.22, H * 0.2, U * 0.09, U * 0.09); ctx.fill();
      // bridges
      for (let j = 0; j < 2; j++) {
        const [sx, sy] = this.spotPos(j, W, H), dir = j ? 1 : -1;
        for (let i = 1; i <= 6; i++) {
          const q = i / 7, bx = cx + dir * U * 0.12 + (sx - cx - dir * U * 0.12) * q, by = cy - U * 0.02 + (sy + U * 0.07 - cy) * q - Math.sin(q * Math.PI) * U * 0.05;
          if (j === 0) { ctx.fillStyle = `rgba(130,220,150,${0.5 + 0.3 * Math.sin(t * 2 + i)})`; ctx.fillRect(bx - 9, by, 18, 5); }
          else { shine(ctx, bx, by, 12, [255, 240, 180], 0.6); ctx.fillStyle = '#fff6c8'; star4(ctx, bx, by, 5, t + i); ctx.fill(); }
        }
      }
      this.island(ctx, cx, cy, U * 0.2, '#3fae8a', '#241a55');
      // the door, seen from the other side
      ctx.fillStyle = '#8f8ab0'; ctx.beginPath(); ctx.moveTo(cx - 13, cy - 2); ctx.lineTo(cx - 13, cy - 26); ctx.arc(cx, cy - 26, 13, Math.PI, 0); ctx.lineTo(cx + 13, cy - 2); ctx.fill();
      shine(ctx, cx, cy - 20, 40, [255, 240, 200], 0.8);
      ctx.fillStyle = '#fff3d0'; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 2); ctx.lineTo(cx - 8, cy - 25); ctx.arc(cx, cy - 25, 8, Math.PI, 0); ctx.lineTo(cx + 8, cy - 2); ctx.fill();
      for (let i = 0; i < 2; i++) {
        const [sx, sy] = this.spotPos(i, W, H), s = this.spots[i], c: RGB = i ? [255, 235, 160] : [150, 240, 170];
        this.island(ctx, sx, sy + U * 0.09, U * 0.085, i ? '#6a5acd' : '#4fb37a', '#1f1650');
        const pr = 1 + 0.12 * Math.sin(t * 2.4 + i * 2) + s.a * 2.5;
        shine(ctx, sx, sy, U * 0.11 * pr, c, 0.85 * (1 - s.a * 0.7));
        ctx.fillStyle = css(c, 1 - s.a); ell(ctx, sx, sy, U * 0.028, U * 0.028); ctx.fill();
        if (!this.revealed) text(ctx, s.label!, sx, sy + U * 0.2, 13, 0.85, { italic: true });
      }
    }
    if (this.kind === 'lake') {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const x0 = W * (0.1 + i * 0.2) + Math.sin(t * 0.3 + i) * 30;
        const lg = ctx.createLinearGradient(0, 0, 0, H * 0.8); lg.addColorStop(0, 'rgba(160,230,255,.16)'); lg.addColorStop(1, 'rgba(160,230,255,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x0 - 20, 0); ctx.lineTo(x0 + 30, 0); ctx.lineTo(x0 + 110, H * 0.8); ctx.lineTo(x0 - 90, H * 0.8); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#0a2a4a'; ell(ctx, cx, H * 1.02, W * 0.8, H * 0.3); ctx.fill();
      ctx.fillStyle = '#123c5c'; ell(ctx, cx, cy + U * 0.22, U * 0.36, U * 0.09); ctx.fill();
      // weeds
      ctx.strokeStyle = 'rgba(80,200,170,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const wx = cx + (i - 3.5) * U * 0.1; ctx.beginPath(); ctx.moveTo(wx, cy + U * 0.24); ctx.quadraticCurveTo(wx + Math.sin(t + i) * 16, cy + U * 0.12, wx + Math.sin(t * 0.8 + i) * 22, cy + U * (0.02 + (i % 3) * 0.03)); ctx.stroke(); }
      // shell
      const open = this.revealed ? smooth(this.revealT * 1.5) : 0.04 * this.spots.filter(s => s.on).length;
      const shy = cy + U * 0.14;
      shine(ctx, cx, shy - 6, U * (0.1 + open * 0.2), [220, 235, 255], 0.3 + open * 0.5);
      ctx.fillStyle = '#b9a6d8'; ctx.beginPath(); ctx.ellipse(cx, shy, U * 0.1, U * 0.045, 0, 0, Math.PI); ctx.fill();
      ctx.save(); ctx.translate(cx - U * 0.1, shy); ctx.rotate(-open * 1.0);
      ctx.fillStyle = '#d6c6f0'; ctx.beginPath(); ctx.ellipse(U * 0.1, 0, U * 0.1, U * 0.05, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(U * 0.1 + i * U * 0.012, 0); ctx.lineTo(U * 0.1 + i * U * 0.035, -U * 0.043); ctx.stroke(); }
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        const [bx, by] = this.spotPos(i, W, H), s = this.spots[i], r = U * 0.05;
        if (s.on) { ctx.strokeStyle = `rgba(200,240,255,${1 - s.a})`; ctx.lineWidth = 2; ell(ctx, bx, by, r * (1 + s.a * 2), r * (1 + s.a * 2)); ctx.stroke(); continue; }
        shine(ctx, bx, by, r * 2.4, [150, 230, 255], 0.5);
        ctx.strokeStyle = 'rgba(220,245,255,.9)'; ctx.lineWidth = 1.6; ctx.fillStyle = 'rgba(160,220,255,.18)';
        ell(ctx, bx, by, r, r); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(ctx, bx - r * 0.35, by - r * 0.35, r * 0.16, r * 0.1, -0.6); ctx.fill();
      }
    }
    if (this.kind === 'passage') {
      shine(ctx, cx, H * 1.05, W * 0.9, [255, 205, 150], 0.45);
      ctx.fillStyle = '#07051a';
      for (let i = 0; i < 9; i++) { const x0 = (i / 8) * W, h = H * (0.1 + 0.12 * Math.abs(Math.sin(i * 2.7))); ctx.beginPath(); ctx.moveTo(x0 - W * 0.09, 0); ctx.lineTo(x0, h); ctx.lineTo(x0 + W * 0.09, 0); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(0, H); ctx.quadraticCurveTo(W * 0.5, H * 0.72, W, H); ctx.fill();
      // winding stones
      const pts: [number, number][] = [[cx - U * 0.05, cy + U * 0.36], ...this.spots.map((_, i) => this.spotPos(i, W, H)), [cx + U * 0.02, cy - U * 0.32]];
      for (let i = 0; i < pts.length - 1; i++) for (let q = 0; q < 1; q += 0.25) {
        const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q + U * 0.06;
        const lit = this.spots[Math.min(i, 2)]?.on || (i > 0 && this.spots[i - 1].on);
        ctx.fillStyle = lit ? 'rgba(255,220,160,.55)' : 'rgba(150,140,190,.25)'; ell(ctx, x, y, 11, 4.5); ctx.fill();
      }
      ctx.fillStyle = '#3a2f5a'; ctx.fillRect(cx + U * 0.02 - 16, cy - U * 0.3, 32, U * 0.07);
      this.spots.forEach((s, i) => {
        const [lx, ly] = this.spotPos(i, W, H);
        ctx.strokeStyle = '#6a5a8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, ly + U * 0.065); ctx.lineTo(lx, ly + 12); ctx.stroke();
        if (s.on) shine(ctx, lx, ly, U * 0.2 * (0.9 + 0.1 * Math.sin(t * 6 + i)), [255, 190, 110], 0.9 * s.a);
        else shine(ctx, lx, ly, U * 0.07 * (1 + 0.2 * Math.sin(t * 2 + i)), [190, 170, 255], 0.5);
        ctx.fillStyle = s.on ? '#ffe2a8' : '#4a3f6a'; ctx.strokeStyle = s.on ? '#fff3d0' : '#9a8cc0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(lx - 10, ly - 13, 20, 26, 6); ctx.fill(); ctx.stroke();
      });
    }

    const [title, base] = HIDDEN_TEXT[this.kind], lit = this.spots.filter(q => q.on).length;
    const sub = this.kind === 'passage' && lit ? POSSIBLE[lit - 1] : base;
    const fade = clamp(this.k * 2 - 1);
    if (!this.revealed) {
      text(ctx, title, cx, H * 0.11, Math.min(22, W * 0.05), fade, { italic: true });
      text(ctx, sub, cx, H * 0.11 + 28, 13.5, fade * 0.8);
      text(ctx, '‹  back to the garden', 20, 66, 13, fade * 0.7, { align: 'left', italic: true });
    } else {
      const a = smooth(this.revealT * 1.6), ky = cy - U * (this.kind === 'lake' ? 0.02 : 0.3), def = KEEPSAKES[this.revealed];
      ctx.save(); ctx.translate(cx, ky - U * 0.06); ctx.rotate(t * 0.15); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.fillStyle = `rgba(255,240,200,${0.07 * a})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(U * 0.42, -U * 0.05); ctx.lineTo(U * 0.42, U * 0.05); ctx.fill(); }
      ctx.restore();
      glow(ctx, cx, ky - U * 0.06, U * 0.3, [20, 14, 50], 0.6 * a);
      drawKeepsake(ctx, this.revealed, cx, ky + Math.sin(t * 1.5) * 4, (U / 40) * 0.26 * outBack(this.revealT * 1.4), t);
      text(ctx, def.name, cx, H * 0.11, Math.min(26, W * 0.06), a, { italic: true });
      wrap(ctx, def.line, 14, W * 0.8, false).forEach((l, i) => text(ctx, l, cx, H * 0.11 + 30 + i * 19, 14, a * 0.85));
      text(ctx, 'touch to carry it home', cx, H * 0.9, 13, a * (0.55 + 0.3 * Math.sin(t * 2.5)), { italic: true });
    }
    ctx.restore();
    if (this.k < 1) { ctx.strokeStyle = `rgba(255,245,220,${0.8 * (1 - this.k)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(this.ox, this.oy, Math.max(0.1, R), 0, TAU); ctx.stroke(); }
  }
  private island(ctx: Ctx, x: number, y: number, r: number, top: string, rock: string) {
    const g = ctx.createLinearGradient(0, y, 0, y + r * 1.3); g.addColorStop(0, rock); g.addColorStop(1, 'rgba(20,14,50,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x - r * 0.4, y + r * 0.9, x - r * 0.1, y + r * 1.3); ctx.quadraticCurveTo(x + r * 0.5, y + r * 0.8, x + r, y); ctx.fill();
    ctx.fillStyle = top; ell(ctx, x, y, r, r * 0.26); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ell(ctx, x - r * 0.2, y - r * 0.05, r * 0.6, r * 0.12); ctx.fill();
  }
}

/* ================= the sky of found things ================= */
export interface SkyData {
  pairs: { key: string; a: Emotion; b: Emotion; name: string; found: boolean }[];
  treasures: { kind: string; found: boolean }[];
  suggest: string | null;
}
export class SkyView {
  k = 0; t = 0; closing = false;
  private pick: Emotion[] | null = null;
  private rects: { x: number; y: number; w: number; h: number; i: number }[] = [];
  private stars = Array.from({ length: 160 }, (_, i) => { const r = rng(i * 31 + 11); return [r(), r(), r()]; });
  constructor(private data: SkyData, private onClose: (pick: Emotion[] | null) => void, private rm: boolean) { }
  update(dt: number) {
    this.t += dt; this.k = clamp(this.k + (this.closing ? -1 : 1) * dt / (this.rm ? 0.2 : 0.7));
    if (this.closing && this.k <= 0) this.onClose(this.pick);
  }
  get finished() { return this.closing && this.k <= 0; }
  tap(x: number, y: number) {
    if (this.closing) return;
    for (const r of this.rects) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) {
      const p = this.data.pairs[r.i];
      if (p.found) this.pick = [p.a, p.b];
      break;
    }
    this.closing = true;
  }
  draw(ctx: Ctx, W: number, H: number) {
    const a = smooth(this.k), t = this.t;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(8,8,32,.97)'); g.addColorStop(0.75, 'rgba(22,20,70,.95)'); g.addColorStop(1, 'rgba(34,32,90,.95)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [u, v, p] of this.stars) { ctx.globalAlpha = a * (0.2 + 0.6 * Math.abs(Math.sin(t * (0.5 + p) + p * 20))); ctx.fillStyle = '#fff'; ctx.fillRect(u * W, v * H, 1 + p, 1 + p); }
    ctx.globalAlpha = a;
    const n = this.data.pairs.length, found = this.data.pairs.filter(p => p.found).length;
    const lift = (1 - a) * 40;
    text(ctx, 'Skies you have found', W / 2, 70 + lift, Math.min(24, W * 0.06), 1, { italic: true });
    text(ctx, `${found} of ${n}`, W / 2, 96 + lift, 12, 0.6, { spacing: 2 });
    const land = W > H * 1.15, cols = land ? Math.ceil(n / 3) : n > 21 ? 4 : 3, rows = Math.ceil(n / cols);
    const trN = this.data.treasures.length, perRow = Math.max(4, Math.min(trN, Math.floor((W - 24) / 38))), trRows = Math.ceil(trN / perRow);
    const top = 124, bottom = H - (74 + trRows * 40);
    const cw = Math.min(land ? 150 : 128, (W - 16) / cols), ch = Math.min(96, (bottom - top) / rows);
    const x0 = W / 2 - (cols * cw) / 2;
    this.rects = [];
    this.data.pairs.forEach((p, i) => {
      const cxx = x0 + (i % cols + 0.5) * cw, cyy = top + (Math.floor(i / cols) + 0.4) * ch + lift;
      this.rects.push({ x: cxx - cw / 2, y: cyy - ch * 0.4, w: cw, h: ch, i });
      const sep = Math.min(20, cw * 0.17), r = Math.min(9, ch * 0.11);
      const hint = !p.found && p.key === this.data.suggest;
      ctx.strokeStyle = p.found ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cxx - sep + r, cyy); ctx.lineTo(cxx + sep - r, cyy); ctx.stroke();
      if (p.found) {
        drawSeed(ctx, p.a, cxx - sep, cyy, r, t + i); drawSeed(ctx, p.b, cxx + sep, cyy, r, t + i * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 2 + i)})`; star4(ctx, cxx, cyy, 3.2, t * 0.5); ctx.fill();
        wrap(ctx, p.name, 11.5, cw - 8).slice(0, 2).forEach((l, j) => text(ctx, l, cxx, cyy + r + 15 + j * 14, 11.5, 0.9, { italic: true }));
      } else {
        const pa = hint ? 0.35 + 0.25 * Math.sin(t * 2.2) : 0.16;
        if (hint) { ctx.save(); ctx.globalAlpha *= pa + 0.1; drawSeed(ctx, p.a, cxx - sep, cyy, r, t); drawSeed(ctx, p.b, cxx + sep, cyy, r, t); ctx.restore(); }
        else { ctx.fillStyle = `rgba(255,255,255,${pa})`; ell(ctx, cxx - sep, cyy, 2.5, 2.5); ctx.fill(); ell(ctx, cxx + sep, cyy, 2.5, 2.5); ctx.fill(); }
        if (hint) text(ctx, 'the garden wonders…', cxx, cyy + r + 15, 10.5, 0.55, { italic: true });
      }
    });
    // treasures
    const tr = this.data.treasures, ty0 = H - 40 - trRows * 40 + lift;
    text(ctx, `treasures carried home  ·  ${tr.filter(q => q.found).length} of ${tr.length}`, W / 2, ty0 - 12, 11.5, 0.6, { spacing: 1.5 });
    tr.forEach((q, i) => {
      const row = Math.floor(i / perRow), inRow = row === trRows - 1 ? trN - row * perRow : perRow;
      const x = W / 2 + ((i % perRow) - (inRow - 1) / 2) * 38, ty = ty0 + 42 + row * 40;
      if (q.found) drawKeepsake(ctx, q.kind, x, ty, 0.68, t + i);
      else { ctx.fillStyle = 'rgba(255,255,255,.18)'; star4(ctx, x, ty - 12, 4, 0); ctx.fill(); }
    });
    text(ctx, 'touch a constellation to return to it  ·  touch the dark to come back down', W / 2, H - 20, 11, 0.45, { italic: true });
    ctx.restore();
  }
}
/* ================= choosing new words for an old belief ================= */
export const OWN_WORDS = '\u0000own';
export class BeliefChoice {
  k = 0; t = 0; closing = false;
  private result: string | null = null;
  private rects: { y0: number; y1: number; v: string | null }[] = [];
  constructor(private belief: string, private reframes: string[], private onClose: (r: string | null) => void, private rm: boolean, private ping: (i: number) => void) { }
  update(dt: number) {
    this.t += dt; this.k = clamp(this.k + (this.closing ? -1 : 1) * dt / (this.rm ? 0.2 : 0.7));
    if (this.closing && this.k <= 0) this.onClose(this.result);
  }
  get finished() { return this.closing && this.k <= 0; }
  tap(_x: number, y: number) {
    if (this.closing || this.k < 0.8) return;
    for (const r of this.rects) if (y >= r.y0 && y < r.y1) { this.result = r.v; if (r.v && r.v !== OWN_WORDS) this.ping(this.reframes.indexOf(r.v)); this.closing = true; return; }
  }
  draw(ctx: Ctx, W: number, H: number) {
    const a = smooth(this.k), t = this.t, cx = W / 2, maxW = Math.min(W - 52, 460), x0 = cx - maxW / 2;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(14,12,44,.93)'); g.addColorStop(1, 'rgba(30,28,80,.86)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    shine(ctx, cx, H * 0.42, Math.max(W, H) * 0.6, [255, 225, 170], 0.1 + 0.03 * Math.sin(t));
    const blines = wrap(ctx, `“${this.belief}”`, 19, maxW), lists = this.reframes.map(r => wrap(ctx, r, 16, maxW - 44, false));
    const total = 30 + blines.length * 26 + 62 + lists.reduce((n, l) => n + l.length * 22 + 30, 0) + 56;
    let y = Math.max(74, (H - total) / 2) + (1 - a) * 24;
    text(ctx, 'a belief that may be underneath', cx, y, 11.5, 0.6, { spacing: 2 }); y += 34;
    blines.forEach(l => { text(ctx, l, cx, y, 19, 0.95, { italic: true }); y += 26; });
    y += 12; ctx.fillStyle = 'rgba(255,255,255,.5)'; star4(ctx, cx, y, 4, t * 0.4); ctx.fill(); y += 26;
    text(ctx, 'Which of these feels true enough to carry?', cx, y, 14, 0.85); y += 30;
    this.rects = [];
    const cols: RGB[] = [[255, 226, 150], [170, 235, 255], [200, 255, 190]];
    lists.forEach((lines, i) => {
      const top = y - 14, mid = y + (lines.length - 1) * 11;
      shine(ctx, x0 + 14, mid, 22 + 4 * Math.sin(t * 2 + i * 2), cols[i % 3], 0.9);
      ctx.fillStyle = '#fff'; star4(ctx, x0 + 14, mid, 5.5, t * 0.5 + i, 0.32); ctx.fill();
      lines.forEach(l => { text(ctx, l, x0 + 40, y, 16, 1, { align: 'left' }); y += 22; });
      y += 30; this.rects.push({ y0: top - 6, y1: y - 22, v: this.reframes[i] });
    });
    y += 4;
    text(ctx, 'write my own words', cx, y, 14, 0.8, { italic: true }); this.rects.push({ y0: y - 17, y1: y + 17, v: OWN_WORDS }); y += 38;
    text(ctx, 'not now', cx, y, 13, 0.5, { italic: true }); this.rects.push({ y0: y - 17, y1: y + 22, v: null });
    ctx.restore();
  }
}
export const _unused = hex;

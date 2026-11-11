/** Reusable hand-drawn (in code) art: glows, emotion seeds and keepsakes. */
import { RGB, TAU, css, mix, WHITE, hex, lerp } from '../util';
import { EMO, Emotion } from '../world/scene';

type Ctx = CanvasRenderingContext2D;

/* ---------- soft glow sprites (cheap replacement for shadowBlur) ---------- */
const glowCache = new Map<number, HTMLCanvasElement>();
export function glow(ctx: Ctx, x: number, y: number, r: number, c: RGB, a = 1) {
  if (a <= 0.003 || r <= 0.5) return;
  const key = ((c[0] >> 3) << 10) | ((c[1] >> 3) << 5) | (c[2] >> 3);
  let sp = glowCache.get(key);
  if (!sp) {
    sp = document.createElement('canvas'); sp.width = sp.height = 64;
    const g = sp.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, css(c, 1)); gr.addColorStop(0.25, css(c, 0.55)); gr.addColorStop(0.6, css(c, 0.14)); gr.addColorStop(1, css(c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    glowCache.set(key, sp);
  }
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * Math.min(1, a);
  ctx.drawImage(sp, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = prev;
}
/** additive glow */
export function shine(ctx: Ctx, x: number, y: number, r: number, c: RGB, a = 1) {
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r, c, a);
  ctx.globalCompositeOperation = op;
}
export function ell(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU);
}
export function star4(ctx: Ctx, x: number, y: number, r: number, rot = 0, inner = 0.28) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * TAU) / 8, rr = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function heart(ctx: Ctx, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.75, -r * 1.15, 0, -r * 0.4);
  ctx.bezierCurveTo(r * 0.75, -r * 1.15, r * 1.5, -r * 0.1, 0, r * 0.9);
  ctx.closePath();
}
function grad(ctx: Ctx, r: number, c: RGB, deep: RGB) {
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.05, 0, 0, r * 1.25);
  g.addColorStop(0, css(mix(c, WHITE, 0.75))); g.addColorStop(0.45, css(c)); g.addColorStop(1, css(deep));
  return g;
}

/* ---------- emotion seeds: each has its own silhouette ---------- */
export function drawSeed(ctx: Ctx, kind: Emotion | 'wish' | 'worry', x: number, y: number, r: number, t: number, lit = 1) {
  ctx.save(); ctx.translate(x, y);
  if (kind === 'worry') { // a heavy, smooth stone with light just starting to show through
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.6);
    shine(ctx, 0, 0, r * 2.3, [160, 150, 235], 0.3 * lit * pulse);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.3);
    g.addColorStop(0, '#8f89b8'); g.addColorStop(0.5, '#514b78'); g.addColorStop(1, '#221f3c');
    ctx.fillStyle = g; ell(ctx, 0, 0, r * 1.12, r * 0.84); ctx.fill();
    ctx.strokeStyle = `rgba(225,215,255,${0.35 + 0.45 * pulse})`; ctx.lineWidth = Math.max(1, r * 0.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(-r * 0.1, -r * 0.05); ctx.lineTo(-r * 0.2, r * 0.3); ctx.moveTo(-r * 0.1, -r * 0.05); ctx.lineTo(r * 0.4, -r * 0.2); ctx.lineTo(r * 0.6, r * 0.15); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ell(ctx, -r * 0.35, -r * 0.4, r * 0.3, r * 0.12, -0.4); ctx.fill();
    ctx.restore(); return;
  }
  if (kind === 'wish') {
    const c1: RGB = [200 + 55 * Math.sin(t * 1.3), 200 + 55 * Math.sin(t * 1.3 + 2), 255];
    shine(ctx, 0, 0, r * 2.6, c1, 0.5 * lit);
    star4(ctx, 0, 0, r * 1.15, t * 0.4, 0.45);
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.4, css(c1)); g.addColorStop(1, '#ff9be0');
    ctx.fillStyle = g; ctx.fill();
    star4(ctx, 0, 0, r * 0.45, -t * 0.6, 0.4); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    ctx.restore(); return;
  }
  const { color: c, deep } = EMO[kind];
  shine(ctx, 0, 0, r * 2.4, c, 0.42 * lit);
  ctx.fillStyle = grad(ctx, r, c, deep);
  switch (kind) {
    case 'joy': {
      ctx.save(); ctx.rotate(t * 0.25);
      ctx.fillStyle = css(mix(c, deep, 0.25));
      for (let i = 0; i < 10; i++) {
        ctx.rotate(TAU / 10);
        ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.16); ctx.lineTo(r * 1.18, 0); ctx.lineTo(r * 0.7, r * 0.16); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = grad(ctx, r, c, deep); ell(ctx, 0, 0, r * 0.8, r * 0.8); ctx.fill();
      break;
    }
    case 'calm': {
      ell(ctx, 0, 0, r * 1.05, r * 0.76); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, r * 0.07);
      ell(ctx, 0, r * 0.05, r * 0.6, r * 0.36); ctx.stroke();
      ell(ctx, 0, r * 0.05, r * 0.28, r * 0.15); ctx.stroke();
      break;
    }
    case 'sadness': {
      ctx.beginPath(); ctx.moveTo(0, -r * 1.2);
      ctx.bezierCurveTo(r * 0.25, -r * 0.6, r * 0.9, -r * 0.1, r * 0.82, r * 0.35);
      ctx.bezierCurveTo(r * 0.75, r * 1.1, -r * 0.75, r * 1.1, -r * 0.82, r * 0.35);
      ctx.bezierCurveTo(-r * 0.9, -r * 0.1, -r * 0.25, -r * 0.6, 0, -r * 1.2);
      ctx.fill();
      break;
    }
    case 'curiosity': {
      ell(ctx, 0, 0, r * 0.88, r * 0.88); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(1, r * 0.09); ctx.lineCap = 'round';
      ctx.beginPath();
      for (let a = 0; a < 2.4 * TAU; a += 0.3) { const rr = r * 0.07 + a * r * 0.045; ctx.lineTo(Math.cos(a + t * 0.5) * rr, Math.sin(a + t * 0.5) * rr); }
      ctx.stroke();
      ctx.fillStyle = '#fff'; ell(ctx, Math.cos(t * 1.4) * r * 1.2, Math.sin(t * 1.4) * r * 0.5, r * 0.11, r * 0.11); ctx.fill();
      break;
    }
    case 'courage': {
      const flame = (k: number) => {
        ctx.beginPath(); ctx.moveTo(0, -r * 1.25 * k);
        ctx.bezierCurveTo(r * 0.3 * k, -r * 0.6 * k, r * 0.95 * k, -r * 0.1 * k, r * 0.7 * k, r * 0.5 * k);
        ctx.bezierCurveTo(r * 0.5 * k, r * 1.05 * k, -r * 0.5 * k, r * 1.05 * k, -r * 0.7 * k, r * 0.5 * k);
        ctx.bezierCurveTo(-r * 0.95 * k, -r * 0.1 * k, -r * 0.3 * k, -r * 0.6 * k, 0, -r * 1.25 * k);
      };
      flame(1); ctx.fill();
      ctx.save(); ctx.translate(0, r * 0.28); ctx.fillStyle = 'rgba(255,225,150,.85)'; flame(0.5 + 0.04 * Math.sin(t * 5)); ctx.fill(); ctx.restore();
      break;
    }
    case 'gratitude': {
      heart(ctx, r * 0.95); ctx.fill();
      break;
    }
    case 'fear': { // a small seed peeking out from under its own hood
      ell(ctx, 0, r * 0.08, r * 0.86, r * 0.92); ctx.fill();
      ctx.fillStyle = css(deep, 0.75); ctx.beginPath(); ctx.ellipse(0, r * 0.02, r * 0.86, r * 0.92, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(0, -r * 0.05, -r * 0.85, -r * 0.03); ctx.fill();
      const bl = Math.sin(t * 0.9 + 1) > 0.96 ? 0.15 : 1;
      ctx.fillStyle = '#fff'; ell(ctx, -r * 0.3, r * 0.3, r * 0.15, r * 0.19 * bl); ctx.fill(); ell(ctx, r * 0.3, r * 0.3, r * 0.15, r * 0.19 * bl); ctx.fill();
      break;
    }
    case 'hope': {
      ell(ctx, 0, r * 0.25, r * 0.72, r * 0.62); ctx.fill();
      ctx.strokeStyle = css(deep); ctx.lineWidth = Math.max(1.2, r * 0.12); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.3); ctx.quadraticCurveTo(r * 0.05, -r * 0.8, 0, -r * 1.0); ctx.stroke();
      ctx.fillStyle = css(mix(c, WHITE, 0.2));
      ell(ctx, -r * 0.36, -r * 1.05, r * 0.4, r * 0.2, 0.5); ctx.fill();
      ell(ctx, r * 0.36, -r * 1.12, r * 0.4, r * 0.2, -0.5); ctx.fill();
      break;
    }
  }
  // specular highlight
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ell(ctx, -r * 0.3, -r * 0.32, r * 0.2, r * 0.12, -0.6); ctx.fill();
  ctx.restore();
}

/* ---------- keepsakes: the permanent layer of the garden ---------- */
export interface KeepsakeDef { name: string; line: string; }
export const KEEPSAKES: Record<string, KeepsakeDef> = {
  rainbloom: { name: 'Rainbloom', line: 'It opened the moment the rain touched it.' },
  moonpearl: { name: 'Moon Pearl', line: 'Found beneath still water, still a little cold.' },
  starjar: { name: 'Jar of Wandering Stars', line: 'They followed you back across the star bridge.' },
  mossfriend: { name: 'Moss Friend', line: 'It was waiting at the bottom of the mossy stair.' },
  cairn: { name: 'Summit Cairn', line: 'Three stones and a small flame that does not go out.' },
  compass: { name: 'Compass Bloom', line: 'It points toward wherever you have not been yet.' },
  sapling: { name: 'Gift Sapling', line: 'The old tree wanted you to have a little one.' },
  pinwheel: { name: 'Sun Pinwheel', line: 'It spins whenever something here is glad.' },
  chime: { name: 'Stillwater Chime', line: 'It only rings when the air is at peace.' },
  mistbell: { name: 'Mist Bell', line: 'A small blue bell that holds the sound of rain.' },
  crystal: { name: 'Question Crystal', line: 'Each face shows a slightly different garden.' },
  feather: { name: 'Ember Feather', line: 'Dropped by a bird that flew straight at the sunrise.' },
  heartstone: { name: 'Heartstone', line: 'Warm to the touch, like a stone left in the sun.' },
  dawnsprout: { name: 'Dawn Sprout', line: 'It is growing a tiny star instead of a flower.' },
  beliefbloom: { name: 'Belief Bloom', line: 'It grew out of a worry you set down.' },
  geode: { name: 'Lantern Geode', line: 'A plain stone outside. Inside, a small lit city of crystal.' },
  waylamp: { name: 'Wayfinder Lamp', line: 'One of the lamps followed you out. It likes being useful.' },
  ribbonpole: { name: 'Ribbon Pole', line: 'Each ribbon is a wish someone tied here on the way up.' },
  snailhouse: { name: 'Snail with a House', line: 'The window is lit. Somebody small is home.' },
  acornlamp: { name: 'Acorn Lantern', line: 'It holds one evening of late summer light.' },
  moondial: { name: 'Moon Dial', line: 'It tells the time by moonlight, and is never in a hurry.' },
  comet: { name: 'Sleeping Comet', line: 'It was tired of travelling, and curled up here.' },
  bubblefish: { name: 'Fish in a Bubble', line: 'It brought a little of the lake along so it could visit.' },
  lotuslamp: { name: 'Lotus Lamp', line: 'It floated up from the deep with its flame still lit.' },
  worlddrop: { name: 'World Dewdrop', line: 'A whole sky, kept in a drop of dew. Touch it to return.' },
};

const stone = (ctx: Ctx, x: number, y: number, rx: number, ry: number, c: RGB) => {
  const g = ctx.createLinearGradient(x, y - ry, x, y + ry);
  g.addColorStop(0, css(mix(c, WHITE, 0.3))); g.addColorStop(1, css(mix(c, [20, 20, 50], 0.35)));
  ctx.fillStyle = g; ell(ctx, x, y, rx, ry); ctx.fill();
};

/** Draw a keepsake with its base at (x,y). `s` is pixels per art unit; art is ~40 units tall. */
export function drawKeepsake(ctx: Ctx, kind: string, x: number, y: number, s: number, t: number, data?: any) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bob = Math.sin(t * 1.6) * 1.2;
  switch (kind) {
    case 'rainbloom': {
      const c = hex('#7fd0ff');
      ctx.strokeStyle = '#3d8a8f'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -14, 0, -26); ctx.stroke();
      ctx.fillStyle = '#4aa39a'; ell(ctx, 6, -9, 7, 3, -0.5); ctx.fill();
      shine(ctx, 0, -28, 26, c, 0.7);
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.translate(0, -28); ctx.rotate((i * TAU) / 6 + Math.sin(t) * 0.05);
        ctx.fillStyle = i % 2 ? '#9fe0ff' : '#5fb4ff';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(5, -7, 0, -13); ctx.quadraticCurveTo(-5, -7, 0, 0); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#fff'; ell(ctx, 0, -28, 2.6, 2.6); ctx.fill();
      break;
    }
    case 'moonpearl': {
      ctx.fillStyle = '#c9b6e8';
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.quadraticCurveTo(-17, -12, 0, -10); ctx.quadraticCurveTo(17, -12, 15, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2, -1); ctx.lineTo(i * 5.5, -9.5); ctx.stroke(); }
      shine(ctx, 0, -19 + bob, 24, [220, 230, 255], 0.75);
      const g = ctx.createRadialGradient(-3, -22 + bob, 1, 0, -19 + bob, 10);
      g.addColorStop(0, '#fff'); g.addColorStop(0.6, '#dfe6ff'); g.addColorStop(1, '#9fa8e0');
      ctx.fillStyle = g; ell(ctx, 0, -19 + bob, 9, 9); ctx.fill();
      break;
    }
    case 'starjar': {
      shine(ctx, 0, -16, 26, [255, 240, 170], 0.5);
      ctx.fillStyle = 'rgba(190,220,255,.28)'; ctx.strokeStyle = 'rgba(230,245,255,.8)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-9, -28); ctx.quadraticCurveTo(-14, -26, -13, -18); ctx.lineTo(-12, -4);
      ctx.quadraticCurveTo(-12, 0, -8, 0); ctx.lineTo(8, 0); ctx.quadraticCurveTo(12, 0, 12, -4); ctx.lineTo(13, -18);
      ctx.quadraticCurveTo(14, -26, 9, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b88a5a'; ctx.fillRect(-9.5, -32, 19, 5);
      for (let i = 0; i < 5; i++) {
        const a = t * (0.6 + i * 0.13) + i * 1.9;
        const sx = Math.cos(a) * 6.5, sy = -14 + Math.sin(a * 1.3) * 8;
        shine(ctx, sx, sy, 5, [255, 245, 190], 0.45);
        ctx.fillStyle = '#fffbe0'; star4(ctx, sx, sy, 2.4, a); ctx.fill();
      }
      break;
    }
    case 'mossfriend': {
      stone(ctx, 0, -11, 13, 12, [120, 150, 120]);
      ctx.fillStyle = '#6fb26a';
      ctx.beginPath(); ctx.arc(0, -13, 13.4, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(0, -17, -12.7, -15); ctx.fill();
      ctx.fillStyle = '#7cc474';
      ell(ctx, -7, -27 + bob * 0.3, 3.2, 7, -0.35); ctx.fill(); ell(ctx, 7, -27 + bob * 0.3, 3.2, 7, 0.35); ctx.fill();
      const blink = Math.sin(t * 0.9) > 0.97 ? 0.15 : 1;
      ctx.fillStyle = '#263238'; ell(ctx, -4.5, -11, 1.5, 1.8 * blink); ctx.fill(); ell(ctx, 4.5, -11, 1.5, 1.8 * blink); ctx.fill();
      ctx.fillStyle = 'rgba(255,150,150,.5)'; ell(ctx, -8, -7.5, 2.2, 1.3); ctx.fill(); ell(ctx, 8, -7.5, 2.2, 1.3); ctx.fill();
      break;
    }
    case 'cairn': {
      stone(ctx, 0, -5, 14, 6, [150, 140, 160]); stone(ctx, 1, -14, 10, 5, [170, 160, 175]); stone(ctx, -0.5, -22, 6.5, 4, [190, 180, 190]);
      const fl = 1 + Math.sin(t * 7) * 0.12;
      shine(ctx, 0, -31, 22 * fl, [255, 170, 90], 0.8);
      ctx.fillStyle = '#ffb45a'; ctx.beginPath(); ctx.moveTo(0, -38 * (0.94 + 0.06 * fl)); ctx.quadraticCurveTo(5, -30, 0, -26); ctx.quadraticCurveTo(-5, -30, 0, -38); ctx.fill();
      ctx.fillStyle = '#fff3c4'; ell(ctx, 0, -29, 1.6, 2.4); ctx.fill();
      break;
    }
    case 'compass': {
      ctx.strokeStyle = '#3f8f7a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(3, -10, 0, -20); ctx.stroke();
      shine(ctx, 0, -28, 22, [160, 255, 230], 0.6);
      ctx.save(); ctx.translate(0, -28); ctx.rotate(Math.sin(t * 0.7) * 0.6);
      ctx.fillStyle = '#eafff8'; star4(ctx, 0, 0, 12, 0, 0.22); ctx.fill();
      ctx.fillStyle = '#ff8f7a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(2.6, 0); ctx.lineTo(-2.6, 0); ctx.fill();
      ctx.fillStyle = '#58c9b0'; star4(ctx, 0, 0, 6.5, TAU / 8, 0.35); ctx.fill();
      ctx.restore();
      break;
    }
    case 'sapling': {
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2, -10, 0, -18); ctx.stroke();
      shine(ctx, 0, -26, 28, [255, 210, 110], 0.55);
      const blobs = [[-7, -22, 8], [7, -23, 8], [0, -31, 9], [0, -22, 7]];
      blobs.forEach(([bx, by, br], i) => { ctx.fillStyle = i === 2 ? '#ffe08a' : '#f3bf52'; ell(ctx, bx + Math.sin(t + i) * 0.5, by, br, br); ctx.fill(); });
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(6, -17); ctx.lineTo(6, -12); ctx.stroke();
      ctx.fillStyle = '#ff8fa3'; ctx.fillRect(3.5, -12, 5, 5); ctx.fillStyle = '#fff'; ctx.fillRect(5.5, -12, 1, 5);
      break;
    }
    case 'pinwheel': {
      ctx.strokeStyle = '#d9c7a0'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      shine(ctx, 0, -27, 22, [255, 220, 120], 0.5);
      ctx.save(); ctx.translate(0, -27); ctx.rotate(t * 2.2);
      const cols = ['#ffd35a', '#ff9f6b', '#ff7aa2', '#ffe9a0'];
      for (let i = 0; i < 4; i++) {
        ctx.rotate(TAU / 4); ctx.fillStyle = cols[i];
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, -2); ctx.quadraticCurveTo(9, -10, 0, -11); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ell(ctx, 0, 0, 1.8, 1.8); ctx.fill();
      ctx.restore();
      break;
    }
    case 'chime': {
      ctx.strokeStyle = '#9a8870'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-12, -34, 0, -36); ctx.quadraticCurveTo(12, -34, 10, 0); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const sw = Math.sin(t * 1.4 + i * 1.3) * 0.12;
        ctx.save(); ctx.translate((i - 1) * 5.5, -35); ctx.rotate(sw);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
        ctx.fillStyle = ['#a8e6df', '#d0f4ef', '#8fd0d8'][i]; ctx.fillRect(-1.4, 7, 2.8, 10 + i * 3);
        ctx.restore();
      }
      shine(ctx, 0, -22, 18, [170, 240, 230], 0.35);
      break;
    }
    case 'mistbell': {
      ctx.strokeStyle = '#5a8a9a'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-2, -18, 2, -30, 9, -30); ctx.stroke();
      const sw = Math.sin(t * 1.3) * 0.15;
      ctx.save(); ctx.translate(9, -30); ctx.rotate(sw);
      shine(ctx, 0, 7, 18, [130, 180, 255], 0.7);
      ctx.fillStyle = '#7fa8f0';
      ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.quadraticCurveTo(-7, 3, -7, 12); ctx.lineTo(7, 12); ctx.quadraticCurveTo(7, 3, 1.5, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#cfe2ff'; ell(ctx, 0, 13.5, 1.8, 1.8); ctx.fill();
      ctx.restore();
      break;
    }
    case 'crystal': {
      shine(ctx, 0, -14, 28, [190, 140, 255], 0.55);
      const shard = (cx: number, h: number, w: number, rot: number, c1: string, c2: string) => {
        ctx.save(); ctx.translate(cx, 0); ctx.rotate(rot);
        ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w, -h * 0.75); ctx.lineTo(0, -h); ctx.lineTo(0, 0); ctx.fill();
        ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, -h * 0.75); ctx.lineTo(0, -h); ctx.lineTo(0, 0); ctx.fill();
        ctx.restore();
      };
      shard(-7, 20, 4.5, -0.35, '#b596ff', '#8a63e8'); shard(8, 17, 4, 0.4, '#d6b8ff', '#9a74ee'); shard(0, 31, 6, 0, '#e2ccff', '#a47cf5');
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 2)})`; star4(ctx, -2, -22, 3, t); ctx.fill();
      break;
    }
    case 'feather': {
      shine(ctx, 0, -22 + bob, 26, [255, 140, 80], 0.6);
      ctx.save(); ctx.translate(0, bob - 4); ctx.rotate(0.18 + Math.sin(t) * 0.06);
      const g = ctx.createLinearGradient(0, 0, 0, -36);
      g.addColorStop(0, '#c0303f'); g.addColorStop(0.5, '#ff7a4a'); g.addColorStop(1, '#ffd98a');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-10, -10, -9, -28, 0, -37); ctx.bezierCurveTo(9, -28, 10, -10, 0, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,210,.8)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -34); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'heartstone': {
      const p = 1 + Math.sin(t * 2.2) * 0.05;
      shine(ctx, 0, -13, 26 * p, [255, 150, 110], 0.7);
      ctx.save(); ctx.translate(0, -13); ctx.scale(p, p);
      const g = ctx.createRadialGradient(-4, -6, 1, 0, 0, 16);
      g.addColorStop(0, '#ffd9b8'); g.addColorStop(0.5, '#ff9a7a'); g.addColorStop(1, '#c9506e');
      ctx.fillStyle = g; heart(ctx, 13); ctx.fill();
      ctx.restore();
      break;
    }
    case 'dawnsprout': {
      ctx.fillStyle = '#c98f6a'; ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(8, -9); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#dba781'; ctx.fillRect(-9, -11, 18, 3);
      ctx.strokeStyle = '#5fbc86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(-3, -20, 0, -28); ctx.stroke();
      ctx.fillStyle = '#8be0a0'; ell(ctx, -5, -20, 5, 2.4, 0.5); ctx.fill(); ell(ctx, 5, -23, 5, 2.4, -0.5); ctx.fill();
      shine(ctx, 0, -32 + bob * 0.4, 18, [255, 245, 170], 0.85);
      ctx.fillStyle = '#fffbd6'; star4(ctx, 0, -32 + bob * 0.4, 5, t * 0.8, 0.4); ctx.fill();
      break;
    }
    case 'beliefbloom': {
      stone(ctx, -9, -3, 8, 5, [90, 84, 130]); stone(ctx, 10, -2.5, 7, 4.5, [80, 76, 120]);
      ctx.strokeStyle = '#6fc79a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(-4, -14, 0, -25); ctx.stroke();
      ctx.fillStyle = '#8fdcae'; ell(ctx, -7, -11, 6.5, 2.8, 0.55); ctx.fill(); ell(ctx, 7, -15, 6.5, 2.8, -0.55); ctx.fill();
      const br = 1 + Math.sin(t * 1.4) * 0.04;
      shine(ctx, 0, -31, 34 * br, [255, 236, 190], 0.75);
      for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 7; i++) {
        ctx.save(); ctx.translate(0, -29); ctx.rotate((i - 3) * (layer ? 0.3 : 0.44) + Math.sin(t * 0.9 + i) * 0.03);
        const pg = ctx.createLinearGradient(0, 0, 0, -15); pg.addColorStop(0, layer ? '#fffdf2' : '#fff1d6'); pg.addColorStop(1, layer ? '#ffe2a0' : '#ffc9b0');
        ctx.fillStyle = pg; const h = (layer ? 12 : 15) * br;
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.bezierCurveTo(-4.6, -3, -3.6, -h + 2, 0, -h); ctx.bezierCurveTo(3.6, -h + 2, 4.6, -3, 0, 2); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#fff8dc'; ell(ctx, 0, -29, 2.6, 2); ctx.fill();
      break;
    }
    case 'worlddrop': {
      const sky: string[] = data?.sky ?? ['#34447f', '#8a98d2', '#f1c6d6'];
      ctx.fillStyle = 'rgba(40,60,60,.5)'; ell(ctx, 0, -1, 8, 2.5); ctx.fill();
      const cy = -17 + bob;
      shine(ctx, 0, cy, 28, hex(sky[2]), 0.5);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, cy - 17); ctx.bezierCurveTo(3, cy - 9, 13, cy - 3, 12, cy + 4);
      ctx.bezierCurveTo(11, cy + 15, -11, cy + 15, -12, cy + 4); ctx.bezierCurveTo(-13, cy - 3, -3, cy - 9, 0, cy - 17); ctx.closePath();
      ctx.clip();
      const g = ctx.createLinearGradient(0, cy - 17, 0, cy + 13);
      g.addColorStop(0, sky[0]); g.addColorStop(0.55, sky[1]); g.addColorStop(1, sky[2]);
      ctx.fillStyle = g; ctx.fillRect(-14, cy - 18, 28, 34);
      ctx.fillStyle = 'rgba(30,60,50,.55)'; ell(ctx, 0, cy + 16, 16, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(ctx, 3, cy - 2, 1, 1); ctx.fill(); ell(ctx, -5, cy + 2, 0.8, 0.8); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(0, cy - 17); ctx.bezierCurveTo(3, cy - 9, 13, cy - 3, 12, cy + 4);
      ctx.bezierCurveTo(11, cy + 15, -11, cy + 15, -12, cy + 4); ctx.bezierCurveTo(-13, cy - 3, -3, cy - 9, 0, cy - 17); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, -5, cy - 1, 1.8, 4, 0.4); ctx.fill();
      break;
    }
    case 'geode': {
      stone(ctx, 0, -10, 17, 11, [120, 112, 130]);
      const gg = ctx.createRadialGradient(2, -11, 1, 2, -11, 11); gg.addColorStop(0, '#fff3ff'); gg.addColorStop(0.5, '#c79bff'); gg.addColorStop(1, '#5b3fa8');
      shine(ctx, 2, -12, 24 + 3 * Math.sin(t * 2), [200, 150, 255], 0.6);
      ctx.fillStyle = gg; ell(ctx, 2, -11, 11, 7.5, -0.15); ctx.fill();
      for (const [cx, h, c] of [[-4, 7, '#e9d4ff'], [0, 10, '#9ff0e6'], [4, 8, '#f6e9ff'], [8, 5, '#c9a8ff']] as [number, number, string][]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx - 2, -8); ctx.lineTo(cx, -8 - h); ctx.lineTo(cx + 2, -8); ctx.fill(); }
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 3)})`; star4(ctx, 0, -18, 2.5, t); ctx.fill();
      break;
    }
    case 'waylamp': {
      ctx.fillStyle = '#e8c9a0'; ell(ctx, 0, -1, 7, 2.4); ctx.fill();
      ctx.strokeStyle = '#c9a0b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, -18); ctx.stroke();
      const fl = 1 + 0.08 * Math.sin(t * 6);
      shine(ctx, 0, -27, 30 * fl, [255, 205, 130], 0.85);
      ctx.fillStyle = '#ffe9b0'; ctx.strokeStyle = '#fff6dc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-6.5, -36, 13, 18, 4.5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ell(ctx, 0, -27, 2, 3.5); ctx.fill();
      break;
    }
    case 'ribbonpole': {
      ctx.strokeStyle = '#b89a78'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -38); ctx.stroke();
      ctx.fillStyle = '#ffe08a'; ell(ctx, 0, -39, 2.4, 2.4); ctx.fill();
      ['#ff8fa3', '#ffd35a', '#8fd8ff', '#b6f08a', '#c08cff'].forEach((c, i) => {
        const y0 = -36 + i * 5, len = 17 - i * 1.5; ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, y0);
        for (let q = 0.2; q <= 1.001; q += 0.2) ctx.lineTo(q * len, y0 + q * 4 + Math.sin(t * 3 + i * 1.3 + q * 5) * 2.4 * q);
        ctx.stroke();
      });
      break;
    }
    case 'snailhouse': {
      const cr = Math.sin(t * 1.2) * 0.8;
      ctx.fillStyle = '#f3dfc2'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-16, -6, -8, -6); ctx.lineTo(10, -6); ctx.quadraticCurveTo(17, -7, 16 + cr, -14); ctx.quadraticCurveTo(21, -6, 15, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f3dfc2'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(15 + cr, -13); ctx.lineTo(13 + cr, -20); ctx.moveTo(17 + cr, -13); ctx.lineTo(19 + cr, -19); ctx.stroke();
      ctx.fillStyle = '#3a3040'; ell(ctx, 13 + cr, -20.5, 1.1, 1.1); ctx.fill(); ell(ctx, 19 + cr, -19.5, 1.1, 1.1); ctx.fill();
      const sg = ctx.createRadialGradient(-5, -19, 2, -2, -15, 13); sg.addColorStop(0, '#ffc9a8'); sg.addColorStop(1, '#c9708a');
      ctx.fillStyle = sg; ell(ctx, -2, -15, 12, 11.5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let a = 0; a < 2 * TAU; a += 0.35) ctx.lineTo(-2 + Math.cos(a) * a * 0.85, -15 + Math.sin(a) * a * 0.85); ctx.stroke();
      shine(ctx, -2, -13, 11, [255, 220, 130], 0.7 + 0.2 * Math.sin(t * 4));
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(-4.5, -16, 5, 5); ctx.strokeStyle = '#8a4a5a'; ctx.lineWidth = 0.8; ctx.strokeRect(-4.5, -16, 5, 5);
      ctx.fillStyle = '#8a4a5a'; ctx.fillRect(2, -30, 3, 6);
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ((t * 0.5) % 1))})`; ell(ctx, 3.5, -33 - ((t * 0.5) % 1) * 7, 2 + ((t * 0.5) % 1) * 2, 1.6); ctx.fill();
      break;
    }
    case 'acornlamp': {
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-3, -20, 0, -36, 10, -36); ctx.stroke();
      ctx.save(); ctx.translate(10, -36); ctx.rotate(Math.sin(t * 1.3) * 0.14);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5); ctx.stroke();
      shine(ctx, 0, 14, 24, [255, 190, 100], 0.8);
      const ag = ctx.createLinearGradient(0, 8, 0, 22); ag.addColorStop(0, '#fff0b8'); ag.addColorStop(1, '#ffa24a');
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(-6.5, 9); ctx.bezierCurveTo(-7, 18, -2, 22, 0, 24); ctx.bezierCurveTo(2, 22, 7, 18, 6.5, 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, 9, 8, 5, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-1, 3, 2, 2.5);
      ctx.restore();
      break;
    }
    case 'moondial': {
      stone(ctx, 0, -3, 11, 4.5, [150, 148, 175]); stone(ctx, 0, -9, 6, 4, [170, 168, 195]);
      shine(ctx, 0, -25 + bob, 30, [255, 240, 190], 0.65);
      ctx.fillStyle = '#fff2c4'; ctx.beginPath(); ctx.arc(0, -25 + bob, 11, Math.PI * 0.35, Math.PI * 1.65); ctx.quadraticCurveTo(2, -25 + bob, 5, -15.2 + bob); ctx.fill();
      ctx.fillStyle = '#fff'; star4(ctx, 6, -27 + bob + Math.sin(t * 2) * 1.5, 2.8, t * 0.8, 0.35); ctx.fill();
      break;
    }
    case 'comet': {
      const cy = -16 + bob, br = 1 + 0.06 * Math.sin(t * 2);
      ctx.fillStyle = 'rgba(10,20,40,.2)'; ell(ctx, 0, 0, 10, 2.5); ctx.fill();
      ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = 0.4 + i * 0.4, rr = 11 - i * 0.2; ctx.strokeStyle = `rgba(170,225,255,${0.6 - i * 0.045})`; ctx.lineWidth = 5.5 - i * 0.4; ctx.beginPath(); ctx.arc(0, cy, rr, a, a + 0.42); ctx.stroke(); }
      shine(ctx, 10, cy + 4, 20 * br, [190, 235, 255], 0.9);
      ctx.fillStyle = '#f4fbff'; ell(ctx, 10, cy + 4, 4.6 * br, 4.6 * br); ctx.fill();
      ctx.strokeStyle = '#6a88a8'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(9.5, cy + 4, 2, 0.3, Math.PI - 0.3); ctx.stroke(); // a sleeping eye
      for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.sin(t * 2.5 + i * 2)})`; star4(ctx, -9 + i * 6, cy - 13 + (i % 2) * 5, 1.8, t + i); ctx.fill(); }
      break;
    }
    case 'bubblefish': {
      const cy = -19 + bob;
      ctx.fillStyle = 'rgba(10,20,40,.2)'; ell(ctx, 0, 0, 9, 2.4); ctx.fill();
      shine(ctx, 0, cy, 26, [150, 225, 255], 0.5);
      ctx.fillStyle = 'rgba(150,215,255,.25)'; ctx.strokeStyle = 'rgba(230,248,255,.9)'; ctx.lineWidth = 1.2; ell(ctx, 0, cy, 13, 13); ctx.fill(); ctx.stroke();
      const fx = Math.sin(t * 1.1) * 5, dir = Math.cos(t * 1.1) >= 0 ? 1 : -1, fy = cy + 2 + Math.sin(t * 2.3) * 1.5;
      ctx.save(); ctx.translate(fx, fy); ctx.scale(dir, 1);
      ctx.fillStyle = '#ff9a5a'; ell(ctx, 0, 0, 5, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8.5, -3 + Math.sin(t * 8) * 1.2); ctx.lineTo(-8.5, 3 + Math.sin(t * 8) * 1.2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-0.5, -3, 1.6, 6); ctx.fillStyle = '#2a2a3a'; ell(ctx, 3, -0.8, 0.8, 0.8); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, -5.5, cy - 6, 2, 4, 0.5); ctx.fill();
      break;
    }
    case 'lotuslamp': {
      ctx.fillStyle = '#4fae8a'; ell(ctx, 0, -2, 16, 5); ctx.fill();
      ctx.fillStyle = '#3d9478'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(14, -6); ctx.lineTo(16, -2); ctx.fill();
      const fl = 1 + 0.1 * Math.sin(t * 7);
      shine(ctx, 0, -14, 26 * fl, [255, 200, 150], 0.75);
      for (const a of [-1.0, 1.0, -0.5, 0.5, 0]) {
        ctx.save(); ctx.translate(0, -4); ctx.rotate(a);
        const pg = ctx.createLinearGradient(0, 0, 0, -13); pg.addColorStop(0, '#ffe3ee'); pg.addColorStop(1, '#ff9fc0');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(0, 1); ctx.bezierCurveTo(-4.5, -4, -3.5, -10, 0, -13); ctx.bezierCurveTo(3.5, -10, 4.5, -4, 0, 1); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#ffb45a'; ctx.beginPath(); ctx.moveTo(0, -24 * (0.95 + 0.05 * fl)); ctx.quadraticCurveTo(3.4, -17, 0, -13); ctx.quadraticCurveTo(-3.4, -17, 0, -24); ctx.fill();
      ctx.fillStyle = '#fff3c4'; ell(ctx, 0, -16, 1.2, 2); ctx.fill();
      break;
    }
    default: {
      shine(ctx, 0, -12, 20, [255, 255, 220], 0.7); ctx.fillStyle = '#fff'; star4(ctx, 0, -12, 8, t); ctx.fill();
    }
  }
  ctx.restore();
}
export { lerp };

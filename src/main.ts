import './style.css';
import { Garden, Hooks } from './garden/garden';
import { Sound } from './audio';
import { load } from './store';
import { detectComposer } from './ai';
import { BASE_EMOTIONS, EMO } from './world/scene';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const caption = $('#caption'), capTitle = $('#caption h1'), capLine = $('#caption p');
const whisper = $<HTMLFormElement>('#whisper'), input = $<HTMLTextAreaElement>('#whisper textarea');
// with a phone keyboard open, keep the stone inside what can still be seen
const fitViewport = () => { const v = window.visualViewport, st = $('#stone'); if (!v || !st) return; st.style.height = v.height + 'px'; st.style.top = v.offsetTop + 'px'; };
window.visualViewport?.addEventListener('resize', fitViewport); window.visualViewport?.addEventListener('scroll', fitViewport);
{ let d = ''; for (let a = 0.6; a < 3.1 * Math.PI * 2; a += 0.2) d += (d ? 'L' : 'M') + (Math.cos(a + 1) * a * 2.3).toFixed(1) + ' ' + (Math.sin(a + 1) * a * 2.3).toFixed(1); $('#stone .spiral path')?.setAttribute('d', d); }
const fit = () => { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px'; };
input.addEventListener('input', fit);
let capTimer = 0, swapTimer = 0;

/** one dandelion seed: a feathery crown on a thin stalk */
const SEED_SVG = (() => {
  let rays = ''; for (let k = 0; k < 13; k++) { const a = Math.PI * (1.08 + k * 0.84 / 12), x = (Math.cos(a) * 11).toFixed(1), y = (Math.sin(a) * 11).toFixed(1); rays += `<line x1="0" y1="0" x2="${x}" y2="${y}"/><circle cx="${x}" cy="${y}" r=".9"/>`; }
  return `<svg viewBox="-13 -13 26 36" width="26" height="36" aria-hidden="true"><g stroke="#fff" stroke-width=".7" fill="#fff" opacity=".9">${rays}</g><line x1="0" y1="0" x2="0" y2="18" stroke="#fff" stroke-width="1"/><ellipse cx="0" cy="20" rx="1.5" ry="2.4" fill="#d9cfae"/></svg>`;
})();

const hooks: Hooks = {
  /** floating words in the sky; they fade on their own */
  caption(title, line = '', opts = {}) {
    clearTimeout(capTimer); clearTimeout(swapTimer);
    const show = () => {
      capTitle.textContent = title; capLine.textContent = line;
      capTitle.style.display = title ? '' : 'none';
      caption.classList.toggle('is-fresh', !!opts.fresh);
      if (title || line) caption.classList.add('show');
      const hold = opts.hold ?? 6;
      if (hold < 1e6) capTimer = window.setTimeout(() => caption.classList.remove('show'), hold * 1000);
    };
    if (caption.classList.contains('show')) { caption.classList.remove('show'); swapTimer = window.setTimeout(show, 450); } else show();
  },
  /** the resting stone rises and becomes the place to write; it settles back down before this resolves */
  holdStone(o) {
    return new Promise(resolve => {
      const box = $('#stone'), rock = $('#stone .rock'), ta = $<HTMLTextAreaElement>('#stone textarea'), down = $<HTMLButtonElement>('#stone .down');
      const starters = $('#stone .starters'), small = $('#stone small');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      ta.value = ''; ta.maxLength = o.max; ta.placeholder = o.placeholder; down.textContent = o.action; down.disabled = true;
      const q = $('#stone .q'); q.textContent = o.question ?? ''; q.hidden = !o.question;
      rock.classList.toggle('bloom', o.look === 'bloom'); box.setAttribute('aria-label', o.question ?? o.placeholder);
      const skip = $<HTMLButtonElement>('#stone .skip'); skip.hidden = !o.skip; skip.textContent = o.skip ?? ''; skip.onclick = () => void finish(null);
      box.classList.remove('closing', 'typing'); rock.classList.remove('heavy');
      const stamp = Symbol(); (small as any).stamp = stamp;
      if (typeof o.note === 'string') small.textContent = o.note;
      else { small.textContent = ''; void o.note.then(t => { if ((small as any).stamp === stamp) small.textContent = t; }); }
      starters.replaceChildren(); starters.hidden = false;
      for (const [label, start] of o.starters) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.onclick = () => {
          if (start === null) { void finish(label); return; } // the chip is the answer
          ta.value = start; refresh(); ta.focus(); ta.setSelectionRange(start.length, start.length);
        };
        starters.append(b);
      }
      const refresh = () => {
        const n = ta.value.length;
        ta.style.fontSize = (n < 60 ? 21 : n < 140 ? 18.5 : n < 240 ? 16.5 : 15) + 'px';
        ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px';
        down.disabled = !ta.value.trim();
      };
      ta.oninput = refresh;
      ta.onfocus = () => { starters.hidden = true; box.classList.add('typing'); };
      const opened = performance.now(), settled = () => performance.now() - opened > 450; // the tap that opened it must not also land here
      rock.onclick = () => { if (settled()) ta.focus(); };
      box.hidden = false; refresh(); fitViewport();
      box.classList.add('arming'); setTimeout(() => box.classList.remove('arming'), 450);
      // rise out of the garden: start where the stone lies, end in the hand
      const fly = (back: boolean) => {
        const a = o.at(), r = rock.getBoundingClientRect(), dx = a.x - (r.left + r.width / 2), dy = a.y - (r.top + r.height / 2), k = Math.max(0.12, a.w / r.width);
        const low = { transform: `translate(${dx}px, ${dy}px) scale(${k}, ${k * 0.55})`, opacity: 0.5 }, high = { transform: rock.classList.contains('heavy') ? 'translateY(14px) scale(1.02, .95)' : 'none', opacity: 1 };
        return rock.animate(back ? [high, low] : [low, high], { duration: reduce ? 1 : back ? 650 : 560, easing: back ? 'cubic-bezier(.5, 0, .75, .4)' : 'cubic-bezier(.2, .8, .3, 1.1)', fill: back ? 'forwards' : 'none' });
      };
      fly(false);
      let over = false;
      const finish = async (v: string | null) => {
        if (over) return; over = true;
        ta.blur(); box.classList.add('closing');
        if (v && o.onHeavy) { rock.classList.add('heavy'); o.onHeavy(); await new Promise(r => setTimeout(r, reduce ? 50 : 750)); }
        await fly(true).finished.catch(() => {});
        box.hidden = true; rock.getAnimations().forEach(an => an.cancel()); rock.classList.remove('heavy');
        resolve(v);
      };
      down.onclick = () => { if (ta.value.trim()) void finish(ta.value.trim()); };
      $('#stone .x').onclick = () => void finish(null);
      $('#stone .dim').onclick = () => { if (settled()) void finish(null); };
      ta.onkeydown = e => { if (e.key === 'Escape') void finish(null); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); down.click(); } };
      box.onkeydown = e => { if (e.key === 'Escape') void finish(null); };
      setTimeout(() => (starters.querySelector('button') as HTMLElement | null)?.focus({ preventScroll: true }), reduce ? 0 : 600);
    });
  },
  /** a plain yes-or-no before something that cannot be undone; the safe answer is the default */
  confirm(o) {
    return new Promise(resolve => {
      const box = $('#confirm'), yes = $<HTMLButtonElement>('#confirm .yes'), no = $<HTMLButtonElement>('#confirm .no');
      $('#confirm h2').textContent = o.title; $('#confirm p').textContent = o.line; yes.textContent = o.yes; no.textContent = o.no;
      const done = (v: boolean) => { box.hidden = true; box.onkeydown = null; resolve(v); };
      yes.onclick = () => done(true); no.onclick = () => done(false);
      const opened = performance.now(); // the tap that opened it must not also close it
      box.onclick = e => { if (e.target === box && performance.now() - opened > 450) done(false); };
      box.onkeydown = e => { if (e.key === 'Escape') done(false); };
      box.hidden = false; setTimeout(() => no.focus(), 30);
    });
  },
  /** the screen goes quietly dark, then the page starts fresh */
  restart() {
    // the dandelion lets go: seeds drift across the whole garden, the light comes up, and the page starts fresh
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, n = reduce ? 0 : 46;
    const layer = document.createElement('div'); layer.id = 'drift'; document.body.append(layer);
    for (let i = 0; i < n; i++) {
      const sd = document.createElement('div'); sd.className = 'seed'; sd.innerHTML = SEED_SVG;
      const x0 = 55 + Math.random() * 45, y0 = 8 + Math.random() * 10, dx = -(40 + Math.random() * 90), dy = 20 + Math.random() * 85, sc = 0.6 + Math.random() * 0.9, rot = (Math.random() - 0.5) * 90;
      sd.style.left = x0 + 'vw'; sd.style.top = y0 + 'vh';
      layer.append(sd);
      sd.animate([{ transform: `translate(0,0) scale(${sc}) rotate(0deg)`, opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0.9, offset: 0.75 }, { transform: `translate(${dx}vw, ${dy}vh) scale(${sc}) rotate(${rot}deg)`, opacity: 0 }],
        { duration: 2600 + Math.random() * 1800, delay: Math.random() * 1400, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'both' });
    }
    try { sessionStorage.setItem('expanse.begun', '1'); } catch { /* */ }
    setTimeout(() => { $('#fadeout').hidden = false; }, reduce ? 0 : 2200);
    setTimeout(() => location.reload(), reduce ? 700 : 3600);
  },
  /** one bare line to write on; resolves null if the person changes their mind */
  ask(o) {
    return new Promise(resolve => {
      input.value = ''; input.placeholder = o.placeholder; input.maxLength = o.max;
      const q = $('#whisper .q'), chips = $('#whisper .chips');
      q.textContent = o.question ?? ''; q.hidden = !o.question;
      chips.replaceChildren(); chips.hidden = !o.chips?.length;
      for (const c of o.chips ?? []) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = c;
        b.onclick = () => { if (/something else/i.test(c)) { input.placeholder = 'tell it in your own words…'; input.focus(); } else done(c); };
        chips.append(b);
      }
      $('#whisper .go').textContent = o.action;
      const small = $('#whisper small'), stamp = Symbol(); (small as any).stamp = stamp;
      if (typeof o.note === 'string') small.textContent = o.note;
      else { small.textContent = ''; void o.note.then(t => { if ((small as any).stamp === stamp) small.textContent = t; }); }
      whisper.hidden = false; fit(); setTimeout(() => input.focus(), 30);
      const done = (v: string | null) => { whisper.hidden = true; whisper.onsubmit = null; resolve(v); };
      whisper.onsubmit = e => { e.preventDefault(); done(input.value); };
      $<HTMLButtonElement>('#whisper .no').onclick = () => done(null);
      input.onkeydown = e => { if (e.key === 'Escape') done(null); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(input.value); } };
    });
  },
};

const save = load();
const sound = new Sound();
const garden = new Garden($<HTMLCanvasElement>('#garden'), save, sound, hooks);
// Phones only let audio start inside particular gestures, and which ones differs by phone
// (touchend or click on iPhone, pointerup on Android). Offer every one of them.
for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) {
  document.addEventListener(ev, () => { if (!save.soundOff && !sound.audible) sound.start(); }, { capture: true, passive: true });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && sound.on && !save.soundOff) sound.wake(); });
(window as any).__garden = garden;
// after beginning again, the new garden rises out of the light with one line of its own
let begun = false; try { begun = sessionStorage.getItem('expanse.begun') === '1'; sessionStorage.removeItem('expanse.begun'); } catch { /* */ }
if (begun) {
  const dawn = $('#dawn'); dawn.hidden = false; setTimeout(() => (dawn.hidden = true), 2600);
  setTimeout(() => hooks.caption('Fresh ground', 'Everything has drifted off. What is happening in your world today?', { hold: 9 }), 900);
  setTimeout(() => garden.idleCaption(), 10500);
} else setTimeout(() => garden.idleCaption(), 700);
void detectComposer();

// the same actions for keyboards and screen readers
const nav = $('#a11y');
const add = (label: string, fn: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; nav.append(b); };
for (const e of [...BASE_EMOTIONS, 'hope' as const]) add(`Plant or lift the ${EMO[e].name} seed`, () => { if (e !== 'hope' || save.hopeUnlocked) garden.toggleSeed(e); });
add('Look up at the skies you have found', () => garden.openSky());
add('Whisper a wish', () => void garden.askWish());
add('Tell the wish tree what you did', () => void garden.askStep());
add('Let a wish go', () => garden.releaseWish());
add('Set down a worry', () => void garden.askWorry());
add('Let the worry go', () => garden.releaseWorry());
add('Toggle sound', () => garden.toggleSound());
add('Begin the garden again', () => void garden.beginAgain());

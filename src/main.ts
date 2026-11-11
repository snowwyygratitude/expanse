import './style.css';
import { Garden, Hooks } from './garden/garden';
import { Sound } from './audio';
import { load } from './store';
import { detectComposer } from './ai';
import { BASE_EMOTIONS, EMO } from './world/scene';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const caption = $('#caption'), capTitle = $('#caption h1'), capLine = $('#caption p');
const whisper = $<HTMLFormElement>('#whisper'), input = $<HTMLTextAreaElement>('#whisper textarea');
const fit = () => { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px'; };
input.addEventListener('input', fit);
let capTimer = 0, swapTimer = 0;

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
setTimeout(() => garden.idleCaption(), 700);
void detectComposer();

// the same actions for keyboards and screen readers
const nav = $('#a11y');
const add = (label: string, fn: () => void) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; nav.append(b); };
for (const e of [...BASE_EMOTIONS, 'hope' as const]) add(`Plant or lift the ${EMO[e].name} seed`, () => { if (e !== 'hope' || save.hopeUnlocked) garden.toggleSeed(e); });
add('Look up at the skies you have found', () => garden.openSky());
add('Set down a worry', () => void garden.askWorry());
add('Keep this world in a dewdrop', () => garden.bottleWorld());
add('Toggle sound', () => garden.toggleSound());

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
      $('#whisper .go').textContent = o.action; $('#whisper small').textContent = o.note;
      whisper.hidden = false; fit(); setTimeout(() => input.focus(), 30);
      speakBtn.hidden = !(o.voice && voiceAvailable());
      const done = (v: string | null) => { stopVoice(); whisper.hidden = true; whisper.onsubmit = null; resolve(v); };
      whisper.onsubmit = e => { e.preventDefault(); done(input.value); };
      $<HTMLButtonElement>('#whisper .no').onclick = () => done(null);
      input.onkeydown = e => { if (e.key === 'Escape') done(null); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(input.value); } };
    });
  },
};

/* ---- speaking instead of typing ----
   Two engines: the hosting page's dictation when this runs as a Claude artifact,
   otherwise the browser's own speech recognition. Neither is required; typing always works. */
const speakBtn = $<HTMLButtonElement>('#whisper .speak');
const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let dictation: any = null, rec: any = null, listening = false, spokenBase = '';
const setListening = (on: boolean) => { listening = on; speakBtn.textContent = on ? 'listening… touch to stop' : 'speak instead'; speakBtn.classList.toggle('live', on); };
// inside a hosted page the browser's own recogniser is refused the microphone, so only the page's dictation counts there
const voiceAvailable = () => !!dictation || (!!SR && !(window as any).claude);
const join = (a: string, b: string) => (a && b ? a.replace(/\s+$/, '') + ' ' + b : a + b).slice(0, input.maxLength > 0 ? input.maxLength : 400);
function stopVoice() { if (!listening) return; try { dictation ? void dictation.stop() : rec?.stop(); } catch { /* */ } setListening(false); }
speakBtn.onclick = () => {
  if (listening) { stopVoice(); return; }
  spokenBase = input.value;
  if (dictation) { setListening(true); dictation.start().catch(() => setListening(false)); return; } // must be the first thing this click does
  try {
    rec = new SR(); rec.interimResults = true; rec.continuous = true; rec.lang = navigator.language || 'en-US';
    rec.onresult = (e: any) => { let said = ''; for (let i = 0; i < e.results.length; i++) said += e.results[i][0].transcript; input.value = join(spokenBase, said.trim()); fit(); };
    rec.onend = () => setListening(false); rec.onerror = () => setListening(false);
    rec.start(); setListening(true);
  } catch { setListening(false); }
};
void (async () => {
  try {
    const d = await (window as any).claude?.use?.('dictation'); if (!d) return;
    dictation = d;
    d.onPartial(({ text }: { text: string }) => { input.value = join(spokenBase, text); fit(); });
    d.onFinal(({ text }: { text: string }) => { spokenBase = join(spokenBase, text); input.value = spokenBase; fit(); });
    d.onState(({ state }: { state: string }) => setListening(state === 'listening'));
  } catch { /* typing still works */ }
})();

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
